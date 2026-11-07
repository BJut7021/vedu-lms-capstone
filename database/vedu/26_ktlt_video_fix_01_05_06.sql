\set ON_ERROR_STOP on
BEGIN;
DO $ktlt_video_fix_25$
DECLARE
 target_course bigint;
 r record;
 expected_title text;
 added integer := 0;
 removed integer := 0;
BEGIN
 SELECT course_id INTO target_course FROM lms.curated_courses WHERE course_key='programming-techniques';
 IF target_course IS NULL THEN RAISE EXCEPTION 'KTLT course not found'; END IF;
 IF (SELECT count(*) FROM lms.lessons l JOIN lms.course_sections s ON s.section_id=l.section_id WHERE l.course_id=target_course AND s.module_key<>'intro' AND l.is_published AND NOT l.is_deleted) <> 8
 THEN RAISE EXCEPTION 'KTLT lesson count mismatch'; END IF;
 FOR r IN
  WITH numbered AS (
    SELECT l.lesson_id,l.title,row_number() OVER(ORDER BY l.lesson_order,l.lesson_id)::int AS rn
    FROM lms.lessons l JOIN lms.course_sections s ON s.section_id=l.section_id
    WHERE l.course_id=target_course AND s.module_key<>'intro' AND l.is_published AND NOT l.is_deleted
  )
  SELECT n.lesson_id,n.title,n.rn,v.expected,v.url,v.label
  FROM numbered n JOIN (VALUES
    (1,'Phong cách lập trình, ngoại lệ và tập tin','https://www.youtube.com/watch?v=x-uR5GFmUU0','Đọc ghi tệp C/C++ – Thien Tam Nguyen (phần tập tin)'),
    (5,'Chuỗi cơ bản, chuẩn hóa và token','https://www.youtube.com/watch?v=AIdl_24l7Mw','Chuẩn hóa xâu ký tự C++ – Mai Loan Nguyễn Hiền'),
    (6,'Tìm kiếm, đếm và thay thế chuỗi con','https://www.youtube.com/watch?v=AwBY3AkQO3M','Hàm xử lý chuỗi C++ – 28Tech (find, substr; thay thế cần đọc bổ sung)')
  ) AS v(rn,expected,url,label) ON n.rn=v.rn
 LOOP
  expected_title := trim(regexp_replace(r.title,'^[[:space:]]*[0-9]+[[:space:]]*[.·:–-]*[[:space:]]*',''));
  IF expected_title <> r.expected THEN RAISE EXCEPTION 'KTLT lesson % title mismatch: %',r.rn,r.title; END IF;
  IF r.rn=1 THEN
   DELETE FROM lms.lesson_resources WHERE lesson_id=r.lesson_id AND resource_type='VIDEO' AND resource_url='https://www.youtube.com/watch?v=H3Z8tUOJFP8';
   GET DIAGNOSTICS removed = ROW_COUNT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM lms.lesson_resources WHERE lesson_id=r.lesson_id AND resource_type='VIDEO' AND resource_url=r.url) THEN
   INSERT INTO lms.lesson_resources(lesson_id,resource_type,title,resource_url,display_order)
    VALUES(r.lesson_id,'VIDEO','Video KTLT - '||r.label,r.url,
      (SELECT coalesce(max(display_order),0)+1 FROM lms.lesson_resources WHERE lesson_id=r.lesson_id));
   added:=added+1;
  END IF;
 END LOOP;
 RAISE NOTICE 'KTLT video fix: added %, removed private video %',added,removed;
END $ktlt_video_fix_25$;
COMMIT;
