-- Idempotent data used by the role-based demo portal.
-- All demo accounts use the password: Demo@123

ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS username VARCHAR(40);
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

CREATE OR REPLACE FUNCTION auth.fn_create_user(
    p_full_name VARCHAR,
    p_email VARCHAR,
    p_password_hash VARCHAR,
    p_role VARCHAR DEFAULT 'STUDENT'
)
RETURNS BIGINT
LANGUAGE plpgsql
AS $$
DECLARE
    v_user_id BIGINT;
    v_username VARCHAR(40);
BEGIN
    v_username := regexp_replace(lower(split_part(p_email, '@', 1)), '[^a-z0-9_.]', '', 'g');
    IF EXISTS (SELECT 1 FROM auth.users WHERE lower(username) = v_username) THEN
        v_username := left(v_username, 33) || '_' || left(md5(lower(p_email)), 6);
    END IF;

    INSERT INTO auth.users(full_name, username, email, password_hash, role)
    VALUES (
        btrim(p_full_name), v_username, lower(btrim(p_email)),
        p_password_hash, upper(p_role)
    )
    RETURNING user_id INTO v_user_id;
    RETURN v_user_id;
END;
$$;

UPDATE auth.users
SET username = regexp_replace(lower(split_part(email, '@', 1)), '[^a-z0-9_.]', '', 'g')
               || CASE WHEN EXISTS (
                    SELECT 1 FROM auth.users other
                    WHERE other.user_id <> auth.users.user_id
                      AND lower(split_part(other.email, '@', 1)) = lower(split_part(auth.users.email, '@', 1))
                  ) THEN user_id::text ELSE '' END
WHERE username IS NULL OR btrim(username) = '';

CREATE UNIQUE INDEX IF NOT EXISTS uq_users_username_lower ON auth.users(lower(username));

ALTER TABLE lms.courses ADD COLUMN IF NOT EXISTS topic VARCHAR(80);
CREATE INDEX IF NOT EXISTS idx_courses_topic
ON lms.courses(topic, created_at DESC) WHERE is_deleted = FALSE;

CREATE TABLE IF NOT EXISTS auth.password_reset_tokens (
    reset_token_id       BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id              BIGINT NOT NULL REFERENCES auth.users(user_id) ON DELETE CASCADE,
    token_hash           VARCHAR(64) NOT NULL UNIQUE,
    expires_at           TIMESTAMPTZ NOT NULL,
    used_at              TIMESTAMPTZ,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_password_reset_expiry CHECK (expires_at > created_at),
    CONSTRAINT chk_password_reset_used CHECK (used_at IS NULL OR used_at >= created_at)
);

CREATE INDEX IF NOT EXISTS idx_password_reset_user_active
ON auth.password_reset_tokens(user_id, expires_at DESC)
WHERE used_at IS NULL;

UPDATE auth.users SET username = COALESCE(NULLIF(username,''),'student'), phone = COALESCE(NULLIF(phone,''),'0900000001')
WHERE lower(email) = 'student@vedu.local';
UPDATE auth.users SET username = COALESCE(NULLIF(username,''),'teacher'), phone = COALESCE(NULLIF(phone,''),'0900000002')
WHERE lower(email) = 'teacher@vedu.local';
UPDATE auth.users SET username = COALESCE(NULLIF(username,''),'admin'), phone = COALESCE(NULLIF(phone,''),'0900000003')
WHERE lower(email) = 'admin@vedu.local';

-- Fictional instructor display name; preserve account identity and any other edited names.
UPDATE auth.users SET full_name='Nguyễn Hoàng Phúc'
WHERE role='TEACHER' AND username='teacher'
AND lower(regexp_replace(full_name,'[[:space:].]','','g'))
    IN ('tsnguyễnvăna','tsnguyenvana','nguyễnvăna','nguyenvana');

DO $$
DECLARE
    v_admin_id BIGINT;
    v_student_id BIGINT;
    v_course_id BIGINT;
    v_first_lesson_id BIGINT;
    v_next_lesson_id BIGINT;
    v_run_id BIGINT;
    v_pattern_id BIGINT;
