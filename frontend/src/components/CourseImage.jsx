import { useState } from "react";
import { resolveCourseCover } from "../services/courseCovers";
export default function CourseImage({
  course,
  className = "aspect-[16/9] w-full object-cover",
}) {
  const [failed, setFailed] = useState([]);
  const art = resolveCourseCover(course);
  const src =
    [art.primary, art.src, art.fallback].find(
      (url) => url && !failed.includes(url),
    ) || art.fallback;
  const custom = art.custom && src === art.primary;
  return (
    <span
      className={`course-cover relative isolate block overflow-hidden ${className}`}
      data-course-cover={course.id || course.courseId}
    >
      <img
        src={src}
        alt={course.title || course.courseName || "Khóa học"}
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover"
        onError={() => {
          if (src !== art.fallback) setFailed((previous) => [...previous, src]);
        }}
      />
      {!custom && !(art.precomposed && src === art.src) && (
        <span
          aria-hidden="true"
          className="course-cover-caption"
          style={{ color: art.ink }}
        >
          <span className="course-cover-brand">
            VEDU <span>HỌC & THỰC HÀNH</span>
          </span>
          <span className="course-cover-heading">{art.headline}</span>
          <span className="course-cover-skills">{art.subtitle}</span>
        </span>
      )}
    </span>
  );
}
