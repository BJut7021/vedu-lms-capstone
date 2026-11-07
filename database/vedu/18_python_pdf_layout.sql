\set ON_ERROR_STOP on
BEGIN;
DO $py_pdf_layout$
DECLARE
  cid bigint;
  intro_id bigint;
  n integer;
  per_lesson record;
  legacy_url text := 'vedu-file:8a7e01e4-25a8-4c3d-4d24-bdf493c7ca00.pdf';
  workbook_url text := 'vedu-file:b683613d-78a6-6bb7-7526-62f4d4873ccf.pdf';
BEGIN
  SELECT course_id INTO cid FROM lms.curated_courses WHERE course_key='python';
  IF cid IS NULL THEN RAISE EXCEPTION 'Python course not found; no changes'; END IF;
  SELECT l.lesson_id INTO intro_id
  FROM lms.lessons l JOIN lms.course_sections s ON s.section_id=l.section_id
  WHERE l.course_id=cid AND s.module_key='intro' AND l.is_published AND NOT l.is_deleted
  ORDER BY l.lesson_order LIMIT 1;
  IF intro_id IS NULL THEN RAISE EXCEPTION 'Python intro lesson missing; no changes'; END IF;
  -- Never remove a course-wide reference from lessons unless it remains at the introduction.
  IF NOT EXISTS (SELECT 1 FROM lms.lesson_resources WHERE lesson_id=intro_id AND resource_type='PDF' AND resource_url=legacy_url)
     OR NOT EXISTS (SELECT 1 FROM lms.lesson_resources WHERE lesson_id=intro_id AND resource_type='PDF' AND resource_url=workbook_url) THEN
     RAISE EXCEPTION 'Python common source PDFs not found in introduction; no changes';
  END IF;
  SELECT count(*) INTO n FROM lms.lessons l JOIN lms.course_sections s ON s.section_id=l.section_id
  WHERE l.course_id=cid AND s.module_key<>'intro' AND l.is_published AND NOT l.is_deleted;
  IF n<>9 THEN RAISE EXCEPTION 'Expected nine Python lessons, got %; no changes', n; END IF;
  FOR per_lesson IN
    SELECT l.lesson_id,l.title FROM lms.lessons l JOIN lms.course_sections s ON s.section_id=l.section_id
    WHERE l.course_id=cid AND s.module_key<>'intro' AND l.is_published AND NOT l.is_deleted
  LOOP
    -- V5 must be installed first: refuse to hide legacy PDFs when no replacement exists.
    IF NOT EXISTS (
      SELECT 1 FROM lms.lesson_resources
      WHERE lesson_id=per_lesson.lesson_id AND resource_type='PDF'
        AND title LIKE 'PDF gốc Python theo bài (VEDU-V5): %'
        AND resource_url ~ '^https://'
    ) THEN
      RAISE EXCEPTION 'Missing per-lesson V5 PDF for %; no changes', per_lesson.title;
    END IF;
  END LOOP;
  -- Rename only the original shared items on the introduction page.
  UPDATE lms.lesson_resources
     SET title='Tài liệu tham khảo bổ sung: Python rất là cơ bản – Võ Duy Tuấn (2015, có cú pháp Python 2)'
   WHERE lesson_id=intro_id AND resource_type='PDF' AND resource_url=legacy_url
     AND title IS DISTINCT FROM 'Tài liệu tham khảo bổ sung: Python rất là cơ bản – Võ Duy Tuấn (2015, có cú pháp Python 2)';
  UPDATE lms.lesson_resources
     SET title='Tài liệu tham khảo chung: Sổ tự học và bài tập Python'
   WHERE lesson_id=intro_id AND resource_type='PDF' AND resource_url=workbook_url
     AND title IS DISTINCT FROM 'Tài liệu tham khảo chung: Sổ tự học và bài tập Python';
  -- Remove duplicate *lesson-resource links* only. The underlying PDF files stay intact.
  -- Scope is exactly nine non-introduction Python lessons and two known file URLs.
  DELETE FROM lms.lesson_resources lr USING lms.lessons l, lms.course_sections s
   WHERE lr.lesson_id=l.lesson_id AND l.section_id=s.section_id
     AND l.course_id=cid AND s.module_key<>'intro'
     AND l.is_published AND NOT l.is_deleted
     AND lr.resource_type='PDF' AND lr.resource_url IN (legacy_url,workbook_url);
  RAISE NOTICE 'Python PDFs organized: original common files in intro, V5 files in nine lessons';
END $py_pdf_layout$;
COMMIT;
