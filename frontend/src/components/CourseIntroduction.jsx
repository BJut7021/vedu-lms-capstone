import {
  BookOpen,
  ClipboardCheck,
  ExternalLink,
  FileText,
  Users,
} from "lucide-react";
export default function CourseIntroduction({ course }) {
  const overview = course.overview || {},
    syllabus = overview.syllabus;
  const lessons = course.sections
    .flatMap((s) => s.lessons)
    .filter((l) => l.type !== "quiz");
  const requiredModules = course.sections.filter(
    (section) => section.moduleType !== "INTRO" && section.required === true,
  );
  const pdf = syllabus?.type === "PDF";
  return (
    <section
      id="truoc-khi-hoc"
      aria-labelledby="course-introduction-title"
      className="scroll-mt-44 space-y-6 rounded-3xl border border-blue-100 bg-white p-5 shadow-sm sm:p-8"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
            Trước khi bắt đầu
          </p>
          <h2
            id="course-introduction-title"
            className="mt-2 text-2xl font-extrabold text-slate-900"
          >
            Hiểu rõ khóa học, học đúng mục tiêu
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Xem nội dung, chuẩn bị kiến thức cần thiết và nắm điều kiện hoàn
            thành trước khi vào phòng học.
          </p>
        </div>
        {syllabus && (
          <a
            href="#de-cuong-khoa-hoc"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700"
          >
            <FileText size={18} />
            Đọc đề cương
          </a>
        )}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl bg-slate-50 p-5">
          <h3 className="flex items-center gap-2 font-bold text-slate-900">
            <BookOpen size={20} className="text-blue-600" />
            Nội dung chính của khóa học
          </h3>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Các bài học và tài liệu đã được sắp xếp theo đúng thứ tự của khóa:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700">
            {lessons.slice(0, 6).map((l) => (
              <li key={l.id}>{l.title}</li>
            ))}
          </ul>
        </div>
        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 p-5">
            <h3 className="flex items-center gap-2 font-bold">
              <Users size={19} className="text-blue-600" />
              Khóa học dành cho ai?
            </h3>
            <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">
              {overview.audience ||
                "Bạn có thể xem danh sách bài học bên dưới để đối chiếu với mục tiêu học tập của mình."}
            </p>
            <h3 className="mt-5 flex items-center gap-2 font-bold">
              <BookOpen size={19} className="text-blue-600" />
              Kiến thức nền tảng & công cụ cần chuẩn bị
            </h3>
            <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">
              {overview.preparation ||
                "Chưa có yêu cầu đầu vào riêng được công bố. Hãy xem đề cương nếu có hoặc hỏi giảng viên khi cần xác nhận kiến thức, công cụ trước khi học."}
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5">
            <h3 className="flex items-center gap-2 font-bold text-emerald-900">
              <ClipboardCheck size={19} />
              Điều kiện hoàn thành & chứng nhận
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              Hoàn thành các module bắt buộc dưới đây và đạt đánh giá cuối khóa
              để được xét cấp chứng nhận.
            </p>
            <ul className="mt-3 space-y-2">
              {requiredModules.map((module) => (
                <li
                  key={module.id}
                  className="flex items-start gap-2 rounded-xl bg-white/80 px-3 py-2.5 text-sm font-semibold leading-5 text-slate-800"
                >
                  <ClipboardCheck
                    size={16}
                    className="mt-0.5 shrink-0 text-emerald-700"
                  />
                  <span>{module.title}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      {syllabus && (
        <div
          id="de-cuong-khoa-hoc"
          className="scroll-mt-44 space-y-4 border-t border-slate-100 pt-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="flex items-center gap-2 text-lg font-bold">
                <FileText size={20} className="text-blue-600" />
                Đề cương khóa học
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Đọc trước khi ghi danh hoặc bắt đầu học.
              </p>
            </div>
            <a
              href={syllabus.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-blue-200 px-4 py-2.5 text-sm font-bold text-blue-700"
            >
              <ExternalLink size={16} />
              {pdf ? "Mở PDF đề cương" : "Mở đề cương đầy đủ"}
            </a>
          </div>
          {pdf ? (
            <>
              <iframe
                title={`Đề cương ${course.title}`}
                src={syllabus.url}
                loading="lazy"
                className="h-[360px] w-full rounded-xl border border-slate-200 bg-slate-50 sm:h-[480px]"
              />
              <p className="text-xs leading-5 text-slate-500">
                Nếu thiết bị không hiển thị bản xem trước, chọn “Mở PDF đề
                cương” để đọc bằng trình xem của bạn.
              </p>
            </>
          ) : (
            <p className="rounded-xl bg-blue-50 p-4 text-sm leading-6 text-slate-700">
              Đề cương và hướng dẫn đã sẵn sàng ở liên kết phía trên. Bạn có thể
              đọc ngay mà chưa cần vào phòng học.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
