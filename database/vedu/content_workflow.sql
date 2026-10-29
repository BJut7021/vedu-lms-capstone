-- Additive, repeatable. Retains every course, enrollment and progress record.
BEGIN;
CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA public;
CREATE TABLE IF NOT EXISTS payment.manual_requests (
 request_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 order_id bigint NOT NULL UNIQUE REFERENCES payment.orders(order_id),
 method varchar(20) NOT NULL CHECK(method IN ('BANK_TRANSFER','CASH')),
 reference varchar(24) NOT NULL UNIQUE,
 status varchar(20) NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','REVIEW','APPROVED','REJECTED')),
 bank_snapshot jsonb,
 learner_note text NOT NULL DEFAULT '', reviewer_note text NOT NULL DEFAULT '',
 reported_at timestamptz, reviewed_at timestamptz, reviewed_by bigint REFERENCES auth.users(user_id),
 payment_id bigint UNIQUE REFERENCES payment.payments(payment_id),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS payment.manual_events (
 event_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 request_id uuid NOT NULL REFERENCES payment.manual_requests(request_id),
 actor_id bigint NOT NULL REFERENCES auth.users(user_id),
 action varchar(30) NOT NULL, details jsonb NOT NULL DEFAULT '{}',
 created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE payment.manual_requests DROP CONSTRAINT IF EXISTS manual_requests_method_check;
ALTER TABLE payment.manual_requests ADD CONSTRAINT manual_requests_method_check CHECK(method IN ('BANK_TRANSFER','CASH','MOMO_WALLET'));
CREATE TABLE IF NOT EXISTS payment.momo_wallet_settings (
 singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),
 receiver_name varchar(120) NOT NULL, receiver_phone varchar(20) NOT NULL,
 qr_data_url text NOT NULL, updated_by bigint NOT NULL REFERENCES auth.users(user_id),
 updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE payment.momo_requests ADD COLUMN IF NOT EXISTS qr_payload text;
ALTER TABLE payment.momo_requests ADD COLUMN IF NOT EXISTS deep_link text;
CREATE TABLE IF NOT EXISTS lms.course_overviews (
 course_id bigint PRIMARY KEY REFERENCES lms.courses(course_id),
 audience text NOT NULL DEFAULT '', preparation text NOT NULL DEFAULT '',
 outcomes jsonb NOT NULL DEFAULT '[]' CHECK (jsonb_typeof(outcomes)='array'),
 practice_note text NOT NULL DEFAULT '',
 syllabus_resource_id bigint REFERENCES lms.lesson_resources(resource_id) ON DELETE SET NULL,
 updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE lms.courses ADD COLUMN IF NOT EXISTS review_status varchar(20) NOT NULL DEFAULT 'UNREVIEWED';
ALTER TABLE lms.courses ADD COLUMN IF NOT EXISTS review_note text;
CREATE TABLE IF NOT EXISTS lms.content_reviews (
 review_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 course_id bigint NOT NULL REFERENCES lms.courses,
 reviewer_id bigint NOT NULL REFERENCES auth.users,
 decision varchar(20) NOT NULL CHECK(decision IN ('APPROVED','CHANGES_REQUESTED','HIDDEN')),
 note text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS auth.notifications (
 notification_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 user_id bigint NOT NULL REFERENCES auth.users,
 title varchar(200) NOT NULL, body text NOT NULL, route varchar(300) NOT NULL,
 read_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_owner ON auth.notifications(user_id,created_at DESC);
INSERT INTO auth.notifications(user_id,title,body,route)
SELECT ct.teacher_id,'Khóa học được phân công',c.course_name || ' — Bạn là giảng viên hỗ trợ. Mở Nội dung & học liệu hoặc Hỏi đáp khóa học.','/teacher/content'
FROM lms.course_teachers ct JOIN lms.courses c USING(course_id)
WHERE NOT c.is_deleted AND NOT EXISTS(
 SELECT 1 FROM auth.notifications n WHERE n.user_id=ct.teacher_id AND n.title='Khóa học được phân công' AND n.body=c.course_name || ' — Bạn là giảng viên hỗ trợ. Mở Nội dung & học liệu hoặc Hỏi đáp khóa học.'
);
COMMIT;
