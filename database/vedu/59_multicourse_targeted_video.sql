\set ON_ERROR_STOP on
BEGIN;
DO $fix$
DECLARE v jsonb; n integer:=0; db_title text; db_url text; cnt integer;
BEGIN
 FOR v IN SELECT value FROM jsonb_array_elements($JSON$[{"course_id": 63, "lesson_id": 295, "lesson_order": 6, "lesson_title": "05 · Bài toán tìm đường đi ngắn nhất", "resource_id": 2581, "old_url": "https://www.youtube.com/watch?v=7BWM5EwwoDY", "new_url": "https://www.youtube.com/watch?v=NIQdDGVSFCs", "new_title": "Thuật toán Dijkstra tìm đường đi ngắn nhất - UIT Knowledge"}, {"course_id": 63, "lesson_id": 296, "lesson_order": 7, "lesson_title": "06 · Bài toán tìm cây khung nhỏ nhất", "resource_id": 2582, "old_url": "https://www.youtube.com/watch?v=7BWM5EwwoDY", "new_url": "https://www.youtube.com/watch?v=DoRGC2_UtFY", "new_title": "Thuật toán Prim và Kruskal tìm cây khung nhỏ nhất - Nguyễn Thị Phong"}, {"course_id": 63, "lesson_id": 297, "lesson_order": 8, "lesson_title": "07 · Logic học – Mệnh đề và dạng mệnh đề", "resource_id": 2583, "old_url": "https://www.youtube.com/watch?v=IdHOTe8Ojeo", "new_url": "https://www.youtube.com/watch?v=2q2uCC2LW04", "new_title": "Logic mệnh đề và chuyển đổi ngôn ngữ tự nhiên - Đỗ Văn Đức ĐH GTVT"}, {"course_id": 63, "lesson_id": 299, "lesson_order": 10, "lesson_title": "09 · Logic học – Vị từ", "resource_id": 2585, "old_url": "https://www.youtube.com/watch?v=IdHOTe8Ojeo", "new_url": "https://www.youtube.com/watch?v=zm9BmFKmWrI", "new_title": "Toán rời rạc - Logic vị từ, lượng từ - Đỗ Văn Đức ĐH GTVT"}, {"course_id": 55, "lesson_id": 227, "lesson_order": 3, "lesson_title": "02 · Đối tượng nghiệp vụ, tuần tự và cộng tác", "resource_id": 2540, "old_url": "https://www.youtube.com/watch?v=kift-jhIOGg", "new_url": "https://www.youtube.com/watch?v=soadc5aXU1c", "new_title": "UML #4 - Sequence Diagram là gì và cách sử dụng - Ông Dev"}, {"course_id": 55, "lesson_id": 229, "lesson_order": 5, "lesson_title": "04 · Class diagram mức phân tích", "resource_id": 2542, "old_url": "https://www.youtube.com/watch?v=RiGCVzw7pl8", "new_url": "https://www.youtube.com/watch?v=oBykLn64AUc", "new_title": "UML #3 - Class Diagram là gì và cách sử dụng - Ông Dev"}, {"course_id": 62, "lesson_id": 287, "lesson_order": 6, "lesson_title": "05 · Mô hình hóa cấu trúc", "resource_id": 2575, "old_url": "https://www.youtube.com/watch?v=RiGCVzw7pl8", "new_url": "https://www.youtube.com/watch?v=lT5A6-Lg_QI", "new_title": "Phân tích và vẽ sơ đồ lớp - Class Diagram - TITV"}]$JSON$::jsonb) LOOP
  SELECT l.title,r.resource_url INTO db_title,db_url
  FROM lms.lesson_resources r JOIN lms.lessons l ON l.lesson_id=r.lesson_id
  WHERE r.resource_id=(v->>'resource_id')::bigint
    AND r.lesson_id=(v->>'lesson_id')::bigint
    AND l.course_id=(v->>'course_id')::bigint
    AND l.lesson_order=(v->>'lesson_order')::int
    AND l.is_published AND NOT l.is_deleted AND r.resource_type='VIDEO';
  IF db_title IS NULL THEN RAISE EXCEPTION 'Missing/mismatch course, lesson, resource %', v->>'resource_id'; END IF;
  IF btrim(regexp_replace(db_title,'[[:space:]]+',' ','g')) IS DISTINCT FROM (v->>'lesson_title')
  THEN RAISE EXCEPTION 'Title mismatch lesson %: % vs %',v->>'lesson_id',db_title,v->>'lesson_title'; END IF;
  IF db_url=v->>'new_url' THEN RAISE NOTICE 'Already updated resource %',v->>'resource_id'; CONTINUE; END IF;
  IF db_url IS DISTINCT FROM (v->>'old_url') THEN
    RAISE EXCEPTION 'Old video URL changed, abort resource %: %',v->>'resource_id',db_url;
  END IF;
  UPDATE lms.lesson_resources SET resource_url=v->>'new_url',title=v->>'new_title'
   WHERE resource_id=(v->>'resource_id')::bigint AND lesson_id=(v->>'lesson_id')::bigint;
  GET DIAGNOSTICS cnt=ROW_COUNT;
  IF cnt<>1 THEN RAISE EXCEPTION 'Update count mismatch resource %',v->>'resource_id'; END IF;
  n:=n+1;
 END LOOP;
 RAISE NOTICE 'Updated % specifically vetted VIDEO records across 3 courses',n;
END $fix$;
COMMIT;
