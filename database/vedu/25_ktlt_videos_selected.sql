\set ON_ERROR_STOP on
BEGIN;
DO $ktlt_videos_24$
DECLARE
  target_course bigint;
  row_ record;
  title_expected text;
  n int;
  change_count int:=0;
  insert_count int:=0;
BEGIN
  SELECT course_id INTO target_course FROM lms.curated_courses WHERE course_key='programming-techniques';
  IF target_course IS NULL THEN RAISE EXCEPTION 'KTLT course not found'; END IF;
  IF (SELECT count(*) FROM lms.lessons l JOIN lms.course_sections s ON s.section_id=l.section_id
      WHERE l.course_id=target_course AND s.module_key<>'intro' AND l.is_published AND NOT l.is_deleted) <> 8
  THEN RAISE EXCEPTION 'KTLT must have exactly 8 published non-intro lessons'; END IF;

  FOR row_ IN
    WITH numbered AS (
      SELECT l.lesson_id,l.title,row_number() OVER(ORDER BY l.lesson_order,l.lesson_id)::int AS rn
      FROM lms.lessons l JOIN lms.course_sections s ON s.section_id=l.section_id
      WHERE l.course_id=target_course AND s.module_key<>'intro' AND l.is_published AND NOT l.is_deleted
    )
    SELECT n.lesson_id,n.title,n.rn,v.topic,v.url,v.label
    FROM numbered n JOIN (VALUES
      (1,'Phong cách lập trình, ngoại lệ và tập tin','https://www.youtube.com/watch?v=H3Z8tUOJFP8','Thao tác cơ bản trên tập tin - Việt Nam Sơn Nguyễn (chỉ phần tập tin)'),
      (2,'Mảng một chiều: tổng, đếm, tìm kiếm, min/max','https://www.youtube.com/watch?v=M3v7Ie9hu0s','Mảng một chiều C++ - 28Tech'),
      (3,'Sắp xếp, thêm và xóa phần tử','https://www.youtube.com/watch?v=96vSM-dPwyg','Bài tập mảng một chiều - 28Tech (có bài sắp đặt dãy số)'),
      (4,'Mảng hai chiều và ma trận','https://www.youtube.com/watch?v=iYVesRI8OIg','Mảng hai chiều - 28Tech (minh họa bằng C)'),
      (7,'Đệ quy tuyến tính và nhị phân','https://www.youtube.com/watch?v=eQ3VpTtc9lE','Kỹ thuật đệ quy trong C++ - Tờ Mờ Sáng tổng hợp'),
      (8,'Đệ quy lồng, hỗ tương và ứng dụng','https://www.youtube.com/watch?v=QLptkhgu1a0','Giải bài tập đệ quy - Việt Nam Sơn Nguyễn (video bổ trợ, chưa xác minh đệ quy hỗ tương)')
    ) AS v(rn,topic,url,label) ON v.rn=n.rn
  LOOP
    title_expected:=trim(regexp_replace(row_.title,'^[[:space:]]*[0-9]+[[:space:]]*[.·:–-]*[[:space:]]*',''));
    IF title_expected <> row_.topic THEN RAISE EXCEPTION 'KTLT lesson % unexpected title: %',row_.rn,row_.title; END IF;
    IF NOT EXISTS (SELECT 1 FROM lms.lesson_resources WHERE lesson_id=row_.lesson_id AND resource_type='VIDEO' AND resource_url=row_.url) THEN
      INSERT INTO lms.lesson_resources(lesson_id,resource_type,title,resource_url,display_order)
      VALUES(row_.lesson_id,'VIDEO','Video KTLT - '||row_.label,row_.url,
        (SELECT coalesce(max(display_order),0)+1 FROM lms.lesson_resources WHERE lesson_id=row_.lesson_id));
      insert_count:=insert_count+1;
    END IF;
  END LOOP;
  RAISE NOTICE 'KTLT videos: inserted %, lessons 05-06 pending exact-match sources',insert_count;
END $ktlt_videos_24$;
COMMIT;
