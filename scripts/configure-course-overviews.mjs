// Additive initial setup. Teacher-authored overview rows are never overwritten.
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { officeCurriculum } from "../data/learning/office-curriculum.mjs";
const require = createRequire(
    new URL("../backend/package.json", import.meta.url),
  ),
  { Client } = require("pg");
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
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 5432),
  database: env.POSTGRES_DB,
  user: env.POSTGRES_USER,
  password: env.POSTGRES_PASSWORD,
});
const software = JSON.parse(
  readFileSync("data/learning/software-curriculum.json", "utf8"),
).courses;
const configs = [
  ...software.map((c) => ({
    key: c.key,
    family: "COMPUTING",
    audience:
      c.key === "oop"
        ? "Học viên đã biết lập trình cơ bản, muốn học hướng đối tượng bằng C#."
        : "Học viên CNTT muốn phân tích và thiết kế hệ thống theo hướng đối tượng, sử dụng UML.",
    preparation: c.prerequisites,
    practiceNote:
      "Bài thực hành code/UML và đề tự luận mẫu dùng để luyện tập theo tiêu chí trong từng bài; chưa có chấm sản phẩm thực hành tự động. Quiz VEDU đánh giá kiến thức và không thay thế cơ cấu điểm học phần của trường.",
    url: `vedu-file:${c.syllabus}`,
  })),
  {
    key: "discrete",
    family: "COMPUTING",
    audience: "Học viên muốn xây dựng nền tảng toán rời rạc cho ngành CNTT.",
    preparation:
      "Kiến thức toán phổ thông, tập hợp và thao tác số học cơ bản; giấy bút để tự giải bài tập.",
    url: "/course-materials/discrete/00.html",
  },
  {
    key: "networks",
    family: "COMPUTING",
    audience: "Người bắt đầu học nguyên lý mạng và thiết kế mạng nhỏ.",
    preparation:
      "Máy tính cá nhân, kiến thức sử dụng máy tính cơ bản; chỉ thực hành kiểm tra cấu hình trong mạng được phép.",
    url: "/course-materials/networks/00.html",
  },
  ...officeCurriculum.map((c) => ({
    key: c.key,
    family: "OFFICE",
    audience:
      "Học viên, sinh viên và người đi làm muốn áp dụng kỹ năng vào công việc.",
    preparation: c.summary,
    practiceNote:
      "Bài tập thực hành tự đối chiếu sản phẩm theo hướng dẫn. Quiz kiểm tra kiến thức được chấm trên VEDU; việc đọc xong tài liệu không phải điểm chấm sản phẩm.",
  })),
];
await db.connect();
try {
  await db.query(readFileSync("database/vedu/content_workflow.sql", "utf8"));
  await db.query("BEGIN");
  let count = 0;
  for (const c of configs) {
    const {
      rows: [course],
    } = await db.query(
      "SELECT course_id FROM lms.courses WHERE description LIKE $1 AND NOT is_deleted",
      [`[VEDU-${c.family}-v1:${c.key}]%`],
    );
    if (!course) continue;
    const {
      rows: [resource],
    } = c.url
      ? await db.query(
          "SELECT r.resource_id FROM lms.lesson_resources r JOIN lms.lessons l USING(lesson_id) WHERE l.course_id=$1 AND r.resource_url=$2 AND l.is_published AND NOT l.is_deleted ORDER BY l.lesson_order,r.display_order LIMIT 1",
          [course.course_id, c.url],
        )
      : { rows: [] };
    const r = await db.query(
      "INSERT INTO lms.course_overviews(course_id,audience,preparation,practice_note,syllabus_resource_id) VALUES($1,$2,$3,$4,$5) ON CONFLICT(course_id) DO NOTHING",
      [
        course.course_id,
        c.audience,
        c.preparation,
        c.practiceNote ||
          "Bài tập thực hành là hoạt động tự luyện; quiz cuối khóa được chấm trên hệ thống.",
        resource?.resource_id || null,
      ],
    );
    count += r.rowCount;
  }
  await db.query("COMMIT");
  console.log("Created course overviews:", count);
} catch (e) {
  await db.query("ROLLBACK");
  throw e;
} finally {
  await db.end();
}
