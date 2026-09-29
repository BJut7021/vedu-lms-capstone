import React, { useState, useRef } from 'react';
import { ArrowLeft, PlayCircle, FileText, HelpCircle, CheckCircle2, Sparkles } from 'lucide-react';

export default function Classroom({ course, activeLessonId, onBack, onOpenQuiz }) {
  const [currentId, setCurrentId] = useState(activeLessonId || 'lsn-1-1');
  const [eventLogMessage, setEventLogMessage] = useState(null);
  const [watchedPercent, setWatchedPercent] = useState(0);
  const [completedLessons, setCompletedLessons] = useState({ 'lsn-1-1': true, 'lsn-1-2': true });

  const videoRef = useRef(null);

  let currentLesson = null;
  for (const sec of course.sections) {
    const found = sec.lessons.find(l => l.id === currentId);
    if (found) { currentLesson = found; break; }
  }

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const { currentTime, duration } = videoRef.current;
    if (duration > 0) {
      const pct = Math.floor((currentTime / duration) * 100);
      setWatchedPercent(pct);

      if (pct >= 85 && !completedLessons[currentId]) {
        setCompletedLessons(prev => ({ ...prev, [currentId]: true }));
        setEventLogMessage(`[UI Hook: onVideoComplete] Đã xem ${pct}% bài học -> Gửi log COMPLETED về hệ thống AI!`);
        setTimeout(() => setEventLogMessage(null), 5000);
      }
    }
  };

  const handleSelectLesson = (lesson) => {
    if (lesson.type === 'quiz') {
      onOpenQuiz();
      return;
    }
    setCurrentId(lesson.id);
    setWatchedPercent(0);
    setEventLogMessage(`[UI Hook: onLessonStart] Đang tải bài học: ${lesson.title}`);
    setTimeout(() => setEventLogMessage(null), 3000);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white overflow-hidden">
      
      <header className="h-14 bg-gray-800 border-b border-gray-700 px-4 flex items-center justify-between z-10">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold text-gray-300 hover:text-white transition"
        >
          <ArrowLeft size={16} />
          <span>Thoát phòng học</span>
        </button>
        <span className="text-sm font-bold truncate max-w-md">{course.title}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-blue-600/30 text-blue-400 border border-blue-500/30 px-2.5 py-1 rounded-full font-medium">
            Tiến độ: {Math.round((Object.keys(completedLessons).length / 6) * 100)}%
          </span>
        </div>
      </header>

      {eventLogMessage && (
        <div className="bg-emerald-600 text-white text-xs py-2 px-4 flex items-center justify-center gap-2 shadow-lg animate-pulse font-semibold">
          <Sparkles size={16} />
          <span>{eventLogMessage}</span>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        
        <aside className="w-80 md:w-96 bg-gray-800/90 border-r border-gray-700 flex flex-col overflow-y-auto">
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Nội dung bài học</h3>
          </div>

          <div className="divide-y divide-gray-700/50">
            {course.sections.map((section) => (
              <div key={section.id} className="p-3">
                <p className="text-xs font-bold text-gray-400 mb-2 px-2">{section.title}</p>
                <div className="space-y-1">
                  {section.lessons.map((lesson) => {
                    const isActive = lesson.id === currentId;
                    const isDone = completedLessons[lesson.id];

                    return (
                      <button
                        key={lesson.id}
                        onClick={() => handleSelectLesson(lesson)}
                        className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center justify-between transition ${
                          isActive 
                            ? 'bg-blue-600 text-white font-bold shadow' 
                            : 'hover:bg-gray-700/50 text-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate pr-2">
                          {lesson.type === 'video' && <PlayCircle size={16} className={isActive ? 'text-white' : 'text-blue-400'} />}
                          {lesson.type === 'pdf' && <FileText size={16} className={isActive ? 'text-white' : 'text-emerald-400'} />}
                          {lesson.type === 'quiz' && <HelpCircle size={16} className={isActive ? 'text-white' : 'text-amber-400'} />}
                          <span className="truncate">{lesson.title}</span>
                        </div>
                        {isDone && <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </aside>

        <main className="flex-1 flex flex-col bg-black overflow-y-auto p-4 sm:p-8 items-center justify-center">
          {currentLesson?.type === 'video' ? (
            <div className="w-full max-w-4xl space-y-4">
              <div className="aspect-video bg-gray-950 rounded-2xl overflow-hidden shadow-2xl border border-gray-800 relative">
                <video 
                  ref={videoRef}
                  src={currentLesson.videoUrl} 
                  controls 
                  onTimeUpdate={handleTimeUpdate}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="bg-gray-800 p-4 rounded-xl flex items-center justify-between text-xs text-gray-300">
                <div className="flex items-center gap-2">
                  <span className="font-bold">Đã xem: {watchedPercent}%</span>
                  <span className="text-gray-500">• (Đạt 85% sẽ tự động đánh dấu hoàn thành)</span>
                </div>
                <div className="w-48 bg-gray-700 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${watchedPercent >= 85 ? 'bg-emerald-500' : 'bg-blue-500'}`} 
                    style={{ width: `${watchedPercent}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-800 p-8 rounded-2xl max-w-2xl text-center space-y-4 border border-gray-700">
              <FileText size={48} className="mx-auto text-emerald-400" />
              <h2 className="text-xl font-bold">{currentLesson?.title}</h2>
              <p className="text-xs text-gray-400 leading-relaxed">
                Tài liệu đọc định dạng PDF đã sẵn sàng. Học viên đọc tài liệu và bấm nút bên dưới để hoàn tất bài học.
              </p>
              <button 
                onClick={() => {
                  setCompletedLessons(prev => ({ ...prev, [currentId]: true }));
                  setEventLogMessage(`[UI Hook: onVideoComplete] Đã đánh dấu hoàn thành bài học!`);
                  setTimeout(() => setEventLogMessage(null), 3000);
                }}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 font-bold rounded-xl text-xs transition"
              >
                Đánh dấu đã đọc xong
              </button>
            </div>
          )}
        </main>

      </div>
    </div>
  );
}