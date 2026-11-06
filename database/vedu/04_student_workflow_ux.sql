\set ON_ERROR_STOP on
BEGIN;

-- Lesson learning is intentionally separate from module mastery.
ALTER TABLE learning.lesson_progress DROP CONSTRAINT IF EXISTS chk_lesson_progress_status;
ALTER TABLE learning.lesson_progress DROP CONSTRAINT IF EXISTS chk_lesson_progress_completed;
ALTER TABLE learning.lesson_progress DROP CONSTRAINT IF EXISTS chk_lesson_progress_learned;
-- Historical demo rows may belong to accounts that were intentionally disabled.
-- The role trigger protects live writes, but must not block this value-only migration.
ALTER TABLE learning.lesson_progress DISABLE TRIGGER trg_lesson_progress_student_role;
UPDATE learning.lesson_progress SET status='LEARNED' WHERE status='COMPLETED';
ALTER TABLE learning.lesson_progress ENABLE TRIGGER trg_lesson_progress_student_role;
ALTER TABLE learning.lesson_progress
  ADD CONSTRAINT chk_lesson_progress_status
  CHECK (status IN ('NOT_STARTED','IN_PROGRESS','LEARNED'));
ALTER TABLE learning.lesson_progress
  ADD CONSTRAINT chk_lesson_progress_learned
  CHECK (status <> 'LEARNED' OR completed_at IS NOT NULL);

-- Contextual course Q&A.  A course-level question keeps lesson_id NULL.
ALTER TABLE lms.course_questions ADD COLUMN IF NOT EXISTS lesson_id bigint;
DO $q_fk$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname='course_questions_lesson_course_fkey'
  ) THEN
    ALTER TABLE lms.course_questions
      ADD CONSTRAINT course_questions_lesson_course_fkey
      FOREIGN KEY (lesson_id,course_id) REFERENCES lms.lessons(lesson_id,course_id);
  END IF;
END $q_fk$;
CREATE INDEX IF NOT EXISTS idx_course_questions_course_lesson_created
  ON lms.course_questions(course_id,lesson_id,created_at DESC);

-- Assignment authoring and publication metadata. Existing seeded work remains published.
ALTER TABLE assessment.course_assignments
  ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS allowed_file_types text[] NOT NULL DEFAULT ARRAY['pdf','docx','xlsx','pptx','zip']::text[],
  ADD COLUMN IF NOT EXISTS due_at timestamptz,
  ADD COLUMN IF NOT EXISTS created_by bigint REFERENCES auth.users(user_id),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
CREATE INDEX IF NOT EXISTS idx_course_assignments_course_section_active
  ON assessment.course_assignments(course_id,section_id,assignment_id)
  WHERE is_published AND NOT is_archived;

-- MCQ_ESSAY now uses the same versioned submission workflow as practical work.
INSERT INTO assessment.course_assignments(
  course_id,section_id,assignment_key,title,instructions,rubric,passing_score,
  required,is_published,is_archived,allowed_file_types
)
SELECT q.course_id,NULL,'final-essay',
  'Bài tự luận cuối khóa — ' || c.course_name,
  p.prompt_text,
  '[{"id":"knowledge","label":"Kiến thức và lập luận","skill":"course-knowledge","max":5,"min":3},{"id":"application","label":"Vận dụng vào yêu cầu đề bài","skill":"course-application","max":3,"min":1},{"id":"presentation","label":"Trình bày và dẫn nguồn","skill":"academic-presentation","max":2,"min":1}]'::jsonb,
  q.passing_score,true,true,false,ARRAY['pdf','docx','zip']::text[]
FROM assessment.quizzes q
JOIN lms.courses c USING(course_id)
JOIN assessment.final_essay_prompts p USING(quiz_id)
WHERE q.lesson_id IS NULL AND q.is_published AND NOT q.is_deleted
  AND c.final_mode='MCQ_ESSAY' AND btrim(p.prompt_text)<>''
ON CONFLICT(course_id,assignment_key) DO UPDATE SET
  instructions=EXCLUDED.instructions,
  is_published=true,
  is_archived=false,
  updated_at=now();

