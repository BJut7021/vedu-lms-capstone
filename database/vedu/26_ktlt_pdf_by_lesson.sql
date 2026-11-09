\set ON_ERROR_STOP on
BEGIN;
DO $ktlt_pdf_v5$
DECLARE
 cid bigint;
 intro_id bigint;
 cnt integer;
 r record;
 source jsonb;
 ord integer;
 existing_id bigint;
 workbook_url text := 'vedu-file:6a9b61e2-f186-7174-a5e4-2d82ea29c076.pdf';
 common_url text := 'vedu-file:58742a53-4447-9380-2ed0-29cd36efbb6d.pdf';
 prefix text := 'PDF KTLT theo bai (VEDU-V5): ';
BEGIN
 SELECT course_id INTO cid FROM lms.curated_courses WHERE course_key='programming-techniques';
 IF cid IS NULL THEN RAISE EXCEPTION 'KTLT course not found'; END IF;
 SELECT l.lesson_id INTO intro_id FROM lms.lessons l
 JOIN lms.course_sections s ON s.section_id=l.section_id
 WHERE l.course_id=cid AND s.module_key='intro' AND l.is_published AND NOT l.is_deleted
 ORDER BY l.lesson_order,l.lesson_id LIMIT 1;
 IF intro_id IS NULL THEN RAISE EXCEPTION 'KTLT introduction not found'; END IF;
 SELECT count(*) INTO cnt FROM lms.lessons l JOIN lms.course_sections s ON s.section_id=l.section_id
 WHERE l.course_id=cid AND s.module_key<>'intro' AND l.is_published AND NOT l.is_deleted;
 IF cnt<>8 THEN RAISE EXCEPTION 'KTLT expected 8 lessons; found %',cnt; END IF;
 -- Ensure common books remain available on introduction before de-duplicating lesson links.
 IF NOT EXISTS(SELECT 1 FROM lms.lesson_resources WHERE lesson_id=intro_id AND resource_type='PDF' AND resource_url=common_url)
 OR NOT EXISTS(SELECT 1 FROM lms.lesson_resources WHERE lesson_id=intro_id AND resource_type='PDF' AND resource_url=workbook_url)
 THEN RAISE EXCEPTION 'KTLT shared PDF files absent in introduction; no changes'; END IF;
 FOR r IN SELECT l.lesson_id,l.title,row_number() OVER(ORDER BY l.lesson_order,l.lesson_id)::int AS rn
 FROM lms.lessons l JOIN lms.course_sections s ON s.section_id=l.section_id
 WHERE l.course_id=cid AND s.module_key<>'intro' AND l.is_published AND NOT l.is_deleted
 LOOP
  FOR source IN SELECT value FROM jsonb_array_elements($mapping$[{"n":1,"label":"Phong cach lap trinh - HUST","url":"https://users.soict.hust.edu.vn/trungtt/uploads/slides/KTLT_Bai06.pdf","source":"Trinh Thanh Trung, DH Bach khoa Ha Noi","note":"Phong cach lap trinh va to chuc ma nguon"},{"n":1,"label":"Lap trinh phong ngua, xu ly loi - HUST","url":"https://users.soict.hust.edu.vn/trungtt/uploads/slides/KTLT_Bai08.pdf","source":"Trinh Thanh Trung, DH Bach khoa Ha Noi","note":"Bo sung ve loi; phan doc/ghi file xem giao trinh HUFI"},{"n":2,"label":"Mang mot chieu - HUST","url":"https://users.soict.hust.edu.vn/trungtt/uploads/slides/KTLT_Bai04.pdf","source":"Trinh Thanh Trung, DH Bach khoa Ha Noi","note":"Phan mang; tong, dem, min/max tu luyen theo bai"},{"n":3,"label":"Tim kiem va sap xep - HUST","url":"https://users.soict.hust.edu.vn/trungtt/uploads/slides/KTLT_Bai03.pdf","source":"Trinh Thanh Trung, DH Bach khoa Ha Noi","note":"Phan thuat toan tim kiem va sap xep; chen/xoa tu luyen theo bai"},{"n":4,"label":"Mang hai chieu - HUST","url":"https://users.soict.hust.edu.vn/trungtt/uploads/slides/KTLT_Bai04.pdf","source":"Trinh Thanh Trung, DH Bach khoa Ha Noi","note":"Phan mang nhieu chieu, can doc dung muc"},{"n":5,"label":"Chuong 3 - Chuoi co ban va chuan hoa (HUFI)","url":"vedu-file:58742a53-4447-9380-2ed0-29cd36efbb6d.pdf","source":"Giao trinh KTLT, HUFI - tai lieu goc trong VEDU","note":"Doc chuong 3, phan chuan hoa va tach token"},{"n":6,"label":"Chuong 3 - Tim, dem va thay the chuoi con (HUFI)","url":"vedu-file:58742a53-4447-9380-2ed0-29cd36efbb6d.pdf","source":"Giao trinh KTLT, HUFI - tai lieu goc trong VEDU","note":"Doc chuong 3, phan xu ly chuoi con"},{"n":7,"label":"De quy: co so va phan nhanh - HUST","url":"https://users.soict.hust.edu.vn/trungtt/uploads/slides/PT04_DeQui.pdf","source":"Trinh Thanh Trung, DH Bach khoa Ha Noi","note":"Noi dung de quy, dieu kien dung va cay loi goi"},{"n":8,"label":"Chuong 4 - De quy long va ho tuong (HUFI)","url":"vedu-file:58742a53-4447-9380-2ed0-29cd36efbb6d.pdf","source":"Giao trinh KTLT, HUFI - tai lieu goc trong VEDU","note":"Doc chuong 4, phan de quy long va de quy ho tuong"}]$mapping$::jsonb) AS value
    WHERE (value->>'n')::int=r.rn
  LOOP
   -- For HUFI, reuse existing PDF resource ID rather than insert an unnecessary duplicate.
   SELECT resource_id INTO existing_id FROM lms.lesson_resources
   WHERE lesson_id=r.lesson_id AND resource_type='PDF'
     AND (title = prefix||(source->>'label') OR
         (resource_url=common_url AND source->>'url'=common_url AND title NOT LIKE prefix||'%'))
   ORDER BY CASE WHEN title=prefix||(source->>'label') THEN 0 ELSE 1 END,resource_id LIMIT 1;
   IF existing_id IS NOT NULL THEN
    UPDATE lms.lesson_resources SET title=prefix||(source->>'label'),resource_url=source->>'url',resource_type='PDF'
    WHERE resource_id=existing_id;
   ELSE
    SELECT coalesce(max(display_order),0)+1 INTO ord FROM lms.lesson_resources WHERE lesson_id=r.lesson_id;
    INSERT INTO lms.lesson_resources(lesson_id,resource_type,title,resource_url,display_order)
    VALUES(r.lesson_id,'PDF',prefix||(source->>'label'),source->>'url',ord);
   END IF;
  END LOOP;
  IF NOT EXISTS(SELECT 1 FROM lms.lesson_resources lr WHERE lr.lesson_id=r.lesson_id AND lr.resource_type='PDF' AND lr.title LIKE prefix||'%')
  THEN RAISE EXCEPTION 'KTLT lesson % has no topic PDF',r.rn; END IF;
 END LOOP;
 -- Keep all original files at intro; only remove two known repeated generic links from teaching lessons.
 UPDATE lms.lesson_resources SET title='Giao trinh KTLT HUFI - tai lieu tham khao chung'
 WHERE lesson_id=intro_id AND resource_type='PDF' AND resource_url=common_url;
 UPDATE lms.lesson_resources SET title='So tu hoc, de cuong va bai tap KTLT - tham khao chung'
 WHERE lesson_id=intro_id AND resource_type='PDF' AND resource_url=workbook_url;
 DELETE FROM lms.lesson_resources lr USING lms.lessons l, lms.course_sections s
 WHERE lr.lesson_id=l.lesson_id AND l.section_id=s.section_id AND l.course_id=cid
 AND s.module_key<>'intro' AND lr.resource_type='PDF'
 AND lr.resource_url IN(common_url,workbook_url) AND lr.title NOT LIKE prefix||'%';
 RAISE NOTICE 'KTLT: 8 lessons mapped to topic PDFs; shared files kept in introduction';
END $ktlt_pdf_v5$;
COMMIT;
