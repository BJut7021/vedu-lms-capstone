-- VEDU STT 6 demo. Run with psql. Only reads; no credentials, reset PINs or tokens.
-- Verified against the database schema on 2026-10-22.
\pset pager off
\set ON_ERROR_STOP on
BEGIN TRANSACTION READ ONLY;

\echo '1. Database and application schemas'
SELECT current_database() AS database, current_user AS db_user;
SELECT table_schema, count(*) AS tables
FROM information_schema.tables
WHERE table_type = 'BASE TABLE'
  AND table_schema NOT IN ('pg_catalog', 'information_schema')
GROUP BY table_schema ORDER BY table_schema;

\echo '2. Seed account roles and password storage (no raw passwords)'
SELECT user_id, username, role, is_active,
       CASE WHEN password_hash LIKE '$2%' THEN 'bcrypt hash' ELSE 'check algorithm' END AS password_storage
FROM auth.users
WHERE username IN ('student', 'teacher', 'admin')
ORDER BY role;
SELECT role, count(*) AS users FROM auth.users GROUP BY role ORDER BY role;
SELECT user_id, created_at, expires_at, revoked_at
FROM auth.user_sessions ORDER BY created_at DESC LIMIT 8;

\echo '3. Practical office courses and reference course'
SELECT c.course_id, c.course_name, c.topic, c.status, c.price,
       count(l.lesson_id) FILTER (WHERE NOT l.is_deleted) AS lessons
FROM lms.courses c LEFT JOIN lms.lessons l ON l.course_id = c.course_id
WHERE NOT c.is_deleted AND
      (c.course_id IN (55,64,65,66,67) OR c.course_name ILIKE '%Demo GVHD%')
GROUP BY c.course_id ORDER BY c.course_id;
SELECT l.lesson_id, l.course_id, s.title AS section, l.lesson_order, l.title,
       l.estimated_duration_seconds, l.video_duration_seconds, l.is_published
FROM lms.lessons l
LEFT JOIN lms.course_sections s ON s.section_id = l.section_id
WHERE NOT l.is_deleted
ORDER BY l.created_at DESC, l.lesson_id DESC LIMIT 15;
SELECT r.resource_id, l.course_id, l.title AS lesson, r.resource_type,
       r.title, r.resource_url
FROM lms.lesson_resources r JOIN lms.lessons l USING (lesson_id)
ORDER BY r.resource_id DESC LIMIT 12;

\echo '4. Persisted learning and real watch time (seconds)'
SELECT student_id, course_id, lesson_id, status, progress_percent,
       watch_duration_seconds, updated_at
FROM learning.lesson_progress ORDER BY updated_at DESC LIMIT 12;
SELECT student_id, lesson_id, position_seconds, actual_seconds,
       duration_seconds, ranges, updated_at
FROM learning.video_state ORDER BY updated_at DESC LIMIT 8;
SELECT log_id, student_id, course_id, lesson_id, action, duration_seconds,
       quiz_score, data_source, occurred_at
FROM learning.learning_sequence_logs ORDER BY occurred_at DESC, log_id DESC LIMIT 15;

\echo '5. Enrollments, orders and payments'
SELECT enrollment_id, student_id, course_id, status, enrolled_at, completed_at
FROM enrollment.enrollments ORDER BY enrolled_at DESC LIMIT 10;
SELECT order_id, student_id, course_id, status, created_at
FROM payment.orders ORDER BY created_at DESC LIMIT 10;

\echo '6. Quizzes, results and certificates'
SELECT quiz_id, course_id, title, time_limit_seconds, passing_score, max_attempts
FROM assessment.quizzes WHERE NOT is_deleted
ORDER BY quiz_id DESC LIMIT 10;
SELECT attempt_id, quiz_id, student_id, status, score, duration_seconds,
       started_at, submitted_at
FROM assessment.quiz_attempts ORDER BY started_at DESC LIMIT 10;
SELECT certificate_id, student_id, course_id, certificate_code, status, issued_at
FROM lms.certificates ORDER BY issued_at DESC LIMIT 8;

\echo '7. Teacher assignment and course questions'
SELECT course_id, teacher_id, assigned_by, assigned_at
FROM lms.course_teachers ORDER BY assigned_at DESC LIMIT 10;
SELECT question_id, course_id, author_id, subject, created_at
FROM lms.course_questions ORDER BY created_at DESC LIMIT 8;
SELECT question_id, author_id, body, created_at
FROM lms.course_messages ORDER BY created_at DESC LIMIT 8;

\echo '8. Support tickets'
SELECT ticket_id, student_id, subject, status, assigned_to, created_at
FROM support.tickets ORDER BY created_at DESC LIMIT 8;

\echo '9. Training, HUSPM, registry and saved learning paths'
SELECT experiment_id, dataset, status, created_at
FROM learning.experiments ORDER BY created_at DESC LIMIT 8;
SELECT mining_run_id, algorithm_name, status, min_support, min_utility,
       sequence_count, event_count, pattern_count, runtime_ms, started_at, finished_at
FROM learning.mining_runs ORDER BY started_at DESC NULLS LAST LIMIT 8;
SELECT pattern_id, mining_run_id, pattern_signature, support_count, support,
       pattern_utility, pattern_length
FROM learning.high_utility_patterns
ORDER BY created_at DESC, pattern_utility DESC LIMIT 12;
SELECT model_name, model_type, model_version, dataset_version, artifact_uri,
       trained_at, is_active
FROM learning.model_registry ORDER BY trained_at DESC NULLS LAST LIMIT 8;
SELECT path_set_id, student_id, course_id, preferences,
       jsonb_array_length(plans) AS alternatives,
       evidence->>'source' AS source, selected_plan_id, updated_at
FROM learning.path_sets ORDER BY updated_at DESC LIMIT 8;

\echo '10. Summary for demonstration; not a claim of real enrolled learners'
SELECT 'users' AS entity, count(*) AS rows FROM auth.users
UNION ALL SELECT 'courses_not_deleted', count(*) FROM lms.courses WHERE NOT is_deleted
UNION ALL SELECT 'lessons_not_deleted', count(*) FROM lms.lessons WHERE NOT is_deleted
UNION ALL SELECT 'resources', count(*) FROM lms.lesson_resources
UNION ALL SELECT 'quiz_not_deleted', count(*) FROM assessment.quizzes WHERE NOT is_deleted
UNION ALL SELECT 'learning_events', count(*) FROM learning.learning_sequence_logs
UNION ALL SELECT 'path_sets', count(*) FROM learning.path_sets;

ROLLBACK;
