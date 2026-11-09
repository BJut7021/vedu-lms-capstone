\set ON_ERROR_STOP on
BEGIN;
DO $fix$
DECLARE x jsonb; actual text; n int:=0; k int;
BEGIN
 FOR x IN SELECT value FROM jsonb_array_elements($JSON$[{"course_id": 53, "lesson_id": 208, "lesson_order": 6, "lesson_title": "05 · Minimax và alpha-beta", "url": "https://www.youtube.com/watch?v=CAEI_J50B18", "resource_title": "[AI] Thuật toán Minimax, alpha-beta – Đỗ Phúc Hảo", "note": "Khớp trực tiếp"}, {"course_id": 53, "lesson_id": 213, "lesson_order": 11, "lesson_title": "10 · Học không giám sát và K-means", "url": "https://www.youtube.com/watch?v=JdCZHlV7bdQ", "resource_title": "Chi tiết thuật toán K-means – namkuner", "note": "Khớp K-means; lồng tiếng AI"}]$JSON$::jsonb) LOOP
   SELECT l.title INTO actual FROM lms.lessons l
   WHERE l.lesson_id=(x->>'lesson_id')::bigint AND l.course_id=(x->>'course_id')::bigint
   AND l.lesson_order=(x->>'lesson_order')::int AND l.is_published AND NOT l.is_deleted;
   IF actual IS NULL OR btrim(regexp_replace(actual,'[[:space:]]+',' ','g')) IS DISTINCT FROM x->>'lesson_title' THEN
      RAISE EXCEPTION 'Lesson mismatch: id=% actual=% expected=%',x->>'lesson_id', actual,x->>'lesson_title';
   END IF;
   IF NOT EXISTS (SELECT 1 FROM lms.lesson_resources WHERE lesson_id=(x->>'lesson_id')::bigint AND resource_type='VIDEO' AND resource_url=x->>'url') THEN
      IF EXISTS (SELECT 1 FROM lms.lesson_resources WHERE lesson_id=(x->>'lesson_id')::bigint AND resource_type IN ('VIDEO','LINK') AND resource_url=x->>'url') THEN
         UPDATE lms.lesson_resources SET resource_type='VIDEO' WHERE lesson_id=(x->>'lesson_id')::bigint AND resource_type='LINK' AND resource_url=x->>'url';
      ELSE
         INSERT INTO lms.lesson_resources(lesson_id,resource_type,title,resource_url,display_order)
         VALUES((x->>'lesson_id')::bigint,'VIDEO',x->>'resource_title',x->>'url',
           (SELECT COALESCE(MAX(display_order),0)+1 FROM lms.lesson_resources WHERE lesson_id=(x->>'lesson_id')::bigint));
      END IF;
      n:=n+1;
   END IF;
   SELECT COUNT(*) INTO k FROM lms.lesson_resources WHERE lesson_id=(x->>'lesson_id')::bigint AND resource_type='VIDEO' AND resource_url=x->>'url';
   IF k<>1 THEN RAISE EXCEPTION 'VIDEO count mismatch lesson_id=% count=%',x->>'lesson_id',k; END IF;
   RAISE NOTICE 'Validated VIDEO lesson %: %',x->>'lesson_id',actual;
 END LOOP;
 RAISE NOTICE 'Added/promoted % lesson-specific VIDEO resources',n;
END $fix$;
COMMIT;
