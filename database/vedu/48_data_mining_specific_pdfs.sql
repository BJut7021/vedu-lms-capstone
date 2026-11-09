\set ON_ERROR_STOP on
BEGIN;
DO $fix$
DECLARE x jsonb; lid bigint; newurl text; n integer:=0; actual_title text;
BEGIN
 FOR x IN SELECT value FROM jsonb_array_elements($JSON$[{"course_id": 46, "lesson_id": 146, "lesson_order": 2, "topic": "Tiền xử lý dữ liệu", "pdf": "/course-materials/vedu-data-mining-specific/01.pdf"}, {"course_id": 46, "lesson_id": 147, "lesson_order": 3, "topic": "Apriori và luật kết hợp", "pdf": "/course-materials/vedu-data-mining-specific/02.pdf"}, {"course_id": 46, "lesson_id": 148, "lesson_order": 4, "topic": "Phân loại và đánh giá", "pdf": "/course-materials/vedu-data-mining-specific/03.pdf"}, {"course_id": 46, "lesson_id": 149, "lesson_order": 5, "topic": "Phân cụm K-means", "pdf": "/course-materials/vedu-data-mining-specific/04.pdf"}, {"course_id": 46, "lesson_id": 150, "lesson_order": 6, "topic": "Tương quan, kiểm định, hồi quy", "pdf": "/course-materials/vedu-data-mining-specific/05.pdf"}]$JSON$::jsonb) LOOP
  lid:=(x->>'lesson_id')::bigint; newurl:=x->>'pdf';
  SELECT l.title INTO actual_title FROM lms.lessons l
   WHERE l.lesson_id=lid AND l.course_id=(x->>'course_id')::bigint
    AND l.lesson_order=(x->>'lesson_order')::int AND l.is_published AND NOT l.is_deleted;
  IF actual_title IS NULL THEN RAISE EXCEPTION 'Lesson id/course/order mismatch: %',lid; END IF;
  IF NOT (CASE (x->>'lesson_order')::int
    WHEN 2 THEN actual_title ~* 'Tổng quan|tiền xử lý'
    WHEN 3 THEN actual_title ~* 'Tập phổ biến|luật kết hợp'
    WHEN 4 THEN actual_title ~* 'Phân lớp'
    WHEN 5 THEN actual_title ~* 'Gom cụm'
    WHEN 6 THEN actual_title ~* 'Tương quan|hồi quy'
    ELSE false END) THEN RAISE EXCEPTION 'Lesson topic mismatch id=%, title=%',lid,actual_title; END IF;
  RAISE NOTICE 'Validated lesson %: %',lid,actual_title;
  IF NOT EXISTS(SELECT 1 FROM lms.lesson_resources WHERE lesson_id=lid AND resource_type='PDF' AND resource_url=newurl) THEN
   INSERT INTO lms.lesson_resources(lesson_id,resource_type,title,resource_url,display_order)
   VALUES(lid,'PDF','VEDU - Tài liệu khai phá dữ liệu riêng theo bài',newurl,
    (SELECT COALESCE(MAX(display_order),0)+1 FROM lms.lesson_resources WHERE lesson_id=lid));n:=n+1;
  END IF;
 END LOOP;
 RAISE NOTICE 'Added % data mining lesson-specific PDFs',n;
END $fix$;
COMMIT;
