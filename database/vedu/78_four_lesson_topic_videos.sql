\set ON_ERROR_STOP on
BEGIN;
DO $fix$
DECLARE x jsonb; actual text; n int:=0; existing int;
BEGIN
 FOR x IN SELECT value FROM jsonb_array_elements($JSON$[{"course_id": 53, "lesson_id": 210, "lesson_order": 8, "lesson_title": "07 · Logic mệnh đề, Vương Hạo và Robinson", "url": "https://www.youtube.com/watch?v=CbI-Q2a5rUU", "resource_title": "Mahesh Huddar - Resolution / Robinson trong logic vị từ (tiếng Anh, bổ trợ)", "language": "en supplementary", "notes": "Giải thích thuật giải Robinson, chưa bao quát Vương Hạo và toàn bộ logic mệnh đề"}, {"course_id": 53, "lesson_id": 211, "lesson_order": 9, "lesson_title": "08 · Luật sinh và mạng ngữ nghĩa", "url": "https://www.youtube.com/watch?v=ApJb1mh18sE", "resource_title": "T V Nagaraju Technical - Semantic Networks in AI (tiếng Anh, bổ trợ)", "language": "en supplementary", "notes": "Giải thích mạng ngữ nghĩa; phần luật sinh cần học qua PDF"}, {"course_id": 51, "lesson_id": 195, "lesson_order": 6, "lesson_title": "05 · Phân lớp, hồi quy, lọc cộng tác và phân tích", "url": "https://www.youtube.com/watch?v=JhjpPO4pIfg", "resource_title": "AlmaBetter - Collaborative Filtering in Recommender Systems (tiếng Anh, bổ trợ)", "language": "en supplementary", "notes": "Giải thích lọc cộng tác; phân lớp và hồi quy tham khảo PDF"}, {"course_id": 47, "lesson_id": 159, "lesson_order": 9, "lesson_title": "08 · Thực thi, báo lỗi và hồi quy", "url": "https://www.youtube.com/watch?v=qJdbqE7sWOw", "resource_title": "Software and Testing Training - Regression Testing (tiếng Anh, bổ trợ)", "language": "en supplementary", "notes": "Hướng dẫn kiểm thử hồi quy; phần thực thi và báo lỗi tham khảo PDF"}]$JSON$::jsonb) LOOP
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
 RAISE NOTICE 'Added/promoted % migration78 lesson-specific VIDEO rows',n;
END $fix$;
COMMIT;
