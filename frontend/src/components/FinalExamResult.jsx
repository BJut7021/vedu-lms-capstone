import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Award, BookOpen, CheckCircle2, ChevronDown, ChevronRight,
  ClipboardList, Clock3, Download, FileText, GraduationCap,
  Home, MessageSquareText, RefreshCw, Trophy, XCircle,
} from "lucide-react";
import { api } from "../services/api";
import CourseAssignments from "./CourseAssignments";

const formatScore = (value) => value == null || !Number.isFinite(Number(value))
  ? "—" : `${Number(value).toFixed(2).replace(/\.00$/, "")}/10`;

function Metric({ icon: Icon, label, children, note, tone = "blue" }) {
  const tones = {
    blue: "border-blue-100 bg-blue-50/70 text-blue-700",
    violet: "border-violet-100 bg-violet-50/70 text-violet-700",
    amber: "border-amber-100 bg-amber-50/70 text-amber-700",
    green: "border-emerald-100 bg-emerald-50/70 text-emerald-700",
  };
  return <div className={`min-w-0 rounded-2xl border p-4 sm:p-5 ${tones[tone]}`}>
    <div className="flex items-center gap-3">
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/80"><Icon size={22} /></span>
      <div className="min-w-0">
        <div className="text-xs font-semibold text-slate-600">{label}</div>
        <div className="mt-1 text-xl font-extrabold leading-tight text-slate-900 sm:text-2xl">{children}</div>
        {note && <div className="mt-1 text-xs leading-5 text-slate-600">{note}</div>}
      </div>
    </div>
  </div>;
}

