\set ON_ERROR_STOP on
BEGIN;
DO $fix$
DECLARE v jsonb; n int:=0; dbtitle text; oldurl text; cnt int;
BEGIN
 FOR v IN SELECT value FROM jsonb_array_elements($JSON$[{"resource_id": 2566, "lesson_id": 265, "lesson_order": 2, "lesson_title": "01 · Tìm kiếm thông tin có mục tiêu", "old_url": "https://www.youtube.com/watch?v=MiDc072EPiw", "new_url": "https://www.youtube.com/watch?v=OCPZ3huU4Oo", "new_title": "Tìm thông tin trên Internet sao cho HIỆU QUẢ? AI hay Google? - Tài Xài Tech"}]$JSON$::jsonb) LOOP
  SELECT l.title, r.resource_url INTO dbtitle,oldurl
  FROM lms.lesson_resources r JOIN lms.lessons l ON l.lesson_id=r.lesson_id
  WHERE r.resource_id=(v->>'resource_id')::bigint AND r.lesson_id=(v->>'lesson_id')::bigint
    AND l.course_id=60 AND l.lesson_order=(v->>'lesson_order')::int
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
 RAISE NOTICE 'Updated % targeted digital-information VIDEO record(s)',n;
END $fix$;
COMMIT;
