import { useState } from "react";
import { api } from "../services/api";
const field = "w-full rounded-xl border border-slate-200 bg-white p-3 text-sm";
export default function PedagogyEditor({
  lesson,
  metadata,
  lessons,
  auth,
  act,
  busy,
  reload,
}) {
  const [form, setForm] = useState({
    difficulty: metadata?.difficulty ?? 1,
    kind: metadata?.kind ?? "CONCEPT",
    isCore: metadata?.is_core ?? true,
    skills: (metadata?.skills ?? []).join(", "),
    goals: metadata?.goals ?? ["OFFICE"],
    outcomes: (metadata?.outcomes ?? []).join("\n"),
    prerequisites: metadata?.prerequisites ?? [],
    sources: JSON.stringify(metadata?.sources ?? [], null, 2),
  });
  const change = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="text-lg font-bold">Học thuật & điều kiện sinh lộ trình</h2>
      <p className="text-xs text-slate-500">
        Giảng viên chịu trách nhiệm xác nhận kiến thức tiên quyết và nguồn.
        Không gán mapping ML chỉ vì hai bài có tên gần giống.
      </p>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          act(async () => {
            await api.platform(
              `/lessons/${lesson.lesson_id}/pedagogy`,
              auth.accessToken,
              {
                ...form,
                difficulty: Number(form.difficulty),
                skills: form.skills
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
                outcomes: form.outcomes
                  .split("\n")
                  .map((s) => s.trim())
                  .filter(Boolean),
                sources: JSON.parse(form.sources),
              },
              "PATCH",
            );
            await reload();
          });
        }}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            Độ khó
            <select
              className={field}
              value={form.difficulty}
              onChange={(e) => change("difficulty", e.target.value)}
            >
              {[1, 2, 3].map((n) => (
                <option key={n} value={n}>
                  Mức {n}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Loại hoạt động
            <select
              className={field}
              value={form.kind}
              onChange={(e) => change("kind", e.target.value)}
            >
              {[
                ["CONCEPT", "Kiến thức"],
                ["PRACTICE", "Thực hành"],
                ["PROJECT", "Dự án"],
                ["REVIEW", "Ôn tập"],
                ["VIDEO", "Video"],
              ].map(([id, t]) => (
                <option key={id} value={id}>
                  {t}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="flex gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isCore}
            onChange={(e) => change("isCore", e.target.checked)}
          />
          Nền tảng cần giữ trong mọi phương án (không phải toàn bộ điều kiện
          chứng nhận)
        </label>
        <label className="block text-sm">
          Kỹ năng, phân cách bằng dấu phẩy
          <input
            className={field}
            maxLength={1000}
            value={form.skills}
            onChange={(e) => change("skills", e.target.value)}
          />
        </label>
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Phù hợp ngữ cảnh</legend>
          <div className="flex flex-wrap gap-4">
            {[
              ["STUDENT", "Học tập"],
              ["OFFICE", "Văn phòng"],
              ["SALES", "Bán hàng"],
              ["TEACHER", "Giảng dạy"],
            ].map(([id, t]) => (
              <label className="flex gap-2 text-sm" key={id}>
                <input
                  type="checkbox"
                  checked={form.goals.includes(id)}
                  onChange={(e) =>
                    change(
                      "goals",
                      e.target.checked
                        ? [...form.goals, id]
                        : form.goals.filter((v) => v !== id),
                    )
                  }
                />
                {t}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">
            Bài tiên quyết cùng khóa
          </legend>
          {lessons
            .filter((l) => l.lesson_id !== lesson.lesson_id)
            .map((l) => (
              <label className="flex gap-2 text-sm" key={l.lesson_id}>
                <input
                  type="checkbox"
                  checked={form.prerequisites.includes(Number(l.lesson_id))}
                  onChange={(e) =>
                    change(
                      "prerequisites",
                      e.target.checked
                        ? [...form.prerequisites, Number(l.lesson_id)]
                        : form.prerequisites.filter(
                            (v) => v !== Number(l.lesson_id),
                          ),
                    )
                  }
                />
                {l.title}
              </label>
            ))}
        </fieldset>
        <label className="block text-sm">
          Đầu ra (mỗi dòng một mục)
          <textarea
            className={field}
            rows={3}
            value={form.outcomes}
            onChange={(e) => change("outcomes", e.target.value)}
          />
        </label>
        <label className="block text-sm">
          Nguồn JSON: title, url HTTPS, provider, rights
          <textarea
            className={field + " font-mono text-xs"}
            rows={6}
            value={form.sources}
            onChange={(e) => change("sources", e.target.value)}
          />
        </label>
        <p className="text-xs text-slate-500">
          Không sao chép nội dung có bản quyền vào bài. Giữ liên kết gốc và ghi
          quyền sử dụng; cần thẩm định trước khi mở khóa thu phí.
        </p>
        <button
          className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
          disabled={busy}
        >
          Lưu dữ liệu học thuật
        </button>
      </form>
    </section>
  );
}
