\set ON_ERROR_STOP on
BEGIN;
DO $py_video_pdf_v3$
DECLARE
  course_id_ bigint;
  lesson_count integer;
  r record;
  item jsonb;
  current_video_count integer;
  video_resource_id bigint;
  display_ord integer;
  src text := 'https://courses.vnuhcm.edu.vn/clients/courses/138';
  lesson_title text;
BEGIN
  SELECT course_id INTO course_id_ FROM lms.curated_courses WHERE course_key='python';
  IF course_id_ IS NULL THEN RAISE EXCEPTION 'Khong tim thay khoa Python'; END IF;
  SELECT count(*) INTO lesson_count
  FROM lms.lessons l JOIN lms.course_sections s ON s.section_id=l.section_id
  WHERE l.course_id=course_id_ AND s.module_key <> 'intro' AND l.is_published AND NOT l.is_deleted;
  IF lesson_count<>9 THEN RAISE EXCEPTION 'Expected 9 Python lessons, got %',lesson_count; END IF;
  FOR r IN
    SELECT l.lesson_id,l.title,row_number() OVER(ORDER BY l.lesson_order,l.lesson_id) AS rn
    FROM lms.lessons l JOIN lms.course_sections s ON s.section_id=l.section_id
    WHERE l.course_id=course_id_ AND s.module_key <> 'intro' AND l.is_published AND NOT l.is_deleted
  LOOP
    SELECT value INTO item FROM jsonb_array_elements($py_json$[{"order":1,"topic":"Giới thiệu Python và lệnh in","video":"https://www.youtube.com/watch?v=-J3iDYu1qSQ","pdf_source":"https://courses.vnuhcm.edu.vn/clients/courses/138","pdf_topic":"Slide 1.2 – Giới thiệu Python"},{"order":2,"topic":"Biến và toán tử","video":"https://www.youtube.com/watch?v=L3RiWMXdWi4","pdf_source":"https://courses.vnuhcm.edu.vn/clients/courses/138","pdf_topic":"Slide 2.4 – Biến và 2.5 – Biểu thức"},{"order":3,"topic":"Điều kiện if/elif/else","video":"https://www.youtube.com/watch?v=pGoWFXh8o30","pdf_source":"https://courses.vnuhcm.edu.vn/clients/courses/138","pdf_topic":"Slide 4.1 – Câu lệnh điều kiện"},{"order":4,"topic":"Vòng lặp for và while","video":"https://www.youtube.com/watch?v=WAi2-o02moc","pdf_source":"https://courses.vnuhcm.edu.vn/clients/courses/138","pdf_topic":"Slide 4.2 – For và 4.3 – While"},{"order":5,"topic":"Hàm trong Python","video":"https://www.youtube.com/watch?v=aruguin5CTE","pdf_source":"https://courses.vnuhcm.edu.vn/clients/courses/138","pdf_topic":"Slide 5.1 – Giới thiệu hàm và 5.3 – Cách gọi hàm"},{"order":6,"topic":"Chuỗi và thao tác chuỗi","video":"https://www.youtube.com/watch?v=-qfF7myFmR0","pdf_source":"https://courses.vnuhcm.edu.vn/clients/courses/138","pdf_topic":"Slide 3.1 – Các kiểu dữ liệu cơ bản"},{"order":7,"topic":"List và Tuple","video":"https://www.youtube.com/watch?v=-Jeo-dfRbV8","pdf_source":"https://courses.vnuhcm.edu.vn/clients/courses/138","pdf_topic":"Slide 3.3 – List và Tuple"},{"order":8,"topic":"Dictionary và Module","video":"https://www.youtube.com/watch?v=jZKx09KJ9S8","pdf_source":"https://courses.vnuhcm.edu.vn/clients/courses/138","pdf_topic":"Slide 3.4 – Dictionary và 2.1 – Cú pháp Python"},{"order":9,"topic":"Class và thao tác tệp","video":"https://www.youtube.com/watch?v=CBOg9vb1XAo","pdf_source":"https://courses.vnuhcm.edu.vn/clients/courses/138","pdf_topic":"Slide 9.2 – Lớp/đối tượng và 3.5 – Tệp dữ liệu"}]$py_json$::jsonb) value
      WHERE (value->>'order')::int=r.rn;
    lesson_title := regexp_replace(r.title,'^\s*[0-9]+\s*[.·:-]*\s*','');
    IF item IS NULL OR lower(btrim(lesson_title))<>lower(btrim(item->>'topic'))
      THEN RAISE EXCEPTION 'Python lesson % title mismatch: %',r.rn,r.title; END IF;
    SELECT count(*) INTO current_video_count FROM lms.lesson_resources
      WHERE lesson_id=r.lesson_id AND resource_type='VIDEO'
        AND title NOT IN ('Video Python theo bài (VEDU-V3)', 'Video Python theo chủ đề – Tờ Mờ Sáng (VEDU-V3)');
    IF current_video_count>1 THEN
       RAISE EXCEPTION 'Python lesson % has multiple custom video resources; no change',r.lesson_id;
    END IF;
    SELECT resource_id INTO video_resource_id FROM lms.lesson_resources
      WHERE lesson_id=r.lesson_id AND resource_type='VIDEO'
        AND title IN ('Video Python theo bài (VEDU-V3)', 'Video Python theo chủ đề – Tờ Mờ Sáng (VEDU-V3)') ORDER BY resource_id LIMIT 1;
    IF video_resource_id IS NOT NULL THEN
      UPDATE lms.lesson_resources SET title='Video Python theo bài (VEDU-V3)', resource_url=item->>'video'
      WHERE resource_id=video_resource_id AND resource_url IS DISTINCT FROM item->>'video';
    ELSIF current_video_count=1 THEN
      UPDATE lms.lesson_resources SET
        title='Video Python theo bài (VEDU-V3)',resource_url=item->>'video'
      WHERE resource_id=(SELECT resource_id FROM lms.lesson_resources
          WHERE lesson_id=r.lesson_id AND resource_type='VIDEO' LIMIT 1);
    ELSE
      SELECT COALESCE(max(display_order),0)+1 INTO display_ord FROM lms.lesson_resources WHERE lesson_id=r.lesson_id;
      INSERT INTO lms.lesson_resources(lesson_id,resource_type,title,resource_url,display_order)
      VALUES(r.lesson_id,'VIDEO','Video Python theo bài (VEDU-V3)',item->>'video',display_ord);
    END IF;
    -- Links are to the UNIVERSITY'S ORIGINAL PDF LISTING PAGE, not to a guessed PDF file.
    -- Keep original PDFs already linked to the course; add a clearly labeled index for the matching chapter.
    IF NOT EXISTS(SELECT 1 FROM lms.lesson_resources
       WHERE lesson_id=r.lesson_id AND resource_type='LINK'
         AND title LIKE 'Slide PDF theo chương – ĐHQG TP.HCM (VEDU-V3)%') THEN
       SELECT COALESCE(max(display_order),0)+1 INTO display_ord FROM lms.lesson_resources WHERE lesson_id=r.lesson_id;
       INSERT INTO lms.lesson_resources(lesson_id,resource_type,title,resource_url,display_order)
       VALUES(r.lesson_id,'LINK','Slide PDF theo chương – ĐHQG TP.HCM (VEDU-V3): '||(item->>'pdf_topic'),src,display_ord);
    END IF;
  END LOOP;
END $py_video_pdf_v3$;
COMMIT;
