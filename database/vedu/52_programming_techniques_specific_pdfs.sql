\set ON_ERROR_STOP on
BEGIN;
DO $fix$
DECLARE x jsonb; lid bigint; actual_title text; newurl text; n integer:=0;
BEGIN
 IF (SELECT count(*) FROM lms.lessons WHERE course_id=48 AND is_published AND NOT is_deleted AND lesson_order>1)<>8 THEN
  RAISE EXCEPTION 'Kỹ thuật lập trình has unexpected published main lesson count';
 END IF;
 FOR x IN SELECT value FROM jsonb_array_elements($JSON$[{"course_id": 48, "lesson_id": 161, "lesson_order": 2, "title": "01 · Phong cách lập trình, ngoại lệ và tập tin", "pdf": "/course-materials/vedu-programming-techniques-specific/01.pdf"}, {"course_id": 48, "lesson_id": 162, "lesson_order": 3, "title": "02 · Mảng một chiều: tổng, đếm, tìm kiếm, min/max", "pdf": "/course-materials/vedu-programming-techniques-specific/02.pdf"}, {"course_id": 48, "lesson_id": 163, "lesson_order": 4, "title": "03 · Sắp xếp, thêm và xóa phần tử", "pdf": "/course-materials/vedu-programming-techniques-specific/03.pdf"}, {"course_id": 48, "lesson_id": 164, "lesson_order": 5, "title": "04 · Mảng hai chiều và ma trận", "pdf": "/course-materials/vedu-programming-techniques-specific/04.pdf"}, {"course_id": 48, "lesson_id": 165, "lesson_order": 6, "title": "05 · Chuỗi cơ bản, chuẩn hóa và token", "pdf": "/course-materials/vedu-programming-techniques-specific/05.pdf"}, {"course_id": 48, "lesson_id": 166, "lesson_order": 7, "title": "06 · Tìm kiếm, đếm và thay thế chuỗi con", "pdf": "/course-materials/vedu-programming-techniques-specific/06.pdf"}, {"course_id": 48, "lesson_id": 167, "lesson_order": 8, "title": "07 · Đệ quy tuyến tính và nhị phân", "pdf": "/course-materials/vedu-programming-techniques-specific/07.pdf"}, {"course_id": 48, "lesson_id": 168, "lesson_order": 9, "title": "08 · Đệ quy lồng, hỗ tương và ứng dụng", "pdf": "/course-materials/vedu-programming-techniques-specific/08.pdf"}]$JSON$::jsonb) LOOP
  lid:=(x->>'lesson_id')::bigint; newurl:=x->>'pdf';
  SELECT l.title INTO actual_title FROM lms.lessons l
  WHERE l.lesson_id=lid AND l.course_id=(x->>'course_id')::bigint AND l.lesson_order=(x->>'lesson_order')::int AND l.is_published AND NOT l.is_deleted;
  IF actual_title IS NULL THEN RAISE EXCEPTION 'Lesson id/course/order mismatch: %',lid; END IF;
  IF btrim(regexp_replace(actual_title,'[[:space:]]+',' ','g')) <> (x->>'title') THEN
   RAISE EXCEPTION 'Lesson title mismatch id=%, db=%, expected=%',lid,actual_title,x->>'title';
  END IF;
  RAISE NOTICE 'Validated lesson %: %',lid,actual_title;
  IF NOT EXISTS(SELECT 1 FROM lms.lesson_resources WHERE lesson_id=lid AND resource_type='PDF' AND resource_url=newurl) THEN
   INSERT INTO lms.lesson_resources(lesson_id,resource_type,title,resource_url,display_order)
   VALUES(lid,'PDF','VEDU - PDF bài học Kỹ thuật lập trình',newurl,
   (SELECT COALESCE(MAX(display_order),0)+1 FROM lms.lesson_resources WHERE lesson_id=lid)); n:=n+1;
  END IF;
 END LOOP;
 RAISE NOTICE 'Added % Kỹ thuật lập trình lesson-specific PDFs',n;
END $fix$;
COMMIT;
