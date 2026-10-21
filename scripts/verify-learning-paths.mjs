import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
const base = process.env.VEDU_BASE_URL || "http://localhost:5173",
  stamp = Date.now(),
  sessions = [],
  checks = [];
const imported = JSON.parse(
  readFileSync(
    new URL("../docs/validation/office-content-import.json", import.meta.url),
  ),
);
const cfg = Object.fromEntries(
  readFileSync(new URL("../.env", import.meta.url), "utf8")
    .split(/\r?\n/)
    .filter((s) => s && !s.startsWith("#"))
    .map((s) => {
      const i = s.indexOf("=");
      return [s.slice(0, i), s.slice(i + 1)];
    }),
);
async function call(path, auth, body, method) {
  const r = await fetch(base + "/api" + path, {
    method: method || (body ? "POST" : "GET"),
    headers: {
      "Content-Type": "application/json",
      ...(auth ? { Authorization: `Bearer ${auth.accessToken}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { status: r.status, data: await r.json().catch(() => null) };
}
async function ok(...args) {
  const r = await call(...args);
  assert.ok(
    r.status >= 200 && r.status < 300,
    JSON.stringify({ path: args[0], ...r }),
  );
  return r.data;
}
function check(name, test) {
  assert.ok(test, name);
  checks.push(name);
  console.log("PASS", name);
}
async function login(username, password, expectedRole) {
  const a = await ok("/auth/login", null, { username, password, expectedRole });
  sessions.push(a);
  return a;
}
async function student(prefix) {
  const username = `path_${prefix}_${stamp}`;
  const r = await ok("/auth/register", null, {
    username,
    password: "Verify@123",
    confirmPassword: "Verify@123",
    fullName: "Kiểm tra lộ trình",
    email: username + "@example.test",
    phone: "0901234567",
  });
  execFileSync(
    "docker",
    [
      "compose",
      "exec",
      "-T",
      "db",
      "psql",
      "-U",
      cfg.POSTGRES_USER,
      "-d",
      cfg.POSTGRES_DB,
      "-c",
      `UPDATE auth.users SET is_test_account=true WHERE user_id=${Number(r.user.userId)}`,
    ],
    { encoding: "utf8" },
  );
  return login(username, "Verify@123", "STUDENT");
}
const preferences = {
  goal: "CAREER",
  level: "BEGINNER",
  occupation: "OFFICE",
  format: "MIXED",
  weeklySeconds: 3600,
  horizonWeeks: 4,
  count: 4,
};
try {
  const studentA = await student("a"),
    studentB = await student("b");
  const teacher = await login(
    process.env.VEDU_TEACHER_USERNAME || "teacher",
    process.env.VEDU_TEACHER_PASSWORD || "Demo@123",
    "TEACHER",
  );
  const course = imported.courses[0],
    id = course.courseId;
  check(
    "anonymous path generation blocked",
    (await call(`/platform/courses/${id}/path-options`, null, preferences))
      .status === 401,
  );
  check(
    "non-enrolled member cannot generate path",
    (await call(`/platform/courses/${id}/path-options`, studentB, preferences))
      .status === 403,
  );
  for (const c of imported.courses) {
    await ok(`/enrollments/me/${c.courseId}`, studentA, {});
    const classroom = await ok(
      `/platform/courses/${c.courseId}/classroom`,
      studentA,
    );
    const lessons = classroom.sections
      .flatMap((s) => s.lessons)
      .filter((l) => l.id > 0);
    check(
      `${c.key}: seven meaningful lessons with sources/outcomes`,
      lessons.length === 7 &&
        lessons.every(
          (l) =>
            l.content.length > 200 &&
            l.pedagogy?.sources.length > 0 &&
            l.pedagogy.outcomes.length > 0,
        ),
    );
    check(
      `${c.key}: published assessment exists`,
      classroom.sections
        .flatMap((s) => s.lessons)
        .some((l) => l.type === "quiz"),
    );
    const paths = await ok(
      `/platform/courses/${c.courseId}/path-options`,
      studentA,
      preferences,
    );
    check(
      `${c.key}: four genuinely distinct paths`,
      paths.plans.length === 4 &&
        new Set(
          paths.plans.map((p) => p.steps.map((s) => s.lessonId).join(",")),
        ).size === 4,
    );
    check(
      `${c.key}: prerequisites preserved`,
      paths.plans.every((p) => {
        const done = new Set();
        for (const s of p.steps) {
          if (!s.prerequisites.every((id) => done.has(id))) return false;
          done.add(s.lessonId);
        }
        return true;
      }),
    );
  }
  const initial = await ok(
    `/platform/courses/${id}/path-options`,
    studentA,
    preferences,
  );
  check(
    "cold start clearly labeled curriculum",
    initial.evidence.source === "CURRICULUM" &&
      initial.plans.every((p) => p.steps.every((s) => s.score === null)),
  );
  check(
    "external AI disabled by default",
    initial.externalExplanationAvailable === false,
  );
  check(
    "no silent external AI request without consent",
    (
      await call(
        `/platform/path-options/${initial.path_set_id}/explain`,
        studentA,
        { consent: false },
      )
    ).status === 403,
  );
  check(
    "external AI without configuration returns 503",
    (
      await call(
        `/platform/path-options/${initial.path_set_id}/explain`,
        studentA,
        { consent: true },
      )
    ).status === 503,
  );
  check(
    "other student cannot read path set",
    (await call(`/platform/path-options/${initial.path_set_id}`, studentB))
      .status === 404,
  );
  check(
    "other student cannot select path",
    (
      await call(
        `/platform/path-options/${initial.path_set_id}/selection`,
        studentB,
        { planId: initial.plans[0].id },
        "PATCH",
      )
    ).status === 404,
  );
  check(
    "unknown path selection rejected",
    (
      await call(
        `/platform/path-options/${initial.path_set_id}/selection`,
        studentA,
        { planId: "invented" },
        "PATCH",
      )
    ).status === 400,
  );
  const selected = await ok(
    `/platform/path-options/${initial.path_set_id}/selection`,
    studentA,
    { planId: initial.plans[0].id },
    "PATCH",
  );
  check(
    "selection persists",
    selected.selected_plan_id === initial.plans[0].id &&
      (await ok(`/platform/courses/${id}/path-options`, studentA)).some(
        (s) => s.selected_plan_id === initial.plans[0].id,
      ),
  );
  await ok(`/platform/path-options/${initial.path_set_id}/feedback`, studentA, {
    planId: initial.plans[0].id,
    rating: 4,
    comment: "Phù hợp; cần xác nhận với người học thật.",
  });
  check(
    "feedback saved per owner and plan",
    (await ok(`/platform/path-options/${initial.path_set_id}`, studentA))
      .feedback[0].rating === 4,
  );
  check(
    "invalid preferences rejected",
    (
      await call(`/platform/courses/${id}/path-options`, studentA, {
        ...preferences,
        count: 5,
        weeklySeconds: 1,
      })
    ).status === 400,
  );
  const tight = await ok(`/platform/courses/${id}/path-options`, studentA, {
    ...preferences,
    weeklySeconds: 1800,
    horizonWeeks: 1,
    count: 2,
  });
  check(
    "infeasible budget is explicit without dropping prerequisites",
    tight.plans.length === 2 && tight.plans.every((p) => !p.fitsBudget),
  );
  const cert = await ok(`/platform/courses/${id}/path-options`, studentA, {
    ...preferences,
    goal: "CERTIFICATION",
  });
  check(
    "certificate goal prioritizes full course",
    cert.plans[0].id === "deep" && cert.plans[0].coversWholeCourse,
  );
  await ok("/learning/events", studentA, {
    eventUuid: crypto.randomUUID(),
    learningSessionId: crypto.randomUUID(),
    courseId: id,
    lessonId: course.lessonIds[0],
    action: "COMPLETE_LESSON",
    durationSeconds: 0,
  });
  const restored = await ok(
    `/platform/path-options/${initial.path_set_id}`,
    studentA,
  );
  check(
    "saved path reflects durable current progress",
    restored.plans.every(
      (p) => p.steps.find((s) => s.lessonId === course.lessonIds[0])?.completed,
    ),
  );
  const regenerated = await ok(
    `/platform/courses/${id}/path-options`,
    studentA,
    preferences,
  );
  check(
    "regeneration skips already completed lessons",
    regenerated.plans.every((p) =>
      p.steps.every((s) => s.lessonId !== course.lessonIds[0]),
    ),
  );
  const meta = (
    await ok(`/platform/courses/${id}/content`, teacher)
  ).pedagogy.find((m) => Number(m.lesson_id) === course.lessonIds[0]);
  const body = {
    difficulty: meta.difficulty,
    kind: meta.kind,
    isCore: meta.is_core,
    skills: meta.skills,
    goals: meta.goals,
    outcomes: meta.outcomes,
    sources: meta.sources,
    prerequisites: [course.lessonIds[1]],
  };
  check(
    "teacher cannot introduce prerequisite cycle",
    (
      await call(
        `/platform/lessons/${course.lessonIds[0]}/pedagogy`,
        teacher,
        body,
        "PATCH",
      )
    ).status === 400,
  );
  check(
    "teacher cannot use prerequisite from another course",
    (
      await call(
        `/platform/lessons/${course.lessonIds[0]}/pedagogy`,
        teacher,
        { ...body, prerequisites: [imported.courses[1].lessonIds[0]] },
        "PATCH",
      )
    ).status === 400,
  );
  check(
    "student cannot edit teaching metadata",
    (
      await call(
        `/platform/lessons/${course.lessonIds[0]}/pedagogy`,
        studentA,
        body,
        "PATCH",
      )
    ).status === 403,
  );
  const guest = await ok("/auth/guest", null, {});
  sessions.push(guest);
  check(
    "guest blocked from path planner",
    (await call(`/platform/courses/${id}/path-options`, guest, preferences))
      .status === 403,
  );
  const admin = await login(
    process.env.VEDU_ADMIN_USERNAME || "admin",
    process.env.VEDU_ADMIN_PASSWORD || "Demo@123",
    "ADMIN",
  );
  const jobs = await ok("/platform/ml/experiments", admin);
  const job = jobs.find(
    (j) => j.status === "SUCCEEDED" && j.dataset === "kaggle_recommender",
  );
  assert.ok(job, "Need a completed Kaggle recommender experiment");
  const replay = await ok(
    `/platform/ml/jobs/${job.experiment_id}/replay`,
    admin,
    {},
  );
  check(
    "external histories replay on actual model without VEDU learner creation",
    replay.samples.length === 5 &&
      replay.storedAsLearners === false &&
      replay.samples.every(
        (s) =>
          s.history.length > 0 &&
          s.top5.every((x) => Number.isFinite(x.bpr) && Number.isFinite(x.gru)),
      ),
  );
  check(
    "student cannot replay outside learner histories",
    (await call(`/platform/ml/jobs/${job.experiment_id}/replay`, studentA, {}))
      .status === 403,
  );
  const reference = (await ok("/courses")).find(
    (c) => c.title === "Office 365 — Nội dung tham chiếu Kaggle",
  );
  assert.ok(reference, "Prepare same-content reference course first");
  await ok(`/enrollments/me/${reference.id}`, studentA, {});
  const refClass = await ok(
    `/platform/courses/${reference.id}/classroom`,
    studentA,
  );
  const refLesson = refClass.sections
    .flatMap((s) => s.lessons)
    .find((l) => l.id > 0);
  await ok("/learning/events", studentA, {
    eventUuid: crypto.randomUUID(),
    learningSessionId: crypto.randomUUID(),
    courseId: reference.id,
    lessonId: refLesson.id,
    action: "COMPLETE_LESSON",
    durationSeconds: 0,
  });
  const modelPlan = await ok(
    `/platform/courses/${reference.id}/path-options`,
    studentA,
    preferences,
  );
  check(
    "mapped history integrates actual trained model into planner",
    modelPlan.evidence.source === "MODEL_CONSTRAINED" &&
      !!modelPlan.evidence.experimentId,
  );
  check(
    "model explanation contains real BPR and GRU components",
    modelPlan.plans.some((p) =>
      p.steps.some(
        (s) =>
          Number.isFinite(s.components?.bpr) &&
          Number.isFinite(s.components?.gru),
      ),
    ),
  );
  check(
    "same-content reference offers four distinct model-constrained alternatives",
    modelPlan.plans.length === 4 &&
      new Set(
        modelPlan.plans.map((p) => p.steps.map((s) => s.lessonId).join(",")),
      ).size === 4,
  );
  writeFileSync(
    new URL("../docs/validation/learning-path-checks.json", import.meta.url),
    JSON.stringify(
      {
        date: new Date().toISOString(),
        base,
        checks,
        scope:
          "Focused regression of new content, curriculum constraints, multi-path ownership and external research replay; not a learning-outcome experiment.",
      },
      null,
      2,
    ),
  );
  console.log(`Verified ${checks.length} checks.`);
} finally {
  for (const a of sessions)
    await call("/auth/revoke", null, { refreshToken: a.refreshToken }).catch(
      () => {},
    );
}
