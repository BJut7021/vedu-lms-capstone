import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { writeFileSync } from "node:fs";
const require = createRequire(
  new URL("../frontend/package.json", import.meta.url),
);
const { JSDOM } = require("jsdom");
const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://127.0.0.1:8080/",
});
for (const key of [
  "window",
  "document",
  "HTMLElement",
  "HTMLInputElement",
  "Event",
  "MouseEvent",
  "File",
  "FormData",
])
  globalThis[key] =
    key === "window"
      ? dom.window
      : key === "document"
        ? dom.window.document
        : dom.window[key];
Object.defineProperty(globalThis, "navigator", {
  value: dom.window.navigator,
  configurable: true,
});
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
URL.createObjectURL = () => "blob:vedu-test";
URL.revokeObjectURL = () => {};
const scrolls = [];
window.scrollTo = (options) => scrolls.push(options);
const React = require("react"),
  {
    render,
    screen,
    fireEvent,
    waitFor,
    cleanup,
  } = require("@testing-library/react");
const { createServer } = await import(
  new URL("../frontend/node_modules/vite/dist/node/index.js", import.meta.url)
);
const server = await createServer({
  root: fileURLToPath(new URL("../frontend/", import.meta.url)),
  server: { middlewareMode: true },
  appType: "custom",
});
const checks = [],
  check = (name, value) => {
    assert.ok(value, name);
    checks.push(name);
    console.log("PASS", name);
  };
