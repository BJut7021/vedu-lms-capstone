-- Idempotent VEDU mixed final exam migration. Does not touch lesson quizzes or preexisting attempts.
BEGIN;
CREATE TABLE IF NOT EXISTS assessment.final_essay_prompts (
 quiz_id bigint PRIMARY KEY REFERENCES assessment.quizzes(quiz_id),
 prompt_text text NOT NULL DEFAULT '',
 updated_by bigint REFERENCES auth.users(user_id),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS assessment.final_essay_submissions (
 attempt_id bigint PRIMARY KEY REFERENCES assessment.quiz_attempts(attempt_id),
 quiz_id bigint NOT NULL REFERENCES assessment.quizzes(quiz_id),
 student_id bigint NOT NULL REFERENCES auth.users(user_id),
 image_data bytea NOT NULL,
 image_mime varchar(30) NOT NULL CHECK(image_mime IN ('image/jpeg','image/png','image/webp')),
 file_name varchar(180) NOT NULL,
 submitted_at timestamptz NOT NULL DEFAULT now(),
 grade numeric(4,2) CHECK(grade BETWEEN 0 AND 10),
 feedback text,
 graded_by bigint REFERENCES auth.users(user_id),
 graded_at timestamptz,
 CONSTRAINT chk_final_essay_grade_consistent CHECK ((grade IS NULL AND graded_by IS NULL AND graded_at IS NULL) OR (grade IS NOT NULL AND graded_by IS NOT NULL AND graded_at IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS idx_final_essay_quiz_pending ON assessment.final_essay_submissions(quiz_id,graded_at);
COMMIT;
