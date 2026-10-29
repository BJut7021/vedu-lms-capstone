-- =============================================================
-- VEDU - FINAL DATABASE SCHEMA
-- PostgreSQL 15+
-- Purpose: LMS + Assessment + Payment + Learning Analytics + HUSPM
-- Run on a new/empty database owned by an administrative migration role.
-- =============================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE SCHEMA auth;
CREATE SCHEMA lms;
CREATE SCHEMA enrollment;
CREATE SCHEMA payment;
CREATE SCHEMA assessment;
CREATE SCHEMA learning;
CREATE SCHEMA support;
CREATE SCHEMA system_config;

-- =============================================================
-- 1. AUTHENTICATION & USERS
-- =============================================================

CREATE TABLE auth.users (
    user_id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    full_name            VARCHAR(120) NOT NULL,
    username             VARCHAR(40),
    email                VARCHAR(180) NOT NULL,
    phone                VARCHAR(20),
    password_hash        VARCHAR(255) NOT NULL,
    role                 VARCHAR(20) NOT NULL DEFAULT 'STUDENT',
    avatar_url           TEXT,
    is_active            BOOLEAN NOT NULL DEFAULT TRUE,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_users_role CHECK (role IN ('STUDENT','TEACHER','ADMIN')),
    CONSTRAINT chk_users_email_nonblank CHECK (btrim(email) <> ''),
    CONSTRAINT chk_users_name_nonblank CHECK (btrim(full_name) <> '')
);

CREATE UNIQUE INDEX uq_users_email_lower ON auth.users (lower(email));
CREATE UNIQUE INDEX uq_users_username_lower ON auth.users (lower(username)) WHERE username IS NOT NULL;
CREATE INDEX idx_users_role_active ON auth.users (role) WHERE is_active = TRUE;

CREATE TABLE auth.user_sessions (
    session_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id              BIGINT NOT NULL REFERENCES auth.users(user_id) ON DELETE CASCADE,
    refresh_token_hash   VARCHAR(255) NOT NULL,
    device_info          TEXT,
    ip_address           INET,
    user_agent           TEXT,
    expires_at           TIMESTAMPTZ NOT NULL,
    revoked_at           TIMESTAMPTZ,
    last_used_at         TIMESTAMPTZ,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_user_sessions_expiry CHECK (expires_at > created_at),
    CONSTRAINT chk_user_sessions_revoked CHECK (revoked_at IS NULL OR revoked_at >= created_at)
);

CREATE UNIQUE INDEX uq_user_sessions_refresh_hash ON auth.user_sessions(refresh_token_hash);
CREATE INDEX idx_user_sessions_user_active ON auth.user_sessions(user_id, expires_at) WHERE revoked_at IS NULL;

-- =============================================================
-- 2. LMS
-- =============================================================

CREATE TABLE lms.courses (
    course_id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    course_name          VARCHAR(220) NOT NULL,
    description          TEXT,
    topic                VARCHAR(80),
    teacher_id           BIGINT NOT NULL REFERENCES auth.users(user_id) ON DELETE RESTRICT,
    price                NUMERIC(12,2) NOT NULL DEFAULT 0,
    currency             CHAR(3) NOT NULL DEFAULT 'VND',
    status               VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    thumbnail_url        TEXT,
    is_deleted           BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at           TIMESTAMPTZ,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_courses_name_nonblank CHECK (btrim(course_name) <> ''),
    CONSTRAINT chk_courses_price CHECK (price >= 0),
    CONSTRAINT chk_courses_status CHECK (status IN ('DRAFT','PUBLISHED','ARCHIVED')),
    CONSTRAINT chk_courses_soft_delete CHECK (
        (is_deleted = FALSE AND deleted_at IS NULL) OR
        (is_deleted = TRUE AND deleted_at IS NOT NULL)
    )
);

CREATE INDEX idx_courses_teacher ON lms.courses(teacher_id);
CREATE INDEX idx_courses_topic ON lms.courses(topic, created_at DESC) WHERE is_deleted = FALSE;
CREATE INDEX idx_courses_status_active ON lms.courses(status, created_at DESC) WHERE is_deleted = FALSE;

CREATE TABLE lms.lessons (
    lesson_id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    course_id            BIGINT NOT NULL REFERENCES lms.courses(course_id) ON DELETE RESTRICT,
    title                VARCHAR(220) NOT NULL,
    content              TEXT,
    lesson_order         INTEGER NOT NULL,
    estimated_duration_seconds INTEGER,
    is_published         BOOLEAN NOT NULL DEFAULT TRUE,
    is_deleted           BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at           TIMESTAMPTZ,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_lessons_course_order UNIQUE(course_id, lesson_order),
    CONSTRAINT uq_lessons_id_course UNIQUE(lesson_id, course_id),
    CONSTRAINT chk_lessons_title_nonblank CHECK (btrim(title) <> ''),
    CONSTRAINT chk_lessons_order CHECK (lesson_order > 0),
    CONSTRAINT chk_lessons_duration CHECK (estimated_duration_seconds IS NULL OR estimated_duration_seconds >= 0),
    CONSTRAINT chk_lessons_soft_delete CHECK (
        (is_deleted = FALSE AND deleted_at IS NULL) OR
        (is_deleted = TRUE AND deleted_at IS NOT NULL)
    )
);

CREATE INDEX idx_lessons_course_published ON lms.lessons(course_id, lesson_order)
WHERE is_deleted = FALSE AND is_published = TRUE;

CREATE TABLE lms.lesson_resources (
    resource_id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    lesson_id            BIGINT NOT NULL REFERENCES lms.lessons(lesson_id) ON DELETE CASCADE,
    resource_type        VARCHAR(20) NOT NULL,
    title                VARCHAR(220),
    resource_url         TEXT NOT NULL,
    display_order        INTEGER NOT NULL DEFAULT 1,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_lesson_resources_order UNIQUE(lesson_id, display_order),
    CONSTRAINT chk_resource_type CHECK (resource_type IN ('VIDEO','PDF','DOCUMENT','SLIDE','SPREADSHEET','LINK','OTHER')),
    CONSTRAINT chk_resource_order CHECK (display_order > 0),
    CONSTRAINT chk_resource_url_nonblank CHECK (btrim(resource_url) <> '')
);

CREATE INDEX idx_resources_lesson ON lms.lesson_resources(lesson_id, display_order);

-- =============================================================
-- 3. ENROLLMENT
-- =============================================================

CREATE TABLE enrollment.enrollments (
    enrollment_id        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    student_id           BIGINT NOT NULL REFERENCES auth.users(user_id) ON DELETE RESTRICT,
    course_id            BIGINT NOT NULL REFERENCES lms.courses(course_id) ON DELETE RESTRICT,
    status               VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    listed_price         NUMERIC(12,2) NOT NULL,
    discount_amount      NUMERIC(12,2) NOT NULL DEFAULT 0,
    final_price          NUMERIC(12,2) NOT NULL,
    currency             CHAR(3) NOT NULL DEFAULT 'VND',
    enrolled_at          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at         TIMESTAMPTZ,
    cancelled_at         TIMESTAMPTZ,
    CONSTRAINT uq_enrollments_student_course UNIQUE(student_id, course_id),
    CONSTRAINT uq_enrollments_id_student_course UNIQUE(enrollment_id, student_id, course_id),
    CONSTRAINT chk_enrollment_status CHECK (status IN ('ACTIVE','COMPLETED','CANCELLED')),
    CONSTRAINT chk_enrollment_prices CHECK (
        listed_price >= 0 AND discount_amount >= 0 AND discount_amount <= listed_price
        AND final_price = listed_price - discount_amount
    ),
    CONSTRAINT chk_enrollment_completed_at CHECK (
        (status <> 'COMPLETED') OR completed_at IS NOT NULL
    ),
    CONSTRAINT chk_enrollment_cancelled_at CHECK (
        (status <> 'CANCELLED') OR cancelled_at IS NOT NULL
    )
);

CREATE INDEX idx_enrollments_student_status ON enrollment.enrollments(student_id, status);
CREATE INDEX idx_enrollments_course_status ON enrollment.enrollments(course_id, status);

-- =============================================================
-- 4. PAYMENT
-- =============================================================

CREATE TABLE payment.orders (
    order_id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    enrollment_id        BIGINT NOT NULL UNIQUE,
    student_id           BIGINT NOT NULL REFERENCES auth.users(user_id) ON DELETE RESTRICT,
    course_id            BIGINT NOT NULL REFERENCES lms.courses(course_id) ON DELETE RESTRICT,
    listed_price         NUMERIC(12,2) NOT NULL,
    discount_amount      NUMERIC(12,2) NOT NULL DEFAULT 0,
    final_amount         NUMERIC(12,2) NOT NULL,
    currency             CHAR(3) NOT NULL DEFAULT 'VND',
    status               VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    paid_at              TIMESTAMPTZ,
    cancelled_at         TIMESTAMPTZ,
    refunded_at          TIMESTAMPTZ,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_orders_enrollment_context FOREIGN KEY (enrollment_id, student_id, course_id)
        REFERENCES enrollment.enrollments(enrollment_id, student_id, course_id) ON DELETE RESTRICT,
    CONSTRAINT chk_orders_status CHECK (status IN ('PENDING','PAID','CANCELLED','REFUNDED')),
    CONSTRAINT chk_orders_amounts CHECK (
        listed_price >= 0 AND discount_amount >= 0 AND discount_amount <= listed_price
        AND final_amount = listed_price - discount_amount
    ),
    CONSTRAINT chk_orders_paid_at CHECK ((status <> 'PAID') OR paid_at IS NOT NULL),
    CONSTRAINT chk_orders_cancelled_at CHECK ((status <> 'CANCELLED') OR cancelled_at IS NOT NULL),
    CONSTRAINT chk_orders_refunded_at CHECK ((status <> 'REFUNDED') OR refunded_at IS NOT NULL)
);

