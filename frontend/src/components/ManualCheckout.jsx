import { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Copy, QrCode } from "lucide-react";
import { api } from "../services/api";
import MomoQrImage from "./MomoQrImage";

export default function ManualCheckout({ status, auth, courseId, refresh }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [note, setNote] = useState(""),
    [notice, setNotice] = useState("");
  const r = status.manualRequest;
  const act = async (fn) => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await fn();
      if (result.message) setNotice(result.message);
      await refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const copy = async (value) => {
    try {
      await navigator.clipboard.writeText(value);
      setNotice("Đã sao chép.");
    } catch {
      setNotice("Bạn có thể chọn và sao chép thông tin hiển thị.");
    }
  };
  const momo = r?.method === "MOMO_WALLET";
  const transactionCode = note.trim().replace(/^#\s*/, "");
  const transactionCodeValid = /^[A-Za-z0-9_.:/-]{4,120}$/.test(
    transactionCode,
  );
  return (
    <div className="space-y-5">
      {!r ? (
        <>
          <div className="rounded-2xl border border-pink-100 bg-pink-50 p-5">
            <div className="mb-3 flex items-center gap-3">
              <QrCode className="text-pink-600" />
              <h3 className="font-bold text-pink-900">
                Thanh toán bằng QR MoMo
              </h3>
            </div>
            <p className="text-sm leading-6 text-slate-600">
              Quét QR nhận tiền bằng MoMo, nhập đúng học phí và mã đơn. Quản trị
              viên kiểm tra giao dịch nhận tiền rồi mở quyền học.
            </p>
            <button
              disabled={busy || !status.configured}
              onClick={() =>
                act(() =>
                  api.platform(`/checkout/${courseId}`, auth.accessToken, {}),
                )
              }
              className="mt-4 rounded-xl bg-pink-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
            >
              {busy ? "Đang tạo mã đơn…" : "Xem QR MoMo & mã đơn"}
            </button>
          </div>
          {!status.configured && (
            <p
              role="status"
              className="rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-900"
            >
              QR MoMo chưa sẵn sàng. Bộ phận quản trị cần cấu hình QR nhận học
              phí. Bạn có thể{" "}
              <Link className="font-bold underline" to="/student/support">
                liên hệ hỗ trợ
              </Link>
              .
            </p>
          )}
        </>
      ) : (
        <>
          <div className="rounded-xl bg-pink-50 p-4 text-sm">
            <strong>
              {momo ? "Học phí qua MoMo" : "Đơn đối soát đã tạo trước đây"} ·
              Đơn #{r.orderId}
            </strong>
            <p className="mt-3">
              Nội dung chuyển tiền:{" "}
              <strong className="select-all break-all font-mono">
                {r.reference}
              </strong>
              <button
                aria-label="Sao chép mã đối soát"
                onClick={() => copy(r.reference)}
                className="ml-2 rounded p-1 text-pink-700"
              >
                <Copy size={15} />
              </button>
            </p>
            <p className="mt-2">
              Số tiền:{" "}
              <strong>{status.amount.toLocaleString("vi-VN")} đ</strong>
              <button
                aria-label="Sao chép học phí"
                onClick={() => copy(String(status.amount))}
                className="ml-2 rounded p-1 text-pink-700"
              >
                <Copy size={15} />
              </button>
            </p>
          </div>
          {momo && r.wallet && (
            <div className="grid min-w-0 items-start gap-6 md:grid-cols-[minmax(300px,380px)_minmax(0,1fr)]">
              <MomoQrImage
                src={r.qrDataUrl}
                filename={`VEDU-MoMo-${r.reference}.png`}
              />
              <div className="min-w-0 space-y-3 text-sm leading-6">
                <h3 className="text-lg font-bold">Thông tin ví nhận học phí</h3>
                <p>
                  Chủ ví: <strong>{r.wallet.receiverName}</strong>
                </p>
                <p>
                  Số MoMo:{" "}
                  <strong className="select-all">
                    {r.wallet.receiverPhone}
                  </strong>
                </p>
                <ol className="list-decimal space-y-2 pl-5 text-slate-600">
                  <li>
                    Mở MoMo → Quét mã; hoặc tải QR và chọn ảnh từ thư viện.
                  </li>
                  <li>
                    Kiểm tra đúng người nhận; nhập{" "}
                    <strong>{status.amount.toLocaleString("vi-VN")} đ</strong>{" "}
                    và lời nhắn{" "}
                    <strong className="break-all">{r.reference}</strong>.
                  </li>
                  <li>
                    Xác nhận trong MoMo, giữ mã giao dịch và gửi yêu cầu đối
                    soát bên dưới.
                  </li>
                </ol>
                <p className="rounded-xl bg-amber-50 p-3 text-amber-900">
                  QR nhận tiền dùng chung, không tự điền học phí hay mã đơn. Hãy
                  nhập và kiểm tra cả hai trước khi chuyển. Đây là giao dịch qua
                  ví cá nhân, không phải Sandbox.
                </p>
              </div>
            </div>
          )}
          {!momo && (
            <p className="text-sm leading-6 text-slate-600">
              Đơn này dùng phương thức cũ và vẫn được giữ để đối soát. Liên hệ
              hỗ trợ trước khi chuyển tiền; không thanh toán lại bằng một phương
              thức khác.
            </p>
          )}
          {r.status === "REVIEW" ? (
            <p
              role="status"
              className="flex items-start gap-2 rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-900"
            >
              <CheckCircle2 className="mt-1 shrink-0" size={18} />
              Đã gửi đối soát. Khóa học mở sau khi quản trị viên kiểm tra đã
              nhận đủ tiền; trang sẽ tự cập nhật trạng thái.
            </p>
          ) : (
            r.status !== "APPROVED" && (
              <div className="space-y-3">
                {r.status === "REJECTED" && (
                  <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
                    Cần đối soát lại: {r.reviewerNote}
                  </p>
                )}
                <label className="block text-sm font-medium">
                  Mã giao dịch MoMo
                  <input
                    autoComplete="off"
                    maxLength={121}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200 p-3"
                    placeholder="Ví dụ: 154131562196"
                  />
                </label>
                <button
                  disabled={busy || !transactionCodeValid}
                  onClick={() =>
                    act(() =>
                      api.platform(
                        `/payments/manual/${r.id}/report`,
                        auth.accessToken,
                        { note: transactionCode },
                      ),
                    )
                  }
                  className="rounded-xl bg-pink-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
                >
                  {busy
                    ? "Đang gửi…"
                    : momo
                      ? "Tôi đã chuyển MoMo — gửi đối soát"
                      : "Gửi yêu cầu đối soát đơn cũ"}
                </button>
                <p className="text-xs leading-5 text-slate-500">
                  Nút này chỉ báo cho quản trị viên kiểm tra, chưa xác nhận đã
                  nhận tiền và chưa mở khóa học. Không nhập mật khẩu hoặc OTP.
                </p>
              </div>
            )
          )}
        </>
      )}
      {error && (
        <p
          role="alert"
          className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="text-sm text-pink-700">
          {notice}
        </p>
      )}
    </div>
  );
}
