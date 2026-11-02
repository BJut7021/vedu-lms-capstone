import { useState } from "react";
import { api } from "../services/api";

export default function TeacherQuizActions({ quizId, token }) {
  const [detail, setDetail] = useState(null);
  const [mode, setMode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const endpoint = `/teacher/quizzes/${quizId}`;

  const open = async (nextMode) => {
    setBusy(true);
    setError("");
    try {
      const result = await api.platform(endpoint, token);
      setDetail(result);
      setMode(nextMode);
    } catch (e) {
      setError(e.message || "Không tải được quiz");
    } finally {
      setBusy(false);
    }
  };

  const editQuestion = (index, changes) => {
    setDetail((old) => ({
      ...old,
      questions: old.questions.map((q, i) =>
        i === index ? { ...q, ...changes } : q,
      ),
    }));
  };

  const save = async () => {
    setBusy(true);
    setError("");
    try {
      await api.platform(
        endpoint,
        token,
        {
          title: detail.title,
          timeLimitSeconds: Number(detail.timeLimitSeconds),
          passingScore: Number(detail.passingScore),
          maxAttempts: Number(detail.maxAttempts),
          questions: detail.questions,
        },
        "PATCH",
      );
      window.location.reload();
    } catch (e) {
      setError(e.message || "Không lưu được quiz");
      setBusy(false);
    }
  };

  const archive = async () => {
    if (!window.confirm("Lưu trữ quiz này? Lịch sử làm bài sẽ được giữ.")) {
      return;
    }

    setBusy(true);
    setError("");
    try {
      await api.platform(endpoint, token, {}, "DELETE");
      window.location.reload();
    } catch (e) {
      setError(e.message || "Không lưu trữ được quiz");
      setBusy(false);
    }
  };

  const editing = mode === "edit";
  const fieldClass = "w-full rounded-lg border px-3 py-2 text-sm";

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-lg border px-3 py-2 text-sm"
          disabled={busy}
          onClick={() => open("view")}
        >
          Xem
        </button>
        <button
          type="button"
          className="rounded-lg border px-3 py-2 text-sm"
          disabled={busy}
          onClick={() => open("edit")}
        >
          Sửa
        </button>
        <button
          type="button"
          className="rounded-lg border border-red-300 px-3 py-2 text-sm text-red-600"
          disabled={busy}
          onClick={archive}
        >
          Xóa
        </button>
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {mode && detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-label={editing ? "Sửa quiz" : "Xem quiz"}
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 text-gray-900 shadow-xl"
          >
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-xl font-bold">
                {editing ? "Chỉnh sửa quiz" : "Chi tiết quiz"}
              </h2>
              <button
                type="button"
                className="rounded-lg border px-3 py-2"
                onClick={() => setMode("")}
              >
                Đóng
              </button>
            </div>

            {editing && detail.attemptCount > 0 && (
              <p className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                Quiz đã có {detail.attemptCount} lượt làm.
                Không thể sửa nội dung. Hãy lưu trữ và tạo quiz mới.
              </p>
            )}

            <div className="mb-5 grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                Tên bài thi
                <input
                  className={fieldClass}
                  value={detail.title}
                  disabled={!editing || detail.attemptCount > 0}
                  onChange={(e) =>
                    setDetail({ ...detail, title: e.target.value })
                  }
                />
              </label>

              <label className="block text-sm">
                Thời gian (giây)
                <input
                  className={fieldClass}
                  type="number"
                  min="10"
                  max="86400"
                  value={detail.timeLimitSeconds}
                  disabled={!editing || detail.attemptCount > 0}
                  onChange={(e) =>
                    setDetail({
                      ...detail,
                      timeLimitSeconds: e.target.value,
                    })
                  }
                />
              </label>

              <label className="block text-sm">
                Điểm đạt /10
                <input
                  className={fieldClass}
                  type="number"
                  min="0"
                  max="10"
                  step="0.5"
                  value={detail.passingScore}
                  disabled={!editing || detail.attemptCount > 0}
                  onChange={(e) =>
                    setDetail({
                      ...detail,
                      passingScore: e.target.value,
                    })
                  }
                />
              </label>

              <label className="block text-sm">
                Số lượt làm tối đa
                <input
                  className={fieldClass}
                  type="number"
                  min="1"
                  max="100"
                  value={detail.maxAttempts}
                  disabled={!editing || detail.attemptCount > 0}
                  onChange={(e) =>
                    setDetail({
                      ...detail,
                      maxAttempts: e.target.value,
                    })
                  }
                />
              </label>
            </div>

            <div className="space-y-4">
              {detail.questions.map((q, i) => (
                <div key={q.id ?? i} className="rounded-xl border p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <strong>Câu {i + 1}</strong>
                    {editing && detail.attemptCount === 0 && (
                      <button
                        type="button"
                        className="text-sm text-red-600"
                        onClick={() =>
                          setDetail({
                            ...detail,
                            questions: detail.questions.filter(
                              (_, index) => index !== i,
                            ),
                          })
                        }
                      >
                        Xóa câu
                      </button>
                    )}
                  </div>

                  <input
                    className={fieldClass}
                    value={q.text}
                    disabled={!editing || detail.attemptCount > 0}
                    onChange={(e) =>
                      editQuestion(i, { text: e.target.value })
                    }
                  />

                  <p className="my-2 text-xs text-gray-500">
                    {q.type === "MULTIPLE_CHOICE"
                      ? "Nhiều đáp án"
                      : q.type === "TRUE_FALSE"
                        ? "Đúng / Sai"
                        : "Một đáp án"}
                  </p>

                  <div className="space-y-2">
                    {q.options.map((option, j) => (
                      <div key={option.id ?? j} className="flex items-center gap-2">
                        <input
                          type={q.type === "MULTIPLE_CHOICE" ? "checkbox" : "radio"}
                          name={`answer-${quizId}-${i}`}
                          checked={Boolean(option.correct)}
                          disabled={!editing || detail.attemptCount > 0}
                          onChange={() =>
                            editQuestion(i, {
                              options: q.options.map((o, k) => ({
                                ...o,
                                correct:
                                  q.type === "MULTIPLE_CHOICE"
                                    ? k === j
                                      ? !o.correct
                                      : o.correct
                                    : k === j,
                              })),
                            })
                          }
                        />

                        <input
                          className={fieldClass}
                          value={option.text}
                          disabled={!editing || detail.attemptCount > 0}
                          onChange={(e) =>
                            editQuestion(i, {
                              options: q.options.map((o, k) =>
                                k === j ? { ...o, text: e.target.value } : o,
                              ),
                            })
                          }
                        />

                        {editing && detail.attemptCount === 0 &&
                          q.options.length > 2 && (
                            <button
                              type="button"
                              className="text-sm text-red-600"
                              onClick={() =>
                                editQuestion(i, {
                                  options: q.options.filter((_, k) => k !== j),
                                })
                              }
                            >
                              Xóa
                            </button>
                          )}
                      </div>
                    ))}
                  </div>

                  {editing && detail.attemptCount === 0 &&
                    q.options.length < 10 && (
                      <button
                        type="button"
                        className="mt-3 text-sm font-medium text-blue-600"
                        onClick={() =>
                          editQuestion(i, {
                            options: [
                              ...q.options,
                              { text: "", correct: false },
                            ],
                          })
                        }
                      >
                        + Thêm đáp án
                      </button>
                    )}
                </div>
              ))}
            </div>

            {editing && detail.attemptCount === 0 && (
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  className="rounded-lg border px-4 py-2"
                  onClick={() =>
                    setDetail({
                      ...detail,
                      questions: [
                        ...detail.questions,
                        {
                          text: "",
                          type: "SINGLE_CHOICE",
                          options: [
                            { text: "", correct: true },
                            { text: "", correct: false },
                          ],
                        },
                      ],
                    })
                  }
                >
                  + Thêm câu hỏi
                </button>
                <button
                  type="button"
                  className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white disabled:opacity-50"
                  disabled={busy}
                  onClick={save}
                >
                  {busy ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
