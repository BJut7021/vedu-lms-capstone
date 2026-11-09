\set ON_ERROR_STOP on

BEGIN;

-- Seeded role accounts are for demonstration and must never be counted as
-- real learner evidence when a VEDU model is trained.
UPDATE auth.users
SET is_test_account = true, updated_at = now()
WHERE username IN ('student', 'teacher', 'admin')
  AND email IN ('student@vedu.local', 'teacher@vedu.local', 'admin@vedu.local');

-- Canonical skill taxonomy used by the learning-path planner.  The same code
-- must identify a lesson, its quiz evidence and any matching rubric criterion.
DO $skill_taxonomy$
DECLARE
  v_oop_course_id bigint;
  v_excel_course_id bigint;
  v_mismatch_count integer;
BEGIN
  SELECT course_id INTO v_oop_course_id
  FROM lms.curated_courses WHERE course_key = 'oop';

  SELECT course_id INTO v_excel_course_id
  FROM lms.curated_courses WHERE course_key = 'excel';

  IF v_oop_course_id IS NULL OR v_excel_course_id IS NULL THEN
    RAISE EXCEPTION 'OOP/Excel curated courses are required before skill normalization';
  END IF;

  -- OOP: each lesson quiz assesses one explicit capability.  Keep oop-testing
  -- on the two lessons whose practical assignment rubric uses that skill.
  UPDATE lms.lesson_pedagogy p
  SET skills = CASE l.lesson_order
      WHEN 1 THEN '[]'::jsonb
      WHEN 2 THEN '["oop-foundations"]'::jsonb
      WHEN 3 THEN '["encapsulation"]'::jsonb
      WHEN 4 THEN '["object-lifecycle"]'::jsonb
      WHEN 5 THEN '["collections"]'::jsonb
      WHEN 6 THEN '["inheritance","oop-testing"]'::jsonb
      WHEN 7 THEN '["polymorphism","oop-testing"]'::jsonb
      WHEN 8 THEN '["interface-contract"]'::jsonb
      WHEN 9 THEN '["layered-architecture"]'::jsonb
      WHEN 10 THEN '["solid-principles"]'::jsonb
      WHEN 11 THEN '["design-patterns"]'::jsonb
      ELSE p.skills
    END,
    updated_at = now()
  FROM lms.lessons l
  WHERE p.lesson_id = l.lesson_id
    AND l.course_id = v_oop_course_id
    AND l.lesson_order BETWEEN 1 AND 11
    AND l.is_published AND NOT l.is_deleted;

  INSERT INTO assessment.question_skills(question_id, skill)
  SELECT qu.question_id, CASE l.lesson_order
      WHEN 2 THEN 'oop-foundations'
      WHEN 3 THEN 'encapsulation'
      WHEN 4 THEN 'object-lifecycle'
      WHEN 5 THEN 'collections'
      WHEN 6 THEN 'inheritance'
      WHEN 7 THEN 'polymorphism'
      WHEN 8 THEN 'interface-contract'
      WHEN 9 THEN 'layered-architecture'
      WHEN 10 THEN 'solid-principles'
      WHEN 11 THEN 'design-patterns'
      ELSE 'oop-foundations'
    END
  FROM assessment.questions qu
  JOIN assessment.quizzes q ON q.quiz_id = qu.quiz_id
  JOIN lms.lessons l ON l.lesson_id = q.lesson_id
  WHERE q.course_id = v_oop_course_id
    AND l.lesson_order BETWEEN 2 AND 11
    AND q.is_published AND NOT q.is_deleted
  ON CONFLICT(question_id) DO UPDATE SET skill = EXCLUDED.skill;

  -- Excel: retain both the lesson-level quiz capability and the broader
  -- assignment rubric capabilities where they genuinely apply.
  UPDATE lms.lesson_pedagogy p
  SET skills = CASE l.lesson_order
      WHEN 1 THEN '[]'::jsonb
      WHEN 2 THEN '["excel-basics","excel-tables"]'::jsonb
      WHEN 3 THEN '["excel-entry","excel-tables"]'::jsonb
      WHEN 4 THEN '["excel-sum","excel-formulas"]'::jsonb
      WHEN 5 THEN '["excel-count","excel-formulas"]'::jsonb
      WHEN 6 THEN '["excel-logic","excel-formulas","excel-checks"]'::jsonb
      WHEN 7 THEN '["excel-text"]'::jsonb
      WHEN 8 THEN '["excel-lookup","excel-reporting"]'::jsonb
      ELSE p.skills
    END,
    updated_at = now()
  FROM lms.lessons l
  WHERE p.lesson_id = l.lesson_id
    AND l.course_id = v_excel_course_id
    AND l.lesson_order BETWEEN 1 AND 8
    AND l.is_published AND NOT l.is_deleted;

  INSERT INTO assessment.question_skills(question_id, skill)
  SELECT qu.question_id, CASE l.lesson_order
      WHEN 2 THEN 'excel-basics'
      WHEN 3 THEN 'excel-entry'
      WHEN 4 THEN 'excel-sum'
      WHEN 5 THEN 'excel-count'
      WHEN 6 THEN 'excel-logic'
      WHEN 7 THEN 'excel-text'
      WHEN 8 THEN 'excel-lookup'
      ELSE 'excel-basics'
    END
  FROM assessment.questions qu
  JOIN assessment.quizzes q ON q.quiz_id = qu.quiz_id
  JOIN lms.lessons l ON l.lesson_id = q.lesson_id
  WHERE q.course_id = v_excel_course_id
    AND l.lesson_order BETWEEN 2 AND 8
    AND q.is_published AND NOT q.is_deleted
  ON CONFLICT(question_id) DO UPDATE SET skill = EXCLUDED.skill;

  -- Fail atomically if a published lesson quiz cannot feed the exact skill
  -- attached to its lesson.  This protects both fresh and existing volumes.
  SELECT count(*) INTO v_mismatch_count
  FROM assessment.quizzes q
  JOIN lms.lessons l ON l.lesson_id = q.lesson_id
  JOIN assessment.questions qu ON qu.quiz_id = q.quiz_id
  LEFT JOIN assessment.question_skills qs ON qs.question_id = qu.question_id
  JOIN lms.lesson_pedagogy p ON p.lesson_id = l.lesson_id
  WHERE q.course_id IN (v_oop_course_id, v_excel_course_id)
    AND l.lesson_order > 1
    AND q.is_published AND NOT q.is_deleted
    AND (qs.skill IS NULL OR NOT p.skills ? qs.skill);

  IF v_mismatch_count <> 0 THEN
    RAISE EXCEPTION '% OOP/Excel quiz questions do not match lesson skill taxonomy',
      v_mismatch_count;
  END IF;
END $skill_taxonomy$;

COMMIT;
