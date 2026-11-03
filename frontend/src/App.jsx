import { useCallback, useEffect, useRef, useState } from "react";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import Header from "./components/Header";
import Banner from "./components/HomeBanner";
import FeaturedCourses from "./components/FeaturedCourses";
import HomeSideRails from "./components/HomeSideRails";
import Footer from "./components/Footer";
import AuthModal from "./components/AuthModal";
import CourseDetail from "./components/CourseDetail";
import Classroom from "./components/Classroom";
import QuizView from "./components/QuizView";
import Portal from "./components/Portal";
import CourseCatalog from "./components/CourseCatalog";
import PublicSupport from "./components/PublicSupport";
import { Checkout, VerifyCertificate } from "./components/Checkout";
import { api } from "./services/api";

const savedAuth = () => {
  try {
    return JSON.parse(localStorage.getItem("vedu.auth"));
  } catch {
    return null;
  }
};

const rolePath = { STUDENT: "/student", TEACHER: "/teacher", ADMIN: "/admin" };
const loginDestination = (role, search) =>
  role === "STUDENT" &&
  new URLSearchParams(search).get("next") === "learning-path"
    ? "/student/learning-path"
    : rolePath[role];

function CoursePage({ auth, header }) {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [error, setError] = useState("");
  const [study, setStudy] = useState({ key: "", data: null, error: "" });
  const studyKey = `${courseId}:${auth?.accessToken || "public"}`;
  useEffect(() => {
    if (auth?.user?.role !== "STUDENT") return;
    let active = true;
    api
      .platform(`/courses/${courseId}/study-state`, auth.accessToken)
      .then((data) => {
        if (active) setStudy({ key: studyKey, data, error: "" });
      })
      .catch((reason) => {
        if (active)
          setStudy({ key: studyKey, data: null, error: reason.message });
      });
    return () => {
      active = false;
    };
  }, [courseId, auth?.accessToken, auth?.user?.role, studyKey]);
  useEffect(() => {
    let active = true;
    api
      .course(courseId)
      .then((data) => {
        if (active) setCourse(data);
      })
      .catch((reason) => {
        if (active) setError(reason.message);
      });
    return () => {
      active = false;
    };
  }, [courseId]);
  if (error)
    return (
      <>
        {header}
        <div
          role="alert"
          className="grid min-h-[50vh] place-items-center p-8 text-center"
        >
          <div>
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => navigate("/courses")}
              className="mt-4 rounded-xl bg-blue-600 px-5 py-2.5 text-white"
            >
              Quay lại khóa học
            </button>
          </div>
        </div>
        <Footer />
      </>
    );
  if (!course)
    return (
      <div className="grid min-h-screen place-items-center font-bold text-blue-700">
        Đang tải khóa học...
      </div>
    );
  const requireStudent = () => {
    if (auth?.user?.role === "STUDENT") return true;
    navigate("/student/login");
    return false;
  };
  return (
    <>
      {header}
      <CourseDetail
        course={course}
        studyState={study.key === studyKey ? study.data : null}
        studyLoading={auth?.user?.role === "STUDENT" && study.key !== studyKey}
        studyError={study.key === studyKey ? study.error : ""}
        onBack={() => navigate("/")}
        onStartLearning={(lessonId) => {
          if (requireStudent()) {
            api
              .enroll(course.id, auth.accessToken)
              .then(() =>
                api.platform(`/checkout/${course.id}`, auth.accessToken),
              )
              .then((s) =>
                navigate(
                  s.paid
                    ? `/learn/${course.id}/${lessonId}`
                    : `/checkout/${course.id}`,
                ),
              )
              .catch((e) => setError(e.message));
          }
        }}
        onStartQuiz={(quizId) => {
          if (requireStudent()) {
            api
              .enroll(course.id, auth.accessToken)
              .then(() =>
                api.platform(`/checkout/${course.id}`, auth.accessToken),
              )
              .then((s) =>
                navigate(
                  s.paid
                    ? `/quiz/${course.id}/${quizId}`
                    : `/checkout/${course.id}`,
                ),
              )
              .catch((e) => setError(e.message));
          }
        }}
      />
      <Footer />
    </>
  );
}

