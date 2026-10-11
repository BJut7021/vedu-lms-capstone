import { useRef } from 'react';
import { BookOpen, ChevronLeft, ChevronRight, Flame, Star, TrendingUp, User } from 'lucide-react';

function CourseCard({ course, onSelectCourse }) {
  return <button onClick={() => onSelectCourse(course)} className="group w-[285px] flex-none overflow-hidden rounded-2xl border border-gray-100 bg-white text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
    <img src={course.image || '/favicon.svg'} alt={course.title} className="h-40 w-full bg-blue-50 object-cover" />
    <div className="p-5">
      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-blue-700">{course.topic || 'Tổng hợp'}</span>
      <div className="mt-3 flex items-center gap-1 text-xs font-bold text-amber-500"><Star size={14} fill="currentColor" />{course.rating}<span className="font-normal text-gray-400">({course.students} học viên)</span></div>
      <h3 className="mt-2 line-clamp-2 min-h-12 font-bold leading-snug text-gray-900 transition group-hover:text-blue-600">{course.title}</h3>
      <p className="mt-2 flex items-center gap-1 text-xs text-gray-500"><User size={14} />{course.instructor}</p>
      <div className="mt-4 flex items-center justify-between border-t pt-3 text-xs text-gray-500"><span className="flex items-center gap-1"><BookOpen size={14} />{course.lessons} bài học</span><strong className="text-blue-700">{Number(course.price || 0).toLocaleString('vi-VN')} ₫</strong></div>
    </div>
  </button>;
}

function Slider({ title, subtitle, icon: Icon, courses, onSelectCourse }) {
  const rowRef = useRef(null);
  const move = (direction) => rowRef.current?.scrollBy({ left: direction * 620, behavior: 'smooth' });
  return <section className="space-y-4">
    <div className="flex items-end justify-between gap-4"><div><h2 className="flex items-center gap-2 text-2xl font-black text-gray-900"><Icon className="text-blue-600" />{title}</h2><p className="mt-1 text-sm text-gray-500">{subtitle}</p></div><div className="flex gap-2"><button onClick={() => move(-1)} aria-label={`Lùi slider ${title}`} className="rounded-full border bg-white p-2 text-gray-600 shadow-sm hover:text-blue-600"><ChevronLeft /></button><button onClick={() => move(1)} aria-label={`Tiến slider ${title}`} className="rounded-full border bg-white p-2 text-gray-600 shadow-sm hover:text-blue-600"><ChevronRight /></button></div></div>
    <div ref={rowRef} className="flex snap-x gap-5 overflow-x-auto pb-4 [scrollbar-width:none]">{courses.map((course) => <div key={course.id} className="snap-start"><CourseCard course={course} onSelectCourse={onSelectCourse} /></div>)}</div>
  </section>;
}

export default function FeaturedCourses({ courses, onSelectCourse }) {
  const trending = [...courses].sort((a, b) => Number(b.id) - Number(a.id)).slice(0, 12);
  const bestSelling = [...courses].sort((a, b) => Number(b.students) - Number(a.students) || Number(b.id) - Number(a.id)).slice(0, 12);
  const topics = Object.entries(courses.reduce((groups, course) => {
    const topic = course.topic || 'Khóa học tổng hợp';
    groups[topic] = [...(groups[topic] || []), course];
    return groups;
  }, {}));
  return <div id="courses" className="bg-gray-50/70 py-16"><div className="mx-auto max-w-7xl space-y-14 px-4 sm:px-6 lg:px-8">
    <Slider title="Đang thịnh hành" subtitle="Các khóa học mới được quan tâm trên Vedu" icon={TrendingUp} courses={trending} onSelectCourse={onSelectCourse} />
    <Slider title="Bán chạy nhất" subtitle="Xếp hạng theo số lượng học viên đã đăng ký" icon={Flame} courses={bestSelling} onSelectCourse={onSelectCourse} />
    <div className="space-y-12"><div><h2 className="text-3xl font-black text-gray-900">Khám phá theo chủ đề</h2><p className="mt-1 text-sm text-gray-500">Mỗi chủ đề có lộ trình gồm video, tài liệu và quiz kiểm tra</p></div>{topics.map(([topic, topicCourses]) => <Slider key={topic} title={topic} subtitle={`${topicCourses.length} khóa học trong chủ đề`} icon={BookOpen} courses={topicCourses} onSelectCourse={onSelectCourse} />)}</div>
  </div></div>;
}
