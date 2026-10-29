import { useEffect, useRef, useState } from "react";
export default function MomoQrImage({ src, filename = "VEDU-MoMo.png" }) {
  const [open, setOpen] = useState(false),
    trigger = useRef(null);
  const close = () => {
    setOpen(false);
    trigger.current?.focus();
  };
  useEffect(() => {
    if (!open) return;
    const key = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [open]);
  return (
    <div className="min-w-0">
      <div className="rounded-2xl border border-pink-100 bg-white p-2">
        <img
          src={src}
          alt="QR nhận học phí qua ví MoMo"
          className="mx-auto aspect-square w-full max-w-[420px] object-contain"
        />
      </div>
      <div className="mt-3 flex flex-wrap justify-center gap-4 text-sm font-bold text-pink-700">
        <button ref={trigger} type="button" onClick={() => setOpen(true)}>
          Phóng to QR
        </button>
        <a href={src} download={filename}>
          Tải QR MoMo
        </a>
      </div>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="QR MoMo phóng to"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4"
        >
          <button
            className="absolute inset-0"
            aria-label="Đóng QR phóng to"
            onClick={close}
          />
          <section className="relative max-h-[95vh] w-full max-w-2xl overflow-auto rounded-2xl bg-white p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <strong>Quét QR bằng MoMo</strong>
              <button
                autoFocus
                onClick={close}
                className="rounded-lg bg-slate-100 px-3 py-2 font-bold"
              >
                Đóng
              </button>
            </div>
            <img
              src={src}
              alt="Mã QR MoMo lớn để quét"
              className="mx-auto aspect-square w-full object-contain"
            />
            <p className="mt-2 text-center text-sm text-slate-600">
              Kiểm tra người nhận trong MoMo trước khi xác nhận chuyển tiền.
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
