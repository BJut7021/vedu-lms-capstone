import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  BookOpen,
  Check,
  GraduationCap,
  Sparkles,
} from "lucide-react";

export default function Banner({
  onOpenAuth,
  courseCount = 0,
  topicCount = 0,
}) {
  return (
    <section className="home-hero" aria-labelledby="home-heading">
      <div className="mx-auto max-w-7xl px-4 pb-7 pt-7 sm:px-6 lg:px-8 lg:pt-10">
        <div className="grid items-center gap-7 lg:grid-cols-[1fr_1.08fr] lg:gap-12">
          <div className="min-w-0 lg:py-5">
            <p className="home-brand mb-5 flex items-start gap-2 text-xs font-bold text-blue-700">
              <Sparkles size={16} className="mt-0.5 shrink-0" />
              <span>VEDU Learning Management System</span>
            </p>
            <h1
              id="home-heading"
              className="home-hero-title font-extrabold tracking-tight text-slate-900"
            >
              <span className="block">Học điều mới, </span>
              <span className="block text-blue-600">mở thêm cơ hội.</span>
            </h1>
            <p className="home-copy mt-5 max-w-[47ch] text-base leading-7 text-slate-600 sm:text-[17px]">
              Từ bài học đầu tiên đến kỹ năng dùng mỗi ngày. Khám phá khóa học,
              thực hành cùng giảng viên và tiến bộ theo nhịp độ của bạn.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                to="/courses"
                className="home-cta inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-200/60 transition hover:bg-blue-700"
              >
                Khám phá khóa học{" "}
                <ArrowUpRight size={18} className="shrink-0" />
              </Link>
              <button
                onClick={() => onOpenAuth("login")}
                className="home-cta rounded-full border border-slate-200 bg-white px-5 py-3.5 text-sm font-bold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50"
              >
                Trải nghiệm học ngay
              </button>
            </div>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-slate-600">
              <span className="inline-flex items-center gap-2 whitespace-nowrap">
                <Check size={16} className="shrink-0 text-emerald-600" />
                Học theo nhịp độ riêng
              </span>
              <span className="inline-flex items-center gap-2 whitespace-nowrap">
                <Check size={16} className="shrink-0 text-emerald-600" />
                Video, tài liệu, bài tập
              </span>
            </div>
          </div>
          <div
            className="home-photo-grid"
            aria-label="Khoảnh khắc giảng dạy và học tập"
          >
            <figure className="home-photo-main relative overflow-hidden rounded-[24px] bg-slate-100">
              <img
                src="/images/learning/classroom-smiles.webp"
                alt="Giảng viên và nhóm học viên tươi cười trong lớp học"
                width="1200"
                height="800"
                fetchPriority="high"
                className="h-full w-full object-cover object-[50%_15%]"
              />
              <figcaption className="absolute inset-x-3 bottom-3 flex items-center gap-3 rounded-2xl border border-white/70 bg-white/95 px-4 py-3 text-sm text-slate-800 shadow-sm">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600">
                  <GraduationCap size={21} />
                </span>
                <span className="home-copy font-semibold">
                  Mỗi bài học, một bước tiến mới.
                </span>
              </figcaption>
            </figure>
            <figure className="home-photo-small overflow-hidden rounded-[20px] bg-slate-100">
              <img
                src="/images/learning/teacher-laptop.webp"
                alt="Giảng viên mỉm cười khi giảng dạy với laptop"
                width="640"
                height="427"
                decoding="async"
                className="h-full w-full object-cover object-[50%_43%]"
              />
            </figure>
            <figure className="home-photo-small overflow-hidden rounded-[20px] bg-slate-100">
              <img
                src="/images/learning/students-campus.webp"
                alt="Hai học viên cùng học bằng laptop và ghi chép trong khuôn viên trường"
                width="640"
                height="960"
                decoding="async"
                className="h-full w-full object-cover object-[50%_43%]"
              />
            </figure>
          </div>
        </div>
        <div className="mt-7 grid grid-cols-2 gap-x-4 gap-y-5 rounded-2xl border border-blue-100/70 bg-white/90 p-4 sm:p-5 lg:grid-cols-4">
          {[
            {
              icon: BookOpen,
              value: courseCount,
              label: "Khóa học để khám phá",
              tone: "bg-blue-50 text-blue-600",
            },
            {
              icon: Sparkles,
              value: topicCount,
              label: "Chủ đề kỹ năng",
              tone: "bg-amber-50 text-amber-600",
            },
            {
              icon: Check,
              value: "Học và thực hành",
              label: "Kiến thức đi cùng bài tập",
              tone: "bg-emerald-50 text-emerald-600",
            },
            {
              icon: GraduationCap,
              value: "Theo dõi tiến bộ",
              label: "Lưu từng bước học tập",
              tone: "bg-violet-50 text-violet-600",
            },
          ].map(({ icon: Icon, value, label, tone }) => (
            <div
              key={label}
              className="flex min-w-0 items-center gap-2.5 sm:gap-3"
            >
              <span
                className={`hidden shrink-0 rounded-xl p-2.5 min-[380px]:block ${tone}`}
              >
                <Icon size={20} />
              </span>
              <div className="min-w-0">
                <strong className="home-balanced block text-sm font-bold leading-5 text-slate-900 sm:text-[15px]">
                  {value}
                </strong>
                <span className="home-copy mt-1 block text-xs leading-5 text-slate-500">
                  {label}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
