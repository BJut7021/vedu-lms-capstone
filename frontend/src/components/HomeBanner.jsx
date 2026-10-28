import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  ArrowRight,
  BookOpen,
  Check,
  GraduationCap,
  Sparkles,
  Compass,
} from "lucide-react";

export default function HomeBanner({
  onOpenAuth,
  courseCount = 0,
  topicCount = 0,
}) {
  return (
    <section
      className="home-hero home-hero-v2 relative overflow-hidden"
      aria-labelledby="home-heading"
    >
      <div aria-hidden="true" className="home-side-decoration home-side-left">
        <img
          src="/images/learning/study-books.svg"
          alt=""
          width="300"
          height="470"
          className="h-auto w-full"
        />
      </div>
      <div aria-hidden="true" className="home-side-decoration home-side-right">
        <img
          src="/images/learning/study-laptop.svg"
          alt=""
          width="300"
          height="470"
          className="h-auto w-full"
        />
      </div>
      <div className="relative mx-auto max-w-7xl space-y-6 px-4 pb-7 pt-6 sm:px-6 lg:px-8">
        <div className="grid items-center gap-6 lg:grid-cols-[1fr_1.06fr] lg:gap-10">
          <div className="min-w-0 py-2">
            <p className="mb-4 inline-flex flex-wrap items-center gap-2 rounded-full border border-blue-100 bg-white/90 px-3 py-1.5 text-xs font-bold text-blue-700">
              <Sparkles size={14} />
              <span>
                {courseCount.toLocaleString("vi-VN")} khóa học đang mở ·{" "}
                {topicCount} chủ đề
              </span>
            </p>
            <h1
              id="home-heading"
              className="home-balanced home-title-v2 font-extrabold text-slate-900"
            >
              <span className="block">Bắt đầu từ hôm nay,</span>
              <span className="block text-blue-600">tiến xa hơn mỗi ngày.</span>
            </h1>
            <p className="home-copy mt-4 max-w-[52ch] text-sm leading-7 text-slate-500 sm:text-base">
              Khám phá khóa học phù hợp, học từng bước cùng giảng viên và xây
              dựng kỹ năng bạn cần — ngay trên VEDU.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                to="/courses"
                className="home-cta inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-md shadow-blue-200"
              >
                Khám phá khóa học
                <ArrowRight size={17} />
              </Link>
              <button
                onClick={() => onOpenAuth("login")}
                className="home-cta rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700"
              >
                Trải nghiệm học ngay
              </button>
            </div>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <Check size={14} className="text-emerald-500" />
                Học theo nhịp độ của bạn
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check size={14} className="text-emerald-500" />
                Video, tài liệu & bài tập
              </span>
            </div>
          </div>
          <figure className="relative m-0 h-[320px] overflow-hidden rounded-[24px] bg-slate-100 sm:h-[330px] lg:h-[320px]">
            <img
              src="/images/learning/classroom-smiles.webp"
              alt="Giảng viên và học viên cùng tươi cười trong lớp học"
              width="1200"
              height="800"
              fetchPriority="high"
              className="h-full w-full object-cover object-[50%_15%]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/20 to-transparent" />
            <p className="absolute left-5 top-4 max-w-[calc(100%-5rem)] rounded-full bg-slate-900/30 px-3 py-1.5 text-[10px] font-semibold tracking-wider text-white backdrop-blur-sm">
              VEDU Learning Management System
            </p>
            <Link
              to="/courses"
              aria-label="Khám phá các khóa học VEDU"
              className="absolute right-4 top-4 rounded-full bg-white p-2 text-blue-700"
            >
              <ArrowUpRight size={21} />
            </Link>
            <figcaption className="absolute inset-x-5 bottom-5 text-white">
              <p className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-blue-600/90 px-3 py-1 text-[11px] font-semibold">
                <Compass size={13} />
                Hành trình của bạn bắt đầu tại đây
              </p>
              <h2 className="home-balanced max-w-[20ch] text-2xl font-extrabold leading-tight sm:text-[30px]">
                Học điều mới.
                <br />
                Chạm tới tương lai.
              </h2>
              <p className="home-copy mt-2 max-w-md text-xs leading-5 text-blue-50">
                Khám phá kiến thức, rèn luyện kỹ năng và chinh phục những mục
                tiêu của riêng bạn.
              </p>
            </figcaption>
          </figure>
        </div>
        <div
          aria-label="Tổng quan kho khóa học"
          className="grid grid-cols-2 gap-x-4 gap-y-4 rounded-2xl border border-blue-100 bg-white/95 px-4 py-4 sm:px-5 lg:grid-cols-4"
        >
          {[
            [
              BookOpen,
              courseCount.toLocaleString("vi-VN"),
              "Khóa học để khám phá",
              "bg-blue-50 text-blue-600",
            ],
            [
              Sparkles,
              topicCount,
              "Chủ đề kỹ năng",
              "bg-amber-50 text-amber-500",
            ],
            [
              Check,
              "Học & thực hành",
              "Kiến thức đi cùng bài tập",
              "bg-emerald-50 text-emerald-500",
            ],
            [
              GraduationCap,
              "Theo dõi tiến bộ",
              "Từng bước, từng bài học",
              "bg-violet-50 text-violet-500",
            ],
          ].map(([Icon, value, label, tone]) => (
            <div key={label} className="flex min-w-0 items-center gap-2.5">
              <span
                className={`hidden shrink-0 rounded-xl p-2.5 min-[380px]:block ${tone}`}
              >
                <Icon size={20} />
              </span>
              <div className="min-w-0">
                <strong className="home-balanced block text-sm font-bold text-slate-900">
                  {value}
                </strong>
                <span className="home-copy mt-1 block text-[11px] leading-5 text-slate-500">
                  {label}
                </span>
              </div>
            </div>
          ))}
        </div>
        <div className="relative overflow-hidden rounded-[22px] bg-blue-950">
          <img
            src="/images/learning/students-campus.webp"
            alt="Hai học viên cùng thảo luận và ghi chép bên laptop"
            width="640"
            height="960"
            loading="lazy"
            className="absolute inset-y-0 right-0 h-full w-full object-cover object-[50%_42%] sm:w-3/5"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-950 via-blue-950/95 to-blue-950/20 sm:via-blue-950/85" />
          <div className="relative p-5 sm:p-6 lg:px-7">
            <p className="mb-2 text-[10px] font-bold tracking-wider text-blue-200">
              KHÁM PHÁ VÀ TRẢI NGHIỆM
            </p>
            <h2 className="home-balanced max-w-[26ch] text-xl font-extrabold leading-snug text-white sm:text-2xl">
              Biến kiến thức thành
              <br />
              kỹ năng thực tế
            </h2>
            <p className="home-copy mt-2 max-w-sm text-xs leading-5 text-blue-100">
              Từ bài học đầu tiên đến những điều bạn có thể vận dụng mỗi ngày.
            </p>
            <Link
              to="/courses"
              className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-blue-800"
            >
              Khám phá khóa học
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
