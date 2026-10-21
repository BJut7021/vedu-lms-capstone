import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { UserRole } from '../entities/user.entity';

type FeedbackInput = {
    action: string;
    rating?: number;
    comment?: string;
};

type TicketInput = {
    subject: string;
    category?: string;
    priority?: string;
    message?: string;
};

@Injectable()
export class PortalService {
    constructor(private readonly dataSource: DataSource) { }

    overview(userId: number, role: UserRole) {
        if (role === 'TEACHER') return this.teacherOverview(userId);
        if (role === 'ADMIN') return this.adminOverview();
        return this.studentOverview(userId);
    }

    private async studentOverview(userId: number) {
        const [statsRows, courses, attempts, recommendations, certificates, tickets, orders, sessions] =
            await Promise.all([
                this.dataSource.query(`
                    SELECT
                        (SELECT COUNT(*)::int FROM enrollment.enrollments WHERE student_id=$1 AND status IN ('ACTIVE','COMPLETED')) AS "enrolledCourses",
                        (SELECT COUNT(*)::int FROM learning.lesson_progress WHERE student_id=$1 AND status='COMPLETED') AS "completedLessons",
                        (SELECT COUNT(*)::int FROM assessment.quiz_attempts WHERE student_id=$1 AND status IN ('SUBMITTED','GRADED')) AS "quizAttempts",
                        (SELECT COALESCE(ROUND(AVG(score),1),0) FROM assessment.quiz_attempts WHERE student_id=$1 AND status IN ('SUBMITTED','GRADED')) AS "averageScore"
                `, [userId]),
                this.dataSource.query(`
                    SELECT
                        p.course_id AS "courseId", p.course_name AS "courseName",
                        p.total_lessons::int AS "totalLessons",
                        p.completed_lessons::int AS "completedLessons",
                        p.progress_percent AS "progressPercent",
                        p.last_activity_at AS "lastActivityAt",
                        p.enrollment_status AS "status", c.thumbnail_url AS "image"
                    FROM learning.v_student_progress p
                    JOIN lms.courses c ON c.course_id = p.course_id
                    WHERE p.student_id = $1
                    ORDER BY p.last_activity_at DESC NULLS LAST, p.course_id
                `, [userId]),
                this.dataSource.query(`
                    SELECT
                        attempt_id AS "attemptId", quiz_id AS "quizId",
                        course_id AS "courseId", quiz_title AS "quizTitle",
                        attempt_no AS "attemptNo", score, status,
                        started_at AS "startedAt", submitted_at AS "submittedAt"
                    FROM assessment.v_quiz_results
                    WHERE student_id = $1
                    ORDER BY started_at DESC
                    LIMIT 8
                `, [userId]),
                this.dataSource.query(`
                    SELECT
                        recommendation_id AS "recommendationId",
                        course_id AS "courseId", course_name AS "courseName",
                        recommended_lesson_id AS "lessonId",
                        recommended_lesson_title AS "lessonTitle",
                        source_type AS "sourceType",
                        recommendation_score AS "score", reason, status,
                        generated_at AS "generatedAt", expires_at AS "expiresAt"
                    FROM learning.v_active_recommendations
                    WHERE student_id = $1 AND (source_type='FALLBACK' OR EXISTS(
                        SELECT 1 FROM learning.model_registry m JOIN learning.experiments x ON x.experiment_id::text=m.model_version WHERE m.model_id=v_active_recommendations.model_id AND x.status='SUCCEEDED'))
                    ORDER BY recommendation_order, recommendation_score DESC
                `, [userId]),
                this.dataSource.query(`
                    SELECT
                        certificate_id AS "certificateId", course_id AS "courseId",
                        certificate_code AS "certificateCode", status,
                        issued_at AS "issuedAt", file_url AS "fileUrl"
                    FROM lms.certificates
                    WHERE student_id = $1
                    ORDER BY issued_at DESC
                `, [userId]),
                this.dataSource.query(`
                    SELECT
                        ticket_id AS "ticketId", subject, category, priority, status,
                        created_at AS "createdAt", updated_at AS "updatedAt"
                    FROM support.tickets
                    WHERE student_id = $1
                    ORDER BY created_at DESC
                    LIMIT 10
                `, [userId]),
                this.dataSource.query(`
                    SELECT
                        o.order_id AS "orderId", o.course_id AS "courseId",
                        c.course_name AS "courseName", o.final_amount AS "amount",
                        o.currency, o.order_status AS "status",
                        o.payment_attempt_count::int AS "paymentAttempts",
                        o.paid_at AS "paidAt"
                    FROM payment.v_order_payment_status o
                    JOIN lms.courses c ON c.course_id = o.course_id
                    WHERE o.student_id = $1
                    ORDER BY o.order_id DESC
                `, [userId]),
                this.dataSource.query(`
                    SELECT
                        session_id AS "sessionId", device_info AS "deviceInfo",
                        last_used_at AS "lastUsedAt", expires_at AS "expiresAt",
                        revoked_at AS "revokedAt", created_at AS "createdAt"
                    FROM auth.user_sessions
                    WHERE user_id = $1
                    ORDER BY created_at DESC
                    LIMIT 10
                `, [userId]),
            ]);

        return {
            role: 'STUDENT',
            generatedAt: new Date().toISOString(),
            stats: statsRows[0],
            courses,
            attempts,
            recommendations,
            certificates,
            tickets,
            orders,
            sessions,
        };
    }

