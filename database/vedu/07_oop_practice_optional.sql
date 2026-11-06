\set ON_ERROR_STOP on
BEGIN;
-- 07: Only the OOP module assignment; never modify final exam requirements.
-- PDF/ZIP practice is optional for lesson and module progression, as agreed.
-- Submissions, scores, rubric and teacher feedback are unchanged.
UPDATE assessment.course_assignments a
SET required = false, updated_at = now()
FROM lms.curated_courses cc
WHERE cc.course_id = a.course_id
  AND cc.course_key = 'oop'
  AND a.assignment_key = 'inheritance-lab'
  AND a.required = true;
COMMIT;
