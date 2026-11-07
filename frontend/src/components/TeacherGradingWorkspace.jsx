import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, ClipboardCheck, Clock3, Download, FileText, RefreshCw, Search, ShieldCheck } from "lucide-react";
import { api } from "../services/api";

const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100";
const statusText = { SUBMITTED: "Chờ chấm", UNDER_REVIEW: "Đang chấm", NEEDS_REVISION: "Cần sửa", GRADED: "Đã chấm" };
const outcomeText = { PASS: "Đạt", FAIL: "Chưa đạt", REVISE: "Cần sửa" };
const isPending = (v) => ["SUBMITTED", "UNDER_REVIEW"].includes(v.status);
const fmtDate = (value) => { const d = new Date(value); return value && !Number.isNaN(d.getTime()) ? d.toLocaleString("vi-VN") : "Chưa rõ"; };
const nameInitials = (name) => String(name || "HV").trim().split(/\s+/).slice(-2).map((x) => x[0] || "").join("").toUpperCase();

function Metric({ icon: Icon, label, value, tint }) {
  return <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${tint}`}><Icon size={19}/></div><div><p className="text-xs text-slate-500">{label}</p><p className="text-xl font-extrabold text-slate-900">{value}</p></div></div>;
}

function GradeEditor({ version, assignment, token, afterSave }) {
  const [scores, setScores] = useState({});
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const rubric = Array.isArray(assignment.rubric) ? assignment.rubric : [];
  const total = rubric.reduce((sum, r) => sum + Number(scores[r.id] || 0), 0);
  const maxTotal = rubric.reduce((sum, r) => sum + Number(r.max || 0), 0);
  const projected = maxTotal > 0 ? Math.round(total / maxTotal * 1000) / 100 : 0;
  const meetsRequired = rubric.every((r) => Number(scores[r.id] || 0) >= Number(r.min || 0));
  const passing = projected >= Number(assignment.passing_score || 0) && meetsRequired;
  const grade = async (action) => {
    if (!feedback.trim()) { setError("Cần nhập nhận xét trước khi chấm."); return; }
    if (rubric.some((r) => scores[r.id] === undefined || scores[r.id] === "" || !Number.isFinite(Number(scores[r.id])) || Number(scores[r.id]) < 0 || Number(scores[r.id]) > Number(r.max))) {
      setError("Hãy nhập điểm hợp lệ cho từng tiêu chí."); return;
    }
    if (action === "PASS" && !passing) { setError("Bài chưa đủ điểm hoặc chưa đạt tiêu chí bắt buộc."); return; }
    setBusy(true); setError("");
    try {
      await api.platform(`/assignment-versions/${version.version_id}/grade`, token, {
        action, feedback: feedback.trim(),
        scores: Object.fromEntries(rubric.map((r) => [r.id, Number(scores[r.id])])),
      }, "PATCH");
      await afterSave();
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  return <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
    <div className="flex items-center justify-between gap-2"><h3 className="flex items-center gap-2 font-bold"><ShieldCheck size={18} className="text-blue-600"/> Chấm điểm theo tiêu chí (Rubric)</h3><span className="rounded-lg bg-blue-50 px-3 py-1.5 font-extrabold text-blue-700">{projected.toFixed(2)}/10</span></div>
    {rubric.map((r) => <label key={r.id} className="grid items-center gap-2 border-b border-slate-100 py-2 last:border-0 sm:grid-cols-[minmax(0,1fr)_105px]">
      <span className="text-sm"><b className="text-slate-800">{r.label}</b><small className="block text-slate-500">Tối đa {r.max} điểm · tối thiểu {r.min}</small></span>
      <input className={inputClass} type="number" min="0" max={r.max} step="0.25" placeholder={`0 / ${r.max}`} value={scores[r.id] ?? ""} disabled={busy} onChange={(e) => setScores((p) => ({ ...p, [r.id]: e.target.value }))}/>
    </label>)}
    <label className="block space-y-2 text-sm font-bold">Nhận xét cho học viên <textarea className={`${inputClass} min-h-24 resize-y font-normal`} maxLength={3000} value={feedback} disabled={busy} onChange={(e) => setFeedback(e.target.value)} placeholder="Nhận xét cụ thể về bài nộp..."/></label>
    <p className="text-xs text-slate-500">Điểm đạt: {assignment.passing_score}/10, đồng thời đáp ứng điểm tối thiểu từng tiêu chí. Kết quả trắc nghiệm (40%) được hệ thống kết hợp sau khi chấm tự luận (60%).</p>
    {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <div className="flex flex-wrap justify-end gap-2">
      <button className="rounded-xl border border-amber-200 px-4 py-2 text-sm font-semibold text-amber-700 disabled:opacity-50" disabled={busy} onClick={() => grade("REVISE")}>Yêu cầu sửa</button>
      <button className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold disabled:opacity-50" disabled={busy} onClick={() => grade("FAIL")}>Chấm chưa đạt</button>
      <button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50" disabled={busy || !passing} onClick={() => grade("PASS")}>{busy ? "Đang lưu..." : "Chấm đạt & trả bài"}</button>
    </div>
  </section>;
}

export default function TeacherGradingWorkspace({ auth, data, initialCourseId = "" }) {
  const courses = data?.courses || [];
  const [course, setCourse] = useState(String(initialCourseId || courses[0]?.courseId || courses[0]?.id || ""));
  const [type, setType] = useState("final");
  const [payload, setPayload] = useState(null);
  const [status, setStatus] = useState("pending");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const token = auth.accessToken;
  const pageSize = 8;

  const refresh = useCallback(async () => {
    if (!course) { setPayload(null); return; }
    setLoading(true); setError("");
    try { setPayload(await api.platform(`/courses/${course}/assignments`, token)); }
    catch (e) { setError(e.message); setPayload(null); }
    finally { setLoading(false); }
  }, [course, token]);
  useEffect(() => {
    const timer = window.setTimeout(() => { void refresh(); }, 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSelected(null);
      setPage(1);
      setNotice("");
    }, 0);
    return () => window.clearTimeout(timer);
  }, [course, type, status]);

  const assignments = useMemo(() => (payload?.assignments || []).filter((a) => type === "final" ? a.section_id == null : a.section_id != null), [payload, type]);
  const byId = useMemo(() => new Map(assignments.map((a) => [Number(a.assignment_id), a])), [assignments]);
  const versions = useMemo(() => (payload?.versions || []).filter((v) => byId.has(Number(v.assignment_id))), [payload, byId]);
  const pending = versions.filter(isPending).length;
  const graded = versions.filter((v) => v.status === "GRADED").length;
  const filtered = versions.filter((v) => {
    if (status === "pending" && !isPending(v)) return false;
    if (status === "graded" && v.status !== "GRADED") return false;
    const q = search.trim().toLocaleLowerCase("vi-VN");
    const a = byId.get(Number(v.assignment_id));
    return !q || [v.full_name, v.student_id, a?.title, v.version_id, v.attempt_id].some((text) => String(text ?? "").toLocaleLowerCase("vi-VN").includes(q));
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const chosen = filtered.find((v) => String(v.version_id) === String(selected)) || visible[0] || null;
  const assignment = chosen ? byId.get(Number(chosen.assignment_id)) : null;
  const courseTitle = courses.find((c) => String(c.courseId ?? c.id) === course)?.courseName || courses.find((c) => String(c.courseId ?? c.id) === course)?.title || "Khóa học";
  const afterGrade = async () => { await refresh(); setNotice("Đã chấm và lưu kết quả bài nộp."); };
  const startReview = async () => {
    if (!chosen) return;
    try { await api.platform(`/assignment-versions/${chosen.version_id}/grade`, token, { action: "REVIEW" }, "PATCH"); await refresh(); }
    catch (e) { setError(e.message); }
  };
  return <div className="w-full space-y-4 text-slate-800">
    <header className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Giảng viên workspace / Chấm bài nộp</p><h1 className="mt-1 flex items-center gap-2 text-2xl font-extrabold text-slate-950"><ClipboardCheck className="text-blue-600"/> Chấm bài nộp & tự luận cuối khóa</h1><p className="mt-1 text-sm text-slate-500">Xem bài, chấm theo rubric và gửi nhận xét cho học viên.</p></div><button type="button" onClick={refresh} disabled={loading} className="flex items-center gap-2 rounded-xl border border-blue-200 px-4 py-2 text-sm font-bold text-blue-700 disabled:opacity-50"><RefreshCw size={16}/> Làm mới</button></header>
    <div className="grid gap-3 sm:grid-cols-3"><Metric icon={FileText} label="Bài đã nộp" value={versions.length} tint="bg-blue-50 text-blue-600"/><Metric icon={Clock3} label="Đang chờ chấm" value={pending} tint="bg-amber-50 text-amber-600"/><Metric icon={CheckCircle2} label="Đã chấm" value={graded} tint="bg-emerald-50 text-emerald-600"/></div>
    <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-3"><label className="space-y-1 text-xs font-bold">Khóa học<select className={inputClass} value={course} onChange={(e) => setCourse(e.target.value)}><option value="">Chọn khóa học</option>{courses.map((c) => <option key={c.courseId ?? c.id} value={c.courseId ?? c.id}>{c.courseName ?? c.title}</option>)}</select></label><label className="space-y-1 text-xs font-bold">Loại bài nộp<select className={inputClass} value={type} onChange={(e) => setType(e.target.value)}><option value="final">Tự luận cuối khóa</option><option value="practice">Bài thực hành / bài tập</option></select></label><label className="space-y-1 text-xs font-bold">Trạng thái<select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value)}><option value="pending">Chờ chấm</option><option value="graded">Đã chấm</option><option value="all">Tất cả</option></select></label></div>
    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {notice && <p role="status" className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">{notice}</p>}
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(270px,0.9fr)_minmax(0,1.9fr)]">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="space-y-3 border-b p-4"><div className="flex items-center justify-between"><h2 className="font-bold">Danh sách bài nộp</h2><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">{filtered.length} bài</span></div><div className="relative"><Search size={16} className="absolute left-3 top-3 text-slate-400"/><input className={`${inputClass} pl-9`} value={search} placeholder="Tìm học viên, đề bài..." onChange={(e) => { setSearch(e.target.value); setPage(1); setSelected(null); }}/></div><div className="flex flex-wrap gap-2 text-xs font-semibold">{[["pending", `Chờ chấm (${pending})`], ["graded", `Đã chấm (${graded})`], ["all", `Tất cả (${versions.length})`]].map(([id, label]) => <button key={id} onClick={() => setStatus(id)} className={`rounded-lg px-2.5 py-1.5 ${status === id ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}>{label}</button>)}</div></div>
        <div className="max-h-[650px] min-h-44 space-y-1 overflow-y-auto p-2">{loading ? <p className="p-4 text-sm text-slate-500">Đang tải bài nộp...</p> : !visible.length ? <p className="p-4 text-sm text-slate-500">Không có bài nộp phù hợp bộ lọc. Thử chọn “Tất cả” để kiểm tra bài đã chấm.</p> : visible.map((v) => <button key={v.version_id} type="button" onClick={() => { setSelected(v.version_id); setNotice(""); }} className={`flex w-full items-start gap-2 rounded-xl border p-3 text-left ${chosen?.version_id === v.version_id ? "border-blue-300 bg-blue-50" : "border-transparent hover:bg-slate-50"}`}><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">{nameInitials(v.full_name)}</span><span className="min-w-0 flex-1"><b className="block truncate text-sm">{v.full_name}</b><span className="block truncate text-xs text-slate-500">{byId.get(Number(v.assignment_id))?.title}</span><small className="text-slate-500">{fmtDate(v.updated_at)}</small></span><span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${isPending(v) ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>{statusText[v.status] || v.status}</span></button>)}</div>
        <div className="flex items-center justify-between border-t p-3 text-xs"><span>Trang {currentPage}/{totalPages}</span><div className="flex gap-1"><button aria-label="Trang trước" disabled={currentPage <= 1} className="rounded-lg border p-2 disabled:opacity-30" onClick={() => { setPage((p) => p - 1); setSelected(null); }}><ChevronLeft size={14}/></button><button aria-label="Trang sau" disabled={currentPage >= totalPages} className="rounded-lg border p-2 disabled:opacity-30" onClick={() => { setPage((p) => p + 1); setSelected(null); }}><ChevronRight size={14}/></button></div></div>
      </section>
      <section className="min-w-0 space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex flex-wrap items-center justify-between border-b pb-3"><h2 className="flex items-center gap-2 text-lg font-bold"><FileText size={19} className="text-blue-600"/> Chi tiết bài nộp</h2><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{type === "final" ? "Tự luận cuối khóa" : "Bài thực hành"}</span></div>
      {!chosen ? <p className="rounded-xl bg-slate-50 p-8 text-center text-sm text-slate-500">Chọn bài nộp bên trái để xem và chấm. Khóa học: {courseTitle}.</p> : <><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-lg font-bold">{chosen.full_name}</h3><p className="text-xs text-slate-500">Học viên #{chosen.student_id} · Phiên bản {chosen.version_no}{chosen.attempt_id ? ` · Lượt thi #${chosen.attempt_id}` : ""}</p></div><div className="text-right text-xs text-slate-500"><p>Cập nhật: {fmtDate(chosen.updated_at)}</p><b className="text-blue-700">{statusText[chosen.status] || chosen.status}</b></div></div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="mb-2 font-bold">Đề bài: {assignment?.title}</p><p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">{assignment?.instructions}</p></div>
        <div className="space-y-2 rounded-xl border border-slate-200 p-4"><h3 className="font-bold">Bài nộp của học viên</h3>{chosen.answer_text && <p className="whitespace-pre-wrap text-sm">{chosen.answer_text}</p>}{chosen.answer_url && <a className="block break-all text-sm text-blue-600 underline" href={chosen.answer_url} target="_blank" rel="noreferrer">{chosen.answer_url}</a>}{chosen.file_name ? <button type="button" className="flex items-center gap-2 rounded-xl border border-blue-200 px-4 py-2 text-sm font-bold text-blue-700" onClick={() => api.downloadCourseAssignment(chosen.version_id, token, chosen.file_name).catch((e) => setError(e.message))}><Download size={16}/> Tải bài nộp: {chosen.file_name}</button> : <p className="text-sm text-slate-500">Học viên không gửi tệp đính kèm.</p>}</div>
        {isPending(chosen) ? <div key={chosen.version_id} className="space-y-3">{chosen.status === "SUBMITTED" && <button type="button" className="rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-700" onClick={startReview}>Bắt đầu chấm</button>}<GradeEditor version={chosen} assignment={assignment} token={token} afterSave={afterGrade}/></div> : <div className="space-y-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4"><h3 className="font-bold text-emerald-900">{statusText[chosen.status] || chosen.status} {outcomeText[chosen.outcome] ? `· ${outcomeText[chosen.outcome]}` : ""}</h3><p className="text-sm">Điểm: <b>{chosen.score == null ? "Chưa có" : `${chosen.score}/10`}</b></p>{(assignment?.rubric || []).map((r) => <p key={r.id} className="text-xs">{r.label}: {chosen.rubric_scores?.[r.id] ?? "—"}/{r.max}</p>)}<p className="whitespace-pre-wrap text-sm">{chosen.feedback || "Chưa có nhận xét."}</p></div>}
      </>}
      </section>
    </div>
  </div>;
}
