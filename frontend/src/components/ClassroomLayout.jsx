import { useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
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
import CourseAssignments from "./CourseAssignments";
import ResourceFileIcon from "./ResourceFileIcon";
import { resourceFormat } from "../services/resources";
import { formatMinutes } from "../services/time";
import { youtubeId } from "../services/video";

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

function SupplementaryVideos({ resources, primaryUrl }) {
  const videos = resources.filter(
    (resource) => resource.type === "VIDEO" && resource.url !== primaryUrl,
  );
  if (!videos.length) return null;
  return (
    <div className="space-y-4 rounded-xl border border-blue-100 bg-blue-50 p-4">
      <h3 className="font-bold text-slate-900">Video bổ trợ của bài học</h3>
      {videos.map((resource) => {
        const id = youtubeId(resource.url);
        return (
          <div key={resource.id} className="space-y-2">
            <p className="text-sm font-semibold text-slate-700">{resource.title}</p>
            {id ? (
              <iframe
                title={resource.title}
                src={`https://www.youtube-nocookie.com/embed/${id}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="aspect-video w-full rounded-xl bg-black"
              />
            ) : (
              <video
                controls
                preload="metadata"
                src={resource.url}
                className="aspect-video w-full rounded-xl bg-black"
              />
            )}
          </div>
        );
      })}
      <p className="text-xs leading-5 text-slate-500">
        Video bổ trợ phát trực tiếp trong VEDU nhưng không cộng dồn vào chỉ số xem của video chính.
      </p>
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
  onMarkLearned,
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const index = lessons.findIndex((l) => l.id === lesson.id),
    next = lessons[index + 1],
    previous = lessons[index - 1];
  const section = course.sections.find((s) =>
    s.lessons.some((l) => l.id === lesson.id),
  );
  const isIntroduction = section?.moduleType === "INTRO";
  const urgentSection = course.sections.find((s) => (s.assignments || []).some((a) => a.latestVersion?.status === "NEEDS_REVISION"));
  const [open, setOpen] = useState({ [urgentSection?.id || section?.id]: true });
  const resources = lesson.resources || [],
    documents = resources.filter((r) => r.type !== "VIDEO");
  const localSlide = documents.find(
    (r) =>
      r.url?.startsWith("/course-materials/") && !r.url.endsWith("/00.html"),
  );
  const text = lesson.content?.replace(/^\[VEDU-LESSON:.*\]\n/, "") || "";
  const detectedExercise = text.match(
    /(?:BÀI TẬP NHỎ|BÀI TẬP|NHIỆM VỤ|THỰC HÀNH)[\s\S]*/i,
  )?.[0];
  const exercise = isIntroduction ? null : detectedExercise;
  const introLessonIds = new Set(
    course.sections
      .filter((item) => item.moduleType === "INTRO")
      .flatMap((item) => item.lessons)
      .map((item) => item.id),
  );
  const study = lessons.filter(
    (l) => l.type !== "quiz" && !introLessonIds.has(l.id),
  ),
    completed = study.filter((l) => done[l.id]).length;
  const percent = study.length
    ? Math.round((completed / study.length) * 100)
    : 0;
  const sectionStudy = isIntroduction
    ? []
    : (section?.lessons || []).filter((l) => l.type !== "quiz");
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
  const lectureText = isIntroduction
    ? "Chào mừng bạn đã đến với khóa học của VEDU! Hãy tiếp tục hành trình học tập."
    : exercise ? text.slice(0, text.indexOf(exercise)).trim() : text;
  const currentAssignments = section?.assignments || [];
  const assignmentId = searchParams.get("assignmentId");
  const hasQuiz = Number(lesson.quizId) > 0;
  const openAssignment = (assignment) => {
    const ownerSection = course.sections.find((item) =>
      (item.assignments || []).some((candidate) => Number(candidate.assignment_id) === Number(assignment.assignment_id)),
    );
    if (assignment.section_id == null) {
      if (Number(course.finalQuizId) > 0) navigate(`/quiz/${course.id}/${course.finalQuizId}`);
      return;
    }
    const targetLesson = ownerSection?.lessons?.find((item) => item.type !== "quiz");
    if (targetLesson) navigate(`/learn/${course.id}/${targetLesson.id}?assignmentId=${assignment.assignment_id}`);
  };
  const qaRoute = `/student/discussions?${new URLSearchParams({
    courseId: String(course.id),
    lessonId: String(lesson.id),
    returnTo: `${location.pathname}${location.search}`,
  })}`;
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
                  {s.moduleType === "INTRO" ? (
                    "Thông tin"
                  ) : s.lessons.some((l) => l.type !== "quiz") ? (
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
                  {s.mastery?.state === "PASSED" && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">Đạt</span>}
                  {s.mastery?.state === "NEEDS_REVISION" && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">Cần sửa</span>}
                  {s.required && s.mastery?.state !== "PASSED" && s.mastery?.state !== "NEEDS_REVISION" && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">Bắt buộc</span>}
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
      aria-current={l.id === lesson.id ? "step" : undefined}
      className={`relative flex w-full items-start gap-3 rounded-xl p-3 text-left text-sm transition ${
        l.id === lesson.id
          ? "bg-gradient-to-r from-blue-100/90 to-blue-50/80 text-blue-700 ring-1 ring-blue-100"
          : "text-slate-600 hover:bg-slate-50"
      }`}
    >
      <span
        className={`relative z-10 mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border-[3px] border-white shadow-sm ${
          done[l.id]
            ? "bg-emerald-500 text-white"
            : l.id === lesson.id
              ? "bg-blue-600 text-white ring-2 ring-blue-100"
              : "bg-white text-slate-400 ring-1 ring-slate-200"
        }`}
      >
        {done[l.id] ? (
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
        <span className="home-balanced block font-medium leading-5">{l.title}</span>
        {!introLessonIds.has(l.id) && done[l.id] && (
          <small className="mt-1 block text-xs text-emerald-700">Đã học / đạt quiz</small>
        )}
        {!introLessonIds.has(l.id) && l.type !== "quiz" && Number(l.quizId) > 0 && !done[l.id] && <small className="mt-1 block text-xs font-semibold text-amber-700">Có quiz cuối bài</small>}
        {l.type === "quiz" && l.durationSeconds > 0 && (
          <small className="mt-1 block text-slate-400">
            {formatMinutes(l.durationSeconds)} làm bài
          </small>
        )}
      </span>
    </button>
  </div>
))}
                    {(s.assignments || []).map((assignment) => <button key={`assignment-${assignment.assignment_id}`} type="button" onClick={() => openAssignment(assignment)} className={`ml-3 flex w-[calc(100%-0.75rem)] items-start gap-2 rounded-xl p-3 text-left text-sm ${assignment.latestVersion?.status === "NEEDS_REVISION" ? "bg-amber-50 text-amber-800" : "bg-violet-50 text-violet-800"}`}>
                      <FileText size={16} className="mt-0.5 shrink-0" /><span><strong className="block">{assignment.title}</strong><small>{assignment.latestVersion?.status === "NEEDS_REVISION" ? "Cần sửa và nộp lại" : assignment.latestVersion?.status === "GRADED" ? "Đã chấm" : assignment.latestVersion?.status === "SUBMITTED" ? "Đã nộp" : "Bài nộp"}</small></span>
                    </button>)}

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
                to={qaRoute}
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
            {section?.weekStart && <span>Tuần gợi ý {section.weekStart}–{section.weekEnd}</span>}
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
            {!isIntroduction && <span
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${done[lesson.id] ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"}`}
            >
              <CheckCircle2 size={15} />
              {done[lesson.id] ? "Đã hoàn thành" : "Đang học"}
            </span>}
          </div>
          {isIntroduction && (
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
          {!isGuest && token && currentAssignments.length > 0 && <CourseAssignments courseId={course.id} token={token} sectionId={section?.id} assignmentId={assignmentId} />}
          {notice && (
            <p
              role="status"
              className="rounded-xl bg-blue-50 p-3 text-sm text-blue-800"
            >
              {notice}
            </p>
          )}
          <>
              {!isIntroduction && <section
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
                        xác nhận hoàn thành bài học. Các bài khác luôn có thể xem.
                      </p>
                    </div>
                    <SupplementaryVideos resources={resources} primaryUrl={lesson.videoUrl} />
                  </>
                ) : (
                  <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">
                    Giảng viên chưa gắn video cho bài học này. Bạn có thể xem tài liệu
                    và làm quiz nếu bài đã có quiz.
                  </p>
                )}
              </section>}

              <section
                id="lesson-documents"
                className="scroll-mt-24 space-y-3 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6"
              >
                <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                  <FileText size={21} className="text-blue-600" />
                  {isIntroduction ? "Tài liệu giới thiệu và đề cương" : "2. Tài liệu bài học (PDF / slide)"}
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

              {!isIntroduction && lesson.type !== "quiz" && hasQuiz && (
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
          {lesson.pedagogy?.sources?.length > 0 && (
            <details className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
              <summary className="cursor-pointer font-semibold">
                Nguồn học liệu
              </summary>
              <div className="mt-3 space-y-3">
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
              
{!isIntroduction && lesson.type !== "quiz" && (
  <div className="rounded-xl bg-blue-50 px-4 py-2.5 text-sm text-blue-800">
    {done[lesson.id]
      ? "Bài học đã được ghi nhận là đã học."
      : hasQuiz
        ? "Hãy học nội dung và đạt quiz của bài này để ghi nhận đã học."
        : "Bài này không có quiz. Hãy tự xác nhận sau khi đã học nội dung; việc này không tự làm module đạt."}
    {!done[lesson.id] && !hasQuiz && <button type="button" onClick={() => onMarkLearned(lesson.id)} className="ml-3 rounded-lg bg-blue-700 px-3 py-1.5 font-bold text-white">Đánh dấu đã học</button>}
  </div>
)}

              
{next && (
  <button
    type="button"
    onClick={() => onSelect(next)}
    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white"
  >
    {next.type === "quiz" ? "Bài kiểm tra" : "Bài kế tiếp"}
    <ArrowRight size={17} />
  </button>
)}

            </div>
          </div>
        </main>
        <aside className="classroom-related hidden space-y-5 p-4 xl:block 2xl:p-5">
          {!isIntroduction && <section className="rounded-2xl border border-slate-200 bg-white p-4">
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
          </section>}
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
                className="mt-3 w-full rounded-lg bg-blue-50 px-3 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              >
                Tiếp tục học →
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

