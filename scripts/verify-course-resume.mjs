import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
import { randomBytes, randomUUID } from "node:crypto";
const require = createRequire(
  new URL("../backend/package.json", import.meta.url),
);
const { Client } = require("pg"),
  bcrypt = require("bcryptjs");
const env = Object.fromEntries(
  readFileSync(new URL("../.env", import.meta.url), "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1)];
    }),
);
const db = new Client({
  host: "127.0.0.1",
  database: env.POSTGRES_DB,
  user: env.POSTGRES_USER,
  password: env.POSTGRES_PASSWORD,
});
const base = process.env.VEDU_BASE_URL || "http://127.0.0.1:8080",
  users = [],
  sessions = [],
  checks = [];
const check = (name, condition) => {
  assert.ok(condition, name);
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
    `${path}: ${r.status} ${JSON.stringify(r.body)}`,
  );
  return r.body;
}
async function user(role = "STUDENT") {
  const username = `resume_${role.toLowerCase()}_${Date.now()}_${users.length}`,
    password = randomBytes(15).toString("base64url") + "@9";
  const {
    rows: [u],
  } = await db.query(
    "INSERT INTO auth.users(username,email,full_name,password_hash,role,is_test_account) VALUES($1,$2,$3,$4,$5,true) RETURNING user_id",
    [
      username,
      username + "@example.test",
      "Kiểm thử tiếp tục học",
      await bcrypt.hash(password, 10),
      role,
    ],
  );
  users.push(u.user_id);
  const a = await ok("/auth/login", null, {
    username,
    password,
    expectedRole: role,
  });
  sessions.push(a);
  return a;
}
await db.connect();
try {
  const student = await user(),
    other = await user(),
    teacher = await user("TEACHER");
  const courses = await ok("/courses");
  const c = courses.find((c) => c.title === "Mạng máy tính");
  assert.ok(c);
  const publicCourse = await ok(`/courses/${c.id}`),
    lessons = publicCourse.sections
      .flatMap((s) => s.lessons)
      .filter((l) => l.id > 0 && l.type !== "quiz");
  assert.ok(lessons.length > 3);
  const path = `/platform/courses/${c.id}/study-state`;
  check("Anonymous study state denied", (await req(path)).status === 401);
  check(
    "Teacher cannot impersonate student progress",
    (await req(path, teacher)).status === 403,
  );
  const fresh = await ok(path, student);
  check(
    "New learner starts at course guide",
    fresh.state === "NEW" && fresh.lessonId === lessons[0].id,
  );
  const {
    rows: [count],
  } = await db.query(
    "SELECT count(*)::int n FROM enrollment.enrollments WHERE student_id=$1",
    [student.user.userId],
  );
  check("Reading entry state does not enroll or unlock content", count.n === 0);
  await ok(`/enrollments/me/${c.id}`, student, {});
  async function log(lesson, action = "VIEW_LESSON") {
    return ok("/learning/events", student, {
      eventUuid: randomUUID(),
      learningSessionId: randomUUID(),
      courseId: c.id,
      lessonId: lesson.id,
      action,
      durationSeconds: 0,
    });
  }
  await log(lessons[0]);
  check(
    "Opening a document resumes same unfinished lesson",
    (await ok(path, student)).state === "IN_PROGRESS" &&
      (await ok(path, student)).lessonId === lessons[0].id,
  );
  await log(lessons[0], "COMPLETE_LESSON");
  check(
    "Completing guide continues to next incomplete lesson",
    (await ok(path, student)).lessonId === lessons[1].id,
  );
  await log(lessons[2]);
  check(
    "Most recently opened unfinished document is resumed",
    (await ok(path, student)).lessonId === lessons[2].id,
  );
  check(
    "Another learner cannot see saved progress",
    (await ok(path + `?studentId=${student.user.userId}`, other)).state ===
      "NEW",
  );
  for (const lesson of lessons) await log(lesson, "COMPLETE_LESSON");
  const beforeExam = await ok(path, student);
  check(
    "Finishing lessons continues to remaining final exam",
    beforeExam.state === "IN_PROGRESS" &&
      beforeExam.quizId &&
      beforeExam.lessonId === null,
  );
  const { rows: quizzes } = await db.query(
    "SELECT quiz_id FROM assessment.quizzes WHERE course_id=$1 AND is_published AND NOT is_deleted ORDER BY quiz_id",
    [c.id],
  );
  for (const quiz of quizzes) {
    const attempt = await ok(`/quizzes/${quiz.quiz_id}/attempts`, student, {});
    const { rows: answers } = await db.query(
      'SELECT q.question_id AS "questionId",a.answer_id AS "answerId" FROM assessment.questions q JOIN assessment.answers a USING(question_id) WHERE q.quiz_id=$1 AND a.is_correct',
      [quiz.quiz_id],
    );
    const result = await ok(
      `/quizzes/attempts/${attempt.attemptId}/submit`,
      student,
      { answers },
    );
    assert.ok(result.passed);
  }
  const complete = await ok(path, student);
  check(
    "Course with all lessons and passed exams enters review",
    complete.state === "COMPLETED" &&
      complete.lessonId === lessons[1].id &&
      !complete.quizId,
  );
  check(
    "Passed quizzes included in completion badges",
    complete.completedQuizIds.length === quizzes.length,
  );
  const overview = await ok("/portal/overview", student);
  check(
    "Dashboard recognizes completed study before issuing certificate",
    overview.courses.find((x) => Number(x.courseId) === c.id).studyCompleted ===
      true,
  );
  await log(lessons[1]);
  check(
    "Reviewing a lesson never resets completion",
    (await ok(path, student)).state === "COMPLETED",
  );
  const paid = courses.find((x) => Number(x.price) > 0);
  if (paid) {
    await ok(`/enrollments/me/${paid.id}`, other, {});
    await ok(`/platform/courses/${paid.id}/study-state`, other);
    check(
      "Entry metadata never bypasses payment restriction",
      (await req(`/platform/courses/${paid.id}/classroom`, other)).status ===
        403,
    );
  }
  writeFileSync(
    new URL(
      "../docs/validation/course-resume-2026-10-27.json",
      import.meta.url,
    ),
    JSON.stringify(
      {
        checkedAt: new Date().toISOString(),
        checks,
        courseId: c.id,
        notes:
          "Flagged isolated test accounts; no existing learner progress changed. Course times remain seconds in storage.",
      },
      null,
      2,
    ),
  );
} finally {
  for (const a of sessions)
    await req("/auth/revoke", null, { refreshToken: a.refreshToken }).catch(
      () => {},
    );
  if (users.length)
    await db.query(
      "UPDATE auth.users SET is_active=false WHERE user_id=ANY($1::bigint[])",
      [users],
    );
  await db.end();
}
