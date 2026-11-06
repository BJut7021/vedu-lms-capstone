import { useCallback, useEffect, useState } from "react";
import { api } from "../services/api";

const labels = {
  DRAFT: "Bản nháp", SUBMITTED: "Đã nộp", UNDER_REVIEW: "Đang chấm",
  NEEDS_REVISION: "Cần sửa", GRADED: "Đã chấm",
  PASS: "Đạt", FAIL: "Không đạt", REVISE: "Cần sửa",
};
const field = "w-full rounded-lg border border-slate-300 p-2";
const button = "rounded-lg bg-blue-700 px-3 py-2 text-sm font-bold text-white disabled:opacity-50";

function StudentForm({ assignment, draft, attemptId, token, refresh, report }) {
  const [busy, setBusy] = useState(false);
  const [selectedFile, setSelectedFile] = useState("");
  return <form className="space-y-3" onSubmit={async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (!form.get("file")?.size) form.delete("file");
    form.set("submit", "true");
    if (attemptId) form.set("attemptId", attemptId);
    setBusy(true);
    try { await api.saveCourseAssignment(assignment.assignment_id, token, form); await refresh(); }
    catch (error) { report(error.message); }
    finally { setBusy(false); }
  }}>
    <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-blue-200 bg-blue-50 p-5 text-center text-blue-800 hover:border-blue-400">
      <span className="text-lg font-bold">＋ Thêm hoặc chọn tệp</span>
      <span className="text-xs">Tối đa 5 MB · {(assignment.allowed_file_types || []).join(", ").toUpperCase()}</span>
      <input className="sr-only" name="file" type="file" required={!draft?.file_name} accept={(assignment.allowed_file_types || ["pdf","docx","xlsx","pptx","zip"]).map((x) => `.${x}`).join(",")} onChange={(event) => setSelectedFile(event.target.files?.[0]?.name || "")} />
    </label>
    {(selectedFile || draft?.file_name) && <p className="rounded-lg bg-slate-50 p-3 text-sm">Tệp đã chọn: <strong>{selectedFile || draft.file_name}</strong></p>}
    <button className={button} disabled={busy}>{busy ? "Đang nộp…" : "Nộp bài"}</button>
  </form>;
}

function GradeForm({ assignment, version, token, refresh, report }) {
  const [busy, setBusy] = useState(false);
  const grade = async (action, values) => {
    setBusy(true);
    try {
      await api.platform(`/assignment-versions/${version.version_id}/grade`, token, {
        action, feedback: values?.get("feedback"),
        scores: values && Object.fromEntries(assignment.rubric.map((criterion) => [criterion.id, Number(values.get(criterion.id))])),
      }, "PATCH");
      await refresh();
    } catch (error) { report(error.message); }
    finally { setBusy(false); }
  };
  return <form className="space-y-3" onSubmit={(event) => {
    event.preventDefault();
    grade(event.nativeEvent.submitter?.value, new FormData(event.currentTarget));
  }}>
    {version.status === "SUBMITTED" && <button type="button" className={button} disabled={busy} onClick={() => grade("REVIEW")}>Bắt đầu chấm</button>}
    {assignment.rubric.map((criterion) => <label className="block" key={criterion.id}>{criterion.label} (tối đa {criterion.max}, tối thiểu {criterion.min})
      <input className={field} name={criterion.id} type="number" min="0" max={criterion.max} step="0.01" required />
    </label>)}
    <label className="block">Phản hồi<textarea className={field} name="feedback" maxLength={3000} required /></label>
    <div className="flex flex-wrap gap-2">
      {["PASS","REVISE","FAIL"].map((action) => <button key={action} className={button} value={action} disabled={busy}>{labels[action]}</button>)}
    </div>
  </form>;
}

