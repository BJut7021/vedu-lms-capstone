import { Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

export default function Banner({ onOpenAuth }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/50 via-white to-white py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100/80 text-blue-700 text-xs font-semibold">
              <Sparkles size={14} />
              <span>Nền tảng học trực tuyến Vedu LMS</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight">
              Lộ trình học tập thông minh <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                Cá nhân hóa theo năng lực
              </span>
            </h1>

            <p className="text-base sm:text-lg text-gray-600 max-w-xl mx-auto lg:mx-0">
              Hệ thống tự động khai phá chuỗi hành vi học tập và gợi ý bài giảng tối ưu, giúp học viên tiến bộ nhanh hơn và lấp đầy lỗ hổng kiến thức.
            </p>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
              <button 
                onClick={() => onOpenAuth('register')}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 flex items-center gap-2 transition"
              >
                <span>Bắt đầu học ngay</span>
                <ArrowRight size={18} />
              </button>
              <a 
                href="#courses"
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-xl transition"
              >
                Khám phá khóa học
              </a>
            </div>

            <div className="flex items-center justify-center lg:justify-start gap-6 pt-4 text-xs text-gray-500 font-medium">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="text-emerald-500" size={16} />
                <span>Theo dõi tiến trình thời gian thực</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Sparkles className="text-indigo-500" size={16} />
                <span>Gợi ý chuỗi bài học thông minh</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 relative">
            <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-3xl p-1 shadow-2xl">
              <div className="bg-white rounded-[22px] p-6 space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Mô phỏng khuyến nghị</span>
                  <span className="px-2 py-0.5 text-xs bg-emerald-100 text-emerald-700 font-bold rounded">AI Active</span>
                </div>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                    <p className="text-xs text-blue-600 font-semibold">Bài học vừa hoàn thành</p>
                    <p className="text-sm font-bold text-gray-800">Cấu trúc dữ liệu cây Prefix-Tree</p>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                    <p className="text-xs text-amber-600 font-semibold">Gợi ý tối ưu kế tiếp</p>
                    <p className="text-sm font-bold text-gray-800">Thuật toán khai phá PrefixSpan</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