BEGIN
    -- The curated library uses actual study progress; do not inject legacy demo events.
    IF to_regclass('lms.catalog_revisions') IS NOT NULL THEN
        IF EXISTS (SELECT 1 FROM lms.catalog_revisions) THEN RETURN; END IF;
    END IF;
    SELECT user_id INTO v_admin_id
    FROM auth.users
    WHERE lower(email) = 'admin@vedu.local';

    IF v_admin_id IS NULL THEN
        SELECT auth.fn_create_user(
            'Quản trị viên Vedu',
            'admin@vedu.local',
            crypt('Demo@123', gen_salt('bf', 10)),
            'ADMIN'
        ) INTO v_admin_id;
    END IF;

    UPDATE auth.users
    SET username = COALESCE(NULLIF(username,''),'admin'), phone = COALESCE(NULLIF(phone,''), '0900000003')
    WHERE user_id = v_admin_id;

    SELECT user_id INTO v_student_id
    FROM auth.users
    WHERE lower(email) = 'student@vedu.local';

    SELECT course_id INTO v_course_id
    FROM lms.courses
    WHERE status = 'PUBLISHED' AND is_deleted = FALSE
    ORDER BY course_id
    LIMIT 1;

    SELECT lesson_id INTO v_first_lesson_id
    FROM lms.lessons
    WHERE course_id = v_course_id AND is_deleted = FALSE
    ORDER BY lesson_order
    LIMIT 1;

    SELECT lesson_id INTO v_next_lesson_id
    FROM lms.lessons
    WHERE course_id = v_course_id
      AND is_deleted = FALSE
      AND lesson_id <> v_first_lesson_id
    ORDER BY lesson_order
    LIMIT 1;

    IF v_student_id IS NOT NULL AND v_course_id IS NOT NULL AND v_first_lesson_id IS NOT NULL THEN
        INSERT INTO learning.lesson_progress(
            student_id, course_id, lesson_id, status, progress_percent,
            first_viewed_at, last_viewed_at, completed_at, watch_duration_seconds
        ) VALUES (
            v_student_id, v_course_id, v_first_lesson_id, 'COMPLETED', 100,
            CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP - INTERVAL '1 day',
            CURRENT_TIMESTAMP - INTERVAL '1 day', 720
        )
        ON CONFLICT (student_id, lesson_id) DO NOTHING;

        SELECT mining_run_id INTO v_run_id
        FROM learning.mining_runs
        WHERE dataset_version = 'vedu-demo-portal-v1'
        ORDER BY mining_run_id DESC
        LIMIT 1;

        IF v_run_id IS NULL THEN
            INSERT INTO learning.mining_runs(
                course_id, algorithm_name, algorithm_version, dataset_version,
                code_version, min_support, min_utility, utility_definition,
                parameters, metrics, data_window_start, data_window_end,
                sequence_count, event_count, pattern_count, runtime_ms,
                peak_memory_mb, status, started_at, finished_at
            ) VALUES (
                v_course_id, 'HUSP-SP', 'demo-1.0', 'vedu-demo-portal-v1',
                'local-demo', 0.10, 1.00,
                '{"quiz_score":0.5,"completion":0.3,"duration":0.2}'::jsonb,
                '{"mode":"DEMO","top_k":5}'::jsonb,
                '{"precision_at_5":0.82,"coverage":0.91}'::jsonb,
                CURRENT_TIMESTAMP - INTERVAL '30 days', CURRENT_TIMESTAMP,
                24, 126, 1, 842, 38.40, 'SUCCEEDED',
                CURRENT_TIMESTAMP - INTERVAL '10 minutes', CURRENT_TIMESTAMP - INTERVAL '9 minutes'
            ) RETURNING mining_run_id INTO v_run_id;
        END IF;

        SELECT pattern_id INTO v_pattern_id
        FROM learning.high_utility_patterns
        WHERE mining_run_id = v_run_id AND pattern_signature = 'VIEW>COMPLETE>NEXT'
        LIMIT 1;

        IF v_pattern_id IS NULL THEN
            INSERT INTO learning.high_utility_patterns(
                mining_run_id, course_id, pattern_signature, support_count,
                support, pattern_utility, utility_ratio, pattern_length
            ) VALUES (
                v_run_id, v_course_id, 'VIEW>COMPLETE>NEXT', 18,
                0.75, 91.50, 0.84, 2
            ) RETURNING pattern_id INTO v_pattern_id;

            INSERT INTO learning.pattern_steps(
                pattern_id, course_id, step_order, lesson_id, action, utility_contribution
            ) VALUES (
                v_pattern_id, v_course_id, 1, v_first_lesson_id, 'COMPLETE_LESSON', 42.25
            );

            IF v_next_lesson_id IS NOT NULL THEN
                INSERT INTO learning.pattern_steps(
                    pattern_id, course_id, step_order, lesson_id, action, utility_contribution
                ) VALUES (
                    v_pattern_id, v_course_id, 2, v_next_lesson_id, 'VIEW_LESSON', 49.25
                );
            END IF;
        END IF;

        IF v_next_lesson_id IS NOT NULL AND NOT EXISTS (
            SELECT 1
            FROM learning.learning_path_recommendations
            WHERE student_id = v_student_id
              AND course_id = v_course_id
              AND recommended_lesson_id = v_next_lesson_id
              AND status IN ('ACTIVE','SHOWN','ACCEPTED')
        ) THEN
            INSERT INTO learning.learning_path_recommendations(
                student_id, course_id, current_lesson_id, recommended_lesson_id,
                pattern_id, source_type, recommendation_score, reason,
                recommendation_order, status, expires_at
            ) VALUES (
                v_student_id, v_course_id, v_first_lesson_id, v_next_lesson_id,
                v_pattern_id, 'HUSPM', 0.92,
                'Học viên có hành vi tương tự thường đạt kết quả tốt khi học bài này tiếp theo.',
                1, 'ACTIVE', CURRENT_TIMESTAMP + INTERVAL '30 days'
            );
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM support.tickets
            WHERE student_id = v_student_id AND subject = 'Cần hỗ trợ tài liệu bài học'
        ) THEN
            INSERT INTO support.tickets(student_id, assigned_to, subject, category, priority)
            VALUES (v_student_id, v_admin_id, 'Cần hỗ trợ tài liệu bài học', 'LEARNING', 'NORMAL');
        END IF;
    END IF;