try {
  const {
    MemoryRouter,
    Routes,
    Route,
    useParams,
    useLocation,
  } = require("react-router-dom");
  const { api } = await server.ssrLoadModule("/src/services/api.js");
  const { default: LearningPaths } = await server.ssrLoadModule(
    "/src/components/LearningPaths.jsx",
  );
  let sent;
  const preferences = {
    goal: "CAREER",
    level: "BEGINNER",
    occupation: "OFFICE",
    format: "MIXED",
    weeklySeconds: 9000,
    horizonWeeks: 4,
    count: 2,
  };
  const saved = {
    path_set_id: "test-path",
    course_id: 68,
    preferences,
    plans: [],
    evidence: { source: "CURRICULUM" },
    created_at: new Date().toISOString(),
  };
  api.platform = async (path, token, data) => {
    if (data) {
      sent = data;
      return { ...saved, path_set_id: "new-test-path", preferences: data };
    }
    return [saved];
  };
  render(
    React.createElement(
      MemoryRouter,
      null,
      React.createElement(LearningPaths, {
        auth: { accessToken: "test" },
        data: { courses: [{ courseId: 68, courseName: "Cấu trúc rời rạc" }] },
        act: (fn) => fn(),
        busy: false,
      }),
    ),
  );
  const hours = screen.getByRole("spinbutton", {
    name: /Quỹ thời gian mỗi tuần/,
  });
  check("Weekly time initially displayed in hours", hours.value === "1");
  fireEvent.change(screen.getByRole("combobox", { name: "Khóa đã ghi danh" }), {
    target: { value: "68" },
  });
  await waitFor(() => assert.equal(hours.value, "2.5"));
  check(
    "Existing 9000-second preference restored as 2.5 hours",
    hours.value === "2.5",
  );
  fireEvent.change(hours, { target: { value: "0.25" } });
  check("Weekly input rejects less than half an hour", !hours.checkValidity());
  fireEvent.change(hours, { target: { value: "2.5" } });
  fireEvent.submit(hours.closest("form"));
  await waitFor(() => assert.equal(sent?.weeklySeconds, 9000));
  check(
    "Hours converted to seconds in actual form submission",
    sent.weeklySeconds === 9000,
  );
  cleanup();
  const { default: Classroom } = await server.ssrLoadModule(
    "/src/components/Classroom.jsx",
  );
  const course = {
    id: 68,
    title: "Cấu trúc rời rạc",
    sections: [
      {
        id: 1,
        title: "Chương 1",
        required: true,
        assignments: [
          {
            assignment_id: 5,
            section_id: 1,
            title: "Bài thực hành cần sửa",
            instructions: "Bổ sung minh chứng.",
            required: true,
            passing_score: 7,
            allowed_file_types: ["pdf"],
            rubric: [{ id: "evidence", label: "Minh chứng", skill: "evidence", max: 10, min: 7 }],
            latestVersion: { status: "NEEDS_REVISION" },
          },
        ],
        lessons: [
          {
            id: 11,
            title: "Bài một",
            type: "document",
            completed: true,
            content: "Nội dung thứ nhất",
            durationSeconds: 600,
            resources: [],
          },
          {
            id: 12,
            title: "Bài hai",
            type: "document",
            content: "Nội dung thứ hai",
            durationSeconds: 900,
            resources: [
              {
                id: 1,
                type: "PDF",
                title: "Tài liệu bài hai",
                url: "/test.pdf",
              },
              {
                id: 2,
                type: "DOCUMENT",
                title: "Slide bài hai.pptx",
                url: "https://example.test/lesson.pptx",
              },
              {
                id: 3,
                type: "DOCUMENT",
                title: "Tóm tắt bài hai.docx",
                url: "https://example.test/lesson.docx",
              },
              {
                id: 4,
                type: "LINK",
                title: "Slide trực tuyến",
                url: "/course-materials/discrete/02.html",
              },
            ],
          },
        ],
      },
    ],
  };
  const pathPlatform = api.platform;
  api.platform = async (path, token, data) => {
    if (path.includes("study-state")) return { finalExamPassed: false };
    if (path.includes("/assignments")) return {
      assignments: course.sections[0].assignments,
      versions: [{
        version_id: 9,
        assignment_id: 5,
        version_no: 1,
        status: "NEEDS_REVISION",
        answer_text: "Bản cũ",
        feedback: "Bổ sung minh chứng.",
      }],
      modules: [{ section_id: 1, title: "Chương 1" }],
    };
    return pathPlatform(path, token, data);
  };
  function Room() {
    const p = useParams();
    const current = useLocation();
    return React.createElement(React.Fragment, null,
      React.createElement("output", { "data-testid": "classroom-route" }, current.pathname + current.search),
      React.createElement(Classroom, {
        course,
        activeLessonId: Number(p.lessonId),
        token: "test",
        header: React.createElement("header", null, "VEDU"),
        onBack: () => {},
        onOpenQuiz: () => {},
        onLogEvent: async () => ({}),
        onRefreshCourse: async () => {},
      }),
    );
  }
  render(
    React.createElement(
      MemoryRouter,
      { initialEntries: ["/learn/68/11"] },
      React.createElement(
        Routes,
        null,
        React.createElement(Route, {
          path: "/learn/:courseId/:lessonId",
          element: React.createElement(Room),
        }),
      ),
    ),
  );
  check(
    "Reading alone does not mark an assessment complete",
    screen.queryByRole("button", { name: "Tôi đã đọc tài liệu" }) === null,
  );
  scrolls.length = 0;
  fireEvent.click(screen.getByRole("button", { name: "Bài kế tiếp" }));
  await waitFor(() =>
    screen.getByRole("heading", { name: "Bài hai", level: 1 }),
  );
  check(
    "Next button changes to correct lesson",
    !!screen.getByRole("heading", { name: "Bài hai", level: 1 }),
  );
  check(
    "Next lesson resets vertical and horizontal scroll instantly",
    scrolls.some(
      (s) => s.top === 0 && s.left === 0 && s.behavior === "instant",
    ),
  );
  check(
    "Contextual Q&A keeps course, lesson and return route",
    screen.getByRole("link", { name: "Hỏi đáp khóa học" }).getAttribute("href").includes("courseId=68") &&
      screen.getByRole("link", { name: "Hỏi đáp khóa học" }).getAttribute("href").includes("lessonId=12") &&
      screen.getByRole("link", { name: "Hỏi đáp khóa học" }).getAttribute("href").includes("returnTo="),
  );
  check(
    "Lesson without quiz has no learner self-completion control",
    screen.queryByRole("button", { name: "Đánh dấu đã học" }) === null,
  );
  check(
    "Completed progress retained when changing lesson",
    screen.getByText(/50% hoàn thành/).textContent.includes("1/2"),
  );
  check(
    "Chapter progress percentage uses completed lesson count",
    screen
      .getByRole("progressbar", { name: "Tiến độ chương hiện tại" })
      .getAttribute("aria-valuenow") === "50",
  );
  check(
    "Progress legend separates completed, current and new lessons",
    screen.getByText("bài đã hoàn thành").textContent.startsWith("1") &&
      screen.getByText("bài đang học").textContent.startsWith("1") &&
      screen.getByText("bài chưa học").textContent.startsWith("0"),
  );
  check(
    "Documents section displays actual lesson attachment",
    screen.getAllByRole("link", { name: /Tài liệu bài hai/ }).some(
      (link) => link.getAttribute("href") === "/test.pdf",
    ),
  );
  for (const label of ["PDF", "PPT", "DOC", "WEB"])
    check(
      `Related resources display correct ${label} file icon`,
      screen.getAllByRole("img", { name: `Định dạng ${label}` }).length > 0,
    );
  const assignmentTreeButton = screen
    .getAllByRole("button", { name: /Bài thực hành cần sửa/ })
    .find((candidate) => candidate.textContent.includes("Cần sửa và nộp lại"));
  assert.ok(assignmentTreeButton);
  fireEvent.click(assignmentTreeButton);
  await waitFor(() =>
    assert.match(
      screen.getByTestId("classroom-route").textContent,
      /assignmentId=5/,
    ),
  );
  check(
    "Assignment tree opens the exact module submission by deep link",
    screen.getByTestId("classroom-route").textContent ===
      "/learn/68/11?assignmentId=5",
  );
  cleanup();
  api.platform = pathPlatform;
  const { default: Header } = await server.ssrLoadModule(
    "/src/components/Header.jsx",
  );
  render(
    React.createElement(
      MemoryRouter,
      null,
      React.createElement(Header, {
        classroom: true,
        user: {
          userId: 1,
          fullName: "Học viên kiểm thử",
          username: "avatar_test",
          role: "STUDENT",
          avatarUrl: "/api/users/avatars/profile.jpg",
        },
        onHome: () => {},
        onLogout: () => {},
        onDashboard: () => {},
      }),
    ),
  );
  check(
    "Classroom header displays current user's avatar and name",
    screen
      .getByRole("img", { name: "Ảnh đại diện Học viên kiểm thử" })
      .getAttribute("src") === "/api/users/avatars/profile.jpg" &&
      !!screen.getByText("Học viên kiểm thử"),
  );
  const summary = screen.getByLabelText("Menu tài khoản Học viên kiểm thử");
  fireEvent.click(summary);
  check(
    "Avatar menu links to own student profile",
    screen
      .getByRole("link", { name: "Hồ sơ & ảnh đại diện" })
      .getAttribute("href") === "/student/profile",
  );
  cleanup();
  for (const classroom of [false, true]) {
    let openedDashboard = false;
    render(
      React.createElement(
        MemoryRouter,
        null,
        React.createElement(Header, {
          user: {
            fullName: "Học viên kiểm thử",
            username: "studenttest",
            role: "STUDENT",
            avatarUrl: "/api/users/avatars/profile.jpg",
          },
          classroom,
          onDashboard: () => {
            openedDashboard = true;
          },
          onLogout: () => {},
          onHome: () => {},
        }),
      ),
    );
    check(
      `${classroom ? "Classroom" : "Homepage and course introduction"} uses the same learner name and avatar menu`,
      !!screen.getByLabelText("Menu tài khoản Học viên kiểm thử") &&
        !!screen.getByText("Học viên kiểm thử") &&
        !screen.queryByLabelText("Mở không gian học tập"),
    );
    fireEvent.click(screen.getByLabelText("Menu tài khoản Học viên kiểm thử"));
    fireEvent.click(
      screen.getByRole("button", { name: "Không gian học tập", exact: true }),
    );
    check(
      `${classroom ? "Classroom" : "Public page"} account menu opens dashboard and closes`,
      openedDashboard && !document.querySelector("details").open,
    );
    cleanup();
  }
  const { default: Profile } = await server.ssrLoadModule(
    "/src/components/Profile.jsx",
  );
  for (const role of ["STUDENT", "TEACHER"]) {
    let uploaded;
    api.uploadAvatar = async (file) => {
      uploaded = file;
      return {
        userId: 1,
        fullName: "Kiểm thử",
        username: "testuser",
        email: "test@example.test",
        role,
        avatarUrl: "/api/users/avatars/test.jpg",
      };
    };
    function UserProfile() {
      const [user, setUser] = React.useState({
        userId: 1,
        fullName: "Kiểm thử",
        username: "testuser",
        email: "test@example.test",
        role,
      });
      return React.createElement(Profile, {
        auth: { accessToken: "test", user },
        onUserUpdated: setUser,
      });
    }
    render(React.createElement(UserProfile));
    const input = screen.getByLabelText("Chọn ảnh đại diện");
    fireEvent.change(input, {
      target: {
        files: [new File(["bad"], "bad.svg", { type: "image/svg+xml" })],
      },
    });
    check(
      `${role}: invalid avatar rejected before upload`,
      screen.getByRole("status").textContent.includes("tối đa 5 MB") &&
        !uploaded,
    );
    const file = new File(["test-image"], "avatar.png", { type: "image/png" });
    fireEvent.change(input, { target: { files: [file] } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu ảnh đại diện" }));
    await waitFor(() =>
      assert.ok(screen.getByRole("status").textContent.includes("thành công")),
    );
    check(
      `${role}: selected file submitted and avatar updated`,
      uploaded === file &&
        screen
          .getByRole("img", { name: "Ảnh đại diện Kiểm thử" })
          .getAttribute("src") === "/api/users/avatars/test.jpg",
    );
    cleanup();
  }
  const { default: HomeBanner } = await server.ssrLoadModule(
    "/src/components/HomeBanner.jsx",
  );
  render(
    React.createElement(
      MemoryRouter,
      null,
      React.createElement(HomeBanner, {
        courseCount: 50,
        topicCount: 7,
        onOpenAuth: () => {},
      }),
    ),
  );
  check(
    "Homepage immediately shows real catalog count",
    !!screen.getByText("50 khóa học đang mở · 7 chủ đề"),
  );
  check(
    "Homepage uses local real learning photographs",
    screen
      .getByRole("img", { name: /Giảng viên và học viên/ })
      .getAttribute("src") === "/images/learning/classroom-smiles.webp",
  );
  cleanup();
  const { default: CourseDetail } = await server.ssrLoadModule(
    "/src/components/CourseDetail.jsx",
  );
  const { formatMinutes, formatMinutesSeconds } = await server.ssrLoadModule(
    "/src/services/time.js",
  );
  render(
    React.createElement(CourseDetail, {
      course: {
        ...course,
        overview: {
          audience: "Người đã biết lập trình cơ bản",
          preparation: "Cài C# để thực hành",
          outcomes: ["Xây dựng lớp và đối tượng", "Vận dụng kế thừa"],
          lessonCount: 2,
          assessments: [
            {
              title: "Thi cuối khóa",
              passingScore: 7,
              maxAttempts: 5,
              durationSeconds: 1200,
              requiresCompletedLessons: true,
            },
          ],
          syllabus: { type: "PDF", url: "/api/courses/75/syllabus" },
          practiceNote: "Bài thực hành tự luyện.",
        },
      },
      onBack: () => {},
      onStartLearning: () => {},
      onStartQuiz: () => {},
    }),
  );
  check(
    "Course introduction shows lesson contents, preparation and only required modules before enrollment",
    !!screen.getByText("Nội dung chính của khóa học") &&
      !!screen.getByText("Bài một") &&
      !!screen.getByText("Cài C# để thực hành") &&
      screen.getAllByText("Chương 1").length >= 2 &&
      !screen.queryByText(/Đạt từ 7\/10/) &&
      !screen.queryByText("Thi cuối khóa"),
  );
  check(
    "Syllabus preview and original-document link are available before starting",
    document.querySelector("iframe").getAttribute("src") ===
      "/api/courses/75/syllabus" &&
      screen
        .getByRole("link", { name: "Mở PDF đề cương" })
        .getAttribute("href") === "/api/courses/75/syllabus",
  );
  cleanup();
  check(
    "Course minutes preserve short and fractional durations",
    formatMinutes(900) === "15 phút" &&
      formatMinutes(90) === "1,5 phút" &&
      formatMinutes(1) === "0,02 phút" &&
      formatMinutesSeconds(895) === "14 phút 55 giây",
  );
  for (const [state, label, lessonId, quizId] of [
    ["NEW", "Bắt đầu học", 11, null],
    ["IN_PROGRESS", "Tiếp tục học", 12, null],
    ["COMPLETED", "Ôn tập", 12, null],
    ["IN_PROGRESS", "Tiếp tục học", null, 23],
  ]) {
    let selected;
    render(
      React.createElement(CourseDetail, {
        course,
        studyState: {
          state,
          lessonId,
          quizId,
          completedLessons: state === "NEW" ? 0 : 1,
          totalLessons: 2,
        },
        onBack: () => {},
        onStartLearning: (id) => (selected = ["lesson", id]),
        onStartQuiz: (id) => (selected = ["quiz", id]),
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: label, exact: true }));
    check(
      `${label} navigates to ${quizId ? "pending exam" : state === "COMPLETED" ? "review lesson" : state === "NEW" ? "guide" : "unfinished lesson"}`,
      selected?.[0] === (quizId ? "quiz" : "lesson") &&
        selected?.[1] === (quizId || lessonId),
    );
    cleanup();
  }
  render(
    React.createElement(CourseDetail, {
      course,
      studyLoading: true,
      onBack: () => {},
      onStartLearning: () => {},
      onStartQuiz: () => {},
    }),
  );
  check(
    "Entry button waits for personal progress instead of opening the guide",
    screen.getByRole("button", { name: "Đang tải tiến độ…" }).disabled,
  );
  cleanup();
  const { default: ClassroomLayout } = await server.ssrLoadModule(
    "/src/components/ClassroomLayout.jsx",
  );
  render(
    React.createElement(
      MemoryRouter,
      null,
      React.createElement(ClassroomLayout, {
        course,
        lessons: course.sections[0].lessons,
        lesson: {
          ...course.sections[0].lessons[0],
          type: "video",
          quizId: 99,
        },
        done: {},
        stats: {
          actualSeconds: 90,
          uniqueSeconds: 60,
          durationSeconds: 600,
          percent: 10,
        },
        onSelect: () => {},
        onBack: () => {},
        complete: () => {},
        video: React.createElement("div", null, "Trình phát kiểm thử"),
        onLeaveVideo: () => {},
      }),
    ),
  );
  check(
    "Classroom uses minutes and seconds for real watch duration and removes estimated sidebar line",
    document.body.textContent.includes("Đã xem thực: 1 phút 30 giây") &&
      document.body.textContent.includes("Nội dung duy nhất: 1 phút 0 giây") &&
      document.body.textContent.includes("Thời lượng video: 10 phút 0 giây") &&
      !document.body.textContent.includes("đọc dự kiến") &&
      !document.body.textContent.includes("Có quiz cuối bài") &&
      !document.body.textContent.includes("Tiến độ xem video được lưu tự động"),
  );
  cleanup();
  const introductionCourse = {
    ...course,
    sections: [
      {
        ...course.sections[0],
        moduleType: "INTRO",
      },
    ],
  };
  render(
    React.createElement(
      MemoryRouter,
      null,
      React.createElement(ClassroomLayout, {
        course: introductionCourse,
        lessons: introductionCourse.sections[0].lessons,
        lesson: introductionCourse.sections[0].lessons[0],
        done: {},
        onSelect: () => {},
        onBack: () => {},
      }),
    ),
  );
  check(
    "Course introduction no longer shows the learning guide panel",
    !document.body.textContent.includes("Hướng dẫn học khóa học"),
  );
  cleanup();
  const { default: CourseImage } = await server.ssrLoadModule(
    "/src/components/CourseImage.jsx",
  );
  const { resolveCourseCover } = await server.ssrLoadModule(
    "/src/services/courseCovers.js",
  );
  const networkCourse = { id: 69, title: "Mạng máy tính", image: null };
  const reviewedNetworkCover = "/images/course-covers/v3/course-69-496b629d.webp";
  render(React.createElement(CourseImage, { course: networkCourse }));
  check(
    "Reviewed course uses its own local cover",
    screen.getByRole("img", { name: "Mạng máy tính" }).getAttribute("src") ===
      reviewedNetworkCover,
  );
  cleanup();
  render(
    React.createElement(CourseImage, {
      course: { ...networkCourse, image: "/uploads/teacher-original.jpg" },
    }),
  );
  const coverImage = screen.getByRole("img", { name: "Mạng máy tính" });
  check(
    "Teacher-selected cover is preserved without text overlay",
    coverImage.getAttribute("src") === "/uploads/teacher-original.jpg" &&
      !document.querySelector(".course-cover-caption"),
  );
  fireEvent.error(coverImage);
  check(
    "Broken uploaded image falls back to the matching local course cover",
    coverImage.getAttribute("src") ===
      reviewedNetworkCover,
  );
  fireEvent.error(coverImage);
  check(
    "Missing local image falls back to original safe subject artwork",
    coverImage.getAttribute("src").startsWith("data:image/svg+xml"),
  );
  cleanup();
  check(
    "Old stock placeholders are replaced by reviewed artwork",
    resolveCourseCover({
      ...networkCourse,
      image: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=900",
    }).primary === reviewedNetworkCover,
  );
  const unknown = resolveCourseCover({ id: 99999, title: "Mạng máy tính" });
  check(
    "Catalog cover stays stable across different database IDs",
    unknown.primary === reviewedNetworkCover,
  );
  const { default: ManualCheckout } = await server.ssrLoadModule(
    "/src/components/ManualCheckout.jsx",
  );
  const originalPlatform = api.platform;
  let reported,
    refreshed = 0;
  api.platform = async (path, token, body) => {
    reported = { path, body };
    return { message: "Đã gửi yêu cầu đối soát" };
  };
  render(
    React.createElement(
      MemoryRouter,
      null,
      React.createElement(ManualCheckout, {
        status: { amount: 10000, configured: false, manualRequest: null },
        auth: { accessToken: "test" },
        courseId: 7,
        refresh: async () => {
          refreshed++;
        },
      }),
    ),
  );
  check(
    "MoMo QR waits for receiver configuration and exposes no bank or cash option",
    screen.getByRole("button", { name: /Xem QR MoMo/ }).disabled &&
      !screen.queryByRole("button", {
        name: /Thanh toán trực tiếp|QR chuyển khoản/,
      }),
  );
  cleanup();
  render(
    React.createElement(
      MemoryRouter,
      null,
      React.createElement(ManualCheckout, {
        status: {
          amount: 10000,
          configured: true,
          manualRequest: {
            id: "request1",
            orderId: 10,
            method: "MOMO_WALLET",
            wallet: {
              receiverName: "Ví kiểm thử",
              receiverPhone: "0000000000",
            },
            qrDataUrl: "data:image/png;base64,AA==",
            reference: "VEDUTEST0001",
            status: "PENDING",
          },
        },
        auth: { accessToken: "test" },
        courseId: 7,
        refresh: async () => {
          refreshed++;
        },
      }),
    ),
  );
  fireEvent.change(screen.getByLabelText("Mã giao dịch MoMo"), {
    target: { value: "VEDUTESTPAY01" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Tôi đã chuyển MoMo — gửi đối soát" }));
  await waitFor(() => assert.equal(refreshed, 1));
  check(
    "Learner payment report calls review request and never self-unlocks classroom",
    reported.path === "/payments/manual/request1/report" &&
      !("paid" in reported.body) &&
      !screen.queryByRole("link", { name: "Vào khóa học" }),
  );
  cleanup();
  const { default: MomoWalletSettings } = await server.ssrLoadModule(
    "/src/components/MomoWalletSettings.jsx",
  );
  const originalConfigureWallet = api.configureMomoWallet;
  const originalCreateUrl = URL.createObjectURL,
    originalRevokeUrl = URL.revokeObjectURL;
  URL.createObjectURL = () => "blob:isolated-qr-test";
  URL.revokeObjectURL = () => {};
  let walletSaved;
  api.platform = async () => ({ mode: "personal", wallet: null });
  api.configureMomoWallet = async (body, file, token) => {
    walletSaved = { body, file, token };
    return {
      message: "Đã lưu QR MoMo",
      mode: "personal",
      wallet: { ...body, qrDataUrl: "data:image/png;base64,AA==" },
    };
  };
  render(
    React.createElement(MomoWalletSettings, {
      auth: { accessToken: "admin-test" },
      onSaved: async () => {},
    }),
  );
  await screen.findByText("Chưa có QR nhận tiền");
  check(
    "MoMo recipient setup requires explicit confirmation",
    screen.getByRole("button", { name: "Lưu QR nhận học phí MoMo" }).disabled,
  );
  const qrInput = screen.getByLabelText(/Ảnh QR Nhận tiền từ MoMo/);
  fireEvent.change(qrInput, {
    target: {
      files: [new File(["invalid"], "bad.txt", { type: "text/plain" })],
    },
  });
  check(
    "MoMo recipient setup rejects invalid image files before upload",
    !!screen.getByRole("alert").textContent.includes("PNG/JPG/WebP"),
  );
  fireEvent.change(screen.getByLabelText("Tên chủ ví MoMo"), {
    target: { value: "Ví kiểm thử" },
  });
  fireEvent.change(screen.getByLabelText("Số điện thoại nhận tiền MoMo"), {
    target: { value: "0000000000" },
  });
  fireEvent.change(qrInput, {
    target: {
      files: [new File(["image fixture"], "qr.png", { type: "image/png" })],
    },
  });
  fireEvent.click(screen.getByRole("checkbox"));
  await waitFor(() =>
    assert.equal(
      screen.getByRole("button", { name: "Lưu QR nhận học phí MoMo" }).disabled,
      false,
    ),
  );
  fireEvent.submit(
    screen
      .getByRole("button", { name: "Lưu QR nhận học phí MoMo" })
      .closest("form"),
  );
  await waitFor(() => assert.ok(walletSaved));
  check(
    "MoMo setup submits receiver identity, selected QR and confirmation as admin",
    walletSaved.body.receiverName === "Ví kiểm thử" &&
      walletSaved.body.confirmReceivingQr === true &&
      walletSaved.file.name === "qr.png" &&
      walletSaved.token === "admin-test",
  );
  cleanup();
  api.configureMomoWallet = originalConfigureWallet;
  URL.createObjectURL = originalCreateUrl;
  URL.revokeObjectURL = originalRevokeUrl;
  api.platform = originalPlatform;
  const { PathComparison, WeeklyPlan, PathProgress } =
    await server.ssrLoadModule("/src/components/PathPlanTools.jsx");
  const planned = {
    id: "fast",
    title: "Ứng dụng nhanh",
    estimatedSeconds: 2700,
    remainingSeconds: 1800,
    reviewSeconds: 0,
    practiceSeconds: 300,
    estimatedWeeks: 1,
    fitsBudget: true,
    recommended: true,
    progress: { completed: 1, total: 2, percent: 50 },
    nextLessonId: 12,
    schedule: {
      weeks: [
        {
          week: 1,
          estimatedSeconds: 1800,
          withinTarget: true,
          tasks: [
            {
              lessonId: 12,
              title: "Bài tiếp theo",
              activity: "LEARN",
              estimatedSeconds: 1800,
            },
          ],
        },
      ],
      unscheduledSeconds: 0,
    },
  };
  render(React.createElement(PathComparison, { plans: [planned] }));
  check(
    "Plan comparison clearly separates remaining study time and practice estimates",
    screen.getByRole("table").textContent.includes("30 phút") &&
      screen.getByRole("table").textContent.includes("5 phút"),
  );
  cleanup();
  render(React.createElement(PathProgress, { plan: planned }));
  check(
    "Plan progress bar reflects server completion percentage",
    screen.getByRole("progressbar").getAttribute("aria-valuenow") === "50",
  );
  cleanup();
  render(
    React.createElement(
      MemoryRouter,
      null,
      React.createElement(WeeklyPlan, {
        plan: planned,
        courseId: 7,
        selected: true,
        stale: false,
      }),
    ),
  );
  check(
    "Weekly schedule resumes the server-selected next eligible lesson",
    screen
      .getByRole("link", { name: /Học bài tiếp theo/ })
      .getAttribute("href") === "/learn/7/12" &&
      screen
        .getByText(/Học bài:/)
        .closest("li")
        .textContent.includes("30 phút"),
  );
  cleanup();
  render(
    React.createElement(
      MemoryRouter,
      null,
      React.createElement(WeeklyPlan, {
        plan: planned,
        courseId: 7,
        selected: true,
        stale: true,
      }),
    ),
  );
  check(
    "Stale curriculum never offers the old schedule resume action",
    !screen.queryByRole("link", { name: /Học bài tiếp theo/ }),
  );
  cleanup();
  api.platform = originalPlatform;
  const { default: CourseSearch } = await server.ssrLoadModule(
    "/src/components/CourseSearch.jsx",
  );
  const originalSuggestions = api.courseSuggestions;
  let searched = [];
  api.courseSuggestions = async (query) => {
    searched.push(query);
    return query === "ex"
      ? [
          { id: 65, title: "Excel thực hành" },
          { id: 80, title: "Excel phân tích" },
        ]
      : [];
  };
  function SearchLocation() {
    const location = useLocation();
    return React.createElement(
      "p",
      { "data-testid": "search-location" },
      location.pathname,
    );
  }
  render(
    React.createElement(
      MemoryRouter,
      null,
      React.createElement(CourseSearch),
      React.createElement(SearchLocation),
    ),
  );
  const searchBox = screen.getByRole("combobox");
  fireEvent.focus(searchBox);
  fireEvent.change(searchBox, { target: { value: "x" } });
  await new Promise((resolve) => setTimeout(resolve, 250));
  check(
    "Navbar autocomplete does not query or show a list for one character",
    searched.length === 0 && !screen.queryByRole("listbox"),
  );
  fireEvent.change(searchBox, { target: { value: "ex" } });
  await screen.findByRole("option", { name: "Excel thực hành" });
  check(
    "Navbar shows clickable related course suggestions after two characters",
    screen.getAllByRole("option").length === 2 && searched.includes("ex"),
  );
  fireEvent.keyDown(searchBox, { key: "ArrowDown" });
  fireEvent.keyDown(searchBox, { key: "Enter" });
  check(
    "Autocomplete Enter opens the highlighted course directly",
    screen.getByTestId("search-location").textContent === "/courses/65",
  );
  fireEvent.focus(searchBox);
  fireEvent.change(searchBox, { target: { value: "qzx" } });
  await screen.findByText("Không có khóa học phù hợp.");
  check(
    "Unrelated autocomplete text never displays all catalog courses",
    screen.queryAllByRole("option").length === 0,
  );
  fireEvent.keyDown(searchBox, { key: "Escape" });
  check(
    "Autocomplete Escape closes the suggestion panel",
    !screen.queryByRole("listbox"),
  );
  cleanup();
  api.courseSuggestions = originalSuggestions;
  const { default: PaymentReview } = await server.ssrLoadModule(
    "/src/components/PaymentReview.jsx",
  );
  let reviewSent;
  api.platform = async (path, token, body) => {
    if (body) {
      reviewSent = body;
      return { message: "Đã xác nhận" };
    }
    if (path === "/payments/momo/wallet")
      return {
        mode: "personal",
        wallet: {
          receiverName: "Ví kiểm thử",
          receiverPhone: "0000000000",
          qrDataUrl: "data:image/png;base64,AA==",
        },
      };
    return {
      walletConfigured: true,
      requests: [
        {
          id: "simple-momo",
          orderId: 41,
          course: "Khóa kiểm thử",
          learner: "Học viên kiểm thử",
          method: "MOMO_WALLET",
          reference: "VEDUTEST41",
          amount: 449000,
          status: "REVIEW",
          orderStatus: "PENDING",
          learnerNote: "#154131562196",
        },
      ],
    };
  };
  render(
    React.createElement(PaymentReview, { auth: { accessToken: "admin-test" } }),
  );
  await screen.findByText("Khóa kiểm thử");
  check(
    "Admin payment review avoids retyping amount and reference",
    !screen.queryByLabelText("Số tiền thực nhận") &&
      !screen.queryByLabelText("Nội dung/mã đơn đã đối chiếu"),
  );
  check(
    "Admin payment review suggests a transaction ID from a plain learner note",
    screen.getByLabelText("Mã giao dịch MoMo đã nhận tiền").value ===
      "154131562196",
  );
  fireEvent.click(
    screen.getByRole("checkbox", { name: /Tôi đã kiểm tra trong MoMo/ }),
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Xác nhận nhận tiền & mở khóa" }),
  );
  await waitFor(() => assert.ok(reviewSent));
  check(
    "Simplified approval sends the exact server amount and reference",
    reviewSent.receivedAmount === 449000 &&
      reviewSent.receivedReference === "VEDUTEST41" &&
      reviewSent.verified === true,
  );
  cleanup();
  api.platform = originalPlatform;
  const { default: MomoQrImage } = await server.ssrLoadModule(
    "/src/components/MomoQrImage.jsx",
  );
  render(
    React.createElement(MomoQrImage, { src: "data:image/png;base64,AA==" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Phóng to QR" }));
  check(
    "Learner QR supports a large accessible scan dialog",
    !!screen.getByRole("dialog", { name: "QR MoMo phóng to" }),
  );
  fireEvent.keyDown(document, { key: "Escape" });
  check("Escape closes the enlarged QR", !screen.queryByRole("dialog"));
  cleanup();
  if (process.env.VEDU_WRITE_UI_REPORT === "1") writeFileSync(
    new URL("../docs/validation/ui-interactions.json", import.meta.url),
    JSON.stringify(
      {
        checkedAt: new Date().toISOString(),
        checks,
        environment:
          "React components in JSDOM via Vite. Behavior verified; no browser layout/screenshot verification.",
      },
      null,
      2,
    ),
  );
} finally {
  cleanup();
  await server.close();
  dom.window.close();
}
