\set ON_ERROR_STOP on
BEGIN;
DO $fix$
DECLARE x jsonb; actual text; n int:=0; existing int;
BEGIN
 FOR x IN SELECT value FROM jsonb_array_elements($JSON$[{"course_id": 52, "lesson_id": 198, "lesson_order": 3, "lesson_title": "02 · ANN", "url": "https://www.youtube.com/watch?v=pusntJk4tsw", "resource_title": "Việt Nguyễn AI - Thực hành xây dựng Neural Network cơ bản (tiếng Việt)", "language": "vi partial", "notes": "Ví dụ thực hành mạng nơ-ron ANN; đọc PDF cho lý thuyết đầy đủ"}, {"course_id": 46, "lesson_id": 150, "lesson_order": 6, "lesson_title": "05 · Tương quan, kiểm định và hồi quy", "url": "https://www.youtube.com/watch?v=bTzGlI2Kjtg", "resource_title": "GS. Nguyễn Văn Tuấn - Hồi quy tuyến tính: giới thiệu (tiếng Việt)", "language": "vi partial", "notes": "Video hồi quy tuyến tính; tương quan và kiểm định học bổ sung trong PDF"}, {"course_id": 49, "lesson_id": 179, "lesson_order": 11, "lesson_title": "10 · Website tin tức và triển khai", "url": "https://www.youtube.com/watch?v=JukEcn3nBeU", "resource_title": "Quốc Bửu Group - Lập trình website tin tức Laravel phần 1 (tiếng Việt)", "language": "vi partial", "notes": "Hướng dẫn xây dựng website tin tức; chưa bao gồm triển khai production"}, {"course_id": 51, "lesson_id": 193, "lesson_order": 4, "lesson_title": "03 · Cluster, DFS, sharding và replication", "url": "https://www.youtube.com/watch?v=aigkvNxuEi0", "resource_title": "CloudxLab - HDFS replication (tiếng Anh, bổ trợ)", "language": "en supplementary", "notes": "Giải thích DFS block replication; phần cluster và sharding xem PDF"}, {"course_id": 54, "lesson_id": 223, "lesson_order": 10, "lesson_title": "09 · Child domain và forest trust", "url": "https://www.youtube.com/watch?v=1vWSKLX0Xrk", "resource_title": "MSFT WebCast - Add Child Domain Windows Server (tiếng Anh, bổ trợ)", "language": "en supplementary", "notes": "Hướng dẫn child domain; phần forest trust tham khảo PDF"}]$JSON$::jsonb) LOOP
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
  RAISE NOTICE 'Validated VIDEO lesson %: %',x->>'lesson_id',actual;
 END LOOP;
 RAISE NOTICE 'Added/promoted % migration77 lesson-specific VIDEO rows',n;
END $fix$;
COMMIT;
