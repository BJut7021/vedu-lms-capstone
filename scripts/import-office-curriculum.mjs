import {
  officeCurriculum,
  materialSources,
} from "../data/learning/office-curriculum.mjs";
import { writeFileSync, mkdirSync } from "node:fs";
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
  const data = await r.json().catch(() => null);
  if (!r.ok) throw Error(`${path}: ${r.status} ${data?.message || ""}`);
  return data;
}
const summary = [];
try {
  auth = await call("/auth/login", {
    username: process.env.VEDU_TEACHER_USERNAME || "teacher",
    password: process.env.VEDU_TEACHER_PASSWORD || "Demo@123",
    expectedRole: "TEACHER",
  });
  let owned = (await call("/portal/overview")).courses;
  for (const course of officeCurriculum) {
    // Match only this import's own source marker, never replace a user's existing course with the same title.
    const marker = `[VEDU-OFFICE-v1:${course.key}]`;
    const existing = owned.find((c) => c.description?.includes(marker));
    const created =
      existing ||
      (await call("/portal/teacher/courses", {
        name: course.name,
        topic: course.topic,
        price: 0,
        description: `${marker}\n${course.summary}\nBài tập gốc VEDU; tài liệu/video bên ngoài giữ nguồn. Không phải chương trình hay chứng nhận chính thức của Microsoft/LibreOffice/LearnFree.`,
      }));
    const id = Number(created.courseId);
    const content = await call(`/platform/courses/${id}/content`);
    const ids = [];
    for (const [index, item] of course.lessons.entries()) {
      let l = content.lessons.find((l) =>
        l.content?.includes(
          `[VEDU-LESSON:office-v1.${course.key}.${item.key}]`,
        ),
      );
      if (!l) {
        l = await call(`/portal/teacher/courses/${id}/lessons`, {
          title: item.title,
          durationSeconds: item.seconds,
          content: `[VEDU-LESSON:office-v1.${course.key}.${item.key}]\n${item.content}`,
        });
        await call(
          `/platform/lessons/${l.lessonId}`,
          {
            title: item.title,
            content: `[VEDU-LESSON:office-v1.${course.key}.${item.key}]\n${item.content}`,
            durationSeconds: item.seconds,
            isPublished: true,
          },
          "PATCH",
        );
      }
      const lessonId = Number(l.lessonId ?? l.lesson_id);
      ids.push(lessonId);
      for (const source of materialSources(course, item))
        if (!l.resources?.some((r) => r.resource_url === source.url))
          await call(`/platform/lessons/${lessonId}/resources`, {
            type: source === course.video ? "VIDEO" : "LINK",
            title: source.title,
            url: source.url,
          });
      await call(
        `/platform/lessons/${lessonId}/pedagogy`,
        {
          difficulty: item.difficulty,
          kind: item.kind,
          isCore: item.core,
          skills: [course.key],
          goals: item.goals,
          prerequisites: item.requires.map((n) => ids[n - 1]),
          outcomes: item.outcomes,
          sources: materialSources(course, item),
          contentKey: `office-v1.${course.key}.${item.key}`,
        },
        "PATCH",
      );
      console.log(`Ready ${course.key} ${index + 1}/${course.lessons.length}`);
    }
    if (
      !content.quizzes?.some(
        (q) => q.title === "Kiểm tra vận dụng — " + course.name,
      )
    )
      await call(`/platform/courses/${id}/quizzes`, {
        title: "Kiểm tra vận dụng — " + course.name,
        timeLimitSeconds: 600,
        passingScore: 7,
        maxAttempts: 5,
        questions: course.questions,
      });
    await call(
      `/portal/teacher/courses/${id}/status`,
      { status: "PUBLISHED" },
      "PATCH",
    );
    summary.push({
      courseId: id,
      key: course.key,
      title: course.name,
      lessons: ids.length,
      lessonIds: ids,
      publicationStatus: 'PENDING_ADMIN_REVIEW',
    });
  }
  mkdirSync(new URL("../docs/validation/", import.meta.url), {
    recursive: true,
  });
  writeFileSync(
    new URL("../docs/validation/office-content-import.json", import.meta.url),
    JSON.stringify(
      {
        version: "office-v1",
        courses: summary,
        provenance:
          "Original VEDU exercises + linked primary documentation/video. No learner interactions generated.",
      },
      null,
      2,
    ),
  );
  console.log(JSON.stringify(summary, null, 2));
} finally {
  if (auth)
    await call("/auth/revoke", { refreshToken: auth.refreshToken }).catch(
      () => {},
    );
}
