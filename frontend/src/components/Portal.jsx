import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  Award,
  BarChart3,
  BookOpen,
  Bot,
  ChevronRight,
  CircleHelp,
  ClipboardCheck,
  Database,
  FileClock,
  GraduationCap,
  Home,
  LayoutDashboard,
  LibraryBig,
  ListChecks,
  LogOut,
  Menu,
  Plus,
  RefreshCw,
  Route,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { api } from "../services/api";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Operations from "./Operations";
import Brand from "./Brand";
import CourseImage from "./CourseImage";
import Notifications from "./Notifications";
import Avatar from "./Avatar";
import Profile from "./Profile";
import PaymentReview from "./PaymentReview";

const roleLabels = {
  STUDENT: "Học viên",
  TEACHER: "Giảng viên",
  ADMIN: "Quản trị viên",
};

const menus = {
  STUDENT: [
    ["dashboard", "Tổng quan", LayoutDashboard],
    ["courses", "Khóa học của tôi", BookOpen],
    ["learning-path", "Lộ trình gợi ý", Route],
    ["quizzes", "Bài kiểm tra", ClipboardCheck],
    ["orders", "Đơn hàng", ShieldCheck],
    ["certificates", "Chứng chỉ", Award],
    ["support", "Hỗ trợ", CircleHelp],
    ["profile", "Hồ sơ cá nhân", Settings],
    ["security", "Mật khẩu & phiên", ShieldCheck],
    ["discussions", "Hỏi đáp khóa học", CircleHelp],
    ["ticket-chat", "Hội thoại hỗ trợ", CircleHelp],
  ],
  TEACHER: [
    ["dashboard", "Tổng quan", LayoutDashboard],
    ["courses", "Quản lý khóa học", LibraryBig],
    ["builder", "Soạn khóa học", Plus],
    ["quiz-bank", "Ngân hàng quiz", GraduationCap],
    ["learners", "Danh sách học viên", Users],
    ["gradebook", "Sổ điểm", ClipboardCheck],
    ["analytics", "Phân tích học tập", BarChart3],
    ["content", "Tài liệu & video", FileClock],
    ["discussions", "Hỏi đáp khóa học", CircleHelp],
    ["ticket-chat", "Ticket được phân công", CircleHelp],
    ["reports", "Báo cáo & xuất file", BarChart3],
    ["profile", "Hồ sơ cá nhân", Settings],
    ["security", "Mật khẩu & phiên", ShieldCheck],
  ],
  ADMIN: [
    ["dashboard", "Tổng quan hệ thống", LayoutDashboard],
    ["users", "Người dùng & RBAC", Users],
    ["catalog", "Kiểm duyệt nội dung", LibraryBig],
    ["orders", "Đơn hàng & thanh toán", ShieldCheck],
    ["mining", "HUSPM Mining", Database],
    ["recommendations", "Mẫu & khuyến nghị", Bot],
    ["support", "Trung tâm hỗ trợ", CircleHelp],
    ["settings", "Cấu hình & nhật ký", Settings],
    ["assignments", "Phân công giảng viên", Users],
    ["ticket-chat", "Xử lý ticket", CircleHelp],
    ["reports", "Báo cáo & xuất file", BarChart3],
    ["security", "Mật khẩu & phiên", ShieldCheck],
  ],
};

const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat("vi-VN", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(value))
    : "Chưa có";

const number = (value) => Number(value || 0);

