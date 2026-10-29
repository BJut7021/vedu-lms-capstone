import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { randomUUID, randomBytes } from "node:crypto";
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
      let i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1)];
    }),
);
const db = new Client({
  host: "127.0.0.1",
  database: env.POSTGRES_DB,
  user: env.POSTGRES_USER,
  password: env.POSTGRES_PASSWORD,
});
const base = process.env.VEDU_BASE_URL || "http://localhost:8080",
  stamp = Date.now(),
  checks = [],
  users = [],
  sessions = [];
let courseId;
const check = (name, v) => {
  assert.ok(v, name);
  checks.push(name);
  console.log("PASS", name);
};
async function req(path, auth, data, method) {
  const r = await fetch(base + "/api" + path, {
    method: method || (data === undefined ? "GET" : "POST"),
    headers: {
      "Content-Type": "application/json",
      ...(auth ? { Authorization: `Bearer ${auth.accessToken}` } : {}),
    },
    ...(data === undefined ? {} : { body: JSON.stringify(data) }),
  });
  return { status: r.status, body: await r.json().catch(() => null) };
}
async function ok(path, auth, data, method) {
  const r = await req(path, auth, data, method);
  assert.ok(
    r.status < 300 && r.status >= 200,
    `${path}: ${r.status} ${JSON.stringify(r.body)}`,
  );
  return r.body;
}
async function user(role) {
  const username = `cw_${role.toLowerCase()}_${stamp}_${users.length}`,
    password = randomBytes(15).toString("base64url") + "@9";
  const {
    rows: [u],
  } = await db.query(
    "INSERT INTO auth.users(username,email,full_name,password_hash,role,is_test_account) VALUES($1,$2,$3,$4,$5,true) RETURNING user_id",
    [
      username,
      `${username}@example.test`,
      `Kiểm thử ${role}`,
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
  const admin = await user("ADMIN"),
    teacher = await user("TEACHER"),
    helper = await user("TEACHER"),
    student = await user("STUDENT");
  const c = await ok("/portal/teacher/courses", teacher, {
    name: `[TEST] Content workflow ${stamp}`,
    price: 0,
  });
  courseId = Number(c.courseId);
  const l = await ok(`/portal/teacher/courses/${courseId}/lessons`, teacher, {
    title: "Bài kiểm thử tài liệu",
    content: "Tài liệu phục vụ kiểm thử, không phải khóa thật.",
    durationSeconds: 60,
  });
  await ok(
    `/platform/lessons/${l.lessonId}`,
    teacher,
    {
      title: l.title,
      content: "Tài liệu kiểm thử",
      durationSeconds: 60,
      isPublished: true,
    },
    "PATCH",
  );
  check(
    "Unassigned teacher denied content",
    (await req(`/platform/courses/${courseId}/content`, helper)).status === 403,
  );
  await ok(
    `/platform/courses/${courseId}/teachers/${helper.user.userId}`,
    admin,
    {},
  );
  check(
    "Assigned teacher sees course",
    (await ok("/portal/overview", helper)).courses.some(
      (c) => Number(c.courseId) === courseId && c.teachingRole === "ASSISTANT",
    ),
  );
  check(
    "Assignment notification persisted",
    (await ok("/platform/notifications", helper)).some(
      (n) => n.title.includes("phân công") && n.body.includes(c.courseName),
    ),
  );
  await ok(`/platform/courses/${courseId}/content`, helper);
  await ok(
    `/portal/teacher/courses/${courseId}/status`,
    teacher,
    { status: "PUBLISHED" },
    "PATCH",
  );
  check(
    "Teacher submission awaits admin review",
    !(await ok("/courses")).some((c) => c.id === courseId),
  );
  check(
    "Student cannot moderate",
    (
      await req(`/platform/moderation/${courseId}`, student, {
        decision: "APPROVED",
        note: "No",
      })
    ).status === 403,
  );
  check(
    "Review note required",
    (
      await req(`/platform/moderation/${courseId}`, admin, {
        decision: "APPROVED",
        note: "",
      })
    ).status === 400,
  );
  await ok(`/platform/moderation/${courseId}`, admin, {
    decision: "CHANGES_REQUESTED",
    note: "Kiểm thử luồng trả về",
  });
  check(
    "Returned course remains private",
    !(await ok("/courses")).some((c) => c.id === courseId),
  );
  await ok(
    `/portal/teacher/courses/${courseId}/status`,
    teacher,
    { status: "PUBLISHED" },
    "PATCH",
  );
  await ok(`/platform/moderation/${courseId}`, admin, {
    decision: "APPROVED",
    note: "Nội dung kiểm thử đạt yêu cầu",
  });
  check(
    "Approved course is public",
    (await ok("/courses")).some((c) => c.id === courseId),
  );
  await ok(`/enrollments/me/${courseId}`, student, {});
  const q = await ok(`/platform/courses/${courseId}/questions`, student, {
    subject: "Câu hỏi kiểm thử",
    body: "Giảng viên phụ có thể trả lời không?",
  });
  const qs = await ok(`/platform/courses/${courseId}/questions`, helper);
  const question = qs.find(
    (x) => Number(x.question_id) === Number(q.questionId ?? q.question_id),
  );
  assert.ok(question);
  await ok(`/platform/questions/${question.question_id}/messages`, helper, {
    body: "Đã nhận câu hỏi và hỗ trợ học viên.",
  });
  check(
    "Assigned teacher replies to Q&A",
    (
      await ok(`/platform/courses/${courseId}/questions`, student)
    )[0].messages.some((m) => m.body.includes("Đã nhận")),
  );
  const quiz = await ok(`/platform/courses/${courseId}/quizzes`, teacher, {
    title: "Thi cuối khóa — Kiểm thử",
    timeLimitSeconds: 600,
    passingScore: 7,
    maxAttempts: 5,
    questions: [
      {
        text: "2+2 bằng bao nhiêu?",
        options: [
          { text: "4", correct: true },
          { text: "3", correct: false },
        ],
      },
    ],
  });
  check(
    "Final exam locked before learning",
    (await req(`/quizzes/${quiz.quiz_id}/attempts`, student, {})).status ===
      400,
  );
  check(
    "Certificate blocked before completion",
    (await req(`/platform/courses/${courseId}/certificate`, student, {}))
      .status === 400,
  );
  await ok("/learning/events", student, {
    eventUuid: randomUUID(),
    learningSessionId: randomUUID(),
    courseId,
    lessonId: Number(l.lessonId),
    action: "COMPLETE_LESSON",
    durationSeconds: 0,
  });
  const attempt = await ok(`/quizzes/${quiz.quiz_id}/attempts`, student, {});
  const { rows: answers } = await db.query(
    'SELECT q.question_id AS "questionId",a.answer_id AS "answerId" FROM assessment.questions q JOIN assessment.answers a USING(question_id) WHERE q.quiz_id=$1 AND a.is_correct',
    [quiz.quiz_id],
  );
  await ok(`/quizzes/attempts/${attempt.attemptId}/submit`, student, {
    answers,
  });
  const cert = await ok(
    `/platform/courses/${courseId}/certificate`,
    student,
    {},
  );
  const pdf = await fetch(
    base + `/api/platform/certificates/${cert.certificate_code}/pdf`,
    { headers: { Authorization: `Bearer ${student.accessToken}` } },
  );
  assert.equal(pdf.status, 200);
  mkdirSync(new URL("../docs/validation/", import.meta.url), {
    recursive: true,
  });
  writeFileSync(
    new URL(
      "../docs/validation/certificate-workflow-test.pdf",
      import.meta.url,
    ),
    Buffer.from(await pdf.arrayBuffer()),
  );
  check("Certificate issued and PDF downloads", Boolean(cert.certificate_code));
  const n = (await ok("/platform/notifications", helper))[0];
  await ok(`/platform/notifications/${n.id}/read`, helper, {}, "PATCH");
  check(
    "Notification read status persists",
    (await ok("/platform/notifications", helper)).some(
      (x) => x.id === n.id && x.readAt,
    ),
  );
  check(
    "Another user cannot mark notification",
    (await req(`/platform/notifications/${n.id}/read`, student, {}, "PATCH"))
      .status === 404,
  );
  await ok(
    `/platform/courses/${courseId}/teachers/${helper.user.userId}`,
    admin,
    {},
    "DELETE",
  );
  check(
    "Removed teacher loses course",
    (await ok("/portal/overview", helper)).courses.every(
      (c) => Number(c.courseId) !== courseId,
    ),
  );
  check(
    "Removed teacher loses Q&A",
    (await req(`/platform/courses/${courseId}/questions`, helper)).status ===
      403,
  );
  await ok(`/platform/moderation/${courseId}`, admin, {
    decision: "HIDDEN",
    note: "Kết thúc kiểm thử",
  });
  check(
    "Hidden course removed from catalog",
    !(await ok("/courses")).some((c) => c.id === courseId),
  );
  check(
    "Moderation history records decisions",
    (await ok("/platform/moderation", admin)).find(
      (c) => Number(c.id) === courseId,
    ).history.length === 3,
  );
  const imported = JSON.parse(
    readFileSync(
      new URL(
        "../docs/validation/computing-curriculum-import.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ).courses;
  for (const c of imported) {
    const found = await ok(`/courses/${c.courseId}`);
    check(
      `${c.name}: free and correct lesson count`,
      Number(found.price) === 0 &&
        found.sections.flatMap((s) => s.lessons).filter((l) => l.id > 0)
          .length === c.lessonCount,
    );
    const url = `/course-materials/${c.name === "Mạng máy tính" ? "networks" : "discrete"}/01.html`;
    const r = await fetch(base + url);
    check(
      `${c.name}: local slide HTML available`,
      r.status === 200 && (await r.text()).includes("Bài tập nhỏ"),
    );
  }
  writeFileSync(
    new URL("../docs/validation/content-workflow-checks.json", import.meta.url),
    JSON.stringify(
      {
        checkedAt: new Date().toISOString(),
        checks,
        testCourseId: courseId,
        notes:
          "Only flagged disposable accounts and a marked test course; not real learning data.",
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
  if (courseId)
    await db.query(
      "UPDATE lms.courses SET status='ARCHIVED' WHERE course_id=$1",
      [courseId],
    );
  if (users.length)
    await db.query(
      "UPDATE auth.users SET is_active=false WHERE user_id=ANY($1::bigint[])",
      [users],
    );
  await db.end();
}
