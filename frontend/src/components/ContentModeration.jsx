import { useCallback, useEffect, useState } from "react";
import { api } from "../services/api";
import CourseImage from "./CourseImage";

const apiBase = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");
const kindLabel = {
  PDF: "PDF",
  VIDEO: "Video bài giảng",
  DOCUMENT: "Tài liệu",
  LINK: "Liên kết",
};

export default function ContentModeration({ auth, act, busy }) {
  const [courses, setCourses] = useState([]);
  const [notes, setNotes] = useState({});
  const [preview, setPreview] = useState(null);
  const [previewError, setPreviewError] = useState("");
  const [openingCourseId, setOpeningCourseId] = useState(null);
  const [quizDetail, setQuizDetail] = useState(null);
  const [quizLoadingId, setQuizLoadingId] = useState(null);
  const [quizError, setQuizError] = useState("");
  const [quizErrorId, setQuizErrorId] = useState(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("ALL");

  const load = useCallback(
    () => api.platform("/moderation", auth.accessToken).then(setCourses),
    [auth.accessToken],
  );
  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [load]);

  const decide = (c, decision) =>
    act(async () => {
      const result = await api.platform(
        `/moderation/${c.id}`,
        auth.accessToken,
        { decision, note: notes[c.id] || "" },
      );
      await load();
      return result;
    });

  const openPreview = async (course) => {
    setPreviewError("");
    setQuizDetail(null);
    setQuizError("");
    setOpeningCourseId(course.id);
    try {
      const result = await api.platform(
        `/courses/${course.id}/content`,
        auth.accessToken,
      );
      setPreview({ ...result, courseId: course.id, courseTitle: course.title });
    } catch (e) {
      setPreviewError(`Không tải được nội dung: ${e.message}`);
    } finally {
      setOpeningCourseId(null);
    }
  };

  const closePreview = () => {
    setPreview(null);
    setQuizDetail(null);
    setQuizError("");
    setPreviewError("");
  };

  const viewResource = async (resource) => {
    setPreviewError("");
    const link = String(resource.resource_url || "");
    const resourceId = Number(resource.resource_id);

    if (link.startsWith("vedu-file:")) {
      // Open synchronously to avoid Chrome's popup blocker after an await.
      const tab = window.open("about:blank", "_blank");
      if (!tab) {
        setPreviewError("Trình duyệt đang chặn tab mới. Cho phép VEDU mở tab để xem PDF.");
        return;
      }
      try {
        if (!Number.isSafeInteger(resourceId) || resourceId <= 0) {
          throw new Error("Mã tài liệu không hợp lệ.");
        }
        const response = await fetch(
          `${apiBase}/platform/moderation/resources/${resourceId}/file`,
          { headers: { Authorization: `Bearer ${auth.accessToken}` } },
        );
        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          const message = Array.isArray(payload?.message)
            ? payload.message.join(", ")
            : payload?.message;
          throw new Error(message || `Không xem được file (HTTP ${response.status})`);
        }
        const file = await response.blob();
        const objectUrl = URL.createObjectURL(file);
        tab.location.replace(objectUrl);
        setTimeout(() => URL.revokeObjectURL(objectUrl), 120000);
      } catch (e) {
        tab.close();
        setPreviewError(`Không mở được tài liệu: ${e.message}`);
      }
      return;
    }

    if (/^https:\/\//i.test(link) || /^\/course-materials\//.test(link)) {
      window.open(link, "_blank", "noopener,noreferrer");
    } else {
      setPreviewError("Tài liệu chưa có đường dẫn hợp lệ để xem.");
    }
  };

  const viewQuiz = async (quizId) => {
    if (Number(quizDetail?.quizId) === Number(quizId)) {
      setQuizDetail(null);
      return;
    }
    setQuizError("");
    setQuizLoadingId(quizId);
    try {
      const details = await api.platform(
        `/moderation/quizzes/${quizId}`,
        auth.accessToken,
      );
      setQuizDetail(details);
    } catch (e) {
      setQuizDetail(null);
      setQuizErrorId(quizId);
      setQuizError(`Không tải được câu hỏi quiz: ${e.message}`);
    } finally {
      setQuizLoadingId(null);
    }
  };

  const quizzesForLesson = (lessonId) =>
    (preview?.quizzes || []).filter(
      (quiz) => quiz.lesson_id != null && Number(quiz.lesson_id) === Number(lessonId),
    );

  const renderQuiz = (quiz) => {
    const expanded = Number(quizDetail?.quizId) === Number(quiz.quiz_id);
    return (
      <div key={quiz.quiz_id} className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-semibold text-slate-900">{quiz.title}</div>
            <div className="mt-1 text-xs text-slate-600">
              {quiz.is_published ? "Đã công bố" : "Bản nháp"} · Điểm đạt: {quiz.passing_score}/10
            </div>
          </div>
          <button
            type="button"
            disabled={quizLoadingId === quiz.quiz_id}
            onClick={() => viewQuiz(quiz.quiz_id)}
            className="rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm font-semibold text-indigo-700 disabled:opacity-50"
          >
            {quizLoadingId === quiz.quiz_id
              ? "Đang tải..."
              : expanded
                ? "Thu gọn câu hỏi"
                : "Xem câu hỏi và đáp án"}
          </button>
        </div>
        {quizError && Number(quizErrorId) === Number(quiz.quiz_id) && (
          <p role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {quizError}
          </p>
        )}
        {expanded && (
          <div className="mt-3 space-y-3 border-t border-indigo-100 pt-3">
            {(quizDetail.questions || []).length ? (
              quizDetail.questions.map((question, index) => (
                <div key={question.id ?? index} className="rounded-lg border border-slate-200 bg-white p-3">
                  <p className="font-semibold text-slate-900">Câu {index + 1}. {question.text}</p>
                  <p className="mb-2 mt-1 text-xs text-slate-500">{question.type}</p>
                  <div className="space-y-1">
                    {(question.options || []).map((answer, answerIndex) => (
                      <div
                        key={answer.id ?? answerIndex}
                        className={`rounded-md px-3 py-2 text-sm ${answer.correct ? "border border-emerald-200 bg-emerald-50 text-emerald-800" : "bg-slate-50 text-slate-700"}`}
                      >
                        {String.fromCharCode(65 + answerIndex)}. {answer.text}
                        {answer.correct && <strong> — Đáp án đúng</strong>}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-amber-700">Quiz chưa có câu hỏi.</p>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border bg-white p-5">
        <h2 className="text-xl font-bold">Kiểm duyệt nội dung</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Kiểm tra độ chính xác, nguồn học liệu, quyền sử dụng và tính đầy đủ
          trước khi công khai. Xem bài học, tài liệu, video và quiz; sau đó nhập
          nhận xét để duyệt, yêu cầu sửa hoặc ẩn khóa học.
        </p>
        <select
          aria-label="Lọc kiểm duyệt"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="mt-3 rounded-xl border p-2"
        >
          <option value="ALL">Tất cả khóa học</option>
          <option value="PENDING">Đang chờ duyệt</option>
          <option value="PUBLISHED">Đang công khai</option>
          <option value="DRAFT">Bản nháp</option>
          <option value="ARCHIVED">Đã ẩn</option>
        </select>
      </div>
      {error && <p role="alert" className="text-red-700">{error}</p>}
      {previewError && !preview && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{previewError}</p>
      )}
      <div className="grid gap-4 xl:grid-cols-2">
        {courses
          .filter((c) => filter === "ALL" || c.reviewStatus === filter || c.status === filter)
          .map((c) => (
            <article key={c.id} className="overflow-hidden rounded-2xl border bg-white">
              <CourseImage course={c} className="h-32 w-full object-cover" />
              <div className="space-y-3 p-5">
                <h3 className="font-bold">{c.title}</h3>
                <p className="text-sm text-slate-600">
                  {c.instructor} · {c.publishedLessons}/{c.lessons} bài công bố · {c.status} · {c.reviewStatus}
                </p>
                {c.reviewNote && <p className="text-sm">Nhận xét gần nhất: {c.reviewNote}</p>}
                <button
                  type="button"
                  disabled={openingCourseId === c.id}
                  className="font-semibold text-blue-700 disabled:opacity-50"
                  onClick={() => openPreview(c)}
                >
                  {openingCourseId === c.id ? "Đang tải nội dung..." : "Xem nội dung bài học"}
                </button>
                <textarea
                  aria-label={`Nhận xét ${c.title}`}
                  required
                  maxLength={2000}
                  value={notes[c.id] || ""}
                  onChange={(e) => setNotes({ ...notes, [c.id]: e.target.value })}
                  placeholder="Nhập nhận xét kiểm duyệt (bắt buộc)"
                  className="w-full rounded-xl border p-3 text-sm"
                />
                <div className="flex flex-wrap gap-2">
                  {[
                    ["APPROVED", "Duyệt công khai"],
                    ["CHANGES_REQUESTED", "Trả về chỉnh sửa"],
                    ["HIDDEN", "Ẩn khóa"],
                  ].map(([d, label]) => (
                    <button
                      key={d}
                      type="button"
                      disabled={busy || !notes[c.id]?.trim()}
                      onClick={() => decide(c, d)}
                      className="rounded-lg border px-3 py-2 text-sm font-semibold disabled:opacity-40"
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <details>
                  <summary className="cursor-pointer text-sm">Lịch sử kiểm duyệt ({c.history?.length || 0})</summary>
                  {(c.history || []).map((h, i) => (
                    <p key={i} className="mt-2 text-xs">
                      {new Date(h.at).toLocaleString("vi-VN")} · {h.reviewer} · {h.decision}: {h.note}
                    </p>
                  ))}
                </details>
              </div>
            </article>
          ))}
      </div>

      {preview && (
        <div role="dialog" aria-modal="true" aria-label="Xem nội dung kiểm duyệt" className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 p-4">
          <div className="mx-auto max-w-4xl space-y-5 rounded-2xl bg-white p-5 sm:p-6">
            <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b bg-white py-3">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">Kiểm duyệt khóa học: {preview.courseTitle}</h2>
                <p className="mt-1 text-xs text-slate-500">
                  {(preview.lessons || []).length} bài học · {(preview.quizzes || []).length} quiz
                </p>
              </div>
              <button type="button" className="shrink-0 rounded-lg border px-4 py-2 font-bold text-blue-700" onClick={closePreview}>Đóng</button>
            </div>
            {previewError && <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{previewError}</div>}
            {quizError && <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{quizError}</div>}
            {(preview.lessons || []).length ? (
              (preview.lessons || []).map((lesson, index) => {
                const lessonQuizzes = quizzesForLesson(lesson.lesson_id);
                return (
                  <article key={lesson.lesson_id} className="space-y-3 rounded-xl border border-slate-200 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-base font-extrabold text-slate-900">Bài {index + 1}: {lesson.title}</h3>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${lesson.is_published ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                        {lesson.is_published ? "Đã công bố" : "Bản nháp"}
                      </span>
                    </div>
                    <div>
                      <h4 className="mb-1 text-sm font-semibold text-slate-800">1. Nội dung bài học</h4>
                      <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{lesson.content || "Chưa có nội dung văn bản."}</p>
                    </div>
                    <div>
                      <h4 className="mb-2 text-sm font-semibold text-slate-800">2. Video và tài liệu PDF</h4>
                      {(lesson.resources || []).length ? (
                        <div className="space-y-2">
                          {(lesson.resources || []).map((resource) => (
                            <div key={resource.resource_id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-50 p-3">
                              <div className="text-sm">
                                <strong>{kindLabel[resource.resource_type] || resource.resource_type}: </strong>
                                {resource.title}
                              </div>
                              <button type="button" onClick={() => viewResource(resource)} className="rounded-md border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-blue-700">
                                {resource.resource_type === "PDF" ? "Mở PDF ↗" : "Xem tài liệu ↗"}
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-amber-700">Bài này chưa có video hoặc tài liệu.</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-slate-800">3. Quiz của bài học ({lessonQuizzes.length})</h4>
                      {lessonQuizzes.length ? lessonQuizzes.map(renderQuiz) : (
                        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Chưa có quiz gắn với bài học này.</p>
                      )}
                    </div>
                  </article>
                );
              })
            ) : <p className="text-sm text-amber-700">Khóa học chưa có bài học.</p>}
            <section className="space-y-2 rounded-xl border border-blue-200 bg-blue-50/30 p-4">
              <h3 className="font-bold text-slate-900">Đề kiểm tra cuối khóa</h3>
              {(preview.quizzes || []).filter((q) => q.lesson_id == null).length ? (
                (preview.quizzes || []).filter((q) => q.lesson_id == null).map(renderQuiz)
              ) : (
                <p className="text-sm text-amber-700">Chưa có đề kiểm tra cuối khóa.</p>
              )}
            </section>
            <p className="text-xs text-slate-500">Chế độ kiểm duyệt chỉ xem dữ liệu; không tạo lượt làm quiz hoặc thay đổi tiến độ học viên.</p>
          </div>
        </div>
      )}
    </section>
  );
}
