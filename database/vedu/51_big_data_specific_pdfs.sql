\set ON_ERROR_STOP on
BEGIN;
DO $fix$
DECLARE x jsonb; lid bigint; actual_title text; newurl text; n integer:=0;
BEGIN
 FOR x IN SELECT value FROM jsonb_array_elements($JSON$[{"course_id": 51, "lesson_id": 191, "lesson_order": 2, "title": "01 · Tổng quan dữ liệu lớn", "pdf": "/course-materials/vedu-big-data-specific/01.pdf"}, {"course_id": 51, "lesson_id": 192, "lesson_order": 3, "title": "02 · Phân tích liên kết: PageRank và HITS", "pdf": "/course-materials/vedu-big-data-specific/02.pdf"}, {"course_id": 51, "lesson_id": 193, "lesson_order": 4, "title": "03 · Cluster, DFS, sharding và replication", "pdf": "/course-materials/vedu-big-data-specific/03.pdf"}, {"course_id": 51, "lesson_id": 194, "lesson_order": 5, "title": "04 · MapReduce, Spark RDD, DataFrame và luồng", "pdf": "/course-materials/vedu-big-data-specific/04.pdf"}, {"course_id": 51, "lesson_id": 195, "lesson_order": 6, "title": "05 · Phân lớp, hồi quy, lọc cộng tác và phân tích", "pdf": "/course-materials/vedu-big-data-specific/05.pdf"}]$JSON$::jsonb) LOOP
  lid:=(x->>'lesson_id')::bigint; newurl:=x->>'pdf';
  SELECT l.title INTO actual_title FROM lms.lessons l WHERE l.lesson_id=lid AND l.course_id=(x->>'course_id')::bigint AND l.lesson_order=(x->>'lesson_order')::int AND l.is_published AND NOT l.is_deleted;
  IF actual_title IS NULL THEN RAISE EXCEPTION 'Lesson id/course/order mismatch: %',lid; END IF;
  IF btrim(regexp_replace(actual_title,'[[:space:]]+',' ','g')) <> x->>'title' THEN RAISE EXCEPTION 'Lesson title mismatch id=%, db=%, expected=%',lid,actual_title,x->>'title'; END IF;
  RAISE NOTICE 'Validated lesson %: %',lid,actual_title;
  IF NOT EXISTS(SELECT 1 FROM lms.lesson_resources WHERE lesson_id=lid AND resource_type='PDF' AND resource_url=newurl) THEN
    INSERT INTO lms.lesson_resources(lesson_id,resource_type,title,resource_url,display_order) VALUES(lid,'PDF','VEDU - PDF bài học Nhập môn Big Data',newurl,(SELECT COALESCE(MAX(display_order),0)+1 FROM lms.lesson_resources WHERE lesson_id=lid));n:=n+1;
  END IF;
 END LOOP;
 RAISE NOTICE 'Added % Big Data lesson-specific PDFs',n;
END $fix$;
COMMIT;
