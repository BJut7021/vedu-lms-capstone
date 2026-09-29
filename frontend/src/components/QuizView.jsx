import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2, XCircle, ArrowLeft, Award, Sparkles } from 'lucide-react';

export default function QuizView({ quizData, onBack, onComplete }) {
  const [timeLeft, setTimeLeft] = useState(quizData.durationMinutes * 60);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (isSubmitted || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isSubmitted, timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelectOption = (questionId, optionIndex) => {
    if (isSubmitted) return;
    setSelectedAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleSubmit = () => {
    if (isSubmitted) return;

    let correctCount = 0;
    quizData.questions.forEach(q => {
      if (selectedAnswers[q.id] === q.correctAnswer) {
        correctCount++;
      }
    });

    const score = Number(((correctCount / quizData.questions.length) * 10).toFixed(1));
    const passed = score >= quizData.passingScore;
    const timeSpent = (quizData.durationMinutes * 60) - timeLeft;

    const res = {
      score,
      correctCount,
      totalQuestions: quizData.questions.length,
      passed,
      timeSpent: `${Math.floor(timeSpent / 60)} phút ${timeSpent % 60} giây`
    };

    setResult(res);
    setIsSubmitted(true);

    if (onComplete) {
      onComplete(res);
    }
  };

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
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Đánh giá năng lực</span>
            <h1 className="text-xl font-black text-gray-900 mt-1">{quizData.title}</h1>
          </div>

          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-base font-bold shadow-sm ${
            timeLeft < 120 ? 'bg-red-50 text-red-600 border border-red-200 animate-pulse' : 'bg-blue-50 text-blue-700'
          }`}>
            <Clock size={18} />
            <span>{formatTime(timeLeft)}</span>
          </div>
        </div>

        {isSubmitted && result && (
          <div className={`p-6 rounded-2xl border text-center space-y-3 ${
            result.passed ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-red-50 border-red-200 text-red-900'
          }`}>
            <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center bg-white shadow">
              <Award size={28} className={result.passed ? 'text-emerald-600' : 'text-red-500'} />
            </div>
            <h2 className="text-2xl font-black">
              {result.passed ? 'Chúc mừng! Bạn đã Đạt yêu cầu' : 'Chưa đạt điểm chuẩn'}
            </h2>
            <p className="text-sm">
              Điểm số: <strong className="text-xl">{result.score}/10</strong> ({result.correctCount}/{result.totalQuestions} câu đúng) • Thời gian làm: {result.timeSpent}
            </p>
            <div className="p-3 bg-white/80 rounded-xl text-xs font-semibold text-gray-700 inline-block shadow-sm">
              <Sparkles size={14} className="inline mr-1 text-indigo-500" />
              [UI Hook: onQuizSubmit] Đã đóng gói điểm {result.score} gửi về máy chủ!
            </div>
          </div>
        )}

        <div className="space-y-6">
          {quizData.questions.map((q, index) => {
            return (
              <div key={q.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
                <div className="flex items-start gap-3">
                  <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                    {index + 1}
                  </span>
                  <h3 className="text-base font-bold text-gray-900 leading-snug">{q.question}</h3>
                </div>

                <div className="space-y-2.5 pt-2">
                  {q.options.map((opt, optIndex) => {
                    const isSelected = selectedAnswers[q.id] === optIndex;
                    let optionStyle = 'border-gray-200 hover:border-blue-400 bg-gray-50/50';

                    if (isSubmitted) {
                      if (optIndex === q.correctAnswer) {
                        optionStyle = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold';
                      } else if (isSelected && optIndex !== q.correctAnswer) {
                        optionStyle = 'border-red-500 bg-red-50 text-red-900';
                      }
                    } else if (isSelected) {
                      optionStyle = 'border-blue-600 bg-blue-50/70 text-blue-900 font-semibold ring-2 ring-blue-500/20';
                    }

                    return (
                      <div
                        key={optIndex}
                        onClick={() => handleSelectOption(q.id, optIndex)}
                        className={`p-3.5 rounded-xl border text-sm flex items-center justify-between cursor-pointer transition ${optionStyle}`}
                      >
                        <span>{opt}</span>
                        {isSubmitted && optIndex === q.correctAnswer && (
                          <CheckCircle2 size={18} className="text-emerald-600" />
                        )}
                        {isSubmitted && isSelected && optIndex !== q.correctAnswer && (
                          <XCircle size={18} className="text-red-500" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {!isSubmitted ? (
          <div className="text-center pt-4">
            <button
              onClick={handleSubmit}
              className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 text-sm transition"
            >
              Nộp bài kiểm tra
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