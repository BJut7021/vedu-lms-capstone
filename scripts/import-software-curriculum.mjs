// Repeatable content import. Does not change learner history, existing courses, or instructor edits.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from "node:fs";
import { createRequire } from "node:module";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { softwareAssessments } from "../data/learning/software-assessments.mjs";
const require = createRequire(
  new URL("../backend/package.json", import.meta.url),
);
const { Client } = require("pg");
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
const { courses } = JSON.parse(
  readFileSync("data/learning/software-curriculum.json", "utf8"),
);
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const report = [];
// Stage only the allow-listed, hash-checked student PDFs. Instructor-only files never enter this list.
const media = resolve(process.env.MEDIA_DIR || "backend/media");
mkdirSync(media, { recursive: true });
const container = spawnSync("docker", ["compose", "ps", "-q", "backend"], {
  encoding: "utf8",
}).stdout?.trim();
for (const c of courses)
  for (const f of c.files) {
    const source = resolve("data/learning/software-course-assets", f.file),
      buf = readFileSync(source);
    if (createHash("sha256").update(buf).digest("hex") !== f.sha256)
      throw Error(`PDF checksum mismatch: ${f.filename}`);
    copyFileSync(source, resolve(media, f.file));
    if (container && !process.argv.includes("--local-only")) {
      const cp = spawnSync(
        "docker",
        ["cp", source, `${container}:/app/media/${f.file}`],
        { encoding: "utf8" },
      );
      if (cp.status !== 0)
        throw Error(`Cannot stage PDF in Docker: ${cp.stderr}`);
    }
  }
