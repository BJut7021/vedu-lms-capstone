import { ArrowLeft, BookOpenCheck, LockKeyhole } from "lucide-react";

function displayMessage(value) {
  const message = String(value || "").trim();
  return message || "Bạn cần hoàn thành module bắt buộc trước khi làm bài kiểm tra cuối khóa.";
}

export default function LockedFinalExamPage({
  message,
  onContinue,
  onBack,
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-10">
      <section className="w-full max-w-xl space-y-6 rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-10">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-blue-50 text-blue-700">
          <LockKeyhole aria-hidden="true" size={30} />
        </div>

        <div className="space-y-3">
          <p className="text-sm font-bold uppercase tracking-wider text-blue-700">
            Bài kiểm tra cuối khóa
          </p>
          <h1 className="text-2xl font-black text-slate-950 sm:text-3xl">
            Bạn chưa đủ điều kiện làm bài
          </h1>
          <p role="alert" className="text-sm leading-6 text-slate-600 sm:text-base">
            {displayMessage(message)}
          </p>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 py-3 font-bold text-slate-700 transition hover:bg-slate-50"
          >
            <ArrowLeft aria-hidden="true" size={18} />
            Quay lại khóa học
          </button>
          <button
            type="button"
            onClick={onContinue}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white transition hover:bg-blue-700"
          >
            <BookOpenCheck aria-hidden="true" size={18} />
            Tiếp tục học
          </button>
        </div>
      </section>
    </main>
  );
}
