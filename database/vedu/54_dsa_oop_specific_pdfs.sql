\set ON_ERROR_STOP on
BEGIN;
DO $fix$
DECLARE x jsonb; lid bigint; actual_title text; newurl text; n integer:=0;
BEGIN
 IF (SELECT count(*) FROM lms.lessons WHERE course_id=44 AND lesson_order>1 AND is_published AND NOT is_deleted)<>10 THEN
  RAISE EXCEPTION 'DSA expected exactly 10 published main lessons';
 END IF;
 IF (SELECT count(*) FROM lms.lessons WHERE course_id=61 AND lesson_order>1 AND is_published AND NOT is_deleted)<>10 THEN
  RAISE EXCEPTION 'OOP expected exactly 10 published main lessons';
 END IF;
 FOR x IN SELECT value FROM jsonb_array_elements($JSON$[{"course_id": 44, "lesson_id": 129, "lesson_order": 2, "seq": "01", "topic": "Tổng quan về cấu trúc dữ liệu", "pdf": "/course-materials/vedu-dsa-specific/01.pdf"}, {"course_id": 44, "lesson_id": 130, "lesson_order": 3, "seq": "02", "topic": "Phân tích độ phức tạp thuật toán", "pdf": "/course-materials/vedu-dsa-specific/02.pdf"}, {"course_id": 44, "lesson_id": 131, "lesson_order": 4, "seq": "03", "topic": "Đệ quy và điều kiện dừng", "pdf": "/course-materials/vedu-dsa-specific/03.pdf"}, {"course_id": 44, "lesson_id": 132, "lesson_order": 5, "seq": "04", "topic": "Mảng và danh sách tuyến tính", "pdf": "/course-materials/vedu-dsa-specific/04.pdf"}, {"course_id": 44, "lesson_id": 133, "lesson_order": 6, "seq": "05", "topic": "Danh sách liên kết", "pdf": "/course-materials/vedu-dsa-specific/05.pdf"}, {"course_id": 44, "lesson_id": 134, "lesson_order": 7, "seq": "06", "topic": "Ngăn xếp Stack", "pdf": "/course-materials/vedu-dsa-specific/06.pdf"}, {"course_id": 44, "lesson_id": 135, "lesson_order": 8, "seq": "07", "topic": "Hàng đợi Queue", "pdf": "/course-materials/vedu-dsa-specific/07.pdf"}, {"course_id": 44, "lesson_id": 136, "lesson_order": 9, "seq": "08", "topic": "Cây nhị phân và duyệt cây", "pdf": "/course-materials/vedu-dsa-specific/08.pdf"}, {"course_id": 44, "lesson_id": 137, "lesson_order": 10, "seq": "09", "topic": "Tìm kiếm tuyến tính và nhị phân", "pdf": "/course-materials/vedu-dsa-specific/09.pdf"}, {"course_id": 44, "lesson_id": 138, "lesson_order": 11, "seq": "10", "topic": "Thuật toán sắp xếp", "pdf": "/course-materials/vedu-dsa-specific/10.pdf"}, {"course_id": 61, "lesson_id": 272, "lesson_order": 2, "seq": "01", "topic": "Tổng quan lập trình hướng đối tượng với C#", "pdf": "/course-materials/vedu-oop-specific/01.pdf"}, {"course_id": 61, "lesson_id": 273, "lesson_order": 3, "seq": "02", "topic": "Lớp, đối tượng và constructor", "pdf": "/course-materials/vedu-oop-specific/02.pdf"}, {"course_id": 61, "lesson_id": 274, "lesson_order": 4, "seq": "03", "topic": "Thành viên static và phạm vi truy cập", "pdf": "/course-materials/vedu-oop-specific/03.pdf"}, {"course_id": 61, "lesson_id": 275, "lesson_order": 5, "seq": "04", "topic": "Collection và generic trong C#", "pdf": "/course-materials/vedu-oop-specific/04.pdf"}, {"course_id": 61, "lesson_id": 276, "lesson_order": 6, "seq": "05", "topic": "Kế thừa và tái sử dụng", "pdf": "/course-materials/vedu-oop-specific/05.pdf"}, {"course_id": 61, "lesson_id": 277, "lesson_order": 7, "seq": "06", "topic": "Đa hình và virtual/override", "pdf": "/course-materials/vedu-oop-specific/06.pdf"}, {"course_id": 61, "lesson_id": 278, "lesson_order": 8, "seq": "07", "topic": "Interface và lớp trừu tượng", "pdf": "/course-materials/vedu-oop-specific/07.pdf"}, {"course_id": 61, "lesson_id": 279, "lesson_order": 9, "seq": "08", "topic": "Mô hình ba lớp và tách trách nhiệm", "pdf": "/course-materials/vedu-oop-specific/08.pdf"}, {"course_id": 61, "lesson_id": 280, "lesson_order": 10, "seq": "09", "topic": "Nguyên tắc SOLID và thiết kế lớp", "pdf": "/course-materials/vedu-oop-specific/09.pdf"}, {"course_id": 61, "lesson_id": 281, "lesson_order": 11, "seq": "10", "topic": "Design Patterns cơ bản", "pdf": "/course-materials/vedu-oop-specific/10.pdf"}]$JSON$::jsonb) LOOP
  lid:=(x->>'lesson_id')::bigint;newurl:=x->>'pdf';
  SELECT l.title INTO actual_title FROM lms.lessons l
   WHERE l.lesson_id=lid AND l.course_id=(x->>'course_id')::bigint AND l.lesson_order=(x->>'lesson_order')::int
     AND l.is_published AND NOT l.is_deleted;
  IF actual_title IS NULL THEN RAISE EXCEPTION 'Lesson ID/course/order mismatch: %',lid; END IF;
  IF btrim(actual_title) NOT LIKE (x->>'seq')||' ·%' THEN
    RAISE EXCEPTION 'Unexpected lesson numbering id=%, title=%',lid,actual_title;
  END IF;
  RAISE NOTICE 'Validated lesson %: %',lid,actual_title;
  IF NOT EXISTS(SELECT 1 FROM lms.lesson_resources WHERE lesson_id=lid AND resource_type='PDF' AND resource_url=newurl) THEN
   INSERT INTO lms.lesson_resources(lesson_id,resource_type,title,resource_url,display_order)
   VALUES(lid,'PDF','VEDU - PDF riêng theo bài '||(x->>'seq')||' - '||(x->>'topic'),newurl,
    (SELECT COALESCE(MAX(display_order),0)+1 FROM lms.lesson_resources WHERE lesson_id=lid));n:=n+1;
  END IF;
 END LOOP;
 RAISE NOTICE 'Added % DSA/OOP lesson-specific PDFs',n;
END $fix$;
COMMIT;
