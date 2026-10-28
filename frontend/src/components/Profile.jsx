import { useEffect, useRef, useState } from "react";
import { Camera } from "lucide-react";
import Avatar from "./Avatar";
import { api } from "../services/api";
export default function Profile({ auth, onUserUpdated }) {
  const [preview, setPreview] = useState(""),
    [file, setFile] = useState(null),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const input = useRef(null),
    previewRef = useRef(null);
  useEffect(
    () => () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    },
    [],
  );
  const choose = (event) => {
    const next = event.target.files?.[0];
    setMessage("");
    if (!next) return;
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(next.type) ||
      next.size > 5 * 1024 * 1024
    ) {
      setMessage("Chọn JPG, PNG hoặc WebP tối đa 5 MB.");
      event.target.value = "";
      return;
    }
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = URL.createObjectURL(next);
    setPreview(previewRef.current);
    setFile(next);
  };
  return (
    <section className="max-w-3xl space-y-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-8">
      <div>
        <h2 className="text-xl font-bold">Hồ sơ cá nhân</h2>
        <p className="mt-2 text-sm text-slate-500">
          Ảnh đại diện được hiển thị trên thanh điều hướng và bảng điều khiển
          của bạn.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-5">
        <Avatar
          user={{ ...auth.user, avatarUrl: preview || auth.user.avatarUrl }}
          className="h-24 w-24"
        />
        <div className="min-w-0 flex-1 space-y-3">
          <input
            ref={input}
            aria-label="Chọn ảnh đại diện"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={choose}
            disabled={busy}
            className="block w-full max-w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:font-semibold file:text-blue-700"
          />
          <p className="text-xs text-slate-500">
            JPG, PNG, WebP · tối đa 5 MB. Ảnh được cắt vuông tự động, loại bỏ
            thông tin ảnh gốc và lưu lâu dài.
          </p>
        </div>
      </div>
      <button
        disabled={!file || busy}
        onClick={async () => {
          setBusy(true);
          setMessage("");
          try {
            const user = await api.uploadAvatar(file, auth.accessToken);
            onUserUpdated(user);
            setMessage("Đã cập nhật ảnh đại diện thành công.");
            setFile(null);
            if (previewRef.current) URL.revokeObjectURL(previewRef.current);
            previewRef.current = null;
            setPreview("");
            if (input.current) input.current.value = "";
          } catch (e) {
            setMessage(e.message);
          } finally {
            setBusy(false);
          }
        }}
        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-40"
      >
        <Camera size={18} />
        {busy ? "Đang tải ảnh…" : "Lưu ảnh đại diện"}
      </button>
      {message && (
        <p
          role="status"
          className="rounded-xl bg-blue-50 p-4 text-sm text-blue-900"
        >
          {message}
        </p>
      )}
      <dl className="grid gap-4 border-t pt-5 sm:grid-cols-2">
        {[
          ["Họ tên", auth.user.fullName],
          ["Tên đăng nhập", auth.user.username],
          ["Email", auth.user.email],
          ["Vai trò", auth.user.role === "TEACHER" ? "Giảng viên" : "Học viên"],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs text-slate-500">{label}</dt>
            <dd className="mt-1 break-words font-semibold">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
