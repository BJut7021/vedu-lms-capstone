import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
import { randomBytes, createHash } from "node:crypto";
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
let fixture;
const check = (name, value) => {
  assert.ok(value, name);
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
    r.status >= 200 && r.status < 300,
    `${path}: ${r.status} ${JSON.stringify(r.body)}`,
  );
  return r.body;
}
async function account(role) {
  const username = `intro_${role.toLowerCase()}_${Date.now()}_${users.length}`,
    password = randomBytes(18).toString("base64url") + "@9";
  const {
    rows: [u],
  } = await db.query(
    "INSERT INTO auth.users(username,email,full_name,password_hash,role,is_test_account) VALUES($1,$2,$3,$4,$5,true) RETURNING user_id",
    [
      username,
      username + "@example.test",
      "Kiểm thử giới thiệu khóa học",
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
  const software = JSON.parse(
    readFileSync("data/learning/software-curriculum.json", "utf8"),
  ).courses;
  const catalog = await ok("/courses");
  for (const c of software) {
    const course = catalog.find((x) => x.title === c.name),
      detail = await ok(`/courses/${course.id}`);
    check(
      `${c.key}: learning outcomes and preparation visible without authentication`,
      detail.overview.outcomes.length >= c.lessons.length &&
        detail.overview.preparation === c.prerequisites,
    );
    check(
      `${c.key}: all lesson bodies and private resource URLs remain hidden`,
      detail.sections
        .flatMap((s) => s.lessons)
        .filter((l) => l.id > 0)
        .every((l) => !l.content && !l.resourceUrl),
    );
    const response = await fetch(base + detail.overview.syllabus.url),
      hash = createHash("sha256")
        .update(Buffer.from(await response.arrayBuffer()))
        .digest("hex");
    check(
      `${c.key}: only the chosen original syllabus PDF can be read before enrollment`,
      response.status === 200 &&
        response.headers.get("content-type").includes("application/pdf") &&
        hash === c.files.find((f) => f.file === c.syllabus).sha256,
    );
  }
  const owner = await account("TEACHER"),
    stranger = await account("TEACHER"),
    student = await account("STUDENT");
  const {
    rows: [c],
  } = await db.query(
    "INSERT INTO lms.courses(course_name,description,teacher_id,price,status,review_status) VALUES($1,$2,$3,100000,'PUBLISHED','APPROVED') RETURNING course_id",
    [
      "Kiểm thử giới thiệu khóa học",
      "Isolated overview access test",
      owner.user.userId,
    ],
  );
  fixture = Number(c.course_id);
  const {
    rows: [lesson],
  } = await db.query(
    "INSERT INTO lms.lessons(course_id,title,content,lesson_order,is_published) VALUES($1,'Bài học kiểm thử','PRIVATE LESSON BODY',1,true) RETURNING lesson_id",
    [fixture],
  );
  const {
    rows: [resource],
  } = await db.query(
    "INSERT INTO lms.lesson_resources(lesson_id,resource_type,title,resource_url,display_order) VALUES($1,'PDF','Đề cương kiểm thử',$2,1) RETURNING resource_id",
    [lesson.lesson_id, `vedu-file:${software[0].syllabus}`],
  );
  const form = {
      audience: "Người mới học",
      preparation: "Biết lập trình cơ bản",
      outcomes: ["Hiểu lớp và đối tượng"],
      practiceNote: "Thực hành tự luyện",
      syllabusResourceId: Number(resource.resource_id),
    },
    path = `/platform/courses/${fixture}/overview`;
  check(
    "Unrelated teacher cannot alter the public introduction",
    (await req(path, stranger, form, "PATCH")).status === 403,
  );
  check(
    "Student cannot publish an introduction",
    (await req(path, student, form, "PATCH")).status === 403,
  );
  await ok(path, owner, form, "PATCH");
  check(
    "Owner can save introduction and selected syllabus",
    (await ok(`/courses/${fixture}`)).overview.outcomes[0] === form.outcomes[0],
  );
  const {
    rows: [foreign],
  } = await db.query(
    "SELECT r.resource_id FROM lms.lesson_resources r JOIN lms.lessons l USING(lesson_id) WHERE l.course_id<>$1 LIMIT 1",
    [fixture],
  );
  check(
    "Cannot publish a resource belonging to another course",
    (
      await req(
        path,
        owner,
        { ...form, syllabusResourceId: Number(foreign.resource_id) },
        "PATCH",
      )
    ).status === 400,
  );
  check(
    "Invalid learning outcomes are rejected",
    (
      await req(
        path,
        owner,
        { ...form, outcomes: Array(31).fill("x") },
        "PATCH",
      )
    ).status === 400,
  );
  const {
    rows: [before],
  } = await db.query(
    "SELECT count(*)::int n FROM enrollment.enrollments WHERE student_id=$1",
    [student.user.userId],
  );
  await ok(`/courses/${fixture}`);
  const response = await fetch(`${base}/api/courses/${fixture}/syllabus`);
  assert.equal(response.status, 200);
  await response.arrayBuffer();
  const {
    rows: [after],
  } = await db.query(
    "SELECT count(*)::int n FROM enrollment.enrollments WHERE student_id=$1",
    [student.user.userId],
  );
  check(
    "Reading syllabus never creates enrollment or unlocks a paid classroom",
    before.n === after.n &&
      (await req(`/platform/courses/${fixture}/classroom`, student)).status ===
        403,
  );
  check(
    "Ordinary lesson media remains protected",
    (await fetch(`${base}/api/platform/media/${resource.resource_id}`))
      .status === 401,
  );
  await ok(path, owner, { ...form, syllabusResourceId: null }, "PATCH");
  check(
    "Removing syllabus immediately closes its public PDF endpoint",
    (await fetch(`${base}/api/courses/${fixture}/syllabus`)).status === 404 &&
      !(await ok(`/courses/${fixture}`)).overview.syllabus,
  );
  await ok(path, owner, form, "PATCH");
  await db.query(
    "UPDATE lms.lessons SET is_published=false WHERE lesson_id=$1",
    [lesson.lesson_id],
  );
  check(
    "Unpublished lesson cannot expose a linked syllabus",
    (await fetch(`${base}/api/courses/${fixture}/syllabus`)).status === 404,
  );
  await db.query(
    "UPDATE lms.lessons SET is_published=true WHERE lesson_id=$1",
    [lesson.lesson_id],
  );
  await db.query("UPDATE lms.courses SET status='DRAFT' WHERE course_id=$1", [
    fixture,
  ]);
  check(
    "Draft course and syllabus cannot be viewed publicly",
    (await req(`/courses/${fixture}`)).status === 404 &&
      (await fetch(`${base}/api/courses/${fixture}/syllabus`)).status === 404,
  );
  writeFileSync(
    "docs/validation/course-introduction-checks.json",
    JSON.stringify(
      {
        checkedAt: new Date().toISOString(),
        checks,
        notes:
          "Isolated test course archived and test sessions revoked afterwards; existing learner progress unchanged.",
      },
      null,
      2,
    ),
  );
} finally {
  if (fixture)
    await db.query(
      "UPDATE lms.courses SET is_deleted=true,deleted_at=now() WHERE course_id=$1",
      [fixture],
    );
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
