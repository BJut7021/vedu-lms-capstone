import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Lock,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FileText,
  HelpCircle,
  PlayCircle,
  MessageCircle,
  Clock,
} from "lucide-react";
import CourseImage from "./CourseImage";
import InlineLessonQuiz from "./InlineLessonQuiz";
import CourseStartGuide from "./CourseStartGuide";
import ResourceFileIcon from "./ResourceFileIcon";
import { resourceFormat } from "../services/resources";
import { formatMinutes } from "../services/time";

function ResourceLinks({ resources }) {
  return (
    <div className="space-y-3">
      {resources.map((r) => {
        const format = resourceFormat(r);
        return (
          <a
            key={r.id}
            href={r.url}
            target="_blank"
            rel="noreferrer"
            className="group flex items-center gap-3 rounded-xl p-2 text-sm transition hover:bg-blue-50"
          >
            <ResourceFileIcon format={format} />
            <span className="min-w-0">
              <strong className="block break-words text-[13px] font-semibold leading-5 text-slate-800 group-hover:text-blue-700">
                {r.title}
              </strong>
              <small className="text-slate-500">{format.description} ↗</small>
            </span>
          </a>
        );
      })}
    </div>
  );
}

export default function ClassroomLayout({
  course,
  lessons,
  lesson,
  done,
  notice,
  stats,
  onSelect,
  onBack,
  isGuest,
  video,
  header,
  token,
  onRefreshCourse,
}) {
  const index = lessons.findIndex((l) => l.id === lesson.id),
    next = lessons[index + 1],
    previous = lessons[index - 1];
  const section = course.sections.find((s) =>
    s.lessons.some((l) => l.id === lesson.id),
  );
  const [open, setOpen] = useState({ [section?.id]: true });
  const resources = lesson.resources || [],
    documents = resources.filter((r) => r.type !== "VIDEO");
  const localSlide = documents.find(
    (r) =>
      r.url?.startsWith("/course-materials/") && !r.url.endsWith("/00.html"),
  );
  const text = lesson.content?.replace(/^\[VEDU-LESSON:.*\]\n/, "") || "";
  const exercise = text.match(
    /(?:BÀI TẬP NHỎ|BÀI TẬP|NHIỆM VỤ|THỰC HÀNH)[\s\S]*/i,
  )?.[0];
  const study = lessons.filter((l) => l.type !== "quiz"),
    completed = study.filter((l) => done[l.id]).length;
  const percent = study.length
    ? Math.round((completed / study.length) * 100)
    : 0;
  const sectionStudy = (section?.lessons || []).filter(
    (l) => l.type !== "quiz",
  );
  const sectionDone = sectionStudy.filter((l) => done[l.id]).length;
  const sectionCurrent = sectionStudy.filter(
    (l) =>
      !done[l.id] &&
      (l.id === lesson.id || l.progress?.status === "IN_PROGRESS"),
  ).length;
  const sectionNew = sectionStudy.length - sectionDone - sectionCurrent;
  const sectionPercent = sectionStudy.length
    ? Math.round((sectionDone / sectionStudy.length) * 100)
    : 0;
  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };
  const lectureText = exercise ? text.slice(0, text.indexOf(exercise)).trim() : text;

  return (
    <div className="classroom-shell min-h-screen bg-slate-50 text-slate-800">
      {header}
      <div className="classroom-layout mx-auto grid max-w-[1680px] lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[250px_minmax(0,1fr)_270px] 2xl:grid-cols-[270px_minmax(0,1fr)_290px]">
        <aside className="classroom-sidebar hidden border-r border-slate-200 bg-white lg:block">
          <div className="border-b border-slate-100 p-5">
            <div className="flex items-start gap-3">
              <CourseImage
                course={course}
                className="h-16 w-20 shrink-0 rounded-xl object-cover"
              />
              <div className="min-w-0">
                <h2 className="home-balanced text-sm font-bold">
                  {course.title}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {study.length} bài học · {course.sections.length} mục
                </p>
              </div>
            </div>
            <div
              role="progressbar"
              aria-label="Tiến độ toàn khóa học"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
              className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100"
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-600 to-sky-400"
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {percent}% hoàn thành · {completed}/{study.length} bài
            </p>
          </div>
          <nav aria-label="Nội dung khóa học" className="space-y-2 p-3">
            {course.sections.map((s) => (
              <div key={s.id}>
                <button
                  onClick={() => setOpen({ ...open, [s.id]: !open[s.id] })}
                  aria-expanded={!!open[s.id]}
                  className="flex w-full items-center justify-between gap-2 px-2 py-3 text-left text-sm font-bold"
                >
                  <span className="home-balanced flex-1">{s.title}</span>
                  <span className="shrink-0 text-xs font-medium tabular-nums text-slate-400">
                    {s.lessons.some((l) => l.type !== "quiz") ? (
                      <>
                        {
                          s.lessons.filter(
                            (l) => l.type !== "quiz" && done[l.id],
                          ).length
                        }
                        /{s.lessons.filter((l) => l.type !== "quiz").length}
                      </>
                    ) : (
                      `${s.lessons.length} bài thi`
                    )}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`shrink-0 ${open[s.id] ? "rotate-180" : ""}`}
                  />
                </button>
                {open[s.id] && (
                  <div className="space-y-1">
                    
{s.lessons.map((l, lessonIndex) => (
  <div key={l.id} className="relative">
    {lessonIndex < s.lessons.length - 1 && (
      <span
        aria-hidden="true"
        className={`absolute bottom-[-18px] left-[25px] top-9 w-0.5 ${
          done[l.id] ? "bg-emerald-300" : "bg-slate-200"
        }`}
      />
    )}

    <button
      type="button"
      onClick={() => onSelect(l)}
      disabled={!!l.locked}
      title={
        l.locked
          ? "Cần đạt quiz bài học trước để mở khóa"
          : undefined
      }
      aria-current={l.id === lesson.id ? "step" : undefined}
      className={`relative flex w-full items-start gap-3 rounded-xl p-3 text-left text-sm transition ${
        l.locked
          ? "cursor-not-allowed bg-slate-50 text-slate-400 opacity-70"
          : l.id === lesson.id
            ? "bg-gradient-to-r from-blue-100/90 to-blue-50/80 text-blue-700 ring-1 ring-blue-100"
            : "text-slate-600 hover:bg-slate-50"
      }`}
    >
      <span
        className={`relative z-10 mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border-[3px] border-white shadow-sm ${
          l.locked
            ? "bg-slate-200 text-slate-500"
            : done[l.id]
              ? "bg-emerald-500 text-white"
              : l.id === lesson.id
                ? "bg-blue-600 text-white ring-2 ring-blue-100"
                : "bg-white text-slate-400 ring-1 ring-slate-200"
        }`}
      >
        {l.locked ? (
          <Lock size={14} />
        ) : done[l.id] ? (
          <CheckCircle2 size={15} />
        ) : l.type === "quiz" ? (
          <HelpCircle size={15} />
        ) : l.type === "video" ? (
          <PlayCircle size={15} />
        ) : (
          <FileText size={15} />
        )}
      </span>

      <span className="min-w-0">
        <span className="home-balanced block font-medium leading-5">
          {l.title}
        </span>

        {l.locked && (
          <small className="mt-1 block text-xs text-slate-500">
            Chưa mở khóa · Cần đạt quiz bài trước
          </small>
        )}

        {!l.locked &&
          l.type === "quiz" &&
          l.durationSeconds > 0 && (
            <small className="mt-1 block text-slate-400">
              {formatMinutes(l.durationSeconds)} làm bài
            </small>
          )}
      </span>
    </button>
  </div>
))}

                  </div>
                )}
              </div>
            ))}
          </nav>
          <div className="space-y-2 border-t p-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 py-2 text-sm"
            >
              <BookOpen size={17} />
              Tổng quan khóa học
            </button>
            <button
              onClick={() => scrollToSection("lesson-documents")}
              className="flex items-center gap-2 py-2 text-sm"
            >
              <FileText size={17} />
              Tài liệu bài học
            </button>
            {!isGuest && (
              <Link
                to="/student/discussions"
                className="flex items-center gap-2 py-2 text-sm text-blue-700"
              >
                <MessageCircle size={17} />
                Hỏi đáp khóa học
              </Link>
            )}
          </div>
        </aside>
        <main id="lesson-start" className="min-w-0 space-y-5 p-4 sm:p-6 lg:p-7">
          <div className="rounded-xl border border-blue-100 bg-white p-3 lg:hidden">
            <div className="mb-2 flex justify-between gap-3 text-xs">
              <span className="font-semibold">Tiến độ khóa học</span>
              <span>
                {completed}/{study.length} bài · {percent}%
              </span>
            </div>
            <div
              role="progressbar"
              aria-label="Tiến độ khóa học trên di động"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
              className="h-1.5 overflow-hidden rounded-full bg-blue-50"
            >
              <div
                className="h-full rounded-full bg-blue-600"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1 text-blue-700"
            >
              <ArrowLeft size={14} />
              Khóa học
            </button>
            <ChevronRight size={13} />
            <span>{course.title}</span>
            <ChevronRight size={13} />
            <span>{section?.title}</span>
          </div>
          <select
            aria-label="Chọn bài học"
            value={lesson.id}
            onChange={(e) =>
              onSelect(lessons.find((l) => l.id === Number(e.target.value)))
            }
            className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm lg:hidden"
          >
            {lessons.map((l) => (
              <option key={l.id} value={l.id}>
                {l.title}
              </option>
            ))}
          </select>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="home-balanced text-2xl font-extrabold tracking-tight text-slate-900 sm:text-[28px]">
                {lesson.title}
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Học từng bước, thực hành và lưu lại tiến độ của bạn.
              </p>
            </div>
            <span
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${done[lesson.id] ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"}`}
            >
              <CheckCircle2 size={15} />
              {done[lesson.id] ? "Đã hoàn thành" : "Đang học"}
            </span>
          </div>
          {index === 0 && (
            <details className="rounded-xl border border-blue-100 bg-white p-4">
              <summary className="cursor-pointer text-sm font-semibold text-blue-700">
                Hướng dẫn học khóa học
              </summary>
              <div className="mt-3">
                <CourseStartGuide />
              </div>
            </details>
          )}
          {isGuest && (
            <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
              Bạn đang học thử 2 bài đầu. Đăng ký tài khoản để học đầy đủ, làm
              bài thi và nhận chứng nhận.
            </p>
          )}
          {notice && (
            <p
              role="status"
              className="rounded-xl bg-blue-50 p-3 text-sm text-blue-800"
            >
              {notice}
            </p>
          )}
          {lesson.locked ? (
            <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
              <h2 className="text-lg font-bold text-amber-900">
                Bài học chưa được mở khóa
              </h2>
              <p className="mt-2 text-sm text-amber-800">
                Hãy làm đạt quiz của bài trước để xem nội dung này.
              </p>
            </section>
          ) : (
            <>
              <section
                id="lesson-video"
                className="scroll-mt-24 space-y-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6"
              >
                <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                  <PlayCircle size={21} className="text-blue-600" />
                  1. Video bài giảng
                </h2>
                {video ? (
                  <>
                    {video}
                    <div className="space-y-3 rounded-xl bg-blue-50 p-4 text-sm">
                      <p>
                        Đã xem thực: <strong>{formatMinutes(stats?.actualSeconds || 0)}</strong>
                        {" · "}Nội dung duy nhất: {formatMinutes(stats?.uniqueSeconds || 0)}
                        {" "}({stats?.percent || 0}%)
                      </p>
                      <p className="text-xs text-slate-500">
                        Thời lượng video:{" "}
                        {stats?.durationSeconds > 0
                          ? formatMinutes(stats.durationSeconds)
                          : "đang đo từ trình phát"}
                      </p>
                      <div className="h-2 overflow-hidden rounded-full bg-blue-100">
                        <div
                          className="h-full bg-blue-600"
                          style={{ width: `${stats?.percent || 0}%` }}
                        />
                      </div>
                      <p className="text-xs leading-5 text-slate-600">
                        Tiến độ xem video được lưu tự động. Chỉ kết quả quiz đạt mới
                        xác nhận hoàn thành bài học và mở bài tiếp theo.
                      </p>
                    </div>
                  </>
                ) : (
                  <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">
                    Giảng viên chưa gắn video cho bài học này. Bạn có thể xem tài liệu
                    và làm quiz nếu bài đã có quiz.
                  </p>
                )}
              </section>

              <section
                id="lesson-documents"
                className="scroll-mt-24 space-y-3 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6"
              >
                <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                  <FileText size={21} className="text-blue-600" />
                  2. Tài liệu bài học (PDF / slide)
                </h2>
                {documents.length ? (
                  <>
                    <p className="text-sm text-slate-500">
                      Nhấn vào tên tài liệu để mở trong tab mới, không rời trang học.
                    </p>
                    <ResourceLinks resources={documents} />
                  </>
                ) : (
                  <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                    Bài này chưa có tài liệu PDF hoặc slide đính kèm.
                  </p>
                )}
              </section>

              {lesson.type !== "quiz" && (
                <div id="lesson-quiz" className="scroll-mt-24">
                  {isGuest ? (
                    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
                      Cần đăng nhập bằng tài khoản học viên để làm quiz và ghi nhận tiến độ.
                    </section>
                  ) : (
                    <InlineLessonQuiz
                      key={lesson.id}
                      quizId={lesson.quizId}
                      token={token}
                      onQuizPassed={onRefreshCourse}
                    />
                  )}
                </div>
              )}

              {(lectureText || localSlide) && (
                <details className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                  <summary className="cursor-pointer font-semibold text-slate-800">
                    Nội dung bài giảng bổ sung
                  </summary>
                  <div className="mt-4 space-y-4">
                    {localSlide && (
                      <iframe
                        title={localSlide.title}
                        src={localSlide.url}
                        className="h-[58vh] min-h-80 w-full rounded-xl border border-slate-200"
                      />
                    )}
                    {lectureText && (
                      <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                        {lectureText}
                      </p>
                    )}
                  </div>
                </details>
              )}

              {exercise && (
                <details
                  id="lesson-exercises"
                  className="scroll-mt-24 rounded-2xl border border-blue-100 bg-white p-4 sm:p-5"
                >
                  <summary className="cursor-pointer font-semibold text-blue-800">
                    Bài tập tự luyện (không tính hoàn thành bài)
                  </summary>
                  <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                    {exercise}
                  </p>
                  {localSlide && (
                    <a
                      href={localSlide.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-block text-sm font-semibold text-blue-700 underline"
                    >
                      Mở slide để tự đối chiếu gợi ý
                    </a>
                  )}
                </details>
              )}
            </>
          )}
          {!lesson.locked && lesson.pedagogy && (
            <details className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
              <summary className="cursor-pointer font-semibold">
                Đầu ra và nguồn học liệu
              </summary>
              <div className="mt-3 space-y-3">
                {lesson.pedagogy.outcomes.map((t) => (
                  <p key={t}>• {t}</p>
                ))}
                {lesson.pedagogy.sources.map((s, i) => (
                  <div key={i}>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-700 underline"
                    >
                      {s.provider} — {s.title}
                    </a>
                    <p className="mt-1 text-xs text-slate-500">{s.rights}</p>
                  </div>
                ))}
              </div>
            </details>
          )}
          <div id="lesson-navigation" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
            <button
              disabled={!previous}
              onClick={() => onSelect(previous)}
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-600 disabled:opacity-40"
            >
              <ArrowLeft size={17} />
              Bài trước
            </button>
            <div className="flex flex-wrap gap-2">
              
{lesson.type !== "quiz" && (
  <div className="rounded-xl bg-blue-50 px-4 py-2.5 text-sm text-blue-800">
    {done[lesson.id]
      ? "Bài học đã được ghi nhận hoàn thành."
      : "Hãy học nội dung và đạt quiz của bài này để hoàn thành."}
  </div>
)}

              
{next && (
  <button
    type="button"
    onClick={() => onSelect(next)}
    disabled={!!next.locked}
    title={
      next.locked
        ? "Hoàn thành quiz bài hiện tại để mở khóa"
        : undefined
    }
    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
  >
    {next.locked
      ? "Bài tiếp theo đang khóa"
      : next.type === "quiz"
        ? "Bài kiểm tra"
        : "Bài kế tiếp"}

    {next.locked ? (
      <Lock size={17} />
    ) : (
      <ArrowRight size={17} />
    )}
  </button>
)}

            </div>
          </div>
        </main>
        <aside className="classroom-related hidden space-y-5 p-4 xl:block 2xl:p-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="font-bold">Tài liệu liên quan</h2>
              <button
                onClick={() => scrollToSection("lesson-documents")}
                className="shrink-0 text-xs font-semibold text-blue-600 hover:underline"
              >
                Xem tất cả
              </button>
            </div>
            {documents.length ? (
              <ResourceLinks resources={documents} />
            ) : (
              <p className="text-sm text-slate-500">
                Chưa có tài liệu đính kèm.
              </p>
            )}
          </section>
          {exercise && (
            <section className="rounded-2xl border border-slate-200 bg-white p-4">
              <h2 className="font-bold">Bài tập của bài học</h2>
              <p className="my-3 text-sm leading-6 text-slate-500">
                Tự luyện và đối chiếu gợi ý sau khi học.
              </p>
              <button
                onClick={() => scrollToSection("lesson-exercises")}
                className="w-full rounded-xl bg-blue-50 p-3 text-sm font-bold text-blue-700"
              >
                Làm bài tập →
              </button>
            </section>
          )}
          {next && (
            <section className="rounded-2xl border border-slate-200 bg-white p-4">
              <h2 className="mb-3 font-bold">Bài học tiếp theo</h2>
              <div className="flex items-start gap-3">
                <CourseImage
                  course={course}
                  className="h-16 w-16 shrink-0 rounded-xl object-cover"
                />
                <div className="min-w-0">
                  <p className="home-balanced text-sm font-semibold">
                    {next.title}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {next.type === "quiz"
                      ? "Bài kiểm tra"
                      : "Tiếp tục hành trình học"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onSelect(next)}
                disabled={!!next.locked}
                className="mt-3 w-full rounded-lg bg-blue-50 px-3 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              >
                {next.locked ? "Bài tiếp theo đang khóa" : "Tiếp tục học →"}
              </button>
            </section>
          )}
          <section className="rounded-2xl border border-slate-200 bg-white p-4">
            <h2 className="home-balanced font-bold">Tiến độ học tập</h2>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              {section?.title}
            </p>
            <div className="mb-2 mt-4 flex items-center justify-between text-sm">
              <p>
                <strong className="text-slate-800">
                  {sectionDone}/{sectionStudy.length}
                </strong>{" "}
                <span className="text-slate-500">bài học</span>
              </p>
              <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">
                {sectionPercent}%
              </span>
            </div>
            <div
              role="progressbar"
              aria-label="Tiến độ chương hiện tại"
              aria-valuenow={sectionPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              className="h-2 overflow-hidden rounded-full bg-slate-100"
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-600 to-sky-400"
                style={{
                  width: `${sectionPercent}%`,
                }}
              />
            </div>
            <ul className="mt-4 space-y-3 text-[13px] text-slate-600">
              {[
                ["bg-emerald-500", sectionDone, "bài đã hoàn thành"],
                ["bg-slate-300", sectionNew, "bài chưa học"],
                ["bg-blue-500", sectionCurrent, "bài đang học"],
              ].map(([color, count, label]) => (
                <li key={label} className="flex items-center gap-2.5">
                  <span
                    aria-hidden="true"
                    className={`h-2.5 w-2.5 rounded-full ${color}`}
                  />
                  <span>
                    <strong className="font-semibold text-slate-800">
                      {count}
                    </strong>{" "}
                    {label}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 flex items-center gap-2 text-xs text-slate-500">
              <Clock size={14} />
              Tiến độ lưu theo tài khoản của bạn
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}