await db.connect();
try {
  await db.query("BEGIN");
  await db.query("SELECT pg_advisory_xact_lock(hashtext('vedu-software-v1'))");
  const {
    rows: [teacher],
  } = await db.query(
    "SELECT user_id FROM auth.users WHERE role='TEACHER' AND is_active ORDER BY (username='teacher') DESC,user_id LIMIT 1",
  );
  if (!teacher) throw Error("Cần giảng viên đang hoạt động");
  for (const c of courses) {
    const marker = `[VEDU-COMPUTING-v1:${c.key}]`,
      questions = softwareAssessments[c.key];
    let {
      rows: [course],
    } = await db.query(
      "SELECT course_id FROM lms.courses WHERE description LIKE $1 AND NOT is_deleted",
      [`${marker}%`],
    );
    const isNew = !course;
    if (!course)
      ({
        rows: [course],
      } = await db.query(
        "INSERT INTO lms.courses(course_name,description,teacher_id,price,status,topic) VALUES($1,$2,$3,0,'DRAFT',$4) RETURNING course_id",
        [
          c.name,
          `${marker}\n${c.summary}\nKhóa tự học VEDU dựa trên tài liệu nhóm cung cấp; không phải khóa/chứng chỉ chính thức của đơn vị nguồn.`,
          teacher.user_id,
          c.topic,
        ],
      ));
    const id = Number(course.course_id),
      lessonIds = [];
    const intro = `HƯỚNG DẪN BẮT ĐẦU — ${c.name}\n\nMỤC TIÊU\n${c.summary}\n\nCHUẨN BỊ\n${c.prerequisites}\n\nCÁCH HỌC\n1. Mở đề cương PDF ở mục Tài liệu; học lần lượt ${c.lessons.length} bài.\n2. Đọc mục tiêu và tóm tắt, xem PDF gốc, mở phiếu thực hành HTML; làm hai bài tập nhỏ rồi bài thực hành cuối bài.\n3. Dùng liên kết video/trang nguồn để học bổ trợ. Các video mở ở nguồn ngoài, không được tính như thời gian xem trong VEDU.\n4. Tự kiểm tra sản phẩm theo tiêu chí; gửi thắc mắc ở Hỏi đáp. Bấm “Tôi đã đọc tài liệu” để lưu hoàn thành bài đọc.\n5. Hoàn thành các bài rồi làm quiz cuối khóa: ${questions.length} câu, ${questions.length} phút, đạt 7/10, tối đa 5 lượt. Sau khi đạt, vào Chứng chỉ để cấp và tải chứng nhận VEDU.\n\nLƯU Ý ĐÁNH GIÁ\nBài lập trình/UML và đề tự luận mẫu là luyện tập, chưa có chấm code hoặc chấm sơ đồ tự động. Quiz VEDU đánh giá kiến thức và được chấm trên hệ thống; không thay thế cơ cấu điểm học phần của trường.\n\nĐỀ CƯƠNG KHÓA TỰ HỌC\n${c.lessons.map((l, i) => `${i + 1}. ${l.title}`).join("\n")}\n\nNGUỒN\n${c.provenance}`;
    const lessons = [
      {
        title: "00 · Hướng dẫn bắt đầu & đề cương",
        text: intro,
        estimatedSeconds: 300,
      },
      ...c.lessons.map((l, i) => ({
        ...l,
        title: `${String(i + 1).padStart(2, "0")} · ${l.title}`,
        text: `MỤC TIÊU\n${l.objective}\n\nĐỐI CHIẾU ĐỀ CƯƠNG\n${l.alignment}${l.supplemental ? "\nChưa có slide chuyên đề riêng trong gói; dùng đề cương và nguồn bổ trợ Microsoft, không coi đây là slide gốc đầy đủ." : ""}\n\nKIẾN THỨC CỐT LÕI\n${l.notes}${c.case ? "\n\nTÌNH HUỐNG XUYÊN SUỐT\n" + c.case : ""}\n\nBÀI TẬP NHỎ\n${l.exercises.map((e, j) => `${j + 1}. ${e}`).join("\n")}\n\nTHỰC HÀNH CUỐI BÀI\n${l.practice}\n\nTIÊU CHÍ TỰ KIỂM TRA (10 điểm)\n${Object.entries(
          l.rubric,
        )
          .map(([k, v]) => `• ${k}: ${v} điểm`)
          .join(
            "\n",
          )}\n\nHãy lưu sản phẩm trên máy và đối chiếu tiêu chí. Bài thực hành này chưa được chấm tự động; có thể hỏi giảng viên ở Hỏi đáp. Hoàn thành bài đọc không đồng nghĩa đã đạt năng lực thực hành.\n\nNguồn: học liệu gốc và bài tập bổ sung từ RAR nhóm cung cấp; xem mục Tài liệu để mở PDF nguyên bản và nguồn ngoài.`,
      })),
    ];
    const materialRoot = resolve("frontend/public/course-materials", c.key);
    mkdirSync(materialRoot, { recursive: true });
    for (const [i, l] of lessons.entries()) {
      const key = `software-v1.${c.key}.${i}`;
      let {
        rows: [existing],
      } = await db.query(
        "SELECT lesson_id FROM lms.lesson_pedagogy WHERE content_key=$1",
        [key],
      );
      let lid;
      if (existing) lid = Number(existing.lesson_id);
      else {
        const {
          rows: [row],
        } = await db.query(
          "INSERT INTO lms.lessons(course_id,title,content,lesson_order,estimated_duration_seconds,is_published) VALUES($1,$2,$3,$4,$5,true) RETURNING lesson_id",
          [id, l.title, l.text, i + 1, l.estimatedSeconds],
        );
        lid = Number(row.lesson_id);
      }
      lessonIds.push(lid);
      const source = i ? c.lessons[i - 1] : null;
      await db.query(
        `INSERT INTO lms.lesson_pedagogy(lesson_id,difficulty,kind,is_core,skills,goals,prerequisites,outcomes,sources,content_key) VALUES($1,$2,$3,true,$4::jsonb,$5::jsonb,$6::jsonb,$7::jsonb,$8::jsonb,$9) ON CONFLICT(lesson_id) DO NOTHING`,
        [
          lid,
          i > 5 ? 2 : 1,
          i ? "CONCEPT" : "REVIEW",
          JSON.stringify([
            c.key,
            ...(c.key === "oop" ? ["csharp", "oop"] : ["uml", "requirements"]),
          ]),
          JSON.stringify(["FOUNDATION", "PRACTICAL", "CERTIFICATION"]),
          JSON.stringify(i ? [lessonIds[i - 1]] : []),
          JSON.stringify([
            source?.objective || "Biết bắt đầu học và cách đánh giá",
          ]),
          JSON.stringify(
            (source?.references || []).map((r) => ({
              title: r.title,
              url: r.url,
              provider: r.publisher || "Nguồn bổ trợ trong gói",
              rights: "Mở trang gốc; không tải lại video.",
            })),
          ),
          key,
        ],
      );
      const filename = `${String(i).padStart(2, "0")}.html`,
        local = `/course-materials/${c.key}/${filename}`;
      writeFileSync(
        resolve(materialRoot, filename),
        `<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(l.title)} · VEDU</title><style>body{margin:0;background:#eef3fb;color:#17243e;font:16px/1.8 system-ui,sans-serif}main{max-width:920px;margin:24px auto;padding:28px;background:white;border-radius:20px;border-top:6px solid #2563eb}h1{font-size:28px;line-height:1.4}p{white-space:pre-line;overflow-wrap:anywhere}small{color:#53657a}button{padding:8px 14px;background:#2563eb;color:white;border:0;border-radius:8px}@media(max-width:600px){main{margin:12px;padding:20px}h1{font-size:22px}}@media print{button{display:none}body{background:white}}</style><main><small>VEDU Learning Management System · Phiếu tự học</small><h1>${esc(l.title)}</h1><button onclick="window.print()">In / lưu PDF</button><p>${esc(l.text)}</p></main></html>`,
        "utf8",
      );
      const resources = [
        {
          title: i
            ? "Phiếu thực hành & tiêu chí tự kiểm tra"
            : "Hướng dẫn & đề cương khóa tự học",
          type: "LINK",
          url: local,
        },
      ];
      const pdfs = i
        ? source.pdfs
        : [
            c.syllabus,
            ...c.files
              .filter(
                (f) =>
                  f.file !== c.syllabus && !f.filename.startsWith("Chuong"),
              )
              .map((f) => f.file),
          ];
      for (const file of pdfs) {
        const f = c.files.find((f) => f.file === file);
        resources.push({
          title: f.label,
          type: "PDF",
          url: `vedu-file:${file}`,
        });
      }
      for (const r of source?.references || [])
        resources.push({
          title: `${r.language === "en" || r.language === "Anh" ? "[EN] " : ""}${r.title} — mở nguồn ngoài`,
          type: "LINK",
          url: r.url,
        });
      for (const r of resources)
        await db.query(
          "INSERT INTO lms.lesson_resources(lesson_id,resource_type,title,resource_url,display_order) SELECT $1,$2,$3,$4,COALESCE((SELECT MAX(display_order) FROM lms.lesson_resources WHERE lesson_id=$1),0)+1 WHERE NOT EXISTS(SELECT 1 FROM lms.lesson_resources WHERE lesson_id=$1 AND resource_url=$4)",
          [lid, r.type, r.title, r.url],
        );
    }
    const title = `Thi cuối khóa — ${c.name}`;
    let {
      rows: [quiz],
    } = await db.query(
      "SELECT quiz_id FROM assessment.quizzes WHERE course_id=$1 AND title=$2 AND NOT is_deleted",
      [id, title],
    );
    if (!quiz) {
      ({
        rows: [quiz],
      } = await db.query(
        "INSERT INTO assessment.quizzes(course_id,title,time_limit_seconds,passing_score,max_attempts,is_published) VALUES($1,$2,$3,7,5,true) RETURNING quiz_id",
        [id, title, questions.length * 60],
      ));
      for (const [i, q] of questions.entries()) {
        const {
          rows: [question],
        } = await db.query(
          "INSERT INTO assessment.questions(quiz_id,question_text,question_type,question_order,points) VALUES($1,$2,'SINGLE_CHOICE',$3,1) RETURNING question_id",
          [quiz.quiz_id, q.text, i + 1],
        );
        const choices = q.options.map((text, j) => ({
            text,
            correct: j === 0,
          })),
          offset = i % 4;
        choices.push(...choices.splice(0, offset));
        for (const [j, opt] of choices.entries())
          await db.query(
            "INSERT INTO assessment.answers(question_id,answer_text,is_correct,answer_order) VALUES($1,$2,$3,$4)",
            [question.question_id, opt.text, opt.correct, j + 1],
          );
      }
    }
    if (isNew)
      await db.query(
        "UPDATE lms.courses SET status='PUBLISHED',review_status='APPROVED',review_note=$2 WHERE course_id=$1",
        [
          id,
          "Nhập theo gói học liệu nhóm cung cấp; quiz VEDU bổ trợ. Chưa có xác nhận thẩm định chuyên môn của giảng viên.",
        ],
      );
    report.push({
      key: c.key,
      courseId: id,
      title: c.name,
      lessons: lessonIds.length,
      lessonIds,
      quizId: Number(quiz.quiz_id),
      questions: questions.length,
      price: 0,
      studentPdfs: c.files.length,
      created: isNew,
    });
  }
  await db.query("COMMIT");
  mkdirSync("docs/validation", { recursive: true });
  writeFileSync(
    "docs/validation/software-curriculum-import.json",
    JSON.stringify(
      {
        importedAt: new Date().toISOString(),
        courses: report,
        notes:
          "Student-facing PDFs only; instructor answer folders and teacher JSON were excluded. Existing content/progress never overwritten.",
      },
      null,
      2,
    ),
  );
  const catalog = await fetch("http://127.0.0.1:3000/api/courses").then((r) => {
    if (!r.ok) throw Error("Catalog API unavailable");
    return r.json();
  });
  const sanitized = [];
  for (const c of catalog) {
    const { rows: ls } = await db.query(
      "SELECT title FROM lms.lessons WHERE course_id=$1 AND is_published AND NOT is_deleted ORDER BY lesson_order",
      [c.id],
    );
    sanitized.push({
      id: c.id,
      title: c.title,
      topic: c.topic,
      lessonTitles: ls.map((l) => l.title),
    });
  }
  writeFileSync(
    "data/course-covers/catalog.json",
    JSON.stringify(sanitized, null, 2),
  );
  console.log(JSON.stringify(report, null, 2));
} catch (e) {
  await db.query("ROLLBACK");
  throw e;
} finally {
  await db.end();
}
