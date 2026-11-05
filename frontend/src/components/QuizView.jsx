import { useState, useEffect, useCallback, useRef } from "react";
import { Clock, CheckCircle2, ArrowLeft, Award, Sparkles } from "lucide-react";
import { formatMinutes } from "../services/time";

export default function QuizView({
  quizData,
  onBack,
  onSubmit,
  onSaveDraft,
  onContinue,
  onResult,
  embedded = false,
  essayConfig = null,
  essayResult = null,
  onEssayUpload = null,
  onRefreshEssay = null,
}) {
  const [essayFile,setEssayFile] = useState(null);
  const [essayBusy,setEssayBusy] = useState(false);
  const [essayError,setEssayError] = useState('');
  const [essayState,setEssayState] = useState(essayResult);
  useEffect(()=>setEssayState(essayResult),[essayResult]);
  const uploadEssay=async()=>{
    if(!essayFile || !onEssayUpload) return;
    setEssayBusy(true);setEssayError('');
    try {await onEssayUpload(essayFile);setEssayFile(null);setEssayState(await onRefreshEssay());}
    catch(e){setEssayError(e.message||'Không nộp được ảnh');}
    finally {setEssayBusy(false);}
  };
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
        timeSpent: formatMinutes(timeSpent),
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
    <div
  className={
    embedded
      ? "w-full bg-white py-2"
      : "min-h-screen bg-gray-50 py-8 px-4 sm:px-6"
  }
>
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
            <span aria-label="Thời gian còn lại">
              {formatMinutes(timeLeft)}
            </span>
          </div>
        </div>

        {isSubmitted && result && (
          <div
            className={`p-6 rounded-2xl border text-center space-y-3 ${
              essayConfig ? "bg-blue-50 border-blue-200 text-blue-900" : result.passed
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
              {essayConfig ? "Đã nộp trắc nghiệm – chờ chấm tự luận" : result.passed
                ? "Chúc mừng! Bạn đã Đạt yêu cầu"
                : "Chưa đạt điểm chuẩn"}
            </h2>
            <p className="text-sm">
              {essayConfig ? "Điểm trắc nghiệm" : "Điểm số"}: <strong className="text-xl">{result.score}/10</strong> (
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

        {essayConfig && (
          <section className="bg-white rounded-2xl p-6 border border-blue-200 space-y-3">
            <h2 className="text-xl font-bold text-gray-900">Phần 2 – Tự luận (60%)</h2>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{essayConfig.prompt || 'Chưa có đề tự luận. Vui lòng liên hệ giảng viên; hệ thống chưa thể nhận ảnh khi chưa có đề.'}</p>
            <p className="text-xs text-gray-500">Nộp ảnh JPG, PNG hoặc WEBP tối đa 5MB. Giảng viên sẽ chấm theo thang 10. Điểm cuối khóa = trắc nghiệm × 40% + tự luận × 60%. Đạt từ 5/10.</p>
            {essayState?.status==='PENDING_REVIEW' && <p className="font-semibold text-amber-700">Đã nhận ảnh bài làm. Đang chờ giảng viên chấm.</p>}
            {essayState?.status==='GRADED' && <div className="bg-blue-50 rounded-xl p-3 text-sm space-y-1">
              <p>Điểm trắc nghiệm: {essayState.mcqScore}/10</p>
              <p>Điểm tự luận: {essayState.essayScore}/10</p>
              <p className="font-bold">Tổng kết: {essayState.finalScore}/10 – {essayState.passed?'Đạt':'Chưa đạt'}</p>
              {essayState.feedback && <p>Nhận xét: {essayState.feedback}</p>}
            </div>}
            {essayState?.status!=='GRADED' && essayState?.status!=='PENDING_REVIEW' && Boolean(essayConfig.prompt) && <div className="space-y-3 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
              <label htmlFor="vedu-essay-image" className="block text-sm font-semibold text-gray-900">Tải ảnh bài tự luận lên (JPG, PNG, WEBP; tối đa 5 MB)</label>
              <input id="vedu-essay-image" type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>{ const file=e.target.files?.[0]||null; setEssayError(''); if(file && file.size>5*1024*1024){setEssayFile(null);setEssayError('Ảnh vượt quá 5 MB. Vui lòng chọn ảnh nhỏ hơn.');}else{setEssayFile(file)} }} className="block w-full rounded-lg bg-white p-3 text-sm text-gray-900 border border-gray-200" />
              {essayFile && <p className="text-sm text-blue-800">Đã chọn: {essayFile.name}</p>}
              {!isSubmitted && <p className="text-sm text-blue-800">Đã chọn ảnh thì giữ nguyên, bấm “Nộp bài kiểm tra” ở cuối trang trước; ngay sau đó quay lại đây để bấm “Nộp ảnh tự luận”. Kết quả chỉ được xác nhận sau khi giảng viên chấm ảnh.</p>}
              {isSubmitted && <button type="button" disabled={!essayFile||essayBusy} onClick={uploadEssay} className="rounded-xl bg-blue-600 px-5 py-2 text-white font-bold disabled:opacity-50">{essayBusy?'Đang nộp...':'Nộp ảnh tự luận'}</button>}
            </div>}
            {essayError && <p className="text-red-600 text-sm">{essayError}</p>}
            {isSubmitted && <button type="button" className="text-blue-700 text-sm underline" onClick={async()=>{try{setEssayState(await onRefreshEssay())}catch(e){setEssayError(e.message)}}}>Làm mới kết quả chấm</button>}
          </section>
        )}

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
  <div className="flex flex-wrap justify-center gap-3 pt-4">
    <button
      type="button"
      onClick={onContinue}
      className={`rounded-xl px-6 py-3 text-sm font-bold text-white transition ${
        result?.passed
          ? "bg-emerald-600 hover:bg-emerald-700"
          : "bg-blue-600 hover:bg-blue-700"
      }`}
    >
      {result?.passed
        ? "Tiếp tục học"
        : "Ôn tập bài học"}
    </button>

    <button
      type="button"
      onClick={onBack}
      className="rounded-xl bg-gray-700 px-6 py-3 text-sm font-bold text-white hover:bg-gray-800"
    >
      Về trang khóa học
    </button>
  </div>
)}

      </div>
    </div>
  );
}