function TeacherAssignmentEditor({ courseId, modules, assignment, token, refresh, close, report }) {
  const defaults = assignment?.rubric?.length ? assignment.rubric : [
    { id:"knowledge", label:"Kiến thức và lập luận", skill:"knowledge", max:5, min:3 },
    { id:"application", label:"Vận dụng", skill:"application", max:3, min:1 },
    { id:"presentation", label:"Trình bày", skill:"presentation", max:2, min:1 },
  ];
  const [busy,setBusy] = useState(false);
  return <form className="space-y-3 rounded-xl border border-blue-200 bg-blue-50 p-4" onSubmit={async (event) => {
    event.preventDefault(); setBusy(true); report("");
    const form = new FormData(event.currentTarget);
    const rubric = defaults.map((item,index) => ({
      id:item.id, skill:item.skill, label:String(form.get(`rubricLabel${index}`) || "").trim(),
      max:Number(form.get(`rubricMax${index}`)), min:Number(form.get(`rubricMin${index}`)),
    }));
    const payload = { sectionId: form.get("sectionId") || null, title:form.get("title"), instructions:form.get("instructions"),
      passingScore:Number(form.get("passingScore")), required:form.get("required") === "on", published:form.get("published") === "on",
      allowedFileTypes:form.getAll("allowedFileTypes"), rubric };
    try {
      await api.platform(assignment ? `/assignments/${assignment.assignment_id}` : `/courses/${courseId}/assignments`, token, payload, assignment ? "PATCH" : "POST");
      await refresh(); close();
    } catch (error) { report(error.message); } finally { setBusy(false); }
  }}>
    <h3 className="font-bold">{assignment ? "Sửa bài tập" : "Tạo bài tập"}</h3>
    <label className="block">Module<select className={field} name="sectionId" defaultValue={assignment?.section_id ?? ""}><option value="">Đánh giá cuối khóa</option>{modules.map((m) => <option key={m.section_id} value={m.section_id}>{m.title}</option>)}</select></label>
    <label className="block">Tiêu đề<input className={field} name="title" maxLength={250} required defaultValue={assignment?.title || ""} /></label>
    <label className="block">Hướng dẫn<textarea className={field} name="instructions" maxLength={10000} required defaultValue={assignment?.instructions || ""} /></label>
    <label className="block">Điểm đạt<input className={field} name="passingScore" type="number" min="0" max="10" step="0.1" defaultValue={assignment?.passing_score ?? 7} required /></label>
    <fieldset className="space-y-2"><legend className="font-semibold">Rubric (tổng điểm phải bằng 10)</legend>{defaults.map((item,index) => <div className="grid gap-2 sm:grid-cols-[1fr_100px_100px]" key={item.id}>
      <input aria-label={`Tiêu chí ${index + 1}`} className={field} name={`rubricLabel${index}`} defaultValue={item.label} required />
      <input aria-label="Điểm tối đa" className={field} name={`rubricMax${index}`} type="number" min="0.1" max="10" step="0.1" defaultValue={item.max} required />
      <input aria-label="Điểm tối thiểu" className={field} name={`rubricMin${index}`} type="number" min="0" max="10" step="0.1" defaultValue={item.min} required />
    </div>)}</fieldset>
    <fieldset><legend className="font-semibold">Loại tệp cho phép</legend><div className="flex flex-wrap gap-3">{["pdf","docx","xlsx","pptx","zip"].map((ext) => <label key={ext}><input type="checkbox" name="allowedFileTypes" value={ext} defaultChecked={!assignment || assignment.allowed_file_types?.includes(ext)} /> {ext.toUpperCase()}</label>)}</div></fieldset>
    <div className="flex gap-4"><label><input type="checkbox" name="required" defaultChecked={assignment?.required ?? true} /> Bắt buộc</label><label><input type="checkbox" name="published" defaultChecked={assignment?.is_published ?? true} /> Công bố</label></div>
    <div className="flex gap-2"><button className={button} disabled={busy}>Lưu</button><button type="button" className="rounded-lg border px-3 py-2" onClick={close}>Hủy</button></div>
  </form>;
}