function EssayReview({ courseId, token, attemptId, result, finalMode }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    if (finalMode === "MCQ_ONLY") return;
    let active = true;
    api.platform(`/courses/${courseId}/assignments`, token)
      .then((value) => { if (active) setData(value); })
      .catch((reason) => { if (active) setError(reason.message); });
    return () => { active = false; };
  }, [courseId, token, finalMode]);

  if (finalMode === "MCQ_ONLY") return null;
  const assignments = (data?.assignments || []).filter((a) => a.section_id == null);
  const versions = data?.versions || [];
  const graded = result?.status === "GRADED" && result?.finalScore != null;
  return <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-4 sm:px-6">
      <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-900"><FileText className="text-blue-600" size={20} /> Bài tự luận cuối khóa</h2>
      <span className={`rounded-full px-3 py-1 text-xs font-bold ${graded ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
        {graded ? "Đã chấm" : result?.status === "AWAITING_UPLOAD" ? "Chưa nộp bài" : "Chờ giảng viên chấm"}
      </span>
    </div>
    {error && <p role="alert" className="px-6 py-3 text-sm text-red-700">{error}</p>}
    {!data && !error && <p className="px-6 py-5 text-sm text-slate-500">Đang tải bài tự luận...</p>}
    {data && !assignments.length && <p className="px-6 py-5 text-sm text-slate-500">Chưa có đề tự luận cuối khóa được công bố.</p>}
    {assignments.map((assignment) => {
      const own = versions.filter((v) => Number(v.assignment_id) === Number(assignment.assignment_id) && Number(v.attempt_id) === Number(attemptId));
      const latest = own[0];
      return <div key={assignment.assignment_id} className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[1fr_1.08fr]">
        <div className="min-w-0 space-y-4">
          <div><h3 className="font-bold text-slate-900">{assignment.title}</h3>
            <details className="mt-2 text-sm leading-6 text-slate-600"><summary className="cursor-pointer font-medium text-blue-700">Xem đề bài và hướng dẫn</summary><p className="mt-2 whitespace-pre-wrap">{assignment.instructions}</p></details>
          </div>
          <div className="border-t border-slate-100 pt-4">
            <p className="mb-2 text-sm font-bold text-slate-800">Tệp đã nộp</p>
            {latest?.file_name ? <button type="button"
              onClick={() => api.downloadCourseAssignment(latest.version_id, token, latest.file_name).catch((e) => setError(e.message))}
              className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-left hover:border-blue-300">
              <span className="flex min-w-0 items-center gap-3"><FileText className="shrink-0 text-red-500" size={23} /><span className="min-w-0"><strong className="block truncate text-sm text-blue-700">{latest.file_name}</strong><small className="text-slate-500">Phiên bản {latest.version_no} · {latest.status === "GRADED" ? "Đã chấm" : "Đã nộp"}</small></span></span><Download size={18} className="shrink-0 text-blue-600" />
            </button> : <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500">Chưa có tệp được nộp cho lượt thi này.</div>}
            {latest?.answer_url && <a href={latest.answer_url} target="_blank" rel="noreferrer" className="mt-2 block break-all text-sm text-blue-700 underline">Liên kết bài nộp</a>}
          </div>
        </div>
        <div className="min-w-0 space-y-4 border-t border-slate-100 pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <div>
            <p className="text-sm font-bold text-slate-800">Điểm bài tự luận</p>
            <div className="mt-2 rounded-xl bg-blue-50 p-4 text-center text-2xl font-black text-blue-700">{graded ? formatScore(result.essayScore) : "Chưa chấm"}</div>
          </div>
          {graded && latest?.rubric_scores && <div className="space-y-2"><p className="text-sm font-bold text-slate-800">Chi tiết chấm điểm</p>{(assignment.rubric || []).map((r) => <div key={r.id} className="flex justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-xs"><span>{r.label}</span><strong>{latest.rubric_scores[r.id] ?? "—"}/{r.max}</strong></div>)}</div>}
          <div><p className="flex items-center gap-2 text-sm font-bold text-slate-800"><MessageSquareText size={17} className="text-blue-600" /> Nhận xét của giảng viên</p><p className="mt-2 rounded-xl bg-blue-50/70 p-3 text-sm leading-6 text-slate-700">{graded ? (latest?.feedback || result.feedback || "Giảng viên chưa để lại nhận xét.") : "Giảng viên chưa gửi nhận xét."}</p></div>
        </div>
      </div>;
    })}
    {data && (result?.status === "AWAITING_UPLOAD" || result?.status === "NEEDS_REVISION") && <div className="border-t border-slate-100 px-5 py-4"><p className="mb-2 text-sm text-amber-800">Cần nộp bài tự luận để giảng viên chấm và hoàn tất kết quả cuối khóa.</p><CourseAssignments courseId={courseId} token={token} attemptId={attemptId} /></div>}
  </section>;
}

function AnswerReview({ attemptId, token }) {
  const [review, setReview] = useState(null);
  const [error, setError] = useState("");
  const [open, setOpen] = useState({ 0: true });
  useEffect(() => {
    let active = true;
    api.platform(`/final-essays/attempts/${attemptId}/review`, token)
      .then((data) => { if (active) setReview(data); })
      .catch((e) => { if (active) setError(e.message || "Không tải được đáp án"); });
    return () => { active = false; };
  }, [attemptId, token]);
  const questions = review?.questions || [];
  const correctCount = questions.filter((q) => q.correct).length;
  const allOpen = questions.length > 0 && questions.every((_, i) => open[i]);
  return <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-900"><ClipboardList size={20} className="text-blue-600" /> Xem lại câu trả lời</h2>{review && <p className="mt-1 text-xs text-slate-500">Bạn trả lời đúng {correctCount}/{questions.length} câu hỏi.</p>}</div>
      {!!questions.length && <button type="button" className="text-sm font-semibold text-blue-700" onClick={() => setOpen(Object.fromEntries(questions.map((_, i) => [i, !allOpen])))}>{allOpen ? "Thu gọn tất cả" : "Mở rộng tất cả"}</button>}
    </div>
    {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {!review && !error && <p className="text-sm text-slate-500">Đang tải các câu đã trả lời...</p>}
    <div className="space-y-2">{questions.map((q, i) => <div key={q.questionId} className="overflow-hidden rounded-xl border border-slate-200">
      <button type="button" aria-expanded={!!open[i]} onClick={() => setOpen((v) => ({ ...v, [i]: !v[i] }))} className="flex w-full items-start justify-between gap-3 bg-slate-50/70 px-4 py-3 text-left">
        <span className="flex items-start gap-3"><span className="mt-0.5 text-blue-700">{open[i] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}</span><strong className="text-sm text-slate-900">Câu {i + 1}. {q.text}</strong></span>
        <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${q.correct ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-700"}`}>{q.correct ? <CheckCircle2 size={14} /> : <XCircle size={14} />}{q.correct ? "Đúng" : "Sai"}</span>
      </button>
      {open[i] && <div className="space-y-2 p-3 sm:p-4">{q.options.map((option) => {
        const selected = q.selectedIds.includes(option.id);
        const correct = q.correctIds.includes(option.id);
        return <div key={option.id} className={`flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2.5 text-sm ${correct ? "border-emerald-300 bg-emerald-50" : selected ? "border-red-300 bg-red-50" : "border-slate-200 bg-white"}`}>
          <span aria-hidden="true" className={`size-3.5 shrink-0 rounded-full border-2 ${selected ? "border-blue-600 bg-blue-600" : "border-slate-400"}`} />
          <span className="min-w-0 flex-1">{option.text}</span>
          {selected && <span className="rounded-md bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-800">Bạn đã chọn</span>}
          {correct && <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">Đáp án đúng</span>}
        </div>;
      })}{!q.selectedIds.length && <p className="text-xs text-amber-700">Bạn chưa chọn đáp án.</p>}</div>}
    </div>)}</div>
  </section>;
}

