\set ON_ERROR_STOP on
BEGIN;
DO $fix$
DECLARE x jsonb; lid bigint; newurl text; n integer:=0; actual_title text;
BEGIN
 FOR x IN SELECT value FROM jsonb_array_elements($JSON$[{"course_id": 47, "lesson_id": 152, "lesson_order": 2, "title": "01 · Tổng quan kiểm thử", "pdf": "/course-materials/vedu-software-testing-specific/01.pdf"}, {"course_id": 47, "lesson_id": 153, "lesson_order": 3, "title": "02 · Quy trình và kế hoạch kiểm thử", "pdf": "/course-materials/vedu-software-testing-specific/02.pdf"}, {"course_id": 47, "lesson_id": 154, "lesson_order": 4, "title": "03 · Thiết kế test case và test data", "pdf": "/course-materials/vedu-software-testing-specific/03.pdf"}, {"course_id": 47, "lesson_id": 155, "lesson_order": 5, "title": "04 · Unit test với NUnit/JUnit", "pdf": "/course-materials/vedu-software-testing-specific/04.pdf"}, {"course_id": 47, "lesson_id": 156, "lesson_order": 6, "title": "05 · BDD và Gherkin", "pdf": "/course-materials/vedu-software-testing-specific/05.pdf"}, {"course_id": 47, "lesson_id": 157, "lesson_order": 7, "title": "06 · Kiểm thử UI với Selenium IDE", "pdf": "/course-materials/vedu-software-testing-specific/06.pdf"}, {"course_id": 47, "lesson_id": 158, "lesson_order": 8, "title": "07 · Kiểm thử API với Postman", "pdf": "/course-materials/vedu-software-testing-specific/07.pdf"}, {"course_id": 47, "lesson_id": 159, "lesson_order": 9, "title": "08 · Thực thi, báo lỗi và hồi quy", "pdf": "/course-materials/vedu-software-testing-specific/08.pdf"}]$JSON$::jsonb) LOOP
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
   VALUES(lid,'PDF','VEDU - Tài liệu kiểm định phần mềm riêng theo bài',newurl,
    (SELECT COALESCE(MAX(display_order),0)+1 FROM lms.lesson_resources WHERE lesson_id=lid));n:=n+1;
  END IF;
 END LOOP;
 RAISE NOTICE 'Added % software testing lesson-specific PDFs',n;
END $fix$;
COMMIT;
