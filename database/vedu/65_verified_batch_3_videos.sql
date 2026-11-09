\set ON_ERROR_STOP on
BEGIN;
DO $fix$
DECLARE x jsonb; actual text; n int:=0; existing int;
BEGIN
 FOR x IN SELECT value FROM jsonb_array_elements($JSON$[{"course_id": 49, "lesson_id": 170, "lesson_order": 2, "lesson_title": "01 · PHP và môi trường", "url": "https://www.youtube.com/watch?v=0Zay4yjYxJc", "resource_title": "Unitop - Hướng dẫn cài đặt XAMPP học PHP và MySQL", "note": "Tiếng Việt; đối chiếu nội dung cài XAMPP/PHP, không bao quát Composer"}, {"course_id": 54, "lesson_id": 215, "lesson_order": 2, "lesson_title": "01 · DHCP nâng cao", "url": "https://www.youtube.com/watch?v=CUY66-1isQM", "resource_title": "MCT Đặng Đình Công - DHCP Server, Relay, Failover", "note": "Tiếng Việt; scopes, reservation, relay, failover"}, {"course_id": 54, "lesson_id": 216, "lesson_order": 3, "lesson_title": "02 · DNS nâng cao", "url": "https://www.youtube.com/watch?v=mwDFpVy_0aY", "resource_title": "MCT Đặng Đình Công - Cấu hình DNS Server Windows Server", "note": "Tiếng Việt; forward/reverse zone, record và kiểm tra nslookup"}]$JSON$::jsonb) LOOP
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