CREATE INDEX idx_orders_student_status ON payment.orders(student_id, status);
CREATE INDEX idx_orders_course_status ON payment.orders(course_id, status);

CREATE TABLE payment.payments (
    payment_id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id             BIGINT NOT NULL REFERENCES payment.orders(order_id) ON DELETE RESTRICT,
    amount               NUMERIC(12,2) NOT NULL,
    currency             CHAR(3) NOT NULL DEFAULT 'VND',
    payment_method       VARCHAR(30) NOT NULL,
    provider             VARCHAR(50),
    transaction_code     VARCHAR(150),
    idempotency_key      UUID NOT NULL DEFAULT gen_random_uuid(),
    status               VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    paid_at              TIMESTAMPTZ,
    failed_at            TIMESTAMPTZ,
    refunded_at          TIMESTAMPTZ,
    provider_payload     JSONB,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_payments_idempotency UNIQUE(idempotency_key),
    CONSTRAINT chk_payments_amount CHECK (amount >= 0),
    CONSTRAINT chk_payments_method CHECK (payment_method IN ('CASH','BANK_TRANSFER','VNPAY','MOMO','OTHER')),
    CONSTRAINT chk_payments_status CHECK (status IN ('PENDING','PAID','FAILED','REFUNDED')),
    CONSTRAINT chk_payments_paid_at CHECK ((status <> 'PAID') OR paid_at IS NOT NULL),
    CONSTRAINT chk_payments_failed_at CHECK ((status <> 'FAILED') OR failed_at IS NOT NULL),
    CONSTRAINT chk_payments_refunded_at CHECK ((status <> 'REFUNDED') OR refunded_at IS NOT NULL)
);

CREATE UNIQUE INDEX uq_payments_provider_transaction
ON payment.payments(provider, transaction_code)
WHERE transaction_code IS NOT NULL;
CREATE INDEX idx_payments_order_status ON payment.payments(order_id, status);

-- =============================================================
-- 5. ASSESSMENT
-- =============================================================

CREATE TABLE assessment.quizzes (
    quiz_id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    course_id            BIGINT NOT NULL REFERENCES lms.courses(course_id) ON DELETE RESTRICT,
    lesson_id            BIGINT,
    title                VARCHAR(220) NOT NULL,
    description          TEXT,
    time_limit_seconds   INTEGER,
    passing_score        NUMERIC(5,2) NOT NULL DEFAULT 5,
    max_attempts         INTEGER NOT NULL DEFAULT 3,
    is_published         BOOLEAN NOT NULL DEFAULT TRUE,
    is_deleted           BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at           TIMESTAMPTZ,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_quizzes_id_course UNIQUE(quiz_id, course_id),
    CONSTRAINT fk_quizzes_lesson_course FOREIGN KEY (lesson_id, course_id)
        REFERENCES lms.lessons(lesson_id, course_id) ON DELETE RESTRICT,
    CONSTRAINT chk_quizzes_title_nonblank CHECK (btrim(title) <> ''),
    CONSTRAINT chk_quizzes_time_limit CHECK (time_limit_seconds IS NULL OR time_limit_seconds > 0),
    CONSTRAINT chk_quizzes_passing_score CHECK (passing_score BETWEEN 0 AND 10),
    CONSTRAINT chk_quizzes_max_attempts CHECK (max_attempts > 0),
    CONSTRAINT chk_quizzes_soft_delete CHECK (
        (is_deleted = FALSE AND deleted_at IS NULL) OR
        (is_deleted = TRUE AND deleted_at IS NOT NULL)
    )
);

CREATE INDEX idx_quizzes_course_active ON assessment.quizzes(course_id, lesson_id)
WHERE is_deleted = FALSE AND is_published = TRUE;

CREATE TABLE assessment.questions (
    question_id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    quiz_id              BIGINT NOT NULL REFERENCES assessment.quizzes(quiz_id) ON DELETE CASCADE,
    question_text        TEXT NOT NULL,
    question_type        VARCHAR(30) NOT NULL DEFAULT 'SINGLE_CHOICE',
    question_order       INTEGER NOT NULL,
    points               NUMERIC(6,2) NOT NULL DEFAULT 1,
    CONSTRAINT uq_questions_quiz_order UNIQUE(quiz_id, question_order),
    CONSTRAINT uq_questions_id_quiz UNIQUE(question_id, quiz_id),
    CONSTRAINT chk_questions_type CHECK (question_type IN ('SINGLE_CHOICE','MULTIPLE_CHOICE','TRUE_FALSE')),
    CONSTRAINT chk_questions_order CHECK (question_order > 0),
    CONSTRAINT chk_questions_points CHECK (points > 0),
    CONSTRAINT chk_questions_text_nonblank CHECK (btrim(question_text) <> '')
);

CREATE TABLE assessment.answers (
    answer_id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    question_id          BIGINT NOT NULL REFERENCES assessment.questions(question_id) ON DELETE CASCADE,
    answer_text          TEXT NOT NULL,
    is_correct           BOOLEAN NOT NULL DEFAULT FALSE,
    answer_order         INTEGER NOT NULL,
    CONSTRAINT uq_answers_question_order UNIQUE(question_id, answer_order),
    CONSTRAINT uq_answers_id_question UNIQUE(answer_id, question_id),
    CONSTRAINT chk_answers_order CHECK (answer_order > 0),
    CONSTRAINT chk_answers_text_nonblank CHECK (btrim(answer_text) <> '')
);

CREATE TABLE assessment.quiz_attempts (
    attempt_id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    quiz_id              BIGINT NOT NULL,
    course_id            BIGINT NOT NULL,
    student_id           BIGINT NOT NULL REFERENCES auth.users(user_id) ON DELETE RESTRICT,
    attempt_no           INTEGER NOT NULL,
    score                NUMERIC(5,2),
    duration_seconds     INTEGER,
    started_at           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    submitted_at         TIMESTAMPTZ,
    status               VARCHAR(20) NOT NULL DEFAULT 'IN_PROGRESS',
    CONSTRAINT uq_attempts_quiz_student_no UNIQUE(quiz_id, student_id, attempt_no),
    CONSTRAINT fk_attempts_quiz_course FOREIGN KEY (quiz_id, course_id)
        REFERENCES assessment.quizzes(quiz_id, course_id) ON DELETE RESTRICT,
    CONSTRAINT fk_attempts_enrollment FOREIGN KEY (student_id, course_id)
        REFERENCES enrollment.enrollments(student_id, course_id) ON DELETE RESTRICT,
    CONSTRAINT uq_attempts_id_quiz UNIQUE(attempt_id, quiz_id),
    CONSTRAINT chk_attempts_no CHECK (attempt_no > 0),
    CONSTRAINT chk_attempts_score CHECK (score IS NULL OR score BETWEEN 0 AND 10),
    CONSTRAINT chk_attempts_duration CHECK (duration_seconds IS NULL OR duration_seconds >= 0),
    CONSTRAINT chk_attempts_status CHECK (status IN ('IN_PROGRESS','SUBMITTED','GRADED')),
    CONSTRAINT chk_attempts_submitted_at CHECK (
        (status = 'IN_PROGRESS' AND submitted_at IS NULL) OR
        (status IN ('SUBMITTED','GRADED') AND submitted_at IS NOT NULL)
    )
);

CREATE INDEX idx_attempts_student_started ON assessment.quiz_attempts(student_id, started_at DESC);
CREATE INDEX idx_attempts_quiz_status ON assessment.quiz_attempts(quiz_id, status);
CREATE UNIQUE INDEX uq_attempts_one_in_progress ON assessment.quiz_attempts(quiz_id, student_id) WHERE status = 'IN_PROGRESS';

CREATE TABLE assessment.quiz_attempt_answers (
    attempt_answer_id    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    attempt_id           BIGINT NOT NULL,
    quiz_id              BIGINT NOT NULL,
    question_id          BIGINT NOT NULL,
    answer_id            BIGINT,
    is_correct           BOOLEAN,
    score_awarded        NUMERIC(6,2) NOT NULL DEFAULT 0,
    answered_at          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_attempt_answer_selection UNIQUE(attempt_id, question_id, answer_id),
    CONSTRAINT fk_attempt_answers_attempt_quiz FOREIGN KEY (attempt_id, quiz_id)
        REFERENCES assessment.quiz_attempts(attempt_id, quiz_id) ON DELETE CASCADE,
    CONSTRAINT fk_attempt_answers_question_quiz FOREIGN KEY (question_id, quiz_id)
        REFERENCES assessment.questions(question_id, quiz_id) ON DELETE RESTRICT,
    CONSTRAINT fk_attempt_answers_answer_question FOREIGN KEY (answer_id, question_id)
        REFERENCES assessment.answers(answer_id, question_id) ON DELETE RESTRICT,
    CONSTRAINT chk_attempt_answers_score CHECK (score_awarded >= 0)
);

CREATE INDEX idx_attempt_answers_attempt ON assessment.quiz_attempt_answers(attempt_id, question_id);
CREATE UNIQUE INDEX uq_attempt_answers_unanswered ON assessment.quiz_attempt_answers(attempt_id, question_id) WHERE answer_id IS NULL;

-- =============================================================
-- 6. LEARNING TRACKER + HUSPM + RECOMMENDATION
-- =============================================================

