import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { randomBytes } from "node:crypto";
const require = createRequire(
  new URL("../backend/package.json", import.meta.url),
);
const { Client } = require("pg"),
  bcrypt = require("bcryptjs"),
  sharp = require("sharp");
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
function check(name, condition) {
  assert.ok(condition, name);
  checks.push(name);
  console.log("PASS", name);
}
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
async function user(role) {
  const username = `ui_${role.toLowerCase()}_${Date.now()}_${users.length}`,
    password = randomBytes(15).toString("base64url") + "@9";
  const {
    rows: [u],
  } = await db.query(
    "INSERT INTO auth.users(username,email,full_name,password_hash,role,is_test_account) VALUES($1,$2,$3,$4,$5,true) RETURNING user_id",
    [
      username,
      username + "@example.test",
      `Kiểm thử giao diện ${role}`,
      await bcrypt.hash(password, 10),
      role,
    ],
  );
  users.push(u.user_id);
  const r = await req("/auth/login", null, {
    username,
    password,
    expectedRole: role,
  });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  sessions.push(r.body);
  return r.body;
}
async function upload(auth, buffer, type = "image/png", fields = {}) {
  const f = new FormData();
  if (buffer) f.set("file", new Blob([buffer], { type }), "avatar.png");
  for (const [key, value] of Object.entries(fields)) f.set(key, value);
  const r = await fetch(base + "/api/users/me/avatar", {
    method: "POST",
    headers: auth ? { Authorization: `Bearer ${auth.accessToken}` } : {},
    body: f,
  });
  return { status: r.status, body: await r.json().catch(() => null) };
}
await db.connect();
try {
  const student = await user("STUDENT"),
    teacher = await user("TEACHER"),
    admin = await user("ADMIN");
  const png = await sharp({
    create: { width: 450, height: 300, channels: 3, background: "#2563eb" },
  })
    .png()
    .toBuffer();
  mkdirSync(new URL("../.work/", import.meta.url), { recursive: true });
  writeFileSync(new URL("../.work/avatar-test.png", import.meta.url), png);
  check("Anonymous upload denied", (await upload(null, png)).status === 401);
  check(
    "Administrator upload denied",
    (await upload(admin, png)).status === 403,
  );
  const guest = (await req("/auth/guest", null, {})).body;
  sessions.push(guest);
  check("Guest upload denied", (await upload(guest, png)).status === 403);
  check("Missing file rejected", (await upload(student)).status === 400);
  check(
    "SVG rejected even when declared PNG",
    (
      await upload(
        student,
        Buffer.from(
          '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
        ),
      )
    ).status === 400,
  );
  check(
    "Corrupt PNG rejected",
    (
      await upload(
        student,
        Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 1, 2]),
      )
    ).status === 400,
  );
  check(
    "Files over 5 MB rejected",
    (await upload(student, Buffer.alloc(5 * 1024 * 1024 + 1))).status === 413,
  );
  const first = await upload(student, png);
  check(
    "Student avatar uploaded",
    first.status === 201 &&
      first.body.avatarUrl?.startsWith("/api/users/avatars/"),
  );
  const image = await fetch(base + first.body.avatarUrl),
    out = Buffer.from(await image.arrayBuffer()),
    meta = await sharp(out).metadata();
  check(
    "Avatar publicly readable JPEG with nosniff",
    image.status === 200 &&
      image.headers.get("content-type").startsWith("image/jpeg") &&
      image.headers.get("x-content-type-options") === "nosniff",
  );
  check(
    "Image cropped to 256 square without EXIF",
    meta.width === 256 && meta.height === 256 && !meta.exif,
  );
  check(
    "Avatar saved in account profile",
    (await req("/users/me", student)).body.avatarUrl === first.body.avatarUrl,
  );
  const next = await upload(student, png, "image/png", {
    userId: String(teacher.user.userId),
  });
  check(
    "Caller cannot update another account using multipart userId",
    next.status === 201 &&
      (await req("/users/me", teacher)).body.avatarUrl == null,
  );
  check(
    "Old generated avatar removed",
    (await fetch(base + first.body.avatarUrl)).status === 404,
  );
  const webp = await sharp(png).webp().toBuffer(),
    t = await upload(teacher, webp, "image/webp");
  check("Teacher WebP upload supported", t.status === 201);
  const jpeg = await sharp(png).jpeg().toBuffer();
  check(
    "Student JPEG upload supported",
    (await upload(student, jpeg, "image/jpeg")).status === 201,
  );
  check(
    "Malformed image filename rejected",
    (await fetch(base + "/api/users/avatars/not-an-avatar.jpg")).status === 404,
  );
  const courses = (await req("/courses")).body;
  check(
    "Homepage course data available",
    Array.isArray(courses) && courses.length > 0,
  );
  const c =
    courses.find((c) => c.title === "Cấu trúc rời rạc") ||
    courses.find((c) => Number(c.price) === 0);
  assert.ok(c);
  check(
    "Enrollment for classroom test succeeds",
    (await req(`/enrollments/me/${c.id}`, student, {})).status < 300,
  );
  const classroom = await req(`/platform/courses/${c.id}/classroom`, student);
  check(
    "Classroom lessons and resources available",
    classroom.status === 200 &&
      classroom.body.sections.flatMap((s) => s.lessons).length > 2,
  );
  const p = await req(`/platform/courses/${c.id}/path-options`, student, {
    goal: "CAREER",
    level: "BEGINNER",
    occupation: "OFFICE",
    format: "MIXED",
    weeklySeconds: 9000,
    horizonWeeks: 4,
    count: 2,
  });
  check(
    "2.5 hours stored as 9000 seconds",
    p.status === 201 &&
      p.body.preferences.weeklySeconds === 9000 &&
      p.body.plans.length > 0,
  );
  const history = await req(`/platform/courses/${c.id}/path-options`, student);
  check(
    "Time preference persists in learning path history",
    history.body[0].preferences.weeklySeconds === 9000,
  );
  const {
    rows: [row],
  } = await db.query("SELECT avatar_url FROM auth.users WHERE user_id=$1", [
    student.user.userId,
  ]);
  check(
    "Avatar URL persisted in PostgreSQL",
    row.avatar_url?.startsWith("/api/users/avatars/"),
  );
  writeFileSync(
    new URL("../.work/avatar-persistence.json", import.meta.url),
    JSON.stringify({ url: row.avatar_url }),
  );
  mkdirSync(new URL("../docs/validation/", import.meta.url), {
    recursive: true,
  });
  writeFileSync(
    new URL("../docs/validation/profile-ui-checks.json", import.meta.url),
    JSON.stringify(
      {
        checkedAt: new Date().toISOString(),
        checks,
        courseCount: courses.length,
        notes:
          "Isolated flagged test accounts. Unit stored by API is seconds; UI input is hours. Browser visual testing reported separately.",
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
