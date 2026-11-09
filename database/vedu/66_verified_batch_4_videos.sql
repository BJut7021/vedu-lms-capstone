\set ON_ERROR_STOP on
BEGIN;
DO $fix$
DECLARE x jsonb; actual text; n int:=0; existing int;
BEGIN
 FOR x IN SELECT value FROM jsonb_array_elements($JSON$[{"course_id": 46, "lesson_id": 146, "lesson_order": 2, "lesson_title": "01 · Tổng quan và tiền xử lý", "url": "https://www.youtube.com/watch?v=KF8DDljY0RA", "resource_title": "novadq - Tổng quan khai phá dữ liệu: mô hình tiến trình và các bài toán", "note": "Tiếng Việt; nguồn mô tả về tổng quan Data Mining; tiền xử lý cần học thêm trong PDF"}, {"course_id": 49, "lesson_id": 171, "lesson_order": 3, "lesson_title": "02 · OOP trong PHP", "url": "https://www.youtube.com/watch?v=FAGGvF438Dw", "resource_title": "SUNTECH ACADEMY - Lập trình hướng đối tượng trong PHP dành cho người mới", "note": "Tiếng Việt, các khái niệm đóng gói/kế thừa; video khớp bài OOP PHP"}, {"course_id": 51, "lesson_id": 194, "lesson_order": 5, "lesson_title": "04 · MapReduce, Spark RDD, DataFrame và luồng", "url": "https://www.youtube.com/watch?v=Gr1chpBWmCU", "resource_title": "Mai DE - Học Spark bằng tiếng Việt cho người mới bắt đầu", "note": "Tiếng Việt; giới thiệu Spark; không đảm bảo bao quát toàn bộ RDD/DataFrame/Streaming"}, {"course_id": 52, "lesson_id": 201, "lesson_order": 6, "lesson_title": "05 · RNN", "url": "https://www.youtube.com/watch?v=XTxR3Cnqrs8", "resource_title": "Học Lập Trình cùng Phát - Language Model and Recurrent Neural Network", "note": "Tiếng Việt; minh họa RNN trong sinh văn bản; chưa kiểm tra nhúng"}]$JSON$::jsonb) LOOP
  SELECT l.title INTO actual FROM lms.lessons l WHERE l.lesson_id=(x->>'lesson_id')::bigint
    AND l.course_id=(x->>'course_id')::bigint AND l.lesson_order=(x->>'lesson_order')::int
    AND l.is_published AND NOT l.is_deleted;
  IF actual IS NULL OR btrim(regexp_replace(actual,'[[:space:]]+',' ','g')) IS DISTINCT FROM x->>'lesson_title' THEN
    RAISE EXCEPTION 'Lesson mismatch id=%, db=%, expected=%', x->>'lesson_id',actual,x->>'lesson_title';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM lms.lesson_resources r WHERE r.lesson_id=(x->>'lesson_id')::bigint
      AND r.resource_type='VIDEO' AND r.resource_url=x->>'url') THEN
    IF EXISTS (SELECT 1 FROM lms.lesson_resources r WHERE r.lesson_id=(x->>'lesson_id')::bigint
      AND r.resource_type='LINK' AND r.resource_url=x->>'url') THEN
      UPDATE lms.lesson_resources SET resource_type='VIDEO' WHERE lesson_id=(x->>'lesson_id')::bigint
       AND resource_type='LINK' AND resource_url=x->>'url';
    ELSE
      INSERT INTO lms.lesson_resources(lesson_id,resource_type,title,resource_url,display_order)
      VALUES((x->>'lesson_id')::bigint,'VIDEO',x->>'resource_title',x->>'url',
       (SELECT COALESCE(MAX(display_order),0)+1 FROM lms.lesson_resources WHERE lesson_id=(x->>'lesson_id')::bigint));
    END IF;
    n:=n+1;
  END IF;
  SELECT COUNT(*) INTO existing FROM lms.lesson_resources WHERE lesson_id=(x->>'lesson_id')::bigint
    AND resource_type='VIDEO' AND resource_url=x->>'url';
  IF existing<>1 THEN RAISE EXCEPTION 'Expected one VIDEO, found % for lesson %',existing,x->>'lesson_id'; END IF;
  RAISE NOTICE 'Validated VIDEO for lesson %: %',x->>'lesson_id',actual;
 END LOOP;
 RAISE NOTICE 'Added/promoted % target VIDEO rows',n;
END $fix$;
COMMIT;
