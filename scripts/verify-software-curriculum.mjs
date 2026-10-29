import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { createHash, randomBytes, randomUUID } from "node:crypto";
const require = createRequire(
    new URL("../backend/package.json", import.meta.url),
  ),
  { Client } = require("pg"),
  bcrypt = require("bcryptjs");
const env = Object.fromEntries(
  readFileSync(".env", "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1).replace(/^['"]|['"]$/g, "")];
    }),
);
const db = new Client({
  host: "127.0.0.1",
  database: env.POSTGRES_DB,
  user: env.POSTGRES_USER,
  password: env.POSTGRES_PASSWORD,
});
const base = process.env.VEDU_BASE_URL || "http://127.0.0.1:8080",
  checks = [],
  users = [],
  sessions = [];
const check = (name, value) => {
  assert.ok(value, name);
  checks.push(name);
  console.log("PASS", name);
};
async function req(path, auth, data) {
  const r = await fetch(base + "/api" + path, {
    method: data === undefined ? "GET" : "POST",
    headers: {
      "Content-Type": "application/json",
      ...(auth ? { Authorization: `Bearer ${auth.accessToken}` } : {}),
    },
    ...(data === undefined ? {} : { body: JSON.stringify(data) }),
  });
  return { status: r.status, body: await r.json().catch(() => null) };
}
async function ok(path, auth, data) {
  const r = await req(path, auth, data);
  assert.ok(
    r.status >= 200 && r.status < 300,
    `${path} ${r.status} ${JSON.stringify(r.body)}`,
  );
  return r.body;
}
async function account(role) {
  const username = `software_${role.toLowerCase()}_${Date.now()}`,
    password = randomBytes(15).toString("base64url") + "@9";
  const {
    rows: [u],
  } = await db.query(
    "INSERT INTO auth.users(username,email,full_name,password_hash,role,is_test_account) VALUES($1,$2,$3,$4,$5,true) RETURNING user_id",
    [
      username,
      username + "@example.test",
      "Kiểm thử khóa học phần mềm",
      await bcrypt.hash(password, 10),
      role,
    ],
  );
  users.push(u.user_id);
  const auth = await ok("/auth/login", null, {
    username,
    password,
    expectedRole: role,
  });
  sessions.push(auth);
  return auth;
}
await db.connect();
try {
  const student = await account("STUDENT"),
    teacher = await account("TEACHER");
  const imported = JSON.parse(
    readFileSync("docs/validation/software-curriculum-import.json", "utf8"),
  ).courses;
  const source = JSON.parse(
    readFileSync("data/learning/software-curriculum.json", "utf8"),
  ).courses;
  const catalog = await ok("/courses");
  check(
    "Both new courses are discoverable and free",
    imported.every((c) =>
      catalog.some(
        (x) =>
          x.id === c.courseId && x.title === c.title && Number(x.price) === 0,
      ),
    ),
  );
  for (const c of imported) {
    const s = source.find((s) => s.key === c.key),
      id = c.courseId;
    const publicCourse = await ok(`/courses/${id}`),
      publicLessons = publicCourse.sections.flatMap((s) => s.lessons);
    check(
      `${c.key}: public curriculum reveals no lesson text or private file URL`,
      publicLessons
        .filter((l) => l.id > 0)
        .every((l) => !l.content && !l.resourceUrl),
    );
    check(
      `${c.key}: classroom requires enrollment`,
      (await req(`/platform/courses/${id}/classroom`, student)).status === 403,
    );
    check(
      `${c.key}: unrelated teacher cannot manage content`,
      (await req(`/platform/courses/${id}/content`, teacher)).status === 403,
    );
    await ok(`/enrollments/me/${id}`, student, {});
    const classroom = await ok(`/platform/courses/${id}/classroom`, student),
      lessons = classroom.sections
        .flatMap((s) => s.lessons)
        .filter((l) => l.id > 0 && l.type !== "quiz");
    check(
      `${c.key}: guide, all lessons, exercises and prerequisite metadata present`,
      lessons.length === s.lessons.length + 1 &&
        lessons
          .slice(1)
          .every(
            (l) =>
              l.content.includes("BÀI TẬP NHỎ") &&
              l.pedagogy?.prerequisites?.length,
          ),
    );
    const pdfs = lessons
      .flatMap((l) => l.resources)
      .filter((r) => r.type === "PDF");
    check(
      `${c.key}: original syllabus, slides and practice PDFs attached`,
      pdfs.length >= s.lessons.length + 3 &&
        pdfs.every(
          (r) =>
            r.url.startsWith("/api/platform/media/") &&
            r.url.includes("?ticket="),
        ),
    );
    const unique = new Map(
      pdfs.map((r) => [Number(r.url.match(/media\/(\d+)/)[1]), r]),
    );
    for (const [rid, r] of unique) {
      const response = await fetch(base + r.url);
      assert.equal(response.status, 200, r.title);
      assert.ok(
        response.headers.get("content-type").includes("application/pdf"),
      );
      const bytes = Buffer.from(await response.arrayBuffer());
      assert.equal(bytes.subarray(0, 5).toString(), "%PDF-");
      assert.ok(
        s.files.some(
          (f) => f.sha256 === createHash("sha256").update(bytes).digest("hex"),
        ),
        r.title + " original hash",
      );
      const noAuth = await fetch(base + `/api/platform/media/${rid}`);
      assert.equal(noAuth.status, 401);
      const denied = await fetch(base + `/api/platform/media/${rid}`, {
        headers: { Authorization: `Bearer ${teacher.accessToken}` },
      });
      assert.equal(denied.status, 403);
    }
    check(
      `${c.key}: every original PDF opens intact; anonymous and unrelated teacher denied`,
      unique.size >= 3,
    );
    const early = await req(`/quizzes/${c.quizId}/attempts`, student, {});
    check(
      `${c.key}: final exam locked before lesson completion`,
      early.status === 400 && JSON.stringify(early.body).includes("bài học"),
    );
    check(
      `${c.key}: certificate locked before completion`,
      (await req(`/platform/courses/${id}/certificate`, student, {})).status ===
        400,
    );
    const play = await ok(`/quizzes/${c.quizId}/play`, student);
    check(
      `${c.key}: quiz has required questions and no answer correctness flags`,
      play.questions.length === c.questions &&
        !JSON.stringify(play).match(/isCorrect|is_correct/),
    );
    for (const l of lessons)
      await ok("/learning/events", student, {
        eventUuid: randomUUID(),
        learningSessionId: randomUUID(),
        courseId: id,
        lessonId: l.id,
        action: "COMPLETE_LESSON",
        durationSeconds: 0,
      });
    const attempt = await ok(`/quizzes/${c.quizId}/attempts`, student, {});
    const { rows: answers } = await db.query(
      'SELECT q.question_id AS "questionId",a.answer_id AS "answerId" FROM assessment.questions q JOIN assessment.answers a USING(question_id) WHERE q.quiz_id=$1 AND a.is_correct',
      [c.quizId],
    );
    const result = await ok(
      `/quizzes/attempts/${attempt.attemptId}/submit`,
      student,
      { answers },
    );
    check(
      `${c.key}: final quiz submits and grades correctly`,
      result.passed && Number(result.score) === 10,
    );
    const certificate = await ok(
      `/platform/courses/${id}/certificate`,
      student,
      {},
    );
    const verification = await ok(
      `/platform/certificates/${certificate.certificate_code}/verify`,
    );
    check(
      `${c.key}: completed course issues a verifiable certificate`,
      !!certificate.certificate_code &&
        JSON.stringify(verification).includes(c.title),
    );
    const certResponse = await fetch(
      base + `/api/platform/certificates/${certificate.certificate_code}/pdf`,
      { headers: { Authorization: `Bearer ${student.accessToken}` } },
    );
    check(
      `${c.key}: certificate PDF downloads`,
      certResponse.status === 200 &&
        Buffer.from(await certResponse.arrayBuffer())
          .subarray(0, 5)
          .toString() === "%PDF-",
    );
  }
  const finalCatalog = await ok("/courses");
  let accurateCounts = true;
  for (const c of imported) {
    const {
      rows: [count],
    } = await db.query(
      "SELECT count(*)::int n FROM enrollment.enrollments e JOIN auth.users u ON u.user_id=e.student_id WHERE course_id=$1 AND e.status IN ('ACTIVE','COMPLETED') AND NOT u.is_test_account",
      [c.courseId],
    );
    accurateCounts &&=
      finalCatalog.find((x) => x.id === c.courseId).students === count.n;
    accurateCounts &&=
      (await ok(`/courses/${c.courseId}`)).students === count.n;
  }
  check(
    "Test learners are excluded from public catalog and course participant counts",
    accurateCounts,
  );
  const { rows: duplicates } = await db.query(
    "SELECT content_key FROM lms.lesson_pedagogy WHERE content_key LIKE 'software-v1.%' GROUP BY content_key HAVING count(*)>1",
  );
  check(
    "Repeat import keeps stable lesson identifiers without duplicates",
    duplicates.length === 0,
  );
  const files = readdirSync("frontend/public", { recursive: true });
  check(
    "No supplied instructor answer files are published as static assets",
    !files.some((f) =>
      /lessons_teacher|teacher_only|exam_teacher|Dap_an_va_thang_diem|Dap_an_va_rubric/.test(
        f,
      ),
    ),
  );
  writeFileSync(
    "docs/validation/software-course-checks.json",
    JSON.stringify(
      {
        checkedAt: new Date().toISOString(),
        checks,
        courses: imported.map((c) => ({ id: c.courseId, key: c.key })),
        notes:
          "Isolated is_test_account learners used for completion/quiz/certificate; existing learner progress unchanged. Correct answers read only by this test from PostgreSQL, never exposed by student API.",
      },
      null,
      2,
    ),
  );
} finally {
  for (const auth of sessions)
    await req("/auth/revoke", null, { refreshToken: auth.refreshToken }).catch(
      () => {},
    );
  if (users.length)
    await db.query(
      "UPDATE auth.users SET is_active=false WHERE user_id=ANY($1::bigint[])",
      [users],
    );
  await db.end();
}
