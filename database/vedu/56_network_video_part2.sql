\set ON_ERROR_STOP on
BEGIN;
DO $fix$
DECLARE v jsonb; n int:=0; dbtitle text; oldurl text; cnt int;
BEGIN
 FOR v IN SELECT value FROM jsonb_array_elements($JSON$[{"resource_id": 2594, "lesson_id": 309, "lesson_order": 5, "lesson_title": "04 · VLSM và Subnetting", "old_url": "https://www.youtube.com/watch?v=Or9uKSs0SE0", "new_url": "https://www.youtube.com/watch?v=2JtJBOgJHSQ", "new_title": "Bài toán chia mạng con VLSM – Mạng truyền thông IT"}, {"resource_id": 2600, "lesson_id": 315, "lesson_order": 11, "lesson_title": "10 · Xây dựng hệ thống mạng cơ bản", "old_url": "https://www.youtube.com/watch?v=tUNZhrl-PwY", "new_url": "https://www.youtube.com/watch?v=9Dw62XCxgTI", "new_title": "Thiết kế và cấu hình mạng LAN bằng Cisco Packet Tracer – Nguyễn Đình Nga"}]$JSON$::jsonb) LOOP
  SELECT l.title, r.resource_url INTO dbtitle,oldurl
  FROM lms.lesson_resources r JOIN lms.lessons l ON l.lesson_id=r.lesson_id
  WHERE r.resource_id=(v->>'resource_id')::bigint AND r.lesson_id=(v->>'lesson_id')::bigint
    AND l.course_id=64 AND l.lesson_order=(v->>'lesson_order')::int
    AND l.is_published AND NOT l.is_deleted AND r.resource_type='VIDEO';
  IF dbtitle IS NULL THEN RAISE EXCEPTION 'Lesson/resource mismatch for resource %',v->>'resource_id'; END IF;
  IF regexp_replace(trim(dbtitle),'[[:space:]]+',' ','g') <> v->>'lesson_title' THEN
   RAISE EXCEPTION 'Lesson title mismatch for %: %',v->>'lesson_id',dbtitle;
  END IF;
  IF oldurl=v->>'new_url' THEN RAISE NOTICE 'Already updated %',v->>'resource_id';CONTINUE;END IF;
  IF oldurl IS DISTINCT FROM v->>'old_url' THEN RAISE EXCEPTION 'Old URL mismatch resource %: %',v->>'resource_id',oldurl; END IF;
  UPDATE lms.lesson_resources SET resource_url=v->>'new_url',title=v->>'new_title'
    WHERE resource_id=(v->>'resource_id')::bigint AND lesson_id=(v->>'lesson_id')::bigint;
  GET DIAGNOSTICS cnt=ROW_COUNT;
  IF cnt<>1 THEN RAISE EXCEPTION 'Unexpected update count for resource %',v->>'resource_id';END IF;
  n:=n+1;
 END LOOP;
 RAISE NOTICE 'Updated % additional network VIDEO records',n;
END $fix$;
COMMIT;
