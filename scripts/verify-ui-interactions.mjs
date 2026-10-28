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
        lessons: [
          {
            id: 11,
            title: "Bài một",
            type: "document",
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
  function Room() {
    const p = useParams();
    return React.createElement(Classroom, {
      course,
      activeLessonId: Number(p.lessonId),
      token: "test",
      header: React.createElement("header", null, "VEDU"),
      onBack: () => {},
      onOpenQuiz: () => {},
      onLogEvent: async () => ({}),
    });
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
  fireEvent.click(screen.getByRole("button", { name: "Tôi đã đọc tài liệu" }));
  await waitFor(() => screen.getByRole("button", { name: "Đã đọc tài liệu" }));
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
  fireEvent.click(screen.getByRole("tab", { name: "Tài liệu" }));
  check(
    "Documents tab displays actual lesson attachment",
    screen.getAllByText("Tài liệu bài hai").length > 0,
  );
  for (const label of ["PDF", "PPT", "DOC", "WEB"])
    check(
      `Related resources display correct ${label} file icon`,
      screen.getAllByRole("img", { name: `Định dạng ${label}` }).length > 0,
    );
  fireEvent.keyDown(screen.getByRole("tab", { name: "Tài liệu" }), {
    key: "ArrowLeft",
  });
  check(
    "Tabs support keyboard switching",
    screen
      .getByRole("tab", { name: "Bài giảng" })
      .getAttribute("aria-selected") === "true",
  );
  cleanup();
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
  const { formatMinutes } = await server.ssrLoadModule("/src/services/time.js");
  check(
    "Course minutes preserve short and fractional durations",
    formatMinutes(900) === "15 phút" &&
      formatMinutes(90) === "1,5 phút" &&
      formatMinutes(1) === "0,02 phút",
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
        lesson: { ...course.sections[0].lessons[0], type: "video" },
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
    "Classroom uses minutes for real watch duration and removes estimated sidebar line",
    screen.getByText("1,5 phút").textContent === "1,5 phút" &&
      !document.body.textContent.includes("giây") &&
      !document.body.textContent.includes("đọc dự kiến"),
  );
  cleanup();
  const { default: CourseImage } = await server.ssrLoadModule(
    "/src/components/CourseImage.jsx",
  );
  const { resolveCourseCover } = await server.ssrLoadModule(
    "/src/services/courseCovers.js",
  );
  const networkCourse = { id: 69, title: "Mạng máy tính", image: null };
  render(React.createElement(CourseImage, { course: networkCourse }));
  check(
    "Reviewed course uses its own local cover",
    screen.getByRole("img", { name: "Mạng máy tính" }).getAttribute("src") ===
      "/images/course-covers/v2/course-69.webp",
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
      "/images/course-covers/v2/course-69.webp",
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
      id: 3,
      title: "PostgreSQL và thiết kế dữ liệu LMS",
      image: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=900",
    }).primary === "/images/course-covers/v2/course-3.webp",
  );
  const unknown = resolveCourseCover({ id: 99999, title: "Mạng máy tính" });
  check(
    "Different course with the same name never reuses another course cover",
    !unknown.primary &&
      unknown.fallback !== resolveCourseCover(networkCourse).fallback,
  );
  writeFileSync(
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