export default function CourseAssignments({ courseId, token, attemptId, teacher = false, sectionId, assignmentId, allowedAssignmentIds }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState(teacher ? "pending" : "");
  const [editing,setEditing] = useState(null);
  const refresh = useCallback(async () => {
    setError("");
    setData(await api.platform(`/courses/${courseId}/assignments`, token));
  }, [courseId, token]);
  useEffect(() => {
    let alive = true;
    api.platform(`/courses/${courseId}/assignments`, token)
      .then((result) => { if (alive) setData(result); })
      .catch((reason) => { if (alive) setError(reason.message); });
    return () => { alive = false; };
  }, [courseId, token]);
  const assignments = data?.assignments?.filter((a) => {
    if (Array.isArray(allowedAssignmentIds) && !allowedAssignmentIds.some((id) => Number(id) === Number(a.assignment_id))) return false;
    if (assignmentId && Number(a.assignment_id) !== Number(assignmentId)) return false;
    if (teacher) return true;
    if (attemptId) return !a.section_id;
    if (sectionId != null) return String(a.section_id) === String(sectionId);
    return a.section_id;
  }) ?? [];
  if (!teacher && data && !assignments.length) return null;
  return <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
    <h2 className="text-lg font-bold">{teacher ? "Bài nộp cần chấm" : attemptId ? "Sản phẩm cuối khóa" : "Bài nộp của tôi"}</h2>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {!data && !error && <p>Đang tải bài tập…</p>}
    {teacher && data && <div><button className={button} onClick={() => setEditing("new")}>Tạo bài tập</button></div>}
    {teacher && data && editing && <TeacherAssignmentEditor courseId={courseId} modules={data.modules || []} assignment={editing === "new" ? null : editing} token={token} refresh={refresh} close={() => setEditing(null)} report={setError} />}
    {teacher && data && <div className="flex flex-wrap gap-2">
      <select className="rounded-lg border p-2" aria-label="Lọc module" value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)}>
        <option value="">Tất cả module</option>
        {[...new Map(assignments.map((a) => [String(a.section_id ?? "final"), a.section_title || "Cuối khóa"]))].map(([id,label]) => <option key={id} value={id}>{label}</option>)}
      </select>
      <select className="rounded-lg border p-2" aria-label="Lọc trạng thái" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
        <option value="pending">Chờ xử lý</option><option value="">Tất cả trạng thái</option>
        {["SUBMITTED","UNDER_REVIEW","NEEDS_REVISION","GRADED"].map((s) => <option key={s} value={s}>{labels[s]}</option>)}
      </select>
    </div>}
    {assignments.filter((a) => !moduleFilter || moduleFilter === String(a.section_id ?? "final")).map((assignment) => {
      const versions = data.versions.filter((v) => v.assignment_id === assignment.assignment_id &&
        (!attemptId || Number(v.attempt_id) === Number(attemptId)));
      const latest = versions[0];
      const editable = !latest || ["DRAFT","NEEDS_REVISION"].includes(latest.status) ||
        (!attemptId && latest.status === "GRADED" && latest.outcome === "FAIL");
      const shown = teacher ? versions.filter((v) => !statusFilter || (statusFilter === "pending"
        ? ["SUBMITTED","UNDER_REVIEW"].includes(v.status) : v.status === statusFilter)) : versions;
      return <article id={`assignment-${assignment.assignment_id}`} className="scroll-mt-24 space-y-3 rounded-lg border p-4" key={assignment.assignment_id}>
        <h3 className="font-bold">{assignment.title}</h3>
        {teacher && <div className="flex gap-2"><button className="rounded-lg border px-3 py-1 text-sm" onClick={() => setEditing(assignment)}>Sửa</button><button className="rounded-lg border border-red-200 px-3 py-1 text-sm text-red-700" onClick={async () => { if (!window.confirm("Lưu trữ bài tập này? Lịch sử bài nộp vẫn được giữ.")) return; try { await api.platform(`/assignments/${assignment.assignment_id}`, token, {}, "DELETE"); await refresh(); } catch (e) { setError(e.message); } }}>Lưu trữ</button></div>}
        <p className="text-sm text-slate-600">{assignment.section_title || "Cuối khóa"} · Đạt từ {assignment.passing_score}/10 và đạt tiêu chí bắt buộc</p>
        <p>{assignment.instructions}</p>
        <ul className="list-disc pl-5 text-sm">{assignment.rubric.map((c) => <li key={c.id}>{c.label} · tối đa {c.max} điểm{c.min > 0 ? ` · tối thiểu ${c.min}` : ""}</li>)}</ul>
        {!teacher && editable && <StudentForm key={latest?.version_id ?? "new"} assignment={assignment} draft={latest?.status === "DRAFT" ? latest : null} attemptId={attemptId} token={token} refresh={refresh} report={setError} />}
        {teacher && !shown.length && <p className="text-sm text-slate-500">Không có bài ở trạng thái này.</p>}
        {shown.map((version) => <details className="rounded-lg bg-slate-50 p-3" key={version.version_id}>
          <summary className="cursor-pointer font-semibold">{teacher ? `${version.full_name} · ` : ""}Phiên bản {version.version_no} · {labels[version.status]}{version.outcome ? ` · ${labels[version.outcome]}` : ""}</summary>
          <p className="whitespace-pre-wrap">{version.answer_text}</p>
          {version.answer_url && <a className="block break-all text-blue-700" target="_blank" rel="noreferrer" href={version.answer_url}>{version.answer_url}</a>}
          {version.file_name && <button className="block text-blue-700 underline" onClick={() => api.downloadCourseAssignment(version.version_id, token, version.file_name).catch((e) => setError(e.message))}>Tải {version.file_name}</button>}
          {version.score != null && <p>Điểm rubric: {version.score}/10 · {version.feedback}</p>}
          {version.rubric_scores && <ul className="text-sm">{assignment.rubric.map((c) => <li key={c.id}>{c.label}: {version.rubric_scores[c.id]}/{c.max}</li>)}</ul>}
          {teacher && ["SUBMITTED","UNDER_REVIEW"].includes(version.status) && <GradeForm assignment={assignment} version={version} token={token} refresh={refresh} report={setError} />}
        </details>)}
      </article>;
    })}
  </section>;
}