function Badge({ children, tone = "slate" }) {
  const tones = {
    green: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    blue: "bg-blue-50 text-blue-700 ring-blue-600/20",
    amber: "bg-amber-50 text-amber-700 ring-amber-600/20",
    red: "bg-red-50 text-red-700 ring-red-600/20",
    violet: "bg-violet-50 text-violet-700 ring-violet-600/20",
    slate: "bg-slate-50 text-slate-700 ring-slate-600/20",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

function Panel({ title, subtitle, action, children, className = "" }) {
  return (
    <section
      className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}
    >
      {(title || action) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="font-extrabold text-slate-900">{title}</h2>
            {subtitle && (
              <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
            )}
          </div>
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

function MetricCard({ label, value, caption, icon: Icon, color = "blue" }) {
  const colors = {
    blue: "bg-blue-600 shadow-blue-600/20",
    violet: "bg-violet-600 shadow-violet-600/20",
    emerald: "bg-emerald-600 shadow-emerald-600/20",
    amber: "bg-amber-500 shadow-amber-500/20",
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {label}
          </p>
          <p className="mt-2 text-3xl font-black text-slate-900">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{caption}</p>
        </div>
        <div className={`rounded-xl p-3 text-white shadow-lg ${colors[color]}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

function Empty({
  title = "Chưa có dữ liệu",
  description = "Dữ liệu sẽ xuất hiện khi bạn hoàn thành thao tác liên quan.",
}) {
  return (
    <div className="grid min-h-40 place-items-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
      <div>
        <FileClock className="mx-auto mb-3 text-slate-400" />
        <p className="font-bold text-slate-700">{title}</p>
        <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>
      </div>
    </div>
  );
}

function ProgressBar({ value }) {
  const safeValue = Math.max(0, Math.min(100, number(value)));
  return (
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-500"
          style={{ width: `${safeValue}%` }}
        />
      </div>
      <span className="w-12 text-right text-xs font-bold text-slate-600">
        {safeValue}%
      </span>
    </div>
  );
}

function TableShell({ headers, children }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
            {headers.map((header) => (
              <th key={header} className="px-3 py-3 font-bold">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
    </div>
  );
}

export default function Portal({
  auth,
  catalog,
  onHome,
  onLogout,
  onOpenCourse,
  onUserUpdated,
}) {
  const role = auth.user.role;
  const roleMenu = useMemo(
    () =>
      auth.user.isGuest
        ? menus[role].filter(([id]) => ["dashboard", "courses"].includes(id))
        : menus[role],
    [auth.user.isGuest, role],
  );
  const location = useLocation();
  const navigate = useNavigate();
  const routePage =
    location.pathname.split("/").filter(Boolean)[1] || "dashboard";
  const activePage = roleMenu.some(([id]) => id === routePage)
    ? routePage
    : "dashboard";
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [courseForm, setCourseForm] = useState({
    name: "",
    description: "",
    topic: "",
    price: 0,
  });
  const [lessonForm, setLessonForm] = useState({
    courseId: "",
    title: "",
    content: "",
    durationSeconds: 600,
  });
  const [ticketForm, setTicketForm] = useState({
    subject: "",
    message: "",
    priority: "NORMAL",
  });

  const loadOverview = useCallback(
    async (quiet = false) => {
      if (!quiet) setLoading(true);
      setError("");
      try {
        setData(await api.portalOverview(auth.accessToken));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [auth.accessToken],
  );

  useEffect(() => {
    let active = true;
    api
      .portalOverview(auth.accessToken)
      .then((overview) => {
        if (active) setData(overview);
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [auth.accessToken]);

  useEffect(() => {
    if (role !== "TEACHER") return;
    const refresh = () => {
      if (document.visibilityState === "visible") loadOverview(true);
    };
    const timer = setInterval(refresh, 15000);
    window.addEventListener("focus", refresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, [role, loadOverview]);

  useEffect(() => {
    if (location.pathname === `/${role.toLowerCase()}`) {
      navigate(`/${role.toLowerCase()}/dashboard`, { replace: true });
    }
  }, [location.pathname, navigate, role, routePage]);

  const activeMenu = useMemo(
    () => roleMenu.find(([id]) => id === activePage) || roleMenu[0],
    [activePage, roleMenu],
  );

  const runAction = async (action, successMessage) => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
      setNotice(successMessage);
      await loadOverview(true);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const selectPage = (page) => {
    navigate(`/${role.toLowerCase()}/${page}`);
    setSidebarOpen(false);
    setNotice("");
  };

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50">
        <div className="text-center">
          <RefreshCw className="mx-auto mb-3 animate-spin text-blue-600" />
          <p className="font-bold text-slate-700">
            Đang tải không gian {roleLabels[role]}...
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50 p-6">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
          <X className="mx-auto text-red-500" />
          <h1 className="mt-3 text-xl font-black">
            Không tải được bảng điều khiển
          </h1>
          <p className="mt-2 text-sm text-slate-600">{error}</p>
          <button
            onClick={() => loadOverview()}
            className="mt-5 rounded-xl bg-blue-600 px-5 py-2.5 font-bold text-white"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 transform flex-col border-r border-slate-800 bg-slate-950 text-slate-100 transition lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex h-20 shrink-0 items-center justify-between border-b border-slate-800 px-6">
          <button
            onClick={onHome}
            className="flex items-center gap-3 text-left"
          >
            <Brand compact dark />
            <span>
              <strong className="block text-lg">Vedu LMS</strong>
              <small className="text-slate-500">Cùng bạn tiến bộ</small>
            </span>
          </button>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
            <X />
          </button>
        </div>
        <div className="mx-4 mt-5 rounded-xl border border-slate-700 bg-slate-900 p-3">
          <div className="flex items-center gap-3">
            <Avatar user={auth.user} />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{auth.user.fullName}</p>
              <p className="text-xs text-blue-300">{roleLabels[role]}</p>
            </div>
          </div>
        </div>
        <nav className="mt-5 flex-1 space-y-1 overflow-y-auto px-3 pb-3">
          {roleMenu.map(([id, label, Icon]) => (
            <button
              key={id}
              onClick={() => selectPage(id)}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${activePage === id ? "bg-blue-600 text-white shadow-md" : "text-slate-300 hover:bg-slate-800 hover:text-white"}`}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="shrink-0 border-t border-slate-800 bg-slate-950 p-4">
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-500 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={18} /> Đăng xuất
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <button
          aria-label="Đóng menu"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/60 lg:hidden"
        />
      )}

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 hover:bg-slate-100 lg:hidden"
            >
              <Menu />
            </button>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                {roleLabels[role]} workspace
              </p>
              <h1 className="text-xl font-black text-slate-900">
                {activeMenu[1]}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onHome}
              className="hidden items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 sm:flex"
            >
              <Home size={16} /> Trang chủ
            </button>
            <button
              onClick={() => loadOverview()}
              className="rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50"
              title="Làm mới dữ liệu"
            >
              <RefreshCw size={17} />
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-7xl p-4 sm:p-8">
          {!auth.user.isGuest && <Notifications token={auth.accessToken} />}
          {auth.user.isGuest && (
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4">
              <div>
                <p className="font-bold text-blue-900">
                  Chào bạn, cùng khám phá Vedu nhé!
                </p>
                <p className="mt-1 text-sm text-blue-700">
                  Học thử tối đa 2 khóa miễn phí, 2 bài đầu mỗi khóa. Khách
                  không thi lấy điểm, nhận chứng nhận, thanh toán, tạo gợi ý cá
                  nhân hay gửi Q&A/ticket. Tiến độ khách không dùng huấn luyện
                  mô hình.
                </p>
              </div>
              <Link
                to="/courses"
                className="rounded-full bg-blue-600 px-4 py-2.5 text-sm font-bold text-white"
              >
                Khám phá khóa học
              </Link>
              <Link
                to="/student/register"
                className="text-sm font-bold text-blue-700"
              >
                Đăng ký để học đầy đủ
              </Link>
            </div>
          )}
          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}
          {notice && (
            <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
              {notice}
            </div>
          )}
          {activePage === "orders" && role === "ADMIN" ? (
            <div className="space-y-6">
              <PaymentReview auth={auth} />
              <details className="rounded-2xl border border-slate-200 bg-white p-4">
                <summary className="cursor-pointer font-bold text-slate-700">
                  Toàn bộ đơn hàng của hệ thống
                </summary>
                <div className="mt-4">
                  {renderAdminPage({
                    activePage,
                    data,
                    catalog,
                    auth,
                    busy,
                    runAction,
                  })}
                </div>
              </details>
            </div>
          ) : activePage === "profile" &&
            !auth.user.isGuest &&
            role !== "ADMIN" ? (
            <Profile auth={auth} onUserUpdated={onUserUpdated} />
          ) : [
              "security",
              "catalog",
              "discussions",
              "ticket-chat",
              "reports",
              "content",
              "assignments",
              "mining",
              "quiz-bank",
              "certificates",
              "learning-path",
            ].includes(activePage) ? (
            <Operations
              key={`${role}-${activePage}`}
              page={activePage}
              auth={auth}
              data={data}
              catalog={catalog}
              onLogout={onLogout}
            />
          ) : (
            <>
              {role === "STUDENT" &&
                renderStudentPage({
                  activePage,
                  data,
                  auth,
                  ticketForm,
                  setTicketForm,
                  busy,
                  runAction,
                  onOpenCourse,
                })}
              {role === "TEACHER" &&
                renderTeacherPage({
                  activePage,
                  data,
                  courseForm,
                  setCourseForm,
                  lessonForm,
                  setLessonForm,
                  busy,
                  runAction,
                })}
              {role === "ADMIN" &&
                renderAdminPage({
                  activePage,
                  data,
                  catalog,
                  auth,
                  busy,
                  runAction,
                })}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function StudentCourseList({ courses, onOpenCourse }) {
  if (!courses.length)
    return (
      <Empty
        title="Bạn chưa ghi danh khóa học"
        description="Quay lại danh mục và chọn một khóa học để bắt đầu."
      />
    );
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {courses.map((course) => (
        <article
          key={course.courseId}
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="flex gap-4 p-5">
            <CourseImage
              course={course}
              className="h-20 w-24 rounded-xl object-cover"
            />
            <div className="min-w-0 flex-1">
              <Badge tone={course.status === "COMPLETED" ? "green" : "blue"}>
                {course.status}
              </Badge>
              <h3 className="mt-2 font-extrabold text-slate-900">
                {course.courseName}
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                {course.completedLessons}/{course.totalLessons} bài đã hoàn
                thành
              </p>
            </div>
          </div>
          <div className="border-t border-slate-100 p-5">
            <ProgressBar value={course.progressPercent} />
            <button
              onClick={() => onOpenCourse({ id: number(course.courseId) })}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
            >
              {course.studyCompleted || course.status === "COMPLETED"
                ? "Ôn tập"
                : number(course.completedLessons) > 0 || course.lastActivityAt
                  ? "Tiếp tục học"
                  : "Bắt đầu học"}{" "}
              <ChevronRight size={16} />
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

function RecommendationList({ recommendations, onFeedback, busy }) {
  if (!recommendations.length)
    return (
      <Empty
        title="Chưa có gợi ý đang hoạt động"
        description="Hoàn thành thêm bài học hoặc quiz để hệ thống sinh lộ trình phù hợp."
      />
    );
  return (
    <div className="space-y-4">
      {recommendations.map((item, index) => (
        <article
          key={item.recommendationId}
          className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-indigo-600 font-black text-white">
                {index + 1}
              </span>
              <div>
                <p className="text-xs font-bold uppercase text-indigo-600">
                  {item.courseName} · {item.sourceType}
                </p>
                <h3 className="mt-1 font-extrabold text-slate-900">
                  {item.lessonTitle}
                </h3>
              </div>
            </div>
            <Badge tone="violet">
              {Math.round(number(item.score) * 100)}% phù hợp
            </Badge>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">{item.reason}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              disabled={busy}
              onClick={() => onFeedback(item.recommendationId, "ACCEPTED")}
              className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white"
            >
              Chấp nhận lộ trình
            </button>
            <button
              disabled={busy}
              onClick={() => onFeedback(item.recommendationId, "IGNORED")}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600"
            >
              Bỏ qua
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

function renderStudentPage({
  activePage,
  data,
  auth,
  ticketForm,
  setTicketForm,
  busy,
  runAction,
  onOpenCourse,
}) {
  const feedback = (id, action) =>
    runAction(
      () =>
        api.recommendationFeedback(
          id,
          { action, rating: action === "ACCEPTED" ? 5 : 3 },
          auth.accessToken,
        ),
      "Đã ghi nhận phản hồi về lộ trình.",
    );

  if (activePage === "dashboard")
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Khóa đang học"
            value={number(data.stats.enrolledCourses)}
            caption="Ghi danh đang hoạt động"
            icon={BookOpen}
          />
          <MetricCard
            label="Bài hoàn thành"
            value={number(data.stats.completedLessons)}
            caption="Tiến độ được lưu ở PostgreSQL"
            icon={ListChecks}
            color="emerald"
          />
          <MetricCard
            label="Lượt làm quiz"
            value={number(data.stats.quizAttempts)}
            caption="Lịch sử làm bài"
            icon={ClipboardCheck}
            color="violet"
          />
          <MetricCard
            label="Điểm trung bình"
            value={`${number(data.stats.averageScore)}/10`}
            caption="Các bài đã nộp"
            icon={Award}
            color="amber"
          />
        </div>
        <div className="grid gap-6 xl:grid-cols-5">
          <Panel
            title="Tiếp tục học"
            subtitle="Khóa học và tiến độ thời gian thực"
            className="xl:col-span-3"
          >
            <StudentCourseList
              courses={data.courses.slice(0, 2)}
              onOpenCourse={onOpenCourse}
            />
          </Panel>
          <Panel
            title="Gợi ý tiếp theo"
            subtitle="Dựa trên mẫu chuỗi hành vi HUSPM"
            className="xl:col-span-2"
          >
            <RecommendationList
              recommendations={data.recommendations.slice(0, 1)}
              onFeedback={feedback}
              busy={busy}
            />
          </Panel>
        </div>
      </div>
    );
  if (activePage === "courses")
    return (
      <Panel
        title="Khóa học của tôi"
        subtitle="Mở khóa học để học bài, ghi nhận sự kiện và làm quiz"
      >
        <StudentCourseList courses={data.courses} onOpenCourse={onOpenCourse} />
      </Panel>
    );
  if (activePage === "learning-path")
    return (
      <Panel
        title="Lộ trình học tập cá nhân hóa"
        subtitle="Bạn có quyền chấp nhận hoặc bỏ qua từng khuyến nghị"
      >
        <RecommendationList
          recommendations={data.recommendations}
          onFeedback={feedback}
          busy={busy}
        />
      </Panel>
    );
  if (activePage === "quizzes")
    return (
      <Panel
        title="Lịch sử bài kiểm tra"
        subtitle="Điểm được backend chấm và lưu trong assessment.quiz_attempts"
      >
        {data.attempts.length ? (
          <TableShell
            headers={["Bài kiểm tra", "Lần", "Điểm", "Trạng thái", "Thời gian"]}
          >
            {data.attempts.map((attempt) => (
              <tr key={attempt.attemptId}>
                <td className="px-3 py-4 font-bold">{attempt.quizTitle}</td>
                <td className="px-3 py-4">#{attempt.attemptNo}</td>
                <td className="px-3 py-4 text-lg font-black text-blue-700">
                  {attempt.score ?? "—"}
                </td>
                <td className="px-3 py-4">
                  <Badge tone={attempt.status === "GRADED" ? "green" : "amber"}>
                    {attempt.status}
                  </Badge>
                </td>
                <td className="px-3 py-4 text-slate-500">
                  {formatDate(attempt.submittedAt || attempt.startedAt)}
                </td>
              </tr>
            ))}
          </TableShell>
        ) : (
          <Empty />
        )}
      </Panel>
    );
  if (activePage === "orders")
    return (
      <Panel
        title="Đơn hàng của tôi"
        subtitle="Theo dõi trạng thái thanh toán và số lần giao dịch"
      >
        {data.orders.length ? (
          <TableShell
            headers={[
              "Mã đơn",
              "Khóa học",
              "Số tiền",
              "Thanh toán",
              "Trạng thái",
            ]}
          >
            {data.orders.map((order) => (
              <tr key={order.orderId}>
                <td className="px-3 py-4 font-bold">#{order.orderId}</td>
                <td className="px-3 py-4">
                  <p>{order.courseName}</p>
                  <Link
                    className="mt-2 inline-block text-xs font-bold text-blue-700"
                    to={
                      order.status === "PAID"
                        ? `/courses/${order.courseId}`
                        : `/checkout/${order.courseId}`
                    }
                  >
                    {order.status === "PAID"
                      ? "Vào khóa học"
                      : "Xem thanh toán / đối soát"}
                  </Link>
                </td>
                <td className="px-3 py-4 font-bold">
                  {number(order.amount).toLocaleString("vi-VN")}{" "}
                  {order.currency}
                </td>
                <td className="px-3 py-4">{order.paymentAttempts} lần</td>
                <td className="px-3 py-4">
                  <Badge tone={order.status === "PAID" ? "green" : "amber"}>
                    {order.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </TableShell>
        ) : (
          <Empty
            title="Chưa có đơn hàng"
            description="Đơn hàng xuất hiện khi bạn chọn mua khóa học có học phí."
          />
        )}
      </Panel>
    );
  if (activePage === "certificates")
    return (
      <Panel
        title="Chứng chỉ của tôi"
        subtitle="Chứng chỉ chỉ được cấp khi enrollment đủ điều kiện"
      >
        {data.certificates.length ? (
          <TableShell
            headers={["Mã chứng chỉ", "Khóa học", "Trạng thái", "Ngày cấp"]}
          >
            {data.certificates.map((cert) => (
              <tr key={cert.certificateId}>
                <td className="px-3 py-4 font-mono font-bold">
                  {cert.certificateCode}
                </td>
                <td className="px-3 py-4">#{cert.courseId}</td>
                <td className="px-3 py-4">
                  <Badge tone="green">{cert.status}</Badge>
                </td>
                <td className="px-3 py-4">{formatDate(cert.issuedAt)}</td>
              </tr>
            ))}
          </TableShell>
        ) : (
          <Empty
            title="Chưa có chứng chỉ"
            description="Hoàn thành toàn bộ khóa học để đủ điều kiện cấp chứng chỉ."
          />
        )}
      </Panel>
    );
  if (activePage === "support")
    return (
      <div className="grid gap-6 xl:grid-cols-5">
        <Panel title="Gửi yêu cầu hỗ trợ" className="xl:col-span-2">
          <form
            className="space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              const ok = await runAction(
                () => api.createTicket(ticketForm, auth.accessToken),
                "Đã gửi yêu cầu hỗ trợ.",
              );
              if (ok)
                setTicketForm({ subject: "", message: "", priority: "NORMAL" });
            }}
          >
            <label className="block text-sm font-bold">
              Chủ đề
              <input
                required
                value={ticketForm.subject}
                onChange={(event) =>
                  setTicketForm({ ...ticketForm, subject: event.target.value })
                }
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Tôi cần hỗ trợ..."
              />
            </label>
            <label className="block text-sm font-bold">
              Mức ưu tiên
              <select
                value={ticketForm.priority}
                onChange={(event) =>
                  setTicketForm({ ...ticketForm, priority: event.target.value })
                }
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal"
              >
                <option>NORMAL</option>
                <option>HIGH</option>
                <option>URGENT</option>
              </select>
            </label>
            <label className="block text-sm font-bold">
              Nội dung
              <textarea
                value={ticketForm.message}
                onChange={(event) =>
                  setTicketForm({ ...ticketForm, message: event.target.value })
                }
                className="mt-1.5 min-h-28 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal"
              />
            </label>
            <button
              disabled={busy}
              className="w-full rounded-xl bg-blue-600 py-2.5 font-bold text-white disabled:opacity-50"
            >
              Gửi ticket
            </button>
          </form>
        </Panel>
        <Panel title="Yêu cầu đã gửi" className="xl:col-span-3">
          {data.tickets.length ? (
            <div className="space-y-3">
              {data.tickets.map((ticket) => (
                <div
                  key={ticket.ticketId}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-4"
                >
                  <div>
                    <p className="font-bold">{ticket.subject}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      #{ticket.ticketId} · {formatDate(ticket.createdAt)}
                    </p>
                  </div>
                  <Badge tone={ticket.status === "OPEN" ? "amber" : "blue"}>
                    {ticket.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <Empty />
          )}
        </Panel>
      </div>
    );
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Panel
        title="Hồ sơ cá nhân"
        subtitle="Thông tin từ access token và tài khoản hiện tại"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase text-slate-500">Họ tên</p>
            <p className="mt-1 font-bold">{auth.user.fullName}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase text-slate-500">Email</p>
            <p className="mt-1 font-bold">{auth.user.email}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase text-slate-500">
              Vai trò
            </p>
            <p className="mt-1 font-bold">{roleLabels[auth.user.role]}</p>
          </div>
          <div className="rounded-xl bg-emerald-50 p-4">
            <p className="text-xs font-bold uppercase text-emerald-600">
              Trạng thái
            </p>
            <p className="mt-1 font-bold text-emerald-700">Đang hoạt động</p>
          </div>
        </div>
      </Panel>
      <Panel
        title="Phiên đăng nhập"
        subtitle="Các session được lưu và có thời hạn trong PostgreSQL"
      >
        {data.sessions.length ? (
          <div className="space-y-3">
            {data.sessions.map((session) => (
              <div
                key={session.sessionId}
                className="rounded-xl border border-slate-100 p-4"
              >
                <div className="flex items-center justify-between">
                  <p className="font-bold">
                    {session.deviceInfo || "Thiết bị không xác định"}
                  </p>
                  <Badge tone={session.revokedAt ? "red" : "green"}>
                    {session.revokedAt ? "REVOKED" : "ACTIVE"}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Tạo lúc {formatDate(session.createdAt)} · hết hạn{" "}
                  {formatDate(session.expiresAt)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <Empty />
        )}
      </Panel>
    </div>
  );
}

function renderTeacherPage({
  activePage,
  data,
  courseForm,
  setCourseForm,
  lessonForm,
  setLessonForm,
  busy,
  runAction,
}) {
  const token = JSON.parse(localStorage.getItem("vedu.auth"))?.accessToken;
  const courseRows = (
    <TableShell
      headers={["Khóa học", "Bài học", "Học viên", "Trạng thái", "Thao tác"]}
    >
      {data.courses.map((course) => (
        <tr key={course.courseId}>
          <td className="px-3 py-4">
            <p className="font-bold">{course.courseName}</p>
            <p className="mt-1 text-xs font-semibold text-blue-700">
              {course.teachingRole === "OWNER"
                ? "Giảng viên chính"
                : "Giảng viên hỗ trợ"}{" "}
              · {course.reviewStatus}
            </p>
            {course.reviewNote && (
              <p className="mt-1 text-xs text-amber-700">
                Kiểm duyệt: {course.reviewNote}
              </p>
            )}
            <p className="mt-1 max-w-xs truncate text-xs text-slate-500">
              {course.description}
            </p>
          </td>
          <td className="px-3 py-4">{course.lessonCount}</td>
          <td className="px-3 py-4">{course.studentCount}</td>
          <td className="px-3 py-4">
            <Badge
              tone={
                course.status === "PUBLISHED"
                  ? "green"
                  : course.status === "DRAFT"
                    ? "amber"
                    : "slate"
              }
            >
              {course.status}
            </Badge>
          </td>
          <td className="px-3 py-4">
            <button
              disabled={busy}
              onClick={() =>
                runAction(
                  () =>
                    api.updateTeacherCourseStatus(
                      course.courseId,
                      course.status === "PUBLISHED" ? "ARCHIVED" : "PUBLISHED",
                      token,
                    ),
                  `Đã cập nhật trạng thái khóa học ${course.courseName}.`,
                )
              }
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold hover:bg-slate-50"
            >
              {course.status === "PUBLISHED" ? "Lưu trữ" : "Gửi duyệt"}
            </button>
          </td>
        </tr>
      ))}
    </TableShell>
  );

  if (activePage === "dashboard")
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Tổng khóa học"
            value={number(data.stats.totalCourses)}
            caption="Bao gồm bản nháp"
            icon={LibraryBig}
          />
          <MetricCard
            label="Đã xuất bản"
            value={number(data.stats.publishedCourses)}
            caption="Đang hiển thị ở danh mục"
            icon={BookOpen}
            color="emerald"
          />
          <MetricCard
            label="Học viên"
            value={number(data.stats.totalStudents)}
            caption="Trên các khóa phụ trách"
            icon={Users}
            color="violet"
          />
          <MetricCard
            label="Bài đã chấm"
            value={number(data.stats.gradedAttempts)}
            caption="Kết quả quiz gần đây"
            icon={ClipboardCheck}
            color="amber"
          />
        </div>
        <Panel title="Hoạt động lớp gần đây">
          {data.learners.length ? (
            <div className="space-y-3">
              {data.learners.slice(0, 5).map((learner) => (
                <div
                  key={`${learner.courseId}-${learner.studentId}`}
                  className="grid items-center gap-3 rounded-xl border border-slate-100 p-4 sm:grid-cols-[1fr_1fr_180px]"
                >
                  <div>
                    <p className="font-bold">{learner.studentName}</p>
                    <p className="text-xs text-slate-500">{learner.email}</p>
                  </div>
                  <p className="text-sm text-slate-600">{learner.courseName}</p>
                  <ProgressBar value={learner.progressPercent} />
                </div>
              ))}
            </div>
          ) : (
            <Empty />
          )}
        </Panel>
      </div>
    );
  if (activePage === "courses")
    return (
      <Panel
        title="Quản lý khóa học"
        subtitle="Thay đổi trạng thái chỉ áp dụng cho khóa học thuộc giảng viên hiện tại"
      >
        {data.courses.length ? courseRows : <Empty />}
      </Panel>
    );
  if (activePage === "builder")
    return (
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel
          title="Tạo khóa học mới"
          subtitle="Khóa mới được lưu ở trạng thái DRAFT"
        >
          <form
            className="space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              const ok = await runAction(
                () => api.createTeacherCourse(courseForm, token),
                "Đã tạo khóa học nháp.",
              );
              if (ok)
                setCourseForm({
                  name: "",
                  description: "",
                  topic: "",
                  price: 0,
                });
            }}
          >
            <label className="block text-sm font-bold">
              Tên khóa học
              <input
                required
                value={courseForm.name}
                onChange={(event) =>
                  setCourseForm({ ...courseForm, name: event.target.value })
                }
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal"
              />
            </label>
            <label className="block text-sm font-bold">
              Chủ đề
              <input
                maxLength={80}
                value={courseForm.topic}
                onChange={(event) =>
                  setCourseForm({ ...courseForm, topic: event.target.value })
                }
                placeholder="Ví dụ: Thiết kế, Ngoại ngữ, Lập trình..."
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal"
              />
            </label>
            <label className="block text-sm font-bold">
              Mô tả
              <textarea
                value={courseForm.description}
                onChange={(event) =>
                  setCourseForm({
                    ...courseForm,
                    description: event.target.value,
                  })
                }
                className="mt-1.5 min-h-28 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal"
              />
            </label>
            <label className="block text-sm font-bold">
              Học phí (VND)
              <input
                min="0"
                type="number"
                value={courseForm.price}
                onChange={(event) =>
                  setCourseForm({ ...courseForm, price: event.target.value })
                }
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal"
              />
            </label>
            <button
              disabled={busy}
              className="w-full rounded-xl bg-blue-600 py-2.5 font-bold text-white"
            >
              Lưu bản nháp
            </button>
          </form>
        </Panel>
        <Panel
          title="Thêm bài học"
          subtitle="Bài mới được tạo ở trạng thái chưa xuất bản"
        >
          <form
            className="space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              const ok = await runAction(
                () =>
                  api.createTeacherLesson(
                    lessonForm.courseId,
                    lessonForm,
                    token,
                  ),
                "Đã thêm bài học vào khóa học.",
              );
              if (ok) setLessonForm({ ...lessonForm, title: "", content: "" });
            }}
          >
            <label className="block text-sm font-bold">
              Khóa học
              <select
                required
                value={lessonForm.courseId}
                onChange={(event) =>
                  setLessonForm({ ...lessonForm, courseId: event.target.value })
                }
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal"
              >
                <option value="">Chọn khóa học</option>
                {data.courses.map((course) => (
                  <option key={course.courseId} value={course.courseId}>
                    {course.courseName}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-bold">
              Tên bài học
              <input
                required
                value={lessonForm.title}
                onChange={(event) =>
                  setLessonForm({ ...lessonForm, title: event.target.value })
                }
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal"
              />
            </label>
            <label className="block text-sm font-bold">
              Nội dung
              <textarea
                value={lessonForm.content}
                onChange={(event) =>
                  setLessonForm({ ...lessonForm, content: event.target.value })
                }
                className="mt-1.5 min-h-24 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal"
              />
            </label>
            <label className="block text-sm font-bold">
              Thời lượng (phút)
              <input
                type="number"
                min="0"
                step="any"
                value={
                  lessonForm.durationSeconds === ""
                    ? ""
                    : Number(lessonForm.durationSeconds) / 60
                }
                onChange={(event) =>
                  setLessonForm({
                    ...lessonForm,
                    durationSeconds:
                      event.target.value === ""
                        ? ""
                        : Math.round(Number(event.target.value) * 60),
                  })
                }
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal"
              />
            </label>
            <button
              disabled={busy}
              className="w-full rounded-xl bg-violet-600 py-2.5 font-bold text-white"
            >
              Thêm bài học
            </button>
          </form>
        </Panel>
      </div>
    );
  if (activePage === "quiz-bank")
    return (
      <Panel
        title="Ngân hàng quiz"
        subtitle="Danh sách quiz thuộc các khóa học do giảng viên phụ trách"
      >
        {data.quizzes.length ? (
          <TableShell
            headers={[
              "Quiz",
              "Khóa học",
              "Số câu",
              "Điểm đạt",
              "Số lần",
              "Trạng thái",
            ]}
          >
            {data.quizzes.map((quiz) => (
              <tr key={quiz.quizId}>
                <td className="px-3 py-4 font-bold">{quiz.title}</td>
                <td className="px-3 py-4">{quiz.courseName}</td>
                <td className="px-3 py-4">{quiz.questionCount}</td>
                <td className="px-3 py-4">{quiz.passingScore}/10</td>
                <td className="px-3 py-4">{quiz.maxAttempts}</td>
                <td className="px-3 py-4">
                  <Badge tone={quiz.isPublished ? "green" : "amber"}>
                    {quiz.isPublished ? "PUBLISHED" : "DRAFT"}
                  </Badge>
                </td>
              </tr>
            ))}
          </TableShell>
        ) : (
          <Empty
            title="Chưa có quiz"
            description="Quiz sẽ xuất hiện sau khi được tạo cho một bài học."
          />
        )}
      </Panel>
    );
  if (activePage === "learners")
    return (
      <Panel
        title="Danh sách học viên"
        subtitle="Tiến độ tổng hợp từ learning.lesson_progress"
      >
        {data.learners.length ? (
          <TableShell
            headers={[
              "Học viên",
              "Khóa học",
              "Tiến độ",
              "Trạng thái",
              "Ghi danh",
            ]}
          >
            {data.learners.map((learner) => (
              <tr key={`${learner.courseId}-${learner.studentId}`}>
                <td className="px-3 py-4">
                  <p className="font-bold">{learner.studentName}</p>
                  <p className="text-xs text-slate-500">{learner.email}</p>
                </td>
                <td className="px-3 py-4">{learner.courseName}</td>
                <td className="px-3 py-4">
                  <ProgressBar value={learner.progressPercent} />
                </td>
                <td className="px-3 py-4">
                  <Badge tone="blue">{learner.status}</Badge>
                </td>
                <td className="px-3 py-4 text-slate-500">
                  {formatDate(learner.enrolledAt)}
                </td>
              </tr>
            ))}
          </TableShell>
        ) : (
          <Empty />
        )}
      </Panel>
    );
  if (activePage === "gradebook")
    return (
      <Panel
        title="Sổ điểm"
        subtitle="Kết quả quiz của học viên trong các khóa phụ trách"
      >
        {data.attempts.length ? (
          <TableShell
            headers={[
              "Học viên",
              "Khóa học",
              "Bài kiểm tra",
              "Điểm",
              "Trạng thái",
            ]}
          >
            {data.attempts.map((attempt) => (
              <tr key={attempt.attemptId}>
                <td className="px-3 py-4 font-bold">{attempt.studentName}</td>
                <td className="px-3 py-4">{attempt.courseName}</td>
                <td className="px-3 py-4">{attempt.quizTitle}</td>
                <td className="px-3 py-4 text-lg font-black text-blue-700">
                  {attempt.score ?? "—"}
                </td>
                <td className="px-3 py-4">
                  <Badge tone="green">{attempt.status}</Badge>
                </td>
              </tr>
            ))}
          </TableShell>
        ) : (
          <Empty />
        )}
      </Panel>
    );
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Panel title="Mức độ hoàn thành theo học viên">
        {data.learners.length ? (
          <div className="space-y-5">
            {data.learners.map((learner) => (
              <div key={`${learner.courseId}-${learner.studentId}`}>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="font-bold">{learner.studentName}</span>
                  <span className="text-slate-500">{learner.courseName}</span>
                </div>
                <ProgressBar value={learner.progressPercent} />
              </div>
            ))}
          </div>
        ) : (
          <Empty />
        )}
      </Panel>
      <Panel title="Tóm tắt hiệu quả">
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl bg-blue-50 p-5">
            <p className="text-sm font-bold text-blue-700">Tỷ lệ xuất bản</p>
            <p className="mt-2 text-3xl font-black text-blue-900">
              {number(data.stats.totalCourses)
                ? Math.round(
                    (number(data.stats.publishedCourses) /
                      number(data.stats.totalCourses)) *
                      100,
                  )
                : 0}
              %
            </p>
          </div>
          <div className="rounded-xl bg-emerald-50 p-5">
            <p className="text-sm font-bold text-emerald-700">
              Điểm đã ghi nhận
            </p>
            <p className="mt-2 text-3xl font-black text-emerald-900">
              {data.attempts.length}
            </p>
          </div>
        </div>
        <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
          Các số liệu lấy trực tiếp từ PostgreSQL. Có thể xuất CSV ở giai đoạn
          tiếp theo; bản demo tập trung vào luồng dữ liệu và phân quyền.
        </p>
      </Panel>
    </div>
  );
}

function renderAdminPage({ activePage, data, catalog, auth, busy, runAction }) {
  if (activePage === "dashboard")
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard
            label="Người dùng"
            value={number(data.stats.totalUsers)}
            caption={`${number(data.stats.activeUsers)} đang hoạt động`}
            icon={Users}
          />
          <MetricCard
            label="Khóa học"
            value={number(data.stats.totalCourses)}
            caption="Không tính dữ liệu đã xóa"
            icon={LibraryBig}
            color="violet"
          />
          <MetricCard
            label="Learning events"
            value={number(data.stats.learningEvents)}
            caption="Nguồn vào cho HUSPM"
            icon={Activity}
            color="emerald"
          />
          <MetricCard
            label="Mining runs"
            value={data.miningRuns.length}
            caption="Lịch sử chạy gần nhất"
            icon={Database}
            color="amber"
          />
          <MetricCard
            label="Ticket mở"
            value={number(data.stats.openTickets)}
            caption="Cần được xử lý"
            icon={CircleHelp}
            color="blue"
          />
        </div>
        <div className="grid gap-6 xl:grid-cols-2">
          <Panel title="Trạng thái pipeline">
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-emerald-50 p-4">
                <span className="font-bold text-emerald-900">
                  PostgreSQL & audit
                </span>
                <Badge tone="green">ONLINE</Badge>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-blue-50 p-4">
                <span className="font-bold text-blue-900">
                  Recommendation store
                </span>
                <Badge tone="blue">READY</Badge>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-amber-50 p-4">
                <span className="font-bold text-amber-900">
                  Python mining service
                </span>
                <Badge tone="blue">
                  {data.miningRuns.some(
                    (r) => r.algorithm === "VEDU-PrefixProjection-HUSPM",
                  )
                    ? "ĐÃ CHẠY THẬT"
                    : "CHƯA HUẤN LUYỆN"}
                </Badge>
              </div>
            </div>
          </Panel>
          <Panel title="Mining run gần nhất">
            {data.miningRuns.length ? (
              <div>
                <p className="text-2xl font-black">
                  {data.miningRuns[0].algorithm}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Dataset: {data.miningRuns[0].datasetVersion}
                </p>
                <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <b className="block text-xl">
                      {data.miningRuns[0].sequenceCount}
                    </b>
                    <small>Chuỗi</small>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <b className="block text-xl">
                      {data.miningRuns[0].eventCount}
                    </b>
                    <small>Sự kiện</small>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <b className="block text-xl">
                      {data.miningRuns[0].patternCount}
                    </b>
                    <small>Mẫu</small>
                  </div>
                </div>
              </div>
            ) : (
              <Empty />
            )}
          </Panel>
        </div>
      </div>
    );
  if (activePage === "users")
    return (
      <Panel
        title="Người dùng & phân quyền"
        subtitle="Khóa tài khoản sẽ thu hồi các session còn hiệu lực"
      >
        {data.users.length ? (
          <TableShell
            headers={[
              "Người dùng",
              "Vai trò",
              "Trạng thái",
              "Ngày tạo",
              "Thao tác",
            ]}
          >
            {data.users.map((user) => (
              <tr key={user.userId}>
                <td className="px-3 py-4">
                  <p className="font-bold">{user.fullName}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </td>
                <td className="px-3 py-4">
                  <Badge
                    tone={
                      user.role === "ADMIN"
                        ? "amber"
                        : user.role === "TEACHER"
                          ? "violet"
                          : "blue"
                    }
                  >
                    {user.role}
                  </Badge>
                </td>
                <td className="px-3 py-4">
                  <Badge tone={user.isActive ? "green" : "red"}>
                    {user.isActive ? "ACTIVE" : "LOCKED"}
                  </Badge>
                </td>
                <td className="px-3 py-4 text-slate-500">
                  {formatDate(user.createdAt)}
                </td>
                <td className="px-3 py-4">
                  <button
                    disabled={
                      busy || number(user.userId) === number(auth.user.userId)
                    }
                    onClick={() =>
                      runAction(
                        () =>
                          api.updateUser(
                            user.userId,
                            { isActive: !user.isActive },
                            auth.accessToken,
                          ),
                        `Đã ${user.isActive ? "khóa" : "mở khóa"} tài khoản ${user.email}.`,
                      )
                    }
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {user.isActive ? "Khóa" : "Mở khóa"}
                  </button>
                </td>
              </tr>
            ))}
          </TableShell>
        ) : (
          <Empty />
        )}
      </Panel>
    );
  if (activePage === "catalog")
    return (
      <Panel
        title="Kiểm duyệt danh mục"
        subtitle="Danh sách khóa đang công khai trên trang chủ"
      >
        {catalog.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {catalog.map((course) => (
              <article
                key={course.id}
                className="overflow-hidden rounded-xl border border-slate-200"
              >
                <img
                  src={course.image || "/favicon.svg"}
                  alt=""
                  className="h-32 w-full bg-blue-50 object-cover"
                />
                <div className="p-4">
                  <Badge tone="green">PUBLISHED</Badge>
                  <h3 className="mt-2 font-bold">{course.title}</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {course.instructor} · {course.lessons} bài học
                  </p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <Empty />
        )}
      </Panel>
    );
  if (activePage === "orders")
    return (
      <Panel
        title="Đơn hàng & thanh toán"
        subtitle="Đối soát trạng thái đơn và số lần thanh toán"
      >
        {data.orders.length ? (
          <TableShell
            headers={[
              "Đơn hàng",
              "Học viên",
              "Khóa học",
              "Số tiền",
              "Giao dịch",
              "Trạng thái",
            ]}
          >
            {data.orders.map((order) => (
              <tr key={order.orderId}>
                <td className="px-3 py-4 font-bold">#{order.orderId}</td>
                <td className="px-3 py-4">{order.studentName}</td>
                <td className="px-3 py-4">{order.courseName}</td>
                <td className="px-3 py-4 font-bold">
                  {number(order.amount).toLocaleString("vi-VN")}{" "}
                  {order.currency}
                </td>
                <td className="px-3 py-4">{order.paymentAttempts}</td>
                <td className="px-3 py-4">
                  <Badge tone={order.status === "PAID" ? "green" : "amber"}>
                    {order.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </TableShell>
        ) : (
          <Empty
            title="Chưa phát sinh đơn hàng"
            description="Dữ liệu demo hiện dùng các khóa học miễn phí."
          />
        )}
      </Panel>
    );
  if (activePage === "mining")
    return (
      <div className="space-y-6">
        <Panel
          title="Điều phối HUSPM"
          subtitle="Nút dưới tạo một mining run mô phỏng có truy vết; không chạy thuật toán Python thật"
          action={
            <button
              disabled={busy}
              onClick={() =>
                runAction(
                  () => api.runDemoMining(auth.accessToken),
                  "Đã hoàn thành mining run mô phỏng và lưu metadata.",
                )
              }
              className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-black text-white disabled:opacity-50"
            >
              <Sparkles size={17} /> Chạy mô phỏng
            </button>
          }
        >
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            <strong>Ranh giới bản demo:</strong> metadata, dataset version, tham
            số và audit được lưu thật trong PostgreSQL. Dịch vụ khai phá HUSPM
            độc lập trong Python là phần mở rộng, chưa được giả lập thành kết
            quả nghiên cứu thật.
          </div>
        </Panel>
        <Panel title="Lịch sử mining run">
          {data.miningRuns.length ? (
            <TableShell
              headers={[
                "Run",
                "Khóa học",
                "Dataset",
                "Chuỗi / Event",
                "Runtime",
                "Trạng thái",
              ]}
            >
              {data.miningRuns.map((run) => (
                <tr key={run.runId}>
                  <td className="px-3 py-4 font-bold">
                    #{run.runId} · {run.algorithm}
                  </td>
                  <td className="px-3 py-4">{run.courseName}</td>
                  <td className="px-3 py-4 font-mono text-xs">
                    {run.datasetVersion}
                  </td>
                  <td className="px-3 py-4">
                    {run.sequenceCount} / {run.eventCount}
                  </td>
                  <td className="px-3 py-4">
                    {run.runtimeSeconds ?? "—"} giây
                  </td>
                  <td className="px-3 py-4">
                    <Badge
                      tone={run.status === "SUCCEEDED" ? "green" : "amber"}
                    >
                      {run.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </TableShell>
          ) : (
            <Empty />
          )}
        </Panel>
      </div>
    );
  if (activePage === "recommendations")
    return (
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel
          title="High-utility patterns"
          subtitle="Các mẫu đã được đánh dấu active"
        >
          {data.patterns.length ? (
            <div className="space-y-3">
              {data.patterns.map((pattern) => (
                <div
                  key={pattern.patternId}
                  className="rounded-xl border border-slate-100 p-4"
                >
                  <div className="flex items-center justify-between">
                    <code className="font-bold text-indigo-700">
                      {pattern.signature}
                    </code>
                    <Badge tone="violet">Utility {pattern.utility}</Badge>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Support {Math.round(number(pattern.support) * 100)}% ·{" "}
                    {pattern.courseName}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <Empty />
          )}
        </Panel>
        <Panel title="Giám sát khuyến nghị">
          <div className="rounded-xl bg-gradient-to-br from-indigo-600 to-blue-700 p-6 text-white">
            <Bot size={30} />
            <p className="mt-4 text-3xl font-black">{data.patterns.length}</p>
            <p className="text-sm text-blue-100">
              mẫu khả dụng cho engine gợi ý
            </p>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            Phản hồi ACCEPTED/IGNORED của học viên được lưu riêng, giúp đánh giá
            chất lượng khuyến nghị mà không ghi đè dữ liệu gốc.
          </p>
        </Panel>
      </div>
    );
  if (activePage === "support")
    return (
      <Panel
        title="Trung tâm hỗ trợ"
        subtitle="Ticket của học viên cần được theo dõi"
      >
        {data.tickets.length ? (
          <TableShell
            headers={[
              "Mã",
              "Học viên",
              "Chủ đề",
              "Ưu tiên",
              "Trạng thái",
              "Ngày tạo",
            ]}
          >
            {data.tickets.map((ticket) => (
              <tr key={ticket.ticketId}>
                <td className="px-3 py-4 font-bold">#{ticket.ticketId}</td>
                <td className="px-3 py-4">{ticket.studentName}</td>
                <td className="px-3 py-4 font-bold">{ticket.subject}</td>
                <td className="px-3 py-4">
                  <Badge tone={ticket.priority === "URGENT" ? "red" : "amber"}>
                    {ticket.priority}
                  </Badge>
                </td>
                <td className="px-3 py-4">
                  <Badge tone="blue">{ticket.status}</Badge>
                </td>
                <td className="px-3 py-4 text-slate-500">
                  {formatDate(ticket.createdAt)}
                </td>
              </tr>
            ))}
          </TableShell>
        ) : (
          <Empty />
        )}
      </Panel>
    );
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Panel
        title="Cấu hình hệ thống"
        subtitle="Các tham số mặc định trong schema system_config"
      >
        <div className="space-y-3">
          {data.settings.map((setting) => (
            <div
              key={setting.settingId}
              className="rounded-xl border border-slate-100 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <code className="text-sm font-bold text-blue-700">
                  {setting.key}
                </code>
                <Badge>
                  {typeof setting.value === "object"
                    ? JSON.stringify(setting.value)
                    : String(setting.value)}
                </Badge>
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                {setting.description}
              </p>
            </div>
          ))}
        </div>
      </Panel>
      <Panel
        title="Nhật ký kiểm toán"
        subtitle="Các thay đổi dữ liệu nghiệp vụ quan trọng"
      >
        {data.audits.length ? (
          <div className="space-y-3">
            {data.audits.map((audit) => (
              <div
                key={audit.auditId}
                className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-4"
              >
                <div>
                  <p className="font-bold">
                    {audit.schemaName}.{audit.tableName}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Bản ghi #{audit.recordId} · {formatDate(audit.createdAt)}
                  </p>
                </div>
                <Badge
                  tone={
                    audit.action === "DELETE"
                      ? "red"
                      : audit.action === "UPDATE"
                        ? "amber"
                        : "green"
                  }
                >
                  {audit.action}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <Empty />
        )}
      </Panel>
    </div>
  );
}