    private async teacherOverview(userId: number) {
        const [statsRows, courses, learners, attempts, quizzes] = await Promise.all([
            this.dataSource.query(`
                SELECT
                    COUNT(DISTINCT c.course_id)::int AS "totalCourses",
                    COUNT(DISTINCT c.course_id) FILTER (WHERE c.status = 'PUBLISHED')::int AS "publishedCourses",
                    COUNT(DISTINCT e.student_id)::int AS "totalStudents",
                    COUNT(DISTINCT qa.attempt_id) FILTER (WHERE qa.status IN ('SUBMITTED','GRADED'))::int AS "gradedAttempts"
                FROM lms.courses c
                LEFT JOIN enrollment.enrollments e ON e.course_id = c.course_id
                LEFT JOIN assessment.quiz_attempts qa ON qa.course_id = c.course_id
                WHERE (c.teacher_id = $1 OR EXISTS(SELECT 1 FROM lms.course_teachers ct WHERE ct.course_id=c.course_id AND ct.teacher_id=$1)) AND c.is_deleted = FALSE
            `, [userId]),
            this.dataSource.query(`
                SELECT
                    c.course_id AS "courseId", c.course_name AS "courseName",
                    c.description, c.status, c.price, c.updated_at AS "updatedAt",
                    COUNT(DISTINCT l.lesson_id) FILTER (WHERE l.is_deleted = FALSE)::int AS "lessonCount",
                    COUNT(DISTINCT e.student_id)::int AS "studentCount"
                FROM lms.courses c
                LEFT JOIN lms.lessons l ON l.course_id = c.course_id
                LEFT JOIN enrollment.enrollments e
                    ON e.course_id = c.course_id AND e.status IN ('ACTIVE','COMPLETED')
                WHERE (c.teacher_id = $1 OR EXISTS(SELECT 1 FROM lms.course_teachers ct WHERE ct.course_id=c.course_id AND ct.teacher_id=$1)) AND c.is_deleted = FALSE
                GROUP BY c.course_id
                ORDER BY c.updated_at DESC
            `, [userId]),
            this.dataSource.query(`
                SELECT
                    e.course_id AS "courseId", c.course_name AS "courseName",
                    u.user_id AS "studentId", u.full_name AS "studentName", u.email,
                    COALESCE(p.progress_percent, 0) AS "progressPercent",
                    e.status, e.enrolled_at AS "enrolledAt"
                FROM lms.courses c
                JOIN enrollment.enrollments e ON e.course_id = c.course_id
                JOIN auth.users u ON u.user_id = e.student_id
                LEFT JOIN learning.v_student_progress p
                    ON p.student_id = e.student_id AND p.course_id = e.course_id
                WHERE (c.teacher_id = $1 OR EXISTS(SELECT 1 FROM lms.course_teachers ct WHERE ct.course_id=c.course_id AND ct.teacher_id=$1)) AND c.is_deleted = FALSE
                ORDER BY e.enrolled_at DESC
                LIMIT 30
            `, [userId]),
            this.dataSource.query(`
                SELECT
                    r.attempt_id AS "attemptId", r.course_id AS "courseId",
                    c.course_name AS "courseName", r.student_name AS "studentName",
                    r.quiz_title AS "quizTitle", r.score, r.status,
                    r.submitted_at AS "submittedAt"
                FROM assessment.v_quiz_results r
                JOIN lms.courses c ON c.course_id = r.course_id
                WHERE (c.teacher_id = $1 OR EXISTS(SELECT 1 FROM lms.course_teachers ct WHERE ct.course_id=c.course_id AND ct.teacher_id=$1))
                ORDER BY r.started_at DESC
                LIMIT 20
            `, [userId]),
            this.dataSource.query(`
                SELECT
                    q.quiz_id AS "quizId", q.course_id AS "courseId",
                    c.course_name AS "courseName", q.title,
                    q.passing_score AS "passingScore", q.max_attempts AS "maxAttempts",
                    q.is_published AS "isPublished",
                    COUNT(qq.question_id)::int AS "questionCount",
                    q.updated_at AS "updatedAt"
                FROM assessment.quizzes q
                JOIN lms.courses c ON c.course_id = q.course_id
                LEFT JOIN assessment.questions qq ON qq.quiz_id = q.quiz_id
                WHERE (c.teacher_id = $1 OR EXISTS(SELECT 1 FROM lms.course_teachers ct WHERE ct.course_id=c.course_id AND ct.teacher_id=$1)) AND q.is_deleted = FALSE
                GROUP BY q.quiz_id, c.course_name
                ORDER BY q.updated_at DESC
            `, [userId]),
        ]);

        return {
            role: 'TEACHER',
            generatedAt: new Date().toISOString(),
            stats: statsRows[0],
            courses,
            learners,
            attempts,
            quizzes,
        };
    }

