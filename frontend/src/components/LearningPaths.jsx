import { useState } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  Compass,
  ArrowRight,
  BookOpen,
  Sparkles,
} from "lucide-react";
import { api } from "../services/api";

const field =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm";
const button =
  "rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50";
const kinds = {
  CONCEPT: "Kiến thức",
  PRACTICE: "Thực hành",
  REVIEW: "Ôn tập",
  PROJECT: "Dự án",
  VIDEO: "Video",
};
function Select({ label, options, value, onChange }) {
  return (
    <label className="space-y-1 text-sm font-medium">
      <span className="block">{label}</span>
      <select
        className={field}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map(([id, title]) => (
          <option key={id} value={id}>
            {title}
          </option>
        ))}
      </select>
    </label>
  );
}
export default function LearningPaths({ auth, data, act, busy }) {
  const [course, setCourse] = useState("");
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [form, setForm] = useState({
    goal: "CAREER",
    level: "BEGINNER",
    occupation: "OFFICE",
    format: "MIXED",
    weeklySeconds: 3600,
    horizonWeeks: 4,
    count: 4,
  });
  const [feedback, setFeedback] = useState({});
  const [consent, setConsent] = useState(false);
  const update = (key, value) => setForm((s) => ({ ...s, [key]: value }));
  const loadHistory = async (id) => {
    if (!id) {
      setHistory([]);
      return;
    }
    const rows = await api.platform(
      `/courses/${id}/path-options`,
      auth.accessToken,
    );
    setHistory(rows);
    setResult(rows[0] ?? null);
    if (rows[0]) setForm(rows[0].preferences);
  };
  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white">
        <div className="mb-3 flex items-center gap-2">
          <Compass size={24} />
          <h2 className="text-xl font-bold">Lộ trình của riêng bạn</h2>
        </div>
        <p className="max-w-3xl text-sm leading-6 text-blue-100">
          Chọn mục tiêu, nền tảng và đầu ra mong muốn. So sánh 2–4 phương án có
          giải thích, giữ đúng bài tiên quyết và tiếp tục theo tiến độ đã lưu.
        </p>
      </section>
      <form
        className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"
        onSubmit={(e) => {
          e.preventDefault();
          act(async () => {
            const r = await api.platform(
              `/courses/${course}/path-options`,
              auth.accessToken,
              form,
            );
            setResult(r);
            setHistory((h) => [r, ...h].slice(0, 5));
            return { message: "Đã tạo các phương án phù hợp dữ liệu hiện có." };
          });
        }}
      >
        <label className="block space-y-1 text-sm font-medium">
          Khóa đã ghi danh
          <select
            disabled={busy}
            required
            className={field}
            value={course}
            onChange={(e) => {
              const id = e.target.value;
              setCourse(id);
              setResult(null);
              setFeedback({});
              act(() => loadHistory(id));
            }}
          >
            <option value="">Chọn khóa học</option>
            {(data.courses ?? []).map((c) => (
              <option key={c.courseId} value={c.courseId}>
                {c.courseName}
              </option>
            ))}
          </select>
        </label>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Select
            label="Mục tiêu học"
            value={form.goal}
            onChange={(v) => update("goal", v)}
            options={[
              ["FOUNDATION", "Nắm nền tảng"],
              ["PRACTICAL", "Ứng dụng ngay"],
              ["CAREER", "Phục vụ công việc"],
              ["CERTIFICATION", "Hoàn thành khóa/chứng nhận"],
            ]}
          />
          <Select
            label="Trình độ tự đánh giá"
            value={form.level}
            onChange={(v) => update("level", v)}
            options={[
              ["BEGINNER", "Mới bắt đầu"],
              ["INTERMEDIATE", "Đã biết cơ bản"],
              ["ADVANCED", "Muốn nâng cao"],
            ]}
          />
          <Select
            label="Công việc / dự án đầu ra"
            value={form.occupation}
            onChange={(v) => update("occupation", v)}
            options={[
              ["STUDENT", "Học tập — báo cáo nhóm"],
              ["OFFICE", "Hành chính — hồ sơ văn phòng"],
              ["SALES", "Bán hàng — báo cáo vận hành"],
              ["TEACHER", "Giảng dạy — thuyết trình"],
            ]}
          />
          <Select
            label="Cách học ưu tiên"
            value={form.format}
            onChange={(v) => update("format", v)}
            options={[
              ["MIXED", "Đọc, xem và thực hành"],
              ["READING", "Ưu tiên đọc/thực hành"],
              ["VIDEO", "Ưu tiên video hướng dẫn"],
            ]}
          />
          <label className="space-y-1 text-sm font-medium">
            Quỹ thời gian mỗi tuần (giây)
            <input
              className={field}
              required
              type="number"
              min="1800"
              max="144000"
              step="1"
              value={form.weeklySeconds}
              onChange={(e) => update("weeklySeconds", Number(e.target.value))}
            />
          </label>
          <label className="space-y-1 text-sm font-medium">
            Số tuần dự kiến
            <input
              className={field}
              required
              type="number"
              min="1"
              max="52"
              step="1"
              value={form.horizonWeeks}
              onChange={(e) => update("horizonWeeks", Number(e.target.value))}
            />
          </label>
          <Select
            label="Số phương án muốn so sánh"
            value={form.count}
            onChange={(v) => update("count", Number(v))}
            options={[
              [2, "2 phương án"],
              [3, "3 phương án"],
              [4, "4 phương án"],
            ]}
          />
        </div>
        <p className="text-xs text-slate-500">
          Trình độ tự khai không thay cho bài kiểm tra đầu vào. Thời gian học là
          ước tính; thời lượng video lấy từ trình phát khi có dữ liệu. Việc chọn
          lộ trình không bỏ qua học phí hay điều kiện chứng nhận.
        </p>
        <button className={button} disabled={busy || !course}>
          <Sparkles className="mr-2 inline" size={16} />
          {busy ? "Đang xử lý…" : "Tạo và so sánh lộ trình"}
        </button>
      </form>
      {history.length > 1 && (
        <label className="block text-sm">
          Lịch sử gần đây
          <select
            className={field}
            value={result?.path_set_id || ""}
            onChange={(e) =>
              setResult(history.find((h) => h.path_set_id === e.target.value))
            }
          >
            {history.map((h) => (
              <option value={h.path_set_id} key={h.path_set_id}>
                {new Date(h.created_at).toLocaleString("vi-VN")} —{" "}
                {h.plans.length} phương án
              </option>
            ))}
          </select>
        </label>
      )}
      {result && (
        <>
          <div className="space-y-2 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">
            <strong>
              Giải thích dựa trên bằng chứng · {result.evidence.source}
            </strong>
            <p>{result.evidence.reason}</p>
            <p>{result.evidence.note}</p>
            <p className="text-xs">
              Giải thích bằng chứng không cần AI ngôn ngữ trả phí: lấy từ tiên
              quyết, nhu cầu và điểm mô hình nếu có. Đây chưa phải bằng chứng
              tăng hiệu quả học tập.
            </p>
            {result.externalExplanationAvailable && (
              <div className="space-y-3 border-t border-blue-200 pt-3">
                <label className="flex gap-2">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                  />
                  Tôi đồng ý gửi lựa chọn nhu cầu, tên bài và căn cứ lộ trình
                  tới gateway AI của hệ thống. Không gửi tên/email hay log học
                  cá nhân. Dịch vụ có thể tính phí theo cấu hình của nhóm.
                </label>
                <button
                  className={button}
                  disabled={busy || !consent || !result.plans.length}
                  onClick={() =>
                    act(async () =>
                      setResult(
                        await api.platform(
                          `/path-options/${result.path_set_id}/explain`,
                          auth.accessToken,
                          { consent: true },
                        ),
                      ),
                    )
                  }
                >
                  Yêu cầu AI ngoài diễn giải thêm
                </button>
              </div>
            )}
          </div>
          {!result.plans.length && (
            <p className="rounded-xl bg-emerald-50 p-5">
              Không còn bài cần lập kế hoạch. Kiểm tra các quiz/điều kiện chứng
              nhận của khóa.
            </p>
          )}
          <div className="grid items-start gap-5 xl:grid-cols-2">
            {result.plans.map((plan) => {
              const current = plan.steps.find((s) => !s.completed),
                selected = result.selected_plan_id === plan.id;
              return (
                <section
                  key={plan.id}
                  className={`space-y-4 rounded-2xl border-2 bg-white p-5 ${selected ? "border-blue-500 shadow-md shadow-blue-100" : "border-slate-100"}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg font-bold">{plan.title}</h3>
                    {selected && (
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                        Đang theo học
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600">{plan.focus}</p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded-lg bg-slate-100 px-3 py-2">
                      {plan.steps.length} bài · {plan.estimatedSeconds} giây dự
                      kiến
                    </span>
                    <span
                      className={`rounded-lg px-3 py-2 ${plan.fitsBudget ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"}`}
                    >
                      {plan.fitsBudget
                        ? "Vừa quỹ thời gian"
                        : "Vượt quỹ thời gian"}{" "}
                      · khoảng {plan.estimatedWeeks} tuần
                    </span>
                  </div>
                  <details
                    className="rounded-xl bg-slate-50 p-3 text-sm"
                    open={selected}
                  >
                    <summary className="cursor-pointer font-semibold">
                      Vì sao đề xuất phương án này?
                    </summary>
                    <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-600">
                      {plan.explanation.map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                    </ul>
                  </details>
                  {result.explanation?.summaries?.find(
                    (s) => s.planId === plan.id,
                  ) && (
                    <div className="rounded-xl bg-violet-50 p-4 text-sm text-violet-950">
                      <strong>AI ngoài diễn giải thêm</strong>
                      <p className="mt-2 whitespace-pre-wrap">
                        {
                          result.explanation.summaries.find(
                            (s) => s.planId === plan.id,
                          ).text
                        }
                      </p>
                      <small>{result.explanation.notice}</small>
                    </div>
                  )}
                  <ol className="space-y-3">
                    {plan.steps.map((s) => (
                      <li
                        className="rounded-xl border border-slate-100 p-3"
                        key={s.lessonId}
                      >
                        <div className="flex gap-2">
                          {s.completed ? (
                            <CheckCircle2
                              size={19}
                              className="shrink-0 text-emerald-500"
                            />
                          ) : (
                            <BookOpen
                              size={19}
                              className="shrink-0 text-blue-500"
                            />
                          )}
                          <div>
                            <Link
                              className="text-sm font-semibold text-blue-700 hover:underline"
                              to={`/learn/${result.course_id}/${s.lessonId}`}
                            >
                              {s.order}. {s.title}
                            </Link>
                            <p className="mt-1 text-xs text-slate-500">
                              {kinds[s.kind]} · Mức {s.difficulty}/3 ·{" "}
                              {s.estimatedSeconds} giây{" "}
                              {s.durationBasis === "STUDY_ESTIMATE"
                                ? "dự kiến"
                                : "video đã đo"}
                            </p>
                          </div>
                        </div>
                        <details className="mt-2 text-xs text-slate-600">
                          <summary className="cursor-pointer">
                            Căn cứ chọn bài & đầu ra
                          </summary>
                          {s.reasons.map((t) => (
                            <p key={t} className="mt-2">
                              {t}
                            </p>
                          ))}
                          {s.outcomes.map((t) => (
                            <p key={t} className="mt-2">
                              Đầu ra: {t}
                            </p>
                          ))}
                          {s.sources.map((source, i) => (
                            <a
                              key={i}
                              className="mt-2 block text-blue-700 underline"
                              target="_blank"
                              rel="noreferrer"
                              href={source.url}
                            >
                              {source.provider}: {source.title}
                            </a>
                          ))}
                        </details>
                      </li>
                    ))}
                  </ol>
                  {!plan.coversWholeCourse && (
                    <p className="text-xs text-amber-700">
                      Chưa gồm {plan.omittedLessonCount} bài còn lại. Muốn chứng
                      nhận phải hoàn thành đầy đủ yêu cầu khóa.
                    </p>
                  )}
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      className={button}
                      disabled={busy || selected}
                      onClick={() =>
                        act(async () =>
                          setResult(
                            await api.platform(
                              `/path-options/${result.path_set_id}/selection`,
                              auth.accessToken,
                              { planId: plan.id },
                              "PATCH",
                            ),
                          ),
                        )
                      }
                    >
                      Chọn phương án
                    </button>
                    {selected && current && (
                      <Link
                        className={button}
                        to={`/learn/${result.course_id}/${current.lessonId}`}
                      >
                        Tiếp tục học{" "}
                        <ArrowRight size={16} className="ml-1 inline" />
                      </Link>
                    )}
                  </div>
                  <form
                    className="space-y-2 border-t border-slate-100 pt-4"
                    onSubmit={(e) => {
                      e.preventDefault();
                      act(() =>
                        api.platform(
                          `/path-options/${result.path_set_id}/feedback`,
                          auth.accessToken,
                          {
                            planId: plan.id,
                            rating: Number(feedback[plan.id]?.rating || 4),
                            comment: feedback[plan.id]?.comment || "",
                          },
                        ),
                      );
                    }}
                  >
                    <label className="block text-xs font-medium">
                      Bạn thấy phương án phù hợp đến đâu?
                      <select
                        className={field}
                        value={feedback[plan.id]?.rating || 4}
                        onChange={(e) =>
                          setFeedback((f) => ({
                            ...f,
                            [plan.id]: {
                              ...f[plan.id],
                              rating: e.target.value,
                            },
                          }))
                        }
                      >
                        {[1, 2, 3, 4, 5].map((n) => (
                          <option key={n} value={n}>
                            {n}/5
                          </option>
                        ))}
                      </select>
                    </label>
                    <input
                      className={field}
                      maxLength={1000}
                      aria-label={`Nhận xét ${plan.title}`}
                      placeholder="Lý do phù hợp/chưa phù hợp (không nhập thông tin riêng tư)"
                      value={feedback[plan.id]?.comment || ""}
                      onChange={(e) =>
                        setFeedback((f) => ({
                          ...f,
                          [plan.id]: { ...f[plan.id], comment: e.target.value },
                        }))
                      }
                    />
                    <button
                      className="text-sm font-semibold text-blue-700"
                      disabled={busy}
                    >
                      Lưu đánh giá
                    </button>
                    {result.feedback?.some((f) => f.plan_id === plan.id) && (
                      <p className="text-xs text-emerald-700">
                        Đã có đánh giá lưu trên hệ thống.
                      </p>
                    )}
                  </form>
                </section>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
