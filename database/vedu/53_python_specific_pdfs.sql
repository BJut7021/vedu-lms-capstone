\set ON_ERROR_STOP on
BEGIN;
DO $fix$
DECLARE x jsonb; lid bigint; actual_title text; newurl text; n integer:=0;
BEGIN
 IF (SELECT count(*) FROM lms.lessons WHERE course_id=50 AND lesson_order>1 AND is_published AND NOT is_deleted)<>9 THEN
  RAISE EXCEPTION 'Lập trình Python cơ bản: unexpected count of published main lessons';
 END IF;
 FOR x IN SELECT value FROM jsonb_array_elements($JSON$[{"course_id": 50, "lesson_id": 181, "lesson_order": 2, "seq": "01", "pdf": "/course-materials/vedu-python-specific/01.pdf"}, {"course_id": 50, "lesson_id": 182, "lesson_order": 3, "seq": "02", "pdf": "/course-materials/vedu-python-specific/02.pdf"}, {"course_id": 50, "lesson_id": 183, "lesson_order": 4, "seq": "03", "pdf": "/course-materials/vedu-python-specific/03.pdf"}, {"course_id": 50, "lesson_id": 184, "lesson_order": 5, "seq": "04", "pdf": "/course-materials/vedu-python-specific/04.pdf"}, {"course_id": 50, "lesson_id": 185, "lesson_order": 6, "seq": "05", "pdf": "/course-materials/vedu-python-specific/05.pdf"}, {"course_id": 50, "lesson_id": 186, "lesson_order": 7, "seq": "06", "pdf": "/course-materials/vedu-python-specific/06.pdf"}, {"course_id": 50, "lesson_id": 187, "lesson_order": 8, "seq": "07", "pdf": "/course-materials/vedu-python-specific/07.pdf"}, {"course_id": 50, "lesson_id": 188, "lesson_order": 9, "seq": "08", "pdf": "/course-materials/vedu-python-specific/08.pdf"}, {"course_id": 50, "lesson_id": 189, "lesson_order": 10, "seq": "09", "pdf": "/course-materials/vedu-python-specific/09.pdf"}]$JSON$::jsonb) LOOP
  lid:=(x->>'lesson_id')::bigint;newurl:=x->>'pdf';
  SELECT l.title INTO actual_title FROM lms.lessons l
   WHERE l.lesson_id=lid AND l.course_id=(x->>'course_id')::bigint AND l.lesson_order=(x->>'lesson_order')::int
    AND l.is_published AND NOT l.is_deleted;
  IF actual_title IS NULL THEN RAISE EXCEPTION 'Python lesson id/course/order mismatch: %',lid; END IF;
  IF btrim(actual_title) NOT LIKE ((x->>'seq') || ' ·%') THEN
    RAISE EXCEPTION 'Python lesson number/title prefix mismatch: %, %',lid,actual_title;
  END IF;
  RAISE NOTICE 'Validated lesson %: %',lid,actual_title;
  IF NOT EXISTS(SELECT 1 FROM lms.lesson_resources WHERE lesson_id=lid AND resource_type='PDF' AND resource_url=newurl) THEN
   INSERT INTO lms.lesson_resources(lesson_id,resource_type,title,resource_url,display_order)
   VALUES(lid,'PDF','VEDU - PDF học tập Python cơ bản - bài '||(x->>'seq'),newurl,
   (SELECT COALESCE(MAX(display_order),0)+1 FROM lms.lesson_resources WHERE lesson_id=lid));n:=n+1;
  END IF;
 END LOOP;
 RAISE NOTICE 'Added % Python lesson-specific PDFs',n;
END $fix$;
COMMIT;
