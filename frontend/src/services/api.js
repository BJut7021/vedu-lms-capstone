const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  } catch {
    throw new Error(
      'Không kết nối được backend. Hãy chạy task "Vedu: Backend" trong VS Code.',
    );
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 502 || response.status === 503) {
      throw new Error(
        'Backend chưa chạy ở cổng 3000. Hãy chạy task "Vedu: Backend" trong VS Code.',
      );
    }
    const message = Array.isArray(payload?.message)
      ? payload.message.join(', ')
      : payload?.message;
    throw new Error(message || `API trả về lỗi ${response.status}`);
  }

  return payload;
}

function withToken(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const api = {
  health: () => request('/health'),
  courses: () => request('/courses'),
  course: (courseId) => request(`/courses/${courseId}`),
  enroll: (courseId, token) => request(`/enrollments/me/${courseId}`, {
    method: 'POST',
    headers: withToken(token),
  }),
  login: (credentials) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  }),
  register: (data) => request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  usernameAvailability: (username) => request(`/auth/username-availability/${encodeURIComponent(username)}`),
  forgotPassword: (email, expectedRole) => request('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email, expectedRole }),
  }),
  resetPassword: (data) => request('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  playableQuiz: (quizId) => request(`/quizzes/${quizId}/play`),
  startQuizAttempt: (quizId, token) => request(`/quizzes/${quizId}/attempts`, {
    method: 'POST',
    headers: withToken(token),
  }),
  submitQuizAttempt: (attemptId, answers, token) =>
    request(`/quizzes/attempts/${attemptId}/submit`, {
      method: 'POST',
      headers: withToken(token),
      body: JSON.stringify({ answers }),
    }),
  logLearningEvent: (event, token) => request('/learning/events', {
    method: 'POST',
    headers: withToken(token),
    body: JSON.stringify(event),
  }),
  portalOverview: (token) => request('/portal/overview', {
    headers: withToken(token),
  }),
  recommendationFeedback: (recommendationId, data, token) =>
    request(`/portal/student/recommendations/${recommendationId}/feedback`, {
      method: 'POST',
      headers: withToken(token),
      body: JSON.stringify(data),
    }),
  createTicket: (data, token) => request('/portal/student/tickets', {
    method: 'POST',
    headers: withToken(token),
    body: JSON.stringify(data),
  }),
  createTeacherCourse: (data, token) => request('/portal/teacher/courses', {
    method: 'POST',
    headers: withToken(token),
    body: JSON.stringify(data),
  }),
  createTeacherLesson: (courseId, data, token) =>
    request(`/portal/teacher/courses/${courseId}/lessons`, {
      method: 'POST',
      headers: withToken(token),
      body: JSON.stringify(data),
    }),
  updateTeacherCourseStatus: (courseId, status, token) =>
    request(`/portal/teacher/courses/${courseId}/status`, {
      method: 'PATCH',
      headers: withToken(token),
      body: JSON.stringify({ status }),
    }),
  updateUser: (userId, data, token) => request(`/users/${userId}`, {
    method: 'PATCH',
    headers: withToken(token),
    body: JSON.stringify(data),
  }),
  runDemoMining: (token) => request('/portal/admin/mining-runs/demo', {
    method: 'POST',
    headers: withToken(token),
  }),
};
