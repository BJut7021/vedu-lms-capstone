import { useState, useEffect, useCallback, useRef } from "react";
import { Clock, CheckCircle2, ArrowLeft, Award, Sparkles } from "lucide-react";

export default function QuizView({ quizData, onBack, onSubmit, onSaveDraft }) {
  const [clockOffset] = useState(
    () => new Date(quizData.serverTime).getTime() - Date.now(),
  );
  const [timeLeft, setTimeLeft] = useState(() =>
    Math.max(
      0,
      Math.floor(
        (new Date(quizData.deadline).getTime() - Date.now() - clockOffset) /
          1000,
      ),
    ),
  );
  const [selectedAnswers, setSelectedAnswers] = useState(() =>
    Object.fromEntries(
      (quizData.savedAnswers || []).map((a) => [
        a.questionId,
        a.answerIds || (a.answerId ? [a.answerId] : []),
      ]),
    ),
  );
  const automaticSubmitted = useRef(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isSubmitted || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setSubmitError("Đã hết thời gian. Hãy nộp các đáp án đã chọn.");
          return 0;
        }
        return Math.max(
          0,
          Math.floor(
            (new Date(quizData.deadline).getTime() - Date.now() - clockOffset) /
              1000,
          ),
        );
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isSubmitted, timeLeft, quizData.deadline, clockOffset]);

  useEffect(() => {
    if (isSubmitted || timeLeft <= 0) return;
    const timer = setTimeout(() => {
      onSaveDraft(
        Object.entries(selectedAnswers).map(([id, ids]) => ({
          questionId: Number(id),
          answerIds: ids,
        })),
      ).catch((error) => setSubmitError(`Chưa lưu nháp: ${error.message}`));
    }, 350);
    return () => clearTimeout(timer);
  }, [selectedAnswers, onSaveDraft, isSubmitted, timeLeft]);

  const handleSelectOption = (questionId, optionIndex) => {
    if (isSubmitted || timeLeft <= 0) return;
    const multiple =
      quizData.questions.find((q) => q.id === questionId)?.type ===
      "MULTIPLE_CHOICE";
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: multiple
        ? prev[questionId]?.includes(optionIndex)
          ? prev[questionId].filter((x) => x !== optionIndex)
          : [...(prev[questionId] || []), optionIndex]
        : [optionIndex],
    }));
  };

  const handleSubmit = useCallback(async () => {
    if (isSubmitted) return;

    setSubmitError("");
    setSubmitting(true);
    try {
      const answers = Object.entries(selectedAnswers).map(
        ([questionId, answerIds]) => ({
          questionId: Number(questionId),
          answerIds,
        }),
      );
      const response = await onSubmit(answers);
      const timeSpent = response.durationSeconds;
      setResult({
        ...response,
        timeSpent: `${timeSpent} giây`,
      });
      setIsSubmitted(true);
    } catch (error) {
      setSubmitError(error.message);
    } finally {
      setSubmitting(false);
    }
  }, [isSubmitted, selectedAnswers, onSubmit]);

  useEffect(() => {
    if (timeLeft === 0 && !isSubmitted && !automaticSubmitted.current) {
      automaticSubmitted.current = true;
      handleSubmit();
    }
  }, [timeLeft, isSubmitted, handleSubmit]);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-blue-600 transition"
        >
          <ArrowLeft size={18} />
          <span>Thoát bài kiểm tra</span>
        </button>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              Đánh giá năng lực
            </span>
            <h1 className="text-xl font-black text-gray-900 mt-1">
              {quizData.title}
            </h1>
          </div>

          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-base font-bold shadow-sm ${
              timeLeft < 120
                ? "bg-red-50 text-red-600 border border-red-200 animate-pulse"
                : "bg-blue-50 text-blue-700"
            }`}
          >
            <Clock size={18} />
            <span>{timeLeft} giây</span>
          </div>
        </div>

        {isSubmitted && result && (
          <div
            className={`p-6 rounded-2xl border text-center space-y-3 ${
              result.passed
                ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                : "bg-red-50 border-red-200 text-red-900"
            }`}
          >
            <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center bg-white shadow">
              <Award
                size={28}
                className={result.passed ? "text-emerald-600" : "text-red-500"}
              />
            </div>
            <h2 className="text-2xl font-black">
              {result.passed
                ? "Chúc mừng! Bạn đã Đạt yêu cầu"
                : "Chưa đạt điểm chuẩn"}
            </h2>
            <p className="text-sm">
              Điểm số: <strong className="text-xl">{result.score}/10</strong> (
              {result.correctCount}/{result.totalQuestions} câu đúng) • Thời
              gian làm: {result.timeSpent}
            </p>
            <div className="p-3 bg-white/80 rounded-xl text-xs font-semibold text-gray-700 inline-block shadow-sm">
              <Sparkles size={14} className="inline mr-1 text-indigo-500" />
              Điểm được chấm và lưu trên máy chủ.{" "}
              {result.expired ? "Đã hết giờ: dùng đáp án nháp hợp lệ." : ""}
            </div>
          </div>
        )}

        <div className="space-y-6">
          {quizData.questions.map((q, index) => {
            return (
              <div
                key={q.id}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4"
              >
                <div className="flex items-start gap-3">
                  <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                    {index + 1}
                  </span>
                  <h3 className="text-base font-bold text-gray-900 leading-snug">
                    {q.question}
                  </h3>
                </div>

                <div className="space-y-2.5 pt-2">
                  {q.options.map((opt) => {
                    const isSelected = selectedAnswers[q.id]?.includes(opt.id);
                    let optionStyle =
                      "border-gray-200 hover:border-blue-400 bg-gray-50/50";

                    if (isSelected) {
                      optionStyle =
                        "border-blue-600 bg-blue-50/70 text-blue-900 font-semibold ring-2 ring-blue-500/20";
                    }

                    return (
                      <button
                        type="button"
                        disabled={isSubmitted || timeLeft <= 0}
                        key={opt.id}
                        onClick={() => handleSelectOption(q.id, opt.id)}
                        className={`w-full p-3.5 rounded-xl border text-sm text-left flex items-center justify-between cursor-pointer transition ${optionStyle}`}
                      >
                        <span>{opt.text}</span>
                        {isSelected && (
                          <CheckCircle2 size={18} className="text-blue-600" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {!isSubmitted ? (
          <div className="text-center pt-4">
            {submitError && (
              <p className="mb-3 text-sm font-semibold text-red-600">
                {submitError}
              </p>
            )}
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 text-sm transition"
            >
              {submitting ? "Đang chấm bài..." : "Nộp bài kiểm tra"}
            </button>
          </div>
        ) : (
          <div className="text-center pt-4">
            <button
              onClick={onBack}
              className="px-8 py-3 bg-gray-800 hover:bg-gray-900 text-white font-bold rounded-xl text-sm transition"
            >
              Trở về phòng học
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
