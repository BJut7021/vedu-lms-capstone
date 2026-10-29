import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
import { randomBytes, randomUUID } from "node:crypto";
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
  sessions = [],
  courses = [],
  orders = [];
const check = (name, v) => {
  assert.ok(v, name);
  checks.push(name);
  console.log("PASS", name);
};
async function req(path, a, body, method) {
  const r = await fetch(base + "/api" + path, {
    method: method || (body === undefined ? "GET" : "POST"),
    headers: {
      "Content-Type": "application/json",
      ...(a ? { Authorization: `Bearer ${a.accessToken}` } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  return { status: r.status, data: await r.json().catch(() => null) };
}
async function ok(...args) {
  const r = await req(...args);
  assert.ok(
    r.status >= 200 && r.status < 300,
    `${args[0]}: ${r.status} ${JSON.stringify(r.data)}`,
  );
  return r.data;
}
async function account(role) {
  const username = `payplan_${role.toLowerCase()}_${Date.now()}_${users.length}`,
    password = randomBytes(15).toString("base64url") + "@9";
  const {
    rows: [u],
  } = await db.query(
    "INSERT INTO auth.users(username,email,full_name,password_hash,role,is_test_account) VALUES($1,$2,$3,$4,$5,true) RETURNING user_id",
    [
      username,
      username + "@example.test",
      "Kiểm thử thanh toán và lộ trình",
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
  const a = await account("STUDENT"),
    b = await account("STUDENT"),
    admin = await account("ADMIN"),
    teacher = await account("TEACHER");
  const guest = await ok("/auth/guest", null, { expectedRole: "STUDENT" });
  sessions.push(guest);
  users.push(guest.user.userId);
  await db.query(
    "UPDATE auth.users SET is_test_account=true WHERE user_id=$1",
    [guest.user.userId],
  );
  async function fixture(price) {
    const {
      rows: [c],
    } = await db.query(
      "INSERT INTO lms.courses(course_name,description,teacher_id,price,status,review_status) VALUES($1,'Isolated test fixture',$2,$3,'PUBLISHED','APPROVED') RETURNING course_id",
      ["Kiểm thử học phí và lịch học", teacher.user.userId, price],
    );
    const id = Number(c.course_id);
    courses.push(id);
    const ids = [];
    for (let i = 0; i < 6; i++) {
      const {
        rows: [l],
      } = await db.query(
        "INSERT INTO lms.lessons(course_id,title,content,lesson_order,estimated_duration_seconds,is_published) VALUES($1,$2,$3,$4,900,true) RETURNING lesson_id",
        [id, "Bài " + (i + 1), "Nội dung học kiểm thử", i + 1],
      );
      const lid = Number(l.lesson_id);
      await db.query(
        "INSERT INTO lms.lesson_pedagogy(lesson_id,is_core,kind,difficulty,prerequisites,outcomes) VALUES($1,true,'CONCEPT',1,$2::jsonb,$3::jsonb)",
        [
          lid,
          JSON.stringify(i ? [ids[i - 1]] : []),
          JSON.stringify(["Mục tiêu bài " + (i + 1)]),
        ],
      );
      ids.push(lid);
    }
    return { id, ids };
  }
  const paid = await fixture(10000),
    manual = `/platform/checkout/${paid.id}/manual`;
  check(
    "Anonymous cannot create a payment",
    (await req(manual, null, { method: "CASH" })).status === 401,
  );
  check(
    "Guest cannot buy courses",
    (await req(manual, guest, { method: "CASH" })).status === 403,
  );
  check(
    "Teacher cannot impersonate a paying student",
    (await req(manual, teacher, { method: "CASH" })).status === 403,
  );
  const initial = await ok(`/platform/checkout/${paid.id}`, a);
  if (!initial.bankConfigured)
    check(
      "Unconfigured bank cannot issue a real payment QR",
      (await req(manual, a, { method: "BANK_TRANSFER" })).status === 503,
    );
  const creates = await Promise.all([
    ok(manual, a, { method: "CASH" }),
    ok(manual, a, { method: "CASH" }),
  ]);
  const r = creates[0].manualRequest;
  orders.push(r.orderId);
  check(
    "Repeated simultaneous checkout returns the same pending order",
    r.id === creates[1].manualRequest.id && !creates[0].paid,
  );
  check(
    "Unpaid classroom is locked",
    (await req(`/platform/courses/${paid.id}/classroom`, a)).status === 403,
  );
  const report = `/platform/payments/manual/${r.id}/report`,
    review = `/platform/payments/manual/${r.id}/review`;
  check(
    "Other learner cannot report someone else payment",
    (await req(report, b, { note: "Thử truy cập" })).status === 404,
  );
  await ok(report, a, { note: "Đã nộp phí — kiểm thử cách ly" });
  check(
    "Student report does not mark order paid or unlock classroom",
    !(await ok(`/platform/checkout/${paid.id}`, a)).paid &&
      (await req(`/platform/courses/${paid.id}/classroom`, a)).status === 403,
  );
  const approval = {
    decision: "APPROVE",
    verified: true,
    receivedAmount: 10000,
    receivedReference: r.reference,
    transactionCode: "TEST-" + Date.now(),
    note: "Đối chiếu biên nhận kiểm thử, không thu tiền thật.",
  };
  check(
    "Student cannot approve payment",
    (await req(review, a, approval)).status === 403,
  );
  check(
    "Teacher cannot approve payment",
    (await req(review, teacher, approval)).status === 403,
  );
  for (const [label, change] of [
    ["Wrong amount", { receivedAmount: 9999 }],
    ["Wrong reference", { receivedReference: "WRONGCODE" }],
    ["Missing receipt verification", { verified: false }],
  ])
    check(
      label + " rejected",
      (await req(review, admin, { ...approval, ...change })).status === 400,
    );
  await ok(review, admin, {
    decision: "REJECT",
    note: "Chưa khớp biên nhận, đề nghị kiểm tra lại.",
  });
  check(
    "Rejected receipt keeps course locked",
    (await ok(`/platform/checkout/${paid.id}`, a)).manualRequest.status ===
      "REJECTED" &&
      (await req(`/platform/courses/${paid.id}/classroom`, a)).status === 403,
  );
  await ok(report, a, { note: "Đã bổ sung số biên nhận kiểm thử." });
  await ok(review, admin, approval);
  await ok(review, admin, approval);
  const {
    rows: [count],
  } = await db.query(
    "SELECT count(*)::int n FROM payment.payments WHERE order_id=$1",
    [r.orderId],
  );
  check(
    "Verified receipt unlocks exactly once, including retries",
    (await ok(`/platform/checkout/${paid.id}`, a)).paid &&
      count.n === 1 &&
      (await req(`/platform/courses/${paid.id}/classroom`, a)).status === 200,
  );
  check(
    "Payment grants access only to its owner",
    (await req(`/platform/courses/${paid.id}/classroom`, b)).status === 403,
  );
  const second = await ok(manual, b, { method: "CASH" }),
    r2 = second.manualRequest;
  orders.push(r2.orderId);
  check(
    "A single receipt cannot pay two different orders",
    (
      await req(`/platform/payments/manual/${r2.id}/review`, admin, {
        ...approval,
        receivedReference: r2.reference,
      })
    ).status === 409 && !(await ok(`/platform/checkout/${paid.id}`, b)).paid,
  );
  const list = await ok("/platform/payments/manual", admin);
  check(
    "Admin can inspect review history",
    list.requests.find((x) => x.id === r.id)?.status === "APPROVED",
  );
  check(
    "Learner cannot inspect admin payment list",
    (await req("/platform/payments/manual", a)).status === 403,
  );
  const free = await fixture(0);
  await ok(`/enrollments/me/${free.id}`, a, {});
  await ok(`/enrollments/me/${free.id}`, guest, {});
  check(
    "Guest free-course preview still works",
    (await ok(`/platform/checkout/${free.id}`, guest)).paid &&
      (await req(`/platform/courses/${free.id}/classroom`, guest)).status ===
        200,
  );
  const prefs = {
      goal: "PRACTICAL",
      level: "BEGINNER",
      occupation: "STUDENT",
      format: "MIXED",
      weeklySeconds: 1800,
      horizonWeeks: 4,
      count: 4,
    },
    path = `/platform/courses/${free.id}/path-options`;
  check(
    "Unenrolled learner cannot generate a path",
    (await req(path, b, prefs)).status === 403,
  );
  check(
    "Guest cannot generate personalized paths",
    (await req(path, guest, prefs)).status === 403,
  );
  const plans = await ok(path, a, prefs);
  check(
    "Strict sequential course yields four distinct schedules without inventing content",
    plans.plans.length === 4 &&
      new Set(plans.plans.map((p) => p.estimatedSeconds)).size === 4 &&
      plans.plans.every(
        (p) =>
          p.differenceBasis === "STUDY_PACE" &&
          p.steps.map((s) => s.lessonId).join(",") === free.ids.join(","),
      ),
  );
  check(
    "Schedules respect the requested weekly budget",
    plans.plans.every((p) =>
      p.schedule.weeks.every((w) => w.estimatedSeconds <= 1800),
    ),
  );
  check(
    "Cold-start recommendation honestly uses curriculum evidence",
    plans.evidence.source === "CURRICULUM" &&
      plans.plans.every((p) => p.steps.every((s) => s.score === null)),
  );
  const chosen = await ok(
    `/platform/path-options/${plans.path_set_id}/selection`,
    a,
    { planId: plans.plans[0].id },
    "PATCH",
  );
  check(
    "Chosen plan is persisted",
    chosen.selected_plan_id === plans.plans[0].id,
  );
  await ok("/learning/events", a, {
    eventUuid: randomUUID(),
    learningSessionId: randomUUID(),
    courseId: free.id,
    lessonId: free.ids[0],
    action: "COMPLETE_LESSON",
    durationSeconds: 0,
  });
  const updated = await ok(`/platform/path-options/${plans.path_set_id}`, a);
  check(
    "Progress and weekly schedule update from real saved lesson state",
    updated.plans.every(
      (p) =>
        p.progress.completed === 1 &&
        p.nextLessonId === free.ids[1] &&
        p.schedule.weeks.every((w) =>
          w.tasks.every((t) => t.lessonId !== free.ids[0]),
        ),
    ),
  );
  check(
    "Another learner cannot view a private path set",
    (await req(`/platform/path-options/${plans.path_set_id}`, b)).status ===
      404,
  );
  await db.query(
    "UPDATE lms.lessons SET content=content||$2 WHERE lesson_id=$1",
    [free.ids[1], " · thay đổi học liệu kiểm thử"],
  );
  const stale = await ok(`/platform/path-options/${plans.path_set_id}`, a);
  check(
    "Changed curriculum asks for refresh rather than resuming a stale plan",
    stale.curriculumChanged &&
      stale.plans.every((p) => p.nextLessonId === null),
  );
  writeFileSync(
    "docs/validation/payments-plans-checks.json",
    JSON.stringify(
      {
        checkedAt: new Date().toISOString(),
        checks,
        notes:
          "Flagged test accounts and isolated courses. No real cash/bank transfer occurred. Test payment records are closed as simulated refunds after checks, fixtures hidden and sessions revoked.",
      },
      null,
      2,
    ),
  );
} finally {
  if (orders.length)
    await db.query(
      "UPDATE payment.payments SET status='REFUNDED',refunded_at=now() WHERE order_id=ANY($1::bigint[]) AND status='PAID'",
      [orders],
    );
  if (courses.length)
    await db.query(
      "UPDATE lms.courses SET is_deleted=true,deleted_at=now() WHERE course_id=ANY($1::bigint[])",
      [courses],
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
