\set ON_ERROR_STOP on
BEGIN;
DO $python_pdf_v5$
DECLARE
 course_id_ bigint;
 lesson_count integer;
 r record;
 item jsonb;
 rid bigint;
 ord integer;
BEGIN
 SELECT course_id INTO course_id_ FROM lms.curated_courses WHERE course_key = 'python';
 IF course_id_ IS NULL THEN RAISE EXCEPTION 'Python course not found'; END IF;
 SELECT count(*) INTO lesson_count FROM lms.lessons l
 JOIN lms.course_sections s ON s.section_id=l.section_id
 WHERE l.course_id=course_id_ AND s.module_key <> 'intro' AND l.is_published AND NOT l.is_deleted;
 IF lesson_count<>9 THEN RAISE EXCEPTION 'Expected 9 Python lessons, got %',lesson_count; END IF;
 FOR r IN
   SELECT l.lesson_id,l.title,row_number() OVER (ORDER BY l.lesson_order,l.lesson_id) rn
   FROM lms.lessons l JOIN lms.course_sections s ON s.section_id=l.section_id
   WHERE l.course_id=course_id_ AND s.module_key <> 'intro' AND l.is_published AND NOT l.is_deleted
 LOOP
   SELECT value INTO item FROM jsonb_array_elements($pdf_json$[{"order": 1, "topic": "Giới thiệu Python và lệnh in", "url": "https://txnam.net/wp-content/uploads/txnam/mon-hoc/python-2023/python.2023.01.pdf", "title": "PDF bài 01: Giới thiệu Python, chạy chương trình, nhập và xuất — nguồn gốc"}, {"order": 2, "topic": "Biến và toán tử", "url": "https://txnam.net/wp-content/uploads/txnam/mon-hoc/python-2022/python.2022.01.pdf", "title": "PDF bài 02: Biến, kiểu dữ liệu, phép toán và biểu thức — nguồn gốc"}, {"order": 3, "topic": "Điều kiện if/elif/else", "url": "https://txnam.net/wp-content/uploads/txnam/mon-hoc/python-2023/python.2023.02.pdf", "title": "PDF bài 03: Câu lệnh điều kiện và ví dụ rẽ nhánh — nguồn gốc"}, {"order": 4, "topic": "Vòng lặp for và while", "url": "https://txnam.net/wp-content/uploads/txnam/mon-hoc/python-2023/python.2023.03.pdf", "title": "PDF bài 04: Vòng lặp for, while, break/continue — nguồn gốc"}, {"order": 5, "topic": "Hàm trong Python", "url": "https://txnam.net/wp-content/uploads/txnam/mon-hoc/python-2023/python.2023.02.pdf", "title": "PDF bài 05: Hàm, tham số, giá trị trả về — nguồn gốc"}, {"order": 6, "topic": "Chuỗi và thao tác chuỗi", "url": "https://txnam.net/wp-content/uploads/txnam/mon-hoc/python-2023/python.2023.04.pdf", "title": "PDF bài 06: Chuỗi, chỉ số, cắt chuỗi và xử lý chuỗi — nguồn gốc"}, {"order": 7, "topic": "List và Tuple", "url": "https://txnam.net/wp-content/uploads/txnam/mon-hoc/python-2023/python.2023.05.pdf", "title": "PDF bài 07: List, Tuple và các phép xử lý — nguồn gốc"}, {"order": 8, "topic": "Dictionary và Module", "url": "https://txnam.net/wp-content/uploads/txnam/mon-hoc/python-2023/python.2023.07.pdf", "title": "PDF bài 08: Dictionary, module, package và lambda — nguồn gốc"}, {"order": 9, "topic": "Class và thao tác tệp", "url": "https://www.cit.ctu.edu.vn/~dtnghi/crypto/basic-python3.pdf", "title": "PDF bài 09: Class/Object, hướng đối tượng và vào/ra dữ liệu — nguồn gốc"}]$pdf_json$::jsonb) value
     WHERE (value->>'order')::integer = r.rn;
   IF item IS NULL OR lower(btrim(regexp_replace(r.title,'^\s*[0-9]+\s*[.·:-]*\s*','')))<>lower(btrim(item->>'topic')) THEN
     RAISE EXCEPTION 'Python lesson % title mismatch: %',r.rn,r.title;
   END IF;
   -- Update one legacy V3 source INDEX to an actual original PDF, preserving resource identity.
   SELECT resource_id INTO rid FROM lms.lesson_resources
   WHERE lesson_id=r.lesson_id
     AND (title LIKE 'Slide PDF theo chương – ĐHQG TP.HCM (VEDU-V3)%'
       OR title LIKE 'PDF gốc Python theo bài (VEDU-V5)%')
   ORDER BY CASE WHEN title LIKE 'PDF gốc Python theo bài (VEDU-V5)%' THEN 0 ELSE 1 END, resource_id
   LIMIT 1;
   IF rid IS NOT NULL THEN
      UPDATE lms.lesson_resources
      SET resource_type='PDF', title='PDF gốc Python theo bài (VEDU-V5): '||(item->>'title'),
          resource_url=item->>'url'
      WHERE resource_id=rid AND (resource_type IS DISTINCT FROM 'PDF'
        OR title IS DISTINCT FROM 'PDF gốc Python theo bài (VEDU-V5): '||(item->>'title')
        OR resource_url IS DISTINCT FROM item->>'url');
   ELSE
      SELECT COALESCE(max(display_order),0)+1 INTO ord FROM lms.lesson_resources WHERE lesson_id=r.lesson_id;
      INSERT INTO lms.lesson_resources (lesson_id,resource_type,title,resource_url,display_order)
      VALUES (r.lesson_id,'PDF','PDF gốc Python theo bài (VEDU-V5): '||(item->>'title'),item->>'url',ord);
   END IF;
   -- If an older migration introduced duplicate INDEX links, remove only that obsolete V3 link.
   DELETE FROM lms.lesson_resources WHERE lesson_id=r.lesson_id
     AND resource_type='LINK' AND title LIKE 'Slide PDF theo chương – ĐHQG TP.HCM (VEDU-V3)%';
   IF r.rn=9 THEN
      -- Supplemental original PDF for file I/O, because this lesson also covers classes.
      IF NOT EXISTS (SELECT 1 FROM lms.lesson_resources
         WHERE lesson_id=r.lesson_id AND title='PDF bổ sung Python (VEDU-V5): Đọc/ghi tệp — Trương Xuân Nam') THEN
         SELECT COALESCE(max(display_order),0)+1 INTO ord FROM lms.lesson_resources WHERE lesson_id=r.lesson_id;
         INSERT INTO lms.lesson_resources (lesson_id,resource_type,title,resource_url,display_order)
         VALUES (r.lesson_id,'PDF','PDF bổ sung Python (VEDU-V5): Đọc/ghi tệp — Trương Xuân Nam','https://txnam.net/wp-content/uploads/txnam/Bai%20Giang/CSE204-K62/python-09.pdf',ord);
      END IF;
   END IF;
 END LOOP;
END $python_pdf_v5$;
COMMIT;