export default function FinalExamResult({ courseId, token, attemptId, finalMode, essayResult, error, onRefresh }) {
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);
  const isMcqOnly = finalMode === "MCQ_ONLY";
  const graded = essayResult?.status === "GRADED" && essayResult?.finalScore != null;
  const score = essayResult?.mcqScore;
  const mcqWeight = isMcqOnly ? 100 : Number(essayResult?.mcqPercent ?? 40);
  const pendingLabel = essayResult?.status === "AWAITING_UPLOAD" ? "Chờ nộp tự luận" : "Chờ chấm tự luận";
  const refresh = async () => { setRefreshing(true); try { await onRefresh(); } finally { setRefreshing(false); } };
  return <div className="min-h-screen bg-[#f5f8fd] text-slate-900">
    <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-[1580px] items-center justify-between px-4 py-4 sm:px-7"><Link to="/" className="flex items-center gap-2 text-lg font-black text-blue-700"><BookOpen size={25} /> VEDU <span className="text-slate-900">LMS</span></Link><div className="text-xs font-medium text-slate-500">Kết quả học tập</div></div></header>
    <div className="mx-auto grid max-w-[1580px] lg:grid-cols-[215px_minmax(0,1fr)]">
      <aside className="hidden min-h-[calc(100vh-69px)] bg-[#10254b] p-4 text-slate-100 lg:block">
        <div className="mb-6 rounded-xl border border-white/10 p-4 text-sm font-bold">Lập trình hướng đối tượng</div>
        <nav aria-label="Điều hướng học viên" className="space-y-1 text-sm">
          <Link className="flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-white/10" to="/"><Home size={18} /> Trang chủ</Link>
          <Link className="flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-white/10" to={`/courses/${courseId}`}><GraduationCap size={18} /> Khóa học của tôi</Link>
          <div className="flex items-center gap-3 rounded-lg bg-blue-600 px-3 py-3 font-bold"><Trophy size={18} /> Kết quả học tập</div>
          <Link className="flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-white/10" to="/student"><Award size={18} /> Trang học viên</Link>
        </nav>
      </aside>
      <main className="min-w-0 space-y-5 p-4 sm:p-7 lg:p-9">
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500"><Link to={`/courses/${courseId}`} className="hover:text-blue-700">Khóa học</Link><ChevronRight size={13} /><span>Lập trình hướng đối tượng</span><ChevronRight size={13} /><span>Kết quả cuối khóa</span></div>
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-black tracking-tight sm:text-3xl">Kết quả thi cuối khóa</h1><p className="mt-1 text-sm text-slate-500">Xem điểm, bài tự luận và đáp án đã nộp</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => navigate(`/courses/${courseId}`)} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold"><ArrowLeft size={17} /> Về khóa học</button><button type="button" onClick={refresh} disabled={refreshing} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"><RefreshCw size={16} /> {refreshing ? "Đang cập nhật" : "Cập nhật điểm"}</button></div></div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric icon={ClipboardList} label="Điểm trắc nghiệm" tone="blue" note={`${mcqWeight}% điểm cuối khóa`}>{score == null ? "Đang tải..." : formatScore(score)}</Metric>
          <Metric icon={FileText} label="Điểm tự luận" tone="violet" note={isMcqOnly ? "Không áp dụng" : `${100 - mcqWeight}% điểm cuối khóa`}>{isMcqOnly ? "Không có" : graded ? formatScore(essayResult.essayScore) : "Chưa chấm"}</Metric>
          <Metric icon={Trophy} label="Tổng điểm" tone="amber" note={!graded && !isMcqOnly ? "Chốt điểm sau khi giảng viên chấm" : "Điểm chính thức"}>{graded || (isMcqOnly && essayResult?.finalScore != null) ? formatScore(essayResult.finalScore) : "Chưa có"}</Metric>
          <Metric icon={graded || (isMcqOnly && essayResult?.passed != null) ? Award : Clock3} label="Trạng thái" tone={graded || (isMcqOnly && essayResult?.passed != null) ? "green" : "amber"}>{graded || (isMcqOnly && essayResult?.passed != null) ? (essayResult.passed ? "Đã đạt" : "Chưa đạt") : pendingLabel}</Metric>
        </div>
        {!graded && !isMcqOnly && <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Điểm trắc nghiệm đã được ghi nhận. Kết quả cuối khóa sẽ được xác nhận sau khi giảng viên chấm phần tự luận.</div>}
        {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <EssayReview key={`${attemptId}:${graded ? "graded" : "pending"}`} courseId={courseId} token={token} attemptId={attemptId} result={essayResult} finalMode={finalMode} />
        <AnswerReview attemptId={attemptId} token={token} />
      </main>
    </div>
  </div>;
}
