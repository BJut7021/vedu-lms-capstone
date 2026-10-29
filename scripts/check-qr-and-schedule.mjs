import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { writeFileSync } from "node:fs";
import { bankQrPayload, crc16 } from "../backend/dist/platform/bank-qr.js";
import { weeklySchedule } from "../backend/dist/platform/path-schedule.js";
import { planOptions } from "../backend/dist/platform/path-planner.js";
const require = createRequire(
    new URL("../backend/package.json", import.meta.url),
  ),
  QR = require("qrcode"),
  sharp = require("sharp"),
  jsQR = require("jsqr");
const checks = [];
const check = (name, v) => {
  assert.ok(v, name);
  checks.push(name);
  console.log("PASS", name);
};
check(
  "CRC16 matches the standard independent test vector",
  crc16("123456789") === "29B1",
);
const payload = bankQrPayload("970436", "000000000", 10000, "VEDUTEST001122");
const png = await QR.toBuffer(payload, {
  width: 512,
  margin: 4,
  errorCorrectionLevel: "M",
});
const { data, info } = await sharp(png)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const decoded = jsQR(new Uint8ClampedArray(data), info.width, info.height);
check(
  "Generated local QR can be read by an independent QR decoder",
  decoded?.data === payload,
);
function parse(s) {
  const o = {};
  while (s.length) {
    const key = s.slice(0, 2),
      len = Number(s.slice(2, 4));
    o[key] = s.slice(4, 4 + len);
    s = s.slice(4 + len);
  }
  return o;
}
const fields = parse(decoded.data),
  network = parse(fields["38"]),
  account = parse(network["01"]);
check(
  "QR encodes correct receiving BIN, account, VND amount and transfer memo",
  network["00"] === "A000000727" &&
    network["02"] === "QRIBFTTA" &&
    account["00"] === "970436" &&
    account["01"] === "000000000" &&
    fields["53"] === "704" &&
    fields["54"] === "10000" &&
    parse(fields["62"])["08"] === "VEDUTEST001122" &&
    fields["63"] === crc16(payload.slice(0, -4)),
);
for (const invalid of [
  () => bankQrPayload("abc", "000000000", 10000, "VEDUTEST001122"),
  () => bankQrPayload("970436", "000000000", -1, "VEDUTEST001122"),
  () => bankQrPayload("970436", "000000000", 1.5, "VEDUTEST001122"),
])
  assert.throws(invalid);
check("Invalid bank/amount data rejected", true);
const prefs = {
  goal: "PRACTICAL",
  level: "BEGINNER",
  occupation: "STUDENT",
  format: "MIXED",
  weeklySeconds: 1800,
  horizonWeeks: 4,
  count: 4,
};
const chain = Array.from({ length: 6 }, (_, i) => ({
  id: i + 1,
  title: "Bài " + (i + 1),
  order: i + 1,
  seconds: 900,
  measuredVideo: false,
  difficulty: 1,
  kind: "CONCEPT",
  core: true,
  prerequisites: i ? [i] : [],
  outcomes: [],
  skills: [],
  goals: [],
  sources: [],
  completed: false,
}));
const plans = planOptions(chain, prefs, false);
check(
  "Sequential curriculum yields four genuinely different study schedules",
  plans.length === 4 &&
    new Set(plans.map((p) => JSON.stringify(p.activities))).size === 4 &&
    plans.every((p) => p.differenceBasis === "STUDY_PACE"),
);
check(
  "Every schedule preserves exactly the authoritative lesson order",
  plans.every(
    (p) => p.steps.map((s) => s.lessonId).join(",") === "1,2,3,4,5,6",
  ),
);
check(
  "Weekly workload never exceeds the learner budget and conserves estimated time",
  plans.every(
    (p) =>
      p.schedule.weeks.every((w) => w.estimatedSeconds <= 1800) &&
      p.schedule.weeks.reduce((s, w) => s + w.estimatedSeconds, 0) ===
        p.estimatedSeconds,
  ),
);
const split = weeklySchedule(
  [
    {
      lessonId: 1,
      title: "Bài dài",
      activity: "LEARN",
      estimatedSeconds: 4000,
    },
  ],
  1800,
  2,
);
check(
  "Long lesson splits across weeks and warns about target overrun",
  split.weeks.length === 3 &&
    split.weeks[2].estimatedSeconds === 400 &&
    !split.weeks[2].withinTarget,
);
const capped = weeklySchedule(
  [
    {
      lessonId: 1,
      title: "Dữ liệu rất lớn",
      activity: "LEARN",
      estimatedSeconds: 1000000,
    },
  ],
  1800,
  2,
);
check(
  "Oversized schedule is bounded with explicit unallocated time",
  capped.weeks.length === 104 && capped.unscheduledSeconds > 0,
);
check(
  "Time explanations use minutes rather than raw seconds",
  plans.every((p) => !p.explanation.join(" ").includes("giây")),
);
writeFileSync(
  "docs/validation/qr-schedule-checks.json",
  JSON.stringify(
    {
      checkedAt: new Date().toISOString(),
      checks,
      notes:
        "Synthetic bank/account used only in local decoder tests; never configured on the running application and no money transferred.",
    },
    null,
    2,
  ),
);