-- Preserve legacy image submissions as immutable version 1 evidence.
INSERT INTO assessment.course_assignment_versions(
  assignment_id,student_id,attempt_id,version_no,status,answer_text,file_data,file_name,
  rubric_scores,score,outcome,feedback,graded_by,graded_at,updated_at
)
SELECT t.assignment_id,s.student_id,s.attempt_id,1,
  CASE WHEN s.grade IS NULL THEN 'SUBMITTED' ELSE 'GRADED' END,
  'Bài tự luận ảnh được chuyển từ workflow cũ.',s.image_data,s.file_name,
  CASE WHEN s.grade IS NULL THEN NULL ELSE jsonb_build_object('legacy',s.grade) END,
  s.grade,
  CASE WHEN s.grade IS NULL THEN NULL WHEN s.grade>=t.passing_score THEN 'PASS' ELSE 'FAIL' END,
  s.feedback,s.graded_by,s.graded_at,COALESCE(s.graded_at,s.submitted_at)
FROM assessment.final_essay_submissions s
JOIN assessment.quiz_attempts qa USING(attempt_id)
JOIN assessment.course_assignments t
  ON t.course_id=qa.course_id AND t.assignment_key='final-essay'
WHERE NOT EXISTS (
  SELECT 1 FROM assessment.course_assignment_versions v
  WHERE v.assignment_id=t.assignment_id AND v.student_id=s.student_id
    AND v.attempt_id=s.attempt_id
);

CREATE OR REPLACE FUNCTION assessment.final_score(p_attempt bigint)
RETURNS numeric LANGUAGE sql STABLE AS $$
  SELECT CASE c.final_mode
    WHEN 'MCQ_ONLY' THEN a.score
    WHEN 'MCQ_ESSAY' THEN round((a.score*c.final_mcq_percent+v.score*(100-c.final_mcq_percent))/100,2)
    WHEN 'MCQ_PRACTICAL' THEN round((a.score*c.final_mcq_percent+v.score*(100-c.final_mcq_percent))/100,2)
  END
  FROM assessment.quiz_attempts a JOIN lms.courses c USING(course_id)
  LEFT JOIN LATERAL (
    SELECT av.score,av.outcome FROM assessment.course_assignment_versions av
    JOIN assessment.course_assignments t USING(assignment_id)
    WHERE av.attempt_id=a.attempt_id AND av.student_id=a.student_id
      AND t.course_id=a.course_id AND t.section_id IS NULL
      AND t.required AND t.is_published AND NOT t.is_archived
      AND av.status='GRADED'
    ORDER BY av.version_no DESC LIMIT 1
  ) v ON true
  WHERE a.attempt_id=p_attempt AND a.status IN ('GRADED','SUBMITTED')
$$;

CREATE OR REPLACE FUNCTION assessment.final_passed(p_attempt bigint)
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT COALESCE(assessment.final_score(p_attempt)>=q.passing_score AND (
    c.final_mode='MCQ_ONLY' OR (
      EXISTS (SELECT 1 FROM assessment.course_assignments t
        WHERE t.course_id=a.course_id AND t.section_id IS NULL AND t.required AND t.is_published AND NOT t.is_archived)
      AND NOT EXISTS (
        SELECT 1 FROM assessment.course_assignments t
        WHERE t.course_id=a.course_id AND t.section_id IS NULL AND t.required AND t.is_published AND NOT t.is_archived
          AND NOT EXISTS (SELECT 1 FROM assessment.course_assignment_versions av
            WHERE av.assignment_id=t.assignment_id AND av.attempt_id=a.attempt_id AND av.student_id=a.student_id
              AND av.status='GRADED' AND av.outcome='PASS')
      )
    )),false)
  FROM assessment.quiz_attempts a JOIN assessment.quizzes q USING(quiz_id)
  JOIN lms.courses c ON c.course_id=a.course_id WHERE a.attempt_id=p_attempt
$$;

