import { useEffect, useRef, useState } from 'react';
import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import Header from './components/Header';
import Banner from './components/Banner';
import FeaturedCourses from './components/FeaturedCourses';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import CourseDetail from './components/CourseDetail';
import Classroom from './components/Classroom';
import QuizView from './components/QuizView';
import Portal from './components/Portal';
import { api } from './services/api';

const savedAuth = () => {
  try { return JSON.parse(localStorage.getItem('vedu.auth')); }
  catch { return null; }
};

const rolePath = { STUDENT: '/student', TEACHER: '/teacher', ADMIN: '/admin' };

function CoursePage({ auth, header, onError }) {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  useEffect(() => { api.course(courseId).then(setCourse).catch((error) => onError(error.message)); }, [courseId, onError]);
  if (!course) return <div className="grid min-h-screen place-items-center font-bold text-blue-700">Đang tải khóa học...</div>;
  const requireStudent = () => {
    if (auth?.user?.role === 'STUDENT') return true;
    navigate('/student/login');
    return false;
  };
  return <>{header}<CourseDetail course={course} onBack={() => navigate('/')} onStartLearning={(lessonId) => { if (requireStudent()) navigate(`/learn/${course.id}/${lessonId}`); }} onStartQuiz={(quizId) => { if (requireStudent()) navigate(`/quiz/${course.id}/${quizId}`); }} /><Footer /></>;
}

function ClassroomPage({ auth, onEvent }) {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  useEffect(() => {
    if (auth?.user?.role !== 'STUDENT') return;
    Promise.all([api.course(courseId), api.enroll(courseId, auth.accessToken)])
      .then(([data]) => setCourse(data));
  }, [auth, courseId]);
  if (auth?.user?.role !== 'STUDENT') return <Navigate to="/student/login" replace />;
  if (!course) return <div className="grid min-h-screen place-items-center font-bold text-blue-700">Đang mở phòng học...</div>;
  return <Classroom course={course} activeLessonId={Number(lessonId)} onBack={() => navigate(`/courses/${courseId}`)} onOpenQuiz={(quizId) => navigate(`/quiz/${courseId}/${quizId}`)} onLogEvent={(event) => onEvent(course, event)} />;
}

function QuizPage({ auth }) {
  const { courseId, quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [attemptId, setAttemptId] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    if (auth?.user?.role !== 'STUDENT') return;
    Promise.all([api.playableQuiz(quizId), api.startQuizAttempt(quizId, auth.accessToken)])
      .then(([quizData, attempt]) => { setQuiz(quizData); setAttemptId(attempt.attemptId); })
      .catch((reason) => setError(reason.message));
  }, [auth, quizId]);
  if (auth?.user?.role !== 'STUDENT') return <Navigate to="/student/login" replace />;
  if (error) return <div className="grid min-h-screen place-items-center p-8 text-center font-bold text-red-600">{error}</div>;
  if (!quiz || !attemptId) return <div className="grid min-h-screen place-items-center font-bold text-blue-700">Đang chuẩn bị bài kiểm tra...</div>;
  return <QuizView quizData={quiz} onBack={() => navigate(`/courses/${courseId}`)} onSubmit={(answers) => api.submitQuizAttempt(attemptId, answers, auth.accessToken)} />;
}

function RoleAuthRoute({ role, tab, auth, onAuthenticated }) {
  const navigate = useNavigate();
  if (auth?.user?.role === role) return <Navigate to={rolePath[role]} replace />;
  return <div className="min-h-screen bg-slate-100"><AuthModal isOpen onClose={() => navigate('/')} defaultTab={tab} expectedRole={role} allowRegister={role === 'STUDENT'} allowForgot={role !== 'ADMIN'} onAuthenticated={onAuthenticated} /></div>;
}

function ProtectedPortal({ role, auth, courses, onLogout }) {
  const navigate = useNavigate();
  if (auth?.user?.role !== role) return <Navigate to={`/${role.toLowerCase()}/login`} replace />;
  return <Portal auth={auth} catalog={courses} onHome={() => navigate('/')} onLogout={onLogout} onOpenCourse={(course) => navigate(`/courses/${course.id}`)} />;
}

