-- Additive, rerunnable migration. Never drops existing student or payment data.
BEGIN;
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS is_test_account boolean NOT NULL DEFAULT false;
CREATE TABLE IF NOT EXISTS auth.request_limits (
 key_hash varchar(64) PRIMARY KEY, window_start timestamptz NOT NULL DEFAULT now(),
 requests integer NOT NULL DEFAULT 1
);
ALTER TABLE lms.lessons ADD COLUMN IF NOT EXISTS video_duration_seconds numeric;
CREATE TABLE IF NOT EXISTS lms.course_sections (
 section_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 course_id bigint NOT NULL REFERENCES lms.courses,
 title varchar(200) NOT NULL, section_order integer NOT NULL CHECK(section_order>0),
 UNIQUE(course_id,section_id), UNIQUE(course_id,section_order)
);
ALTER TABLE lms.lessons ADD COLUMN IF NOT EXISTS section_id bigint;
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='fk_lesson_section_context') THEN
  ALTER TABLE lms.lessons ADD CONSTRAINT fk_lesson_section_context FOREIGN KEY(course_id,section_id) REFERENCES lms.course_sections(course_id,section_id);
 END IF;
END $$;
CREATE TABLE IF NOT EXISTS lms.course_teachers (
 course_id bigint REFERENCES lms.courses ON DELETE CASCADE,
 teacher_id bigint REFERENCES auth.users ON DELETE RESTRICT,
 assigned_by bigint REFERENCES auth.users, assigned_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(course_id,teacher_id)
);
CREATE TABLE IF NOT EXISTS lms.course_questions (
 question_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 course_id bigint NOT NULL REFERENCES lms.courses,
 author_id bigint NOT NULL REFERENCES auth.users,
 subject varchar(200) NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS lms.course_messages (
 message_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 question_id bigint NOT NULL REFERENCES lms.course_questions ON DELETE CASCADE,
 author_id bigint NOT NULL REFERENCES auth.users, body text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), CHECK(length(btrim(body)) BETWEEN 1 AND 5000)
);
CREATE TABLE IF NOT EXISTS learning.video_state (
 student_id bigint NOT NULL REFERENCES auth.users, lesson_id bigint NOT NULL REFERENCES lms.lessons,
 ranges jsonb NOT NULL DEFAULT '[]', position_seconds numeric NOT NULL DEFAULT 0,
 actual_seconds numeric NOT NULL DEFAULT 0, duration_seconds numeric NOT NULL DEFAULT 0,
 updated_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(student_id,lesson_id)
);
CREATE TABLE IF NOT EXISTS learning.watch_sessions (
 watch_id uuid PRIMARY KEY, student_id bigint NOT NULL REFERENCES auth.users,
 lesson_id bigint NOT NULL REFERENCES lms.lessons, last_position numeric NOT NULL DEFAULT 0,
 last_seen timestamptz NOT NULL DEFAULT now(), expires_at timestamptz NOT NULL DEFAULT now()+interval '3600 seconds'
);
CREATE TABLE IF NOT EXISTS learning.watch_receipts (
 event_id uuid PRIMARY KEY, watch_id uuid NOT NULL REFERENCES learning.watch_sessions,
 result jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS assessment.attempt_drafts (
 attempt_id bigint PRIMARY KEY REFERENCES assessment.quiz_attempts,
 answers jsonb NOT NULL DEFAULT '[]', updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS payment.momo_requests (
 request_id varchar(80) PRIMARY KEY, provider_order_id varchar(100) NOT NULL UNIQUE,
 order_id bigint NOT NULL REFERENCES payment.orders, payment_id bigint NOT NULL REFERENCES payment.payments,
 status varchar(20) NOT NULL DEFAULT 'PENDING', pay_url text, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS learning.dataset_mappings (
 dataset varchar(60) NOT NULL, external_item_id varchar(200) NOT NULL,
 lesson_id bigint NOT NULL REFERENCES lms.lessons,
 approved_by bigint NOT NULL REFERENCES auth.users, approved_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(dataset,lesson_id)
);
CREATE TABLE IF NOT EXISTS learning.experiments (
 experiment_id uuid PRIMARY KEY, dataset varchar(60) NOT NULL, status varchar(20) NOT NULL,
 manifest jsonb NOT NULL DEFAULT '{}', metrics jsonb NOT NULL DEFAULT '{}',
 created_by bigint REFERENCES auth.users, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS lms.lesson_pedagogy (
 lesson_id bigint PRIMARY KEY REFERENCES lms.lessons,
 difficulty integer NOT NULL DEFAULT 1 CHECK(difficulty BETWEEN 1 AND 3),
 kind varchar(20) NOT NULL DEFAULT 'CONCEPT' CHECK(kind IN ('CONCEPT','PRACTICE','PROJECT','REVIEW','VIDEO')),
 is_core boolean NOT NULL DEFAULT true,
 skills jsonb NOT NULL DEFAULT '[]', goals jsonb NOT NULL DEFAULT '[]',
 prerequisites jsonb NOT NULL DEFAULT '[]', outcomes jsonb NOT NULL DEFAULT '[]',
 sources jsonb NOT NULL DEFAULT '[]', content_key varchar(150) UNIQUE,
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS learning.path_sets (
 path_set_id uuid PRIMARY KEY, student_id bigint NOT NULL REFERENCES auth.users,
 course_id bigint NOT NULL REFERENCES lms.courses,
 preferences jsonb NOT NULL, plans jsonb NOT NULL, evidence jsonb NOT NULL,
 selected_plan_id varchar(60), explanation jsonb,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_path_sets_owner ON learning.path_sets(student_id,course_id,created_at DESC);
CREATE TABLE IF NOT EXISTS learning.path_feedback (
 path_set_id uuid NOT NULL REFERENCES learning.path_sets,
 student_id bigint NOT NULL REFERENCES auth.users, plan_id varchar(60) NOT NULL,
 rating integer NOT NULL CHECK(rating BETWEEN 1 AND 5), comment varchar(1000) NOT NULL DEFAULT '',
 updated_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(path_set_id,student_id,plan_id)
);
COMMIT;
