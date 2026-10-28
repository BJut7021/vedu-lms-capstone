import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BookOpen, Search, SlidersHorizontal, User } from "lucide-react";
import { api } from "../services/api";
import CourseImage from "./CourseImage";

export default function CourseCatalog({ topics }) {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") || "";
  const topic = params.get("topic") || "";
  const sort = params.get("sort") || "newest";
  const [results, setResults] = useState({
    courses: [],
    error: "",
    loading: true,
  });
  useEffect(() => {
    let active = true;
    const load = () =>
      api
        .courses({ q, topic, sort })
        .then((courses) => {
          if (active) setResults({ courses, error: "", loading: false });
        })
        .catch((error) => {
          if (active)
            setResults({ courses: [], error: error.message, loading: false });
        });
    load();
    const timer = setInterval(load, 30000);
    window.addEventListener("focus", load);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener("focus", load);
    };
  }, [q, topic, sort]);
  const filter = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  };
  return (
    <main className="min-h-[65vh] bg-slate-50/70">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-600">
              Khám phá cùng Vedu
            </p>
            <h1 className="home-balanced mt-2 text-3xl font-black text-slate-900">
              {q ? `Kết quả cho “${q}”` : "Tìm khóa học dành cho bạn"}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {results.courses.length} khóa học · video, tài liệu và bài kiểm
              tra
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <SlidersHorizontal size={17} />
            <select
              aria-label="Sắp xếp khóa học"
              value={sort}
              onChange={(event) => filter("sort", event.target.value)}
              className="rounded-xl border border-slate-200 bg-white p-2.5"
            >
              <option value="newest">Mới nhất</option>
              <option value="popular">Nhiều học viên nhất</option>
              <option value="price-asc">Học phí tăng dần</option>
            </select>
          </label>
        </div>
        <div className="my-6 flex flex-wrap gap-2">
          <button
            onClick={() => filter("topic", "")}
            className={`rounded-full border px-4 py-2 text-sm font-semibold ${!topic ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-600"}`}
          >
            Tất cả
          </button>
          {topics.map((item) => (
            <button
              key={item}
              onClick={() => filter("topic", item)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold ${topic === item ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-blue-300"}`}
            >
              {item}
            </button>
          ))}
        </div>
        {results.error && (
          <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-600">
            {results.error}
          </p>
        )}
        {results.loading ? (
          <p className="py-12 text-center text-slate-500">
            Đang tìm khóa học...
          </p>
        ) : results.courses.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {results.courses.map((course) => (
              <Link
                key={course.id}
                to={`/courses/${course.id}`}
                className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <CourseImage course={course} />
                <div className="p-4">
                  <h2 className="mt-1.5 min-h-12 text-base font-bold text-slate-900">
                    {course.title}
                  </h2>
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                    <User size={14} />
                    {course.instructor}
                  </p>
                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <BookOpen size={14} />
                      {course.lessons} bài · {course.students} học viên
                    </span>
                    <strong className="text-blue-700">
                      {Number(course.price).toLocaleString("vi-VN")} ₫
                    </strong>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          !results.error && (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center">
              <Search className="mx-auto text-blue-300" size={36} />
              <h2 className="mt-3 font-bold text-slate-700">
                Chưa tìm thấy khóa học phù hợp
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Thử từ khóa khác hoặc xem tất cả chủ đề.
              </p>
              <button
                onClick={() => setParams({})}
                className="mt-4 rounded-full bg-blue-600 px-5 py-2 text-sm font-bold text-white"
              >
                Xem tất cả khóa học
              </button>
            </div>
          )
        )}
      </div>
    </main>
  );
}