function ClassroomPage({ auth, onEvent, header }) {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    if (auth?.user?.role !== "STUDENT") return;
    api
      .enroll(courseId, auth.accessToken)
      .then(() => api.classroom(courseId, auth.accessToken))
      .then((data) => setCourse(data))
      .catch((reason) => setError(reason.message));
  }, [auth, courseId]);
  if (auth?.user?.role !== "STUDENT")
    return <Navigate to="/student/login" replace />;
  if (error)
    return (
      <div
        role="alert"
        className="grid min-h-screen place-items-center p-8 text-center"
      >
        <div>
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => navigate("/courses")}
            className="mt-4 rounded-xl bg-blue-600 px-5 py-2.5 text-white"
          >
            Quay lại khóa học
          </button>
        </div>
      </div>
    );
  if (!course)
    return (
      <div className="grid min-h-screen place-items-center font-bold text-blue-700">
        Đang mở phòng học...
      </div>
    );
  return (
    <Classroom
      header={header}
      course={course}
      token={auth.accessToken}
      isGuest={auth.user.isGuest}
      activeLessonId={Number(lessonId)}
      onBack={() => navigate(`/courses/${courseId}`)}
      onOpenQuiz={(quizId) => navigate(`/quiz/${courseId}/${quizId}`)}
      onLogEvent={(event) => onEvent(course, event)}
    />
  );
}

function QuizPage({ auth }) {
  const { courseId, quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [attemptId, setAttemptId] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    if (auth?.user?.role !== "STUDENT") return;
    api
      .enroll(courseId, auth.accessToken)
      .then(() =>
        Promise.all([
          api.playableQuiz(quizId, auth.accessToken),
          api.startQuizAttempt(quizId, auth.accessToken),
        ]),
      )
      .then(([quizData, attempt]) => {
        setQuiz({
          ...quizData,
          deadline: attempt.deadline,
          serverTime: attempt.serverTime,
          savedAnswers: attempt.answers,
        });
        setAttemptId(attempt.attemptId);
      })
      .catch((reason) => setError(reason.message));
  }, [auth, quizId, courseId]);
  if (auth?.user?.role !== "STUDENT")
    return <Navigate to="/student/login" replace />;
  if (error)
    return (
      <div className="grid min-h-screen place-items-center p-8 text-center font-bold text-red-600">
        {error}
      </div>
    );
  if (!quiz || !attemptId)
    return (
      <div className="grid min-h-screen place-items-center font-bold text-blue-700">
        Đang chuẩn bị bài kiểm tra...
      </div>
    );
  return (
    <QuizView
      quizData={quiz}
      onBack={() => navigate(`/courses/${courseId}`)}
      onSubmit={(answers) =>
        api.submitQuizAttempt(attemptId, answers, auth.accessToken)
      }
      onSaveDraft={(answers) =>
        api.platform(
          `/attempts/${attemptId}/draft`,
          auth.accessToken,
          { answers },
          "PATCH",
        )
      }
    />
  );
}

function RoleAuthRoute({ role, tab, auth, onAuthenticated }) {
  const navigate = useNavigate();
  const location = useLocation();
  if (auth?.user?.role === role && !auth.user.isGuest)
    return <Navigate to={loginDestination(role, location.search)} replace />;
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-amber-50">
      <AuthModal
        key={`${role}-${tab}`}
        isOpen
        onClose={() => navigate("/")}
        defaultTab={tab}
        expectedRole={role}
        allowRegister={role === "STUDENT"}
        allowForgot={role !== "ADMIN"}
        onAuthenticated={onAuthenticated}
      />
    </div>
  );
}