CREATE TABLE learning.learning_sequence_logs (
    log_id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    event_uuid           UUID NOT NULL DEFAULT gen_random_uuid(),
    student_id           BIGINT NOT NULL REFERENCES auth.users(user_id) ON DELETE RESTRICT,
    course_id            BIGINT NOT NULL REFERENCES lms.courses(course_id) ON DELETE RESTRICT,
    lesson_id            BIGINT,
    quiz_id              BIGINT,
    quiz_attempt_id      BIGINT,
    learning_session_id  UUID NOT NULL,
    action               VARCHAR(50) NOT NULL,
    occurred_at          TIMESTAMPTZ NOT NULL,
    recorded_at          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    quiz_score           NUMERIC(5,2),
    duration_seconds     INTEGER,
    completion_status    VARCHAR(30),
    source               VARCHAR(20) NOT NULL DEFAULT 'WEB',
    data_source          VARCHAR(20) NOT NULL DEFAULT 'REAL',
    metadata             JSONB NOT NULL DEFAULT '{}'::jsonb,
    CONSTRAINT uq_learning_logs_event_uuid UNIQUE(event_uuid),
    CONSTRAINT fk_learning_logs_enrollment FOREIGN KEY (student_id, course_id)
        REFERENCES enrollment.enrollments(student_id, course_id) ON DELETE RESTRICT,
    CONSTRAINT fk_learning_logs_lesson_course FOREIGN KEY (lesson_id, course_id)
        REFERENCES lms.lessons(lesson_id, course_id) ON DELETE RESTRICT,
    CONSTRAINT fk_learning_logs_quiz_course FOREIGN KEY (quiz_id, course_id)
        REFERENCES assessment.quizzes(quiz_id, course_id) ON DELETE RESTRICT,
    CONSTRAINT fk_learning_logs_attempt_quiz FOREIGN KEY (quiz_attempt_id, quiz_id)
        REFERENCES assessment.quiz_attempts(attempt_id, quiz_id) ON DELETE RESTRICT,
    CONSTRAINT chk_learning_logs_attempt_quiz CHECK (quiz_attempt_id IS NULL OR quiz_id IS NOT NULL),
    CONSTRAINT chk_learning_logs_action CHECK (action IN (
        'VIEW_LESSON','COMPLETE_LESSON','START_QUIZ','SUBMIT_QUIZ','REVIEW_LESSON'
    )),
    CONSTRAINT chk_learning_logs_score CHECK (quiz_score IS NULL OR quiz_score BETWEEN 0 AND 10),
    CONSTRAINT chk_learning_logs_duration CHECK (duration_seconds IS NULL OR duration_seconds >= 0),
    CONSTRAINT chk_learning_logs_completion CHECK (
        completion_status IS NULL OR completion_status IN ('NOT_STARTED','IN_PROGRESS','COMPLETED','FAILED')
    ),
    CONSTRAINT chk_learning_logs_source CHECK (source IN ('WEB','MOBILE','API','IMPORT')),
    CONSTRAINT chk_learning_logs_data_source CHECK (data_source IN ('REAL','KAGGLE','SYNTHETIC')),
    CONSTRAINT chk_learning_logs_time CHECK (recorded_at >= occurred_at - INTERVAL '7 days')
);

CREATE INDEX idx_logs_student_course_time ON learning.learning_sequence_logs(student_id, course_id, occurred_at);
CREATE INDEX idx_logs_course_time ON learning.learning_sequence_logs(course_id, occurred_at);
CREATE INDEX idx_logs_session_time ON learning.learning_sequence_logs(student_id, learning_session_id, occurred_at);
CREATE INDEX idx_logs_quiz_attempt ON learning.learning_sequence_logs(quiz_attempt_id) WHERE quiz_attempt_id IS NOT NULL;
CREATE INDEX idx_logs_real_events ON learning.learning_sequence_logs(course_id, occurred_at) WHERE data_source = 'REAL';

CREATE TABLE learning.lesson_progress (
    lesson_progress_id   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    student_id           BIGINT NOT NULL REFERENCES auth.users(user_id) ON DELETE RESTRICT,
    course_id            BIGINT NOT NULL REFERENCES lms.courses(course_id) ON DELETE RESTRICT,
    lesson_id            BIGINT NOT NULL,
    status               VARCHAR(20) NOT NULL DEFAULT 'NOT_STARTED',
    progress_percent     NUMERIC(5,2) NOT NULL DEFAULT 0,
    first_viewed_at      TIMESTAMPTZ,
    last_viewed_at       TIMESTAMPTZ,
    completed_at         TIMESTAMPTZ,
    watch_duration_seconds BIGINT NOT NULL DEFAULT 0,
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_lesson_progress_student_lesson UNIQUE(student_id, lesson_id),
    CONSTRAINT fk_lesson_progress_enrollment FOREIGN KEY (student_id, course_id)
        REFERENCES enrollment.enrollments(student_id, course_id) ON DELETE RESTRICT,
    CONSTRAINT fk_lesson_progress_lesson_course FOREIGN KEY (lesson_id, course_id)
        REFERENCES lms.lessons(lesson_id, course_id) ON DELETE RESTRICT,
    CONSTRAINT chk_lesson_progress_status CHECK (status IN ('NOT_STARTED','IN_PROGRESS','COMPLETED')),
    CONSTRAINT chk_lesson_progress_percent CHECK (progress_percent BETWEEN 0 AND 100),
    CONSTRAINT chk_lesson_progress_duration CHECK (watch_duration_seconds >= 0),
    CONSTRAINT chk_lesson_progress_completed CHECK ((status <> 'COMPLETED') OR completed_at IS NOT NULL)
);

CREATE INDEX idx_lesson_progress_student_course ON learning.lesson_progress(student_id, course_id, status);

CREATE TABLE learning.mining_runs (
    mining_run_id        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    course_id            BIGINT REFERENCES lms.courses(course_id) ON DELETE RESTRICT,
    algorithm_family     VARCHAR(30) NOT NULL DEFAULT 'HUSPM',
    algorithm_name       VARCHAR(60) NOT NULL DEFAULT 'HUSP-SP',
    algorithm_version    VARCHAR(50),
    dataset_version      VARCHAR(100) NOT NULL,
    code_version         VARCHAR(100),
    min_support          NUMERIC(8,6),
    min_utility          NUMERIC(14,6) NOT NULL,
    utility_definition   JSONB NOT NULL,
    parameters           JSONB NOT NULL DEFAULT '{}'::jsonb,
    metrics              JSONB NOT NULL DEFAULT '{}'::jsonb,
    data_window_start    TIMESTAMPTZ,
    data_window_end      TIMESTAMPTZ,
    sequence_count       INTEGER NOT NULL DEFAULT 0,
    event_count          BIGINT NOT NULL DEFAULT 0,
    pattern_count        INTEGER NOT NULL DEFAULT 0,
    runtime_ms           BIGINT,
    peak_memory_mb       NUMERIC(12,2),
    status               VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    started_at           TIMESTAMPTZ,
    finished_at          TIMESTAMPTZ,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_mining_family CHECK (algorithm_family = 'HUSPM'),
    CONSTRAINT chk_mining_min_support CHECK (min_support IS NULL OR min_support BETWEEN 0 AND 1),
    CONSTRAINT chk_mining_min_utility CHECK (min_utility >= 0),
    CONSTRAINT chk_mining_counts CHECK (sequence_count >= 0 AND event_count >= 0 AND pattern_count >= 0),
    CONSTRAINT chk_mining_runtime CHECK (runtime_ms IS NULL OR runtime_ms >= 0),
    CONSTRAINT chk_mining_memory CHECK (peak_memory_mb IS NULL OR peak_memory_mb >= 0),
    CONSTRAINT chk_mining_status CHECK (status IN ('PENDING','RUNNING','SUCCEEDED','FAILED','CANCELLED')),
    CONSTRAINT chk_mining_window CHECK (data_window_end IS NULL OR data_window_start IS NULL OR data_window_end >= data_window_start),
    CONSTRAINT chk_mining_finished CHECK (finished_at IS NULL OR started_at IS NULL OR finished_at >= started_at)
);

CREATE INDEX idx_mining_runs_course_created ON learning.mining_runs(course_id, created_at DESC);
CREATE INDEX idx_mining_runs_status ON learning.mining_runs(status, created_at DESC);

CREATE TABLE learning.high_utility_patterns (
    pattern_id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    mining_run_id        BIGINT NOT NULL REFERENCES learning.mining_runs(mining_run_id) ON DELETE CASCADE,
    course_id            BIGINT NOT NULL REFERENCES lms.courses(course_id) ON DELETE RESTRICT,
    pattern_signature    VARCHAR(255) NOT NULL,
    support_count        INTEGER NOT NULL,
    support              NUMERIC(8,6) NOT NULL,
    pattern_utility      NUMERIC(14,6) NOT NULL,
    utility_ratio        NUMERIC(10,6),
    pattern_length       INTEGER NOT NULL,
    is_active            BOOLEAN NOT NULL DEFAULT TRUE,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_patterns_run_signature UNIQUE(mining_run_id, pattern_signature),
    CONSTRAINT uq_patterns_id_course UNIQUE(pattern_id, course_id),
    CONSTRAINT chk_patterns_support_count CHECK (support_count >= 0),
    CONSTRAINT chk_patterns_support CHECK (support BETWEEN 0 AND 1),
    CONSTRAINT chk_patterns_utility CHECK (pattern_utility >= 0),
    CONSTRAINT chk_patterns_utility_ratio CHECK (utility_ratio IS NULL OR utility_ratio >= 0),
    CONSTRAINT chk_patterns_length CHECK (pattern_length > 0)
);

CREATE INDEX idx_patterns_run_utility ON learning.high_utility_patterns(mining_run_id, pattern_utility DESC);
CREATE INDEX idx_patterns_course_active ON learning.high_utility_patterns(course_id, pattern_utility DESC) WHERE is_active = TRUE;

