import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-blue-100 bg-white text-slate-500">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-7 sm:grid-cols-2 sm:px-6 lg:grid-cols-[2fr_1fr_1fr_1fr] lg:px-8">
        <div>
          <Link to="/" className="text-2xl font-black text-slate-900">
            vedu<span className="text-blue-600">.</span>
          </Link>
          <p className="mt-2 max-w-sm text-sm leading-6">
            Học từng bước, vững từng kỹ năng. Một không gian học tập dành cho sự
            tiến bộ của bạn.
          </p>
        </div>
        <div>
          <h2 className="mb-2 text-sm font-bold text-slate-800">Khám phá</h2>
          <Link
            to="/courses"
            className="block py-1 text-sm hover:text-blue-600"
          >
            Tất cả khóa học
          </Link>
          <Link
            to="/courses?sort=popular"
            className="block py-1 text-sm hover:text-blue-600"
          >
            Khóa học được yêu thích
          </Link>
        </div>
        <div>
          <h2 className="mb-2 text-sm font-bold text-slate-800">Đồng hành</h2>
          <Link
            to="/support"
            className="block py-1 text-sm hover:text-blue-600"
          >
            Trung tâm hỗ trợ
          </Link>
          <Link
            to="/teacher/login"
            className="block py-1 text-sm hover:text-blue-600"
          >
            Cổng giảng viên
          </Link>
          <Link
            to="/admin/login"
            className="block py-1 text-sm hover:text-blue-600"
          >
            Cổng quản trị
          </Link>
        </div>
        <div>
          <h2 className="mb-2 text-sm font-bold text-slate-800">Vedu LMS</h2>
          <p className="text-xs leading-6">
            CNTT-KLCN260 · HUIT
            <br />
            GVHD: ThS. Lê Thị Thùy Lan
            <br />
            Thiện · Thời · Duy
          </p>
        </div>
      </div>
      <div className="border-t border-slate-100 px-4 py-3 text-center text-xs text-slate-400">
        © 2026 Vedu LMS. Cùng bạn xây dựng hành trình học tập.
      </div>
    </footer>
  );
}
