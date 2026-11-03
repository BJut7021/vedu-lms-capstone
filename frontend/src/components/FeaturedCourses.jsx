import { useRef } from "react";
import LearningExperience from "./LearningExperience";
import CourseImage from "./CourseImage";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Flame,
  GraduationCap,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";

function CourseCard({ course, onSelectCourse }) {
  return (
    <button
      onClick={() => onSelectCourse(course)}
      className="group h-full w-[min(285px,calc(100vw-48px))] flex-none overflow-hidden rounded-2xl border border-gray-100 bg-white text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
    >
      <CourseImage course={course} />
      <div className="p-5">
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1 whitespace-nowrap">
            <Users size={14} aria-hidden="true" />
            {course.students} học viên
          </span>
          {course.rating != null && (
            <span className="inline-flex items-center gap-1 whitespace-nowrap font-semibold text-amber-600">
              <Star size={14} fill="currentColor" />
              {course.rating}
            </span>
          )}
        </div>
        <h3 className="home-balanced mt-2 line-clamp-3 min-h-[4.3rem] text-[15px] font-bold leading-[1.5] text-gray-900 transition group-hover:text-blue-600">
          {course.title}
        </h3>
        <p className="mt-2 flex items-start gap-1.5 text-xs leading-5 text-gray-500">
          <GraduationCap
            size={15}
            className="mt-0.5 shrink-0 text-blue-600"
            aria-hidden="true"
          />
          <span className="home-copy">{course.instructor}</span>
        </p>
        <div className="mt-4 flex items-center justify-between border-t pt-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <BookOpen size={14} />
            {course.lessons} bài học
          </span>
          <strong className="text-blue-700">
            {Number(course.price || 0).toLocaleString("vi-VN")} ₫
          </strong>
        </div>
      </div>
    </button>
  );
}

function Slider({ title, subtitle, icon: Icon, courses, onSelectCourse }) {
  const rowRef = useRef(null);
  const move = (direction) =>
    rowRef.current?.scrollBy({ left: direction * 620, behavior: "smooth" });
  return (
    <section className="space-y-4">
      <div className="flex items-start justify-between gap-3 sm:items-end">
        <div className="min-w-0">
          <h2 className="flex items-start gap-2 text-xl font-extrabold leading-snug tracking-tight text-gray-900 sm:text-2xl">
            <Icon size={23} className="mt-0.5 shrink-0 text-blue-600" />
            <span className="home-balanced">{title}</span>
          </h2>
          <p className="home-copy mt-1 max-w-[52ch] text-sm leading-6 text-gray-500">
            {subtitle}
          </p>
        </div>
        <div className="flex shrink-0 gap-1.5 sm:gap-2">
          <button
            onClick={() => move(-1)}
            aria-label={`Lùi slider ${title}`}
            className="rounded-full border bg-white p-2 text-gray-600 shadow-sm hover:text-blue-600"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => move(1)}
            aria-label={`Tiến slider ${title}`}
            className="rounded-full border bg-white p-2 text-gray-600 shadow-sm hover:text-blue-600"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
      <div
        ref={rowRef}
        className="flex snap-x gap-5 overflow-x-auto pb-4 [scrollbar-width:none]"
      >
        {courses.map((course) => (
          <div key={course.id} className="flex shrink-0 snap-start">
            <CourseCard course={course} onSelectCourse={onSelectCourse} />
          </div>
        ))}
      </div>
    </section>
  );
}

export default function FeaturedCourses({ courses, onSelectCourse }) {
  const trending = [...courses]
    .sort((a, b) => Number(b.id) - Number(a.id))
    .slice(0, 12);
  const bestSelling = [...courses]
    .sort(
      (a, b) =>
        Number(b.students) - Number(a.students) || Number(b.id) - Number(a.id),
    )
    .slice(0, 12);
  const topics = Object.entries(
    courses.reduce((groups, course) => {
      const topic = course.topic || "Khóa học tổng hợp";
      groups[topic] = [...(groups[topic] || []), course];
      return groups;
    }, {}),
  );
  return (
    <div id="courses" className="bg-slate-50/70 py-8">
      <div className="mx-auto max-w-7xl space-y-9 px-4 sm:space-y-11 sm:px-6 lg:px-8">
        <Slider
          title="Đang thịnh hành"
          subtitle="Các khóa học mới được quan tâm trên Vedu"
          icon={TrendingUp}
          courses={trending}
          onSelectCourse={onSelectCourse}
        />
        <Slider
          title="Được nhiều học viên lựa chọn"
          subtitle="Xếp hạng theo số lượng học viên đã đăng ký"
          icon={Flame}
          courses={bestSelling}
          onSelectCourse={onSelectCourse}
        />
        <LearningExperience />
        <div className="space-y-8">
          <div>
            <h2 className="home-balanced text-2xl font-extrabold tracking-tight text-gray-900 sm:text-[30px]">
              Khám phá theo chủ đề
            </h2>
            <p className="home-copy mt-1 text-sm leading-6 text-gray-500">
              Chọn kỹ năng bạn muốn phát triển
            </p>
          </div>
          {topics.map(([topic, topicCourses]) => (
            <Slider
              key={topic}
              title={topic}
              subtitle={`${topicCourses.length} khóa học trong chủ đề`}
              icon={BookOpen}
              courses={topicCourses}
              onSelectCourse={onSelectCourse}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
