\set ON_ERROR_STOP on
BEGIN;
DO $fix$
DECLARE x jsonb; lid bigint; newurl text; n integer:=0;
BEGIN
 FOR x IN SELECT value FROM jsonb_array_elements($JSON$[{"course_id": 55, "lesson_id": 226, "lesson_order": 2, "title": "01 · Khảo sát và mô hình nghiệp vụ", "pdf": "/course-materials/vedu-sad-practice/01.pdf"}, {"course_id": 55, "lesson_id": 227, "lesson_order": 3, "title": "02 · Đối tượng nghiệp vụ, tuần tự và cộng tác", "pdf": "/course-materials/vedu-sad-practice/02.pdf"}, {"course_id": 55, "lesson_id": 228, "lesson_order": 4, "title": "03 · Use case hệ thống và đặc tả", "pdf": "/course-materials/vedu-sad-practice/03.pdf"}, {"course_id": 55, "lesson_id": 229, "lesson_order": 5, "title": "04 · Class diagram mức phân tích", "pdf": "/course-materials/vedu-sad-practice/04.pdf"}, {"course_id": 55, "lesson_id": 230, "lesson_order": 6, "title": "05 · Tinh chế lớp và thiết kế dữ liệu", "pdf": "/course-materials/vedu-sad-practice/05.pdf"}, {"course_id": 55, "lesson_id": 231, "lesson_order": 7, "title": "06 · Thiết kế chức năng ba tầng và bàn giao", "pdf": "/course-materials/vedu-sad-practice/06.pdf"}, {"course_id": 62, "lesson_id": 283, "lesson_order": 2, "title": "01 · Tổng quan về hệ thống thông tin", "pdf": "/course-materials/vedu-sad-theory/01.pdf"}, {"course_id": 62, "lesson_id": 284, "lesson_order": 3, "title": "02 · Xác định yêu cầu", "pdf": "/course-materials/vedu-sad-theory/02.pdf"}, {"course_id": 62, "lesson_id": 285, "lesson_order": 4, "title": "03 · Mô hình hóa nghiệp vụ", "pdf": "/course-materials/vedu-sad-theory/03.pdf"}, {"course_id": 62, "lesson_id": 286, "lesson_order": 5, "title": "04 · Mô hình hóa chức năng", "pdf": "/course-materials/vedu-sad-theory/04.pdf"}, {"course_id": 62, "lesson_id": 287, "lesson_order": 6, "title": "05 · Mô hình hóa cấu trúc", "pdf": "/course-materials/vedu-sad-theory/05.pdf"}, {"course_id": 62, "lesson_id": 288, "lesson_order": 7, "title": "06 · Thiết kế lớp và dữ liệu", "pdf": "/course-materials/vedu-sad-theory/06.pdf"}, {"course_id": 62, "lesson_id": 289, "lesson_order": 8, "title": "07 · Thiết kế chức năng hệ thống", "pdf": "/course-materials/vedu-sad-theory/07.pdf"}]$JSON$::jsonb)
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
 RAISE NOTICE 'Added % system analysis lesson-specific PDF links',n;
END $fix$;
COMMIT;
