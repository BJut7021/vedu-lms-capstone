\set ON_ERROR_STOP on
BEGIN;
DO $fix$
DECLARE x jsonb; lid bigint; newurl text; n integer := 0; actual_title text;
BEGIN
 FOR x IN SELECT value FROM jsonb_array_elements($JSON$[{"course_id": 45, "lesson_id": 140, "lesson_order": 2, "topic": "Tổng quan mạng học sâu", "pdf": "/course-materials/vedu-deep-theory-specific/01.pdf"}, {"course_id": 45, "lesson_id": 141, "lesson_order": 3, "topic": "Mạng truyền thẳng ANN", "pdf": "/course-materials/vedu-deep-theory-specific/02.pdf"}, {"course_id": 45, "lesson_id": 142, "lesson_order": 4, "topic": "Quy trình tối ưu và đánh giá", "pdf": "/course-materials/vedu-deep-theory-specific/03.pdf"}, {"course_id": 45, "lesson_id": 143, "lesson_order": 5, "topic": "Mạng tích chập và residual learning", "pdf": "/course-materials/vedu-deep-theory-specific/04.pdf"}, {"course_id": 45, "lesson_id": 144, "lesson_order": 6, "topic": "Mạng học chuỗi", "pdf": "/course-materials/vedu-deep-theory-specific/05.pdf"}]$JSON$::jsonb)
 LOOP
  lid:=(x->>'lesson_id')::bigint; newurl:=x->>'pdf';
  IF NOT EXISTS (SELECT 1 FROM lms.lessons l WHERE l.lesson_id=lid
   AND l.course_id=(x->>'course_id')::bigint AND l.lesson_order=(x->>'lesson_order')::integer
   AND l.is_published AND NOT l.is_deleted)
  THEN RAISE EXCEPTION 'Lesson ID/course/order mismatch or unpublished id=%', lid; END IF;
  SELECT l.title INTO actual_title FROM lms.lessons l WHERE l.lesson_id=lid;
  IF NOT (CASE (x->>'lesson_order')::int
   WHEN 2 THEN actual_title ~* '(Tổng quan|Tong quan)'
   WHEN 3 THEN actual_title ~* '(ANN|lan truyền)'
   WHEN 4 THEN actual_title ~* '(Huấn luyện|Huan luyen)'
   WHEN 5 THEN actual_title ~* '(CNN|ResNet)'
   WHEN 6 THEN actual_title ~* '(RNN|LSTM|GRU)'
   ELSE false END) THEN RAISE EXCEPTION 'Lesson topic mismatch id=%, actual=%',lid,actual_title; END IF;
  RAISE NOTICE 'Validated lesson %: %',lid,actual_title;
  IF NOT EXISTS (SELECT 1 FROM lms.lesson_resources WHERE lesson_id=lid AND resource_type='PDF' AND resource_url=newurl) THEN
   INSERT INTO lms.lesson_resources(lesson_id,resource_type,title,resource_url,display_order)
    VALUES(lid,'PDF','VEDU - Tài liệu Học sâu riêng theo bài',newurl,
    (SELECT COALESCE(MAX(display_order),0)+1 FROM lms.lesson_resources WHERE lesson_id=lid));
   n:=n+1;
  END IF;
 END LOOP;
 RAISE NOTICE 'Added % lesson-specific deep theory PDFs',n;
END $fix$;
COMMIT;
