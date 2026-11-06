const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "/api").replace(
  /\/$/,
  "",
);

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
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
    if (response.status === 401 && options.headers?.Authorization)
      window.dispatchEvent(new Event("vedu:session-expired"));
    if (
      (response.status === 502 || response.status === 503) &&
      !payload?.message
    ) {
      throw new Error(
        'Backend chưa chạy ở cổng 3000. Hãy chạy task "Vedu: Backend" trong VS Code.',
      );
    }
    const message = Array.isArray(payload?.message)
      ? payload.message.join(", ")
      : payload?.message;
    throw new Error(message || `API trả về lỗi ${response.status}`);
  }

  return payload;
}

function withToken(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const api = {
  async saveCourseAssignment(id, token, form) {
    const response = await fetch(`${API_BASE_URL}/platform/assignments/${id}/versions`, {
      method: "POST", headers: withToken(token), body: form,
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Không lưu được bài nộp");
    return result;
  },
  async downloadCourseAssignment(id, token, name) {
    const response = await fetch(`${API_BASE_URL}/platform/assignment-versions/${id}/file`, { headers: withToken(token) });
    if (!response.ok) throw new Error("Không tải được tệp bài nộp");
    const url = URL.createObjectURL(await response.blob());
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },
  me: (token) => request("/users/me", { headers: withToken(token) }),
  health: () => request("/health"),

  systemHealth: (token) =>
  request("/system-health", {
    headers: withToken(token),
  }),

  courses: (filters = {}) =>
    request(`/courses?${new URLSearchParams(filters)}`),
  courseSuggestions: (q, signal) =>
    request(`/courses/suggestions?${new URLSearchParams({ q })}`, { signal }),
  course: (courseId) => request(`/courses/${courseId}`),
  enroll: (courseId, token) =>
    request(`/enrollments/me/${courseId}`, {
      method: "POST",
      headers: withToken(token),
    }),
  login: (credentials) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    }),
  register: (data) =>
    request("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  guestLogin: () =>
    request("/auth/guest", {
      method: "POST",
      body: JSON.stringify({ expectedRole: "STUDENT" }),
    }),
  logout: (refreshToken) =>
    request("/auth/revoke", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    }),
  usernameAvailability: (username) =>
    request(`/auth/username-availability/${encodeURIComponent(username)}`),
  forgotPassword: (email, expectedRole) =>
    request("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email, expectedRole }),
    }),
  resetPassword: (data) =>
    request("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  essayPrompt: (quizId,token) => request(`/platform/final-essays/quizzes/${quizId}`,{headers:withToken(token)}),
  essayResult: (attemptId,token) => request(`/platform/final-essays/attempts/${attemptId}/result`,{headers:withToken(token)}),
  essayUpload: async (attemptId,file,token) => {
    const form=new FormData();form.append('file',file);
    const response=await fetch(`${API_BASE_URL}/platform/final-essays/attempts/${attemptId}/image`,{method:'POST',headers:withToken(token),body:form});
    const data=await response.json().catch(()=>({}));
    if(!response.ok) throw new Error(data.message||'Không tải được ảnh');
    return data;
  },
  essayImage: async (attemptId,token) => {
    const response=await fetch(`${API_BASE_URL}/platform/final-essays/attempts/${attemptId}/image`,{headers:withToken(token)});
    if(!response.ok) throw new Error('Không tải được ảnh bài tự luận');
    return URL.createObjectURL(await response.blob());
  },
  playableQuiz: (quizId, token) =>
    request(`/quizzes/${quizId}/play`, { headers: withToken(token) }),
  classroom: (courseId, token) =>
    request(`/platform/courses/${courseId}/classroom`, {
      headers: withToken(token),
    }),
  platform: (path, token, data, method) =>
    request(`/platform${path}`, {
      headers: withToken(token),
      ...(data !== undefined
        ? { method: method || "POST", body: JSON.stringify(data) }
        : {}),
    }),
  sessions: (token) => request("/auth/sessions", { headers: withToken(token) }),
  revokeSession: (id, token) =>
    request(`/auth/sessions/${id}`, {
      method: "DELETE",
      headers: withToken(token),
    }),
  changePassword: (data, token) =>
    request("/auth/change-password", {
      method: "POST",
      headers: withToken(token),
      body: JSON.stringify(data),
    }),
  uploadResource: async (lessonId, data, file, token) => {
    const form = new FormData();
    Object.entries(data).forEach(([k, v]) => form.append(k, v));
    if (file) form.append("file", file);
    const response = await fetch(
      `${API_BASE_URL}/platform/lessons/${lessonId}/resources`,
      { method: "POST", headers: withToken(token), body: form },
    );
    const payload = await response.json();
    if (!response.ok)
      throw new Error(payload.message || "Không tải được tài liệu");
    return payload;
  },
  uploadAvatar: async (file, token) => {
    const form = new FormData();
    form.append("file", file);
    const response = await fetch(`${API_BASE_URL}/users/me/avatar`, {
      method: "POST",
      headers: withToken(token),
      body: form,
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok)
      throw new Error(payload?.message || "Không tải được ảnh đại diện");
    return payload;
  },
  configureMomoWallet: async (data, file, token) => {
    const form = new FormData();
    Object.entries(data).forEach(([k, v]) => form.append(k, String(v)));
    if (file) form.append("file", file);
    const response = await fetch(
      `${API_BASE_URL}/platform/payments/momo/wallet`,
      {
        method: "POST",
        headers: withToken(token),
        body: form,
      },
    );
    const payload = await response.json().catch(() => null);
    if (!response.ok)
      throw new Error(payload?.message || "Không lưu được QR MoMo");
    return payload;
  },
  download: async (path, token, filename) => {
    const response = await fetch(`${API_BASE_URL}/platform${path}`, {
      headers: withToken(token),
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new Error(payload?.message || "Không tải được file");
    }
    const url = URL.createObjectURL(await response.blob());
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  },
  startQuizAttempt: (quizId, token) =>
    request(`/quizzes/${quizId}/attempts`, {
      method: "POST",
      headers: withToken(token),
    }),
  submitQuizAttempt: (attemptId, answers, token) =>
    request(`/quizzes/attempts/${attemptId}/submit`, {
      method: "POST",
      headers: withToken(token),
      body: JSON.stringify({ answers }),
    }),
  logLearningEvent: (event, token) =>
    request("/learning/events", {
      method: "POST",
      headers: withToken(token),
      body: JSON.stringify(event),
    }),
  portalOverview: (token) =>
    request("/portal/overview", {
      headers: withToken(token),
    }),
  recommendationFeedback: (recommendationId, data, token) =>
    request(`/portal/student/recommendations/${recommendationId}/feedback`, {
      method: "POST",
      headers: withToken(token),
      body: JSON.stringify(data),
    }),
  createTicket: (data, token) =>
    request("/portal/student/tickets", {
      method: "POST",
      headers: withToken(token),
      body: JSON.stringify(data),
    }),
  createTeacherCourse: (data, token) =>
    request("/portal/teacher/courses", {
      method: "POST",
      headers: withToken(token),
      body: JSON.stringify(data),
    }),

      teacherCourseContent: (courseId, token) =>
    request(`/platform/courses/${courseId}/content`, {
      headers: withToken(token),
    }),

  updateTeacherLesson: (lessonId, data, token) =>
    request(`/platform/lessons/${lessonId}`, {
      method: "PATCH",
      headers: withToken(token),
      body: JSON.stringify(data),
    }),

      viewTeacherPdf: async (courseId, lessonId, resourceId, token) => {
    const response = await fetch(
      `${API_BASE_URL}/portal/teacher/courses/${courseId}/lessons/${lessonId}/resources/${resourceId}/file`,
      {
        headers: withToken(token),
      }
    );

    if (!response.ok) {
      throw new Error("Không thể mở file PDF.");
    }

    return response.blob();
  },

      getTeacherLessonResources: (courseId, lessonId, token) =>
    request(
      `/portal/teacher/courses/${courseId}/lessons/${lessonId}/resources`,
      {
        headers: withToken(token),
      }
    ),

      updateTeacherLessonResource: (
    courseId,
    lessonId,
    resourceId,
    data,
    token
  ) =>
    request(
      `/portal/teacher/courses/${courseId}/lessons/${lessonId}/resources/${resourceId}`,
      {
        method: "PATCH",
        headers: withToken(token),
        body: JSON.stringify(data),
      }
    ),

  deleteTeacherLessonResource: (
    courseId,
    lessonId,
    resourceId,
    token
  ) =>
    request(
      `/portal/teacher/courses/${courseId}/lessons/${lessonId}/resources/${resourceId}`,
      {
        method: "DELETE",
        headers: withToken(token),
      }
    ),

  addTeacherLessonResource: (courseId, lessonId, data, token) =>
    request(
      `/portal/teacher/courses/${courseId}/lessons/${lessonId}/resources`,
      {
        method: "POST",
        headers: withToken(token),
        body: JSON.stringify(data),
      }
    ),

      replaceTeacherPdf: async (
    courseId,
    lessonId,
    resourceId,
    title,
    file,
    token
  ) => {
    const form = new FormData();
    form.append("title", title);

    if (file) {
      form.append("file", file);
    }

    const response = await fetch(
      `${API_BASE_URL}/portal/teacher/courses/${courseId}/lessons/${lessonId}/resources/${resourceId}/replace-pdf`,
      {
        method: "PATCH",
        headers: withToken(token),
        body: form,
      }
    );

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        Array.isArray(result.message)
          ? result.message.join(", ")
          : result.message || "Không thể thay thế PDF."
      );
    }

    return result;
  },

  createTeacherLesson: (courseId, data, token) =>
    request(`/portal/teacher/courses/${courseId}/lessons`, {
      method: "POST",
      headers: withToken(token),
      body: JSON.stringify(data),
    }),
  updateTeacherCourseStatus: (courseId, status, token) =>
    request(`/portal/teacher/courses/${courseId}/status`, {
      method: "PATCH",
      headers: withToken(token),
      body: JSON.stringify({ status }),
    }),
  updateUser: (userId, data, token) =>
    request(`/users/${userId}`, {
      method: "PATCH",
      headers: withToken(token),
      body: JSON.stringify(data),
    }),
  runDemoMining: (token) =>
    request("/portal/admin/mining-runs/demo", {
      method: "POST",
      headers: withToken(token),
    }),
};
