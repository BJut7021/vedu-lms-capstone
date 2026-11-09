\set ON_ERROR_STOP on
BEGIN;
DO $import$
DECLARE r jsonb; count_added integer:=0; lesson bigint; link text;
BEGIN
  FOR r IN SELECT value FROM jsonb_array_elements($json$[{"course_id": 54, "lesson_id": 215, "lesson_order": 2, "url": "/course-materials/vedu-network-admin-specific/01.pdf"}, {"course_id": 54, "lesson_id": 216, "lesson_order": 3, "url": "/course-materials/vedu-network-admin-specific/02.pdf"}, {"course_id": 54, "lesson_id": 217, "lesson_order": 4, "url": "/course-materials/vedu-network-admin-specific/03.pdf"}, {"course_id": 54, "lesson_id": 218, "lesson_order": 5, "url": "/course-materials/vedu-network-admin-specific/04.pdf"}, {"course_id": 54, "lesson_id": 219, "lesson_order": 6, "url": "/course-materials/vedu-network-admin-specific/05.pdf"}, {"course_id": 54, "lesson_id": 220, "lesson_order": 7, "url": "/course-materials/vedu-network-admin-specific/06.pdf"}, {"course_id": 54, "lesson_id": 221, "lesson_order": 8, "url": "/course-materials/vedu-network-admin-specific/07.pdf"}, {"course_id": 54, "lesson_id": 222, "lesson_order": 9, "url": "/course-materials/vedu-network-admin-specific/08.pdf"}, {"course_id": 54, "lesson_id": 223, "lesson_order": 10, "url": "/course-materials/vedu-network-admin-specific/09.pdf"}, {"course_id": 54, "lesson_id": 224, "lesson_order": 11, "url": "/course-materials/vedu-network-admin-specific/10.pdf"}]$json$::jsonb) LOOP
    lesson := (r->>'lesson_id')::bigint;
    link := r->>'url';
    IF NOT EXISTS(SELECT 1 FROM lms.lessons l WHERE l.lesson_id=lesson AND l.course_id=54 AND l.lesson_order=(r->>'lesson_order')::int AND l.is_published AND NOT l.is_deleted) THEN
      RAISE EXCEPTION 'Unexpected course/lesson mapping for lesson %',lesson;
    END IF;
    IF NOT EXISTS(SELECT 1 FROM lms.lesson_resources WHERE lesson_id=lesson AND resource_type='PDF' AND resource_url=link) THEN
      INSERT INTO lms.lesson_resources(lesson_id,resource_type,title,resource_url,display_order)
      VALUES(lesson,'PDF','VEDU - Phiếu thực hành riêng bài Quản trị mạng',link,(SELECT COALESCE(MAX(display_order),0)+1 FROM lms.lesson_resources WHERE lesson_id=lesson));
      count_added := count_added+1;
    END IF;
  END LOOP;
  RAISE NOTICE 'Added % network admin lesson-specific PDFs',count_added;
END $import$;
COMMIT;
