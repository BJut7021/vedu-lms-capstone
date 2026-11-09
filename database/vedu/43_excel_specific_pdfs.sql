\set ON_ERROR_STOP on
BEGIN;
DO $m$
DECLARE x jsonb; lid bigint; n integer:=0; newurl text;
BEGIN
 FOR x IN SELECT value FROM jsonb_array_elements($j$[{"course_id": 57, "lesson_id": 241, "lesson_order": 2, "pdf": "/course-materials/vedu-excel-specific/01.pdf"}, {"course_id": 57, "lesson_id": 242, "lesson_order": 3, "pdf": "/course-materials/vedu-excel-specific/02.pdf"}, {"course_id": 57, "lesson_id": 243, "lesson_order": 4, "pdf": "/course-materials/vedu-excel-specific/03.pdf"}, {"course_id": 57, "lesson_id": 244, "lesson_order": 5, "pdf": "/course-materials/vedu-excel-specific/04.pdf"}, {"course_id": 57, "lesson_id": 245, "lesson_order": 6, "pdf": "/course-materials/vedu-excel-specific/05.pdf"}, {"course_id": 57, "lesson_id": 246, "lesson_order": 7, "pdf": "/course-materials/vedu-excel-specific/06.pdf"}, {"course_id": 57, "lesson_id": 247, "lesson_order": 8, "pdf": "/course-materials/vedu-excel-specific/07.pdf"}]$j$::jsonb) LOOP
 lid := (x->>'lesson_id')::bigint;
 newurl := x->>'pdf';
 IF NOT EXISTS (SELECT 1 FROM lms.lessons l WHERE l.lesson_id=lid AND l.course_id=(x->>'course_id')::bigint AND l.lesson_order=(x->>'lesson_order')::int AND l.is_published AND NOT l.is_deleted) THEN
 RAISE EXCEPTION 'Unexpected Excel lesson: %',lid;
 END IF;
 IF NOT EXISTS (SELECT 1 FROM lms.lesson_resources r WHERE r.lesson_id=lid AND r.resource_type='PDF' AND r.resource_url=newurl) THEN
 INSERT INTO lms.lesson_resources(lesson_id,resource_type,title,resource_url,display_order)
 VALUES (lid,'PDF','VEDU - PDF Excel riêng theo bài',newurl,
 (SELECT COALESCE(MAX(display_order),0)+1 FROM lms.lesson_resources WHERE lesson_id=lid));
 n:=n+1;
 END IF;
 END LOOP;
 RAISE NOTICE 'Added % lesson-specific Excel PDFs',n;
END $m$;
COMMIT;
