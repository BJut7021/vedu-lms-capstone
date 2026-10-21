import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  BookOpen,
  Check,
  Code2,
  GraduationCap,
  Play,
  Sparkles,
} from "lucide-react";

export default function Banner({
  onOpenAuth,
  courseCount = 0,
  topicCount = 0,
}) {
  return (
    <section className="bg-gradient-to-b from-sky-50 via-white to-white">
      <div className="mx-auto max-w-7xl px-4 pb-8 pt-7 sm:px-6 lg:px-8 lg:pt-10">
        <div className="grid items-center gap-7 lg:grid-cols-[1.05fr_1fr] lg:gap-10">
          <div className="space-y-5 py-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-3 py-1.5 text-xs font-bold text-blue-600">
              <Sparkles size={14} />
              Học điều mới. Mở cơ hội mới.
            </span>
            <h1 className="text-4xl font-black leading-[1.15] tracking-tight text-slate-900 sm:text-5xl xl:text-6xl">
              Bắt đầu từ hôm nay,
              <br />
              <span className="text-blue-600">tiến xa hơn mỗi ngày.</span>
            </h1>
            <p className="max-w-lg text-base leading-7 text-slate-500">
              Khám phá khóa học phù hợp, học từng bước cùng giảng viên và xây
              dựng kỹ năng bạn cần — ngay trên Vedu.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/courses"
                className="flex items-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-200 hover:bg-blue-700"
              >
                Khám phá khóa học
                <ArrowUpRight size={18} />
              </Link>
              <button
                onClick={() => onOpenAuth("login")}
                className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:border-blue-300"
              >
                Trải nghiệm học ngay
              </button>
            </div>
            <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-500">
              <span className="flex items-center gap-1.5">
                <Check size={15} className="text-emerald-500" />
                Học theo nhịp độ của bạn
              </span>
              <span className="flex items-center gap-1.5">
                <Check size={15} className="text-emerald-500" />
                Video, tài liệu & bài tập
              </span>
            </div>
          </div>
          <Link
            to="/courses?sort=popular"
            aria-label="Khám phá khóa học được yêu thích"
            className="group relative isolate overflow-hidden rounded-[28px] border border-blue-100 bg-gradient-to-br from-blue-100 via-sky-50 to-amber-100 p-6 shadow-sm sm:p-8"
          >
            <div
              aria-hidden="true"
              className="absolute -right-16 -top-20 -z-10 h-72 w-72 rounded-full border-[35px] border-white/50"
            />
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-black tracking-wider text-blue-700">
                VEDU Learning Management System
              </span>
              <span className="grid h-10 w-10 place-items-center rounded-full bg-white text-blue-600 transition group-hover:rotate-45">
                <ArrowUpRight size={20} />
              </span>
            </div>
            <h2 className="mt-5 text-3xl font-black leading-tight text-slate-900 sm:text-4xl">
              Đầu tư vào bạn.
              <br />
              Mở khóa tương lai.
            </h2>
            <p className="mt-3 max-w-xs text-sm leading-6 text-slate-600">
              Từ những kiến thức đầu tiên đến kỹ năng thực hành. Chọn hành trình
              của riêng bạn.
            </p>
            <div className="mt-6 grid grid-cols-[1fr_auto] items-end gap-3">
              <div className="rounded-2xl border border-white bg-white/80 p-4 shadow-sm">
                <div className="mb-3 flex items-center gap-2 text-xs font-bold text-slate-500">
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-blue-100 text-blue-600">
                    <Code2 size={17} />
                  </span>
                  BÀI HỌC MỖI NGÀY
                </div>
                <p className="font-bold text-slate-800">
                  Một kỹ năng mới,
                  <br />
                  nhiều cơ hội hơn.
                </p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-blue-100">
                  <div className="h-full w-3/4 rounded-full bg-blue-500" />
                </div>
              </div>
              <div className="flex flex-col items-center gap-3">
                <span className="grid h-16 w-16 place-items-center rounded-2xl bg-amber-300 text-amber-900 shadow-sm">
                  <GraduationCap size={34} />
                </span>
                <span className="grid h-12 w-12 place-items-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-200">
                  <Play size={20} fill="currentColor" />
                </span>
              </div>
            </div>
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 rounded-2xl border border-slate-100 bg-white p-4 sm:grid-cols-4">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-blue-50 p-2 text-blue-600">
              <BookOpen size={20} />
            </span>
            <div>
              <strong className="block text-lg text-slate-900">
                {courseCount}+
              </strong>
              <span className="text-xs text-slate-500">
                Khóa học để khám phá
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-amber-50 p-2 text-amber-600">
              <Sparkles size={20} />
            </span>
            <div>
              <strong className="block text-lg text-slate-900">
                {topicCount}
              </strong>
              <span className="text-xs text-slate-500">Chủ đề kỹ năng</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-emerald-50 p-2 text-emerald-600">
              <Check size={20} />
            </span>
            <div>
              <strong className="block text-sm text-slate-900">
                Học & thực hành
              </strong>
              <span className="text-xs text-slate-500">
                Kiến thức đi cùng bài tập
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-violet-50 p-2 text-violet-600">
              <GraduationCap size={20} />
            </span>
            <div>
              <strong className="block text-sm text-slate-900">
                Theo dõi tiến bộ
              </strong>
              <span className="text-xs text-slate-500">
                Từng bước, từng bài học
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
