\set ON_ERROR_STOP on
BEGIN;
DO $fix$
DECLARE x jsonb; actual text; n int:=0; existing int;
BEGIN
 FOR x IN SELECT value FROM jsonb_array_elements($JSON$[{"course_id": 53, "lesson_id": 207, "lesson_order": 5, "lesson_title": "04 · Leo đồi và thuật toán di truyền", "url": "https://www.youtube.com/watch?v=FP0VLEaiE6Y", "resource_title": "Học Giải Thuật Cùng HPN - Giải mã thuật toán di truyền (tiếng Việt)", "language": "vi partial", "notes": "Giải thích thuật toán di truyền; phần leo đồi học thêm trong PDF"}, {"course_id": 51, "lesson_id": 192, "lesson_order": 3, "lesson_title": "02 · Phân tích liên kết: PageRank và HITS", "url": "https://www.youtube.com/watch?v=ACuEJCsBWt0", "resource_title": "Học Giải Thuật Cùng HPN - Thuật toán PageRank (tiếng Việt)", "language": "vi partial", "notes": "Giải thích PageRank; phần HITS học thêm trong PDF"}, {"course_id": 54, "lesson_id": 221, "lesson_order": 8, "lesson_title": "07 · Dynamic Access Control", "url": "https://www.youtube.com/watch?v=UHOF20yjq9s", "resource_title": "CBT Nuggets - Dynamic Access Control (tiếng Anh, bổ trợ)", "language": "en supplementary", "notes": "Bổ trợ cấu hình claims với DAC trên Windows Server; dùng PDF tiếng Việt làm tài liệu chính"}]$JSON$::jsonb) LOOP
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
 RAISE NOTICE 'Added/promoted % migration76 lesson-specific VIDEO rows',n;
END $fix$;
COMMIT;
