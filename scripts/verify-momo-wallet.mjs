// Uses a disposable database and a separate backend on port 3301.
// A non-payment QR exists only in this isolated environment, never the live app.
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";

const require = createRequire(
  new URL("../backend/package.json", import.meta.url),
);
const { Client } = require("pg"),
  bcrypt = require("bcryptjs"),
  QRCode = require("qrcode");
const sharp = require("sharp"),
  jsQR = require("jsqr");
const env = Object.fromEntries(
  readFileSync(".env", "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1).replace(/^['"]|['"]$/g, "")];
    }),
);
const suffix = Date.now(),
  database = `vedu_momo_test_${suffix}`,
  container = `vedu-momo-test-${suffix}`;
assert.match(database, /^vedu_momo_test_\d+$/);
const connection = {
  host: "127.0.0.1",
  port: 5432,
  user: env.POSTGRES_USER,
  password: env.POSTGRES_PASSWORD,
};
const control = new Client({ ...connection, database: env.POSTGRES_DB });
let db,
  started = false,
  created = false;
const base = "http://127.0.0.1:3301/api",
  checks = [];
function check(name, condition) {
  assert.ok(condition, name);
  checks.push(name);
  console.log("PASS", name);
}
async function api(path, auth, body, method) {
  const form = body instanceof FormData;
  const response = await fetch(base + path, {
    method: method || (body === undefined ? "GET" : "POST"),
    headers: {
      ...(form ? {} : { "Content-Type": "application/json" }),
      ...(auth ? { Authorization: `Bearer ${auth.accessToken}` } : {}),
    },
    ...(body === undefined ? {} : { body: form ? body : JSON.stringify(body) }),
  });
  return {
    status: response.status,
    body: await response.json().catch(() => null),
  };
}
async function ok(...args) {
  const r = await api(...args);
  assert.ok(r.status < 300, JSON.stringify({ path: args[0], ...r }));
  return r.body;
}
function walletForm(
  image,
  phone = "0000000000",
  confirm = true,
  name = "Ví kiểm thử cách ly — không nhận tiền",
) {
  const f = new FormData();
  f.set("receiverName", name);
  f.set("receiverPhone", phone);
  f.set("confirmReceivingQr", String(confirm));
  if (image)
    f.set(
      "file",
      new Blob([image], { type: "image/png" }),
      "test-not-for-payment.png",
    );
  return f;
}
try {
  await control.connect();
  await control.query(`CREATE DATABASE ${database}`);
  created = true;
  db = new Client({ ...connection, database });
  await db.connect();
  for (const filename of [
    "vedu_v6.sql",
    "demo_seed.sql",
    "portal_demo_seed.sql",
    "platform_upgrade.sql",
    "content_workflow.sql",
  ]) {
    execFileSync(
      "docker",
      [
        "compose",
        "exec",
        "-T",
        "db",
        "psql",
        "-v",
        "ON_ERROR_STOP=1",
        "-U",
        env.POSTGRES_USER,
        "-d",
        database,
      ],
      {
        input: readFileSync(`database/vedu/${filename}`),
        stdio: ["pipe", "pipe", "pipe"],
      },
    );
  }
  Object.assign(process.env, {
    DB_PASSWORD: env.POSTGRES_PASSWORD,
    JWT_SECRET: randomBytes(32).toString("hex"),
  });
  execFileSync(
    "docker",
    [
      "run",
      "--detach",
      "--name",
      container,
      "--network",
      "vedu-lms_vedu_private",
      "-p",
      "127.0.0.1:3301:3000",
      "--env",
      "DB_HOST=db",
      "--env",
      "DB_PORT=5432",
      "--env",
      `DB_USERNAME=${env.POSTGRES_USER}`,
      "--env",
      "DB_PASSWORD",
      "--env",
      `DB_DATABASE=${database}`,
      "--env",
      "JWT_SECRET",
      "--env",
      "MOMO_PAYMENT_MODE=personal",
      "vedu-lms-backend",
    ],
    { stdio: "pipe" },
  );
  started = true;
  let healthy = false;
  for (let i = 0; i < 90; i++) {
    try {
      if ((await fetch(base + "/health")).ok) {
        healthy = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  assert.ok(healthy, "Isolated backend did not start");
  async function actor(role) {
    const username = `momo_${role.toLowerCase()}_${randomBytes(4).toString("hex")}`,
      password = randomBytes(16).toString("hex") + "@9";
    await db.query(
      "INSERT INTO auth.users(username,email,full_name,password_hash,role,is_test_account) VALUES($1,$2,$3,$4,$5,true)",
      [
        username,
        username + "@example.test",
        role + " kiểm thử",
        await bcrypt.hash(password, 10),
        role,
      ],
    );
    return ok("/auth/login", null, { username, password, expectedRole: role });
  }
  const admin = await actor("ADMIN"),
    student = await actor("STUDENT"),
    other = await actor("STUDENT"),
    teacher = await actor("TEACHER"),
    guest = await ok("/auth/guest", null, { expectedRole: "STUDENT" });
  async function course() {
    const {
      rows: [c],
    } = await db.query(
      "INSERT INTO lms.courses(course_name,description,teacher_id,price,status) VALUES($1,'Cách ly, không chuyển tiền thật',$2,10000,'PUBLISHED') RETURNING course_id",
      ["MoMo kiểm thử " + randomBytes(4).toString("hex"), teacher.user.userId],
    );
    await db.query(
      "INSERT INTO lms.lessons(course_id,title,content,lesson_order,is_published) VALUES($1,'Bài kiểm thử','Không nhận tiền thật',1,true)",
      [c.course_id],
    );
    return Number(c.course_id);
  }
  const cid = await course();
  check(
    "Anonymous cannot read wallet configuration",
    (await api("/platform/payments/momo/wallet")).status === 401,
  );
  check(
    "Learner cannot change receiving wallet",
    (await api("/platform/payments/momo/wallet", student, {})).status === 403,
  );
  check(
    "Teacher cannot read receiving-wallet administration",
    (await api("/platform/payments/momo/wallet", teacher)).status === 403,
  );
  check(
    "Unconfigured MoMo refuses to create a payment request",
    (await api(`/platform/checkout/${cid}`, student, {})).status === 503,
  );
  check(
    "Bank transfer creation is disabled",
    (
      await api(`/platform/checkout/${cid}/manual`, student, {
        method: "BANK_TRANSFER",
      })
    ).status === 400,
  );
  check(
    "Cash creation is disabled",
    (await api(`/platform/checkout/${cid}/manual`, student, { method: "CASH" }))
      .status === 400,
  );
  const qr = await QRCode.toBuffer("VEDU_AUTOMATED_TEST_NOT_FOR_PAYMENT", {
    width: 400,
  });
  check(
    "Receiving QR requires explicit administrator confirmation",
    (
      await api(
        "/platform/payments/momo/wallet",
        admin,
        walletForm(qr, "0000000000", false),
      )
    ).status === 400,
  );
  check(
    "Wallet phone is validated",
    (
      await api(
        "/platform/payments/momo/wallet",
        admin,
        walletForm(qr, "invalid"),
      )
    ).status === 400,
  );
  check(
    "Executable or invalid image rejected",
    (
      await api(
        "/platform/payments/momo/wallet",
        admin,
        walletForm(Buffer.from("<svg onload=alert(1)>")),
      )
    ).status === 400,
  );
  const settings = await ok(
    "/platform/payments/momo/wallet",
    admin,
    walletForm(qr),
  );
  check(
    "Admin can persist a normalized receiving QR image",
    settings.wallet.qrDataUrl.startsWith("data:image/png;base64,"),
  );
  const qrImage = await sharp(
    Buffer.from(settings.wallet.qrDataUrl.split(",")[1], "base64"),
  )
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  check(
    "Receiving QR is rebuilt at 900 pixels without changing payment payload",
    qrImage.info.width === 900 &&
      jsQR(
        new Uint8ClampedArray(qrImage.data),
        qrImage.info.width,
        qrImage.info.height,
      ).data === "VEDU_AUTOMATED_TEST_NOT_FOR_PAYMENT",
  );
  check(
    "Wallet configuration survives reload",
    (await ok("/platform/payments/momo/wallet", admin)).wallet.receiverPhone ===
      "0000000000",
  );
  check(
    "Guest cannot create a paid order",
    (await api(`/platform/checkout/${cid}`, guest, {})).status === 403,
  );
  const [a, b] = await Promise.all([
    ok(`/platform/checkout/${cid}`, student, {}),
    ok(`/platform/checkout/${cid}`, student, {}),
  ]);
  const r = a.manualRequest;
  check(
    "Repeated concurrent checkout reuses exactly one order",
    r.id === b.manualRequest.id && a.amount === 10000,
  );
  check(
    "Learner receives MoMo identity and the configured QR",
    r.method === "MOMO_WALLET" &&
      r.wallet.receiverPhone === "0000000000" &&
      !!r.qrDataUrl &&
      r.bank === null,
  );
  check(
    "Personal MoMo is not labelled Sandbox",
    a.sandbox === false && a.paymentMode === "personal",
  );
  check(
    "Unpaid classroom stays locked",
    (await api(`/platform/courses/${cid}/classroom`, student)).status === 403,
  );
  check(
    "Another learner cannot report this order",
    (
      await api(`/platform/payments/manual/${r.id}/report`, other, {
        note: "không thuộc tài khoản",
      })
    ).status === 404,
  );
  await ok(`/platform/payments/manual/${r.id}/report`, student, {
    note: "Biên nhận thử, không chuyển tiền",
  });
  check(
    "Reporting transfer does not unlock learning",
    !(await ok(`/platform/checkout/${cid}`, student)).paid,
  );
  const decision = {
    decision: "APPROVE",
    note: "Kiểm thử cách ly, không nhận tiền",
    verified: true,
    receivedAmount: 10000,
    receivedReference: r.reference,
    transactionCode: "#TESTMOMO_" + suffix,
  };
  check(
    "Learner cannot approve a MoMo transfer",
    (await api(`/platform/payments/manual/${r.id}/review`, student, decision))
      .status === 403,
  );
  check(
    "Wrong received amount rejected",
    (
      await api(`/platform/payments/manual/${r.id}/review`, admin, {
        ...decision,
        receivedAmount: 9999,
      })
    ).status === 400,
  );
  check(
    "Wrong transfer reference rejected",
    (
      await api(`/platform/payments/manual/${r.id}/review`, admin, {
        ...decision,
        receivedReference: "WRONG",
      })
    ).status === 400,
  );
  check(
    "Unchecked verification cannot approve",
    (
      await api(`/platform/payments/manual/${r.id}/review`, admin, {
        ...decision,
        verified: false,
      })
    ).status === 400,
  );
  await ok(`/platform/payments/manual/${r.id}/review`, admin, {
    decision: "REJECT",
    note: "Chưa khớp giao dịch MoMo",
  });
  check(
    "Rejection keeps the course locked",
    !(await ok(`/platform/checkout/${cid}`, student)).paid,
  );
  await ok(`/platform/payments/manual/${r.id}/report`, student, {
    note: "Đề nghị kiểm tra lại trong kiểm thử",
  });
  await ok(`/platform/payments/manual/${r.id}/review`, admin, decision);
  await ok(`/platform/payments/manual/${r.id}/review`, admin, decision);
  const {
    rows: [p],
  } = await db.query(
    "SELECT count(*)::int n,min(payment_method) method,min(provider) provider FROM payment.payments WHERE order_id=$1 AND status='PAID'",
    [r.orderId],
  );
  check(
    "Approval unlocks once and records MOMO payment method",
    p.n === 1 &&
      p.method === "MOMO" &&
      p.provider === "MOMO_PERSONAL" &&
      (await ok(`/platform/checkout/${cid}`, student)).paid,
  );
  check(
    "Paid learner can open the classroom",
    (await api(`/platform/courses/${cid}/classroom`, student)).status === 200,
  );
  check(
    "Other learner remains locked",
    (await api(`/platform/courses/${cid}/classroom`, other)).status === 403,
  );
  const second = await course(),
    secondRequest = (await ok(`/platform/checkout/${second}`, student, {}))
      .manualRequest;
  check(
    "One MoMo transaction cannot pay two orders",
    (
      await api(`/platform/payments/manual/${secondRequest.id}/review`, admin, {
        ...decision,
        receivedReference: secondRequest.reference,
      })
    ).status === 409,
  );
  check(
    "Changing recipient requires a new QR",
    (
      await api(
        "/platform/payments/momo/wallet",
        admin,
        walletForm(null, "0000000001"),
      )
    ).status === 400,
  );
  const qr2 = await QRCode.toBuffer(
    "VEDU_AUTOMATED_TEST_SECOND_QR_NOT_FOR_PAYMENT",
    { width: 400 },
  );
  await ok(
    "/platform/payments/momo/wallet",
    admin,
    walletForm(qr2, "0000000001"),
  );
  const snapshot = (await ok(`/platform/checkout/${second}`, student))
    .manualRequest;
  check(
    "Changing configured QR preserves receiver snapshot of an old order",
    snapshot.wallet.receiverPhone === "0000000000" &&
      snapshot.qrDataUrl === r.qrDataUrl,
  );
  const list = await ok("/platform/payments/manual", admin);
  check(
    "Admin list carries recipient details without large QR data",
    list.requests.some(
      (x) => x.id === r.id && x.bank.receiverPhone === "0000000000",
    ) && !JSON.stringify(list).includes("base64"),
  );
  const plainCourse = await course(),
    plainRequest = (await ok(`/platform/checkout/${plainCourse}`, student, {}))
      .manualRequest;
  await ok(`/platform/payments/manual/${plainRequest.id}/review`, admin, {
    ...decision,
    receivedReference: plainRequest.reference,
    transactionCode: "#154131562196",
    note: "",
  });
  check(
    "Admin can approve hash-prefixed MoMo ID without typing an approval note",
    (await ok(`/platform/checkout/${plainCourse}`, student)).paid,
  );
  const {
    rows: [canonical],
  } = await db.query(
    "SELECT transaction_code FROM payment.payments WHERE order_id=$1 AND status='PAID'",
    [plainRequest.orderId],
  );
  check(
    "MoMo transaction IDs are stored canonically without hash prefix",
    canonical.transaction_code === "154131562196",
  );
  for (let i = 0; i < 7; i++) {
    const id = await course();
    await db.query("UPDATE lms.courses SET course_name=$2 WHERE course_id=$1", [
      id,
      `Excel phân tích ${i}`,
    ]);
  }
  const objectCourse = await course();
  await db.query(
    "UPDATE lms.courses SET course_name='Lập trình hướng đối tượng' WHERE course_id=$1",
    [objectCourse],
  );
  const short = await ok("/courses?q=x");
  check(
    "One-character search matches titles rather than every teacher or description",
    short.length > 0 && short.every((c) => c.title.toLowerCase().includes("x")),
  );
  check(
    "Unrelated single character does not return all courses",
    (await ok("/courses?q=%C2%A4")).length === 0,
  );
  check(
    "Search wildcard is treated as a literal character",
    (await ok("/courses?q=%25")).length === 0 &&
      (await ok("/courses?q=_")).length === 0,
  );
  const suggestions = await ok("/courses/suggestions?q=ex");
  check(
    "Autocomplete returns at most five related published course titles",
    suggestions.length === 5 &&
      suggestions.every((c) => c.title.toLowerCase().includes("ex")),
  );
  check(
    "Autocomplete needs at least two characters",
    (await ok("/courses/suggestions?q=e")).length === 0,
  );
  check(
    "Autocomplete finds Vietnamese titles without typing accents",
    (await ok("/courses/suggestions?q=huong%20doi%20tuong")).some(
      (c) => c.id === objectCourse,
    ),
  );
  writeFileSync(
    "docs/validation/momo-wallet-checks.json",
    JSON.stringify(
      {
        checkedAt: new Date().toISOString(),
        checks,
        environment:
          "Disposable PostgreSQL database and backend on port 3301; no real money, no live receiving QR changed.",
      },
      null,
      2,
    ),
  );
  console.log(`Verified ${checks.length} MoMo wallet checks.`);
} finally {
  if (started)
    execFileSync("docker", ["rm", "--force", container], { stdio: "pipe" });
  if (db) await db.end();
  if (created) {
    await control.query(
      "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname=$1 AND pid<>pg_backend_pid()",
      [database],
    );
    await control.query(`DROP DATABASE ${database}`);
  }
  await control.end();
}
