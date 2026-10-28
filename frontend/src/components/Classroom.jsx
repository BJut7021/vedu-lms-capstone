import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import YouTubeLesson from "./YouTubeLesson";
import { youtubeId } from "../services/video";
import ClassroomLayout from "./ClassroomLayout";

export default function Classroom({
  header,
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
  const logRef = useRef(onLogEvent);
  const viewedLessonId = lesson?.id,
    viewedLessonType = lesson?.type;
  useEffect(() => {
    logRef.current = onLogEvent;
  }, [onLogEvent]);
  useEffect(() => {
    if (!viewedLessonId || viewedLessonId <= 0 || viewedLessonType === "quiz")
      return;
    // Opening is not completion or watched time; persist visits so documents can resume too.
    Promise.resolve(
      logRef.current?.({
        action: "VIEW_LESSON",
        lessonId: viewedLessonId,
        durationSeconds: 0,
      }),
    ).catch(() => {});
  }, [viewedLessonId, viewedLessonType, token]);
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
      lessonId: w.lessonId,
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
          setStats({ ...result, lessonId: watch.lessonId });
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
          lessonId: lesson.id,
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
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [lesson?.id]);
  if (!lesson)
    return (
      <div className="p-8">
        Chưa có bài học công bố. <button onClick={onBack}>Quay lại</button>
      </div>
    );
  const select = (l) => {
    if (!l) return;
    syncRef.current?.({ playing: true });
    if (l.id !== lesson.id) setNotice("");
    if (l.type === "quiz") onOpenQuiz(l.quizId);
    else navigate(`/learn/${course.id}/${l.id}`);
  };
  const complete = async () => {
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
  };
  const video =
    lesson.type === "video" ? (
      youtubeId(lesson.videoUrl) ? (
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
          className="aspect-video w-full rounded-2xl bg-black"
          onLoadedMetadata={resumeVideo}
          onError={() =>
            setNotice(
              "Không phát được video nguồn. Kiểm tra kết nối hoặc mở liên kết gốc.",
            )
          }
          onPlay={() => syncRef.current?.({ seeking: true })}
          onPause={() => syncRef.current?.({ playing: true })}
          onSeeking={() => syncRef.current?.({ seeking: true })}
          onSeeked={() => syncRef.current?.({ seeking: true })}
          onRateChange={() => syncRef.current?.({ seeking: true })}
          onEnded={() => syncRef.current?.({ playing: true })}
        />
      )
    ) : null;
  return (
    <ClassroomLayout
      key={lesson.id}
      header={header}
      course={course}
      lessons={lessons}
      lesson={lesson}
      done={done}
      notice={notice}
      stats={stats?.lessonId === lesson.id ? stats : null}
      onSelect={select}
      onBack={onBack}
      isGuest={isGuest}
      complete={complete}
      video={video}
      onLeaveVideo={() => videoRef.current?.pause()}
    />
  );
}
