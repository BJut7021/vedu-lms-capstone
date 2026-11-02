import { Injectable, NotFoundException } from '@nestjs/common';
import { resolve } from 'path';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { Course } from '../entities/course.entity';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(filters: { q?: string; topic?: string; sort?: string } = {}) {
    const query = filters.q?.trim().slice(0, 200) || '';
    const pattern = query.replace(/[\\%_]/g, '\\$&');
    const topic = filters.topic?.trim().slice(0, 80) || '';
    const rows = await this.dataSource.query(
      `
            SELECT
                c.course_id AS "id",
                c.course_name AS "title",
                c.description,
                c.topic,
                c.thumbnail_url AS "image",
                c.price,
                c.currency,
                u.full_name AS "instructor",
                COALESCE(ls.lesson_count, 0)::int AS "lessons",
                COALESCE(es.student_count, 0)::int AS "students",
                COALESCE(ls.duration_seconds, 0)::int AS "durationSeconds"
            FROM lms.courses c
            JOIN auth.users u ON u.user_id = c.teacher_id
            LEFT JOIN LATERAL (
                SELECT
                    COUNT(*) AS lesson_count,
                    COALESCE(SUM(l.estimated_duration_seconds), 0) AS duration_seconds
                FROM lms.lessons l
                WHERE l.course_id = c.course_id
                  AND l.is_deleted = FALSE
                  AND l.is_published = TRUE
            ) ls ON TRUE
            LEFT JOIN LATERAL (
                SELECT COUNT(*) AS student_count
                FROM enrollment.enrollments e
                JOIN auth.users learner ON learner.user_id = e.student_id
                WHERE e.course_id = c.course_id
                  AND e.status IN ('ACTIVE', 'COMPLETED')
                  AND NOT learner.is_test_account
            ) es ON TRUE
            WHERE c.status = 'PUBLISHED' AND c.is_deleted = FALSE
              AND ($1 = '' OR public.unaccent(lower(c.course_name)) LIKE '%' || public.unaccent(lower($1)) || '%'
                   OR (length($1)>=3 AND (public.unaccent(lower(COALESCE(c.topic,''))) LIKE '%' || public.unaccent(lower($1)) || '%'
                   OR public.unaccent(lower(u.full_name)) LIKE '%' || public.unaccent(lower($1)) || '%')))
              AND ($2 = '' OR COALESCE(c.topic, 'Tổng hợp') = $2)
            ORDER BY
                CASE WHEN $3 = 'popular' THEN COALESCE(es.student_count, 0) END DESC,
                CASE WHEN $3 = 'price-asc' THEN c.price END ASC,
                c.created_at DESC, c.course_id DESC
        `,
      [pattern, topic, filters.sort || 'newest'],
    );

    return rows.map((row: Record<string, unknown>) => ({
      ...row,
      description:
        typeof row.description === 'string'
          ? row.description.replace(
              /\[VEDU-(?:OFFICE|COMPUTING)-v1:[a-z]+\]\s*/g,
              '',
            )
          : row.description,
      id: Number(row.id),
      lessons: Number(row.lessons),
      students: Number(row.students),
      durationSeconds: Number(row.durationSeconds),
      rating: null,
    }));
  }

  async suggestions(value = '') {
    const query = value.trim().slice(0, 120);
    if (Array.from(query).length < 2) return [];
    const literal = query.replace(/[\\%_]/g, '\\$&');
    const rows = await this.dataSource.query(
      `SELECT course_id AS id,course_name AS title FROM lms.courses
       WHERE status='PUBLISHED' AND NOT is_deleted
       AND public.unaccent(lower(course_name)) LIKE '%' || public.unaccent(lower($1)) || '%'
       ORDER BY (public.unaccent(lower(course_name)) LIKE public.unaccent(lower($1)) || '%') DESC,course_name,course_id LIMIT 5`,
      [literal],
    );
    return rows.map((r: any) => ({ id: Number(r.id), title: r.title }));
  }

  async findOne(courseId: number, includeContent = true) {
    const courses = await this.dataSource.query(
      `
            SELECT
                c.course_id AS "id",
                c.course_name AS "title",
                c.description,
                c.topic,
                c.thumbnail_url AS "image",
                c.price,
                c.currency,
                c.updated_at AS "updatedAt",
                u.full_name AS "instructor",
                COUNT(DISTINCT e.enrollment_id)::int AS "students"
            FROM lms.courses c
            JOIN auth.users u ON u.user_id = c.teacher_id
            LEFT JOIN enrollment.enrollments e
                ON e.course_id = c.course_id
                AND e.status IN ('ACTIVE', 'COMPLETED')
                AND EXISTS (SELECT 1 FROM auth.users learner WHERE learner.user_id=e.student_id AND NOT learner.is_test_account)
            WHERE c.course_id = $1
              AND c.status = 'PUBLISHED'
              AND c.is_deleted = FALSE
            GROUP BY c.course_id, u.full_name
        `,
      [courseId],
    );

    if (courses.length === 0) {
      throw new NotFoundException(`Khóa học ${courseId} không tồn tại`);
    }

    const lessons = await this.dataSource.query(
      `
            SELECT
                l.lesson_id AS "id",
                l.title,
                l.content,
                l.lesson_order AS "lessonOrder",
                l.section_id AS "sectionId",
                l.estimated_duration_seconds AS "durationSeconds",
                r.resource_type AS "resourceType",
                r.resource_url AS "resourceUrl",
                q.quiz_id AS "quizId"
            FROM lms.lessons l
            LEFT JOIN LATERAL (
                SELECT lr.resource_type, lr.resource_url
                FROM lms.lesson_resources lr
                WHERE lr.lesson_id = l.lesson_id
                ORDER BY lr.display_order, lr.resource_id
                LIMIT 1
            ) r ON TRUE
            LEFT JOIN assessment.quizzes q
                ON q.lesson_id = l.lesson_id
                AND q.is_published = TRUE
                AND q.is_deleted = FALSE
            WHERE l.course_id = $1
              AND l.is_published = TRUE
              AND l.is_deleted = FALSE
            ORDER BY l.lesson_order
        `,
      [courseId],
    );

    const course = courses[0] as Record<string, unknown>;
    const totalDuration = lessons.reduce(
      (sum: number, lesson: Record<string, unknown>) =>
        sum + Number(lesson.durationSeconds ?? 0),
      0,
    );

    const chapters: any[] = await this.dataSource.query(
      'SELECT section_id AS id,title FROM lms.course_sections WHERE course_id=$1 ORDER BY section_order',
      [courseId],
    );
    const result = {
      ...course,
      description:
        typeof course.description === 'string'
          ? course.description.replace(
              /\[VEDU-(?:OFFICE|COMPUTING)-v1:[a-z]+\]\s*/g,
              '',
            )
          : course.description,
      id: Number(course.id),
      students: Number(course.students),
      rating: null,
      durationSeconds: totalDuration,
      sections: [
        {
          id: 'course-content',
          title: 'Nội dung khóa học',
          lessons: lessons.map((lesson: Record<string, unknown>) => {
            const resourceType =
              typeof lesson.resourceType === 'string'
                ? lesson.resourceType
                : 'DOCUMENT';

            return {
              ...lesson,
              content: includeContent ? lesson.content : null,
              resourceUrl: includeContent ? lesson.resourceUrl : null,
              id: Number(lesson.id),
              lessonOrder: Number(lesson.lessonOrder),
              durationSeconds: Number(lesson.durationSeconds ?? 0),
              quizId: lesson.quizId ? Number(lesson.quizId) : null,
              type: lesson.quizId ? 'quiz' : resourceType.toLowerCase(),
              videoUrl:
                includeContent && resourceType === 'VIDEO'
                  ? lesson.resourceUrl
                  : null,
              completed: false,
            };
          }),
        },
      ],
    };
    const mapped = result.sections[0].lessons as {
      id: number;
      title: string;
      type: string;
      sectionId?: unknown;
      [key: string]: unknown;
    }[];
    result.sections = [
      ...chapters.map((s) => ({
        id: String(s.id),
        title: s.title,
        lessons: mapped.filter((l) => String(l.sectionId) === String(s.id)),
      })),
      {
        id: 'course-content',
        title: 'Nội dung khóa học',
        lessons: mapped.filter((l) => !l.sectionId),
      },
    ].filter((s) => s.lessons.length > 0);
    const courseQuizzes: any[] = await this.dataSource.query(
      'SELECT quiz_id,title,time_limit_seconds FROM assessment.quizzes WHERE course_id=$1 AND lesson_id IS NULL AND is_published AND NOT is_deleted ORDER BY quiz_id',
      [courseId],
    );
    if (courseQuizzes.length)
      result.sections.push({
        id: 'course-assessment',
        title: 'Bài kiểm tra khóa học',
        lessons: courseQuizzes.map((q) => ({
          id: -Number(q.quiz_id),
          title: q.title,
          type: 'quiz',
          quizId: Number(q.quiz_id),
          durationSeconds: Number(q.time_limit_seconds ?? 600),
          completed: false,
        })) as any,
      });
    return { ...result, overview: await this.overview(courseId) };
  }
  async overview(courseId: number) {
    const [saved] = await this.dataSource.query(
      'SELECT * FROM lms.course_overviews WHERE course_id=$1',
      [courseId],
    );
    const pedagogy: any[] = await this.dataSource.query(
      `SELECT p.outcomes FROM lms.lessons l JOIN lms.lesson_pedagogy p USING(lesson_id)
       WHERE l.course_id=$1 AND l.is_published AND NOT l.is_deleted
       AND l.title !~* '^(00[ ·.:_-]|.*hướng dẫn)' ORDER BY l.lesson_order,l.lesson_id`,
      [courseId],
    );
    const outcomes = saved?.outcomes?.length
      ? saved.outcomes
      : [
          ...new Set<string>(
            pedagogy
              .flatMap((p) => p.outcomes)
              .filter((v) => typeof v === 'string' && v.trim()),
          ),
        ];
    const quizzes: any[] = await this.dataSource.query(
      `SELECT title,passing_score,max_attempts,COALESCE(time_limit_seconds,600) AS time_limit_seconds,
       (lesson_id IS NULL AND title LIKE 'Thi cuối khóa —%') AS requires_completed_lessons
       FROM assessment.quizzes WHERE course_id=$1 AND is_published AND NOT is_deleted ORDER BY quiz_id`,
      [courseId],
    );
    const [count] = await this.dataSource.query(
      'SELECT count(*)::int n FROM lms.lessons WHERE course_id=$1 AND is_published AND NOT is_deleted',
      [courseId],
    );
    const resource = await this.syllabusResource(courseId);
    return {
      audience: saved?.audience || '',
      preparation: saved?.preparation || '',
      outcomes,
      practiceNote: saved?.practice_note || '',
      lessonCount: count.n,
      assessments: quizzes.map((q) => ({
        title: q.title,
        passingScore: Number(q.passing_score),
        maxAttempts: Number(q.max_attempts),
        durationSeconds: Number(q.time_limit_seconds),
        requiresCompletedLessons: q.requires_completed_lessons,
      })),
      syllabus: resource
        ? {
            title: resource.title,
            type: resource.resource_type,
            url: resource.resource_url.startsWith('vedu-file:')
              ? `/api/courses/${courseId}/syllabus`
              : resource.resource_url,
          }
        : null,
    };
  }
  private async syllabusResource(courseId: number) {
    const [r] = await this.dataSource.query(
      `SELECT r.* FROM lms.course_overviews o JOIN lms.courses c USING(course_id)
       JOIN lms.lesson_resources r ON r.resource_id=o.syllabus_resource_id
       JOIN lms.lessons l ON l.lesson_id=r.lesson_id AND l.course_id=o.course_id
       WHERE o.course_id=$1 AND c.status='PUBLISHED' AND NOT c.is_deleted AND l.is_published AND NOT l.is_deleted
       AND r.resource_type IN ('PDF','LINK','DOCUMENT')`,
      [courseId],
    );
    if (!r) return null;
    const url = String(r.resource_url);
    if (
      /^vedu-file:[a-f0-9-]{36}\.pdf$/.test(url) ||
      url.startsWith('https://') ||
      /^\/course-materials\/[a-z]+\/\d+\.html$/.test(url)
    )
      return r;
    return null;
  }
  async syllabus(courseId: number) {
    const r = await this.syllabusResource(courseId);
    if (!r || !/^vedu-file:[a-f0-9-]{36}\.pdf$/.test(r.resource_url))
      throw new NotFoundException('Khóa học chưa công bố đề cương PDF');
    return resolve(
      process.env.MEDIA_DIR || './media',
      r.resource_url.slice('vedu-file:'.length),
    );
  }
}
