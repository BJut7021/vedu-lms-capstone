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
import CourseAssignments from "./components/CourseAssignments";
import FinalExamResult from "./components/FinalExamResult";
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

const validQuizId = (id) => /^[1-9]\d*$/.test(String(id ?? ''));

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
          if (!validQuizId(quizId)) {
            setError('Bài kiểm tra chưa được công bố hoặc chưa có mã hợp lệ.');
            return;
          }
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
      onOpenQuiz={(quizId) => {
        if (!validQuizId(quizId)) {
          setError('Bài kiểm tra chưa được công bố hoặc chưa có mã hợp lệ.');
          return;
        }
        navigate(`/quiz/${courseId}/${quizId}`);
      }}
      onLogEvent={(event) => onEvent(course, event)}
      onRefreshCourse={async () => {
  const updated = await api.classroom(
    courseId,
    auth.accessToken,
  );
  setCourse(updated);
}}
    />
  );
}


export function SubmittedFinalExamReview({ attemptId, token, showImage }) {
  const [review, setReview] = useState(null);
  const [reviewError, setReviewError] = useState('');
  const [imageUrl, setImageUrl] = useState(null);
  const [imageError, setImageError] = useState('');
  useEffect(() => {
    if (!attemptId || !token) return;
    let alive = true;
    api.platform(`/final-essays/attempts/${attemptId}/review`, token)
      .then((v) => { if (alive) setReview(v); })
      .catch((err) => { if (alive) setReviewError(err.message || 'Không xem lại được bài thi'); });
    return () => { alive = false; };
  }, [attemptId, token]);
  useEffect(() => {
    if (!attemptId || !token || !showImage) return;
    let alive = true;
    let objectUrl = null;
    api.essayImage(attemptId, token)
      .then((url) => { objectUrl = url; if (alive) setImageUrl(url); else URL.revokeObjectURL(url); })
      .catch((err) => { if (alive) setImageError(err.message || 'Không tải được ảnh tự luận'); });
    return () => { alive = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [attemptId, token, showImage]);
  return (
    <div className="space-y-5 border-t border-slate-200 pt-5">
      <h2 className="text-lg font-bold">Xem lại trắc nghiệm đã nộp</h2>
      {reviewError && <p role="alert" className="text-sm text-red-700">{reviewError}</p>}
      {!review && !reviewError && <p className="text-sm text-slate-500">Đang tải đáp án đã nộp...</p>}
      {review?.questions?.map((q, i) => (
        <div key={q.questionId} className="space-y-3 rounded-xl border border-slate-200 p-4">
          <div className="flex items-start justify-between gap-3">
            <strong>Câu {i + 1}. {q.text}</strong>
            <span className={q.correct ? 'shrink-0 font-bold text-emerald-700' : 'shrink-0 font-bold text-red-700'}>
              {q.correct ? '✓ Đúng' : '✕ Sai'}
            </span>
          </div>
          {q.options.map((option) => {
            const selected = q.selectedIds.includes(option.id);
            const correct = q.correctIds.includes(option.id);
            return <div key={option.id} className={`rounded-lg border px-3 py-2 text-sm ${correct ? 'border-emerald-300 bg-emerald-50' : selected ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}>
              {option.text} {selected && <b> — Bạn đã chọn</b>} {correct && <b> — Đáp án đúng</b>}
            </div>;
          })}
          {!q.selectedIds.length && <p className="text-xs text-amber-700">Bạn chưa trả lời câu này.</p>}
        </div>
      ))}
      {showImage && <div className="space-y-3 border-t border-slate-200 pt-5">
        <h2 className="text-lg font-bold">Ảnh tự luận đã nộp</h2>
        {imageError && <p role="alert" className="text-sm text-red-700">{imageError}</p>}
        {imageUrl ? <a href={imageUrl} target="_blank" rel="noopener noreferrer" className="block text-blue-700 underline">
          <img src={imageUrl} alt="Bài tự luận của bạn đã nộp" className="max-h-[720px] w-full rounded-xl border object-contain" />
          Xem ảnh kích thước đầy đủ
        </a> : !imageError && <p className="text-sm text-slate-500">Đang tải ảnh bài làm...</p>}
      </div>}
    </div>
  );
}

function QuizPage(props) {
  const { courseId, quizId } = useParams();
  return <QuizAttemptPage key={`${courseId}:${quizId}:${props.auth?.user?.id}`} {...props} />;
}

function QuizAttemptPage({ auth }) {
  const { courseId, quizId } = useParams();
  const navigate = useNavigate();
  const [essayConfig,setEssayConfig] = useState(null);
  const [essayResult,setEssayResult] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [attemptId, setAttemptId] = useState(null);
  const [finalMode, setFinalMode] = useState(null);
  const [reviewOnly, setReviewOnly] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [error, setError] = useState("");
  useEffect(() => {
    if (auth?.user?.role !== "STUDENT") return;
    if (!validQuizId(quizId)) return;
    let alive = true;
    api
      .enroll(courseId, auth.accessToken)
      .then(() =>
        api.playableQuiz(quizId, auth.accessToken).then(async (quizData) => {
          if (Number(quizData.courseId) !== Number(courseId)) throw new Error("Bài kiểm tra không thuộc khóa học này.");
          return [quizData, await api.startQuizAttempt(quizId, auth.accessToken)];
        }),
      )
      .then(([quizData, attempt]) => {
        if (!alive) return;
        setQuiz({
          ...quizData,
          deadline: attempt.deadline,
          serverTime: attempt.serverTime,
          savedAnswers: attempt.answers,
        });
        setAttemptId(attempt.attemptId);
        setFinalMode(attempt.finalMode);
        setReviewOnly(Boolean(attempt.reviewOnly));
        if (attempt.finalMode === "MCQ_ESSAY") {
          api.essayPrompt(quizId,auth.accessToken).then((value) => { if (alive) setEssayConfig(value); }).catch((e) => { if (alive) setError(e.message); });
        }
        if (attempt.reviewOnly)
          api.essayResult(attempt.attemptId,auth.accessToken).then((value) => { if (alive) setEssayResult(value); }).catch(e=>{ if (alive) setReviewError(e.message); });
      })
      .catch((reason) => { if (alive) setError(reason.message); });
    return () => { alive = false; };
  }, [auth, quizId, courseId]);
  if (auth?.user?.role !== "STUDENT")
    return <Navigate to="/student/login" replace />;
  if (error || !validQuizId(quizId))
    return (
      <div className="grid min-h-screen place-items-center p-8 text-center font-bold text-red-600">
        <div className="space-y-4">
          <p>{error || "Mã bài kiểm tra không hợp lệ."}</p>
          <button className="text-blue-700 underline" onClick={() => navigate(`/courses/${courseId}`)}>Về trang khóa học</button>
        </div>
      </div>
    );
  if (!quiz || !attemptId)
    return (
      <div className="grid min-h-screen place-items-center font-bold text-blue-700">
        Đang chuẩn bị bài kiểm tra...
      </div>
    );
  if (reviewOnly) {
    const refreshResult = async () => {
      try {
        setReviewError('');
        const refreshed = await api.essayResult(attemptId, auth.accessToken);
        setEssayResult(refreshed);
      } catch(e) { setReviewError(e.message); }
    };
    return <FinalExamResult
      courseId={courseId}
      token={auth.accessToken}
      attemptId={attemptId}
      finalMode={finalMode}
      essayResult={essayResult}
      error={reviewError}
      onRefresh={refreshResult}
    />;
  }
  return (

<QuizView
  quizData={quiz}
  essayConfig={essayConfig}
  essayResult={essayResult}
  finalPractical={finalMode !== "MCQ_ONLY" && finalMode ? <CourseAssignments courseId={courseId} token={auth.accessToken} attemptId={attemptId} /> : null}
  onEssayUpload={file=>api.essayUpload(attemptId,file,auth.accessToken)}
  onRefreshEssay={()=>api.essayResult(attemptId,auth.accessToken)}
  onBack={() => navigate(`/courses/${courseId}`)}
  onContinue={async () => {
    try {
      const state = await api.platform(
        `/courses/${courseId}/study-state`,
        auth.accessToken,
      );

      if (
        state?.state !== "COMPLETED" &&
        Number(state?.lessonId) > 0
      ) {
        navigate(`/learn/${courseId}/${state.lessonId}`);
      } else {
        navigate(`/courses/${courseId}`);
      }
    } catch (error) {
      console.error("Không tải được tiến độ học tập:", error);
      navigate(`/courses/${courseId}`);
    }
  }}

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
