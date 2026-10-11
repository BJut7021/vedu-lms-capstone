import { useRef, useState } from 'react';
import { ArrowLeft, CheckCircle2, FileText, HelpCircle, PlayCircle, Sparkles } from 'lucide-react';

const createWatchState = (lessonId) => ({
  lessonId,
  ranges: [],
  lastMediaTime: null,
  lastWallTime: null,
  pendingSeconds: 0,
  totalActualSeconds: 0,
  seeking: false,
  syncInFlight: false,
});

const mergeRange = (ranges, start, end) => {
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return ranges;
  const ordered = [...ranges, [start, end]].sort((left, right) => left[0] - right[0]);
  return ordered.reduce((merged, range) => {
    const previous = merged.at(-1);
    if (!previous || range[0] > previous[1] + 0.25) merged.push([...range]);
    else previous[1] = Math.max(previous[1], range[1]);
    return merged;
  }, []);
};

const rangeDuration = (ranges) => ranges.reduce((total, range) => total + (range[1] - range[0]), 0);

export default function Classroom({ course, activeLessonId, onBack, onOpenQuiz, onLogEvent }) {
  const [currentId, setCurrentId] = useState(activeLessonId);
  const [eventLogMessage, setEventLogMessage] = useState(null);
  const [watchedPercent, setWatchedPercent] = useState(0);
  const [actualWatchedSeconds, setActualWatchedSeconds] = useState(0);
  const [uniqueWatchedSeconds, setUniqueWatchedSeconds] = useState(0);
  const [completedLessons, setCompletedLessons] = useState({});
  const videoRef = useRef(null);
  const watchStateRef = useRef(createWatchState(activeLessonId));
  const viewLoggedRef = useRef(new Set());

  let currentLesson = null;
  for (const section of course.sections) {
    const found = section.lessons.find((lesson) => lesson.id === currentId);
    if (found) { currentLesson = found; break; }
  }

  const trackingMetadata = () => {
    const video = videoRef.current;
    const state = watchStateRef.current;
    return {
      trackingMode: 'ACTUAL_PLAYBACK_SECONDS',
      seekAllowed: true,
      positionSeconds: Math.floor(video?.currentTime || 0),
      mediaDurationSeconds: Math.floor(video?.duration || 0),
      uniqueWatchedSeconds: Math.floor(rangeDuration(state.ranges)),
    };
  };

  const syncWatchTime = (force = false) => {
    const state = watchStateRef.current;
    if (state.syncInFlight) return;
    const seconds = Math.min(60, Math.floor(state.pendingSeconds));
    if (seconds < (force ? 1 : 5)) return;

    state.pendingSeconds -= seconds;
    state.syncInFlight = true;
    onLogEvent({
      action: 'VIEW_LESSON',
      lessonId: state.lessonId,
      durationSeconds: seconds,
      metadata: trackingMetadata(),
    })
      .catch(() => { state.pendingSeconds += seconds; })
      .finally(() => {
        state.syncInFlight = false;
        if (state.pendingSeconds >= 5) syncWatchTime();
      });
  };

  const handlePlay = (event) => {
    const video = videoRef.current;
    if (!video) return;
    const state = watchStateRef.current;
    state.lastMediaTime = video.currentTime;
    state.lastWallTime = event.timeStamp;
    state.seeking = false;
  };

  const handleTimeUpdate = (event) => {
    const video = videoRef.current;
    if (!video || video.duration <= 0) return;
    const state = watchStateRef.current;
    const now = event.timeStamp;

    if (video.paused || state.seeking || state.lastMediaTime === null || state.lastWallTime === null) {
      state.lastMediaTime = video.currentTime;
      state.lastWallTime = now;
      return;
    }

    const wallDelta = Math.max(0, (now - state.lastWallTime) / 1000);
    const mediaDelta = video.currentTime - state.lastMediaTime;
    const plausibleMediaDelta = Math.max(1.5, wallDelta * Math.max(video.playbackRate, 0.25) + 0.75);

    if (mediaDelta >= 0 && mediaDelta <= plausibleMediaDelta && wallDelta <= 2.5) {
      state.ranges = mergeRange(state.ranges, state.lastMediaTime, video.currentTime);
      state.pendingSeconds += wallDelta;
      state.totalActualSeconds += wallDelta;

      const uniqueSeconds = rangeDuration(state.ranges);
      const percent = Math.min(100, Math.floor((uniqueSeconds / video.duration) * 100));
      setActualWatchedSeconds(Math.floor(state.totalActualSeconds));
      setUniqueWatchedSeconds(Math.floor(uniqueSeconds));
      setWatchedPercent(percent);

      if (state.pendingSeconds >= 5) syncWatchTime();
      if (percent >= 85 && !completedLessons[currentId]) {
        setCompletedLessons((previous) => ({ ...previous, [currentId]: true }));
        syncWatchTime(true);
        onLogEvent({
          action: 'COMPLETE_LESSON',
          lessonId: currentId,
          durationSeconds: 0,
          metadata: trackingMetadata(),
        })
          .then(() => setEventLogMessage(`Đã xem thực tế ${Math.floor(state.totalActualSeconds)} giây; hoàn thành ${percent}% nội dung.`))
          .catch((error) => setEventLogMessage(`Không thể lưu tiến độ: ${error.message}`));
        setTimeout(() => setEventLogMessage(null), 5000);
      }
    }

    state.lastMediaTime = video.currentTime;
    state.lastWallTime = now;
  };

  const handleSeeking = () => {
    const state = watchStateRef.current;
    state.seeking = true;
    state.lastMediaTime = null;
    state.lastWallTime = null;
  };

  const handleSeeked = (event) => {
    const video = videoRef.current;
    const state = watchStateRef.current;
    state.seeking = false;
    state.lastMediaTime = video?.currentTime ?? null;
    state.lastWallTime = event.timeStamp;
  };

  const handleLoadedMetadata = () => {
    if (viewLoggedRef.current.has(currentId)) return;
    viewLoggedRef.current.add(currentId);
    onLogEvent({ action: 'VIEW_LESSON', lessonId: currentId, durationSeconds: 0, metadata: trackingMetadata() })
      .catch((error) => setEventLogMessage(`Không thể lưu sự kiện: ${error.message}`));
  };

  const resetTracking = (lessonId) => {
    watchStateRef.current = createWatchState(lessonId);
    setWatchedPercent(0);
    setActualWatchedSeconds(0);
    setUniqueWatchedSeconds(0);
  };

  const handleSelectLesson = (lesson) => {
    if (lesson.type === 'quiz') {
      syncWatchTime(true);
      onOpenQuiz(lesson.quizId);
      return;
    }
    syncWatchTime(true);
    setCurrentId(lesson.id);
    resetTracking(lesson.id);
  };

  const handleBack = () => {
    syncWatchTime(true);
    onBack();
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gray-900 text-white">
      <header className="z-10 flex h-14 items-center justify-between border-b border-gray-700 bg-gray-800 px-4">
        <button onClick={handleBack} className="flex items-center gap-2 text-xs font-semibold text-gray-300 transition hover:text-white"><ArrowLeft size={16} /><span>Thoát phòng học</span></button>
        <span className="max-w-md truncate text-sm font-bold">{course.title}</span>
        <span className="rounded-full border border-blue-500/30 bg-blue-600/30 px-2.5 py-1 text-xs font-medium text-blue-400">Tiến độ: {Math.round((Object.keys(completedLessons).length / Math.max(1, course.sections.flatMap((section) => section.lessons).filter((lesson) => lesson.type !== 'quiz').length)) * 100)}%</span>
      </header>

      {eventLogMessage && <div className="flex items-center justify-center gap-2 bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-lg"><Sparkles size={16} /><span>{eventLogMessage}</span></div>}

      <div className="flex flex-1 overflow-hidden">
        <aside className="flex w-80 flex-col overflow-y-auto border-r border-gray-700 bg-gray-800/90 md:w-96">
          <div className="border-b border-gray-700 p-4"><h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Nội dung bài học</h3></div>
          <div className="divide-y divide-gray-700/50">{course.sections.map((section) => <div key={section.id} className="p-3"><p className="mb-2 px-2 text-xs font-bold text-gray-400">{section.title}</p><div className="space-y-1">{section.lessons.map((lesson) => { const isActive = lesson.id === currentId; const isDone = completedLessons[lesson.id]; return <button key={lesson.id} onClick={() => handleSelectLesson(lesson)} className={`flex w-full items-center justify-between rounded-xl p-2.5 text-left text-xs transition ${isActive ? 'bg-blue-600 font-bold text-white shadow' : 'text-gray-300 hover:bg-gray-700/50'}`}><div className="flex min-w-0 items-center gap-2.5 pr-2">{lesson.type === 'video' && <PlayCircle size={16} className={isActive ? 'text-white' : 'text-blue-400'} />}{['pdf', 'document'].includes(lesson.type) && <FileText size={16} className={isActive ? 'text-white' : 'text-emerald-400'} />}{lesson.type === 'quiz' && <HelpCircle size={16} className={isActive ? 'text-white' : 'text-amber-400'} />}<span className="min-w-0"><span className="block truncate">{lesson.title}</span><span className={isActive ? 'text-blue-100' : 'text-gray-500'}>{Math.round(Number(lesson.durationSeconds) || 0)} giây</span></span></div>{isDone && <CheckCircle2 size={16} className="flex-shrink-0 text-emerald-400" />}</button>; })}</div></div>)}</div>
        </aside>

        <main className="flex flex-1 flex-col items-center justify-center overflow-y-auto bg-black p-4 sm:p-8">
          {currentLesson?.type === 'video' ? (
            <div className="w-full max-w-4xl space-y-4">
              <div className="relative aspect-video overflow-hidden rounded-2xl border border-gray-800 bg-gray-950 shadow-2xl">
                <video key={currentId} ref={videoRef} src={currentLesson.videoUrl} controls onLoadedMetadata={handleLoadedMetadata} onPlay={handlePlay} onPause={() => syncWatchTime(true)} onTimeUpdate={handleTimeUpdate} onSeeking={handleSeeking} onSeeked={handleSeeked} onEnded={() => syncWatchTime(true)} className="h-full w-full object-cover" />
              </div>
              <div className="rounded-xl bg-gray-800 p-4 text-xs text-gray-300">
                <div className="flex flex-wrap items-center justify-between gap-3"><div><span className="font-bold">Đã xem thực tế: {actualWatchedSeconds} giây</span><span className="text-gray-500"> · Nội dung duy nhất: {uniqueWatchedSeconds} giây ({watchedPercent}%)</span></div><span className="text-gray-400">Có thể tua; đoạn bị bỏ qua không được tính</span></div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-700"><div className={`h-full transition-all duration-300 ${watchedPercent >= 85 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${watchedPercent}%` }} /></div>
              </div>
            </div>
          ) : (
            <div className="max-w-2xl space-y-4 rounded-2xl border border-gray-700 bg-gray-800 p-8 text-center"><FileText size={48} className="mx-auto text-emerald-400" /><h2 className="text-xl font-bold">{currentLesson?.title}</h2><p className="text-xs leading-relaxed text-gray-400">Tài liệu đã sẵn sàng. Bấm nút bên dưới khi đã đọc xong.</p><button onClick={() => { setCompletedLessons((previous) => ({ ...previous, [currentId]: true })); onLogEvent({ action: 'COMPLETE_LESSON', lessonId: currentId, durationSeconds: 0, metadata: { trackingMode: 'MANUAL_DOCUMENT_COMPLETE' } }).then(() => setEventLogMessage('Đã đánh dấu hoàn thành và lưu vào PostgreSQL.')).catch((error) => setEventLogMessage(`Không thể lưu tiến độ: ${error.message}`)); setTimeout(() => setEventLogMessage(null), 3000); }} className="rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold transition hover:bg-emerald-700">Đánh dấu đã đọc xong</button></div>
          )}
        </main>
      </div>
    </div>
  );
}
