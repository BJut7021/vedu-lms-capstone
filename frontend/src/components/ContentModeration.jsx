import { useCallback, useEffect, useState } from "react";
import { api } from "../services/api";
import CourseImage from "./CourseImage";
export default function ContentModeration({ auth, act, busy }) {
  const [courses, setCourses] = useState([]),
    [notes, setNotes] = useState({}),
    [preview, setPreview] = useState(null),
    [error, setError] = useState(""),
    [filter, setFilter] = useState("ALL");
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
  return (
    <section className="space-y-5">
      <div className="rounded-2xl border bg-white p-5">
        <h2 className="text-xl font-bold">Kiểm duyệt nội dung</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Kiểm tra độ chính xác, nguồn học liệu, quyền sử dụng và tính đầy đủ
          trước khi công khai. Xem bài học → nhập nhận xét → duyệt, trả về chỉnh
          sửa hoặc ẩn khóa. Mọi quyết định lưu lịch sử và thông báo tới giảng
          viên.
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
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
      <div className="grid gap-4 xl:grid-cols-2">
        {courses
          .filter(
            (c) =>
              filter === "ALL" ||
              c.reviewStatus === filter ||
              c.status === filter,
          )
          .map((c) => (
            <article
              key={c.id}
              className="overflow-hidden rounded-2xl border bg-white"
            >
              <CourseImage course={c} className="h-32 w-full object-cover" />
              <div className="space-y-3 p-5">
                <h3 className="font-bold">{c.title}</h3>
                <p className="text-sm text-slate-600">
                  {c.instructor} · {c.publishedLessons}/{c.lessons} bài công bố
                  · {c.status} · {c.reviewStatus}
                </p>
                {c.reviewNote && (
                  <p className="text-sm">Nhận xét gần nhất: {c.reviewNote}</p>
                )}
                <button
                  className="font-semibold text-blue-700"
                  onClick={() =>
                    act(async () =>
                      setPreview(
                        await api.platform(
                          `/courses/${c.id}/content`,
                          auth.accessToken,
                        ),
                      ),
                    )
                  }
                >
                  Xem nội dung bài học
                </button>
                <textarea
                  aria-label={`Nhận xét ${c.title}`}
                  required
                  maxLength={2000}
                  value={notes[c.id] || ""}
                  onChange={(e) =>
                    setNotes({ ...notes, [c.id]: e.target.value })
                  }
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
                      disabled={busy || !notes[c.id]?.trim()}
                      onClick={() => decide(c, d)}
                      className="rounded-lg border px-3 py-2 text-sm font-semibold disabled:opacity-40"
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <details>
                  <summary className="cursor-pointer text-sm">
                    Lịch sử kiểm duyệt ({c.history.length})
                  </summary>
                  {c.history.map((h, i) => (
                    <p key={i} className="mt-2 text-xs">
                      {new Date(h.at).toLocaleString("vi-VN")} · {h.reviewer} ·{" "}
                      {h.decision}: {h.note}
                    </p>
                  ))}
                </details>
              </div>
            </article>
          ))}
      </div>
      {preview && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Xem nội dung kiểm duyệt"
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 p-4"
        >
          <div className="mx-auto max-w-3xl space-y-4 rounded-2xl bg-white p-6">
            <button
              className="float-right font-bold text-blue-700"
              onClick={() => setPreview(null)}
            >
              Đóng
            </button>
            <h2 className="font-bold">Nội dung bài học</h2>
            {preview.lessons.map((l) => (
              <article key={l.lesson_id} className="border-t py-3">
                <h3 className="font-bold">{l.title}</h3>
                <p className="whitespace-pre-wrap text-sm leading-6">
                  {l.content}
                </p>
                {l.resources?.map((r) => (
                  <a
                    key={r.resource_id}
                    href={
                      r.resource_url.startsWith("http") ||
                      r.resource_url.startsWith("/course-materials/")
                        ? r.resource_url
                        : undefined
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="mr-3 block text-sm text-blue-700"
                  >
                    {r.title}
                  </a>
                ))}
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
