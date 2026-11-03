import { useCallback, useEffect, useState } from "react";
import { api } from "../services/api";
import MomoWalletSettings from "./MomoWalletSettings";
const transactionHint = (value) =>
  /^\s*#?\d{6,30}\s*$/.test(value || "") ? value.trim().replace(/^#/, "") : "";
const field = "w-full rounded-xl border border-slate-200 p-3 text-sm";
export default function PaymentReview({ auth }) {
  const [data, setData] = useState(null),
    [filter, setFilter] = useState(""),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [form, setForm] = useState({}),
    [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    try {
      setData(
        await api.platform(
          "/payments/manual" + (filter ? "?status=" + filter : ""),
          auth.accessToken,
        ),
      );
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }, [auth.accessToken, filter]);
  useEffect(() => {
    let active = true;
    api
      .platform(
        "/payments/manual" + (filter ? "?status=" + filter : ""),
        auth.accessToken,
      )
      .then((d) => {
        if (active) {
          setData(d);
          setError("");
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [auth.accessToken, filter]);
  const review = async (r, decision) => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const f = form[r.id] || {};
      const result = await api.platform(
        `/payments/manual/${r.id}/review`,
        auth.accessToken,
        {
          decision,
          note: f.note || "",
          verified: !!f.verified,
          receivedAmount: Number(r.amount),
          receivedReference: r.reference,
          transactionCode: f.transaction ?? transactionHint(r.learnerNote),
        },
      );
      setMessage(result.message);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const change = (id, key, value) =>
    setForm((p) => ({ ...p, [id]: { ...p[id], [key]: value } }));
  return (
    <div className="min-w-0 space-y-6">
      <details
        className="rounded-2xl border border-pink-100 bg-white p-4"
        open={data ? !data.walletConfigured : false}
      >
        <summary className="cursor-pointer font-bold text-pink-800">
          Cấu hình QR nhận học phí MoMo
        </summary>
        <div className="mt-4">
          <MomoWalletSettings auth={auth} onSaved={load} />
        </div>
      </details>
      <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">Đối soát học phí MoMo</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Kiểm tra giao dịch nhận tiền trong MoMo, đúng số tiền và mã đơn
              trước khi mở quyền học. Các đơn cũ vẫn được giữ trong lịch sử.
            </p>
          </div>
          <button onClick={load} className="font-semibold text-blue-700">
            Làm mới
          </button>
        </div>
        <label className="block text-sm font-medium">
          Trạng thái
          <select
            className={field}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            {[
              ["", "Tất cả"],
              ["REVIEW", "Học viên đã báo thanh toán"],
              ["PENDING", "Chờ thanh toán"],
              ["APPROVED", "Đã xác nhận"],
              ["REJECTED", "Cần đối soát lại"],
            ].map(([v, t]) => (
              <option key={v} value={v}>
                {t}
              </option>
            ))}
          </select>
        </label>
        {data && !data.walletConfigured && data.mode !== "gateway" && (
          <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
            Chưa có QR nhận tiền MoMo. Hãy tải QR và lưu thông tin chủ ví trong
            phần cấu hình phía trên.
          </p>
        )}
        {error && (
          <p role="alert" className="rounded-xl bg-red-50 p-3 text-red-700">
            {error}
          </p>
        )}
        {message && (
          <p
            role="status"
            className="rounded-xl bg-emerald-50 p-3 text-emerald-800"
          >
            {message}
          </p>
        )}
        {data?.requests.length === 0 && (
          <p className="py-6 text-center text-slate-500">
            Chưa có yêu cầu đối soát.
          </p>
        )}
        {data?.requests.map((r) => (
          <article
            key={r.id}
            className="space-y-4 rounded-2xl border border-slate-200 p-4"
          >
            <div className="flex flex-wrap justify-between gap-2">
              <div>
                <strong>{r.course}</strong>
                <p className="mt-1 text-sm text-slate-600">
                  {r.learner} · Đơn #{r.orderId}{" "}
                  {r.isTestAccount && "· Tài khoản kiểm thử"}
                </p>
              </div>
              <span className="text-sm font-bold text-blue-700">
                {Number(r.amount).toLocaleString("vi-VN")} đ
              </span>
            </div>
            <p className="text-sm">
              {r.method === "MOMO_WALLET"
                ? "Ví MoMo cá nhân"
                : r.method === "CASH"
                  ? "Thu phí trực tiếp (đơn cũ)"
                  : "Chuyển khoản (đơn cũ)"}{" "}
              · <strong>{r.reference}</strong> ·{" "}
              {
                {
                  PENDING: "Chờ thanh toán",
                  REVIEW: "Đang chờ đối soát",
                  APPROVED: "Đã xác nhận",
                  REJECTED: "Cần đối soát lại",
                }[r.status]
              }
            </p>
            {r.bank && (
              <p className="text-xs text-slate-600">
                {r.method === "MOMO_WALLET" ? (
                  <>
                    Ví nhận tại thời điểm tạo đơn: {r.bank.receiverName} ·{" "}
                    {r.bank.receiverPhone}
                  </>
                ) : (
                  <>
                    Tài khoản nhận tại thời điểm tạo đơn: {r.bank.bankName} ·{" "}
                    {r.bank.account} · {r.bank.accountName}
                  </>
                )}
              </p>
            )}
            {r.learnerNote && (
              <p className="text-sm text-slate-600">
                Học viên: {r.learnerNote}
              </p>
            )}
            {r.reviewerNote && (
              <p className="text-sm text-slate-600">
                Đối soát: {r.reviewerNote}
              </p>
            )}
            {r.orderStatus === "PENDING" && r.status === "REVIEW" && (
              <div className="space-y-3 border-t pt-4">
                <p className="rounded-xl bg-slate-50 p-3 text-sm leading-6">
                  Đối chiếu giao dịch nhận đủ{" "}
                  <strong>{Number(r.amount).toLocaleString("vi-VN")} đ</strong>{" "}
                  cho đơn <strong>{r.reference}</strong>. Không cần nhập lại số
                  tiền hoặc mã đơn.
                </p>
                <label className="block text-sm font-medium">
                  Mã giao dịch MoMo đã nhận tiền
                  <input
                    className={`${field} mt-2`}
                    autoComplete="off"
                    maxLength={120}
                    value={
                      form[r.id]?.transaction ?? transactionHint(r.learnerNote)
                    }
                    onChange={(e) =>
                      change(r.id, "transaction", e.target.value)
                    }
                    placeholder="Ví dụ: #154131562196 hoặc 154131562196"
                  />
                </label>
                <details className="text-sm">
                  <summary className="cursor-pointer text-slate-600">
                    Ghi chú / lý do trả lại
                  </summary>
                  <label className="mt-2 block">
                    Ghi chú đối soát
                    <textarea
                      className={`${field} mt-2`}
                      maxLength={1000}
                      value={form[r.id]?.note || ""}
                      onChange={(e) => change(r.id, "note", e.target.value)}
                      placeholder="Không bắt buộc khi xác nhận; nhập lý do nếu yêu cầu kiểm tra lại."
                    />
                  </label>
                </details>
                <label className="flex gap-2 text-sm leading-6">
                  <input
                    type="checkbox"
                    checked={!!form[r.id]?.verified}
                    onChange={(e) => change(r.id, "verified", e.target.checked)}
                  />
                  Tôi đã kiểm tra trong MoMo: đúng người nhận, đã nhận đủ{" "}
                  {Number(r.amount).toLocaleString("vi-VN")} đ cho đơn này.
                </label>
                <div className="flex flex-wrap gap-3">
                  <button
                    disabled={busy || !form[r.id]?.verified}
                    onClick={() => review(r, "APPROVE")}
                    className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-40"
                  >
                    Xác nhận nhận tiền & mở khóa
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => review(r, "REJECT")}
                    className="rounded-xl border border-amber-200 px-4 py-3 text-sm font-bold text-amber-800 disabled:opacity-40"
                  >
                    Chưa khớp — yêu cầu kiểm tra lại
                  </button>
                </div>
              </div>
            )}
          </article>
        ))}
      </section>
    </div>
  );
}
