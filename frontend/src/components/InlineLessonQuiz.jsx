import { useState } from "react";
import { CheckCircle2, RotateCcw, Target } from "lucide-react";
import { api } from "../services/api";
import QuizView from "./QuizView";

export default function InlineLessonQuiz({
  quizId,
  token,
  onQuizPassed,
  completed = false,
}) {
  const [session, setSession] = useState(null);
  const [starting, setStarting] = useState(false);
  const [passed, setPassed] = useState(false);
  const [error, setError] = useState("");
  const [refreshError, setRefreshError] = useState("");

  const isPassed = passed || completed;

  const startQuiz = async () => {
    if (!quizId || starting) return;
    setStarting(true);
    setError("");
    setRefreshError("");

    try {
      const [quizData, attempt] = await Promise.all([
        api.playableQuiz(quizId, token),
        api.startQuizAttempt(quizId, token),
      ]);

      setPassed(false);
      setSession({
        attemptId: attempt.attemptId,
        quizData: {
          ...quizData,
          deadline: attempt.deadline,
          serverTime: attempt.serverTime,
          savedAnswers: attempt.answers,
        },
      });
    } catch (err) {
      setError(err?.message || "Không thể mở quiz.");
    } finally {
      setStarting(false);
    }
  };

  const submitQuiz = async (answers) => {
    const response = await api.submitQuizAttempt(
      session.attemptId,
      answers,
      token
    );

    // Chi backend duoc quyet dinh ket qua dat quiz.
    if (response?.passed) {
      setPassed(true);
      try {
        await onQuizPassed?.();
      } catch {
        setRefreshError(
          "Quiz đã đạt nhưng chưa cập nhật được tiến độ. Hãy tải lại trang."
        );
      }
    }

    return response;
  };

  return (
    <section className="rounded-2xl border border-blue-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-100 text-blue-600">
            <Target size={24} />
          </span>

          <div className="min-w-0">
            <h2 className="text-lg font-extrabold text-slate-900">
              Quiz cuối bài
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Trắc nghiệm kiểm tra kiến thức bài học
            </p>
          </div>
        </div>

        {isPassed && (
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-100 px-3 py-2 text-xs font-bold text-emerald-700">
            <CheckCircle2 size={16} />
            Đã đạt
          </span>
        )}
      </div>

      {isPassed ? (
        <div className="mt-5 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <div className="flex items-center gap-2 font-bold">
            <CheckCircle2 size={18} />
            Bạn đã đạt yêu cầu quiz của bài học
          </div>
          <p className="mt-1 text-xs text-emerald-700">
            Kết quả hoàn thành được ghi nhận từ hệ thống.
          </p>
        </div>
      ) : (
        <p className="mt-4 text-sm leading-6 text-slate-500">
          Hoàn thành quiz để kiểm tra mức độ hiểu bài.
          Đồng hồ chỉ bắt đầu khi bạn mở lượt làm bài.
        </p>
      )}

      {!quizId ? (
        <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
          Bài học chưa có quiz được công bố.
        </p>
      ) : !session ? (
        <button
          type="button"
          onClick={startQuiz}
          disabled={starting}
          className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition disabled:opacity-50 ${
            isPassed
              ? "border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {isPassed && <RotateCcw size={17} />}
          {starting
            ? "Đang chuẩn bị quiz..."
            : isPassed
              ? "Làm lại quiz"
              : "Bắt đầu làm quiz"}
        </button>
      ) : (
        <div className="mt-5 border-t border-slate-100 pt-4">
          <QuizView
            key={session.attemptId}
            embedded
            quizData={session.quizData}
            onBack={() => setSession(null)}
            onContinue={() => {
              if (passed) {
                document
                  .getElementById("lesson-navigation")
                  ?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
              } else {
                setSession(null);
              }
            }}
            onSubmit={submitQuiz}
            onSaveDraft={(answers) =>
              api.platform(
                `/attempts/${session.attemptId}/draft`,
                token,
                { answers },
                "PATCH"
              )
            }
          />

          {passed && (
            <button
              type="button"
              onClick={startQuiz}
              disabled={starting}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-bold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
            >
              <RotateCcw size={17} />
              {starting ? "Đang mở lượt mới..." : "Làm lại quiz"}
            </button>
          )}
        </div>
      )}

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {refreshError && (
        <p role="status" className="mt-3 text-sm text-amber-700">
          {refreshError}
        </p>
      )}
    </section>
  );
}
