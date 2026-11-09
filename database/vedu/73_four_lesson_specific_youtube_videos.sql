\set ON_ERROR_STOP on
BEGIN;
DO $fix$
DECLARE x jsonb; actual text; n int:=0; existing int;
BEGIN
 FOR x IN SELECT value FROM jsonb_array_elements($JSON$[{"course_id": 54, "lesson_id": 217, "lesson_order": 4, "lesson_title": "03 · IPAM", "url": "https://www.youtube.com/watch?v=eA1oSzTmzwQ", "resource_title": "[Bổ trợ tiếng Anh] MSFT WebCast - How to Install and Configure IPAM in Windows Server 2022", "language": "en", "notes": "IPAM Windows Server 2022 hướng dẫn cài đặt cấu hình"}, {"course_id": 54, "lesson_id": 222, "lesson_order": 9, "lesson_title": "08 · Work Folders", "url": "https://www.youtube.com/watch?v=ulCFx_A_gtU", "resource_title": "[Bổ trợ tiếng Anh] ROHIT TECH - How to Deploy Work Folders on Windows Server", "language": "en", "notes": "Work Folders đồng bộ file giữa Windows Server và máy khách"}, {"course_id": 54, "lesson_id": 224, "lesson_order": 11, "lesson_title": "10 · AD Sites, Subnets và Replication", "url": "https://www.youtube.com/watch?v=tMg5IAU-NHs", "resource_title": "[Bổ trợ tiếng Anh] IT INDEX - AD Sites Subnets Site Links and Replication Practical", "language": "en", "notes": "Thực hành AD Sites, Subnets, site links và replication"}, {"course_id": 52, "lesson_id": 197, "lesson_order": 2, "lesson_title": "01 · NumPy, Pandas và TensorFlow", "url": "https://www.youtube.com/watch?v=1eSmR2EJjYM", "resource_title": "CodeXplore - Hướng dẫn thành thạo NumPy (Tiếng Việt)", "language": "vi", "notes": "NumPy - nội dung nhập môn; Pandas/TensorFlow tiếp tục xem PDF"}]$JSON$::jsonb) LOOP
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
 RAISE NOTICE 'Added/promoted % migration73 lesson-specific VIDEO rows',n;
END $fix$;
COMMIT;
