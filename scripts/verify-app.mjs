import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

const base = process.env.VEDU_TEST_URL || 'http://localhost:8080';
const results = [];
const sessions = [];
let teacher;
let admin;
let createdCourseId;
let registeredUserId;

async function api(path, { method = 'GET', body, token, status = 200 } = {}) {
  const response = await fetch(`${base}/api${path}`, {
    method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(15000),
  });
  const payload = await response.json();
  assert.equal(response.status, status, `${path}: ${JSON.stringify(payload)}`);
  return payload;
}
async function check(name, fn) { await fn(); results.push({ name, passed: true }); console.log(`PASS ${name}`); }
async function login(username, role) {
  const result = await api('/auth/login', { method: 'POST', status: 201, body: { username, password: process.env.VEDU_TEST_PASSWORD || 'Demo@123', expectedRole: role } });
  sessions.push(result);
  return result;
}

try {
  await check('API health', async () => assert.equal((await api('/health')).status, 'ok'));
  const catalog = await api('/courses');
  await check('Catalog có khóa học và chủ đề từ database', async () => assert(catalog.length > 0 && catalog.some((c) => c.topic)));
  await check('Tìm theo tên khóa học', async () => assert((await api('/courses?q=React')).some((c) => /React/i.test(c.title))));
  await check('Tìm theo tên giảng viên', async () => assert((await api(`/courses?q=${encodeURIComponent(catalog[0].instructor)}`)).length > 0));
  await check('Lọc chủ đề chính xác', async () => { const topic = catalog[0].topic; const data = await api(`/courses?topic=${encodeURIComponent(topic)}`); assert(data.length && data.every((c) => c.topic === topic)); });
  await check('Tìm kiếm không có kết quả trả mảng rỗng', async () => assert.equal((await api('/courses?q=NO_MATCH_7a816232')).length, 0));
  await check('Sắp xếp theo số học viên', async () => { const data = await api('/courses?sort=popular'); assert(data.every((c, i) => !i || data[i - 1].students >= c.students)); });
  const guest = await api('/auth/guest', { method: 'POST', status: 201, body: { expectedRole: 'STUDENT' } }); sessions.push(guest);
  await check('Khách chỉ có STUDENT, không lộ mật khẩu', async () => { assert.equal(guest.user.role, 'STUDENT'); assert.equal(guest.user.isGuest, true); assert(!guest.password && !guest.user.passwordHash); });
  await check('Khách không thể vào cổng giảng viên', async () => api('/auth/guest', { method: 'POST', status: 400, body: { expectedRole: 'TEACHER' } }));
  await check('Khách không thể vào cổng admin', async () => api('/auth/guest', { method: 'POST', status: 400, body: { expectedRole: 'ADMIN' } }));
  await check('Portal khách có dữ liệu riêng', async () => { const portal = await api('/portal/overview', { token: guest.accessToken }); assert.equal(portal.role, 'STUDENT'); assert.equal(portal.courses.length, 0); });
  await check('JWT khách 259200 giây', async () => { const payload = JSON.parse(Buffer.from(guest.accessToken.split('.')[1], 'base64url')); assert.equal(payload.exp - payload.iat, 259200); });
  teacher = await login('teacher', 'TEACHER');
  admin = await login('admin', 'ADMIN');
  const student = await login('student', 'STUDENT');
  for (const [role, session] of [['STUDENT', student], ['TEACHER', teacher], ['ADMIN', admin]]) {
    await check(`Portal ${role}`, async () => assert.equal((await api('/portal/overview', { token: session.accessToken })).role, role));
  }
  await check('Đăng nhập sai cổng bị từ chối', async () => api('/auth/login', { method: 'POST', status: 401, body: { username: 'teacher', password: process.env.VEDU_TEST_PASSWORD || 'Demo@123', expectedRole: 'STUDENT' } }));
  await check('Admin không có quên mật khẩu', async () => api('/auth/forgot-password', { method: 'POST', status: 400, body: { email: 'admin@vedu.local', expectedRole: 'ADMIN' } }));
  await check('Student không được tạo khóa học giảng viên', async () => api('/portal/teacher/courses', { method: 'POST', token: guest.accessToken, status: 403, body: { name: 'Không được tạo' } }));
  await check('Validate đăng ký thiếu trường', async () => api('/auth/register', { method: 'POST', status: 400, body: { username: 'abc', password: '123' } }));
  const username = `check_${randomUUID().replaceAll('-', '').slice(0, 14)}`;
  await check('Đăng ký không tự cấp token', async () => {
    const registration = await api('/auth/register', { method: 'POST', status: 201, body: { fullName: 'Kiểm thử đăng ký', username, email: `${username}@example.com`, phone: '0912345678', password: 'CheckApp123', confirmPassword: 'CheckApp123' } });
    registeredUserId = registration.user.userId;
    assert(!registration.accessToken && !registration.refreshToken);
    assert.equal((await api(`/auth/username-availability/${username}`)).available, false);
  });
  const marker = `Kiểm thử tìm kiếm ${Date.now()}`;
  const topic = 'Chủ đề kiểm thử tự cập nhật';
  await check('Tạo chủ đề mới không cần sửa frontend', async () => {
    const course = await api('/portal/teacher/courses', { method: 'POST', status: 201, token: teacher.accessToken, body: { name: marker, topic, price: 0 } });
    createdCourseId = course.courseId;
    const l=await api(`/portal/teacher/courses/${createdCourseId}/lessons`,{method:'POST',status:201,token:teacher.accessToken,body:{title:'Bài học kiểm thử tìm kiếm',content:'Chỉ dùng kiểm thử',durationSeconds:30}});
    await api(`/platform/lessons/${l.lessonId}`,{method:'PATCH',token:teacher.accessToken,body:{title:'Bài học kiểm thử tìm kiếm',content:'Chỉ dùng kiểm thử',durationSeconds:30,isPublished:true}});
    await api(`/portal/teacher/courses/${createdCourseId}/status`, { method: 'PATCH', token: teacher.accessToken, body: { status: 'PUBLISHED' } });
    await api(`/platform/moderation/${createdCourseId}`,{method:'POST',status:201,token:admin.accessToken,body:{decision:'APPROVED',note:'Duyệt khóa kiểm thử tìm kiếm'}});
    const searched = await api(`/courses?q=${encodeURIComponent(marker)}&topic=${encodeURIComponent(topic)}`);
    assert(searched.some((c) => c.id === Number(createdCourseId) && c.topic === topic));
  });
  const detail = await api(`/courses/${catalog.find((c) => /React/i.test(c.title)).id}`);
  const quizLesson = detail.sections.flatMap((s) => s.lessons).find((l) => l.quizId);
  await check('Chi tiết khóa học có bài học', async () => assert(detail.sections[0].lessons.length));
  if (quizLesson) await check('Đề quiz dùng giây và không lộ đáp án đúng', async () => { const quiz = await api(`/quizzes/${quizLesson.quizId}/play`); assert(quiz.durationSeconds > 0); assert(quiz.questions.length); assert(quiz.questions.every((q) => q.options.every((a) => a.isCorrect === undefined))); });
  await check('Ghi danh và lưu tiến độ của khách', async () => {
    await api(`/enrollments/me/${detail.id}`, { method: 'POST', status: 201, token: guest.accessToken });
    const lesson = detail.sections[0].lessons.find((l) => l.type !== 'quiz');
    const event = await api('/learning/events', { method: 'POST', status: 201, token: guest.accessToken, body: { eventUuid: randomUUID(), learningSessionId: randomUUID(), courseId: detail.id, lessonId: lesson.id, action: 'VIEW_LESSON', durationSeconds: 5, completionStatus: 'IN_PROGRESS', metadata: { trackingMode: 'SMOKE_TEST' } } });
    assert(event.logId);
    const portal = await api('/portal/overview', { token: guest.accessToken });
    assert(portal.courses.some((c) => Number(c.courseId) === detail.id));
  });
  if (quizLesson) await check('Tạo và chấm quiz tại backend', async () => {
    const quiz = await api(`/quizzes/${quizLesson.quizId}/play`);
    const attempt = await api(`/quizzes/${quizLesson.quizId}/attempts`, { method: 'POST', status: 201, token: guest.accessToken });
    const submitted = await api(`/quizzes/attempts/${attempt.attemptId}/submit`, { method: 'POST', status: 201, token: guest.accessToken, body: { answers: quiz.questions.map((q) => ({ questionId: q.id, answerId: q.options[0].id })) } });
    assert(submitted.score >= 0 && submitted.score <= 10);
    assert(submitted.durationSeconds >= 0);
  });
  await check('Gửi ticket học viên', async () => { const ticket = await api('/portal/student/tickets', { method: 'POST', status: 201, token: guest.accessToken, body: { subject: 'Kiểm thử giao diện hỗ trợ', message: 'Yêu cầu kiểm thử tự động; không cần phản hồi.', priority: 'LOW' } }); assert(ticket.ticketId); });
  for (const path of ['/', '/courses', '/support', '/student/login', '/student/register', '/teacher/login', '/admin/login', '/student/courses', '/teacher/builder', '/admin/mining']) {
    await check(`SPA reload ${path}`, async () => assert.equal((await fetch(`${base}${path}`)).status, 200));
  }
  const publicReads = {};
  for (const path of ['/orders', '/payments', '/enrollments', '/lessons', '/quizzes/questions/1/answers']) {
    const response = await fetch(`${base}/api${path}`);
    publicReads[path] = response.status;
  }
  console.log(`AUDIT public legacy API statuses: ${JSON.stringify(publicReads)}`);
  console.log(`RESULT ${results.length}/${results.length} checks passed`);
} finally {
  // Kiểm thử trên database local: lưu trữ khóa kiểm thử, khóa user kiểm thử,
  // thu hồi session; không xóa dữ liệu người dùng hoặc volume.
  if (createdCourseId && teacher) await api(`/portal/teacher/courses/${createdCourseId}/status`, { method: 'PATCH', token: teacher.accessToken, body: { status: 'ARCHIVED' } });
  if (registeredUserId && admin) await api(`/users/${registeredUserId}`, { method: 'PATCH', token: admin.accessToken, body: { isActive: false } });
  for (const session of sessions) await api('/auth/revoke', { method: 'POST', status: 201, body: { refreshToken: session.refreshToken } });
}
