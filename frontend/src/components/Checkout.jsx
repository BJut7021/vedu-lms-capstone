import { useCallback, useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { api } from "../services/api";
export function Checkout({ auth }) {
  const { courseId } = useParams(),
    [status, setStatus] = useState(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const token = auth?.accessToken;
  const refresh = useCallback(
    () =>
      api
        .platform(`/checkout/${courseId}`, token)
        .then(setStatus)
        .catch((e) => setError(e.message)),
    [courseId, token],
  );
  useEffect(() => {
    if (auth?.user.role !== "STUDENT" || auth.user.isGuest) return;
    refresh();
    const timer = setInterval(refresh, 10000);
    return () => clearInterval(timer);
  }, [refresh, auth]);
  if (auth?.user.role !== "STUDENT")
    return <Navigate to="/student/login" replace />;
  if (auth.user.isGuest)
    return (
      <main className="mx-auto max-w-xl space-y-4 p-8">
        <h1 className="text-2xl font-bold">Khách không thanh toán khóa học</h1>
        <p>Hãy đăng ký tài khoản để mua khóa học và theo dõi đơn hàng.</p>
        <Link className="text-blue-700" to="/student/register">
          Đăng ký tài khoản
        </Link>
      </main>
    );
  return (
    <main className="mx-auto max-w-xl space-y-5 px-4 py-14">
      <Link className="text-blue-600" to={`/courses/${courseId}`}>
        ← Khóa học
      </Link>
      <h1 className="text-3xl font-black">Thanh toán khóa học</h1>
      {error && (
        <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">
          {error}
        </p>
      )}
      {status && (
        <div className="space-y-5 rounded-2xl border bg-white p-6">
          <h2 className="text-xl font-bold">{status.title}</h2>
          <p className="text-2xl font-black text-blue-600">
            {status.amount.toLocaleString("vi-VN")} {status.currency}
          </p>
          <p>Trạng thái: {status.status}</p>
          {status.paid ? (
            <>
              <p className="text-emerald-700">Quyền học đã mở.</p>
              <Link
                className="inline-block rounded-xl bg-blue-600 px-4 py-3 text-white"
                to={`/courses/${courseId}`}
              >
                Vào khóa học
              </Link>
            </>
          ) : (
            <>
              <p className="text-sm text-slate-600">
                {status.sandbox
                  ? "Chế độ Sandbox: thử nghiệm, không thu tiền thật."
                  : "Thanh toán qua MoMo."}{" "}
                Quyền học chỉ mở sau callback có chữ ký hợp lệ. Tham số trên URL
                quay về không xác nhận thanh toán.
              </p>
              {!status.configured && (
                <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
                  Nhóm chưa bổ sung khóa Sandbox trong .env. Chức năng được cấu
                  hình sẵn; không thể tạo phiên thanh toán MoMo lúc này.
                </p>
              )}
              <button
                disabled={busy || !status.configured}
                className="rounded-xl bg-pink-600 px-5 py-3 font-bold text-white disabled:opacity-50"
                onClick={async () => {
                  setBusy(true);
                  setError("");
                  try {
                    const r = await api.platform(
                      `/checkout/${courseId}`,
                      auth.accessToken,
                      {},
                    );
                    if (r.payUrl) window.location.assign(r.payUrl);
                    else refresh();
                  } catch (e) {
                    setError(e.message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Thanh toán MoMo
              </button>
            </>
          )}
          <button
            className="block text-sm font-bold text-blue-600"
            onClick={refresh}
          >
            Kiểm tra trạng thái mới nhất
          </button>
        </div>
      )}
    </main>
  );
}
export function VerifyCertificate() {
  const { code } = useParams(),
    [result, setResult] = useState(null),
    [error, setError] = useState("");
  useEffect(() => {
    api
      .platform(`/certificates/${encodeURIComponent(code)}/verify`)
      .then(setResult)
      .catch((e) => setError(e.message));
  }, [code]);
  return (
    <main className="mx-auto max-w-xl space-y-4 p-8">
      <Link to="/" className="text-blue-600">
        ← VEDU LMS
      </Link>
      <h1 className="text-2xl font-black">Tra cứu chứng nhận</h1>
      {error && <p className="text-red-700">{error}</p>}
      {result && (
        <div className="space-y-3 rounded-2xl border bg-white p-6">
          {result.status === "ISSUED" && (
            <img
              src="/brand/vedu-seal.svg"
              alt="Dấu xác nhận hoàn thành nội bộ VEDU"
              className="float-right h-24 w-24"
            />
          )}
          <p className="font-mono">{result.code}</p>
          <h2 className="text-xl font-bold">{result.learner}</h2>
          <p>{result.course}</p>
          <p>{new Date(result.issuedAt).toLocaleDateString("vi-VN")}</p>
          <p
            className={
              result.status === "ISSUED" ? "text-emerald-700" : "text-red-700"
            }
          >
            {result.status === "ISSUED"
              ? "Chứng nhận hợp lệ"
              : "Chứng nhận đã thu hồi"}
          </p>
          <p className="text-xs text-slate-500">
            Chứng nhận hoàn thành nội bộ VEDU; không thay thế văn bằng hay chứng
            chỉ chính thức.
          </p>
        </div>
      )}
    </main>
  );
}