CREATE TABLE learning.pattern_steps (
    pattern_step_id      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    pattern_id           BIGINT NOT NULL,
    course_id            BIGINT NOT NULL,
    step_order           INTEGER NOT NULL,
    lesson_id            BIGINT NOT NULL,
    action               VARCHAR(50) NOT NULL DEFAULT 'COMPLETE_LESSON',
    utility_contribution NUMERIC(14,6),
    CONSTRAINT uq_pattern_steps_order UNIQUE(pattern_id, step_order),
    CONSTRAINT fk_pattern_steps_pattern_course FOREIGN KEY (pattern_id, course_id)
        REFERENCES learning.high_utility_patterns(pattern_id, course_id) ON DELETE CASCADE,
    CONSTRAINT fk_pattern_steps_lesson_course FOREIGN KEY (lesson_id, course_id)
        REFERENCES lms.lessons(lesson_id, course_id) ON DELETE RESTRICT,
    CONSTRAINT chk_pattern_steps_order CHECK (step_order > 0),
    CONSTRAINT chk_pattern_steps_action CHECK (action IN ('VIEW_LESSON','COMPLETE_LESSON','REVIEW_LESSON','START_QUIZ','SUBMIT_QUIZ')),
    CONSTRAINT chk_pattern_steps_utility CHECK (utility_contribution IS NULL OR utility_contribution >= 0)
);

CREATE INDEX idx_pattern_steps_pattern ON learning.pattern_steps(pattern_id, step_order);

CREATE TABLE learning.model_registry (
    model_id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    model_name           VARCHAR(120) NOT NULL,
    model_type           VARCHAR(50) NOT NULL,
    model_version        VARCHAR(80) NOT NULL,
    dataset_version      VARCHAR(100) NOT NULL,
    artifact_uri         TEXT,
    parameters           JSONB NOT NULL DEFAULT '{}'::jsonb,
    metrics              JSONB NOT NULL DEFAULT '{}'::jsonb,
    trained_at           TIMESTAMPTZ,
    is_active            BOOLEAN NOT NULL DEFAULT FALSE,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_model_registry_name_version UNIQUE(model_name, model_version),
    CONSTRAINT chk_model_type CHECK (model_type IN ('KMEANS','COLLABORATIVE_FILTERING','XGBOOST','DECISION_TREE','BERT4REC','HYBRID','OTHER'))
);

CREATE INDEX idx_model_registry_active ON learning.model_registry(model_type, is_active);
CREATE UNIQUE INDEX uq_model_registry_one_active ON learning.model_registry(model_type) WHERE is_active = TRUE;

CREATE TABLE learning.learning_path_recommendations (
    recommendation_id    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    student_id           BIGINT NOT NULL REFERENCES auth.users(user_id) ON DELETE RESTRICT,
    course_id            BIGINT NOT NULL REFERENCES lms.courses(course_id) ON DELETE RESTRICT,
    current_lesson_id    BIGINT,
    recommended_lesson_id BIGINT NOT NULL,
    pattern_id           BIGINT,
    model_id             BIGINT REFERENCES learning.model_registry(model_id) ON DELETE SET NULL,
    source_type          VARCHAR(20) NOT NULL DEFAULT 'HUSPM',
    recommendation_score NUMERIC(10,6) NOT NULL,
    reason               TEXT NOT NULL,
    recommendation_order INTEGER NOT NULL DEFAULT 1,
    status               VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    generated_at         TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at           TIMESTAMPTZ,
    CONSTRAINT uq_recs_id_student UNIQUE(recommendation_id, student_id),
    CONSTRAINT fk_recs_enrollment FOREIGN KEY (student_id, course_id)
        REFERENCES enrollment.enrollments(student_id, course_id) ON DELETE RESTRICT,
    CONSTRAINT fk_recs_current_lesson_course FOREIGN KEY (current_lesson_id, course_id)
        REFERENCES lms.lessons(lesson_id, course_id) ON DELETE RESTRICT,
    CONSTRAINT fk_recs_recommended_lesson_course FOREIGN KEY (recommended_lesson_id, course_id)
        REFERENCES lms.lessons(lesson_id, course_id) ON DELETE RESTRICT,
    CONSTRAINT fk_recs_pattern_course FOREIGN KEY (pattern_id, course_id)
        REFERENCES learning.high_utility_patterns(pattern_id, course_id) ON DELETE RESTRICT,
    CONSTRAINT chk_recs_score CHECK (recommendation_score BETWEEN 0 AND 1),
    CONSTRAINT chk_recs_order CHECK (recommendation_order > 0),
    CONSTRAINT chk_recs_source CHECK (source_type IN ('HUSPM','MODEL','HYBRID','FALLBACK')),
    CONSTRAINT chk_recs_status CHECK (status IN ('ACTIVE','SHOWN','ACCEPTED','IGNORED','COMPLETED','EXPIRED','REPLACED')),
    CONSTRAINT chk_recs_expiry CHECK (expires_at IS NULL OR expires_at > generated_at),
    CONSTRAINT chk_recs_source_reference CHECK (
        (source_type = 'HUSPM' AND pattern_id IS NOT NULL) OR
        (source_type = 'MODEL' AND model_id IS NOT NULL) OR
        (source_type = 'HYBRID' AND pattern_id IS NOT NULL AND model_id IS NOT NULL) OR
        (source_type = 'FALLBACK')
    )
);

CREATE INDEX idx_recs_student_active ON learning.learning_path_recommendations(student_id, course_id, recommendation_order)
WHERE status IN ('ACTIVE','SHOWN');
CREATE INDEX idx_recs_course_lesson ON learning.learning_path_recommendations(course_id, recommended_lesson_id, generated_at DESC);

CREATE TABLE learning.recommendation_feedback (
    feedback_id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    recommendation_id    BIGINT NOT NULL,
    student_id           BIGINT NOT NULL REFERENCES auth.users(user_id) ON DELETE RESTRICT,
    feedback_action      VARCHAR(20) NOT NULL,
    rating               SMALLINT,
    comment              TEXT,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_recommendation_feedback_student UNIQUE(recommendation_id, student_id),
    CONSTRAINT fk_feedback_recommendation_student FOREIGN KEY (recommendation_id, student_id)
        REFERENCES learning.learning_path_recommendations(recommendation_id, student_id) ON DELETE CASCADE,
    CONSTRAINT chk_feedback_action CHECK (feedback_action IN ('ACCEPTED','IGNORED','DISMISSED','COMPLETED')),
    CONSTRAINT chk_feedback_rating CHECK (rating IS NULL OR rating BETWEEN 1 AND 5)
);

CREATE INDEX idx_feedback_student_created ON learning.recommendation_feedback(student_id, created_at DESC);

-- =============================================================
-- 7. CERTIFICATE
-- =============================================================

CREATE TABLE lms.certificates (
    certificate_id       BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    enrollment_id        BIGINT NOT NULL UNIQUE,
    student_id           BIGINT NOT NULL REFERENCES auth.users(user_id) ON DELETE RESTRICT,
    course_id            BIGINT NOT NULL REFERENCES lms.courses(course_id) ON DELETE RESTRICT,
    certificate_code     VARCHAR(100) NOT NULL UNIQUE,
    verification_hash    VARCHAR(128) NOT NULL UNIQUE,
    file_url             TEXT,
    status               VARCHAR(20) NOT NULL DEFAULT 'ISSUED',
    issued_at            TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revoked_at           TIMESTAMPTZ,
    CONSTRAINT fk_certificates_enrollment_context FOREIGN KEY (enrollment_id, student_id, course_id)
        REFERENCES enrollment.enrollments(enrollment_id, student_id, course_id) ON DELETE RESTRICT,
    CONSTRAINT chk_certificates_status CHECK (status IN ('ISSUED','REVOKED')),
    CONSTRAINT chk_certificates_revoked CHECK ((status <> 'REVOKED') OR revoked_at IS NOT NULL)
);

CREATE INDEX idx_certificates_student_course ON lms.certificates(student_id, course_id);

-- =============================================================
-- 8. SUPPORT / STUDENT CARE
-- =============================================================

CREATE TABLE support.tickets (
    ticket_id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    student_id           BIGINT NOT NULL REFERENCES auth.users(user_id) ON DELETE RESTRICT,
    assigned_to          BIGINT REFERENCES auth.users(user_id) ON DELETE SET NULL,
    subject              VARCHAR(220) NOT NULL,
    category             VARCHAR(50) NOT NULL DEFAULT 'GENERAL',
    priority             VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
    status               VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    created_at           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at          TIMESTAMPTZ,
    CONSTRAINT chk_tickets_subject_nonblank CHECK (btrim(subject) <> ''),
    CONSTRAINT chk_tickets_priority CHECK (priority IN ('LOW','NORMAL','HIGH','URGENT')),
    CONSTRAINT chk_tickets_status CHECK (status IN ('OPEN','IN_PROGRESS','RESOLVED','CLOSED')),
    CONSTRAINT chk_tickets_resolved CHECK ((status NOT IN ('RESOLVED','CLOSED')) OR resolved_at IS NOT NULL)
);

CREATE INDEX idx_tickets_student_status ON support.tickets(student_id, status, created_at DESC);
CREATE INDEX idx_tickets_assignee_status ON support.tickets(assigned_to, status) WHERE assigned_to IS NOT NULL;

CREATE TABLE support.ticket_messages (
    message_id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ticket_id            BIGINT NOT NULL REFERENCES support.tickets(ticket_id) ON DELETE CASCADE,
    sender_id            BIGINT NOT NULL REFERENCES auth.users(user_id) ON DELETE RESTRICT,
    message_text         TEXT NOT NULL,
    attachment_url       TEXT,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_ticket_messages_nonblank CHECK (btrim(message_text) <> '')
);