function ProtectedPortal({ role, auth, courses, onLogout }) {
  const navigate = useNavigate();
  if (auth?.user?.role !== role)
    return <Navigate to={`/${role.toLowerCase()}/login`} replace />;
  return (
    <Portal
      auth={auth}
      catalog={courses}
      onHome={() => navigate("/")}
      onLogout={onLogout}
      onOpenCourse={(course) => navigate(`/courses/${course.id}`)}
      onUserUpdated={(user) =>
        window.dispatchEvent(
          new CustomEvent("vedu:profile-updated", { detail: user }),
        )
      }
    />
  );
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [auth, setAuth] = useState(savedAuth);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const learningSessionId = useRef(crypto.randomUUID());
  useEffect(() => {
    const updated = (event) =>
      setAuth((previous) => {
        if (
          !previous ||
          Number(previous.user.userId) !== Number(event.detail.userId)
        )
          return previous;
        const next = {
          ...previous,
          user: { ...previous.user, ...event.detail },
        };
        localStorage.setItem("vedu.auth", JSON.stringify(next));
        return next;
      });
    window.addEventListener("vedu:profile-updated", updated);
    return () => window.removeEventListener("vedu:profile-updated", updated);
  }, []);
  useEffect(() => {
    if (!auth?.accessToken) return;
    let active = true;
    api
      .me(auth.accessToken)
      .then((user) => {
        if (active)
          window.dispatchEvent(
            new CustomEvent("vedu:profile-updated", { detail: user }),
          );
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [auth?.accessToken]);
  useEffect(() => {
    const expired = () => {
      localStorage.removeItem("vedu.auth");
      setAuth(null);
      navigate(`/${auth?.user?.role?.toLowerCase() || "student"}/login`, {
        replace: true,
      });
    };
    window.addEventListener("vedu:session-expired", expired);
    return () => window.removeEventListener("vedu:session-expired", expired);
  }, [navigate, auth?.user?.role]);

  const refreshCatalog = useCallback(
    () =>
      api
        .courses()
        .then((data) => {
          setCourses(data);
          setError("");
        })
        .catch((reason) => setError(reason.message)),
    [],
  );
  useEffect(() => {
    refreshCatalog().finally(() => setLoading(false));
    const timer = setInterval(refreshCatalog, 30000);
    window.addEventListener("focus", refreshCatalog);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", refreshCatalog);
    };
  }, [refreshCatalog]);
  const topics = [
    ...new Set(courses.map((course) => course.topic || "Tổng hợp")),
  ].sort((a, b) => a.localeCompare(b, "vi"));

  const handleAuthenticated = (result) => {
    const nextAuth = {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      sessionId: result.sessionId,
      user: result.user,
    };
    localStorage.setItem("vedu.auth", JSON.stringify(nextAuth));
    setAuth(nextAuth);
    navigate(result.user.isGuest ? rolePath[result.user.role] : loginDestination(result.user.role, location.search));
  };
  const handleLogout = async () => {
    const refreshToken = auth?.refreshToken;
    localStorage.removeItem("vedu.auth");
    setAuth(null);
    navigate("/");
    if (refreshToken) {
      try {
        await api.logout(refreshToken);
      } catch {
        setError(
          "Đã thoát trên trình duyệt. Không thể thu hồi phiên trên máy chủ, vui lòng kiểm tra kết nối.",
        );
      }
    }
  };
  const handleLearningEvent = async (
    course,
    { action, lessonId, durationSeconds = 0, metadata = {} },
  ) =>
    api.logLearningEvent(
      {
        eventUuid: crypto.randomUUID(),
        learningSessionId: learningSessionId.current,
        courseId: course.id,
        lessonId,
        action,
        durationSeconds,
        completionStatus:
          action === "COMPLETE_LESSON" ? "COMPLETED" : "IN_PROGRESS",
        metadata: { client: "vedu-web-demo", ...metadata },
      },
      auth.accessToken,
    );

  const header = (
    <Header
      key={`${location.pathname}-${location.search}`}
      topics={topics}
      classroom={location.pathname.startsWith("/learn/")}
      onRefreshCatalog={refreshCatalog}
      user={auth?.user}
      onLogout={handleLogout}
      onDashboard={() => navigate(rolePath[auth.user.role])}
      onHome={() => navigate("/")}
      onOpenAuth={(tab) => navigate(`/student/${tab}`)}
      onRoleLogin={(role) => navigate(`/${role.toLowerCase()}/login`)}
    />
  );
  if (loading)
    return (
      <div className="grid min-h-screen place-items-center font-semibold text-blue-700">
        Đang kết nối Vedu API...
      </div>
    );

  return (
    <Routes>
      <Route path="/checkout/:courseId" element={<Checkout auth={auth} />} />
      <Route path="/verify/:code" element={<VerifyCertificate />} />
      <Route
        path="/"
        element={
          <div className="home-page min-h-screen bg-white text-gray-800">
            {header}
            <HomeSideRails />
            {error && (
              <div className="bg-amber-50 px-4 py-2 text-center text-sm font-semibold text-amber-800">
                {error}
              </div>
            )}
            <main>
              <Banner
                courseCount={courses.length}
                topicCount={topics.length}
                onOpenAuth={(tab) => navigate(`/student/${tab}`)}
              />
              <FeaturedCourses
                courses={courses}
                onSelectCourse={(course) => navigate(`/courses/${course.id}`)}
              />
            </main>
            <Footer />
          </div>
        }
      />
      <Route
        path="/courses"
        element={
          <>
            {header}
            <CourseCatalog topics={topics} />
            <Footer />
          </>
        }
      />
      <Route
        path="/support"
        element={
          <>
            {header}
            <PublicSupport user={auth?.user} />
            <Footer />
          </>
        }
      />
      <Route
        path="/student/login"
        element={
          <RoleAuthRoute
            role="STUDENT"
            tab="login"
            auth={auth}
            onAuthenticated={handleAuthenticated}
          />
        }
      />
      <Route
        path="/student/register"
        element={
          <RoleAuthRoute
            role="STUDENT"
            tab="register"
            auth={auth}
            onAuthenticated={handleAuthenticated}
          />
        }
      />
      <Route
        path="/teacher/login"
        element={
          <RoleAuthRoute
            role="TEACHER"
            tab="login"
            auth={auth}
            onAuthenticated={handleAuthenticated}
          />
        }
      />
      <Route
        path="/admin/login"
        element={
          <RoleAuthRoute
            role="ADMIN"
            tab="login"
            auth={auth}
            onAuthenticated={handleAuthenticated}
          />
        }
      />
      <Route
        path="/student"
        element={
          <ProtectedPortal
            role="STUDENT"
            auth={auth}
            courses={courses}
            onLogout={handleLogout}
          />
        }
      />
      <Route
        path="/student/:page"
        element={
          <ProtectedPortal
            role="STUDENT"
            auth={auth}
            courses={courses}
            onLogout={handleLogout}
          />
        }
      />
      <Route
        path="/teacher"
        element={
          <ProtectedPortal
            role="TEACHER"
            auth={auth}
            courses={courses}
            onLogout={handleLogout}
          />
        }
      />
      <Route
        path="/teacher/:page"
        element={
          <ProtectedPortal
            role="TEACHER"
            auth={auth}
            courses={courses}
            onLogout={handleLogout}
          />
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedPortal
            role="ADMIN"
            auth={auth}
            courses={courses}
            onLogout={handleLogout}
          />
        }
      />
      <Route
        path="/admin/:page"
        element={
          <ProtectedPortal
            role="ADMIN"
            auth={auth}
            courses={courses}
            onLogout={handleLogout}
          />
        }
      />
      <Route
        path="/courses/:courseId"
        element={
          <CoursePage key={location.pathname} auth={auth} header={header} />
        }
      />
      <Route
        path="/learn/:courseId/:lessonId"
        element={
          <ClassroomPage
            auth={auth}
            onEvent={handleLearningEvent}
            header={header}
          />
        }
      />
      <Route
        path="/quiz/:courseId/:quizId"
        element={<QuizPage auth={auth} />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
