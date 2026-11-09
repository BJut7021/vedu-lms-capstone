\set ON_ERROR_STOP on
BEGIN;
DO $fix$
DECLARE x jsonb; lid bigint; newurl text; current_title text; n integer:=0;
BEGIN
  FOR x IN SELECT value FROM jsonb_array_elements($JSON$[{"lesson_id": 233, "lesson_order": 2, "title": "01 · Tạo tài liệu và quản lý phiên bản", "pdf": "/course-materials/vedu-word-specific/01.pdf"}, {"lesson_id": 234, "lesson_order": 3, "title": "02 · Cấu trúc báo cáo bằng Styles", "pdf": "/course-materials/vedu-word-specific/02.pdf"}, {"lesson_id": 235, "lesson_order": 4, "title": "03 · Thực hành: biên bản họp và bảng phân công", "pdf": "/course-materials/vedu-word-specific/03.pdf"}, {"lesson_id": 236, "lesson_order": 5, "title": "04 · Ôn tập: sửa năm lỗi thường gặp", "pdf": "/course-materials/vedu-word-specific/04.pdf"}, {"lesson_id": 237, "lesson_order": 6, "title": "05 · Thực hành có hướng dẫn tiếng Việt", "pdf": "/course-materials/vedu-word-specific/05.pdf"}, {"lesson_id": 238, "lesson_order": 7, "title": "06 · Dự án: hồ sơ đề xuất hoạt động nhóm", "pdf": "/course-materials/vedu-word-specific/06.pdf"}, {"lesson_id": 239, "lesson_order": 8, "title": "07 · Mở rộng: nhận xét và kiểm soát bản sửa", "pdf": "/course-materials/vedu-word-specific/07.pdf"}]$JSON$::jsonb) LOOP
    lid:=(x->>'lesson_id')::bigint; newurl:=x->>'pdf'; current_title:=x->>'title';
    IF NOT EXISTS (SELECT 1 FROM lms.lessons l WHERE l.lesson_id=lid AND l.course_id=56
        AND l.lesson_order=(x->>'lesson_order')::integer AND l.title=current_title AND l.is_published AND NOT l.is_deleted) THEN
      RAISE EXCEPTION 'Word lesson mismatch: %',lid;
    END IF;
    IF NOT EXISTS(SELECT 1 FROM lms.lesson_resources WHERE lesson_id=lid AND resource_type='PDF' AND resource_url=newurl) THEN
       INSERT INTO lms.lesson_resources(lesson_id,resource_type,title,resource_url,display_order)
       VALUES(lid,'PDF','PDF thực hành riêng theo bài - VEDU',newurl,
           (SELECT COALESCE(MAX(display_order),0)+1 FROM lms.lesson_resources WHERE lesson_id=lid));
       n:=n+1;
    END IF;
  END LOOP;
  RAISE NOTICE 'Added % lesson-specific Word PDFs',n;
END $fix$;
UPDATE lms.lesson_resources SET resource_url='https://www.youtube.com/watch?v=GVEtNN_EhIY',title='Hướng dẫn tạo mục lục trong Word bằng Heading (Kiến thức Tin học)'
WHERE lesson_id=234 AND resource_type='VIDEO'
AND resource_url='https://www.youtube.com/watch?v=2e869sCq34w';
UPDATE lms.lesson_resources SET resource_url='https://www.youtube.com/watch?v=fJdt7EM41_8',title='Hướng dẫn sử dụng Track Changes trên Word (Vũ Duy Kiên)'
WHERE lesson_id=239 AND resource_type='VIDEO'
AND resource_url='https://www.youtube.com/watch?v=2e869sCq34w';
COMMIT;
