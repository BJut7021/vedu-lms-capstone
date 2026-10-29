import { Link } from "react-router-dom";
import { formatMinutes } from "../services/time";
export function PathComparison({ plans }) {
  return (
    <section className="min-w-0 max-w-full overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <h3 className="px-5 pt-5 text-lg font-bold">
        So sánh nhanh để chọn cách học
      </h3>
      <div className="max-w-full overflow-x-auto p-5">
        <table className="w-full min-w-[630px] text-left text-sm">
          <thead>
            <tr className="border-b text-xs text-slate-500">
              {[
                "Phương án",
                "Còn dự kiến",
                "Ôn / luyện thêm",
                "Nhịp học",
                "Quỹ thời gian",
              ].map((t) => (
                <th key={t} className="p-3">
                  {t}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {plans.map((p) => (
              <tr
                key={p.id}
                className="border-b border-slate-100 last:border-0"
              >
                <td className="p-3">
                  <a
                    href={`#plan-card-${p.id}`}
                    className="font-bold text-blue-700"
                  >
                    {p.title}
                  </a>
                  {p.recommended && (
                    <small className="mt-1 block text-emerald-700">
                      Ưu tiên tham khảo
                    </small>
                  )}
                </td>
                <td className="p-3">
                  {formatMinutes(p.remainingSeconds ?? p.estimatedSeconds)}
                </td>
                <td className="p-3">
                  {formatMinutes(
                    (p.reviewSeconds || 0) + (p.practiceSeconds || 0),
                  )}
                </td>
                <td className="p-3">Khoảng {p.estimatedWeeks} tuần</td>
                <td
                  className={`p-3 ${p.fitsBudget ? "text-emerald-700" : "text-amber-700"}`}
                >
                  {p.fitsBudget ? "Phù hợp" : "Cần thêm thời gian"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="px-5 pb-5 text-xs leading-5 text-slate-500">
        Các khóa có tiên quyết tuần tự giữ nguyên thứ tự bài. Phương án có thể
        khác nhau ở thời gian ôn, luyện tập và lịch tuần. Thời gian này là kế
        hoạch tự học, không phải thời gian đã xem video.
      </p>
    </section>
  );
}
export function PathProgress({ plan }) {
  const p = plan.progress;
  if (!p) return null;
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <div className="mb-2 flex justify-between gap-2 text-xs font-medium">
        <span>
          {p.completed}/{p.total} bài trong phương án đã hoàn thành
        </span>
        <strong>{p.percent}%</strong>
      </div>
      <div
        role="progressbar"
        aria-label={`Tiến độ ${plan.title}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={p.percent}
        className="h-2 overflow-hidden rounded-full bg-slate-200"
      >
        <div
          className="h-full rounded-full bg-emerald-500"
          style={{ width: `${p.percent}%` }}
        />
      </div>
    </div>
  );
}
export function WeeklyPlan({ plan, courseId, selected, stale }) {
  if (!plan.schedule) return null;
  const labels = { LEARN: "Học bài", REVIEW: "Ôn tập", PRACTICE: "Tự luyện" };
  return (
    <details
      className="rounded-xl border border-blue-100 bg-blue-50/50 p-4"
      open={selected}
    >
      <summary className="cursor-pointer text-sm font-bold text-blue-800">
        Lịch học từng tuần · {plan.schedule.weeks.length} tuần còn lại
      </summary>
      <p className="mt-3 text-xs leading-5 text-slate-500">
        Lịch chia theo quỹ thời gian đã chọn; bài dài có thể tiếp tục ở tuần
        sau. Bài đã hoàn thành được bỏ khỏi lịch còn lại.
      </p>
      <div className="mt-4 space-y-3">
        {plan.schedule.weeks.map((w) => (
          <div key={w.week} className="rounded-xl bg-white p-3">
            <div className="flex flex-wrap justify-between gap-2 text-sm font-bold">
              <h4>Tuần {w.week}</h4>
              <span
                className={w.withinTarget ? "text-blue-700" : "text-amber-700"}
              >
                {formatMinutes(w.estimatedSeconds)}
                {!w.withinTarget && " · Ngoài thời hạn mong muốn"}
              </span>
            </div>
            <ol className="mt-3 space-y-2">
              {w.tasks.map((t, i) => (
                <li key={i} className="text-xs leading-5 text-slate-600">
                  <span className="mr-1 font-semibold">
                    {labels[t.activity] || "Học bài"}:
                  </span>
                  {t.title} · {formatMinutes(t.estimatedSeconds)}
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
      {plan.schedule.unscheduledSeconds > 0 && (
        <p className="mt-3 text-xs text-amber-800">
          Còn {formatMinutes(plan.schedule.unscheduledSeconds)} ngoài 104 tuần
          hiển thị. Hãy điều chỉnh quỹ thời gian hoặc phạm vi học.
        </p>
      )}
      {selected && !stale && plan.nextLessonId && (
        <Link
          to={`/learn/${courseId}/${plan.nextLessonId}`}
          className="mt-4 inline-block rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white"
        >
          Học bài tiếp theo theo lộ trình →
        </Link>
      )}
    </details>
  );
}
