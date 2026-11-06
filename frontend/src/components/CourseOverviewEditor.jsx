import { useState } from "react";
import { api } from "../services/api";
export default function CourseOverviewEditor({
  courseId,
  content,
  auth,
  act,
  busy,
  reload,
}) {
  const saved = content.overviewSettings;
  const [form, setForm] = useState({
    audience: saved?.audience || "",
    preparation: saved?.preparation || "",
    practiceNote: saved?.practice_note || "",
    syllabusResourceId: saved?.syllabus_resource_id
      ? String(saved.syllabus_resource_id)
      : "",
  });
  const resources = content.lessons
    .filter((l) => l.is_published && !l.is_deleted)
    .flatMap((l) =>
      (l.resources || [])
        .filter((r) => ["PDF", "LINK", "DOCUMENT"].includes(r.resource_type))
        .map((r) => ({ ...r, lessonTitle: l.title })),
    );
  const field =
    "mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm";
  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <h2 className="text-lg font-bold">Giới thiệu trước khi học</h2>
      <p className="text-sm leading-6 text-slate-600">
  Cung cấp thông tin tổng quan, đối tượng học viên, kiến thức nền,
  đề cương và hướng dẫn học tập trước khi học viên vào phòng học.
</p>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          act(async () => {
            const result = await api.platform(
              `/courses/${courseId}/overview`,
              auth.accessToken,
              {
                ...form,
                outcomes: [],
                syllabusResourceId: form.syllabusResourceId
                  ? Number(form.syllabusResourceId)
                  : null,
              },
              "PATCH",
            );
            await reload();
            return result;
          });
        }}
      >
        {[
  ["audience", "Đối tượng học viên", 2000],
  [
    "preparation",
    "Môn học tiên quyết / Kiến thức nền cần có",
    3000,
  ],
  [
    "practiceNote",
    "Hướng dẫn học tập và bài tập luyện tập bổ sung",
    3000,
  ],
].map(([key, label, max]) => (
          <label key={key} className="block text-sm font-medium">
            {label}
            <textarea
              className={field}
              rows={3}
              maxLength={max}
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            />
          </label>
        ))}

        <p className="rounded-xl bg-blue-50 p-3 text-sm leading-6 text-blue-800">
  <strong>Lưu ý cho giảng viên:</strong> Nếu khóa học không yêu cầu
  kiến thức nền, hãy ghi "Không có". Hãy chọn đúng tệp đề cương
  để học viên có thể đọc trước khi bắt đầu.
</p>
        <label className="block text-sm font-medium">
          Đề cương cho phép đọc công khai trước khi học
          <select
            className={field}
            value={form.syllabusResourceId}
            onChange={(e) =>
              setForm({ ...form, syllabusResourceId: e.target.value })
            }
          >
            <option value="">Không công bố tài liệu đề cương</option>
            {resources.map((r) => (
              <option key={r.resource_id} value={r.resource_id}>
                {r.title} — {r.lessonTitle}
              </option>
            ))}
          </select>
        </label>
        <p className="text-xs leading-5 text-slate-500">
          Chỉ chọn đề cương; tài liệu được chọn sẽ đọc được khi chưa đăng nhập.
          Các tài liệu học khác vẫn theo quyền của phòng học.
        </p>
        <button
          disabled={busy}
          className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
        >
          Lưu giới thiệu khóa học
        </button>
      </form>
    </section>
  );
}