CREATE INDEX idx_ticket_messages_ticket_time ON support.ticket_messages(ticket_id, created_at);

-- =============================================================
-- 9. SYSTEM CONFIGURATION & AUDIT
-- =============================================================

CREATE TABLE system_config.settings (
    setting_id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    setting_key          VARCHAR(120) NOT NULL UNIQUE,
    setting_value        JSONB NOT NULL,
    data_type            VARCHAR(20) NOT NULL,
    description          TEXT,
    updated_by           BIGINT REFERENCES auth.users(user_id) ON DELETE SET NULL,
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_settings_key_nonblank CHECK (btrim(setting_key) <> ''),
    CONSTRAINT chk_settings_type CHECK (data_type IN ('NUMBER','BOOLEAN','STRING','JSON'))
);

CREATE TABLE system_config.audit_logs (
    audit_id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id              BIGINT,
    action               VARCHAR(20) NOT NULL,
    schema_name          VARCHAR(100) NOT NULL,
    table_name           VARCHAR(100) NOT NULL,
    record_id            TEXT,
    old_data             JSONB,
    new_data             JSONB,
    request_id           UUID,
    ip_address           INET,
    user_agent           TEXT,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_audit_action CHECK (action IN ('INSERT','UPDATE','DELETE'))
);

CREATE INDEX idx_audit_table_time ON system_config.audit_logs(schema_name, table_name, created_at DESC);
CREATE INDEX idx_audit_user_time ON system_config.audit_logs(user_id, created_at DESC) WHERE user_id IS NOT NULL;

-- =============================================================
-- 10. FUNCTIONS
-- =============================================================

CREATE OR REPLACE FUNCTION system_config.fn_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION system_config.fn_audit_row()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_user_id BIGINT;
    v_record_id TEXT;
    v_old JSONB;
    v_new JSONB;
    v_actor TEXT;
BEGIN
    v_actor := current_setting('app.user_id', true);
    IF v_actor ~ '^[0-9]+$' THEN
        v_user_id := v_actor::BIGINT;
    END IF;

    IF TG_OP = 'DELETE' THEN
        v_old := to_jsonb(OLD) - ARRAY['password_hash','refresh_token_hash'];
        v_new := NULL;
        v_record_id := to_jsonb(OLD) ->> TG_ARGV[0];
    ELSE
        v_new := to_jsonb(NEW) - ARRAY['password_hash','refresh_token_hash'];
        v_record_id := to_jsonb(NEW) ->> TG_ARGV[0];
        IF TG_OP = 'UPDATE' THEN
            v_old := to_jsonb(OLD) - ARRAY['password_hash','refresh_token_hash'];
        ELSE
            v_old := NULL;
        END IF;
    END IF;

    INSERT INTO system_config.audit_logs(
        user_id, action, schema_name, table_name, record_id,
        old_data, new_data, request_id, ip_address, user_agent
    )
    VALUES (
        v_user_id, TG_OP, TG_TABLE_SCHEMA, TG_TABLE_NAME, v_record_id,
        v_old, v_new,
        NULLIF(current_setting('app.request_id', true), '')::UUID,
        NULLIF(current_setting('app.ip_address', true), '')::INET,
        NULLIF(current_setting('app.user_agent', true), '')
    );

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION auth.fn_require_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_column TEXT := TG_ARGV[0];
    v_expected_role TEXT := TG_ARGV[1];
    v_user_id BIGINT;
    v_role TEXT;
    v_active BOOLEAN;
BEGIN
    v_user_id := (to_jsonb(NEW) ->> v_column)::BIGINT;
    SELECT role, is_active INTO v_role, v_active
    FROM auth.users
    WHERE user_id = v_user_id;

    IF v_role IS NULL THEN
        RAISE EXCEPTION 'User % referenced by column % does not exist', v_user_id, v_column;
    END IF;
    IF v_role <> v_expected_role THEN
        RAISE EXCEPTION 'User % must have role %, current role is %', v_user_id, v_expected_role, v_role;
    END IF;
    IF v_active IS NOT TRUE THEN
        RAISE EXCEPTION 'User % is inactive', v_user_id;
    END IF;
    RETURN NEW;
END;
$$;

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
BEGIN
    INSERT INTO auth.users(full_name, email, password_hash, role)
    VALUES (btrim(p_full_name), lower(btrim(p_email)), p_password_hash, upper(p_role))
    RETURNING user_id INTO v_user_id;
    RETURN v_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION lms.fn_apply_soft_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.is_deleted = TRUE AND OLD.is_deleted = FALSE THEN
        NEW.deleted_at := CURRENT_TIMESTAMP;
    ELSIF NEW.is_deleted = FALSE AND OLD.is_deleted = TRUE THEN
        NEW.deleted_at := NULL;
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION enrollment.fn_prepare_enrollment()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_price NUMERIC(12,2);
    v_currency CHAR(3);
BEGIN
    SELECT price, currency INTO v_price, v_currency
    FROM lms.courses
    WHERE course_id = NEW.course_id AND is_deleted = FALSE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Course % does not exist or is deleted', NEW.course_id;
    END IF;

    IF TG_OP = 'INSERT' THEN
        NEW.listed_price := v_price;
        NEW.currency := v_currency;
    ELSE
        IF OLD.status = 'COMPLETED' AND NEW.status <> 'COMPLETED' THEN
            RAISE EXCEPTION 'A completed enrollment cannot be reactivated or cancelled';
        END IF;
        IF NEW.course_id IS DISTINCT FROM OLD.course_id OR NEW.listed_price IS NULL THEN
            NEW.listed_price := v_price;
            NEW.currency := v_currency;
        END IF;
    END IF;

    NEW.discount_amount := COALESCE(NEW.discount_amount, 0);
    NEW.final_price := NEW.listed_price - NEW.discount_amount;

    IF NEW.status = 'ACTIVE' THEN
        NEW.cancelled_at := NULL;
    ELSIF NEW.status = 'COMPLETED' AND NEW.completed_at IS NULL THEN
        NEW.completed_at := CURRENT_TIMESTAMP;
    ELSIF NEW.status = 'CANCELLED' AND NEW.cancelled_at IS NULL THEN
        NEW.cancelled_at := CURRENT_TIMESTAMP;
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION enrollment.fn_enroll_student(
    p_student_id BIGINT,
    p_course_id BIGINT,
    p_discount_amount NUMERIC DEFAULT 0
)
RETURNS BIGINT
LANGUAGE plpgsql
AS $$
DECLARE
    v_existing enrollment.enrollments%ROWTYPE;
    v_enrollment_id BIGINT;
BEGIN
    SELECT * INTO v_existing
    FROM enrollment.enrollments
    WHERE student_id = p_student_id AND course_id = p_course_id
    FOR UPDATE;

    IF FOUND THEN
        IF v_existing.status = 'COMPLETED' THEN
            RAISE EXCEPTION 'Student % has already completed course %', p_student_id, p_course_id;
        ELSIF v_existing.status = 'ACTIVE' THEN
            RETURN v_existing.enrollment_id;
        ELSE
            UPDATE enrollment.enrollments
            SET status = 'ACTIVE', cancelled_at = NULL,
                discount_amount = p_discount_amount,
                listed_price = NULL,
                final_price = 0,
                enrolled_at = CURRENT_TIMESTAMP
            WHERE enrollment_id = v_existing.enrollment_id
            RETURNING enrollment_id INTO v_enrollment_id;
            RETURN v_enrollment_id;
        END IF;
    END IF;

    INSERT INTO enrollment.enrollments(
        student_id, course_id, listed_price, discount_amount, final_price
    ) VALUES (
        p_student_id, p_course_id, NULL, p_discount_amount, 0
    ) RETURNING enrollment_id INTO v_enrollment_id;

    RETURN v_enrollment_id;
END;
$$;

CREATE OR REPLACE FUNCTION payment.fn_create_order(p_enrollment_id BIGINT)
RETURNS BIGINT
LANGUAGE plpgsql
AS $$
DECLARE
    v_order_id BIGINT;
    v_e enrollment.enrollments%ROWTYPE;
BEGIN
    SELECT * INTO v_e
    FROM enrollment.enrollments
    WHERE enrollment_id = p_enrollment_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Enrollment % does not exist', p_enrollment_id;
    END IF;

    INSERT INTO payment.orders(
        enrollment_id, student_id, course_id, listed_price,
        discount_amount, final_amount, currency
    ) VALUES (
        v_e.enrollment_id, v_e.student_id, v_e.course_id, v_e.listed_price,
        v_e.discount_amount, v_e.final_price, v_e.currency
    )
    ON CONFLICT (enrollment_id) DO UPDATE SET
        student_id = EXCLUDED.student_id,
        course_id = EXCLUDED.course_id,
        listed_price = EXCLUDED.listed_price,
        discount_amount = EXCLUDED.discount_amount,
        final_amount = EXCLUDED.final_amount,
        currency = EXCLUDED.currency,
        status = 'PENDING',
        paid_at = NULL,
        cancelled_at = NULL,
        refunded_at = NULL,
        updated_at = CURRENT_TIMESTAMP
    WHERE payment.orders.status IN ('PENDING','CANCELLED')
    RETURNING order_id INTO v_order_id;

    IF v_order_id IS NULL THEN
        SELECT order_id INTO v_order_id FROM payment.orders WHERE enrollment_id = p_enrollment_id;
    END IF;

    RETURN v_order_id;
END;
$$;

