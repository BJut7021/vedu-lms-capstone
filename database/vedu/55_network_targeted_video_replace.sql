\set ON_ERROR_STOP on
BEGIN;
DO $fix$
DECLARE v jsonb; n int:=0; dbtitle text; oldtitle text; oldurl text; cnt int;
BEGIN
 FOR v IN SELECT value FROM jsonb_array_elements($JSON$[{"resource_id": 2591, "lesson_id": 306, "lesson_order": 2, "lesson_title": "01 · Tổng quan về mạng máy tính", "old_url": "https://www.youtube.com/watch?v=Or9uKSs0SE0", "new_url": "https://www.youtube.com/watch?v=tEbEJg9BdsI", "new_title": "Khái niệm mạng máy tính, Internet và địa chỉ IP — Nguyễn Hữu Lam"}, {"resource_id": 2592, "lesson_id": 307, "lesson_order": 3, "lesson_title": "02 · Mô hình OSI và giao thức truyền thông", "old_url": "https://www.youtube.com/watch?v=Or9uKSs0SE0", "new_url": "https://www.youtube.com/watch?v=Rxk1WI0iIsc", "new_title": "Mô hình OSI là gì? Phần 1 — SysOps Guy"}, {"resource_id": 2593, "lesson_id": 308, "lesson_order": 4, "lesson_title": "03 · Địa chỉ IP", "old_url": "https://www.youtube.com/watch?v=Or9uKSs0SE0", "new_url": "https://www.youtube.com/watch?v=fci_Jb1qPjE", "new_title": "Mạng máy tính - Địa chỉ IP — Son Nguyen"}, {"resource_id": 2596, "lesson_id": 311, "lesson_order": 7, "lesson_title": "06 · Ethernet và Switching", "old_url": "https://www.youtube.com/watch?v=Or9uKSs0SE0", "new_url": "https://www.youtube.com/watch?v=l_oxU4Jv4AY", "new_title": "Ôn tập Ethernet Switching CCNA — Học Quản trị Mạng từ con số 0"}, {"resource_id": 2598, "lesson_id": 313, "lesson_order": 9, "lesson_title": "08 · Tầng vận chuyển – TCP/UDP", "old_url": "https://www.youtube.com/watch?v=tUNZhrl-PwY", "new_url": "https://www.youtube.com/watch?v=bB-kH-1rhKg", "new_title": "Mạng máy tính PTIT: TCP/UDP và tầng giao vận — Văn Nguyễn"}]$JSON$::jsonb) LOOP
  SELECT l.title, r.title, r.resource_url INTO dbtitle,oldtitle,oldurl
  FROM lms.lesson_resources r JOIN lms.lessons l ON l.lesson_id=r.lesson_id
  WHERE r.resource_id=(v->>'resource_id')::bigint
    AND r.lesson_id=(v->>'lesson_id')::bigint
    AND l.course_id=64 AND l.lesson_order=(v->>'lesson_order')::int
    AND l.is_published=true AND l.is_deleted=false
    AND r.resource_type='VIDEO';
  IF dbtitle IS NULL THEN RAISE EXCEPTION 'Lesson/resource mismatch for resource %',v->>'resource_id'; END IF;
  IF regexp_replace(trim(dbtitle),'[[:space:]]+',' ','g') <> v->>'lesson_title' THEN
   RAISE EXCEPTION 'Title mismatch for lesson %: %',v->>'lesson_id', dbtitle;
  END IF;
  IF oldurl = v->>'new_url' THEN
   RAISE NOTICE 'Already updated resource %',v->>'resource_id'; CONTINUE;
  END IF;
  IF oldurl IS DISTINCT FROM v->>'old_url' THEN
   RAISE EXCEPTION 'URL changed unexpectedly resource %, actual %',v->>'resource_id', oldurl;
  END IF;
  UPDATE lms.lesson_resources
    SET resource_url=v->>'new_url',title=v->>'new_title'
    WHERE resource_id=(v->>'resource_id')::bigint;
  GET DIAGNOSTICS cnt=ROW_COUNT;
  IF cnt <> 1 THEN RAISE EXCEPTION 'Unexpected update count for resource %',v->>'resource_id'; END IF;
  n:=n+1;
 END LOOP;
 RAISE NOTICE 'Updated % VIDEO records in Mạng máy tính', n;
END $fix$;
COMMIT;
