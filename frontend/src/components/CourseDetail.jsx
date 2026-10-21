import { useState } from 'react';
import { ArrowLeft, PlayCircle, FileText, HelpCircle, CheckCircle, Star, Users, ChevronDown, ChevronUp } from 'lucide-react';

export default function CourseDetail({ course, onBack, onStartLearning, onStartQuiz }) {
  const [openSections, setOpenSections] = useState({ 'course-content': true });

  const allLessons = course.sections.flatMap((section) => section.lessons);
  const firstLearningLesson = allLessons.find((lesson) => lesson.type !== 'quiz');

  const toggleSection = (secId) => {
    setOpenSections(prev => ({ ...prev, [secId]: !prev[secId] }));
  };

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        <button 
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-blue-600 transition"
        >
          <ArrowLeft size={18} />
          <span>Quay lại trang chủ</span>
        </button>

        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-4">
            <span className="px-3 py-1 bg-blue-50 text-blue-700 font-semibold text-xs rounded-full">
              Khóa học định hướng lộ trình AI
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight">
              {course.title}
            </h1>
            <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
              {course.description}
            </p>

            <div className="flex flex-wrap items-center gap-6 pt-2 text-sm text-gray-500">
              <div className="flex items-center gap-1.5 text-amber-500 font-bold">
                <Star size={18} fill="currentColor" />
                <span>{course.rating ?? 'Chưa có đánh giá'}</span>
                <span className="text-gray-400 font-normal">({course.students} học viên)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users size={16} />
                <span>Giảng viên: <strong className="text-gray-800">{course.instructor}</strong></span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl p-6 shadow-xl space-y-6">
            <div>
              <p className="text-xs uppercase tracking-wider text-blue-200 font-semibold">Trạng thái học tập</p>
              <h3 className="text-2xl font-extrabold mt-1">Sẵn sàng học</h3>
              <p className="text-xs text-blue-100 mt-1">Đã cấu hình tự động ghi log tiến độ vào CSDL</p>
            </div>

            <button 
              onClick={() => firstLearningLesson && onStartLearning(firstLearningLesson.id)}
              className="w-full py-3.5 bg-white text-blue-700 font-bold rounded-xl hover:bg-blue-50 shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
            >
              <PlayCircle size={20} />
              <span>Vào phòng học ngay</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h2 className="text-xl font-extrabold text-gray-900">Đề cương chi tiết khóa học</h2>
              <p className="text-xs text-gray-500 mt-1">Bao gồm chuỗi bài giảng video, tài liệu và bài quiz đánh giá</p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 bg-gray-100 rounded-lg text-gray-600">
              {course.sections.length} chương • {allLessons.length} bài học
            </span>
          </div>

          <div className="space-y-4">
            {course.sections.map((section) => (
              <div key={section.id} className="border border-gray-200 rounded-2xl overflow-hidden">
                <button 
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center justify-between p-4 bg-gray-50/70 hover:bg-gray-100/70 transition font-bold text-gray-800 text-left"
                >
                  <span className="text-sm sm:text-base">{section.title}</span>
                  {openSections[section.id] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>

                {openSections[section.id] && (
                  <div className="divide-y divide-gray-100">
                    {section.lessons.map((lesson) => (
                      <div 
                        key={lesson.id} 
                        className="p-4 flex items-center justify-between hover:bg-blue-50/40 transition cursor-pointer"
                        onClick={() => {
                          if (lesson.type === 'quiz') onStartQuiz(lesson.quizId);
                          else onStartLearning(lesson.id);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          {lesson.type === 'video' && <PlayCircle size={18} className="text-blue-600" />}
                          {lesson.type === 'pdf' && <FileText size={18} className="text-emerald-600" />}
                          {lesson.type === 'quiz' && <HelpCircle size={18} className="text-amber-500" />}

                          <div>
                            <p className="text-sm font-semibold text-gray-800 hover:text-blue-600 transition">
                              {lesson.title}
                            </p>
                            <span className="text-xs text-gray-400 capitalize">{lesson.type}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {lesson.completed ? (
                            <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                              <CheckCircle size={14} /> Hoàn thành
                            </span>
                          ) : (
                            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                              Học ngay
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
