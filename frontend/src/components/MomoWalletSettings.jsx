import { useEffect, useState } from "react";
import { api } from "../services/api";
import MomoQrImage from "./MomoQrImage";

export default function MomoWalletSettings({ auth, onSaved }) {
  const [data, setData] = useState(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => {
    let active = true;
    api
      .platform("/payments/momo/wallet", auth.accessToken)
      .then((value) => {
        if (!active) return;
        setData(value);
        setName(value.wallet?.receiverName || "");
        setPhone(value.wallet?.receiverPhone || "");
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [auth.accessToken]);
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);
  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const value = await api.configureMomoWallet(
        {
          receiverName: name.trim(),
          receiverPhone: phone.trim(),
          confirmReceivingQr: confirmed,
        },
        file,
        auth.accessToken,
      );
      setData(value);
      setMessage(value.message);
      setConfirmed(false);
      await onSaved();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="rounded-2xl border border-pink-100 bg-white p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-bold">QR nhận học phí MoMo</h2>
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${data?.wallet ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"}`}
        >
          {data?.wallet ? "Đã cấu hình QR nhận tiền" : "Chưa có QR nhận tiền"}
        </span>
      </div>
      <p className="mb-5 text-sm leading-6 text-slate-600">
        Mở MoMo → Nhận tiền → Tải xuống mã QR. Tải ảnh đó tại đây và kiểm tra
        tên chủ ví, số điện thoại. Dùng QR Nhận tiền có thể dùng chung cho nhiều
        đơn; học viên phải nhập số tiền và nội dung riêng của từng đơn.
      </p>
      {data?.mode === "gateway" && (
        <p className="mb-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
          Ứng dụng đang chọn MoMo Business. Để dùng ví cá nhân, đặt
          MOMO_PAYMENT_MODE=personal và khởi động lại backend.
        </p>
      )}
      <form
        onSubmit={submit}
        className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_300px]"
      >
        <div className="space-y-4">
          <label className="block text-sm font-medium">
            Tên chủ ví MoMo
            <input
              required
              minLength={2}
              maxLength={120}
              autoComplete="off"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 p-3"
              placeholder="Đúng tên người nhận hiển thị trong MoMo"
            />
          </label>
          <label className="block text-sm font-medium">
            Số điện thoại nhận tiền MoMo
            <input
              required
              type="tel"
              pattern="(0[0-9]{9}|\+84[0-9]{9})"
              autoComplete="off"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 p-3"
              placeholder="Số điện thoại của ví nhận học phí"
            />
          </label>
          <label className="block text-sm font-medium">
            Ảnh QR Nhận tiền từ MoMo (PNG/JPG/WebP, tối đa 4 MB)
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="mt-2 block w-full rounded-xl border border-dashed border-pink-200 p-3 text-sm"
              onChange={(e) => {
                const chosen = e.target.files?.[0];
                setError("");
                if (
                  chosen &&
                  (!["image/png", "image/jpeg", "image/webp"].includes(
                    chosen.type,
                  ) ||
                    chosen.size > 4 * 1024 * 1024)
                ) {
                  setError("Chọn ảnh PNG/JPG/WebP, tối đa 4 MB.");
                  e.target.value = "";
                  setFile(null);
                  setPreview("");
                  return;
                }
                setFile(chosen || null);
                setPreview(chosen ? URL.createObjectURL(chosen) : "");
                setConfirmed(false);
              }}
            />
          </label>
          <label className="flex items-start gap-2 text-sm leading-6 text-slate-700">
            <input
              required
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-1"
            />
            Tôi đã quét thử và kiểm tra đúng người nhận. Đây là QR Nhận tiền,
            không phải Mã thanh toán dùng để trừ tiền.
          </label>
          <p className="text-xs leading-5 text-slate-500">
            Chỉ tải ảnh QR nhận tiền. Không nhập mật khẩu, OTP hoặc mã đăng nhập
            MoMo. Đổi QR không thay người nhận của đơn đã tạo.
          </p>
          <button
            disabled={busy || !data || !confirmed}
            className="rounded-xl bg-pink-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            {busy ? "Đang lưu…" : "Lưu QR nhận học phí MoMo"}
          </button>
        </div>
        <div className="min-w-0 rounded-2xl bg-pink-50 p-3">
          {preview || data?.wallet?.qrDataUrl ? (
            <MomoQrImage src={preview || data.wallet.qrDataUrl} />
          ) : (
            <div className="flex min-h-48 items-center justify-center text-center text-sm text-pink-800">
              Ảnh QR nhận tiền sẽ hiển thị tại đây
            </div>
          )}
        </div>
      </form>
      {error && (
        <p
          role="alert"
          className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}
      {message && (
        <p
          role="status"
          className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800"
        >
          {message}
        </p>
      )}
    </section>
  );
}