    private async adminOverview() {
        const [statsRows, users, miningRuns, patterns, settings, audits, tickets, orders] =
            await Promise.all([
                this.dataSource.query(`
                    SELECT
                        (SELECT COUNT(*)::int FROM auth.users) AS "totalUsers",
                        (SELECT COUNT(*)::int FROM auth.users WHERE is_active = TRUE) AS "activeUsers",
                        (SELECT COUNT(*)::int FROM lms.courses WHERE is_deleted = FALSE) AS "totalCourses",
                        (SELECT COUNT(*)::int FROM learning.learning_sequence_logs) AS "learningEvents",
                        (SELECT COUNT(*)::int FROM support.tickets WHERE status IN ('OPEN','IN_PROGRESS')) AS "openTickets"
                `),
                this.dataSource.query(`
                    SELECT
                        user_id AS "userId", full_name AS "fullName", email,
                        role, is_active AS "isActive", created_at AS "createdAt"
                    FROM auth.users
                    ORDER BY created_at DESC
                    LIMIT 30
                `),
                this.dataSource.query(`
                    SELECT
                        r.mining_run_id AS "runId", r.course_id AS "courseId",
                        c.course_name AS "courseName", r.algorithm_name AS "algorithm",
                        r.dataset_version AS "datasetVersion", r.sequence_count AS "sequenceCount",
                        r.event_count AS "eventCount", r.pattern_count AS "patternCount",
                        ROUND(r.runtime_ms / 1000.0, 3) AS "runtimeSeconds", r.status, r.created_at AS "createdAt"
                    FROM learning.mining_runs r
                    LEFT JOIN lms.courses c ON c.course_id = r.course_id
                    ORDER BY r.created_at DESC
                    LIMIT 20
                `),
                this.dataSource.query(`
                    SELECT
                        p.pattern_id AS "patternId", p.course_id AS "courseId",
                        c.course_name AS "courseName", p.pattern_signature AS "signature",
                        p.support, p.pattern_utility AS "utility",
                        p.pattern_length AS "length", p.algorithm_name AS "algorithm"
                    FROM learning.v_huspm_patterns p
                    JOIN lms.courses c ON c.course_id = p.course_id
                    ORDER BY p.pattern_utility DESC
                    LIMIT 20
                `),
                this.dataSource.query(`
                    SELECT
                        setting_id AS "settingId", setting_key AS "key",
                        setting_value AS "value", data_type AS "dataType",
                        description, updated_at AS "updatedAt"
                    FROM system_config.settings
                    ORDER BY setting_key
                `),
                this.dataSource.query(`
                    SELECT
                        audit_id AS "auditId", action, schema_name AS "schemaName",
                        table_name AS "tableName", record_id AS "recordId",
                        created_at AS "createdAt"
                    FROM system_config.audit_logs
                    ORDER BY created_at DESC
                    LIMIT 20
                `),
                this.dataSource.query(`
                    SELECT
                        t.ticket_id AS "ticketId", u.full_name AS "studentName",
                        t.subject, t.priority, t.status, t.created_at AS "createdAt"
                    FROM support.tickets t
                    JOIN auth.users u ON u.user_id = t.student_id
                    ORDER BY t.created_at DESC
                    LIMIT 20
                `),
                this.dataSource.query(`
                    SELECT
                        o.order_id AS "orderId", u.full_name AS "studentName",
                        c.course_name AS "courseName", o.final_amount AS "amount",
                        o.currency, o.order_status AS "status",
                        o.payment_attempt_count::int AS "paymentAttempts",
                        o.paid_at AS "paidAt"
                    FROM payment.v_order_payment_status o
                    JOIN auth.users u ON u.user_id = o.student_id
                    JOIN lms.courses c ON c.course_id = o.course_id
                    ORDER BY o.order_id DESC
                    LIMIT 30
                `),
            ]);

        return {
            role: 'ADMIN',
            generatedAt: new Date().toISOString(),
            stats: statsRows[0],
            users,
            miningRuns,
            patterns,
            settings,
            audits,
            tickets,
            orders,
        };
    }

