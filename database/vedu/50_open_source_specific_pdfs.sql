\set ON_ERROR_STOP on
BEGIN;
DO $fix$
DECLARE x jsonb; lid bigint; newurl text; n integer:=0; actual_title text;
BEGIN
 FOR x IN SELECT value FROM jsonb_array_elements($JSON$[{"course_id": 49, "lesson_id": 170, "lesson_order": 2, "title": "01 · PHP và môi trường", "pdf": "/course-materials/vedu-open-source-specific/01.pdf"}, {"course_id": 49, "lesson_id": 171, "lesson_order": 3, "title": "02 · OOP trong PHP", "pdf": "/course-materials/vedu-open-source-specific/02.pdf"}, {"course_id": 49, "lesson_id": 172, "lesson_order": 4, "title": "03 · JavaScript, DOM và AJAX", "pdf": "/course-materials/vedu-open-source-specific/03.pdf"}, {"course_id": 49, "lesson_id": 173, "lesson_order": 5, "title": "04 · MySQL và PDO", "pdf": "/course-materials/vedu-open-source-specific/04.pdf"}, {"course_id": 49, "lesson_id": 174, "lesson_order": 6, "title": "05 · MySQL nâng cao", "pdf": "/course-materials/vedu-open-source-specific/05.pdf"}, {"course_id": 49, "lesson_id": 175, "lesson_order": 7, "title": "06 · Laravel và MVC", "pdf": "/course-materials/vedu-open-source-specific/06.pdf"}, {"course_id": 49, "lesson_id": 176, "lesson_order": 8, "title": "07 · Routing, Controller và Blade", "pdf": "/course-materials/vedu-open-source-specific/07.pdf"}, {"course_id": 49, "lesson_id": 177, "lesson_order": 9, "title": "08 · Migration, Eloquent và quan hệ", "pdf": "/course-materials/vedu-open-source-specific/08.pdf"}, {"course_id": 49, "lesson_id": 178, "lesson_order": 10, "title": "09 · Validation và phân quyền", "pdf": "/course-materials/vedu-open-source-specific/09.pdf"}, {"course_id": 49, "lesson_id": 179, "lesson_order": 11, "title": "10 · Website tin tức và triển khai", "pdf": "/course-materials/vedu-open-source-specific/10.pdf"}]$JSON$::jsonb) LOOP
  lid:=(x->>'lesson_id')::bigint; newurl:=x->>'pdf';
  SELECT l.title INTO actual_title FROM lms.lessons l
   WHERE l.lesson_id=lid AND l.course_id=(x->>'course_id')::bigint
    AND l.lesson_order=(x->>'lesson_order')::int AND l.is_published AND NOT l.is_deleted;
  IF actual_title IS NULL THEN RAISE EXCEPTION 'Lesson id/course/order mismatch: %',lid; END IF;
  IF btrim(regexp_replace(actual_title,'[[:space:]]+',' ','g')) <> (x->>'title') THEN
    RAISE EXCEPTION 'Lesson title mismatch id=%, db=%, expected=%',lid,actual_title,x->>'title';
  END IF;
  RAISE NOTICE 'Validated lesson %: %',lid,actual_title;
  IF NOT EXISTS(SELECT 1 FROM lms.lesson_resources WHERE lesson_id=lid AND resource_type='PDF' AND resource_url=newurl) THEN
   INSERT INTO lms.lesson_resources(lesson_id,resource_type,title,resource_url,display_order)
   VALUES(lid,'PDF','VEDU - PDF bài học Lập trình mã nguồn mở',newurl,
    (SELECT COALESCE(MAX(display_order),0)+1 FROM lms.lesson_resources WHERE lesson_id=lid));n:=n+1;
  END IF;
 END LOOP;
 RAISE NOTICE 'Added % open-source programming lesson-specific PDFs',n;
END $fix$;
COMMIT;
