import { useState } from "react";
import { api } from "../services/api";
import QuizView from "./QuizView";

export default function InlineLessonQuiz({ quizId, token, onQuizPassed }) {
  const [session, setSession] = useState(null);
  const [starting, setStarting] = useState(false);
  const [passed, setPassed] = useState(false);
  const [error, setError] = useState("");
  const [refreshError, setRefreshError] = useState("");

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
      token,
    );
    // Chỉ dựa vào kết quả chấm của backend; không tự đánh dấu hoàn thành.
    if (response?.passed) {
      setPassed(true);
      try {
        await onQuizPassed?.();
      } catch (err) {
        setRefreshError(
          "Quiz đã đạt nhưng chưa cập nhật được danh sách bài học. Hãy tải lại trang.",
        );
      }
    }
    return response;
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <h2 className="text-lg font-bold text-slate-900">
        3. Quiz kiểm tra cuối bài
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">
        Làm đạt quiz này để hoàn thành bài học và mở bài kế tiếp. Đồng hồ
        chỉ bắt đầu khi bạn nhấn nút bắt đầu.
      </p>

      {!quizId ? (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Bài học chưa có quiz được công bố và gắn đúng bài. Giảng viên cần
          tạo quiz cho bài này trước khi học viên có thể hoàn thành.
        </p>
      ) : !session ? (
        <button
          type="button"
          onClick={startQuiz}
          disabled={starting}
          className="mt-4 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {starting ? "Đang chuẩn bị quiz..." : "Bắt đầu làm quiz"}
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
                document.getElementById("lesson-navigation")?.scrollIntoView({
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
                "PATCH",
              )
            }
          />

          
{passed && (
  <button
    type="button"
    onClick={startQuiz}
    disabled={starting}
    className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-bold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
  >
    {starting
      ? "Đang mở lượt mới..."
      : "Làm lại bài kiểm tra"}
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
