\set ON_ERROR_STOP on

BEGIN;

DO $oop_refinement$
DECLARE
  oop_course_id bigint;
BEGIN
  SELECT course_id INTO oop_course_id
  FROM lms.curated_courses
  WHERE course_key = 'oop';

  IF oop_course_id IS NULL THEN
    RAISE EXCEPTION 'OOP course_key=oop not found; aborting';
  END IF;

  -- Only inheritance/polymorphism/interface is required before the final exam.
  UPDATE lms.course_sections
  SET is_required = (module_key = 'core-2')
  WHERE course_id = oop_course_id;

  -- Keep previous submissions for audit, but remove this practice from all
  -- learner screens and from completion requirements.
  UPDATE assessment.course_assignments
  SET required = false,
      is_published = false,
      is_archived = true,
      updated_at = now()
  WHERE course_id = oop_course_id
    AND assignment_key = 'inheritance-lab';
END $oop_refinement$;

COMMIT;
