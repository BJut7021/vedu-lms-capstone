-- 08: unify student progress across classroom and student portal.
-- Safe to rerun after 06_oop_lesson_quizzes_and_videos.sql and 07_oop_practice_optional.sql.
-- Does not change student answers, enrollment, grades or lesson progress rows.
BEGIN;
CREATE OR REPLACE VIEW learning.v_student_progress AS
WITH eligible_lessons AS (
  SELECT l.lesson_id, l.course_id
  FROM lms.lessons l
  LEFT JOIN lms.course_sections s ON s.section_id=l.section_id
  WHERE l.is_published AND NOT l.is_deleted
    AND COALESCE(s.module_type,'CONTENT') <> 'INTRO'
), lesson_counts AS (
  SELECT course_id, COUNT(*) AS total_lessons
  FROM eligible_lessons GROUP BY course_id
), completed_lesson_ids AS (
  -- A lesson is done if it was explicitly learned OR its own quiz was passed.
  -- UNION prevents double-counting when both records exist.
  SELECT lp.student_id, e.course_id, e.lesson_id
  FROM learning.lesson_progress lp
  JOIN eligible_lessons e ON e.lesson_id=lp.lesson_id AND e.course_id=lp.course_id
  WHERE lp.status='LEARNED'
  UNION
  SELECT qa.student_id, e.course_id, e.lesson_id
  FROM assessment.quiz_attempts qa
  JOIN assessment.quizzes q ON q.quiz_id=qa.quiz_id
  JOIN eligible_lessons e ON e.lesson_id=q.lesson_id AND e.course_id=q.course_id
  WHERE qa.status IN ('SUBMITTED','GRADED')
    AND qa.score>=q.passing_score
    AND q.is_published AND NOT q.is_deleted
), completed AS (
  SELECT student_id, course_id, COUNT(*) AS completed_lessons
  FROM completed_lesson_ids GROUP BY student_id,course_id
), activity AS (
  SELECT student_id,course_id, MAX(last_viewed_at) AS last_activity_at
  FROM learning.lesson_progress GROUP BY student_id,course_id
)
SELECT e.student_id, e.course_id, c.course_name,
  COALESCE(lc.total_lessons,0) AS total_lessons,
  LEAST(COALESCE(lc.total_lessons,0), COALESCE(cp.completed_lessons,0)) AS completed_lessons,
  CASE WHEN COALESCE(lc.total_lessons,0)=0 THEN 0::numeric
       ELSE ROUND((LEAST(lc.total_lessons,COALESCE(cp.completed_lessons,0))::numeric
         / lc.total_lessons::numeric)*100,2)
  END AS progress_percent,
  a.last_activity_at,
  e.status AS enrollment_status
FROM enrollment.enrollments e
JOIN lms.courses c ON c.course_id=e.course_id AND c.is_deleted=false
LEFT JOIN lesson_counts lc ON lc.course_id=e.course_id
LEFT JOIN completed cp ON cp.student_id=e.student_id AND cp.course_id=e.course_id
LEFT JOIN activity a ON a.student_id=e.student_id AND a.course_id=e.course_id;
COMMIT;
