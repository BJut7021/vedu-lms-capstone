import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  MessageCircle,
  CheckCircle2,
} from "lucide-react";

const benefits = [
  {
    icon: BookOpen,
    title: "Học từ kiến thức đến thực hành",
    text: "Kết hợp video, tài liệu và bài tập để áp dụng ngay điều vừa học.",
  },
  {
    icon: MessageCircle,
    title: "Trao đổi khi cần hỗ trợ",
    text: "Gửi câu hỏi trong khóa học và nhận phản hồi từ giảng viên.",
  },
  {
    icon: CheckCircle2,
    title: "Nhìn thấy sự tiến bộ",
    text: "Tiếp tục bài đang học, làm quiz và theo dõi kết quả của riêng bạn.",
  },
];

export default function LearningExperience() {
  return (
    <section
      aria-labelledby="learning-experience-heading"
      className="grid overflow-hidden rounded-[24px] border border-blue-100 bg-white lg:grid-cols-[0.95fr_1.05fr]"
    >
      <figure className="relative min-h-64 bg-slate-100 sm:min-h-80 lg:min-h-full">
        <img
          src="/images/learning/teacher-guidance.webp"
          alt="Giảng viên tươi cười hướng dẫn bài học với laptop trong lớp"
          width="1000"
          height="668"
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover object-[60%_45%]"
        />
        <figcaption className="absolute bottom-4 left-4 rounded-full bg-white/95 px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm">
          Cùng học hỏi, cùng tiến bộ
        </figcaption>
      </figure>
      <div className="p-5 sm:p-8 lg:p-9">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.13em] text-blue-600">
          Không gian học tập của bạn
        </p>
        <h2
          id="learning-experience-heading"
          className="home-balanced max-w-[23ch] text-[26px] font-extrabold leading-[1.25] tracking-tight text-slate-900 sm:text-[30px]"
        >
          Học chủ động, luôn có người đồng hành.
        </h2>
        <div className="mt-6 space-y-5">
          {benefits.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex gap-3">
              <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600">
                <Icon size={18} />
              </span>
              <div className="min-w-0">
                <h3 className="home-balanced text-sm font-bold leading-6 text-slate-800 sm:text-[15px]">
                  {title}
                </h3>
                <p className="home-copy mt-0.5 max-w-[48ch] text-sm leading-6 text-slate-500">
                  {text}
                </p>
              </div>
            </div>
          ))}
        </div>
        <Link
          to="/courses"
          className="mt-6 inline-flex items-center gap-2 whitespace-nowrap text-sm font-bold text-blue-600 hover:text-blue-800"
        >
          Tìm khóa học phù hợp <ArrowRight size={17} />
        </Link>
      </div>
    </section>
  );
}
