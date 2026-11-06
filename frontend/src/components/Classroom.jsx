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
  onRefreshCourse,
}) {
  const navigate = useNavigate(),
    videoRef = useRef(null),
    watchRef = useRef(null),
    sending = useRef(false);
  const lessons = course.sections.flatMap((s) => s.lessons);
  const lesson = lessons.find((l) => l.id === activeLessonId) || lessons[0];
  
  const [stats, setStats] = useState(null);
  const [notice, setNotice] = useState("");
  const [finalState, setFinalState] = useState(null);
  const finalExamPassed = finalState?.courseId === course?.id && finalState?.token === token && finalState.passed;
  useEffect(() => {
    let alive = true;
    if (isGuest || !token || !course?.id) return () => { alive = false; };
    api.platform(`/courses/${course.id}/study-state`, token)
      .then((s) => { if (alive) setFinalState({ courseId: course.id, token, passed: s.finalExamPassed === true }); })
      .catch(() => {});
    return () => { alive = false; };
  }, [course?.id, token, isGuest]);
  const done = Object.fromEntries(
    lessons.filter((l) =>
      (l.type !== 'quiz' && l.completed === true) ||
      (l.type === 'quiz' && finalExamPassed && Number(l.quizId) > 0 && Number(l.quizId) === Number(course.finalQuizId))
    ).map((l) => [l.id, true]),
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
    
if (!w.restored) {
  const savedPosition = Number(w.state?.position_seconds ?? 0);

  // Khi video gần kết thúc, phát lại từ đầu.
  const restartWindow = Math.min(
    10,
    Math.max(2, v.duration * 0.1),
  );

  if (Number.isFinite(savedPosition)) {
    v.currentTime =
      savedPosition >= v.duration - restartWindow
        ? 0
        : Math.max(0, savedPosition);
  }
}

w.restored = true;

    setStats((previous) => ({
      ...previous,
      lessonId: w.lessonId,
      durationSeconds: Math.ceil(v.duration),
    }));
    return true;
  }, [setStats]);
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
        }
      } catch (error) {
        setNotice(`Chưa lưu được tiến độ: ${error.message}`);
      } finally {
        sending.current = false;
      }
    },
    [token, setStats, setNotice],
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
      video={video}
      token={token}
      onRefreshCourse={onRefreshCourse}
      onMarkLearned={async (lessonId) => {
        try {
          await api.platform(`/courses/${course.id}/lessons/${lessonId}/learning-status`, token, {}, "PATCH");
          setNotice("Đã ghi nhận bài học. Trạng thái đạt mô-đun vẫn phụ thuộc quiz và bài nộp bắt buộc.");
          await onRefreshCourse();
        } catch (error) {
          setNotice(error.message);
        }
      }}
    />
  );
}

