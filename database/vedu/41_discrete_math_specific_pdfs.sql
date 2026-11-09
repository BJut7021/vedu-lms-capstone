\set ON_ERROR_STOP on
BEGIN;
DO $fix$
DECLARE x jsonb; lid bigint; newurl text; n integer:=0;
BEGIN
 FOR x IN SELECT value FROM jsonb_array_elements($JSON$[{"course_id": 63, "lesson_id": 291, "lesson_order": 2, "title": "01 · Tổng quan về đồ thị", "pdf": "/course-materials/vedu-discrete-specific/01.pdf"}, {"course_id": 63, "lesson_id": 292, "lesson_order": 3, "title": "02 · Biểu diễn đồ thị", "pdf": "/course-materials/vedu-discrete-specific/02.pdf"}, {"course_id": 63, "lesson_id": 293, "lesson_order": 4, "title": "03 · Các bài toán về đồ thị (phần 1)", "pdf": "/course-materials/vedu-discrete-specific/03.pdf"}, {"course_id": 63, "lesson_id": 294, "lesson_order": 5, "title": "04 · Các bài toán về đồ thị (phần 2)", "pdf": "/course-materials/vedu-discrete-specific/04.pdf"}, {"course_id": 63, "lesson_id": 295, "lesson_order": 6, "title": "05 · Bài toán tìm đường đi ngắn nhất", "pdf": "/course-materials/vedu-discrete-specific/05.pdf"}, {"course_id": 63, "lesson_id": 296, "lesson_order": 7, "title": "06 · Bài toán tìm cây khung nhỏ nhất", "pdf": "/course-materials/vedu-discrete-specific/06.pdf"}, {"course_id": 63, "lesson_id": 297, "lesson_order": 8, "title": "07 · Logic học – Mệnh đề và dạng mệnh đề", "pdf": "/course-materials/vedu-discrete-specific/07.pdf"}, {"course_id": 63, "lesson_id": 298, "lesson_order": 9, "title": "08 · Logic học – Các luật suy diễn", "pdf": "/course-materials/vedu-discrete-specific/08.pdf"}, {"course_id": 63, "lesson_id": 299, "lesson_order": 10, "title": "09 · Logic học – Vị từ", "pdf": "/course-materials/vedu-discrete-specific/09.pdf"}, {"course_id": 63, "lesson_id": 300, "lesson_order": 11, "title": "10 · Phương pháp đếm – Tập hợp – Ánh xạ", "pdf": "/course-materials/vedu-discrete-specific/10.pdf"}, {"course_id": 63, "lesson_id": 301, "lesson_order": 12, "title": "11 · Phương pháp đếm – Phép đếm – Giải tích tổ hợp", "pdf": "/course-materials/vedu-discrete-specific/11.pdf"}, {"course_id": 63, "lesson_id": 302, "lesson_order": 13, "title": "12 · Phương pháp đếm", "pdf": "/course-materials/vedu-discrete-specific/12.pdf"}, {"course_id": 63, "lesson_id": 303, "lesson_order": 14, "title": "13 · Quan hệ (phần 1)", "pdf": "/course-materials/vedu-discrete-specific/13.pdf"}, {"course_id": 63, "lesson_id": 304, "lesson_order": 15, "title": "14 · Quan hệ (phần 2)", "pdf": "/course-materials/vedu-discrete-specific/14.pdf"}]$JSON$::jsonb)
 LOOP
  lid:=(x->>'lesson_id')::bigint; newurl:=x->>'pdf';
  IF NOT EXISTS (
   SELECT 1 FROM lms.lessons l WHERE l.lesson_id=lid
    AND l.course_id=(x->>'course_id')::bigint
    AND l.lesson_order=(x->>'lesson_order')::integer
    AND l.title=x->>'title' AND l.is_published AND NOT l.is_deleted
  ) THEN
    RAISE EXCEPTION 'Lesson mismatch (safe stop), lesson id=%', lid;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM lms.lesson_resources WHERE lesson_id=lid
    AND resource_type='PDF' AND resource_url=newurl) THEN
    INSERT INTO lms.lesson_resources(lesson_id,resource_type,title,resource_url,display_order)
    VALUES(lid,'PDF','VEDU - Tài liệu riêng theo bài học',newurl,
      (SELECT COALESCE(MAX(display_order),0)+1 FROM lms.lesson_resources WHERE lesson_id=lid));
    n:=n+1;
  END IF;
 END LOOP;
 RAISE NOTICE 'Added % discrete mathematics lesson-specific PDF links',n;
END $fix$;
COMMIT;