export default function App() {
  const navigate = useNavigate();
  const [auth, setAuth] = useState(savedAuth);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const learningSessionId = useRef(crypto.randomUUID());

  useEffect(() => { api.courses().then(setCourses).catch((reason) => setError(reason.message)).finally(() => setLoading(false)); }, []);

  const handleAuthenticated = (result) => {
    const nextAuth = { accessToken: result.accessToken, refreshToken: result.refreshToken, user: result.user };
    localStorage.setItem('vedu.auth', JSON.stringify(nextAuth));
    setAuth(nextAuth);
    navigate(rolePath[result.user.role]);
  };
  const handleLogout = () => { localStorage.removeItem('vedu.auth'); setAuth(null); navigate('/'); };
  const handleLearningEvent = async (course, { action, lessonId, durationSeconds = 0, metadata = {} }) => api.logLearningEvent({ eventUuid: crypto.randomUUID(), learningSessionId: learningSessionId.current, courseId: course.id, lessonId, action, durationSeconds, completionStatus: action === 'COMPLETE_LESSON' ? 'COMPLETED' : 'IN_PROGRESS', metadata: { client: 'vedu-web-demo', ...metadata } }, auth.accessToken);

  const header = <Header user={auth?.user} onLogout={handleLogout} onDashboard={() => navigate(rolePath[auth.user.role])} onHome={() => navigate('/')} onOpenAuth={(tab) => navigate(`/student/${tab}`)} onRoleLogin={(role) => navigate(`/${role.toLowerCase()}/login`)} />;
  if (loading) return <div className="grid min-h-screen place-items-center font-semibold text-blue-700">Đang kết nối Vedu API...</div>;

  return <Routes>
    <Route path="/" element={<div className="min-h-screen bg-white text-gray-800">{header}{error && <div className="bg-amber-50 px-4 py-2 text-center text-sm font-semibold text-amber-800">{error}</div>}<main><Banner onOpenAuth={(tab) => navigate(`/student/${tab}`)} /><FeaturedCourses courses={courses} onSelectCourse={(course) => navigate(`/courses/${course.id}`)} /></main><Footer /></div>} />
    <Route path="/student/login" element={<RoleAuthRoute role="STUDENT" tab="login" auth={auth} onAuthenticated={handleAuthenticated} />} />
    <Route path="/student/register" element={<RoleAuthRoute role="STUDENT" tab="register" auth={auth} onAuthenticated={handleAuthenticated} />} />
    <Route path="/teacher/login" element={<RoleAuthRoute role="TEACHER" tab="login" auth={auth} onAuthenticated={handleAuthenticated} />} />
    <Route path="/admin/login" element={<RoleAuthRoute role="ADMIN" tab="login" auth={auth} onAuthenticated={handleAuthenticated} />} />
    <Route path="/student" element={<ProtectedPortal role="STUDENT" auth={auth} courses={courses} onLogout={handleLogout} />} />
    <Route path="/student/:page" element={<ProtectedPortal role="STUDENT" auth={auth} courses={courses} onLogout={handleLogout} />} />
    <Route path="/teacher" element={<ProtectedPortal role="TEACHER" auth={auth} courses={courses} onLogout={handleLogout} />} />
    <Route path="/teacher/:page" element={<ProtectedPortal role="TEACHER" auth={auth} courses={courses} onLogout={handleLogout} />} />
    <Route path="/admin" element={<ProtectedPortal role="ADMIN" auth={auth} courses={courses} onLogout={handleLogout} />} />
    <Route path="/admin/:page" element={<ProtectedPortal role="ADMIN" auth={auth} courses={courses} onLogout={handleLogout} />} />
    <Route path="/courses/:courseId" element={<CoursePage auth={auth} header={header} onError={setError} />} />
    <Route path="/learn/:courseId/:lessonId" element={<ClassroomPage auth={auth} onEvent={handleLearningEvent} />} />
    <Route path="/quiz/:courseId/:quizId" element={<QuizPage auth={auth} />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>;
}
