import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { Course } from '../entities/course.entity';

@Injectable()
export class CoursesService {
    constructor(
        @InjectRepository(Course)
        private readonly courseRepository: Repository<Course>,
        private readonly dataSource: DataSource,
    ) { }

    async findAll() {
        const rows = await this.dataSource.query(`
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
                WHERE e.course_id = c.course_id
                  AND e.status IN ('ACTIVE', 'COMPLETED')
            ) es ON TRUE
            WHERE c.status = 'PUBLISHED' AND c.is_deleted = FALSE
            ORDER BY c.created_at DESC, c.course_id ASC
        `);

        return rows.map((row: Record<string, unknown>) => ({
            ...row,
            id: Number(row.id),
            lessons: Number(row.lessons),
            students: Number(row.students),
            durationSeconds: Number(row.durationSeconds),
            rating: 4.9,
        }));
    }

    async findOne(courseId: number) {
        const courses = await this.dataSource.query(`
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
            WHERE c.course_id = $1
              AND c.status = 'PUBLISHED'
              AND c.is_deleted = FALSE
            GROUP BY c.course_id, u.full_name
        `, [courseId]);

        if (courses.length === 0) {
            throw new NotFoundException(`Khóa học ${courseId} không tồn tại`);
        }

        const lessons = await this.dataSource.query(`
            SELECT
                l.lesson_id AS "id",
                l.title,
                l.content,
                l.lesson_order AS "lessonOrder",
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
        `, [courseId]);

        const course = courses[0] as Record<string, unknown>;
        const totalDuration = lessons.reduce(
            (sum: number, lesson: Record<string, unknown>) =>
                sum + Number(lesson.durationSeconds ?? 0),
            0,
        );

        return {
            ...course,
            id: Number(course.id),
            students: Number(course.students),
            rating: 4.9,
            durationSeconds: totalDuration,
            sections: [{
                id: 'course-content',
                title: 'Nội dung khóa học',
                lessons: lessons.map((lesson: Record<string, unknown>) => {
                    const resourceType = typeof lesson.resourceType === 'string'
                        ? lesson.resourceType
                        : 'DOCUMENT';

                    return {
                        ...lesson,
                        id: Number(lesson.id),
                        lessonOrder: Number(lesson.lessonOrder),
                        durationSeconds: Number(lesson.durationSeconds ?? 0),
                        quizId: lesson.quizId ? Number(lesson.quizId) : null,
                        type: lesson.quizId
                            ? 'quiz'
                            : resourceType.toLowerCase(),
                        videoUrl: resourceType === 'VIDEO'
                            ? lesson.resourceUrl
                            : null,
                        completed: false,
                    };
                }),
            }],
        };
    }
}
