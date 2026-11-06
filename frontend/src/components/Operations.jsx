import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../services/api";
import LearningPaths from "./LearningPaths";
import PedagogyEditor from "./PedagogyEditor";
import ContentModeration from "./ContentModeration";
import CourseOverviewEditor from "./CourseOverviewEditor";
import { formatMinutes } from "../services/time";
import TeacherQuizActions from "./TeacherQuizActions";
import CourseAssignments from "./CourseAssignments";

const button =
  "rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50";
const field =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-200";
function Card({ title, children }) {
  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <h2 className="text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}
function Input({ label, ...props }) {
  return (
    <label className="block space-y-1 text-sm font-medium">
      <span>{label}</span>
      <input className={field} {...props} />
    </label>
  );
}
function CourseSelect({ courses, value, onChange, disabled = false }) {
  return (
    <label className="block space-y-1 text-sm font-medium">
      Khóa học
      <select
        className={field}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        <option value="">Chọn khóa học</option>
        {courses.map((c) => (
          <option key={c.courseId ?? c.id} value={c.courseId ?? c.id}>
            {c.courseName ?? c.title}
          </option>
        ))}
      </select>
    </label>
  );
}


export default function Operations({
  page,
  auth,
  data,
  catalog,
  onLogout,
  initialCourseId = "",
  initialLessonId = "",
  initialLessons = [],
}) {

  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const act = async (fn) => {
    setMessage("");
    setBusy(true);
    try {
      const result = await fn();
      setMessage(result?.message || "Đã hoàn tất");
      return result;
    } catch (e) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  };
  
const props = {
  auth,
  data,
  catalog,
  act,
  busy,
  onLogout,
  initialCourseId,
  initialLessonId,
  initialLessons,
};

  const pages = {
    catalog: ContentModeration,
    security: Security,
    discussions: Discussions,
    submissions: StudentSubmissions,
    reports: Reports,
    content: Content,
    "quiz-bank": TeacherQuizPage,
    "final-essay": FinalEssayTeacherPanel,
    mining: Mining,
    assignments: Assignments,
    "ticket-chat": Tickets,
    certificates: Certificates,
    "learning-path": LearningPaths,
  };
  const Component = pages[page];
  return (
    <div className="space-y-5">
      {message && (
        <p
          role="status"
          className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900"
        >
          {message}
        </p>
      )}
      {Component && <Component {...props} />}
    </div>
  );
}
function Security({ auth, act, busy, onLogout }) {
  const [sessions, setSessions] = useState([]),
    [form, setForm] = useState({
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  const load = useCallback(
    () => api.sessions(auth.accessToken).then(setSessions),
    [auth.accessToken],
  );
  useEffect(() => {
    load().catch(() => {});
  }, [load]);
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <Card title="Đổi mật khẩu">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            act(async () => {
              const result = await api.changePassword(form, auth.accessToken);
              alert(result.message);
              onLogout();
              return result;
            });
          }}
        >
          {[
            ["oldPassword", "Mật khẩu hiện tại"],
            ["newPassword", "Mật khẩu mới"],
            ["confirmPassword", "Nhập lại mật khẩu mới"],
          ].map(([key, label]) => (
            <Input
              key={key}
              label={label}
              type="password"
              required
              minLength={key === "oldPassword" ? 1 : 8}
              maxLength={72}
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            />
          ))}
          <p className="text-sm text-slate-500">
            Đổi mật khẩu sẽ đăng xuất tất cả thiết bị. Mật khẩu mới gồm chữ hoa,
            chữ thường và số.
          </p>
          <button disabled={busy} className={button}>
            Đổi mật khẩu
          </button>
        </form>
      </Card>
      <Card title="Phiên đăng nhập">
        <p className="text-sm text-slate-500">
          Thu hồi phiên vô hiệu hóa access token ngay, không đợi 259.200 giây.
        </p>
        {sessions.map((s) => (
          <div
            key={s.sessionId}
            className="flex items-center justify-between gap-3 border-t py-3 text-sm"
          >
            <span>
              {s.deviceInfo || "Trình duyệt"}
              <small className="block text-slate-500">
                {new Date(s.createdAt).toLocaleString("vi-VN")}
              </small>
            </span>
            <button
              className={button}
              disabled={busy || !!s.revokedAt}
              onClick={() =>
                act(async () => {
                  const r = await api.revokeSession(
                    s.sessionId,
                    auth.accessToken,
                  );
                  if (s.sessionId === auth.sessionId) onLogout();
                  else await load();
                  return r;
                })
              }
            >
              {s.revokedAt ? "Đã thu hồi" : "Thu hồi"}
            </button>
          </div>
        ))}
      </Card>
    </div>
  );
}
function StudentSubmissions({ auth }) {
  const [rows, setRows] = useState(null);
  const [filter, setFilter] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    let alive = true;
    api.platform("/my/assignments", auth.accessToken)
      .then((result) => { if (alive) setRows(result); })
      .catch((reason) => { if (alive) setError(reason.message); });
    return () => { alive = false; };
  }, [auth.accessToken]);
  const statusLabel = { NOT_STARTED:"Chưa làm", DRAFT:"Bản nháp", SUBMITTED:"Đã nộp", UNDER_REVIEW:"Đang chấm", NEEDS_REVISION:"Cần sửa", GRADED:"Đã chấm" };
  const visible = (rows || []).filter((row) => !filter || (row.status || "NOT_STARTED") === filter);
  return <Card title="Bài nộp của tôi">
    <p className="text-sm text-slate-600">Mở thẳng đúng mô-đun hoặc đánh giá cuối khóa; bài cần sửa luôn được ưu tiên đầu danh sách.</p>
    <select className={field} value={filter} onChange={(event) => setFilter(event.target.value)} aria-label="Lọc trạng thái bài nộp">
      <option value="">Tất cả trạng thái</option>
      {Object.entries(statusLabel).map(([value,label]) => <option key={value} value={value}>{label}</option>)}
    </select>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {!rows && !error && <p>Đang tải…</p>}
    {visible.map((row) => {
      const status = row.status || "NOT_STARTED";
      const target = row.section_id != null && row.lesson_id
        ? `/learn/${row.course_id}/${row.lesson_id}?assignmentId=${row.assignment_id}`
        : row.final_quiz_id ? `/quiz/${row.course_id}/${row.final_quiz_id}` : `/courses/${row.course_id}`;
      return <article key={row.assignment_id} className={`rounded-xl border p-4 ${status === "NEEDS_REVISION" ? "border-amber-300 bg-amber-50" : "border-slate-200"}`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><h3 className="font-bold">{row.title}</h3><p className="text-sm text-slate-600">{row.course_name} · {row.section_title || "Cuối khóa"}</p></div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">{statusLabel[status] || status}</span>
        </div>
        {row.feedback && <p className="mt-2 text-sm">Phản hồi: {row.feedback}</p>}
        <Link className="mt-3 inline-block rounded-lg bg-blue-700 px-3 py-2 text-sm font-bold text-white" to={target}>{status === "NEEDS_REVISION" ? "Sửa và nộp lại" : "Mở bài"}</Link>
      </article>;
    })}
    {rows && !visible.length && <p className="text-sm text-slate-500">Không có bài ở trạng thái này.</p>}
  </Card>;
}
function Discussions({ auth, data, act, busy }) {
  const [params] = useSearchParams();
  const contextualCourse = params.get("courseId") || "";
  const lessonId = params.get("lessonId") || "";
  const questionId = params.get("questionId") || "";
  const returnTo = params.get("returnTo") || "";
  const [course, setCourse] = useState(contextualCourse),
    [questions, setQuestions] = useState([]),
    [subject, setSubject] = useState(""),
    [body, setBody] = useState(""),
    [replies, setReplies] = useState({});
  const load = () =>
    api
      .platform(`/courses/${course}/questions`, auth.accessToken)
      .then(setQuestions);
  useEffect(() => {
    if (!course) return;
    let alive = true;
    api.platform(`/courses/${course}/questions`, auth.accessToken)
      .then((rows) => { if (alive) setQuestions(rows); })
      .catch(() => {});
    return () => { alive = false; };
  }, [course, auth.accessToken]);
  useEffect(() => {
    if (!questionId || !questions.length) return;
    document.getElementById(`question-${questionId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [questionId, questions]);
  const selectedCourse = (data.courses || []).find((item) => String(item.id ?? item.courseId ?? item.course_id) === String(course));
  return (
    <Card title="Hỏi đáp khóa học">
      {contextualCourse && <div className="rounded-xl bg-blue-50 p-4 text-sm text-blue-900">
        <strong>{selectedCourse?.title || selectedCourse?.courseName || selectedCourse?.course_name || "Khóa học đang mở"}</strong>
        {lessonId && <p className="mt-1">Hội thoại đang gắn với bài học #{lessonId}.</p>}
        {returnTo && <Link className="mt-2 inline-block font-bold text-blue-700" to={returnTo}>← Quay lại bài học</Link>}
      </div>}
      {!contextualCourse && <>
      <CourseSelect
        courses={data.courses || []}
        value={course}
        onChange={(id) => {
          setCourse(id);
          setQuestions([]);
        }}
      />
      </>}
      {course && (
        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            act(async () => {
              await api.platform(
                `/courses/${course}/questions`,
                auth.accessToken,
                { subject, body, ...(lessonId ? { lessonId: Number(lessonId) } : {}) },
              );
              setSubject("");
              setBody("");
              await load();
            });
          }}
        >
          <Input
            label="Tiêu đề"
            required
            maxLength={200}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
          <textarea
            aria-label="Nội dung câu hỏi"
            required
            maxLength={5000}
            className={field}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <button className={button} disabled={busy}>
            Gửi câu hỏi
          </button>
        </form>
      )}
      {questions.map((q) => (
        <article
          key={q.question_id}
          id={`question-${q.question_id}`}
          className="space-y-3 rounded-xl border p-4"
        >
          <h3 className="font-bold">{q.subject}</h3>
          {q.lesson_title && <p className="text-xs font-semibold text-blue-700">Bài học: {q.lesson_title}</p>}
          {q.messages.map((m) => (
            <div key={m.id} className="rounded-lg bg-slate-50 p-3 text-sm">
              <strong>
                {m.author} · {m.role}
              </strong>
              <p className="mt-1 whitespace-pre-wrap">{m.body}</p>
            </div>
          ))}
          {(auth.user.role !== "STUDENT" || Number(q.author_id) === Number(auth.user.userId ?? auth.user.id)) && <div className="flex gap-2">
            <input
              aria-label={`Trả lời ${q.subject}`}
              className={field}
              maxLength={5000}
              value={replies[q.question_id] || ""}
              onChange={(e) =>
                setReplies({ ...replies, [q.question_id]: e.target.value })
              }
            />
            <button
              className={button}
              disabled={busy || !replies[q.question_id]?.trim()}
              onClick={() =>
                act(async () => {
                  await api.platform(
                    `/questions/${q.question_id}/messages`,
                    auth.accessToken,
                    { body: replies[q.question_id] },
                  );
                  setReplies({ ...replies, [q.question_id]: "" });
                  await load();
                })
              }
            >
              Trả lời
            </button>
          </div>}
        </article>
      ))}
    </Card>
  );
}
function Reports({ auth, data, catalog, act, busy }) {
  const [filters, setFilters] = useState({ courseId: "", from: "", to: "" }),
    [rows, setRows] = useState([]);
  const query = new URLSearchParams(
    Object.entries(filters).filter(([, v]) => v),
  );
  return (
    <Card title="Báo cáo học tập và thanh toán">
      <div className="grid gap-4 sm:grid-cols-3">
        <CourseSelect
          courses={auth.user.role === "ADMIN" ? catalog : data.courses}
          value={filters.courseId}
          onChange={(value) => setFilters({ ...filters, courseId: value })}
        />
        <Input
          label="Từ ngày"
          type="date"
          value={filters.from}
          onChange={(e) => setFilters({ ...filters, from: e.target.value })}
        />
        <Input
          label="Đến ngày"
          type="date"
          value={filters.to}
          onChange={(e) => setFilters({ ...filters, to: e.target.value })}
        />
      </div>
      <div className="flex gap-3">
        <button
          className={button}
          disabled={busy}
          onClick={() =>
            act(() =>
              api.platform(`/reports?${query}`, auth.accessToken).then(setRows),
            )
          }
        >
          Lọc báo cáo
        </button>
        <button
          className={button}
          disabled={busy}
          onClick={() =>
            act(() =>
              api.download(
                `/reports?${query}&format=csv`,
                auth.accessToken,
                "vedu-report.csv",
              ),
            )
          }
        >
          Xuất CSV
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr>
              {[
                "Học viên",
                "Khóa học",
                "Thanh toán",
                "Bài hoàn thành",
                "Xem thực (phút)",
                "Điểm cao nhất",
              ].map((x) => (
                <th className="p-3" key={x}>
                  {x}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr className="border-t" key={r.enrollment_id}>
                {[
                  r.full_name,
                  r.course_name,
                  r.payment_status,
                  r.completed_lessons,
                  formatMinutes(r.actual_seconds),
                  r.best_score ?? "—",
                ].map((v, i) => (
                  <td key={i} className="p-3">
                    {v}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-500">
        Tối đa 10.000 dòng. Giảng viên chỉ xem các khóa được sở hữu/phân công.
        CSV mở được trong Excel, không chạy công thức nhập từ người dùng.
      </p>
    </Card>
  );
}
function Content({ auth, data, act, busy }) {
  const [sectionTitle, setSectionTitle] = useState("");
  const [course, setCourse] = useState(""),
    [content, setContent] = useState(null),
    [lesson, setLesson] = useState(""),
    [form, setForm] = useState({ title: "", type: "PDF", url: "" }),
    [file, setFile] = useState(null);
  const load = () =>
    api
      .platform(`/courses/${course}/content`, auth.accessToken)
      .then(setContent);
  return (
    <div className="space-y-5">
      <Card title="Tài liệu và video thật">
        <CourseSelect
          courses={data.courses || []}
          value={course}
          onChange={(v) => {
            setCourse(v);
            setContent(null);
            setLesson("");
          }}
        />
        <button
          className={button}
          disabled={!course || busy}
          onClick={() => act(load)}
        >
          Tải nội dung khóa học
        </button>
        {content && (
          <>
            <form
              className="flex items-end gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                act(async () => {
                  await api.platform(
                    `/courses/${course}/sections`,
                    auth.accessToken,
                    { title: sectionTitle },
                  );
                  setSectionTitle("");
                  await load();
                });
              }}
            >
              <Input
                label="Tên chương mới"
                required
                maxLength={200}
                value={sectionTitle}
                onChange={(e) => setSectionTitle(e.target.value)}
              />
              <button className={button} disabled={busy}>
                Thêm chương
              </button>
            </form>
            <label className="block text-sm">
              Bài học
              <select
                className={field}
                value={lesson}
                onChange={(e) => setLesson(e.target.value)}
              >
                <option value="">Chọn bài học</option>
                {content.lessons.map((l) => (
                  <option key={l.lesson_id} value={l.lesson_id}>
                    {l.lesson_order}. {l.title}
                  </option>
                ))}
              </select>
            </label>
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                act(async () => {
                  await api.uploadResource(
                    lesson,
                    form,
                    file,
                    auth.accessToken,
                  );
                  await load();
                  return {
  message: "Đã lưu tài liệu. Hãy kiểm tra quiz và trạng thái công bố bài học.",
};
                });
              }}
            >
              <Input
                label="Tên tài liệu"
                value={form.title}
                required
                minLength={2}
                maxLength={200}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
              <label className="block text-sm">
                Loại tài liệu
                <select
                  className={field}
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  {["PDF", "VIDEO", "DOCUMENT", "LINK"].map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </label>
              <Input
                label="URL HTTPS (nếu không tải file)"
                type="url"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
              />
              <Input
                label="Hoặc tải PDF / MP4 từ máy (tối đa 100 MB)"
                type="file"
                accept=".pdf,.mp4"
                onChange={(e) => setFile(e.target.files[0] || null)}
              />
              <button
                className={button}
                disabled={busy || !lesson || (!file && !form.url)}
              >
                Lưu tài liệu
              </button>
            </form>
            <div className="space-y-2">
              {content.lessons.map((l, i) => (
                <div
                  key={l.lesson_id}
                  className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3 text-sm"
                >
                  <div>
                    <strong>
                      #{l.lesson_id} {l.title}
                    </strong>
                    <p>
                      {l.resources
                        .map((r) => `${r.title} (${r.resource_type})`)
                        .join(" · ") || "Chưa có tài liệu"}
                    </p>
                  </div>
                  <button
                    disabled={i === 0 || busy}
                    className="shrink-0 text-blue-700 disabled:opacity-40"
                    onClick={() =>
                      act(async () => {
                        const ids = content.lessons.map((x) =>
                          Number(x.lesson_id),
                        );
                        [ids[i - 1], ids[i]] = [ids[i], ids[i - 1]];
                        await api.platform(
                          `/courses/${course}/lesson-order`,
                          auth.accessToken,
                          { lessonIds: ids },
                          "PATCH",
                        );
                        await load();
                      })
                    }
                  >
                    ↑ Đưa lên
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>
      {content && lesson && (
        <PedagogyEditor
          key={`metadata-${lesson}`}
          lesson={content.lessons.find(
            (l) => String(l.lesson_id) === String(lesson),
          )}
          metadata={content.pedagogy?.find(
            (l) => String(l.lesson_id) === String(lesson),
          )}
          lessons={content.lessons}
          auth={auth}
          act={act}
          busy={busy}
          reload={load}
        />
      )}
      {content && (
        <CourseOverviewEditor
          key={`overview-${course}`}
          courseId={course}
          content={content}
          auth={auth}
          act={act}
          busy={busy}
          reload={load}
        />
      )}
      {content && lesson && (
        <LessonEditor
          key={lesson}
          lesson={content.lessons.find(
            (l) => String(l.lesson_id) === String(lesson),
          )}
          sections={content.sections}
          auth={auth}
          act={act}
          busy={busy}
          reload={load}
        />
      )}
    </div>
  );
}
function LessonEditor({ lesson, sections, auth, act, busy, reload }) {
  const [form, setForm] = useState({
    title: lesson.title,
    content: lesson.content || "",
    durationSeconds: lesson.estimated_duration_seconds || 0,
    isPublished: lesson.is_published,
    sectionId: lesson.section_id || "",
  });
  return (
    <Card title="Chỉnh sửa bài học">
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          act(async () => {
            await api.platform(
              `/lessons/${lesson.lesson_id}`,
              auth.accessToken,
              { ...form, durationSeconds: Number(form.durationSeconds) },
              "PATCH",
            );
            await reload();
          });
        }}
      >
        <Input
          label="Tên bài học"
          required
          maxLength={220}
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <label className="block text-sm">
          Nội dung
          <textarea
            className={field}
            rows={7}
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
          />
        </label>
        <Input
          label="Thời gian đọc (phút); video tải lên tự đo thời lượng"
          type="number"
          min={0}
          max={1440}
          step="any"
          value={
            form.durationSeconds === "" ? "" : Number(form.durationSeconds) / 60
          }
          onChange={(e) =>
            setForm({
              ...form,
              durationSeconds:
                e.target.value === ""
                  ? ""
                  : Math.round(Number(e.target.value) * 60),
            })
          }
        />
        <label className="block text-sm">
          Chương
          <select
            className={field}
            value={form.sectionId}
            onChange={(e) => setForm({ ...form, sectionId: e.target.value })}
          >
            <option value="">Nội dung chung</option>
            {sections.map((s) => (
              <option value={s.section_id} key={s.section_id}>
                {s.title}
              </option>
            ))}
          </select>
        </label>
        <label className="flex gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isPublished}
            onChange={(e) =>
              setForm({ ...form, isPublished: e.target.checked })
            }
          />
          Công bố bài học
        </label>
        <div className="flex gap-3">
          <button className={button} disabled={busy}>
            Lưu bài học
          </button>
          <button
            type="button"
            className="text-sm font-bold text-red-600"
            disabled={busy}
            onClick={() => {
              if (confirm("Lưu trữ bài học? Lịch sử học vẫn được giữ."))
                act(async () => {
                  await api.platform(
                    `/lessons/${lesson.lesson_id}`,
                    auth.accessToken,
                    {},
                    "DELETE",
                  );
                  await reload();
                });
            }}
          >
            Lưu trữ
          </button>
        </div>
      </form>
    </Card>
  );
}

function TeacherQuizPage(props) {
  return (
    <div className="space-y-5">
      <QuizEditor key={props.initialCourseId || "general"} {...props} />
      <TeacherQuizList auth={props.auth} data={props.data} />
    </div>
  );
}

function QuizEditor({
  auth,
  data,
  act,
  busy,
  initialCourseId,
  initialLessons,
}) {
  // Khi mở từ trang Soạn khóa học, lấy khóa học đang chọn.
  // Không tự chọn bài học: giảng viên được chọn từng bài hoặc đề cuối khóa.
  const [course, setCourse] = useState(() => String(initialCourseId ?? "")),
    [title, setTitle] = useState(""),
    [duration, setDuration] = useState(600),
    [passing, setPassing] = useState(7),
    [questions, setQuestions] = useState([
      {
        text: "",
        type: "SINGLE_CHOICE",
        options: [
          { text: "", correct: true },
          { text: "", correct: false },
        ],
      },
    ]);

    const [quizLessonId, setQuizLessonId] = useState("");
    const [quizLessons, setQuizLessons] = useState(() =>
      (Array.isArray(initialLessons) ? initialLessons : []).filter(
        (lesson) => !lesson.is_deleted,
      ),
    );
    const [quizLessonError, setQuizLessonError] = useState("");

  const availableLessons = initialCourseId ? (initialLessons ?? []).filter((lesson) => !lesson.is_deleted) : quizLessons;

  const edit = (index, changes) =>
    setQuestions(
      questions.map((q, i) => (i === index ? { ...q, ...changes } : q)),
    );
  return (
    <Card title="Soạn và công bố bài kiểm tra">
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          act(() =>
            
api.platform(`/courses/${course}/quizzes`, auth.accessToken, {
  lessonId:
    quizLessonId === "final"
      ? null
      : Number(quizLessonId),
  title:
    quizLessonId === "final" &&
    !title.trim().startsWith("Thi cuối khóa —")
      ? `Thi cuối khóa — ${title.trim()}`
      : title.trim(),
  timeLimitSeconds: Number(duration),
  passingScore: Number(passing),
  questions,
  maxAttempts: 3,
}),

          );
        }}
      >
        
<CourseSelect
  courses={data.courses || []}
  value={course}
  disabled={Boolean(initialCourseId)}
  onChange={async (selectedCourse) => {
    setCourse(selectedCourse);
    setQuizLessonId("");
    setQuizLessons([]);
    setQuizLessonError("");

    if (!selectedCourse) return;

    try {
      const content = await api.platform(
        `/courses/${selectedCourse}/content`,
        auth.accessToken,
      );

      setQuizLessons(
        (content.lessons || []).filter(
          (lesson) => !lesson.is_deleted,
        ),
      );
    } catch (error) {
      setQuizLessonError(
        `Không tải được bài học: ${error.message}`,
      );
    }
  }}
/>

{initialCourseId && (
  <p className="text-xs text-slate-500">
    Khóa học đã lấy từ mục Soạn khóa học. Bạn chỉ cần chọn bài học cần kiểm tra
    hoặc chọn đề kiểm tra cuối khóa ở phía dưới.
  </p>
)}

<div className="space-y-2">
  <label className="block text-sm font-semibold text-slate-700">
    Quiz thuộc bài học <span className="text-red-500">*</span>
  </label>

  <select
    required
    value={quizLessonId}
    onChange={(e) => setQuizLessonId(e.target.value)}
    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm"
  >
    <option value="">-- Chọn bài học --</option>

    {availableLessons.map((lesson) => (
      <option
        key={lesson.lesson_id}
        value={lesson.lesson_id}
      >
        Bài {lesson.lesson_order}: {lesson.title}
      </option>
    ))}

    <option value="final">
      Đề kiểm tra cuối khóa (không gắn bài học)
    </option>
  </select>

  {quizLessonError && (
    <p className="text-sm text-red-600">
      {quizLessonError}
    </p>
  )}

  <p className="text-xs leading-5 text-slate-500">
    Quiz của từng bài học được sử dụng để đánh giá
    hoàn thành và mở khóa bài tiếp theo.
    Đề cuối khóa được quản lý riêng.
  </p>
</div>


        <div className="grid gap-3 sm:grid-cols-3">
          <Input
            label="Tên bài thi"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Input
            label="Thời gian (phút)"
            type="number"
            min={10 / 60}
            max={1440}
            step="any"
            required
            value={duration === "" ? "" : Number(duration) / 60}
            onChange={(e) =>
              setDuration(
                e.target.value === ""
                  ? ""
                  : Math.round(Number(e.target.value) * 60),
              )
            }
          />
          <Input
            label="Điểm đạt /10"
            type="number"
            min={0}
            max={10}
            step="0.5"
            value={passing}
            onChange={(e) => setPassing(e.target.value)}
          />
        </div>
        {questions.map((q, i) => (
          <div key={i} className="space-y-3 rounded-xl border p-4">
            <Input
              label={`Câu ${i + 1}`}
              required
              value={q.text}
              onChange={(e) => edit(i, { text: e.target.value })}
            />
            <select
              aria-label={`Loại câu ${i + 1}`}
              className={field}
              value={q.type}
              onChange={(e) =>
                edit(i, {
                  type: e.target.value,
                  options: q.options.map((o, j) => ({
                    ...o,
                    correct: j === 0,
                  })),
                })
              }
            >
              {[
                ["SINGLE_CHOICE", "Một đáp án"],
                ["MULTIPLE_CHOICE", "Nhiều đáp án"],
                ["TRUE_FALSE", "Đúng / sai"],
              ].map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
            {q.options.map((o, j) => (
              <label key={j} className="flex items-center gap-3">
                <input
                  aria-label={`Đáp án đúng ${j + 1}, câu ${i + 1}`}
                  type={q.type === "MULTIPLE_CHOICE" ? "checkbox" : "radio"}
                  checked={o.correct}
                  onChange={() =>
                    edit(i, {
                      options: q.options.map((v, k) => ({
                        ...v,
                        correct:
                          q.type === "MULTIPLE_CHOICE"
                            ? k === j
                              ? !v.correct
                              : v.correct
                            : k === j,
                      })),
                    })
                  }
                />
                <input
                  className={field}
                  required
                  aria-label={`Lựa chọn ${j + 1}, câu ${i + 1}`}
                  value={o.text}
                  onChange={(e) =>
                    edit(i, {
                      options: q.options.map((v, k) =>
                        k === j ? { ...v, text: e.target.value } : v,
                      ),
                    })
                  }
                />
              </label>
            ))}
            <button
              type="button"
              className="text-sm font-bold text-blue-600"
              onClick={() =>
                edit(i, {
                  options: [...q.options, { text: "", correct: false }],
                })
              }
            >
              + Lựa chọn
            </button>
          </div>
        ))}
        <div className="flex gap-3">
          <button
            type="button"
            className={button}
            onClick={() =>
              setQuestions([
                ...questions,
                {
                  text: "",
                  type: "SINGLE_CHOICE",
                  options: [
                    { text: "", correct: true },
                    { text: "", correct: false },
                  ],
                },
              ])
            }
          >
            Thêm câu hỏi
          </button>
          <button className={button} disabled={busy || !course}>
            Công bố bài thi
          </button>
        </div>
        <p className="text-sm text-slate-500">
          Điểm chấm trên máy chủ; đáp án đúng không gửi tới học viên. Hạn nộp
          dựa trên thời gian máy chủ, đáp án được lưu nháp tự động.
        </p>
      </form>
    </Card>
  );
}


function TeacherQuizList({ auth, data }) {
  const quizzes = data?.quizzes || [];

  return (
    <Card title="Danh sách bài kiểm tra đã tạo">
      {quizzes.length === 0 ? (
        <p className="text-sm text-slate-500">
          Chưa có bài kiểm tra nào. Hãy tạo quiz ở phía trên.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b bg-slate-50">
                <th className="px-3 py-3">Tên bài kiểm tra</th>
                <th className="px-3 py-3">Khóa học</th>
                <th className="px-3 py-3">Số câu</th>
                <th className="px-3 py-3">Điểm đạt</th>
                <th className="px-3 py-3">Trạng thái</th>
                <th className="px-3 py-3">Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {quizzes.map((quiz) => (
                <tr key={quiz.quizId} className="border-b">
                  <td className="px-3 py-3 font-semibold">
                    {quiz.title}
                  </td>

                  <td className="px-3 py-3">
                    {quiz.courseName}
                  </td>

                  <td className="px-3 py-3">
                    {quiz.questionCount}
                  </td>

                  <td className="px-3 py-3">
                    {quiz.passingScore}/10
                  </td>

                  <td className="px-3 py-3">
                    <span
                      className={
                        quiz.isPublished
                          ? "text-green-600"
                          : "text-amber-600"
                      }
                    >
                      {quiz.isPublished ? "Đã công bố" : "Bản nháp"}
                    </span>
                  </td>

                  <td className="px-3 py-3">
                    <TeacherQuizActions
                      quizId={quiz.quizId}
                      token={auth.accessToken}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function Assignments({ auth, act, busy }) {
  const [info, setInfo] = useState(null),
    [course, setCourse] = useState(""),
    [teacher, setTeacher] = useState("");
  const load = useCallback(
    () => api.platform("/assignments", auth.accessToken).then(setInfo),
    [auth.accessToken],
  );
  useEffect(() => {
    load().catch(() => {});
  }, [load]);
  return (
    <Card title="Phân công giảng viên">
      {info && (
        <>
          <CourseSelect
            courses={info.courses.map((c) => ({
              courseId: c.course_id,
              courseName: c.course_name,
            }))}
            value={course}
            onChange={setCourse}
          />
          <label className="block text-sm">
            Giảng viên
            <select
              className={field}
              value={teacher}
              onChange={(e) => setTeacher(e.target.value)}
            >
              <option value="">Chọn giảng viên</option>
              {info.teachers.map((t) => (
                <option key={t.user_id} value={t.user_id}>
                  {t.full_name}
                </option>
              ))}
            </select>
          </label>
          <button
            className={button}
            disabled={busy || !course || !teacher}
            onClick={() =>
              act(async () => {
                await api.platform(
                  `/courses/${course}/teachers/${teacher}`,
                  auth.accessToken,
                  {},
                );
                await load();
              })
            }
          >
            Phân công
          </button>
          {info.assignments.map((a) => (
            <div
              key={`${a.course_id}-${a.teacher_id}`}
              className="flex items-center justify-between gap-3 border-t py-3 text-sm"
            >
              <span>
                {
                  info.courses.find((c) => c.course_id === a.course_id)
                    ?.course_name
                }{" "}
                ·{" "}
                {
                  info.teachers.find((t) => t.user_id === a.teacher_id)
                    ?.full_name
                }
              </span>
              <button
                className={button}
                disabled={busy}
                onClick={() =>
                  act(async () => {
                    await api.platform(
                      `/courses/${a.course_id}/teachers/${a.teacher_id}`,
                      auth.accessToken,
                      {},
                      "DELETE",
                    );
                    await load();
                  })
                }
              >
                Gỡ
              </button>
            </div>
          ))}
        </>
      )}
    </Card>
  );
}
function Tickets({ auth, data, act, busy }) {
  const [tickets, setTickets] = useState(data.tickets || []);
  useEffect(() => {
    api
      .platform("/tickets", auth.accessToken)
      .then(setTickets)
      .catch(() => {});
  }, [auth.accessToken]);


  const [teachers, setTeachers] = useState([]);
  const [teachersError, setTeachersError] = useState("");

  useEffect(() => {
    if (auth.user.role !== "ADMIN") return;

    let active = true;

    api.platform("/assignments", auth.accessToken)
      .then((info) => {
        if (!active) return;

        const list = (info.teachers || [])
          .map((teacher) => ({
            id: String(teacher.user_id),
            name: teacher.full_name,
          }))
          .filter((teacher) => teacher.id && teacher.name)
          .sort((a, b) => a.name.localeCompare(b.name, "vi"));

        setTeachers(list);
        setTeachersError("");
      })
      .catch((error) => {
        if (active) {
          setTeachersError(error.message || "Không tải được danh sách giảng viên");
        }
      });

    return () => {
      active = false;
    };
  }, [auth.user.role, auth.accessToken]);


  const [id, setId] = useState(""),
    [ticket, setTicket] = useState(null),
    [body, setBody] = useState(""),
    [status, setStatus] = useState(""),
    [assignee, setAssignee] = useState("");
  useEffect(() => {
    if (!ticket?.ticket_id || auth.user.role !== "STUDENT") return;
    let active = true;
    const timer = setInterval(() => {
      api.platform(`/tickets/${ticket.ticket_id}`, auth.accessToken).then((t) => {
        if (active) setTicket(t);
      }).catch(() => {});
    }, 10000);
    return () => { active = false; clearInterval(timer); };
  }, [ticket?.ticket_id, auth.accessToken, auth.user.role]);
  const closed = ticket?.status === "CLOSED";
  const load = () =>
    api.platform(`/tickets/${id}`, auth.accessToken).then((t) => {
      setTicket(t);
      setStatus(t.status);
      setAssignee(t.assigned_to ?? "");
    });
  return (
    <Card title="Xử lý ticket và hội thoại">
      <div className="flex gap-3">
        <Input
          label="Mã ticket"
          type="number"
          min={1}
          value={id}
          onChange={(e) => { setId(e.target.value); setTicket(null); }}
        />
        <button
          className={button}
          disabled={busy || !id}
          onClick={() => act(load)}
        >
          Mở
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {tickets.map((t) => (
          <button
            key={t.ticketId}
            className="rounded-lg bg-slate-100 p-2 text-sm"
            onClick={() => { setId(t.ticketId); setTicket(null); }}
          >
            #{t.ticketId} {t.subject}
          </button>
        ))}
      </div>
      {ticket && (
        <>
          <h3 className="font-bold">
            {ticket.subject} · {ticket.status}
          </h3>
          {ticket.messages.map((m) => (
            <p
              key={m.message_id}
              className="rounded-xl bg-slate-50 p-3 text-sm"
            >
              <strong>{m.full_name}: </strong>
              {m.message_text}
            </p>
          ))}
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              act(async () => {
                await api.platform(
                  `/tickets/${id}`,
                  auth.accessToken,
                  {
                    message: body,
                    ...(auth.user.role !== "STUDENT" ? { status } : {}),
                    ...(auth.user.role === "ADMIN"
                      ? { assignedTo: assignee ? Number(assignee) : null }
                      : {}),
                  },
                  "PATCH",
                );
                setBody("");
                await load();
              });
            }}
          >
            <textarea
              className={field}
              aria-label="Trả lời ticket"
              disabled={closed}
              maxLength={5000}
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
            {auth.user.role !== "STUDENT" && (
              <select
                aria-label="Trạng thái ticket"
                className={field}
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            )}

{auth.user.role === "ADMIN" && (
  <label className="block space-y-1 text-sm font-medium">
    <span>Phân công giảng viên xử lý</span>

    <select
      className={field}
      value={String(assignee)}
      onChange={(e) => setAssignee(e.target.value)}
    >
      <option value="">-- Chưa phân công --</option>

      {teachers.map((teacher) => (
        <option key={teacher.id} value={teacher.id}>
          {teacher.name}
        </option>
      ))}

      {assignee &&
        !teachers.some((teacher) => teacher.id === String(assignee)) && (
          <option value={String(assignee)}>
            Người được giao hiện tại (ID: {assignee})
          </option>
        )}
    </select>

    {(teachersError || teachers.length === 0) && (
  <p className="text-xs text-amber-600">
    {teachersError || "Chưa có giảng viên trong danh sách."}
  </p>
)}
  </label>
)}

            {closed && <p role="status" className="rounded-xl bg-slate-100 p-3 text-sm">Yêu cầu đã đóng. Bạn có thể xem lịch sử; hãy tạo yêu cầu mới nếu cần hỗ trợ thêm.</p>}
            <button className={button} disabled={busy || (closed && auth.user.role !== "ADMIN")}>
              Lưu và gửi trả lời
            </button>
          </form>
        </>
      )}
    </Card>
  );
}
function Certificates({ auth, data, act, busy }) {
  const [course, setCourse] = useState("");
  return (
    <Card title="Chứng nhận hoàn thành">
      <CourseSelect
        courses={data.courses || []}
        value={course}
        onChange={setCourse}
      />
      <button
        className={button}
        disabled={busy || !course}
        onClick={() =>
          act(async () => {
            const r = await api.platform(
              `/courses/${course}/certificate`,
              auth.accessToken,
              {},
            );
            await api.download(
              `/certificates/${encodeURIComponent(r.certificate_code)}/pdf`,
              auth.accessToken,
              `${r.certificate_code}.pdf`,
            );
            return { message: `Đã cấp ${r.certificate_code}` };
          })
        }
      >
        Kiểm tra điều kiện và cấp PDF
      </button>
      <p className="text-sm text-slate-500">
        Khóa học đã thanh toán hoặc miễn phí; mọi bài học hoàn thành, mọi quiz
        đã đạt. Mã chứng nhận được tra cứu công khai.
      </p>
      {(data.certificates || []).map((c) => (
        <div
          key={c.certificateId}
          className="flex flex-wrap items-center justify-between gap-2 border-t py-3 text-sm"
        >
          <Link
            to={`/verify/${encodeURIComponent(c.certificateCode)}`}
            className="text-blue-700"
          >
            {c.certificateCode} · {c.status}
          </Link>
          <button
            className={button}
            onClick={() =>
              act(() =>
                api.download(
                  `/certificates/${encodeURIComponent(c.certificateCode)}/pdf`,
                  auth.accessToken,
                  `${c.certificateCode}.pdf`,
                ),
              )
            }
          >
            Tải PDF
          </button>
        </div>
      ))}
    </Card>
  );
}
export function LegacyRecommendations({ auth, data, act, busy }) {
  const [course, setCourse] = useState(""),
    [result, setResult] = useState(null);
  return (
    <Card title="Lộ trình HUSPM + hai mô hình học máy">
      <CourseSelect
        courses={data.courses || []}
        value={course}
        onChange={setCourse}
      />
      <button
        className={button}
        disabled={busy || !course}
        onClick={() =>
          act(() =>
            api
              .platform(
                `/courses/${course}/recommendations`,
                auth.accessToken,
                {},
              )
              .then(setResult),
          )
        }
      >
        Tạo gợi ý từ lịch sử mới nhất
      </button>
      {result && (
        <>
          <p className="rounded-xl bg-blue-50 p-3 text-sm">{result.reason}</p>
          {result.recommendations.map((r) => (
            <div
              key={r.recommendation_id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"
            >
              <div>
                <Link
                  className="font-bold text-blue-700"
                  to={`/learn/${course}/${r.recommended_lesson_id}`}
                >
                  {r.title}
                </Link>
                <p className="text-xs text-slate-500">
                  {r.source_type} · Điểm{" "}
                  {Number(r.recommendation_score).toFixed(3)}
                </p>
              </div>
              <div className="flex gap-2">
                {[
                  ["ACCEPTED", "Phù hợp"],
                  ["IGNORED", "Bỏ qua"],
                ].map(([action, label]) => (
                  <button
                    className={button}
                    key={action}
                    disabled={busy}
                    onClick={() =>
                      act(() =>
                        api.recommendationFeedback(
                          r.recommendation_id,
                          { action },
                          auth.accessToken,
                        ),
                      )
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </>
      )}
    </Card>
  );
}
function Mining({ auth, act, busy }) {
  const [replay, setReplay] = useState(null);
  const [dataset, setDataset] = useState("kaggle_recommender"),
    [epochs, setEpochs] = useState(8),
    [jobs, setJobs] = useState([]),
    [result, setResult] = useState(null),
    [mapping, setMapping] = useState({
      dataset: "kaggle_recommender",
      externalItemId: "",
      lessonId: "",
    });
  const load = useCallback(
    () => api.platform("/ml/experiments", auth.accessToken).then(setJobs),
    [auth.accessToken],
  );
  useEffect(() => {
    load().catch(() => {});
  }, [load]);
  useEffect(() => {
    if (!jobs.some((j) => j.status === "RUNNING")) return;
    const timer = setInterval(() => {
      Promise.all(
        jobs
          .filter((j) => j.status === "RUNNING")
          .map((j) =>
            api.platform(`/ml/jobs/${j.experiment_id}`, auth.accessToken),
          ),
      )
        .then((values) => {
          const done = values.find((v) => v.report);
          if (done) setResult(done);
          return load();
        })
        .catch(() => {});
    }, 10000);
    return () => clearInterval(timer);
  }, [jobs, auth.accessToken, load]);
  return (
    <div className="space-y-5">
      <Card title="Huấn luyện và khai phá thật">
        <p className="text-sm leading-6 text-slate-600">
          Hai mô hình chính: BPR-MF và GRU next-item. Đối chứng: Item-KNN
          (scikit-learn). HUSPM là thuật toán khai phá riêng, không phải mô hình
          thứ ba. Chia thời gian 70/15/15; chọn checkpoint và trọng số trên
          validation, đo trên test.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            Nguồn dữ liệu
            <select
              className={field}
              value={dataset}
              onChange={(e) => setDataset(e.target.value)}
            >
              {[
                ["kaggle_recommender", "Kaggle: E-learning Recommender"],
                ["kaggle_logs", "Kaggle: Interaction Logs (5 module)"],
                ["vedu_real", "Log VEDU REAL"],
              ].map(([id, label]) => (
                <option value={id} key={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <Input
            label="Epochs"
            type="number"
            min={1}
            max={50}
            value={epochs}
            onChange={(e) => setEpochs(e.target.value)}
          />
        </div>
        <button
          className={button}
          disabled={busy || jobs.some((j) => j.status === "RUNNING")}
          onClick={() =>
            act(async () => {
              const r = await api.platform("/ml/train", auth.accessToken, {
                dataset,
                config: {
                  epochs: Number(epochs),
                  seed: 42,
                  min_support: 0.02,
                  utility_ratio: 0.01,
                  max_length: 3,
                },
              });
              await load();
              return { message: `Đã bắt đầu job ${r.jobId}` };
            })
          }
        >
          Huấn luyện BPR + GRU, đánh giá KNN và HUSPM
        </button>
        {jobs.map((j) => (
          <div
            key={j.experiment_id}
            className="flex items-center justify-between gap-3 rounded-xl border p-3 text-sm"
          >
            <span>
              {j.dataset} · {j.status}
              <small className="block font-mono">{j.experiment_id}</small>
            </span>
            <button
              className={button}
              disabled={busy}
              onClick={() =>
                act(async () => {
                  const r = await api.platform(
                    `/ml/jobs/${j.experiment_id}`,
                    auth.accessToken,
                  );
                  setResult(r);
                  await load();
                })
              }
            >
              Xem kết quả
            </button>
          </div>
        ))}
      </Card>
      {result?.report && (
        <>
          <Card title="Thử lịch sử bên ngoài — không tạo học viên VEDU">
            <p className="text-sm text-slate-600">
              Đọc 5 lịch sử test đủ điều kiện đầu tiên từ CSV gốc và chạy suy
              luận. Mẫu này không ngẫu nhiên/đại diện; không dùng tỷ lệ trúng
              của 5 mẫu để báo chất lượng toàn mô hình.
            </p>
            <button
              className={button}
              disabled={busy || result.report.manifest.dataset === "vedu_real"}
              onClick={() =>
                act(async () => {
                  setReplay(
                    await api.platform(
                      `/ml/jobs/${result.jobId}/replay`,
                      auth.accessToken,
                      {},
                    ),
                  );
                })
              }
            >
              Chạy thử lịch sử Kaggle
            </button>
            {replay && (
              <div className="space-y-3">
                <p className="text-xs text-slate-500">{replay.scope}</p>
                {replay.samples.map((s) => (
                  <div
                    className="space-y-2 rounded-xl bg-slate-50 p-4 text-xs"
                    key={s.sample}
                  >
                    <strong>Mẫu ẩn danh {s.sample}</strong>
                    <p>Lịch sử trước target: {s.history.join(" → ")}</p>
                    <p>
                      Target thật: {s.target} ·{" "}
                      {new Date(s.targetTime).toLocaleString("vi-VN")}
                    </p>
                    <p>
                      Top 3:{" "}
                      {s.top5
                        .slice(0, 3)
                        .map((x) => `${x.item} (${x.score.toFixed(3)})`)
                        .join(" → ")}{" "}
                      · {s.hit3 ? "Trúng" : "Chưa trúng"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
          <Card title="Chất lượng trên tập test (không dùng để chỉnh mô hình)">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr>
                    {[
                      "Mô hình",
                      "Recall@1",
                      "Recall@3",
                      "NDCG@3",
                      "MRR@3",
                      "Số học viên",
                    ].map((h) => (
                      <th className="p-3" key={h}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(result.report.metrics).map(([name, m]) => (
                    <tr key={name} className="border-t">
                      <td className="p-3 font-bold">{name}</td>
                      {[
                        "Recall@1",
                        "Recall@3",
                        "NDCG@3",
                        "MRR@3",
                        "evaluated_users",
                      ].map((key) => (
                        <td className="p-3" key={key}>
                          {m.test[key] == null
                            ? "—"
                            : key === "evaluated_users"
                              ? m.test[key]
                              : m.test[key].toFixed(4)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-sm text-amber-700">
              Bộ 5 module: Recall@5 = 1 là hiển nhiên, không chứng minh chất
              lượng. Hybrid có thể thua KNN/BPR. Kết quả offline không chứng
              minh cải thiện điểm học tập.
            </p>
            <button
              className={button}
              onClick={() => {
                const blob = new Blob(
                    [JSON.stringify(result.report, null, 2)],
                    { type: "application/json" },
                  ),
                  url = URL.createObjectURL(blob),
                  link = document.createElement("a");
                link.href = url;
                link.download = `experiment-${result.jobId}.json`;
                link.click();
                setTimeout(() => URL.revokeObjectURL(url), 10000);
              }}
            >
              Xuất báo cáo experiment JSON
            </button>
            <details>
              <summary className="cursor-pointer text-sm font-bold">
                Nguồn, SHA256 và tham số
              </summary>
              <pre className="mt-3 overflow-x-auto rounded-xl bg-slate-950 p-4 text-xs text-slate-200">
                {JSON.stringify(result.report.manifest, null, 2)}
              </pre>
            </details>
          </Card>
          <Card title="Các mẫu HUSPM">
            <p className="text-sm">
              {result.report.mining.sequence_count} chuỗi ·{" "}
              {result.report.patterns.length} mẫu hiển thị (tối đa 100) · min
              utility {result.report.mining.min_utility.toFixed(2)}
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {result.report.patterns.slice(0, 12).map((p, i) => (
                <div key={i} className="rounded-xl bg-slate-50 p-3 text-xs">
                  <strong>
                    {p.items.map((id) => result.report.items[id]).join(" → ")}
                  </strong>
                  <p>
                    Support {(p.support * 100).toFixed(1)}% · Utility{" "}
                    {p.utility.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
      {result?.error && <p className="text-red-600">{result.error}</p>}
      <Card title="Mapping chuyển miền được phê duyệt">
        <p className="text-sm text-slate-500">
          Không gán tùy tiện module Kaggle thành bài học VEDU. Chỉ duyệt khi nội
          dung tương ứng thật; nếu chưa có mapping/lịch sử thì dùng FALLBACK.
        </p>
        <form
          className="grid gap-3 sm:grid-cols-3"
          onSubmit={(e) => {
            e.preventDefault();
            act(() =>
              api.platform("/ml/mappings", auth.accessToken, {
                ...mapping,
                lessonId: Number(mapping.lessonId),
              }),
            );
          }}
        >
          <label className="block text-sm">
            Dataset
            <select
              className={field}
              value={mapping.dataset}
              onChange={(e) =>
                setMapping({ ...mapping, dataset: e.target.value })
              }
            >
              <option value="kaggle_recommender">Kaggle Recommender</option>
              <option value="kaggle_logs">Kaggle Logs</option>
            </select>
          </label>
          <Input
            label="Item ID gốc (items_en.csv / module_id)"
            required
            value={mapping.externalItemId}
            onChange={(e) =>
              setMapping({ ...mapping, externalItemId: e.target.value })
            }
          />
          <Input
            label="Lesson ID VEDU"
            type="number"
            min={1}
            required
            value={mapping.lessonId}
            onChange={(e) =>
              setMapping({ ...mapping, lessonId: e.target.value })
            }
          />
          <button className={button} disabled={busy}>
            Duyệt mapping
          </button>
        </form>
      </Card>
    </div>
  );
}

function FinalEssayTeacherPanel({auth,data,initialCourseId}){
 const [course,setCourse]=useState(String(initialCourseId||''));
 const [quizzes,setQuizzes]=useState([]);
 const [selected,setSelected]=useState('');
 const [prompt,setPrompt]=useState('');
 const [submissions,setSubmissions]=useState([]);
 const [message,setMessage]=useState('');
 const [images,setImages]=useState({});
 const [grades,setGrades]=useState({});
 const load=useCallback(async()=>{
  if(!course) return;
  try {
   const [info,rows]=await Promise.all([api.platform(`/courses/${course}/content`,auth.accessToken),api.platform(`/final-essays/courses/${course}/submissions`,auth.accessToken)]);
   setQuizzes((info.quizzes||[]).filter(q=>q.lesson_id==null));
   setSubmissions(rows);setMessage('');
  }catch(e){setMessage(e.message)}
 },[course,auth.accessToken]);
 useEffect(()=>{Promise.resolve().then(load)},[load]);
 const showImage=async id=>{try {const url=await api.essayImage(id,auth.accessToken);setImages(old=>({...old,[id]:url}))}catch(e){setMessage(e.message)}};
 const loadPrompt=async id=>{setSelected(id);try{const p=await api.essayPrompt(id,auth.accessToken);setPrompt(p.prompt)}catch(e){setMessage(e.message)}};
 return <Card title="Chấm bài nộp và tự luận cuối khóa">
  <CourseSelect courses={data.courses||[]} value={course} onChange={v=>{setCourse(v);setSelected('')}} />
  {course && <CourseAssignments key={course} courseId={course} token={auth.accessToken} teacher />}
  <button className={button} onClick={load} disabled={!course}>Làm mới danh sách</button>
  <label className="block text-sm">Chọn đề cuối khóa
   <select className={field} value={selected} onChange={e=>loadPrompt(e.target.value)}>
    <option value="">Chọn quiz cuối khóa</option>
    {quizzes.map(q=><option key={q.quiz_id} value={q.quiz_id}>{q.title}</option>)}
   </select>
  </label>
  {selected && <div className="space-y-2"><textarea className={`${field} min-h-28`} value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="Nhập đề bài tự luận cho học viên"/>
   <button className={button} onClick={async()=>{try{await api.platform(`/final-essays/quizzes/${selected}`,auth.accessToken,{prompt},'PATCH');setMessage('Đã lưu đề tự luận')}catch(e){setMessage(e.message)}}}>Lưu đề tự luận</button>
  </div>}
  <div className="flex flex-wrap items-center gap-3 justify-between">
    <h3 className="font-bold">Bài đã nộp ({submissions.length})</h3>
    <span className="rounded-lg bg-amber-50 text-amber-800 px-3 py-1 text-sm font-semibold">Chờ chấm: {submissions.filter(s=>s.grade==null).length}</span>
  </div>
  {submissions.map(s=><div key={s.attempt_id} className="border rounded-xl p-3 space-y-2 text-sm">
   <p><b>{s.student_name}</b> – {s.quiz_title} – trắc nghiệm {s.mcq_score}/10</p>
   <p>{s.grade==null?'Chờ chấm':`Đã chấm: ${s.grade}/10 · Tổng kết: ${s.final_score}/10 · ${Number(s.final_score)>=Number(s.passing_score)?'Đạt':'Chưa đạt'}`}</p>
   <button className="underline text-blue-700" onClick={()=>showImage(s.attempt_id)}>Xem ảnh bài nộp</button>
   {images[s.attempt_id]&&<img className="max-h-96 object-contain" src={images[s.attempt_id]} alt="Bài tự luận học viên"/>}
   {s.grade==null&&<div className="flex flex-wrap gap-2 items-center">
    <input className={`${field} w-28`} type="number" min="0" max="10" step="0.25" placeholder="Điểm" value={grades[s.attempt_id]?.grade??''} onChange={e=>setGrades(o=>({...o,[s.attempt_id]:{...o[s.attempt_id],grade:e.target.value}}))}/>
    <input className={`${field} flex-1`} placeholder="Nhận xét" value={grades[s.attempt_id]?.feedback??''} onChange={e=>setGrades(o=>({...o,[s.attempt_id]:{...o[s.attempt_id],feedback:e.target.value}}))}/>
    <button className={button} onClick={async()=>{try{await api.platform(`/final-essays/attempts/${s.attempt_id}/grade`,auth.accessToken,{grade:grades[s.attempt_id]?.grade,feedback:grades[s.attempt_id]?.feedback||''});await load()}catch(e){setMessage(e.message)}}}>Chấm và xác nhận</button>
   </div>}
  </div>)}
  {message&&<p className="text-sm text-blue-700">{message}</p>}
 </Card>
}