CREATE OR REPLACE FUNCTION payment.fn_validate_order_snapshot()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_e enrollment.enrollments%ROWTYPE;
BEGIN
    SELECT * INTO v_e FROM enrollment.enrollments WHERE enrollment_id = NEW.enrollment_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Enrollment % does not exist', NEW.enrollment_id;
    END IF;
    IF NEW.student_id <> v_e.student_id OR NEW.course_id <> v_e.course_id THEN
        RAISE EXCEPTION 'Order student/course must match enrollment context';
    END IF;
    IF NEW.listed_price <> v_e.listed_price OR NEW.discount_amount <> v_e.discount_amount
       OR NEW.final_amount <> v_e.final_price OR NEW.currency <> v_e.currency THEN
        RAISE EXCEPTION 'Order financial snapshot must match enrollment snapshot';
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION payment.fn_validate_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_amount NUMERIC(12,2);
    v_currency CHAR(3);
    v_order_status VARCHAR(20);
BEGIN
    SELECT final_amount, currency, status
      INTO v_amount, v_currency, v_order_status
    FROM payment.orders
    WHERE order_id = NEW.order_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order % does not exist', NEW.order_id;
    END IF;
    IF v_order_status = 'CANCELLED' THEN
        RAISE EXCEPTION 'Cannot pay cancelled order %', NEW.order_id;
    END IF;
    IF NEW.amount <> v_amount THEN
        RAISE EXCEPTION 'Payment amount % must equal order final amount %', NEW.amount, v_amount;
    END IF;
    IF NEW.currency <> v_currency THEN
        RAISE EXCEPTION 'Payment currency % must equal order currency %', NEW.currency, v_currency;
    END IF;

    IF NEW.status = 'PAID' AND NEW.paid_at IS NULL THEN
        NEW.paid_at := CURRENT_TIMESTAMP;
    ELSIF NEW.status = 'FAILED' AND NEW.failed_at IS NULL THEN
        NEW.failed_at := CURRENT_TIMESTAMP;
    ELSIF NEW.status = 'REFUNDED' AND NEW.refunded_at IS NULL THEN
        NEW.refunded_at := CURRENT_TIMESTAMP;
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION payment.fn_sync_order_payment_status()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.status = 'PAID' THEN
        UPDATE payment.orders
        SET status = 'PAID', paid_at = COALESCE(paid_at, NEW.paid_at, CURRENT_TIMESTAMP)
        WHERE order_id = NEW.order_id AND status <> 'REFUNDED';
    ELSIF NEW.status = 'REFUNDED' THEN
        UPDATE payment.orders
        SET status = 'REFUNDED', refunded_at = COALESCE(refunded_at, NEW.refunded_at, CURRENT_TIMESTAMP)
        WHERE order_id = NEW.order_id;
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION assessment.fn_validate_quiz_attempt()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_max_attempts INTEGER;
BEGIN
    SELECT max_attempts INTO v_max_attempts
    FROM assessment.quizzes
    WHERE quiz_id = NEW.quiz_id AND course_id = NEW.course_id
      AND is_deleted = FALSE AND is_published = TRUE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Quiz % is unavailable for course %', NEW.quiz_id, NEW.course_id;
    END IF;
    IF NEW.attempt_no > v_max_attempts THEN
        RAISE EXCEPTION 'Attempt % exceeds max_attempts % for quiz %', NEW.attempt_no, v_max_attempts, NEW.quiz_id;
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION assessment.fn_validate_attempt_answer()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_question_type VARCHAR(30);
    v_existing_count INTEGER;
