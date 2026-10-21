import { Link } from "react-router-dom";
import { BookOpen, CircleHelp, ShieldCheck } from "lucide-react";

export default function PublicSupport({ user }) {
  return (
    <main className="bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <p className="text-xs font-bold uppercase tracking-widest text-blue-600">
          Luôn đồng hành cùng bạn
        </p>
        <h1 className="mt-2 text-3xl font-black text-slate-900">
          Bạn cần hỗ trợ điều gì?
        </h1>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            [
              BookOpen,
              "Bắt đầu học",
              "Chọn một khóa học, đăng nhập và mở phòng học để bắt đầu.",
            ],
            [
              ShieldCheck,
              "Tài khoản",
              "Tạo tài khoản để lưu tiến độ. Quên mật khẩu? Nhận PIN qua email cá nhân.",
            ],
            [
              CircleHelp,
              "Gửi yêu cầu",
              "Mở mục Hỗ trợ trong không gian học viên để gửi câu hỏi và theo dõi trạng thái.",
            ],
          ].map(([Icon, title, text]) => (
            <section
              key={title}
              className="rounded-2xl border border-slate-100 bg-white p-5"
            >
              <Icon className="text-blue-600" />
              <h2 className="mt-3 font-bold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>
            </section>
          ))}
        </div>
        <div className="mt-6 rounded-2xl bg-blue-50 p-6">
          <h2 className="font-bold text-blue-900">Liên hệ bộ phận hỗ trợ</h2>
          <p className="mt-2 text-sm text-blue-700">
            Gửi yêu cầu kèm mô tả vấn đề để Vedu hỗ trợ bạn.
          </p>
          <Link
            to={
              user?.role === "STUDENT" ? "/student/support" : "/student/login"
            }
            className="mt-4 inline-block rounded-full bg-blue-600 px-5 py-2.5 text-sm font-bold text-white"
          >
            {user?.role === "STUDENT"
              ? "Gửi yêu cầu hỗ trợ"
              : "Đăng nhập học viên"}
          </Link>
        </div>
      </div>
    </main>
  );
}
