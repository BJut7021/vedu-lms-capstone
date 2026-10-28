import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell } from "lucide-react";
import { api } from "../services/api";
export default function Notifications({ token }) {
  const [items, setItems] = useState([]),
    [error, setError] = useState("");
  const load = useCallback(
    () =>
      api
        .platform("/notifications", token)
        .then((r) => {
          setItems(r);
          setError("");
        })
        .catch((e) => setError(e.message)),
    [token],
  );
  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    window.addEventListener("focus", load);
    return () => {
      clearInterval(t);
      window.removeEventListener("focus", load);
    };
  }, [load]);
  return (
    <details className="mb-5 rounded-2xl border border-blue-100 bg-white p-4">
      <summary className="flex cursor-pointer items-center gap-2 font-bold">
        <Bell size={18} className="text-blue-600" />
        Thông báo{" "}
        <span className="rounded-full bg-blue-50 px-2 text-blue-700">
          {items.filter((n) => !n.readAt).length} chưa đọc
        </span>
      </summary>
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {!items.length && !error && (
        <p className="mt-3 text-sm text-slate-500">Chưa có thông báo mới.</p>
      )}
      {items.map((n) => (
        <div
          key={n.id}
          className={`mt-3 rounded-xl p-3 ${n.readAt ? "bg-slate-50" : "bg-blue-50"}`}
        >
          <strong className="text-sm">{n.title}</strong>
          <p className="my-1 text-sm">{n.body}</p>
          <small>{new Date(n.createdAt).toLocaleString("vi-VN")}</small>
          <div className="mt-2 flex gap-4 text-sm text-blue-700">
            <Link to={n.route}>Mở mục liên quan →</Link>
            {!n.readAt && (
              <button
                onClick={async () => {
                  try {
                    await api.platform(
                      `/notifications/${n.id}/read`,
                      token,
                      {},
                      "PATCH",
                    );
                    await load();
                  } catch (e) {
                    setError(e.message);
                  }
                }}
              >
                Đánh dấu đã đọc
              </button>
            )}
          </div>
        </div>
      ))}
    </details>
  );
}