BEGIN
    SELECT question_type INTO v_question_type
    FROM assessment.questions
    WHERE question_id = NEW.question_id AND quiz_id = NEW.quiz_id;

    IF v_question_type IS NULL THEN
        RAISE EXCEPTION 'Question % does not belong to quiz %', NEW.question_id, NEW.quiz_id;
    END IF;

    IF v_question_type IN ('SINGLE_CHOICE','TRUE_FALSE') AND NEW.answer_id IS NOT NULL THEN
        SELECT COUNT(*) INTO v_existing_count
        FROM assessment.quiz_attempt_answers
        WHERE attempt_id = NEW.attempt_id
          AND question_id = NEW.question_id
          AND attempt_answer_id <> COALESCE(NEW.attempt_answer_id, -1);

        IF v_existing_count > 0 THEN
            RAISE EXCEPTION 'Question % permits only one selected answer', NEW.question_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION learning.fn_validate_learning_event()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.action IN ('VIEW_LESSON','COMPLETE_LESSON','REVIEW_LESSON') AND NEW.lesson_id IS NULL THEN
        RAISE EXCEPTION 'lesson_id is required for action %', NEW.action;
    END IF;

    IF NEW.action IN ('START_QUIZ','SUBMIT_QUIZ') AND NEW.quiz_id IS NULL THEN
        RAISE EXCEPTION 'quiz_id is required for action %', NEW.action;
    END IF;
    IF NEW.action IN ('START_QUIZ','SUBMIT_QUIZ') AND NEW.quiz_attempt_id IS NULL THEN
        RAISE EXCEPTION 'quiz_attempt_id is required for action %', NEW.action;
    END IF;

    IF NEW.action = 'SUBMIT_QUIZ' THEN
        IF NEW.quiz_attempt_id IS NULL THEN
            RAISE EXCEPTION 'quiz_attempt_id is required for SUBMIT_QUIZ';
        END IF;
        IF NEW.quiz_score IS NULL THEN
            RAISE EXCEPTION 'quiz_score is required for SUBMIT_QUIZ';
        END IF;
    END IF;

    IF NEW.action = 'COMPLETE_LESSON' AND NEW.completion_status IS DISTINCT FROM 'COMPLETED' THEN
        NEW.completion_status := 'COMPLETED';
    END IF;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION learning.fn_log_learning_event(
    p_event_uuid UUID,
    p_student_id BIGINT,
    p_course_id BIGINT,
    p_lesson_id BIGINT,
    p_quiz_id BIGINT,
    p_quiz_attempt_id BIGINT,
    p_learning_session_id UUID,
    p_action VARCHAR,
    p_occurred_at TIMESTAMPTZ,
    p_quiz_score NUMERIC DEFAULT NULL,
    p_duration_seconds INTEGER DEFAULT NULL,
    p_completion_status VARCHAR DEFAULT NULL,
    p_source VARCHAR DEFAULT 'WEB',
    p_data_source VARCHAR DEFAULT 'REAL',
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS BIGINT
LANGUAGE plpgsql
AS $$
DECLARE
    v_log_id BIGINT;
BEGIN
    INSERT INTO learning.learning_sequence_logs(
        event_uuid, student_id, course_id, lesson_id, quiz_id, quiz_attempt_id,
        learning_session_id, action, occurred_at, quiz_score, duration_seconds,
        completion_status, source, data_source, metadata
    ) VALUES (
        p_event_uuid, p_student_id, p_course_id, p_lesson_id, p_quiz_id, p_quiz_attempt_id,
        p_learning_session_id, upper(p_action), p_occurred_at, p_quiz_score, p_duration_seconds,
        p_completion_status, upper(p_source), upper(p_data_source), COALESCE(p_metadata, '{}'::jsonb)
    )
    ON CONFLICT (event_uuid) DO NOTHING
    RETURNING log_id INTO v_log_id;

    IF v_log_id IS NULL THEN
        SELECT log_id INTO v_log_id
        FROM learning.learning_sequence_logs
        WHERE event_uuid = p_event_uuid;
    END IF;

    RETURN v_log_id;
END;
$$;

CREATE OR REPLACE FUNCTION learning.fn_sync_lesson_progress_from_event()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.lesson_id IS NULL THEN
        RETURN NEW;
    END IF;

    INSERT INTO learning.lesson_progress(
        student_id, course_id, lesson_id, status, progress_percent,
        first_viewed_at, last_viewed_at, completed_at, watch_duration_seconds
    ) VALUES (
        NEW.student_id,
        NEW.course_id,
        NEW.lesson_id,
        CASE WHEN NEW.action = 'COMPLETE_LESSON' THEN 'COMPLETED' ELSE 'IN_PROGRESS' END,
        CASE WHEN NEW.action = 'COMPLETE_LESSON' THEN 100 ELSE 0 END,
        NEW.occurred_at,
        NEW.occurred_at,
        CASE WHEN NEW.action = 'COMPLETE_LESSON' THEN NEW.occurred_at ELSE NULL END,
        COALESCE(NEW.duration_seconds, 0)
    )
    ON CONFLICT (student_id, lesson_id) DO UPDATE SET
        status = CASE
            WHEN learning.lesson_progress.status = 'COMPLETED' THEN 'COMPLETED'
            WHEN EXCLUDED.status = 'COMPLETED' THEN 'COMPLETED'
            ELSE 'IN_PROGRESS'
        END,
        progress_percent = GREATEST(learning.lesson_progress.progress_percent, EXCLUDED.progress_percent),
        first_viewed_at = COALESCE(learning.lesson_progress.first_viewed_at, EXCLUDED.first_viewed_at),
        last_viewed_at = GREATEST(learning.lesson_progress.last_viewed_at, EXCLUDED.last_viewed_at),
        completed_at = COALESCE(learning.lesson_progress.completed_at, EXCLUDED.completed_at),
        watch_duration_seconds = learning.lesson_progress.watch_duration_seconds + COALESCE(NEW.duration_seconds, 0),
        updated_at = CURRENT_TIMESTAMP;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION lms.fn_validate_certificate()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_status VARCHAR(20);
BEGIN
    SELECT status INTO v_status
    FROM enrollment.enrollments
    WHERE enrollment_id = NEW.enrollment_id
      AND student_id = NEW.student_id
      AND course_id = NEW.course_id;

    IF v_status IS NULL THEN
        RAISE EXCEPTION 'Certificate enrollment context is invalid';
    END IF;
    IF v_status <> 'COMPLETED' THEN
        RAISE EXCEPTION 'Certificate can only be issued for a completed enrollment';
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION lms.fn_issue_certificate(p_enrollment_id BIGINT, p_file_url TEXT DEFAULT NULL)
RETURNS BIGINT
LANGUAGE plpgsql
AS $$
DECLARE
    v_e enrollment.enrollments%ROWTYPE;
    v_certificate_id BIGINT;
    v_code TEXT;
    v_hash TEXT;
BEGIN
    SELECT * INTO v_e
    FROM enrollment.enrollments
    WHERE enrollment_id = p_enrollment_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Enrollment % does not exist', p_enrollment_id;
    END IF;
    IF v_e.status <> 'COMPLETED' THEN
        RAISE EXCEPTION 'Certificate can only be issued for a completed enrollment';
    END IF;

    v_code := 'VEDU-' || upper(substr(encode(gen_random_bytes(8), 'hex'), 1, 16));
    v_hash := encode(digest(v_code || ':' || v_e.student_id || ':' || v_e.course_id, 'sha256'), 'hex');

    INSERT INTO lms.certificates(
        enrollment_id, student_id, course_id, certificate_code,
        verification_hash, file_url
    ) VALUES (
        v_e.enrollment_id, v_e.student_id, v_e.course_id, v_code,
        v_hash, p_file_url
    )
    ON CONFLICT (enrollment_id) DO UPDATE SET file_url = COALESCE(EXCLUDED.file_url, lms.certificates.file_url)
    RETURNING certificate_id INTO v_certificate_id;

    RETURN v_certificate_id;
END;
$$;

CREATE OR REPLACE FUNCTION support.fn_validate_ticket_assignee()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_role VARCHAR(20);
    v_active BOOLEAN;
BEGIN
    IF NEW.assigned_to IS NULL THEN
        RETURN NEW;
    END IF;
    SELECT role, is_active INTO v_role, v_active FROM auth.users WHERE user_id = NEW.assigned_to;
    IF v_role NOT IN ('TEACHER','ADMIN') OR v_active IS NOT TRUE THEN
        RAISE EXCEPTION 'Ticket assignee must be an active TEACHER or ADMIN';
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION learning.fn_apply_recommendation_feedback()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE learning.learning_path_recommendations
    SET status = CASE NEW.feedback_action
        WHEN 'ACCEPTED' THEN 'ACCEPTED'
        WHEN 'IGNORED' THEN 'IGNORED'
        WHEN 'DISMISSED' THEN 'IGNORED'
        WHEN 'COMPLETED' THEN 'COMPLETED'
        ELSE status
    END
    WHERE recommendation_id = NEW.recommendation_id;
    RETURN NEW;
END;
$$;

-- =============================================================
-- 11. TRIGGERS
-- =============================================================

-- updated_at
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON auth.users
FOR EACH ROW EXECUTE FUNCTION system_config.fn_set_updated_at();
CREATE TRIGGER trg_courses_updated_at BEFORE UPDATE ON lms.courses
FOR EACH ROW EXECUTE FUNCTION system_config.fn_set_updated_at();
CREATE TRIGGER trg_lessons_updated_at BEFORE UPDATE ON lms.lessons
FOR EACH ROW EXECUTE FUNCTION system_config.fn_set_updated_at();
CREATE TRIGGER trg_quizzes_updated_at BEFORE UPDATE ON assessment.quizzes
FOR EACH ROW EXECUTE FUNCTION system_config.fn_set_updated_at();
CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON payment.orders
FOR EACH ROW EXECUTE FUNCTION system_config.fn_set_updated_at();
CREATE TRIGGER trg_payments_updated_at BEFORE UPDATE ON payment.payments
FOR EACH ROW EXECUTE FUNCTION system_config.fn_set_updated_at();
CREATE TRIGGER trg_lesson_progress_updated_at BEFORE UPDATE ON learning.lesson_progress
FOR EACH ROW EXECUTE FUNCTION system_config.fn_set_updated_at();
CREATE TRIGGER trg_tickets_updated_at BEFORE UPDATE ON support.tickets
FOR EACH ROW EXECUTE FUNCTION system_config.fn_set_updated_at();
CREATE TRIGGER trg_settings_updated_at BEFORE UPDATE ON system_config.settings
FOR EACH ROW EXECUTE FUNCTION system_config.fn_set_updated_at();

-- soft delete metadata
CREATE TRIGGER trg_courses_soft_delete BEFORE UPDATE OF is_deleted ON lms.courses
FOR EACH ROW EXECUTE FUNCTION lms.fn_apply_soft_delete();
CREATE TRIGGER trg_lessons_soft_delete BEFORE UPDATE OF is_deleted ON lms.lessons
FOR EACH ROW EXECUTE FUNCTION lms.fn_apply_soft_delete();
CREATE TRIGGER trg_quizzes_soft_delete BEFORE UPDATE OF is_deleted ON assessment.quizzes
FOR EACH ROW EXECUTE FUNCTION lms.fn_apply_soft_delete();

-- role integrity
CREATE TRIGGER trg_courses_teacher_role BEFORE INSERT OR UPDATE ON lms.courses
FOR EACH ROW EXECUTE FUNCTION auth.fn_require_user_role('teacher_id','TEACHER');
CREATE TRIGGER trg_enrollments_student_role BEFORE INSERT OR UPDATE ON enrollment.enrollments
FOR EACH ROW EXECUTE FUNCTION auth.fn_require_user_role('student_id','STUDENT');
CREATE TRIGGER trg_attempts_student_role BEFORE INSERT OR UPDATE ON assessment.quiz_attempts
FOR EACH ROW EXECUTE FUNCTION auth.fn_require_user_role('student_id','STUDENT');
CREATE TRIGGER trg_logs_student_role BEFORE INSERT OR UPDATE ON learning.learning_sequence_logs
FOR EACH ROW EXECUTE FUNCTION auth.fn_require_user_role('student_id','STUDENT');
CREATE TRIGGER trg_lesson_progress_student_role BEFORE INSERT OR UPDATE ON learning.lesson_progress
FOR EACH ROW EXECUTE FUNCTION auth.fn_require_user_role('student_id','STUDENT');
CREATE TRIGGER trg_recommendations_student_role BEFORE INSERT OR UPDATE ON learning.learning_path_recommendations
FOR EACH ROW EXECUTE FUNCTION auth.fn_require_user_role('student_id','STUDENT');
CREATE TRIGGER trg_feedback_student_role BEFORE INSERT OR UPDATE ON learning.recommendation_feedback
FOR EACH ROW EXECUTE FUNCTION auth.fn_require_user_role('student_id','STUDENT');
CREATE TRIGGER trg_certificates_student_role BEFORE INSERT OR UPDATE ON lms.certificates
FOR EACH ROW EXECUTE FUNCTION auth.fn_require_user_role('student_id','STUDENT');
CREATE TRIGGER trg_tickets_student_role BEFORE INSERT OR UPDATE ON support.tickets
FOR EACH ROW EXECUTE FUNCTION auth.fn_require_user_role('student_id','STUDENT');

-- enrollment price snapshot / state timestamps
CREATE TRIGGER trg_prepare_enrollment BEFORE INSERT OR UPDATE ON enrollment.enrollments FOR EACH ROW EXECUTE FUNCTION enrollment.fn_prepare_enrollment();

-- payment integrity and synchronization
CREATE TRIGGER trg_validate_order_snapshot BEFORE INSERT OR UPDATE ON payment.orders
FOR EACH ROW EXECUTE FUNCTION payment.fn_validate_order_snapshot();
CREATE TRIGGER trg_validate_payment BEFORE INSERT OR UPDATE ON payment.payments
FOR EACH ROW EXECUTE FUNCTION payment.fn_validate_payment();
CREATE TRIGGER trg_sync_order_payment AFTER INSERT OR UPDATE ON payment.payments
FOR EACH ROW EXECUTE FUNCTION payment.fn_sync_order_payment_status();

-- assessment integrity
CREATE TRIGGER trg_validate_quiz_attempt BEFORE INSERT OR UPDATE ON assessment.quiz_attempts
FOR EACH ROW EXECUTE FUNCTION assessment.fn_validate_quiz_attempt();
CREATE TRIGGER trg_validate_attempt_answer BEFORE INSERT OR UPDATE ON assessment.quiz_attempt_answers
FOR EACH ROW EXECUTE FUNCTION assessment.fn_validate_attempt_answer();

-- certificate / support integrity
CREATE TRIGGER trg_validate_certificate BEFORE INSERT OR UPDATE ON lms.certificates
FOR EACH ROW EXECUTE FUNCTION lms.fn_validate_certificate();
CREATE TRIGGER trg_validate_ticket_assignee BEFORE INSERT OR UPDATE ON support.tickets
FOR EACH ROW EXECUTE FUNCTION support.fn_validate_ticket_assignee();

-- learning event integrity and progress projection
CREATE TRIGGER trg_validate_learning_event BEFORE INSERT OR UPDATE ON learning.learning_sequence_logs
FOR EACH ROW EXECUTE FUNCTION learning.fn_validate_learning_event();
CREATE TRIGGER trg_sync_lesson_progress AFTER INSERT ON learning.learning_sequence_logs
FOR EACH ROW
WHEN (NEW.lesson_id IS NOT NULL AND NEW.action IN ('VIEW_LESSON','COMPLETE_LESSON','REVIEW_LESSON'))
EXECUTE FUNCTION learning.fn_sync_lesson_progress_from_event();
CREATE TRIGGER trg_apply_recommendation_feedback AFTER INSERT OR UPDATE ON learning.recommendation_feedback
FOR EACH ROW EXECUTE FUNCTION learning.fn_apply_recommendation_feedback();

-- audit selected business-critical tables; sensitive credential fields are masked by fn_audit_row
CREATE TRIGGER trg_audit_users AFTER INSERT OR UPDATE OR DELETE ON auth.users
FOR EACH ROW EXECUTE FUNCTION system_config.fn_audit_row('user_id');
CREATE TRIGGER trg_audit_courses AFTER INSERT OR UPDATE OR DELETE ON lms.courses
FOR EACH ROW EXECUTE FUNCTION system_config.fn_audit_row('course_id');
CREATE TRIGGER trg_audit_lessons AFTER INSERT OR UPDATE OR DELETE ON lms.lessons
FOR EACH ROW EXECUTE FUNCTION system_config.fn_audit_row('lesson_id');
CREATE TRIGGER trg_audit_quizzes AFTER INSERT OR UPDATE OR DELETE ON assessment.quizzes
FOR EACH ROW EXECUTE FUNCTION system_config.fn_audit_row('quiz_id');
CREATE TRIGGER trg_audit_orders AFTER INSERT OR UPDATE OR DELETE ON payment.orders
FOR EACH ROW EXECUTE FUNCTION system_config.fn_audit_row('order_id');
CREATE TRIGGER trg_audit_payments AFTER INSERT OR UPDATE OR DELETE ON payment.payments
FOR EACH ROW EXECUTE FUNCTION system_config.fn_audit_row('payment_id');
CREATE TRIGGER trg_audit_settings AFTER INSERT OR UPDATE OR DELETE ON system_config.settings
FOR EACH ROW EXECUTE FUNCTION system_config.fn_audit_row('setting_id');

-- =============================================================
-- 12. VIEWS
-- =============================================================

CREATE VIEW lms.v_course_catalog AS
SELECT
    c.course_id,
    c.course_name,
    c.description,
    c.teacher_id,
    u.full_name AS teacher_name,
    c.price,
    c.currency,
    c.status,
    c.thumbnail_url,
    COUNT(l.lesson_id) FILTER (WHERE l.is_deleted = FALSE AND l.is_published = TRUE) AS lesson_count,
    c.created_at,
    c.updated_at
FROM lms.courses c
JOIN auth.users u ON u.user_id = c.teacher_id
LEFT JOIN lms.lessons l ON l.course_id = c.course_id
WHERE c.is_deleted = FALSE
GROUP BY c.course_id, u.full_name;

CREATE VIEW learning.v_student_progress AS
WITH lesson_counts AS (
    SELECT course_id, COUNT(*) AS total_lessons
    FROM lms.lessons
    WHERE is_deleted = FALSE AND is_published = TRUE
    GROUP BY course_id
), completed AS (
    SELECT student_id, course_id,
           COUNT(*) FILTER (WHERE status = 'COMPLETED') AS completed_lessons,
           MAX(last_viewed_at) AS last_activity_at
    FROM learning.lesson_progress
    GROUP BY student_id, course_id
)
SELECT
    e.student_id,
    e.course_id,
    c.course_name,
    COALESCE(lc.total_lessons, 0) AS total_lessons,
    COALESCE(cp.completed_lessons, 0) AS completed_lessons,
    CASE WHEN COALESCE(lc.total_lessons,0) = 0 THEN 0::NUMERIC
         ELSE ROUND((COALESCE(cp.completed_lessons,0)::NUMERIC / lc.total_lessons::NUMERIC) * 100, 2)
    END AS progress_percent,
    cp.last_activity_at,
    e.status AS enrollment_status
FROM enrollment.enrollments e
JOIN lms.courses c ON c.course_id = e.course_id AND c.is_deleted = FALSE
LEFT JOIN lesson_counts lc ON lc.course_id = e.course_id
LEFT JOIN completed cp ON cp.student_id = e.student_id AND cp.course_id = e.course_id;

CREATE VIEW learning.v_active_recommendations AS
SELECT
    r.recommendation_id,
    r.student_id,
    r.course_id,
    c.course_name,
    r.current_lesson_id,
    r.recommended_lesson_id,
    l.title AS recommended_lesson_title,
    r.pattern_id,
    r.model_id,
    r.source_type,
    r.recommendation_score,
    r.reason,
    r.recommendation_order,
    r.status,
    r.generated_at,
    r.expires_at
FROM learning.learning_path_recommendations r
JOIN lms.courses c ON c.course_id = r.course_id AND c.is_deleted = FALSE
JOIN lms.lessons l ON l.lesson_id = r.recommended_lesson_id AND l.is_deleted = FALSE
WHERE r.status IN ('ACTIVE','SHOWN')
  AND (r.expires_at IS NULL OR r.expires_at > CURRENT_TIMESTAMP);

CREATE VIEW learning.v_huspm_patterns AS
SELECT
    p.pattern_id,
    p.mining_run_id,
    p.course_id,
    p.pattern_signature,
    p.pattern_length,
    p.support_count,
    p.support,
    p.pattern_utility,
    p.utility_ratio,
    r.algorithm_name,
    r.algorithm_version,
    r.dataset_version,
    r.min_support,
    r.min_utility,
    r.utility_definition,
    p.created_at
FROM learning.high_utility_patterns p
JOIN learning.mining_runs r ON r.mining_run_id = p.mining_run_id
WHERE p.is_active = TRUE AND r.status = 'SUCCEEDED';

CREATE VIEW learning.v_huspm_event_dataset AS
SELECT
    log_id,
    event_uuid,
    student_id,
    course_id,
    lesson_id,
    quiz_id,
    quiz_attempt_id,
    learning_session_id,
    action,
    occurred_at,
    quiz_score,
    duration_seconds,
    completion_status,
    data_source,
    metadata
FROM learning.learning_sequence_logs
WHERE data_source IN ('REAL','KAGGLE','SYNTHETIC');

CREATE VIEW assessment.v_quiz_results AS
SELECT
    qa.attempt_id,
    qa.quiz_id,
    qa.course_id,
    q.title AS quiz_title,
    qa.student_id,
    u.full_name AS student_name,
    qa.attempt_no,
    qa.score,
    qa.duration_seconds,
    qa.status,
    qa.started_at,
    qa.submitted_at
FROM assessment.quiz_attempts qa
JOIN assessment.quizzes q ON q.quiz_id = qa.quiz_id
JOIN auth.users u ON u.user_id = qa.student_id;

CREATE VIEW payment.v_order_payment_status AS
SELECT
    o.order_id,
    o.enrollment_id,
    o.student_id,
    o.course_id,
    o.final_amount,
    o.currency,
    o.status AS order_status,
    o.paid_at,
    COUNT(p.payment_id) AS payment_attempt_count,
    MAX(p.created_at) AS last_payment_attempt_at
FROM payment.orders o
LEFT JOIN payment.payments p ON p.order_id = o.order_id
GROUP BY o.order_id;

-- =============================================================
-- 13. DEFAULT SYSTEM / HUSPM SETTINGS
-- =============================================================

INSERT INTO system_config.settings(setting_key, setting_value, data_type, description) VALUES
('HUSPM_MIN_SUPPORT', '0.10'::jsonb, 'NUMBER', 'Minimum support used as a supplementary rarity filter for HUSPM patterns.'),
('HUSPM_MIN_UTILITY', '0.60'::jsonb, 'NUMBER', 'Minimum normalized utility threshold for HUSPM pattern acceptance.'),
('HUSPM_UTILITY_WEIGHTS', '{"quiz_score":0.50,"completion":0.30,"duration":0.20}'::jsonb, 'JSON', 'Default utility weights; the mining run stores the effective definition used for reproducibility.'),
('RECOMMENDATION_TOP_K', '5'::jsonb, 'NUMBER', 'Maximum number of recommendation candidates returned to the application.'),
('RECOMMENDATION_TTL_HOURS', '24'::jsonb, 'NUMBER', 'Default recommendation expiration period in hours.'),
('QUIZ_DEFAULT_MAX_ATTEMPTS', '3'::jsonb, 'NUMBER', 'Default maximum quiz attempts if not overridden at quiz level.');

-- =============================================================
-- 14. DOCUMENTATION COMMENTS
-- =============================================================

COMMENT ON TABLE learning.learning_sequence_logs IS 'Append-oriented learning event store; source data for HUSPM and learning analytics.';
COMMENT ON COLUMN learning.learning_sequence_logs.occurred_at IS 'Business event time used to order a learning sequence.';
COMMENT ON COLUMN learning.learning_sequence_logs.recorded_at IS 'Server/database ingestion time; distinct from occurred_at.';
COMMENT ON COLUMN learning.learning_sequence_logs.event_uuid IS 'Idempotency identifier preventing duplicate event ingestion.';
COMMENT ON TABLE learning.mining_runs IS 'Reproducible metadata for each HUSPM mining experiment/run.';
COMMENT ON TABLE learning.high_utility_patterns IS 'High-utility sequential patterns produced by a successful HUSPM mining run.';
COMMENT ON TABLE learning.pattern_steps IS 'Normalized ordered steps of a high-utility learning pattern.';
COMMENT ON TABLE learning.learning_path_recommendations IS 'Persisted next-learning-step recommendations exposed to Backend/Frontend.';
COMMENT ON TABLE learning.model_registry IS 'Registry for optional ML/DL models used in MODEL or HYBRID recommendation modes.';
COMMENT ON TABLE system_config.audit_logs IS 'Administrative change audit; credential fields are removed before persistence.';
COMMENT ON TABLE payment.orders IS 'Financial snapshot taken from enrollment so later course price changes do not alter historical obligations.';

COMMIT;
