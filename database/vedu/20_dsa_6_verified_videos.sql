\set ON_ERROR_STOP on
BEGIN;
DO $dsa_video_v2$
DECLARE
 course_id_ bigint;
 rec record;
 item jsonb;
 n int;
 updated_count int;
BEGIN
 SELECT course_id INTO course_id_ FROM lms.curated_courses WHERE course_key='dsa';
 IF course_id_ IS NULL THEN RAISE EXCEPTION 'DSA course not found'; END IF;
 IF (SELECT count(*) FROM lms.lessons l JOIN lms.course_sections s ON s.section_id=l.section_id WHERE l.course_id=course_id_ AND s.module_key<>'intro' AND l.is_published AND NOT l.is_deleted) <> 10
 THEN RAISE EXCEPTION 'DSA requires exactly 10 published lessons'; END IF;
 FOR rec IN
   SELECT l.lesson_id,l.title,row_number() OVER (ORDER BY l.lesson_order,l.lesson_id) AS rn
   FROM lms.lessons l JOIN lms.course_sections s ON s.section_id=l.section_id
   WHERE l.course_id=course_id_ AND s.module_key<>'intro' AND l.is_published AND NOT l.is_deleted
 LOOP
   SELECT value INTO item FROM jsonb_array_elements($videos$[{"order":1,"lesson":"Tổng quan cấu trúc dữ liệu và giải thuật","old_id":"kQyEg0p5K1g","video":"https://www.youtube.com/watch?v=uHpzKcm8qh0","title":"Tất tần tật về cấu trúc dữ liệu (Học Giải Thuật Cùng HPN)"},{"order":2,"lesson":"Phân tích độ phức tạp","old_id":"-AGbOe6tZFE","video":"https://www.youtube.com/watch?v=AXtEmD2QFPs","title":"Độ phức tạp thuật toán Big-O (Học Giải Thuật Cùng HPN)"},{"order":3,"lesson":"Đệ quy","old_id":"jsJBCEp-zVY","video":"https://www.youtube.com/watch?v=fxX1i8YWj9A","title":"Giải thuật cơ bản: Đệ quy (Học Giải Thuật Cùng HPN)"},{"order":8,"lesson":"Cây nhị phân","old_id":"hrHEr1XLFbE","video":"https://www.youtube.com/watch?v=WgNDH3ZAGEE","title":"Cấu trúc dữ liệu đồ thị và cây (Học Giải Thuật Cùng HPN)"},{"order":9,"lesson":"Tìm kiếm","old_id":"DX5TkbwDi1E","video":"https://www.youtube.com/watch?v=RD53wLkH3mQ","title":"Tìm kiếm nhị phân (Học Giải Thuật Cùng HPN)"},{"order":10,"lesson":"Sắp xếp","old_id":"TkoCrp8golw","video":"https://www.youtube.com/watch?v=mGFGprCRcF4","title":"Các thuật toán sắp xếp (Học Giải Thuật Cùng HPN)"}]$videos$::jsonb) AS value
      WHERE (value->>'order')::int=rec.rn;
   IF item IS NULL THEN CONTINUE; END IF;
   IF trim(regexp_replace(rec.title, '^\s*[0-9]+\s*[.·:–-]\s*', '')) IS DISTINCT FROM (item->>'lesson') THEN RAISE EXCEPTION 'DSA lesson % name mismatch: %',rec.rn,rec.title; END IF;
   UPDATE lms.lesson_resources
       SET title='Video bài giảng DSA – '||(item->>'title'),
           resource_url=item->>'video',resource_type='VIDEO'
       WHERE lesson_id=rec.lesson_id
         AND (resource_url LIKE 'https://www.youtube.com/watch?v='||(item->>'old_id')||'%'
              OR title='Video bài giảng DSA – '||(item->>'title'));
   GET DIAGNOSTICS updated_count = ROW_COUNT;
   IF updated_count=0 THEN
     INSERT INTO lms.lesson_resources(lesson_id,resource_type,title,resource_url,display_order)
     VALUES(rec.lesson_id,'VIDEO','Video bài giảng DSA – '||(item->>'title'),item->>'video',
       (SELECT COALESCE(MAX(display_order),0)+1 FROM lms.lesson_resources WHERE lesson_id=rec.lesson_id));
   END IF;
 END LOOP;
END $dsa_video_v2$;
COMMIT;
