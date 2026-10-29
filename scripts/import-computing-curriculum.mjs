// Import the named user-provided course catalogs. No synthetic student history.
// Repeatable transaction: updates only this import's marked courses/lessons.
import { computingCurriculum } from "../data/learning/computing-curriculum.mjs";
import { createRequire } from "node:module";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
const require = createRequire(
  new URL("../backend/package.json", import.meta.url),
);
const { Client } = require("pg");
const env = Object.fromEntries(
  readFileSync(new URL("../.env", import.meta.url), "utf8")
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
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const pdfRoot =
  "https://itc.edu.vn/Data/Sites/1/media/thongbao/2026/Dao%20tao/Kiemdinh/Baigiang/co_ly/";
const report = [];
await db.connect();
try {
  await db.query("BEGIN");
  await db.query("SELECT pg_advisory_xact_lock(hashtext('vedu-computing-v1'))");
  const {
    rows: [teacher],
  } = await db.query(
    "SELECT user_id FROM auth.users WHERE role='TEACHER' AND is_active ORDER BY (username='teacher') DESC,user_id LIMIT 1",
  );
  if (!teacher) throw Error("Cần một tài khoản giảng viên đang hoạt động");
  for (const course of computingCurriculum) {
    const marker = `[VEDU-COMPUTING-v1:${course.key}]`;
    let {
      rows: [c],
    } = await db.query(
      "SELECT course_id FROM lms.courses WHERE description LIKE $1 AND NOT is_deleted",
      [`${marker}%`],
    );
    const isNew = !c;
    if (!c)
      ({
        rows: [c],
      } = await db.query(
        "INSERT INTO lms.courses(course_name,description,teacher_id,price,status,topic) VALUES($1,$2,$3,0,'DRAFT',$4) RETURNING course_id",
        [
          course.name,
          `${marker}\n${course.summary}\nKhóa tự học do VEDU biên soạn bổ trợ, không phải khóa/chứng chỉ chính thức của đơn vị nguồn.`,
          teacher.user_id,
          course.topic,
        ],
      ));
    const id = c.course_id;
    const intro = `HƯỚNG DẪN BẮT ĐẦU — ${course.name}\n\nMục tiêu: ${course.summary}\n\nChuẩn bị: trình duyệt, sổ ghi chép; ${course.key === "networks" ? "máy tính cá nhân để xem cấu hình mạng, tùy chọn phần mềm mô phỏng được cấp phép. Chỉ thực hành trong mạng được phép." : "kiến thức toán phổ thông, tập hợp và thao tác số học cơ bản."}\n\nCách học:\n1. Đọc đề cương và học lần lượt ${course.lessons.length} bài theo danh sách.\n2. Trong mỗi bài: đọc tóm tắt → mở slide HTML VEDU → đọc slide/tài liệu gốc ở liên kết nguồn → làm bài tập nhỏ → mở gợi ý sau khi tự làm.\n3. Bấm “Tôi đã đọc tài liệu” để xác nhận tự học. Đây là xác nhận của bạn, không phải bằng chứng hệ thống đã chấm bài thực hành.\n4. Thi cuối khóa mở sau khi hoàn thành các bài; ${course.lessons.length} câu gốc VEDU, ${course.lessons.length * 60} giây, đạt 7/10, tối đa 5 lượt.\n5. Đạt tất cả quiz → Bảng điều khiển → Chứng chỉ → cấp và tải PDF.\n\n${course.playlist ? "Video tham khảo: danh mục gốc chỉ cung cấp một playlist chung; chưa xác minh từng video theo bài. Playlist được giữ dưới dạng liên kết tham khảo, không dùng để đo thời gian xem hay làm điều kiện hoàn thành." : "Video: bộ tài liệu chưa có video đã xác minh. Khóa này học bằng bài đọc, slide PDF/HTML và bài tập; không gắn video giả hoặc không tương ứng."}\n\nĐề cương:\n${course.lessons.map((l, i) => `${i + 1}. ${l.title}`).join("\n")}\n\nNguồn và giới hạn: các slide PDF bên ngoài mở tại máy chủ tác giả; có thể cần Internet hoặc bị nguồn thay đổi. Slide HTML/tóm tắt và câu hỏi VEDU là học liệu bổ trợ tự biên soạn, cần giảng viên thẩm định trước khi dùng đánh giá chính thức. Chứng nhận VEDU không thay thế văn bằng/chứng chỉ chính thức.`;
    const materials = new URL(
      `../frontend/public/course-materials/${course.key}/`,
      import.meta.url,
    );
    mkdirSync(materials, { recursive: true });
    const lessons = [
      {
        title: "00 · Hướng dẫn bắt đầu & đề cương",
        content: intro,
        seconds: 240,
      },
      ...course.lessons.map((l, i) => ({
        title: `${String(i + 1).padStart(2, "0")} · ${l.title}`,
        seconds: 900,
        content: `MỤC TIÊU\nHiểu và vận dụng ${l.title.toLocaleLowerCase("vi-VN")} qua một ví dụ và bài tập nhỏ.\n\nKIẾN THỨC CỐT LÕI\n${l.concept}\n\nVÍ DỤ\n${l.example}\n\nBÀI TẬP NHỎ — tự thực hiện trước khi xem gợi ý\n${l.exercise}\n\nMở slide bên dưới để xem gợi ý/đáp án tự đối chiếu. Nếu chưa hiểu, gửi câu hỏi trong Hỏi đáp khóa học; giảng viên có thể hướng dẫn thêm.\n\nTỰ KIỂM TRA\n${l.question}\n${l.options.map((o, j) => `${String.fromCharCode(65 + j)}. ${o}`).join("\n")}\n\nTóm tắt và bài tập gốc VEDU, không trích nguyên ngân hàng câu hỏi của bên thứ ba. Thời gian đọc chỉ là dự kiến, không phải thời lượng video.`,
      })),
    ];
    const ids = [];
    for (const [i, l] of lessons.entries()) {
      const key = `computing-v1.${course.key}.${i}`;
      let {
        rows: [existing],
      } = await db.query(
        "SELECT l.lesson_id FROM lms.lessons l JOIN lms.lesson_pedagogy p USING(lesson_id) WHERE p.content_key=$1",
        [key],
      );
      let lid;
      if (existing) {
        lid = existing.lesson_id;
      } else {
        const {
          rows: [newLesson],
        } = await db.query(
          "INSERT INTO lms.lessons(course_id,title,content,lesson_order,estimated_duration_seconds,is_published) VALUES($1,$2,$3,$4,$5,true) RETURNING lesson_id",
          [id, l.title, l.content, i + 1, l.seconds],
        );
        lid = newLesson.lesson_id;
      }
      ids.push(Number(lid));
      const original = i > 0 ? course.lessons[i - 1] : null;
      const source =
        original && course.pdfs
          ? pdfRoot + encodeURIComponent(course.pdfs[i - 1])
          : course.source;
      const sources = [
        {
          title:
            original && course.pdfs
              ? course.pdfs[i - 1]
              : "Trang nguồn học liệu",
          provider: course.provider,
          url: source,
          rights:
            "Liên kết đến bản gốc; không sao chép/phân phối lại. Không hàm ý đơn vị nguồn chứng nhận hoặc bảo trợ VEDU.",
        },
      ];
      await db.query(
        `INSERT INTO lms.lesson_pedagogy(lesson_id,difficulty,kind,is_core,skills,goals,prerequisites,outcomes,sources,content_key) VALUES($1,$2,$3,true,$4::jsonb,$5::jsonb,$6::jsonb,$7::jsonb,$8::jsonb,$9) ON CONFLICT(lesson_id) DO NOTHING`,
        [
          lid,
          i > 5 ? 2 : 1,
          i === 0 ? "REVIEW" : "CONCEPT",
          JSON.stringify([course.key]),
          JSON.stringify(["FOUNDATION", "PRACTICAL", "CERTIFICATION"]),
          JSON.stringify(i ? [ids[i - 1]] : []),
          JSON.stringify([
            original
              ? `Giải được bài tập ${original.title.toLowerCase()}`
              : "Biết bắt đầu học, lưu tiến độ, thi và nhận chứng nhận",
          ]),
          JSON.stringify(sources),
          key,
        ],
      );
      const filename = `${String(i).padStart(2, "0")}.html`;
      const local = `/course-materials/${course.key}/${filename}`;
      const slides = original
        ? `<section><span>01 / NẮM KIẾN THỨC</span><h1>${esc(original.title)}</h1><p>${esc(original.concept)}</p><h2>Ví dụ</h2><p>${esc(original.example)}</p></section><section><span>02 / VẬN DỤNG</span><h2>Bài tập nhỏ</h2><p>${esc(original.exercise)}</p><details><summary>Tôi đã tự làm — mở gợi ý</summary><p>${esc(original.hint)}</p></details></section><section><span>03 / TỰ KIỂM TRA</span><h2>${esc(original.question)}</h2><ol type="A">${original.options.map((o) => `<li>${esc(o)}</li>`).join("")}</ol><details><summary>Mở đáp án tự đối chiếu</summary><p>Đáp án A: ${esc(original.options[0])}. Đọc lại kiến thức và ví dụ để giải thích lựa chọn.</p></details></section>`
        : `<section><span>BẮT ĐẦU / ${esc(course.name)}</span><h1>Hướng dẫn & đề cương</h1><p style="white-space:pre-line">${esc(intro)}</p></section>`;
      writeFileSync(
        new URL(filename, materials),
        `<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(l.title)} · VEDU</title><style>body{margin:0;background:#eef3fb;color:#17243e;font:17px/1.8 system-ui,sans-serif}header,footer{max-width:1000px;margin:auto;padding:18px 24px;font-size:13px}section{box-sizing:border-box;max-width:1000px;margin:16px auto;padding:36px;background:white;border-radius:20px;border-top:6px solid #2563eb;break-inside:avoid}span{font-size:12px;letter-spacing:2px;color:#2563eb}h1{font-size:30px;line-height:1.35}h2{font-size:22px;line-height:1.5}details{padding:18px;border-radius:12px;background:#eff6ff}summary{cursor:pointer;font-weight:bold}a{color:#2454bd}button{border:0;border-radius:8px;background:#2563eb;color:white;padding:9px 16px;cursor:pointer}@media(max-width:600px){section{padding:22px;margin:12px}h1{font-size:24px}}@media print{body{background:white}button{display:none}section{border:1px solid #ccd;page-break-after:always;border-radius:0}details{display:block}}</style><header>VEDU Learning Management System · Tài liệu tự học <button onclick="window.print()">In / lưu PDF</button></header>${slides}<footer>Học liệu bổ trợ do VEDU biên soạn. Nguồn tham khảo: <a href="${esc(source)}" target="_blank" rel="noreferrer">${esc(course.provider)}</a>. Không phải bài giảng hay chứng chỉ chính thức của đơn vị nguồn.</footer></html>`,
        "utf8",
      );
      const resources = [
        {
          type: "LINK",
          title: i
            ? "Slide HTML & bài tập — VEDU tự biên soạn"
            : "Hướng dẫn & đề cương — VEDU",
          url: local,
        },
        {
          type: course.pdfs && i ? "PDF" : "LINK",
          title:
            course.pdfs && i
              ? "Slide PDF gốc — ITC (cần Internet)"
              : "Nguồn học liệu tham khảo",
          url: source,
        },
      ];
      if (!i && course.playlist)
        resources.push({
          type: "LINK",
          title: "Playlist từ danh mục gốc — chưa đối chiếu video từng bài",
          url: course.playlist,
        });
      for (const r of resources)
        await db.query(
          "INSERT INTO lms.lesson_resources(lesson_id,resource_type,title,resource_url,display_order) SELECT $1,$2,$3,$4,$5 WHERE NOT EXISTS(SELECT 1 FROM lms.lesson_resources WHERE lesson_id=$1 AND resource_url=$4)",
          [lid, r.type, r.title, r.url, resources.indexOf(r) + 1],
        );
    }
    const qtitle = `Thi cuối khóa — ${course.name}`;
    const { rows: existingQuiz } = await db.query(
      "SELECT quiz_id FROM assessment.quizzes WHERE course_id=$1 AND title=$2 AND NOT is_deleted",
      [id, qtitle],
    );
    if (!existingQuiz.length) {
      const {
        rows: [q],
      } = await db.query(
        "INSERT INTO assessment.quizzes(course_id,title,time_limit_seconds,passing_score,max_attempts,is_published) VALUES($1,$2,$3,7,5,true) RETURNING quiz_id",
        [id, qtitle, course.lessons.length * 60],
      );
      for (const [i, l] of course.lessons.entries()) {
        const {
          rows: [question],
        } = await db.query(
          "INSERT INTO assessment.questions(quiz_id,question_text,question_type,question_order,points) VALUES($1,$2,'SINGLE_CHOICE',$3,1) RETURNING question_id",
          [q.quiz_id, l.question, i + 1],
        );
        // Rotate choices; the test does not have an always-A answer pattern.
        const ordered = l.options.map((text, j) => ({
          text,
          correct: j === 0,
        }));
        const offset = i % 4;
        ordered.push(...ordered.splice(0, offset));
        for (const [j, opt] of ordered.entries())
          await db.query(
            "INSERT INTO assessment.answers(question_id,answer_text,is_correct,answer_order) VALUES($1,$2,$3,$4)",
            [question.question_id, opt.text, opt.correct, j + 1],
          );
      }
    }
    // Only this import's courses: initial approval with a traceable note, no claimed faculty review.
    const note =
      "Nhập học liệu VEDU tự biên soạn theo danh mục nhóm cung cấp; liên kết nguồn giữ nguyên. Cần giảng viên rà soát trước đánh giá chính thức.";
    if (isNew)
      await db.query(
        "UPDATE lms.courses SET price=0,status='PUBLISHED',review_status='APPROVED',review_note=$2 WHERE course_id=$1",
        [id, note],
      );
    report.push({
      courseId: Number(id),
      name: course.name,
      price: 0,
      lessonCount: ids.length,
      lessonIds: ids,
      finalQuestions: course.lessons.length,
      videoStatus: course.playlist
        ? "External playlist only; per-lesson match unverified"
        : "No verified video supplied",
      pdfs: course.pdfs?.length || 0,
    });
  }
  await db.query("COMMIT");
  mkdirSync(new URL("../docs/validation/", import.meta.url), {
    recursive: true,
  });
  writeFileSync(
    new URL(
      "../docs/validation/computing-curriculum-import.json",
      import.meta.url,
    ),
    JSON.stringify(
      {
        version: "computing-v1",
        importedAt: new Date().toISOString(),
        provenance:
          "User-provided course catalogs + original VEDU teaching summaries and exercises; no fabricated learner interactions.",
        courses: report,
      },
      null,
      2,
    ),
  );
  console.log(JSON.stringify(report, null, 2));
} catch (e) {
  await db.query("ROLLBACK");
  throw e;
} finally {
  await db.end();
}
