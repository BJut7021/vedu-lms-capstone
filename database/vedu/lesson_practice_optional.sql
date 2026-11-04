
CREATE TABLE IF NOT EXISTS learning.lesson_practice_config (
    lesson_id BIGINT PRIMARY KEY
        REFERENCES lms.lessons(lesson_id),
    is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    instructions TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS learning.lesson_practice_submissions (
    submission_id BIGSERIAL PRIMARY KEY,
    lesson_id BIGINT NOT NULL
        REFERENCES lms.lessons(lesson_id),
    student_id BIGINT NOT NULL
        REFERENCES auth.users(user_id),
    stored_filename VARCHAR(80) NOT NULL UNIQUE,
    original_filename VARCHAR(255) NOT NULL,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    feedback TEXT,
    reviewed_by BIGINT REFERENCES auth.users(user_id),
    reviewed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_practice_submissions_lesson
ON learning.lesson_practice_submissions
    (lesson_id, submitted_at DESC);

CREATE INDEX IF NOT EXISTS idx_practice_submissions_student
ON learning.lesson_practice_submissions
    (student_id, lesson_id, submitted_at DESC);
