import { useEffect, useRef, useState } from "react";
import Brand from "./Brand";
import Avatar from "./Avatar";
import CourseSearch from "./CourseSearch";
import { Link, useSearchParams } from "react-router-dom";
import { Compass, ChevronDown, Menu, X, BookOpen } from "lucide-react";

export default function Header({
  onOpenAuth,
  onRoleLogin,
  user,
  onLogout,
  onDashboard,
  onHome,
  topics = [],
  onRefreshCatalog,
}) {
  const [params] = useSearchParams();
  const [menuOpen, setMenuOpen] = useState(false);
  const [topicsOpen, setTopicsOpen] = useState(false);
  const accountMenu = useRef(null);
  useEffect(() => {
    const outside = (event) => {
      if (accountMenu.current && !accountMenu.current.contains(event.target))
        accountMenu.current.open = false;
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, []);
  const closeMenus = () => {
    setMenuOpen(false);
    setTopicsOpen(false);
    if (accountMenu.current) accountMenu.current.open = false;
  };
  const pathLink =
    user?.role === "STUDENT" && !user.isGuest
      ? "/student/learning-path"
      : "/student/login?next=learning-path";
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
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-3 lg:gap-3 sm:px-6 lg:px-8">
        <button
          onClick={onHome}
          className="flex shrink-0 items-center gap-1.5 text-left sm:gap-2.5"
          aria-label="Vedu - trang chủ"
        >
          <Brand />
        </button>
        <nav
          aria-label="Điều hướng chính"
          className="hidden shrink-0 items-center gap-4 whitespace-nowrap text-sm font-semibold text-slate-600 lg:flex"
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
          <Link
            to={pathLink}
            onClick={closeMenus}
            className="flex items-center gap-1.5 text-blue-700"
          >
            <Compass size={17} />
            Lộ trình gợi ý
          </Link>
          <Link to="/support" className="hover:text-blue-600">
            Hỗ trợ
          </Link>
        </nav>
        <Link
          to={pathLink}
          onClick={closeMenus}
          aria-label="Sinh lộ trình gợi ý"
          className="ml-auto flex shrink-0 items-center gap-1 rounded-full bg-blue-50 p-2 text-sm font-bold text-blue-700 lg:hidden"
        >
          <Compass size={20} />
          <span className="hidden sm:inline">Lộ trình</span>
        </Link>
        <div className="hidden min-w-[130px] max-w-[330px] flex-1 md:block">
          <CourseSearch
            key={params.get("q") || "desktop"}
            onNavigate={closeMenus}
            onRefresh={onRefreshCatalog}
          />
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          {user ? (
            <details
              ref={accountMenu}
              className="group relative"
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  event.currentTarget.open = false;
                  event.currentTarget.querySelector("summary")?.focus();
                }
              }}
            >
              <summary
                aria-label={`Menu tài khoản ${user.fullName}`}
                title={user.fullName}
                className="flex cursor-pointer list-none items-center gap-2 rounded-full p-1.5 text-sm font-semibold text-slate-800 marker:content-none hover:bg-slate-50 [&::-webkit-details-marker]:hidden"
              >
                <Avatar user={user} className="h-9 w-9" />
                <span className="max-w-16 truncate sm:max-w-32">
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
                {!user.isGuest &&
                  ["STUDENT", "TEACHER"].includes(user.role) && (
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
                  onClick={(event) => {
                    event.currentTarget.closest("details").open = false;
                    closeMenus();
                    onDashboard();
                  }}
                  className="block w-full rounded-xl px-3 py-2.5 text-left text-sm hover:bg-blue-50"
                >
                  {user.role === "STUDENT"
                    ? "Không gian học tập"
                    : "Bảng điều khiển"}
                </button>
                <button
                  onClick={(event) => {
                    event.currentTarget.closest("details").open = false;
                    closeMenus();
                    onLogout();
                  }}
                  className="block w-full rounded-xl px-3 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  Đăng xuất
                </button>
              </div>
            </details>
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
        <CourseSearch
          key={params.get("q") || "mobile"}
          mobile
          onNavigate={closeMenus}
          onRefresh={onRefreshCatalog}
        />
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
