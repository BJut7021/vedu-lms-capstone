\set ON_ERROR_STOP on
BEGIN;
DO $fix$
DECLARE v jsonb; n int:=0; actual_title text; lesson_video_count int;
BEGIN
 FOR v IN SELECT value FROM jsonb_array_elements($JSON$[{"course_id": 46, "lesson_id": 147, "lesson_order": 3, "lesson_title": "02 · Tập phổ biến và luật kết hợp", "resource_title": "Bài 04: Khai phá luật kết hợp (sử dụng thuật toán Apriori) - Nguyễn Cương", "new_url": "https://www.youtube.com/watch?v=5yzOLeRXTec"}, {"course_id": 46, "lesson_id": 149, "lesson_order": 5, "lesson_title": "04 · Gom cụm dữ liệu", "resource_title": "Bài giảng Khai thác Dữ liệu - Buổi 9: Gom cụm và thuật toán K-means - Đinh Nguyễn Trọng Nghĩa", "new_url": "https://www.youtube.com/watch?v=FMkXgPH2hL0"}, {"course_id": 47, "lesson_id": 154, "lesson_order": 4, "lesson_title": "03 · Thiết kế test case và test data", "resource_title": "Xây dựng một Test Case thế nào? (Phần 1) - giáo.làng", "new_url": "https://www.youtube.com/watch?v=RHfzVlFUl10"}, {"course_id": 49, "lesson_id": 175, "lesson_order": 7, "lesson_title": "06 · Laravel và MVC", "resource_title": "PHP Laravel cơ bản trong 3 giờ (MVC) - Nguyen Duc Hoang", "new_url": "https://www.youtube.com/watch?v=iSsFV9hmxDk"}]$JSON$::jsonb) LOOP
  SELECT l.title INTO actual_title FROM lms.lessons l
  WHERE l.lesson_id=(v->>'lesson_id')::bigint AND l.course_id=(v->>'course_id')::bigint
    AND l.lesson_order=(v->>'lesson_order')::int AND l.is_published AND NOT l.is_deleted;
  IF actual_title IS NULL THEN RAISE EXCEPTION 'Missing course/lesson/order for %',v->>'lesson_id'; END IF;
  IF btrim(regexp_replace(actual_title,'[[:space:]]+',' ','g')) IS DISTINCT FROM v->>'lesson_title' THEN
   RAISE EXCEPTION 'Wrong title lesson %, got %',v->>'lesson_id',actual_title;
  END IF;
  IF NOT EXISTS(SELECT 1 FROM lms.lesson_resources r WHERE r.lesson_id=(v->>'lesson_id')::bigint
      AND r.resource_type IN ('VIDEO','LINK') AND r.resource_url=v->>'new_url') THEN
   INSERT INTO lms.lesson_resources(lesson_id,resource_type,title,resource_url,display_order)
   VALUES((v->>'lesson_id')::bigint,'VIDEO',v->>'resource_title',v->>'new_url',
          (SELECT COALESCE(MAX(display_order),0)+1 FROM lms.lesson_resources WHERE lesson_id=(v->>'lesson_id')::bigint));
   n:=n+1;
  END IF;
  SELECT count(*) INTO lesson_video_count FROM lms.lesson_resources r
  WHERE r.lesson_id=(v->>'lesson_id')::bigint AND r.resource_type='VIDEO' AND r.resource_url=v->>'new_url';
  IF lesson_video_count<>1 THEN RAISE EXCEPTION 'Expected one VIDEO with matching URL for lesson %, found %',v->>'lesson_id',lesson_video_count; END IF;
  RAISE NOTICE 'Validated VIDEO for lesson %: %',v->>'lesson_id',actual_title;
 END LOOP;
 RAISE NOTICE 'Added % unique VIDEO resources (no existing VIDEO/LINK deleted)',n;
END $fix$;
COMMIT;
