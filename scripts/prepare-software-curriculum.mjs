// Read only the student-facing parts of the two supplied archives.
// Input: directory containing both extracted course folders. Never copies teacher answers.
import {
  readdirSync,
  readFileSync,
  mkdirSync,
  copyFileSync,
  writeFileSync,
} from "node:fs";
import { resolve, join } from "node:path";
import { createHash } from "node:crypto";
const root = resolve(process.argv[2] || ".work/course-import-2026-10-28");
const output = resolve("data/learning/software-course-assets");
mkdirSync(output, { recursive: true });
const folders = readdirSync(root).filter((n) => n.startsWith("VEDU_"));
const read = (p) => JSON.parse(readFileSync(p, "utf8"));
const courses = [];
for (const key of ["oop", "systems"]) {
  const folder = folders.find((n) =>
    key === "oop" ? n.includes("Lập") : n.includes("Phantich"),
  );
  if (!folder) throw Error(`Missing extracted archive: ${key}`);
  const base = join(root, folder);
  const src =
    key === "oop"
      ? read(join(base, "05_DuLieuLMS/lessons_student.json"))
      : read(join(base, "05_DuLieuLMS/course_student.json"));
  const references = read(
    join(
      base,
      "03_VideoVaNguon",
      key === "oop" ? "sources.json" : "Nguon_tham_khao.json",
    ),
  );
  const assetFolder = join(
    base,
    key === "oop" ? "01_TaiLieu hoc" : "01_TaiLieuHoc",
  );
  const files = [];
  function stage(directory, filename, label) {
    const buf = readFileSync(join(directory, filename));
    if (buf.subarray(0, 5).toString() !== "%PDF-")
      throw Error(`Invalid PDF ${filename}`);
    const hash = createHash("sha256").update(buf).digest("hex");
    const uuid = `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}.pdf`;
    copyFileSync(join(directory, filename), join(output, uuid));
    const item = {
      filename,
      label,
      file: uuid,
      sha256: hash,
      bytes: buf.length,
    };
    files.push(item);
    return uuid;
  }
  for (const f of readdirSync(assetFolder).filter((n) => n.endsWith(".pdf")))
    stage(assetFolder, f, f);
  for (const f of readdirSync(join(base, "02_HocLieuBoSung")).filter((n) =>
    n.endsWith(".pdf"),
  ))
    stage(
      join(base, "02_HocLieuBoSung"),
      f,
      f.includes("Bai_hoc")
        ? "Bài học và bài tập bổ sung"
        : "Đề tự luận mẫu — luyện tập, không chấm tự động",
    );
  const find = (name) => {
    const f = files.find((f) => f.filename === name);
    if (!f) throw Error(`Missing original PDF: ${name}`);
    return f.file;
  };
  const names =
    key === "oop"
      ? [
          [
            "Chuong 00_Tong quan_CSharp_SV.pdf",
            "Chuong 01_PhuongPhapLapTrinhHDT_SV.pdf",
          ],
          ["Chuong 02. Lop_DoiTuong_SV.pdf"],
          ["Chuong 02. Lop_DoiTuong_SV.pdf"],
          ["Chuong 02. Lop_DoiTuong_SV.pdf"],
          ["Chuong 03_KeThuaVaDaHinh_SV.pdf"],
          ["Chuong 03_KeThuaVaDaHinh_SV.pdf"],
          ["Chuong 03_KeThuaVaDaHinh_SV.pdf"],
          ["Chuong4. MoHinh3tang.pdf"],
          ["0101101962_DCCT_LTHDT.pdf"],
          ["0101101962_DCCT_LTHDT.pdf"],
        ]
      : src.lessons.map((l) => [
          l.original_pdf.replace(
            "Chuong 7_PTTKHTTT_Thiet ke chuc nang he thong.pdf",
            "Chuong 7_PTTKHTTT_Thiet ke chuc nang he thong - Copy.pdf",
          ),
        ]);
  const lessons = (key === "oop" ? src : src.lessons).map((l, i) => ({
    key: l.id,
    title: key === "systems" && i === 5 ? "Thiết kế lớp và dữ liệu" : l.title,
    objective: l.objective || l.goal,
    notes: l.notes,
    exercises: l.small_exercises || l.small,
    practice: l.final_assignment || l.final,
    rubric: l.rubric,
    alignment: l.syllabus || `Chương ${i + 1} trong đề cương`,
    pdfs: names[i].map(find),
    references: references.filter((r) =>
      (l.video_ids || l.sources || []).includes(r.id),
    ),
    supplemental: key === "oop" && i >= 8,
    estimatedSeconds: key === "oop" ? 1800 : 2700,
  }));
  courses.push({
    key,
    name: key === "oop" ? "Lập trình hướng đối tượng" : src.title,
    topic:
      key === "oop"
        ? "Lập trình & Phát triển phần mềm"
        : "Phân tích & Thiết kế hệ thống",
    summary:
      key === "oop"
        ? "10 bài C# từ lớp, đối tượng, đóng gói đến kế thừa, đa hình, interface, ba lớp và mẫu thiết kế. Học qua PDF gốc, bài tập lập trình và tình huống thực hành."
        : "7 chương từ khảo sát yêu cầu đến mô hình nghiệp vụ, use case, lớp, dữ liệu và thiết kế chức năng bằng UML. Thực hành xuyên suốt với tình huống quản lý giao–nộp–chấm bài trên LMS.",
    prerequisites:
      key === "oop"
        ? "Lập trình cơ bản; máy có C#/.NET để thực hành console (Visual Studio hoặc VS Code)."
        : "Lập trình hướng đối tượng và cơ sở dữ liệu; công cụ vẽ UML hoặc giấy để thực hành.",
    case: key === "systems" ? src.case : null,
    syllabus: find(
      key === "oop"
        ? "0101101962_DCCT_LTHDT.pdf"
        : "60. 01200062_Chi tiet_Phan tich thiet ke he thong.pdf",
    ),
    files,
    lessons,
    references: references.filter((r) => /^https:\/\//.test(r.url)),
    provenance: `RAR nhóm cung cấp: ${folder}. Bài tập bổ sung trong gói có ghi nguồn ChatGPT; PDF gốc được giữ nguyên, phục vụ khóa tự học VEDU. Không phải khóa/chứng chỉ chính thức của trường hoặc đơn vị nguồn.`,
  });
}
writeFileSync(
  "data/learning/software-curriculum.json",
  JSON.stringify({ version: "software-v1", courses }, null, 2),
);
console.log(
  JSON.stringify(
    courses.map((c) => ({
      key: c.key,
      lessons: c.lessons.length,
      pdfs: c.files.length,
      bytes: c.files.reduce((s, f) => s + f.bytes, 0),
    })),
    null,
    2,
  ),
);
