import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  HelpCircle,
  PlayCircle,
} from "lucide-react";
import { api } from "../services/api";
import YouTubeLesson from "./YouTubeLesson";
import { youtubeId } from "../services/video";

export default function Classroom({
  course,
  activeLessonId,
  token,
  isGuest = false,
  onBack,
  onOpenQuiz,
  onLogEvent,
}) {
  const navigate = useNavigate(),
    videoRef = useRef(null),
    watchRef = useRef(null),
    sending = useRef(false);
  const lessons = course.sections.flatMap((s) => s.lessons);
  const lesson = lessons.find((l) => l.id === activeLessonId) || lessons[0];
  const [stats, setStats] = useState(null),
    [notice, setNotice] = useState(""),
    [done, setDone] = useState(() =>
      Object.fromEntries(
        lessons.filter((l) => l.completed).map((l) => [l.id, true]),
      ),
    );
  const syncRef = useRef(null);
  const resumeVideo = useCallback(() => {
    const v = videoRef.current,
      w = watchRef.current;
    if (!v || !w || !Number.isFinite(v.duration) || v.duration <= 0)
      return false;
    if (!w.restored && Number(w.state.position_seconds) < v.duration)
      v.currentTime = Number(w.state.position_seconds);
    w.restored = true;
    setStats((previous) => ({
      ...previous,
      durationSeconds: Math.ceil(v.duration),
    }));
    return true;
  }, []);
  const sync = useCallback(
    async ({ seeking = false, playing } = {}) => {
      const video = videoRef.current,
        watch = watchRef.current;
      if (
        !video ||
        !watch ||
        !Number.isFinite(video.duration) ||
        sending.current
      )
        return;
      const data = {
        watchId: watch.watchId,
        eventId: crypto.randomUUID(),
        positionSeconds: video.currentTime,
        durationSeconds: video.duration,
        playbackRate: video.playbackRate,
        playing: playing ?? !video.paused,
        seeking,
      };
      setStats((previous) => ({
        ...previous,
        durationSeconds: Math.ceil(video.duration),
      }));
      sending.current = true;
      try {
        const result = await api.platform("/watch/heartbeat/sync", token, data);
        if (watchRef.current?.watchId === watch.watchId) {
          setStats(result);
          if (result.completed)
            setDone((previous) => ({ ...previous, [watch.lessonId]: true }));
        }
      } catch (error) {
        setNotice(`Chưa lưu được tiến độ: ${error.message}`);
      } finally {
        sending.current = false;
      }
    },
    [token],
  );
  useEffect(() => {
    syncRef.current = sync;
  }, [sync]);
  useEffect(() => {
    if (lesson?.type !== "video") return;
    let active = true;
    watchRef.current = null;
    api
      .platform(`/watch/${lesson.id}`, token, {})
      .then((result) => {
        if (!active) return;
        watchRef.current = { ...result, lessonId: lesson.id, restored: false };
        const unique = result.state.ranges.reduce((s, r) => s + r[1] - r[0], 0),
          duration = Number(result.state.duration_seconds);
        setStats({
          actualSeconds: Math.floor(Number(result.state.actual_seconds)),
          uniqueSeconds: Math.floor(unique),
          percent: duration
            ? Math.min(100, Math.floor((unique / duration) * 100))
            : 0,
          durationSeconds: Math.ceil(duration),
        });
        resumeVideo();
      })
      .catch((error) => {
        if (active) setNotice(error.message);
      });
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") syncRef.current?.();
    }, 5000);
    const hide = () => {
      if (document.visibilityState === "hidden") videoRef.current?.pause();
    };
    document.addEventListener("visibilitychange", hide);
    return () => {
      active = false;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", hide);
      syncRef.current?.({ playing: true });
      watchRef.current = null;
    };
  }, [lesson?.id, lesson?.type, token, resumeVideo]);
  if (!lesson)
    return (
      <div className="p-8">
        Chưa có bài học công bố. <button onClick={onBack}>Quay lại</button>
      </div>
    );
  const select = (l) => {
    syncRef.current?.({ playing: true });
    if (l.type === "quiz") onOpenQuiz(l.quizId);
    else navigate(`/learn/${course.id}/${l.id}`);
  };
  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700 bg-slate-900 px-4 py-3">
        <button
          className="flex items-center gap-2 text-sm"
          onClick={() => {
            syncRef.current?.({ playing: true });
            onBack();
          }}
        >
          <ArrowLeft size={18} />
          Thoát phòng học
        </button>
        <strong className="max-w-md truncate">{course.title}</strong>
        {!isGuest && (
          <Link to="/student/discussions" className="text-sm text-blue-300">
            Hỏi đáp với giảng viên
          </Link>
        )}
      </header>
      <div className="flex flex-1">
        <aside className="hidden w-72 shrink-0 border-r border-slate-700 bg-slate-900 p-3 md:block">
          <p className="mb-3 p-2 text-sm font-bold">Nội dung khóa học</p>
          {course.sections.map((s) => (
            <div key={s.id} className="space-y-2">
              <p className="px-2 text-xs text-slate-400">{s.title}</p>
              {s.lessons.map((l) => (
                <button
                  key={l.id}
                  onClick={() => select(l)}
                  className={`flex w-full items-center gap-2 rounded-xl p-3 text-left text-sm ${l.id === lesson.id ? "bg-blue-600" : "hover:bg-slate-800"}`}
                >
                  {l.type === "quiz" ? (
                    <HelpCircle size={18} />
                  ) : l.type === "video" ? (
                    <PlayCircle size={18} />
                  ) : (
                    <FileText size={18} />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{l.title}</span>
                    <small className="text-slate-400">
                      {l.type === "video" ? (
                        l.id === lesson.id && stats?.durationSeconds ? (
                          `${stats.durationSeconds} giây`
                        ) : (
                          "Thời lượng đo khi phát"
                        )
                      ) : (
                        <>
                          {l.type === "video" &&
                          l.id === lesson.id &&
                          stats?.durationSeconds
                            ? stats.durationSeconds
                            : l.durationSeconds || 0}{" "}
                          giây{" "}
                          {l.type !== "video" ? "· thời gian đọc dự kiến" : ""}
                        </>
                      )}
                    </small>
                  </span>
                  {done[l.id] && (
                    <CheckCircle2
                      size={18}
                      className="shrink-0 text-emerald-400"
                    />
                  )}
                </button>
              ))}
            </div>
          ))}
        </aside>
        <main className="min-w-0 flex-1 space-y-5 p-4 sm:p-7">
          <select
            aria-label="Chọn bài học"
            className="w-full rounded-xl bg-slate-800 p-3 md:hidden"
            value={lesson.id}
            onChange={(e) =>
              select(lessons.find((l) => l.id === Number(e.target.value)))
            }
          >
            {lessons.map((l) => (
              <option key={l.id} value={l.id}>
                {l.title}
              </option>
            ))}
          </select>
          <h1 className="text-xl font-bold">{lesson.title}</h1>
          {notice && (
            <p
              role="status"
              className="rounded-xl bg-amber-900/50 p-3 text-sm text-amber-100"
            >
              {notice}
            </p>
          )}
          {lesson.type === "video" ? (
            <>
              {youtubeId(lesson.videoUrl) ? (
                <YouTubeLesson
                  key={lesson.id}
                  url={lesson.videoUrl}
                  title={lesson.title}
                  mediaRef={videoRef}
                  onEvent={(event) => syncRef.current?.(event)}
                  onReady={resumeVideo}
                />
              ) : (
                <video
                  key={lesson.id}
                  ref={videoRef}
                  controls
                  preload="metadata"
                  src={lesson.videoUrl}
                  className="aspect-video w-full max-w-5xl rounded-2xl bg-black"
                  onLoadedMetadata={resumeVideo}
                  onError={() =>
                    setNotice(
                      "Không phát được video nguồn. Kiểm tra kết nối hoặc mở liên kết gốc; không tự ghi hoàn thành khi chưa xem được.",
                    )
                  }
                  onPlay={() => syncRef.current?.({ seeking: true })}
                  onPause={() => syncRef.current?.({ playing: true })}
                  onSeeking={() => syncRef.current?.({ seeking: true })}
                  onSeeked={() => syncRef.current?.({ seeking: true })}
                  onRateChange={() => syncRef.current?.({ seeking: true })}
                  onEnded={() => syncRef.current?.({ playing: true })}
                />
              )}
              <div className="space-y-3 rounded-xl bg-slate-900 p-4 text-sm">
                <p>
                  Đã xem thực: <strong>{stats?.actualSeconds || 0} giây</strong>{" "}
                  · Nội dung duy nhất: {stats?.uniqueSeconds || 0} giây (
                  {stats?.percent || 0}%)
                </p>
                <div className="h-2 overflow-hidden rounded-full bg-slate-700">
                  <div
                    className="h-full bg-blue-500"
                    style={{ width: `${stats?.percent || 0}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400">
                  Cho phép tua. Đoạn bị bỏ qua không tính hoàn thành; xem lại
                  không tăng nội dung duy nhất. Tiến độ lưu PostgreSQL mỗi 5
                  giây; đạt 85% thì hoàn thành. Tab nền dừng video.
                </p>
              </div>
              {lesson.content && (
                <article className="whitespace-pre-wrap rounded-xl bg-slate-900 p-5 text-sm leading-7 text-slate-200">
                  {lesson.content.replace(/^\[VEDU-LESSON:.*\]\n/, "")}
                </article>
              )}
            </>
          ) : (
            <article className="space-y-5 rounded-2xl bg-slate-900 p-6">
              <p className="whitespace-pre-wrap leading-7 text-slate-200">
                {lesson.content?.replace(/^\[VEDU-LESSON:.*\]\n/, "") ||
                  "Mở tài liệu học tập bên dưới."}
              </p>
              {lesson.resources
                ?.filter((r) => r.type === "PDF")
                .map((r) => (
                  <iframe
                    key={r.id}
                    title={r.title}
                    src={r.url}
                    className="h-[65vh] w-full rounded-xl bg-white"
                  />
                ))}
              <button
                className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold"
                onClick={async () => {
                  try {
                    await onLogEvent({
                      action: "COMPLETE_LESSON",
                      lessonId: lesson.id,
                      durationSeconds: 0,
                      metadata: { trackingMode: "MANUAL_DOCUMENT_COMPLETE" },
                    });
                    setDone((previous) => ({ ...previous, [lesson.id]: true }));
                    setNotice("Đã lưu hoàn thành tài liệu.");
                  } catch (error) {
                    setNotice(error.message);
                  }
                }}
              >
                Tôi đã đọc tài liệu
              </button>
            </article>
          )}
          <div className="flex flex-wrap gap-3">
            {lesson.resources?.map((r) => (
              <a
                key={r.id}
                target="_blank"
                rel="noreferrer"
                href={r.url}
                className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-blue-300"
              >
                {r.title} · {r.type}
              </a>
            ))}
          </div>
          {lesson.pedagogy && (
            <section className="space-y-3 rounded-xl border border-slate-700 p-5 text-sm">
              <h2 className="font-bold">Đầu ra và nguồn học liệu</h2>
              {lesson.pedagogy.outcomes.map((t) => (
                <p key={t}>• {t}</p>
              ))}
              {lesson.pedagogy.sources.map((s, i) => (
                <div key={i}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-300 underline"
                  >
                    {s.provider} — {s.title}
                  </a>
                  <p className="mt-1 text-xs text-slate-400">{s.rights}</p>
                </div>
              ))}
              {!isGuest && (
                <Link
                  to="/student/learning-path"
                  className="inline-block text-blue-300 underline"
                >
                  So sánh các lộ trình học theo mục tiêu của bạn
                </Link>
              )}
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
