\set ON_ERROR_STOP on
BEGIN;
DO $fix$
DECLARE x jsonb; actual text; n int:=0; existing int;
BEGIN
 FOR x IN SELECT value FROM jsonb_array_elements($JSON$[{"course_id": 46, "lesson_id": 148, "lesson_order": 4, "lesson_title": "03 · Phân lớp dữ liệu", "url": "https://www.youtube.com/watch?v=RxynzID74WA", "resource_title": "Linh teach coding - Phân lớp với Naive Bayes Classifier", "note": "Video tiếng Việt về Naive Bayes; chỉ bao phủ một thuật toán phân lớp"}, {"course_id": 53, "lesson_id": 205, "lesson_order": 3, "lesson_title": "02 · BFS, DFS, UCS và giới hạn sâu", "url": "https://www.youtube.com/watch?v=-ipt-37bdzY", "resource_title": "Tri Thức Mở - DFS, BFS, tìm kiếm tối ưu (MIT 6.034 song ngữ)", "note": "Có lồng tiếng/phụ đề song ngữ; bao phủ DFS/BFS/A*, chưa bao phủ toàn bộ giới hạn sâu"}, {"course_id": 53, "lesson_id": 212, "lesson_order": 10, "lesson_title": "09 · Học máy có giám sát", "url": "https://www.youtube.com/watch?v=MZzGZSYdMlA", "resource_title": "Keith Lê - Giới thiệu Supervised Learning (Học có giám sát)", "note": "Nội dung tiếng Việt giới thiệu học có giám sát; kiến thức nhập môn"}]$JSON$::jsonb) LOOP
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
