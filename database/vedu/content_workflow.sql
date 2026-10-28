-- Additive, repeatable. Retains every course, enrollment and progress record.
BEGIN;
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
