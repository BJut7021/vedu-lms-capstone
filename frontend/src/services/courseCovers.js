import manifest from "../data/course-covers.json";
import {
  courseFamily,
  courseIdentity,
  fallbackCourseCover,
} from "./courseArtwork";
const legacyStock = new Set([
  "photo-1544383835-bda2bc66a55d",
  "photo-1551288049-bebda4e38f71",
  "photo-1633356122544-f134324a6cee",
]);
export function resolveCourseCover(course) {
  const candidate = manifest[courseIdentity(course)],
    id = course.id ?? course.courseId;
  const entry =
    candidate && (id == null || Number(id) === candidate.courseId)
      ? candidate
      : undefined;
  const uploaded = course.image || course.thumbnailUrl || course.thumbnail_url;
  const isOldStock =
    entry && uploaded && [...legacyStock].some((id) => uploaded.includes(id));
  const custom =
    typeof uploaded === "string" &&
    uploaded.trim() &&
    !isOldStock &&
    !/favicon|placeholder|picsum\.photos|(?:vite|react)\.svg/i.test(uploaded);
  const family = courseFamily(course),
    names = {
      web: "Lập trình Web",
      database: "Cơ sở dữ liệu",
      data: "Dữ liệu & AI",
      digital: "Kỹ năng số",
      math: "Toán học",
      network: "Mạng máy tính",
      document: "Soạn thảo tài liệu",
      spreadsheet: "Bảng tính",
      presentation: "Thuyết trình",
    };
  return {
    ...entry,
    primary: custom ? uploaded : entry?.src,
    fallback: fallbackCourseCover(course),
    custom: !!custom,
    headline: entry?.headline || names[family],
    subtitle:
      entry?.subtitle ||
      course.title ||
      course.courseName ||
      "Học và thực hành",
    ink: entry?.ink || "#294968",
  };
}
