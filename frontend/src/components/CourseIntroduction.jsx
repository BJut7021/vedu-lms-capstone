import {
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  FileText,
  GraduationCap,
  Users,
} from "lucide-react";
import { formatMinutes } from "../services/time";
export default function CourseIntroduction({ course }) {
  const overview = course.overview || {},
    outcomes = overview.outcomes || [],
    syllabus = overview.syllabus,
    quizzes = overview.assessments || [];
  const lessons = course.sections
    .flatMap((s) => s.lessons)
    .filter((l) => l.type !== "quiz");
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
            <GraduationCap size={20} className="text-blue-600" />
            Bạn sẽ học được gì?
          </h3>
          {outcomes.length ? (
            <>
              <ul className="mt-4 space-y-3">
                {outcomes.map((o, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm leading-6 text-slate-700"
                  >
                    <CheckCircle2
                      size={17}
                      className="mt-1 shrink-0 text-emerald-600"
                    />
                    <span>{o}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Giảng viên chưa công bố chuẩn đầu ra riêng. Nội dung hiện có của
                khóa:
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700">
                {lessons.slice(0, 5).map((l) => (
                  <li key={l.id}>{l.title}</li>
                ))}
              </ul>
            </>
          )}
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
              Bạn có thể học các bài đã công bố theo thứ tự phù hợp.
              Chứng nhận yêu cầu đạt mô-đun bắt buộc và đánh giá cuối khóa.
              Hãy kiểm tra quiz và bài nộp cần đạt trong từng mô-đun.
            </p>
            {quizzes.length > 0 && (
              <ul className="mt-3 space-y-3">
                {quizzes.map((q, i) => (
                  <li
                    key={i}
                    className="rounded-xl bg-white/80 p-3 text-sm leading-6"
                  >
                    <strong className="block text-slate-800">{q.title}</strong>
                    <span className="text-slate-600">
                      Đạt từ {q.passingScore}/10 · {q.maxAttempts} lượt ·{" "}
                      {formatMinutes(q.durationSeconds)}
                    </span>
                    {q.requiresCompletedLessons && (
                      <p className="mt-1 text-xs text-emerald-800">
                        Mở sau khi đạt các mô-đun bắt buộc.
                      </p>
                    )}
                    {q.finalMode && <p className="mt-1 text-xs text-slate-600">
                      {q.finalMode === "MCQ_ONLY" ? "Trắc nghiệm 100%" : `Trắc nghiệm ${q.mcqPercent}% · ${q.finalMode === "MCQ_PRACTICAL" ? "Sản phẩm thực hành" : "Tự luận"} ${100 - q.mcqPercent}%`}
                    </p>}
                  </li>
                ))}
              </ul>
            )}
            {overview.practiceNote && (
              <p className="mt-3 whitespace-pre-line text-xs leading-5 text-slate-600">
                {overview.practiceNote}
              </p>
            )}
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