    async recommendationFeedback(
        studentId: number,
        recommendationId: number,
        input: FeedbackInput,
    ) {
        const action = input.action?.toUpperCase();
        const allowed = ['ACCEPTED', 'IGNORED', 'DISMISSED', 'COMPLETED'];
        if (!allowed.includes(action)) {
            throw new BadRequestException('Phản hồi khuyến nghị không hợp lệ');
        }
        if (input.rating !== undefined && (input.rating < 1 || input.rating > 5)) {
            throw new BadRequestException('Đánh giá phải từ 1 đến 5');
        }

        const rows = await this.dataSource.query(`
            INSERT INTO learning.recommendation_feedback(
                recommendation_id, student_id, feedback_action, rating, comment
            )
            SELECT recommendation_id, student_id, $3, $4, $5
            FROM learning.learning_path_recommendations
            WHERE recommendation_id = $1 AND student_id = $2
            ON CONFLICT (recommendation_id, student_id) DO UPDATE SET
                feedback_action = EXCLUDED.feedback_action,
                rating = EXCLUDED.rating,
                comment = EXCLUDED.comment,
                created_at = CURRENT_TIMESTAMP
            RETURNING feedback_id AS "feedbackId", feedback_action AS action,
                      rating, comment, created_at AS "createdAt"
        `, [recommendationId, studentId, action, input.rating ?? null, input.comment?.trim() || null]);

        if (!rows.length) throw new NotFoundException('Không tìm thấy khuyến nghị');
        return rows[0];
    }

    async createTicket(studentId: number, input: TicketInput) {
        const subject = input.subject?.trim();
        const priority = (input.priority ?? 'NORMAL').toUpperCase();
        if (!subject) throw new BadRequestException('Vui lòng nhập chủ đề hỗ trợ');
        if (!['LOW', 'NORMAL', 'HIGH', 'URGENT'].includes(priority)) {
            throw new BadRequestException('Mức ưu tiên không hợp lệ');
        }

        return this.dataSource.transaction(async (manager) => {
            const rows = await manager.query(`
                INSERT INTO support.tickets(student_id, subject, category, priority)
                VALUES ($1, $2, $3, $4)
                RETURNING ticket_id AS "ticketId", subject, category, priority,
                          status, created_at AS "createdAt"
            `, [studentId, subject, input.category?.trim() || 'GENERAL', priority]);

            if (input.message?.trim()) {
                await manager.query(`
                    INSERT INTO support.ticket_messages(ticket_id, sender_id, message_text)
                    VALUES ($1, $2, $3)
                `, [rows[0].ticketId, studentId, input.message.trim()]);
            }
            return rows[0];
        });
    }

