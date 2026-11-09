\set ON_ERROR_STOP on
BEGIN;
DO $fix$
DECLARE x jsonb; lid bigint; newurl text; n integer:=0;
BEGIN
 FOR x IN SELECT value FROM jsonb_array_elements($JSON$[{"course_id": 59, "lesson_id": 257, "lesson_order": 2, "title": "01 · Tổ chức tệp và bản sao lưu", "pdf": "/course-materials/vedu-digital-files-specific/01.pdf"}, {"course_id": 59, "lesson_id": 258, "lesson_order": 3, "title": "02 · Email công việc và nhận diện phishing", "pdf": "/course-materials/vedu-digital-files-specific/02.pdf"}, {"course_id": 59, "lesson_id": 259, "lesson_order": 4, "title": "03 · Thực hành: ma trận quyền chia sẻ", "pdf": "/course-materials/vedu-digital-files-specific/03.pdf"}, {"course_id": 59, "lesson_id": 260, "lesson_order": 5, "title": "04 · Ôn tập: phân loại năm tình huống số", "pdf": "/course-materials/vedu-digital-files-specific/04.pdf"}, {"course_id": 59, "lesson_id": 261, "lesson_order": 6, "title": "05 · Tình huống: link tài liệu bị gửi nhầm", "pdf": "/course-materials/vedu-digital-files-specific/05.pdf"}, {"course_id": 59, "lesson_id": 262, "lesson_order": 7, "title": "06 · Dự án: bộ quy tắc làm việc số cho nhóm", "pdf": "/course-materials/vedu-digital-files-specific/06.pdf"}, {"course_id": 59, "lesson_id": 263, "lesson_order": 8, "title": "07 · Mở rộng: tối thiểu hóa dữ liệu và quyền riêng tư", "pdf": "/course-materials/vedu-digital-files-specific/07.pdf"}, {"course_id": 60, "lesson_id": 265, "lesson_order": 2, "title": "01 · Tìm kiếm thông tin có mục tiêu", "pdf": "/course-materials/vedu-digital-ai-specific/01.pdf"}, {"course_id": 60, "lesson_id": 266, "lesson_order": 3, "title": "02 · Đánh giá nguồn và thời điểm công bố", "pdf": "/course-materials/vedu-digital-ai-specific/02.pdf"}, {"course_id": 60, "lesson_id": 267, "lesson_order": 4, "title": "03 · Trích dẫn và sử dụng hình ảnh", "pdf": "/course-materials/vedu-digital-ai-specific/03.pdf"}, {"course_id": 60, "lesson_id": 268, "lesson_order": 5, "title": "04 · Đọc bảng dữ liệu và biểu đồ", "pdf": "/course-materials/vedu-digital-ai-specific/04.pdf"}, {"course_id": 60, "lesson_id": 269, "lesson_order": 6, "title": "05 · Sử dụng công cụ AI có kiểm chứng", "pdf": "/course-materials/vedu-digital-ai-specific/05.pdf"}, {"course_id": 60, "lesson_id": 270, "lesson_order": 7, "title": "06 · Bài thực hành: hồ sơ thông tin đáng tin cậy", "pdf": "/course-materials/vedu-digital-ai-specific/06.pdf"}]$JSON$::jsonb)
 LOOP
  lid:=(x->>'lesson_id')::bigint; newurl:=x->>'pdf';
  IF NOT EXISTS (
   SELECT 1 FROM lms.lessons l WHERE l.lesson_id=lid
    AND l.course_id=(x->>'course_id')::bigint
    AND l.lesson_order=(x->>'lesson_order')::integer
    AND l.title=x->>'title' AND l.is_published AND NOT l.is_deleted
  ) THEN
    RAISE EXCEPTION 'Lesson mismatch (safe stop), id=%', lid;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM lms.lesson_resources
    WHERE lesson_id=lid AND resource_type='PDF' AND resource_url=newurl) THEN
    INSERT INTO lms.lesson_resources(lesson_id,resource_type,title,resource_url,display_order)
    VALUES(lid,'PDF','VEDU - Tài liệu thực hành riêng theo bài',newurl,
      (SELECT COALESCE(MAX(display_order),0)+1 FROM lms.lesson_resources WHERE lesson_id=lid));
    n:=n+1;
  END IF;
 END LOOP;
 RAISE NOTICE 'Added % new lesson-specific PDF resource links',n;
END $fix$;
COMMIT;