DROP FUNCTION IF EXISTS assessment.module_results(bigint,bigint);
CREATE FUNCTION assessment.module_results(p_course bigint,p_student bigint)
RETURNS TABLE(
  section_id bigint,title varchar,is_required boolean,passed boolean,
  state text,required_activities integer,pending_review integer,needs_revision integer
) LANGUAGE sql STABLE AS $$
  WITH module_activity AS (
    SELECT s.section_id,s.title,s.is_required,
      (SELECT count(*)::int FROM assessment.course_assignments t
       WHERE t.section_id=s.section_id AND t.required AND t.is_published AND NOT t.is_archived)
      + (SELECT count(*)::int FROM assessment.quizzes q JOIN lms.lessons l USING(lesson_id)
         WHERE l.section_id=s.section_id AND l.is_published AND NOT l.is_deleted
           AND q.is_published AND NOT q.is_deleted) AS required_activities,
      (SELECT count(*)::int FROM assessment.course_assignment_versions v
       JOIN assessment.course_assignments t USING(assignment_id)
       WHERE t.section_id=s.section_id AND v.student_id=p_student
         AND v.status IN ('SUBMITTED','UNDER_REVIEW')
         AND NOT EXISTS (SELECT 1 FROM assessment.course_assignment_versions newer
           WHERE newer.assignment_id=v.assignment_id AND newer.student_id=v.student_id
             AND newer.attempt_id IS NOT DISTINCT FROM v.attempt_id AND newer.version_no>v.version_no)) AS pending_review,
      (SELECT count(*)::int FROM assessment.course_assignment_versions v
       JOIN assessment.course_assignments t USING(assignment_id)
       WHERE t.section_id=s.section_id AND v.student_id=p_student
         AND v.status='NEEDS_REVISION'
         AND NOT EXISTS (SELECT 1 FROM assessment.course_assignment_versions newer
           WHERE newer.assignment_id=v.assignment_id AND newer.student_id=v.student_id
             AND newer.attempt_id IS NOT DISTINCT FROM v.attempt_id AND newer.version_no>v.version_no)) AS needs_revision,
      EXISTS(SELECT 1 FROM assessment.course_assignments t
       WHERE t.section_id=s.section_id AND t.required AND t.is_published AND NOT t.is_archived
       AND NOT EXISTS (SELECT 1 FROM assessment.course_assignment_versions v
         WHERE v.assignment_id=t.assignment_id AND v.student_id=p_student
           AND v.outcome='PASS' AND v.status='GRADED')) AS missing_assignment,
      EXISTS(SELECT 1 FROM assessment.quizzes q JOIN lms.lessons l USING(lesson_id)
       WHERE l.section_id=s.section_id AND l.is_published AND NOT l.is_deleted
         AND q.is_published AND NOT q.is_deleted
       AND NOT EXISTS (SELECT 1 FROM assessment.quiz_attempts a
         WHERE a.quiz_id=q.quiz_id AND a.student_id=p_student
           AND a.status='GRADED' AND a.score>=q.passing_score)) AS missing_quiz,
      EXISTS(SELECT 1 FROM learning.lesson_progress lp JOIN lms.lessons l USING(lesson_id)
       WHERE l.section_id=s.section_id AND lp.student_id=p_student
         AND lp.status IN ('IN_PROGRESS','LEARNED')) AS has_learning
    FROM lms.course_sections s WHERE s.course_id=p_course
  )
  SELECT section_id,title,is_required,
    required_activities>0 AND NOT missing_assignment AND NOT missing_quiz AS passed,
    CASE
      WHEN required_activities>0 AND NOT missing_assignment AND NOT missing_quiz THEN 'PASSED'
      WHEN needs_revision>0 THEN 'NEEDS_REVISION'
      WHEN pending_review>0 THEN 'WAITING_REVIEW'
      WHEN has_learning OR required_activities>0 THEN 'IN_PROGRESS'
      ELSE 'NOT_STARTED'
    END,
    required_activities,pending_review,needs_revision
  FROM module_activity ORDER BY section_id
$$;

COMMIT;
