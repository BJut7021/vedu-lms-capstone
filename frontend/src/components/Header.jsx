import { useState } from "react";
import Brand from "./Brand";
import Avatar from "./Avatar";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Search, ChevronDown, Menu, X, BookOpen } from "lucide-react";

export default function Header({
  onOpenAuth,
  onRoleLogin,
  user,
  onLogout,
  onDashboard,
  onHome,
  topics = [],
  classroom = false,
  onRefreshCatalog,
}) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [query, setQuery] = useState(params.get("q") || "");
  const [menuOpen, setMenuOpen] = useState(false);
  const [topicsOpen, setTopicsOpen] = useState(false);
  const search = (event) => {
    event.preventDefault();
    setMenuOpen(false);
    navigate(
      `/courses?${new URLSearchParams(query.trim() ? { q: query.trim() } : {})}`,
    );
  };
  const closeMenus = () => {
    setMenuOpen(false);
    setTopicsOpen(false);
  };
  return (
    <header className="sticky top-0 z-40 border-b border-blue-100/70 bg-white/95 backdrop-blur-xl">
      <div className="border-b border-slate-100 bg-slate-50">
        <div className="mx-auto flex max-w-7xl items-center justify-end gap-3 px-4 py-2 text-xs sm:justify-between sm:px-6 lg:px-8">
          <span className="hidden whitespace-nowrap text-slate-500 sm:inline">
            VEDU Learning Management System
          </span>
          <div className="flex shrink-0 items-center gap-4 font-semibold text-slate-600">
            <Link
              to="/teacher/login"
              onClick={closeMenus}
              className="hover:text-blue-600"
            >
              Cổng giảng viên
            </Link>
            <Link
              to="/admin/login"
              onClick={closeMenus}
              className="hover:text-blue-600"
            >
              Cổng quản trị
            </Link>
          </div>
        </div>
      </div>
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-3 sm:gap-5 sm:px-6 lg:px-8">
        <button
          onClick={onHome}
          className="flex shrink-0 items-center gap-1.5 text-left sm:gap-2.5"
          aria-label="Vedu - trang chủ"
        >
          <Brand />
        </button>
        <nav
          aria-label="Điều hướng chính"
          className="hidden shrink-0 items-center gap-5 whitespace-nowrap text-sm font-semibold text-slate-600 lg:flex"
        >
          <Link
            onClick={closeMenus}
            to="/courses"
            className="hover:text-blue-600"
          >
            Khóa học
          </Link>
          <div className="relative">
            <button
              onClick={() => {
                setTopicsOpen(!topicsOpen);
                onRefreshCatalog?.();
              }}
              className="flex items-center gap-1 hover:text-blue-600"
              aria-expanded={topicsOpen}
            >
              Chủ đề
              <ChevronDown size={15} />
            </button>
            {topicsOpen && (
              <div className="absolute left-0 top-9 w-64 rounded-2xl border border-blue-100 bg-white p-2 shadow-xl">
                <Link
                  to="/courses"
                  onClick={closeMenus}
                  className="block rounded-xl px-3 py-2.5 hover:bg-blue-50"
                >
                  Tất cả chủ đề
                </Link>
                {topics.map((topic) => (
                  <Link
                    key={topic}
                    to={`/courses?${new URLSearchParams({ topic })}`}
                    onClick={closeMenus}
                    className="block rounded-xl px-3 py-2.5 hover:bg-blue-50"
                  >
                    {topic}
                  </Link>
                ))}
              </div>
            )}
          </div>
          <Link to="/support" className="hover:text-blue-600">
            Hỗ trợ
          </Link>
        </nav>
        <form
          role="search"
          onSubmit={search}
          className="relative hidden min-w-[160px] flex-1 md:block"
        >
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={onRefreshCatalog}
            aria-label="Tìm khóa học, chủ đề hoặc giảng viên"
            placeholder="Bạn muốn học gì hôm nay?"
            className="w-full rounded-full border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-16 text-sm outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
          />
          <button className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white px-2.5 py-1.5 text-xs font-bold text-blue-600">
            Tìm
          </button>
        </form>
        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          {user && classroom ? (
            <details className="group relative">
              <summary
                aria-label={`Menu tài khoản ${user.fullName}`}
                className="flex cursor-pointer list-none items-center gap-2 rounded-full p-1.5 text-sm font-semibold text-slate-800 marker:content-none hover:bg-slate-50 [&::-webkit-details-marker]:hidden"
              >
                <Avatar user={user} className="h-9 w-9" />
                <span className="hidden max-w-32 truncate sm:block">
                  {user.fullName}
                </span>
                <ChevronDown
                  size={15}
                  className="text-slate-400 transition group-open:rotate-180"
                />
              </summary>
              <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-2xl border border-slate-100 bg-white p-2 shadow-xl">
                <p className="truncate border-b border-slate-100 px-3 py-2 text-xs text-slate-500">
                  {user.username}
                </p>
                {!user.isGuest && (
                  <Link
                    to={`/${user.role.toLowerCase()}/profile`}
                    className="block rounded-xl px-3 py-2.5 text-sm hover:bg-blue-50"
                    onClick={(event) => {
                      event.currentTarget.closest("details").open = false;
                    }}
                  >
                    Hồ sơ & ảnh đại diện
                  </Link>
                )}
                <button
                  onClick={onDashboard}
                  className="block w-full rounded-xl px-3 py-2.5 text-left text-sm hover:bg-blue-50"
                >
                  Không gian học tập
                </button>
                <button
                  onClick={onLogout}
                  className="block w-full rounded-xl px-3 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  Đăng xuất
                </button>
              </div>
            </details>
          ) : user ? (
            <>
              <button
                onClick={onDashboard}
                aria-label="Mở không gian học tập"
                className="flex items-center gap-2 rounded-full bg-blue-50 px-3 py-2.5 text-sm font-bold text-blue-700"
              >
                <Avatar user={user} className="h-7 w-7" />
                <span className="hidden xl:block">Không gian học tập</span>
              </button>
              <button
                onClick={onLogout}
                className="hidden px-2 text-sm font-semibold text-slate-600 sm:block"
              >
                Đăng xuất
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onOpenAuth("login")}
                className="whitespace-nowrap px-1 text-xs font-semibold text-slate-600 hover:text-blue-600 sm:px-2 sm:text-sm"
              >
                Đăng nhập
              </button>
              <button
                onClick={() => onOpenAuth("register")}
                className="whitespace-nowrap rounded-full bg-blue-600 px-3 py-2.5 text-xs font-bold text-white hover:bg-blue-700 sm:px-4 sm:text-sm"
              >
                Đăng ký
              </button>
            </>
          )}
          <button
            aria-label={menuOpen ? "Đóng điều hướng" : "Mở điều hướng"}
            aria-expanded={menuOpen}
            onClick={() => {
              setMenuOpen(!menuOpen);
              onRefreshCatalog?.();
            }}
            className="rounded-lg p-2 text-slate-600 lg:hidden"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 pb-3 md:hidden">
        <form
          role="search"
          onSubmit={search}
          className="flex gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2"
        >
          <Search size={18} className="my-auto shrink-0 text-slate-400" />
          <input
            aria-label="Tìm khóa học trên điện thoại"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={onRefreshCatalog}
            placeholder="Tìm khóa học, giảng viên..."
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
          <button className="px-2 text-sm font-bold text-blue-600">Tìm</button>
        </form>
      </div>
      {menuOpen && (
        <nav
          aria-label="Điều hướng di động"
          className="border-t border-blue-50 bg-white px-4 py-3 lg:hidden"
        >
          <Link
            onClick={closeMenus}
            to="/courses"
            className="flex items-center gap-2 rounded-xl px-3 py-2.5 font-bold text-blue-700"
          >
            <BookOpen size={18} />
            Tất cả khóa học
          </Link>
          <div className="grid grid-cols-2 gap-1">
            {topics.map((topic) => (
              <Link
                key={topic}
                to={`/courses?${new URLSearchParams({ topic })}`}
                onClick={closeMenus}
                className="rounded-xl px-3 py-2.5 text-sm text-slate-600 hover:bg-blue-50"
              >
                {topic}
              </Link>
            ))}
          </div>
          <Link
            onClick={closeMenus}
            to="/support"
            className="block px-3 py-2.5 text-sm font-semibold"
          >
            Hỗ trợ học viên
          </Link>
          {user ? (
            <button
              onClick={onLogout}
              className="px-3 py-2.5 text-sm text-slate-600"
            >
              Đăng xuất
            </button>
          ) : (
            <button
              onClick={() => {
                closeMenus();
                onRoleLogin("TEACHER");
              }}
              className="px-3 py-2.5 text-sm text-slate-600"
            >
              Cổng giảng viên
            </button>
          )}
        </nav>
      )}
    </header>
  );
}
