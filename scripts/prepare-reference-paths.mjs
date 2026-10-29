// Annotate the existing source-preserving reference course. Never changes Kaggle IDs/mappings/history.
const base = process.env.VEDU_BASE_URL || "http://localhost:5173";
let auth;
async function call(path, body, method) {
  const r = await fetch(base + "/api" + path, {
    method: method || (body ? "POST" : "GET"),
    headers: {
      "Content-Type": "application/json",
      ...(auth ? { Authorization: `Bearer ${auth.accessToken}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const b = await r.json();
  if (!r.ok) throw Error(`${path}: ${r.status} ${b.message}`);
  return b;
}
const config = [
  ["What is OneDrive for Business?", "CONCEPT", 1, true, []],
  ["Add, restore, delete documents on OneDrive", "PRACTICE", 1, true, [1]],
  ["Share documents", "PRACTICE", 2, false, [1, 2]],
  ["Recycle bin", "PRACTICE", 1, false, [1, 2]],
  [
    "Sync OneDrive for Business to your computer (Windows 10 - 1709)",
    "PRACTICE",
    3,
    false,
    [1, 2],
  ],
  [
    "Work with documents in a synced library folder (Windows 10 - 1709)",
    "PRACTICE",
    3,
    false,
    [5],
  ],
  [
    "Change location where you sync libraries on your computer (Windows 10 - 1709)",
    "PRACTICE",
    3,
    false,
    [5],
  ],
  ["Introduction and how to use Outlook Online", "CONCEPT", 1, false, []],
  [
    "Create a new message, with attachments and options",
    "PRACTICE",
    1,
    false,
    [8],
  ],
  ["Search and built-in filters", "PRACTICE", 2, false, [8]],
];
try {
  auth = await call("/auth/login", {
    username: process.env.VEDU_TEACHER_USERNAME || "teacher",
    password: process.env.VEDU_TEACHER_PASSWORD || "Demo@123",
    expectedRole: "TEACHER",
  });
  const c = (await call("/portal/overview")).courses.find(
    (c) => c.courseName === "Office 365 — Nội dung tham chiếu Kaggle",
  );
  if (!c) throw Error("Run prepare-reference-course.py first");
  const content = await call(`/platform/courses/${c.courseId}/content`);
  const matches = config.map(([title]) =>
    content.lessons.find((l) => l.title === title),
  );
  if (matches.some((l) => !l))
    throw Error(
      "Reference course content differs; do not auto-assign pedagogy to unrelated items",
    );
  for (const [
    i,
    [title, kind, difficulty, isCore, requires],
  ] of config.entries()) {
    const lesson = matches[i];
    if (
      content.pedagogy.some(
        (p) => String(p.lesson_id) === String(lesson.lesson_id),
      )
    )
      continue;
    const current = {
      title: i < 7 ? "OneDrive help & learning" : "Outlook help & learning",
      provider: "Microsoft Support",
      url:
        i < 7
          ? "https://support.microsoft.com/en-us/onedrive"
          : "https://support.microsoft.com/en-us/outlook",
      rights:
        "Liên kết tài liệu hiện tại để đối chiếu; metadata Kaggle có giao diện cũ, không coi là hướng dẫn đã thẩm định.",
    };
    await call(
      `/platform/lessons/${lesson.lesson_id}/pedagogy`,
      {
        difficulty,
        kind,
        isCore,
        skills: [i < 7 ? "onedrive" : "outlook"],
        goals: ["OFFICE", "STUDENT"],
        outcomes: [
          `Đọc và đối chiếu nội dung nguồn: ${title}. Không thao tác trên dữ liệu thật khi chưa được phép.`,
        ],
        prerequisites: requires.map((n) => Number(matches[n - 1].lesson_id)),
        sources: [
          {
            title: "E-learning Recommender System Dataset — metadata gốc",
            url: "https://www.kaggle.com/datasets/nhondangcode/e-learning-recommender-system-dataset",
            provider: "Kaggle / nhondangcode",
            rights:
              "Nguồn dữ liệu nhóm cung cấp; cần xác minh giấy phép/nguồn thu thập trước khi phát hành công khai. Không giả nhận là log VEDU.",
          },
          current,
        ],
        contentKey: `office-ref-v1.item-${i + 1}`,
      },
      "PATCH",
    );
  }
  console.log(
    "Reference pedagogy ready:",
    c.courseId,
    "(no interactions, IDs or approved mappings changed).",
  );
} finally {
  if (auth)
    await call("/auth/revoke", { refreshToken: auth.refreshToken }).catch(
      () => {},
    );
}