END;
$$;

-- Catalog mở rộng: 4 chủ đề, mỗi chủ đề 10 khóa học; mỗi khóa có video,
-- tài liệu và quiz để trình diễn đầy đủ luồng học tập.
DO $$
DECLARE
    v_teacher_id BIGINT;
    v_course_id BIGINT;
    v_video_lesson_id BIGINT;
    v_document_lesson_id BIGINT;
    v_quiz_lesson_id BIGINT;
    v_quiz_id BIGINT;
    v_question_id BIGINT;
    v_topic TEXT;
    v_prefix TEXT;
    v_course_name TEXT;
    v_index INTEGER;
    topic_no INTEGER;
    v_topics TEXT[] := ARRAY[
        'Lập trình Web',
        'Khoa học dữ liệu & AI',
        'Cơ sở dữ liệu',
        'Kỹ năng số'
    ];
    v_prefixes TEXT[] := ARRAY['Web', 'AI', 'Database', 'Digital'];
BEGIN
    IF to_regclass('lms.catalog_revisions') IS NOT NULL THEN
        IF EXISTS (SELECT 1 FROM lms.catalog_revisions) THEN RETURN; END IF;
    END IF;
    SELECT user_id INTO v_teacher_id
    FROM auth.users
    WHERE lower(email) = 'teacher@vedu.local';

    UPDATE lms.courses SET topic = 'Lập trình Web'
    WHERE topic IS NULL AND lower(course_name) LIKE '%react%';
    UPDATE lms.courses SET topic = 'Khoa học dữ liệu & AI'
    WHERE topic IS NULL AND lower(course_name) LIKE '%huspm%';
    UPDATE lms.courses SET topic = 'Cơ sở dữ liệu'
    WHERE topic IS NULL AND lower(course_name) LIKE '%postgresql%';

    FOR topic_no IN 1..array_length(v_topics, 1) LOOP
        v_topic := v_topics[topic_no];
        v_prefix := v_prefixes[topic_no];

        FOR v_index IN 1..10 LOOP
            v_course_name := format('%s thực hành %s', v_prefix, lpad(v_index::text, 2, '0'));

            SELECT course_id INTO v_course_id
            FROM lms.courses
            WHERE course_name = v_course_name
            LIMIT 1;

            IF v_course_id IS NULL THEN
                INSERT INTO lms.courses(
                    course_name, description, topic, teacher_id, price, status, thumbnail_url
                ) VALUES (
                    v_course_name,
                    format('Khóa học %s theo lộ trình thực hành, gồm video, tài liệu và bài kiểm tra.', v_topic),
                    v_topic,
                    v_teacher_id,
                    (199000 + v_index * 25000),
                    'PUBLISHED',
                    format('https://picsum.photos/seed/vedu-%s-%s/900/520', topic_no, v_index)
                ) RETURNING course_id INTO v_course_id;

                INSERT INTO lms.lessons(course_id, title, content, lesson_order, estimated_duration_seconds)
                VALUES (
                    v_course_id, 'Bài 1. Video nhập môn',
                    format('Video giới thiệu kiến thức nền tảng của chủ đề %s.', v_topic),
                    1, 180 + v_index * 5
                ) RETURNING lesson_id INTO v_video_lesson_id;

                INSERT INTO lms.lesson_resources(lesson_id, resource_type, title, resource_url, display_order)
                VALUES (
                    v_video_lesson_id, 'VIDEO', 'Video bài giảng',
                    'https://www.w3schools.com/html/mov_bbb.mp4', 1
                );

                INSERT INTO lms.lessons(course_id, title, content, lesson_order, estimated_duration_seconds)
                VALUES (
                    v_course_id, 'Bài 2. Tài liệu thực hành',
                    'Tài liệu tóm tắt, ví dụ và bài tập tự luyện theo bài.',
                    2, 240 + v_index * 5
                ) RETURNING lesson_id INTO v_document_lesson_id;

                INSERT INTO lms.lesson_resources(lesson_id, resource_type, title, resource_url, display_order)
                VALUES (
                    v_document_lesson_id, 'DOCUMENT', 'Tài liệu học tập',
                    'https://developer.mozilla.org/', 1
                );

                INSERT INTO lms.lessons(course_id, title, content, lesson_order, estimated_duration_seconds)
                VALUES (
                    v_course_id, 'Bài 3. Quiz kiểm tra',
                    'Bài kiểm tra củng cố kiến thức sau khi hoàn thành video và tài liệu.',
                    3, 300
                ) RETURNING lesson_id INTO v_quiz_lesson_id;

                INSERT INTO assessment.quizzes(
                    course_id, lesson_id, title, description, time_limit_seconds,
                    passing_score, max_attempts
                ) VALUES (
                    v_course_id, v_quiz_lesson_id,
                    format('Kiểm tra %s', v_course_name),
                    'Quiz một lựa chọn được chấm tự động bởi backend.',
                    300, 5, 99
                ) RETURNING quiz_id INTO v_quiz_id;

                INSERT INTO assessment.questions(
                    quiz_id, question_text, question_type, question_order, points
                ) VALUES (
                    v_quiz_id,
                    format('Bước học nào giúp củng cố kiến thức trong khóa %s?', v_course_name),
                    'SINGLE_CHOICE', 1, 1
                ) RETURNING question_id INTO v_question_id;

                INSERT INTO assessment.answers(question_id, answer_text, is_correct, answer_order)
                VALUES
                    (v_question_id, 'Xem video, đọc tài liệu và làm quiz', TRUE, 1),
                    (v_question_id, 'Bỏ qua toàn bộ nội dung', FALSE, 2),
                    (v_question_id, 'Chỉ mở trang chủ', FALSE, 3),
                    (v_question_id, 'Không cần thực hành', FALSE, 4);
            END IF;
        END LOOP;
    END LOOP;
END;
$$;

ALTER TABLE auth.users ALTER COLUMN username SET NOT NULL;
