import { createRequire } from "node:module";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import {
  createSubjectArtwork,
  subjectCoverInfo,
} from "../frontend/src/services/subjectCourseArtwork.js";
import {
  createCourseArtwork,
  courseFamily,
  courseIdentity,
} from "../frontend/src/services/courseArtwork.js";
const require = createRequire(
    new URL("../backend/package.json", import.meta.url),
  ),
  sharp = require("sharp");
const catalog = JSON.parse(
  readFileSync(
    new URL("../data/course-covers/catalog.json", import.meta.url),
    "utf8",
  ),
);
const generatedFile = new URL(
  "../.work/generated-course-covers.json",
  import.meta.url,
);
const generated = existsSync(generatedFile)
  ? JSON.parse(
      readFileSync(
        new URL("../.work/generated-course-covers.json", import.meta.url),
        "utf8",
      ),
    )
  : [];
const out = new URL(
  "../frontend/public/images/course-covers/v2/",
  import.meta.url,
);
mkdirSync(out, { recursive: true });
mkdirSync(new URL("../frontend/src/data/", import.meta.url), {
  recursive: true,
});
mkdirSync(new URL("../docs/validation/", import.meta.url), { recursive: true });
const reviewed = {
  69: ["Mạng máy tính", "OSI · IP · TCP/UDP", "#165161"],
  68: ["Cấu trúc rời rạc", "Đồ thị · Logic · Phép đếm", "#5c4b2b"],
  67: ["Kỹ năng số", "Tệp · Cộng tác · An toàn email", "#24584b"],
  66: ["PowerPoint", "Thuyết trình dự án rõ ràng", "#9c4d32"],
  65: ["Excel thực hành", "Chi phí · Công thức · Báo cáo", "#205b43"],
  64: ["Word thực hành", "Báo cáo · Styles · Hồ sơ", "#255c93"],
  55: ["Office 365", "Đồng bộ tệp · Chia sẻ · Email", "#265a87"],
  3: ["PostgreSQL", "Schema · Ràng buộc · Trigger", "#294968"],
  2: ["HUSPM", "Chuỗi hành vi · Utility · Mẫu", "#6c4264"],
  1: ["React & Node.js", "Giao diện · State · REST API", "#254b7c"],
};
const labels = {
  web: ["Lập trình Web", "#2d5899"],
  data: ["Dữ liệu & AI", "#65446f"],
  database: ["Cơ sở dữ liệu", "#72563a"],
  digital: ["Kỹ năng số", "#2d6b5d"],
};
const manifest = {},
  checks = [];
for (const c of catalog) {
  const specific = subjectCoverInfo(c);
  const id = c.id,
    photo = generated.find((g) => g.id === id),
    filename = `course-${id}.webp`,
    url = `/images/course-covers/v2/${filename}`;
  const target = new URL(filename, out),
    isCurated = !!reviewed[id] || !!specific;
  if (specific || (photo && existsSync(photo.path)) || !isCurated) {
    const input = specific
      ? Buffer.from(createSubjectArtwork(c))
      : photo && existsSync(photo.path)
        ? photo.path
        : Buffer.from(createCourseArtwork(c));
    await sharp(input)
      .resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: 86, effort: 5 })
      .toFile(fileURLToPath(new URL(filename, out)));
  } else if (!existsSync(target))
    throw Error(
      `Missing reviewed cover ${id}. Restore its saved WebP or provide the generated source.`,
    );
  const bytes = readFileSync(new URL(filename, out));
  const n = c.title.match(/(\d+)$/)?.[1],
    family = courseFamily(c);
  const [headline, subtitle, ink] = (specific
    ? [specific.headline, specific.subtitle, specific.ink]
    : reviewed[id]) || [
    labels[family]?.[0] || c.title,
    n ? `Thực hành ${n} · Video, tài liệu & quiz` : "Học và thực hành",
    labels[family]?.[1] || "#294968",
  ];
  manifest[courseIdentity(c)] = {
    courseId: id,
    title: c.title,
    src: url,
    headline,
    subtitle,
    ink,
    photo: isCurated && !specific,
    series: n || null,
  };
  checks.push({
    id,
    title: c.title,
    source:
      isCurated && !specific
        ? "AI-assisted editorial illustration"
        : "Original code-native editorial artwork",
    file: url,
    bytes: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    lessonTitles: c.lessonTitles,
  });
}
if (new Set(checks.map((c) => c.sha256)).size !== catalog.length)
  throw Error("Repeated cover files");
writeFileSync(
  new URL("../frontend/src/data/course-covers.json", import.meta.url),
  JSON.stringify(manifest, null, 2),
);
writeFileSync(
  new URL("../docs/validation/course-covers-v2.json", import.meta.url),
  JSON.stringify(
    {
      checkedAt: new Date().toISOString(),
      courseCount: catalog.length,
      uniqueFiles: checks.length,
      totalBytes: checks.reduce((s, c) => s + c.bytes, 0),
      checks,
    },
    null,
    2,
  ),
);
// QA contact sheets do not alter the source artwork or its web assets.
for (let start = 0; start < catalog.length; start += 10) {
  const group = catalog.slice(start, start + 10),
    tiles = [];
  for (let i = 0; i < group.length; i++) {
    const c = group[i],
      entry = manifest[courseIdentity(c)];
    const tile = await sharp(fileURLToPath(new URL(`course-${c.id}.webp`, out)))
      .resize(360, 203, { fit: "cover" })
      .toBuffer();
    const label = Buffer.from(
      `<svg width="360" height="38"><rect width="360" height="38" fill="white"/><text x="10" y="24" font-family="Arial" font-size="13" fill="#243d55">${String(c.id) + " / " + entry.headline.replace(/&/g, "&amp;")} ${entry.series || ""}</text></svg>`,
    );
    tiles.push(
      { input: tile, left: (i % 2) * 380, top: Math.floor(i / 2) * 258 },
      { input: label, left: (i % 2) * 380, top: Math.floor(i / 2) * 258 + 203 },
    );
  }
  await sharp({
    create: {
      width: 760,
      height: Math.ceil(group.length / 2) * 258,
      channels: 3,
      background: "#e8edf2",
    },
  })
    .composite(tiles)
    .jpeg({ quality: 90 })
    .toFile(
      fileURLToPath(
        new URL(
          `../docs/validation/course-covers-sheet-${start / 10 + 1}.jpg`,
          import.meta.url,
        ),
      ),
    );
}
console.log(
  `Built ${checks.length} distinct covers, ${(checks.reduce((s, c) => s + c.bytes, 0) / 1024 / 1024).toFixed(2)} MB total.`,
);
