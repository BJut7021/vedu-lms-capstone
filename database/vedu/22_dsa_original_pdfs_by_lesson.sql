\set ON_ERROR_STOP on
BEGIN;
DO $dsa_pdf_v4$
DECLARE
  cid bigint;
  intro_id bigint;
  lesson_n integer;
  r record;
  meta jsonb;
  ord integer;
  old_id bigint;
  old_text text := 'vedu-file:6aa1c15f-3864-6cbf-64b0-3e317fe45b70.pdf';
  workbook_text text := 'vedu-file:e873cea6-8246-f931-f0a9-6f34231a3d7c.pdf';
  label_text text;
BEGIN
  SELECT course_id INTO cid FROM lms.curated_courses WHERE course_key='dsa';
  IF cid IS NULL THEN RAISE EXCEPTION 'DSA course not found'; END IF;
  SELECT l.lesson_id INTO intro_id FROM lms.lessons l
  JOIN lms.course_sections s ON s.section_id=l.section_id
  WHERE l.course_id=cid AND s.module_key='intro' AND l.is_published AND NOT l.is_deleted
  ORDER BY l.lesson_order,l.lesson_id LIMIT 1;
  IF intro_id IS NULL THEN RAISE EXCEPTION 'DSA introduction missing'; END IF;
  SELECT count(*) INTO lesson_n FROM lms.lessons l
  JOIN lms.course_sections s ON s.section_id=l.section_id
  WHERE l.course_id=cid AND s.module_key<>'intro' AND l.is_published AND NOT l.is_deleted;
  IF lesson_n<>10 THEN RAISE EXCEPTION 'DSA expected 10 lessons, got %',lesson_n; END IF;
  -- Retain the original common textbook and workbook on the introduction.
  IF NOT EXISTS (SELECT 1 FROM lms.lesson_resources WHERE lesson_id=intro_id AND resource_type='PDF' AND resource_url=old_text)
     OR NOT EXISTS (SELECT 1 FROM lms.lesson_resources WHERE lesson_id=intro_id AND resource_type='PDF' AND resource_url=workbook_text) THEN
    RAISE EXCEPTION 'DSA original PDFs missing from intro: do not alter links';
  END IF;
  FOR r IN
    SELECT l.lesson_id,l.title,row_number() OVER(ORDER BY l.lesson_order,l.lesson_id) AS rn
    FROM lms.lessons l JOIN lms.course_sections s ON s.section_id=l.section_id
    WHERE l.course_id=cid AND s.module_key<>'intro' AND l.is_published AND NOT l.is_deleted
  LOOP
    SELECT value INTO meta FROM jsonb_array_elements($sources$[{"order": 1, "topic": "Tổng quan cấu trúc dữ liệu", "url": "https://users.soict.hust.edu.vn/trungtt/uploads/slides/PT05_CauTrucDuLieu.pdf", "source": "Trịnh Thành Trung - ĐHBK Hà Nội"}, {"order": 2, "topic": "Phân tích độ phức tạp", "url": "https://elib.vnuf.edu.vn/bitstream/123456789/8260/1/BG%20Toan%20roi%20rac.pdf", "source": "Đại học Lâm nghiệp - Bài giảng Toán rời rạc (phần Big-O)"}, {"order": 3, "topic": "Đệ quy", "url": "https://users.soict.hust.edu.vn/phuongnh/tindc/Phan2_GiaiQuyetBaiToan_Chuong2_ThuatToan.pdf#page=5", "source": "Nguyễn Hồng Phương - ĐHBK Hà Nội (phần đệ quy)"}, {"order": 4, "topic": "Mảng và danh sách tuyến tính", "url": "https://www.mica.edu.vn/perso/Nguyen-Viet-Tung/KTLT/slide/07.%20C%20-%20Data%20Structures.pdf", "source": "Đào Trung Kiên - ĐHBK Hà Nội"}, {"order": 5, "topic": "Danh sách liên kết", "url": "https://dse.vnua.edu.vn/ncthang/pth02003/SlidePDF/Chuong03.pdf", "source": "Ngô Công Thắng - Học viện Nông nghiệp Việt Nam"}, {"order": 6, "topic": "Ngăn xếp Stack", "url": "https://users.soict.hust.edu.vn/trungtt/uploads/slides/PT05_CauTrucDuLieu.pdf", "source": "Trịnh Thành Trung - ĐHBK Hà Nội (phần Stack)"}, {"order": 7, "topic": "Hàng đợi Queue", "url": "https://dse.vnua.edu.vn/ncthang/pth02003/SlidePDF/Chuong03.pdf", "source": "Ngô Công Thắng - Học viện Nông nghiệp Việt Nam (ứng dụng Queue)"}, {"order": 8, "topic": "Cây nhị phân", "url": "https://dse.vnua.edu.vn/cnpm/pth02004/SlidePDF/Chuong01_Cau-truc-du-lieu-Cay.pdf", "source": "Ngô Công Thắng - Học viện Nông nghiệp Việt Nam"}, {"order": 9, "topic": "Tìm kiếm", "url": "https://users.soict.hust.edu.vn/trungtt/uploads/slides/KTLT_Bai03.pdf", "source": "Trịnh Thành Trung - ĐHBK Hà Nội (tìm kiếm)"}, {"order": 10, "topic": "Sắp xếp", "url": "https://users.soict.hust.edu.vn/trungtt/uploads/slides/KTLT_Bai03.pdf", "source": "Trịnh Thành Trung - ĐHBK Hà Nội (sắp xếp)"}]$sources$::jsonb) value
    WHERE (value->>'order')::int=r.rn;
    IF meta IS NULL THEN RAISE EXCEPTION 'DSA PDF mapping missing for %',r.rn; END IF;
    label_text := 'PDF bai '||lpad(r.rn::text,2,'0')||': '||(meta->>'topic')||' - '||(meta->>'source');
    -- Preserve existing link identity on re-runs, otherwise add a PDF resource.
    SELECT resource_id INTO old_id FROM lms.lesson_resources
    WHERE lesson_id=r.lesson_id AND title LIKE 'PDF DSA theo bai (VEDU-V4): %'
    ORDER BY resource_id LIMIT 1;
    IF old_id IS NOT NULL THEN
      UPDATE lms.lesson_resources
      SET resource_type='PDF', title='PDF DSA theo bai (VEDU-V4): '||label_text,
          resource_url=meta->>'url'
      WHERE resource_id=old_id AND (resource_type IS DISTINCT FROM 'PDF' OR
            title IS DISTINCT FROM 'PDF DSA theo bai (VEDU-V4): '||label_text OR
            resource_url IS DISTINCT FROM meta->>'url');
    ELSE
      SELECT coalesce(max(display_order),0)+1 INTO ord FROM lms.lesson_resources WHERE lesson_id=r.lesson_id;
      INSERT INTO lms.lesson_resources(lesson_id,resource_type,title,resource_url,display_order)
      VALUES(r.lesson_id,'PDF','PDF DSA theo bai (VEDU-V4): '||label_text,meta->>'url',ord);
    END IF;
  END LOOP;
  -- Verify all ten topic-specific resources before suppressing only two known duplicate links.
  IF (SELECT count(*) FROM lms.lesson_resources lr
    JOIN lms.lessons l ON l.lesson_id=lr.lesson_id
    JOIN lms.course_sections s ON s.section_id=l.section_id
    WHERE l.course_id=cid AND s.module_key<>'intro'
      AND lr.resource_type='PDF' AND lr.title LIKE 'PDF DSA theo bai (VEDU-V4): %'
      AND lr.resource_url LIKE 'https://%')<>10 THEN
    RAISE EXCEPTION 'DSA topic PDF verification failed; rollback';
  END IF;
  UPDATE lms.lesson_resources SET title='Giao trinh tham khao chung: Do Xuan Loi'
  WHERE lesson_id=intro_id AND resource_type='PDF' AND resource_url=old_text;
  UPDATE lms.lesson_resources SET title='So tu hoc va bai tap tham khao chung DSA'
  WHERE lesson_id=intro_id AND resource_type='PDF' AND resource_url=workbook_text;
  DELETE FROM lms.lesson_resources lr USING lms.lessons l,lms.course_sections s
  WHERE lr.lesson_id=l.lesson_id AND l.section_id=s.section_id AND l.course_id=cid
    AND s.module_key<>'intro' AND lr.resource_type='PDF'
    AND lr.resource_url IN(old_text,workbook_text);
  RAISE NOTICE 'DSA: 10 topic PDF links, shared originals retained in intro';
END $dsa_pdf_v4$;
COMMIT;
