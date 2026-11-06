import { useState } from "react";
import CourseStartGuide from "./CourseStartGuide";
import CourseImage from "./CourseImage";
import CourseIntroduction from "./CourseIntroduction";
import {
  ArrowLeft,
  PlayCircle,
  FileText,
  HelpCircle,
  CheckCircle,
  Star,
  Users,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function CourseDetail({
  course,
  onBack,
  onStartLearning,
  onStartQuiz,
  studyState,
  studyLoading = false,
  studyError = "",
}) {
  const [openSections, setOpenSections] = useState({ "course-content": true });
  const urgentSectionId = studyState?.pendingAssignment?.section_id == null
    ? (studyState?.pendingAssignment ? "course-assessment" : null)
    : String(studyState.pendingAssignment.section_id);
  const isSectionOpen = (sectionId) => openSections[sectionId] ?? String(sectionId) === String(urgentSectionId);

  const allLessons = course.sections.flatMap((section) => section.lessons);
  const validQuizId = (id) => Number.isSafeInteger(Number(id)) && Number(id) > 0;
  const resolveQuizId = (lesson) =>
    validQuizId(lesson?.quizId)
      ? Number(lesson.quizId)
      : lesson?.type === 'quiz' && validQuizId(studyState?.finalQuizId)
        ? Number(studyState.finalQuizId)
        : null;
  const firstLearningLesson = allLessons.find(
    (lesson) => lesson.type !== "quiz",
  );
  const completed = studyState?.state === "COMPLETED";
  const started = studyState?.state === "IN_PROGRESS";
  const entryLabel = completed
    ? "Ôn tập"
    : started
      ? "Tiếp tục học"
      : "Bắt đầu học";
  const entryLessonId = studyState?.lessonId ?? firstLearningLesson?.id;

  const toggleSection = (secId) => {
    setOpenSections((prev) => ({
      ...prev,
      [secId]: !(prev[secId] ?? String(secId) === String(urgentSectionId)),
    }));
  };

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-blue-600 transition"
        >
          <ArrowLeft size={18} />
          <span>Quay lại trang chủ</span>
        </button>

        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-4">
            <span className="px-3 py-1 bg-blue-50 text-blue-700 font-semibold text-xs rounded-full">
              Học theo mục tiêu · Theo dõi tiến độ
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight">
              {course.title}
            </h1>
            <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
              {course.description}
            </p>
            <a
              href="#truoc-khi-hoc"
              className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-bold text-blue-700 hover:bg-blue-100"
            >
              <FileText size={18} />
              Xem đề cương & yêu cầu khóa học
            </a>

            <div className="flex flex-wrap items-center gap-6 pt-2 text-sm text-gray-500">
              <div className="flex items-center gap-1.5 text-amber-500 font-bold">
                <Star size={18} fill="currentColor" />
                <span>{course.rating ?? "Chưa có đánh giá"}</span>
                <span className="text-gray-400 font-normal">
                  ({course.students} học viên)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users size={16} />
                <span>
                  Giảng viên:{" "}
                  <strong className="text-gray-800">{course.instructor}</strong>
                </span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl p-6 shadow-xl space-y-6">
            <CourseImage
              course={course}
              className="aspect-[16/9] w-full rounded-xl object-cover"
            />
            <div>
              <p className="text-xs uppercase tracking-wider text-blue-200 font-semibold">
                Trạng thái học tập
              </p>
              <h3 className="text-2xl font-extrabold mt-1">
                {studyLoading
                  ? "Đang tải tiến độ…"
                  : completed
                    ? "Đã hoàn thành khóa học"
                    : started
                      ? "Đang học"
                      : "Sẵn sàng học"}
              </h3>
              <p className="text-xs text-blue-100 mt-1">
                {studyError ||
                  (completed
                    ? "Bạn có thể xem lại các bài học bất cứ lúc nào."
                    : started
                      ? `${studyState.completedLessons}/${studyState.totalLessons} bài hoàn thành. Tiếp tục từ tiến độ đã lưu.`
                      : "Bắt đầu với hướng dẫn dành cho người học mới.")}
              </p>
            </div>

            <button
              onClick={() =>
                studyState?.quizId
                  ? onStartQuiz(studyState.quizId)
                  : entryLessonId && onStartLearning(entryLessonId)
              }
              disabled={
                studyLoading ||
                !!studyError ||
                (!entryLessonId && !studyState?.quizId)
              }
              className="w-full py-3.5 bg-white text-blue-700 font-bold rounded-xl hover:bg-blue-50 shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <PlayCircle size={20} />
              <span>{studyLoading ? "Đang tải tiến độ…" : entryLabel}</span>
            </button>
          </div>
        </div>

        <CourseIntroduction course={course} />
        <details className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <summary className="cursor-pointer font-bold text-blue-800">
            Hướng dẫn sử dụng phòng học cho người mới
          </summary>
          <div className="mt-4">
            <CourseStartGuide />
          </div>
        </details>
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h2 className="text-xl font-extrabold text-gray-900">
                Nội dung và thứ tự bài học
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Các bài học, học liệu và bài kiểm tra đã công bố
              </p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 bg-gray-100 rounded-lg text-gray-600">
              {allLessons.filter((l) => Number(l.id) > 0).length} bài học ·{" "}
              {allLessons.filter((l) => Boolean(resolveQuizId(l))).length} bài kiểm tra
            </span>
          </div>

          <div className="space-y-4">
            {course.sections.map((section) => (
              <div
                key={section.id}
                className="border border-gray-200 rounded-2xl overflow-hidden"
              >
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center justify-between p-4 bg-gray-50/70 hover:bg-gray-100/70 transition font-bold text-gray-800 text-left"
                >
                  <span className="text-sm sm:text-base">{section.title}
                    {section.weekStart && <small className="ml-2 font-normal text-slate-500">Tuần gợi ý {section.weekStart}–{section.weekEnd}</small>}
                    {section.required && <small className="ml-2 text-blue-700">Bắt buộc</small>}
                    {section.required && studyState?.modules?.find((item) => String(item.section_id) === String(section.id))?.passed && <small className="ml-2 text-emerald-700">Đã đạt</small>}
                    {section.assignments?.length > 0 && <small className="ml-2 text-violet-700">{section.assignments.length} bài nộp</small>}
                  </span>
                  {isSectionOpen(section.id) ? (
                    <ChevronUp size={20} />
                  ) : (
                    <ChevronDown size={20} />
                  )}
                </button>

                {isSectionOpen(section.id) && (
                  <div className="divide-y divide-gray-100">
                    {section.outcomes?.length > 0 && <div className="p-4 text-sm text-slate-600">
                      <strong>Chuẩn đầu ra</strong>
                      <ul className="list-disc pl-5">{section.outcomes.map((outcome) => <li key={outcome}>{outcome}</li>)}</ul>
                    </div>}
                    {section.id === "course-assessment" && studyState?.missingModules?.length > 0 && !studyState.finalExamPassed && <p className="p-4 text-sm text-amber-800">
                      Cần đạt mô-đun trước khi thi: {studyState.missingModules.map((module) => module.title).join(", ")}.
                    </p>}
                    {section.lessons.map((lesson) => (
                      <div
                        key={lesson.id}
                        className="p-4 flex items-center justify-between hover:bg-blue-50/40 transition cursor-pointer"
                        onClick={() => {
                          if (lesson.type === "quiz") {
                            const id = resolveQuizId(lesson);
                            if (id) onStartQuiz(id);
                          } else onStartLearning(lesson.id);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          {lesson.type === "video" && (
                            <PlayCircle size={18} className="text-blue-600" />
                          )}
                          {lesson.type === "pdf" && (
                            <FileText size={18} className="text-emerald-600" />
                          )}
                          {lesson.type === "quiz" && (
                            <HelpCircle size={18} className="text-amber-500" />
                          )}

                          <div>
                            <p className="text-sm font-semibold text-gray-800 hover:text-blue-600 transition">
                              {lesson.title}
                            </p>
                            <span className="text-xs text-gray-400 capitalize">
                              {lesson.type === 'quiz' && !resolveQuizId(lesson)
                                ? (studyLoading ? 'Đang tải bài kiểm tra…' : 'Chưa có bài kiểm tra được công bố')
                                : lesson.type}
                            </span>
                            {lesson.type !== "quiz" && validQuizId(lesson.quizId) && <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">Quiz mô-đun</span>}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {(lesson.type === 'quiz' && studyState?.finalExamPassed === true &&
                            Number(resolveQuizId(lesson)) > 0 && Number(resolveQuizId(lesson)) === Number(studyState?.finalQuizId)) ||
                          studyState?.completedQuizIds?.includes(
                            resolveQuizId(lesson),
                          ) ||
                          studyState?.completedLessonIds?.includes(lesson.id) ||
                          lesson.completed ? (
                            <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                              <CheckCircle size={14} /> Hoàn thành
                            </span>
                          ) : (
                            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                              Học ngay
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    {(section.assignments || []).map((assignment) => <div key={`assignment-${assignment.assignment_id}`} className="flex items-center justify-between gap-3 bg-violet-50/50 p-4">
                      <div><p className="text-sm font-semibold text-violet-900">{assignment.title}</p><p className="text-xs text-violet-700">Bài nộp {assignment.required ? "bắt buộc" : "tự luyện"} · đạt từ {assignment.passing_score}/10</p></div>
                      <button className="rounded-lg bg-violet-700 px-3 py-2 text-xs font-bold text-white" onClick={() => {
                        const first = section.lessons.find((item) => item.type !== "quiz");
                        if (first) onStartLearning(first.id);
                        else if (studyState?.finalQuizId) onStartQuiz(studyState.finalQuizId);
                      }}>Mở bài nộp</button>
                    </div>)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