    async createCourse(
        teacherId: number,
        input: { name: string; description?: string; topic?: string; price?: number },
    ) {
        const name = input.name?.trim();
        const price = Number(input.price ?? 0);
        const topic = input.topic?.trim() || 'Tổng hợp';
        if (topic.length > 80) throw new BadRequestException('Chủ đề tối đa 80 ký tự');
        if (!name) throw new BadRequestException('Tên khóa học không được để trống');
        if (!Number.isFinite(price) || price < 0) {
            throw new BadRequestException('Học phí không hợp lệ');
        }

        const rows = await this.dataSource.query(`
            INSERT INTO lms.courses(course_name, description, teacher_id, price, status, topic)
            VALUES ($1, $2, $3, $4, 'DRAFT', $5)
            RETURNING course_id AS "courseId", course_name AS "courseName",
                      description, price, status, created_at AS "createdAt"
        `, [name, input.description?.trim() || null, teacherId, price, topic]);
        return rows[0];
    }

    async createLesson(
        teacherId: number,
        courseId: number,
        input: { title: string; content?: string; durationSeconds?: number },
    ) {
        await this.assertCourseOwner(teacherId, courseId);
        const title = input.title?.trim();
        const durationSeconds = Number(input.durationSeconds ?? 600);
        if (!title) throw new BadRequestException('Tên bài học không được để trống');
        if (!Number.isFinite(durationSeconds) || durationSeconds < 0) {
            throw new BadRequestException('Thời lượng bài học không hợp lệ');
        }

        const rows = await this.dataSource.query(`
            INSERT INTO lms.lessons(
                course_id, title, content, lesson_order,
                estimated_duration_seconds, is_published
            )
            SELECT $1, $2, $3, COALESCE(MAX(lesson_order), 0) + 1, $4, FALSE
            FROM lms.lessons
            WHERE course_id = $1
            RETURNING lesson_id AS "lessonId", course_id AS "courseId", title,
                      lesson_order AS "lessonOrder", is_published AS "isPublished"
        `, [courseId, title, input.content?.trim() || null, Math.round(durationSeconds)]);
        return rows[0];
    }

    async updateCourseStatus(teacherId: number, courseId: number, statusInput: string) {
        await this.assertCourseOwner(teacherId, courseId);
        const status = statusInput?.toUpperCase();
        if (!['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(status)) {
            throw new BadRequestException('Trạng thái khóa học không hợp lệ');
        }
        const rows = await this.dataSource.query(`
            UPDATE lms.courses
            SET status = $1, updated_at = CURRENT_TIMESTAMP
            WHERE course_id = $2 AND is_deleted = FALSE AND (teacher_id = $3 OR EXISTS(SELECT 1 FROM lms.course_teachers ct WHERE ct.course_id=lms.courses.course_id AND ct.teacher_id=$3))
            RETURNING course_id AS "courseId", course_name AS "courseName", status
        `, [status, courseId, teacherId]);
        return rows[0];
    }

    private async assertCourseOwner(teacherId: number, courseId: number) {
        const rows = await this.dataSource.query(`
            SELECT teacher_id AS "teacherId"
            FROM lms.courses
            WHERE course_id = $1 AND is_deleted = FALSE
        `, [courseId]);
        if (!rows.length) throw new NotFoundException('Không tìm thấy khóa học');
        const assigned = await this.dataSource.query('SELECT 1 FROM lms.course_teachers WHERE course_id=$1 AND teacher_id=$2',[courseId,teacherId]);
        if (Number(rows[0].teacherId) !== Number(teacherId) && !assigned.length) {
            throw new ForbiddenException('Bạn không quản lý khóa học này');
        }
    }
}
