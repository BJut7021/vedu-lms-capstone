// Focused regression checks for this implementation, NOT the deferred deployment/test criterion.
// Only creates clearly labelled disposable accounts/courses; keeps history, archives own courses.
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
const base = process.env.VEDU_BASE_URL || "http://localhost:8080";
const stamp = Date.now(),
  results = [],
  createdCourses = [],
  auths = [];
const env = Object.fromEntries(
  readFileSync(new URL("../.env", import.meta.url), "utf8")
    .split(/\r?\n/)
    .filter((x) => x && !x.startsWith("#"))
    .map((x) => {
      const i = x.indexOf("=");
      return [x.slice(0, i), x.slice(i + 1)];
    }),
);
function sql(command) {
  return execFileSync(
    "docker",
    [
      "compose",
      "exec",
      "-T",
      "db",
      "psql",
      "-v",
      "ON_ERROR_STOP=1",
      "-U",
      env.POSTGRES_USER,
      "-d",
      env.POSTGRES_DB,
      "-t",
      "-A",
      "-c",
      command,
    ],
    { encoding: "utf8" },
  ).trim();
}
async function req(path, auth, data, method) {
  const r = await fetch(base + "/api" + path, {
    method: method || (data === undefined ? "GET" : "POST"),
    headers: {
      "Content-Type": "application/json",
      ...(auth ? { Authorization: `Bearer ${auth.accessToken}` } : {}),
    },
    ...(data !== undefined ? { body: JSON.stringify(data) } : {}),
  });
  const body = await r.json().catch(() => null);
  return { status: r.status, body };
}
async function ok(path, auth, data, method) {
  const r = await req(path, auth, data, method);
  assert.ok(
    r.status >= 200 && r.status < 300,
    `${path}: ${r.status} ${JSON.stringify(r.body)}`,
  );
  return r.body;
}
function check(name, condition) {
  assert.ok(condition, name);
  results.push(name);
  console.log("PASS", name);
}
async function denied(name, path, auth, data, method) {
  const r = await req(path, auth, data, method);
  check(name, [401, 403].includes(r.status));
}
try {
  const teacher = await ok("/auth/login", null, {
    username: "teacher",
    password: "Demo@123",
    expectedRole: "TEACHER",
  });
  auths.push(teacher);
  const admin = await ok("/auth/login", null, {
    username: "admin",
    password: "Demo@123",
    expectedRole: "ADMIN",
  });
  auths.push(admin);
  const user = {
    username: `verify_${stamp}`,
    fullName: "Kiểm tra nghiệp vụ (test)",
    email: `verify_${stamp}@example.test`,
    phone: "0901234567",
    password: "Verify@123",
    confirmPassword: "Verify@123",
  };
  const registration = await ok("/auth/register", null, user);
  sql(
    `UPDATE auth.users SET is_test_account=true WHERE user_id=${Number(registration.user.userId)}`,
  );
  const student = await ok("/auth/login", null, {
    username: user.username,
    password: user.password,
    expectedRole: "STUDENT",
  });
  auths.push(student);
  const other = await ok("/auth/guest", null, {});
  auths.push(other);
  sql(
    `UPDATE auth.users SET is_test_account=true WHERE user_id=${Number(other.user.userId)}`,
  );
  check("access lifetime 259200 seconds", student.expiresInSeconds === 259200);
  for (const path of [
    "/users",
    "/orders",
    "/payments",
    "/lessons",
    "/enrollments",
    "/quizzes",
  ])
    await denied(`anonymous blocked ${path}`, path);
  await denied(
    "student cannot read raw quiz answer keys",
    "/quizzes/questions/1/answers",
    student,
  );
  await denied("student cannot forge PAID payment", "/payments", student, {
    status: "PAID",
  });
  await denied(
    "student cannot create teacher course",
    "/portal/teacher/courses",
    student,
    { name: "Unauthorized" },
  );
  const createCourse = async (price) => {
    const c = await ok("/portal/teacher/courses", teacher, {
      name: `Verify upgrade ${stamp} ${price}`,
      price,
      topic: "Kiểm tra nghiệp vụ",
    });
    createdCourses.push(c.courseId);
    return Number(c.courseId);
  };
  const courseId = await createCourse(0),
    paidCourseId = await createCourse(10000);
  const videoLesson = await ok(
    `/portal/teacher/courses/${courseId}/lessons`,
    teacher,
    {
      title: "Video kiểm tra tracking",
      content: "Fixture kiểm tra, không phải video giảng dạy.",
      durationSeconds: 12,
    },
  );
  const videoFixture = `/tmp/vedu-verify-${stamp}.mp4`;
  execFileSync(
    "docker",
    [
      "compose",
      "exec",
      "-T",
      "backend",
      "ffmpeg",
      "-nostdin",
      "-hide_banner",
      "-loglevel",
      "error",
      "-f",
      "lavfi",
      "-i",
      "color=c=blue:s=640x360:r=10",
      "-t",
      "12",
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      videoFixture,
    ],
    { encoding: "utf8" },
  );
  const encoded = execFileSync(
    "docker",
    [
      "compose",
      "exec",
      "-T",
      "backend",
      "node",
      "-e",
      `process.stdout.write(require('fs').readFileSync('${videoFixture}').toString('base64'))`,
    ],
    { encoding: "utf8" },
  );
  const upload = new FormData();
  upload.append("title", "Video fixture kiểm tra");
  upload.append(
    "file",
    new Blob([Buffer.from(encoded, "base64")], { type: "video/mp4" }),
    "fixture.mp4",
  );
  const uploaded = await fetch(
    `${base}/api/platform/lessons/${videoLesson.lessonId}/resources`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${teacher.accessToken}` },
      body: upload,
    },
  );
  check("real MP4 upload accepted", uploaded.ok);
  const lesson = await ok(
    `/portal/teacher/courses/${courseId}/lessons`,
    teacher,
    {
      title: "Tài liệu kiểm tra",
      content: "Nội dung học tập lưu trong PostgreSQL.",
      durationSeconds: 30,
    },
  );
  const chapter = await ok(`/platform/courses/${courseId}/sections`, teacher, {
    title: "Chương 1",
  });
  await ok(
    `/platform/lessons/${lesson.lessonId}`,
    teacher,
    {
      title: "Tài liệu kiểm tra",
      content: "Nội dung thật: API cần xác thực và kiểm tra sở hữu.",
      durationSeconds: 30,
      isPublished: true,
      sectionId: chapter.section_id,
    },
    "PATCH",
  );
  await ok(
    `/portal/teacher/courses/${courseId}/status`,
    teacher,
    { status: "PUBLISHED" },
    "PATCH",
  );
  await ok(
    `/portal/teacher/courses/${paidCourseId}/status`,
    teacher,
    { status: "PUBLISHED" },
    "PATCH",
  );
  await ok(`/enrollments/me/${courseId}`, student, {});
  const classroom = await ok(
    `/platform/courses/${courseId}/classroom`,
    student,
  );
  check(
    "chapter and private lesson content loaded",
    classroom.sections[0].title === "Chương 1" &&
      classroom.sections[0].lessons[0].content.includes("sở hữu"),
  );
  const video = classroom.sections
    .flatMap((s) => s.lessons)
    .find((l) => l.id === Number(videoLesson.lessonId));
  const media = await fetch(base + video.videoUrl, {
    headers: { Range: "bytes=0-31" },
  });
  check("protected MP4 streaming supports byte ranges", media.status === 206);
  await denied(
    "media without signed ticket is blocked",
    video.videoUrl.split("?")[0].replace("/api", ""),
  );
  const watch = await ok(
    `/platform/watch/${videoLesson.lessonId}`,
    student,
    {},
  );
  const heartbeat = {
    watchId: watch.watchId,
    eventId: crypto.randomUUID(),
    positionSeconds: 1,
    durationSeconds: 12,
    playbackRate: 1,
    playing: true,
    seeking: false,
  };
  await new Promise((resolve) => setTimeout(resolve, 1200));
  const viewed = await ok("/platform/watch/heartbeat/sync", student, heartbeat);
  check(
    "server heartbeat credits actual playback",
    viewed.actualSeconds >= 1 && viewed.uniqueSeconds === 1,
  );
  check(
    "heartbeat retries are idempotent",
    (await ok("/platform/watch/heartbeat/sync", student, heartbeat))
      .actualSeconds === viewed.actualSeconds,
  );
  const skipped = await ok("/platform/watch/heartbeat/sync", student, {
    ...heartbeat,
    eventId: crypto.randomUUID(),
    positionSeconds: 11,
    seeking: true,
  });
  check("seeking does not count skipped content", skipped.uniqueSeconds === 1);
  const resumed = await ok(
    `/platform/watch/${videoLesson.lessonId}`,
    student,
    {},
  );
  check(
    "watch position and ranges persist",
    Number(resumed.state.position_seconds) === 11 &&
      resumed.state.ranges.length === 1,
  );
  check(
    "student cannot claim video complete from client",
    (
      await req("/learning/events", student, {
        eventUuid: crypto.randomUUID(),
        learningSessionId: crypto.randomUUID(),
        courseId,
        lessonId: Number(videoLesson.lessonId),
        action: "COMPLETE_LESSON",
      })
    ).status === 400,
  );
  const publicCourse = await ok(`/courses/${courseId}`);
  check(
    "public syllabus hides content",
    publicCourse.sections[0].lessons[0].content === null &&
      publicCourse.sections[0].lessons[0].resourceUrl === null,
  );
  await denied(
    "other student cannot access classroom",
    `/platform/courses/${courseId}/classroom`,
    other,
  );
  await ok(`/enrollments/me/${paidCourseId}`, student, {});
  await denied(
    "unpaid course locks classroom",
    `/platform/courses/${paidCourseId}/classroom`,
    student,
  );
  check(
    "unpaid checkout reports locked",
    !(await ok(`/platform/checkout/${paidCourseId}`, student)).paid,
  );
  check(
    "missing MoMo keys give configuration error",
    (await req(`/platform/checkout/${paidCourseId}`, student, {})).status ===
      503,
  );
  const q = await ok(`/platform/courses/${courseId}/questions`, student, {
    subject: "Kiểm tra quyền",
    body: "API xác thực ra sao?",
  });
  await ok(`/platform/questions/${q.question_id}/messages`, teacher, {
    body: "Kiểm tra JWT, phiên và quyền khóa học.",
  });
  check(
    "Q&A persists two messages",
    (await ok(`/platform/courses/${courseId}/questions`, student))[0].messages
      .length === 2,
  );
  await denied(
    "non-enrolled user cannot read Q&A",
    `/platform/courses/${courseId}/questions`,
    other,
  );
  const ticket = await ok("/portal/student/tickets", student, {
    subject: `Verify ticket ${stamp}`,
    message: "Yêu cầu thử nghiệm",
    category: "TECHNICAL",
    priority: "NORMAL",
  });
  const ticketId = ticket.ticketId;
  await ok(
    `/platform/tickets/${ticketId}`,
    admin,
    {
      status: "IN_PROGRESS",
      assignedTo: Number(teacher.user.userId),
      message: "Đã giao giảng viên xử lý",
    },
    "PATCH",
  );
  await ok(
    `/platform/tickets/${ticketId}`,
    teacher,
    { status: "RESOLVED", message: "Đã xử lý" },
    "PATCH",
  );
  check(
    "ticket lifecycle and conversation saved",
    (await ok(`/platform/tickets/${ticketId}`, student)).status === "RESOLVED",
  );
  await denied(
    "another student cannot read ticket",
    `/platform/tickets/${ticketId}`,
    other,
  );
  const quiz = await ok(`/platform/courses/${courseId}/quizzes`, teacher, {
    title: "Kiểm tra API",
    timeLimitSeconds: 600,
    passingScore: 5,
    maxAttempts: 3,
    questions: [
      {
        text: "Cần gì để học khóa có phí?",
        type: "MULTIPLE_CHOICE",
        options: [
          { text: "Ghi danh", correct: true },
          { text: "Thanh toán", correct: true },
          { text: "Đổi URL", correct: false },
        ],
      },
    ],
  });
  const questions = await ok(`/quizzes/quiz/${quiz.quiz_id}/questions`, admin),
    answers = await ok(
      `/quizzes/questions/${questions[0].questionId}/answers`,
      admin,
    );
  const attempt = await ok(`/quizzes/${quiz.quiz_id}/attempts`, student, {});
  check("server deadline supplied", !!attempt.deadline && !!attempt.serverTime);
  const selected = [
    {
      questionId: Number(questions[0].questionId),
      answerIds: answers
        .filter((a) => a.isCorrect)
        .map((a) => Number(a.answerId)),
    },
  ];
  await ok(
    `/platform/attempts/${attempt.attemptId}/draft`,
    student,
    { answers: selected },
    "PATCH",
  );
  check(
    "resume restores draft",
    (await ok(`/quizzes/${quiz.quiz_id}/attempts`, student, {})).answers
      .length === 1,
  );
  await denied(
    "student cannot submit another attempt",
    `/quizzes/attempts/${attempt.attemptId}/submit`,
    other,
    { answers: selected },
  );
  const graded = await ok(
    `/quizzes/attempts/${attempt.attemptId}/submit`,
    student,
    { answers: selected },
  );
  assert.ok(
    graded.score === 10 && graded.passed && graded.status === "GRADED",
    JSON.stringify(graded),
  );
  check("multi-choice graded on server", true);
  check(
    "resubmit idempotent",
    (
      await ok(`/quizzes/attempts/${attempt.attemptId}/submit`, student, {
        answers: [],
      })
    ).score === 10,
  );
  const event = {
    eventUuid: crypto.randomUUID(),
    learningSessionId: crypto.randomUUID(),
    courseId,
    lessonId: Number(lesson.lessonId),
    action: "COMPLETE_LESSON",
    durationSeconds: 0,
  };
  await ok("/learning/events", student, event);
  await ok(`/platform/lessons/${videoLesson.lessonId}`, teacher, {}, "DELETE"); // Archive own fixture before certificate eligibility check.
  const cert = await ok(
    `/platform/courses/${courseId}/certificate`,
    student,
    {},
  );
  check("certificate issued after completion", !!cert.certificate_code);
  check(
    "public verification valid",
    (await ok(`/platform/certificates/${cert.certificate_code}/verify`))
      .status === "ISSUED",
  );
  const pdf = await fetch(
    `${base}/api/platform/certificates/${cert.certificate_code}/pdf`,
    { headers: { Authorization: `Bearer ${student.accessToken}` } },
  );
  check(
    "certificate PDF downloadable",
    pdf.ok &&
      Buffer.from(await pdf.arrayBuffer())
        .subarray(0, 5)
        .toString() === "%PDF-",
  );
  const recommendations = await ok(
    `/platform/courses/${courseId}/recommendations`,
    student,
    {},
  );
  check(
    "no invented model claim in cold start",
    recommendations.source === "FALLBACK",
  );
  const report = await ok(`/platform/reports?courseId=${courseId}`, teacher);
  check("filtered teacher report contains own course", report.length === 1);
  await denied(
    "student cannot export staff report",
    "/platform/reports",
    student,
  );
  const csv = await fetch(
    `${base}/api/platform/reports?courseId=${courseId}&format=csv`,
    { headers: { Authorization: `Bearer ${teacher.accessToken}` } },
  );
  check(
    "CSV export ready",
    csv.ok && (await csv.text()).includes("actual_seconds"),
  );
  for (const [path, data] of [
    [`/quizzes/${quiz.quiz_id}/attempts`, {}],
    [`/platform/courses/${courseId}/certificate`, {}],
    [`/platform/courses/${courseId}/recommendations`, {}],
    [
      `/platform/courses/${courseId}/questions`,
      { subject: "Guest", body: "Blocked" },
    ],
    ["/portal/student/tickets", { subject: "Guest", message: "Blocked" }],
    [`/platform/checkout/${paidCourseId}`, {}],
    [
      "/auth/change-password",
      {
        oldPassword: "x",
        newPassword: "Abcd1234",
        confirmPassword: "Abcd1234",
      },
    ],
  ])
    await denied(`guest restricted ${path}`, path, other, data);
  const free = (await ok("/courses"))
    .filter((c) => Number(c.price) === 0 && c.id !== courseId)
    .slice(0, 3);
  if (free.length === 3) {
    await ok(`/enrollments/me/${free[0].id}`, other, {});
    await ok(`/enrollments/me/${free[1].id}`, other, {});
    check(
      "guest cannot enroll third course",
      (await req(`/enrollments/me/${free[2].id}`, other, {})).status === 409,
    );
    const preview = await ok(
      `/platform/courses/${free[0].id}/classroom`,
      other,
    );
    check(
      "guest classroom limits preview to two lessons",
      preview.sections.flatMap((s) => s.lessons).length <= 2,
    );
  }
  await ok("/auth/change-password", student, {
    oldPassword: user.password,
    newPassword: "VerifyNew@123",
    confirmPassword: "VerifyNew@123",
  });
  await denied(
    "change password revokes current access",
    "/auth/sessions",
    student,
  );
  const fresh = await ok("/auth/login", null, {
    username: user.username,
    password: "VerifyNew@123",
    expectedRole: "STUDENT",
  });
  auths.push(fresh);
  await ok(`/auth/sessions/${fresh.sessionId}`, fresh, {}, "DELETE");
  await denied(
    "session revoke immediately invalidates access",
    "/auth/sessions",
    fresh,
  );
  const refreshed = await ok("/auth/refresh", other, {
    refreshToken: other.refreshToken,
  });
  check(
    "refresh rotation issues a distinct token",
    refreshed.refreshToken !== other.refreshToken,
  );
  check(
    "old rotated refresh rejected",
    (await req("/auth/refresh", null, { refreshToken: other.refreshToken }))
      .status === 401,
  );
  other.refreshToken = refreshed.refreshToken;
  await ok("/auth/revoke", null, { refreshToken: other.refreshToken });
  await denied(
    "logout revokes still-unexpired access",
    "/auth/sessions",
    other,
  );
  console.log(`Verified ${results.length} focused checks.`);
  mkdirSync(new URL("../docs/validation/", import.meta.url), {
    recursive: true,
  });
  writeFileSync(
    new URL("../docs/validation/upgrade-checks.json", import.meta.url),
    JSON.stringify(
      {
        date: new Date().toISOString(),
        base,
        checks: results,
        scope:
          "Focused implementation regression; final testing/deployment criterion deferred",
      },
      null,
      2,
    ),
  );
} finally {
  const teacher = auths.find((a) => a.user.role === "TEACHER");
  if (teacher)
    for (const id of createdCourses)
      await req(
        `/portal/teacher/courses/${id}/status`,
        teacher,
        { status: "ARCHIVED" },
        "PATCH",
      ).catch(() => {});
  for (const auth of auths)
    await req("/auth/revoke", null, { refreshToken: auth.refreshToken }).catch(
      () => {},
    );
}
