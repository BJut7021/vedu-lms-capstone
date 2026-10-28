import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
const require = createRequire(
    new URL("../backend/package.json", import.meta.url),
  ),
  sharp = require("sharp");
const manifest = JSON.parse(
    readFileSync(
      new URL("../frontend/src/data/course-covers.json", import.meta.url),
    ),
  ),
  catalog = JSON.parse(
    readFileSync(
      new URL("../data/course-covers/catalog.json", import.meta.url),
    ),
  );
const checks = [],
  entries = Object.values(manifest),
  base = process.env.VEDU_BASE_URL || "http://127.0.0.1:8080";
const check = (name, value) => {
  assert.ok(value, name);
  checks.push(name);
  console.log("PASS", name);
};
check(
  "Every reviewed course has its own file",
  entries.length === catalog.length &&
    new Set(entries.map((e) => e.src)).size === entries.length,
);
const hashes = [],
  visual = [];
let totalBytes = 0;
for (const entry of entries) {
  const buf = readFileSync(
      new URL("../frontend/public" + entry.src, import.meta.url),
    ),
    meta = await sharp(buf).metadata();
  totalBytes += buf.length;
  assert.ok(
    meta.width >= 960 &&
      meta.width / meta.height > 1.7 &&
      meta.width / meta.height < 1.85,
    entry.title + " dimensions",
  );
  assert.equal(meta.format, "webp");
  assert.ok(buf.length < 200 * 1024, entry.title + " weight");
  hashes.push(createHash("sha256").update(buf).digest("hex"));
  const { data, info } = await sharp(buf)
    .extract({
      left: Math.floor(meta.width * 0.4),
      top: 0,
      width: Math.floor(meta.width * 0.6),
      height: meta.height,
    })
    .resize(17, 16)
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const bits = [];
  for (let y = 0; y < 16; y++)
    for (let x = 0; x < 16; x++)
      bits.push(
        data[y * info.width + x] > data[y * info.width + x + 1] ? 1 : 0,
      );
  visual.push({ id: entry.courseId, bits });
  const r = await fetch(base + entry.src);
  assert.equal(r.status, 200, entry.title + " served");
  assert.ok(r.headers.get("content-type")?.includes("image/webp"));
  assert.equal(
    createHash("sha256")
      .update(Buffer.from(await r.arrayBuffer()))
      .digest("hex"),
    hashes.at(-1),
    entry.title + " deployed bytes",
  );
}
check(
  "50 decoded images use wide composition and efficient WebP",
  entries.length === 50,
);
check("No repeated image bytes", new Set(hashes).size === entries.length);
const pairs = [];
for (let i = 0; i < visual.length; i++)
  for (let j = i + 1; j < visual.length; j++)
    pairs.push({
      a: visual[i].id,
      b: visual[j].id,
      distance: visual[i].bits.reduce(
        (s, b, k) => s + (b !== visual[j].bits[k] ? 1 : 0),
        0,
      ),
    });
pairs.sort((a, b) => a.distance - b.distance);
check(
  "No exact perceptual duplicate in the illustration area",
  pairs[0].distance > 0,
);
check("All 50 deployed URLs serve the intended image", true);
check("Entire cover library stays under 2 MB", totalBytes < 2 * 1024 * 1024);
writeFileSync(
  new URL("../docs/validation/course-cover-checks.json", import.meta.url),
  JSON.stringify(
    {
      checkedAt: new Date().toISOString(),
      checks,
      count: entries.length,
      totalBytes,
      closestVisualPairs: pairs.slice(0, 12),
      notes:
        "Perceptual difference is a duplicate screen, not proof that different lessons have different curricular outcomes. Native series covers illustrate introductory subjects only.",
    },
    null,
    2,
  ),
);
