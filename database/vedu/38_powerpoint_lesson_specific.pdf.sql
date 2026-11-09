\set ON_ERROR_STOP on
BEGIN;
DO $fix$
DECLARE x jsonb; lid bigint; newurl text; n integer:=0;
BEGIN
 FOR x IN SELECT value FROM jsonb_array_elements($JSON$[{"lesson_id": 249, "lesson_order": 2, "title": "01 · Thông điệp và cấu trúc câu chuyện", "pdf": "/course-materials/vedu-powerpoint-specific/01.pdf"}, {"lesson_id": 250, "lesson_order": 3, "title": "02 · Bố cục, tương phản và nguồn hình ảnh", "pdf": "/course-materials/vedu-powerpoint-specific/02.pdf"}, {"lesson_id": 251, "lesson_order": 4, "title": "03 · Thực hành: biến bảng số thành thông điệp", "pdf": "/course-materials/vedu-powerpoint-specific/03.pdf"}, {"lesson_id": 252, "lesson_order": 5, "title": "04 · Ôn tập: giản lược slide quá tải", "pdf": "/course-materials/vedu-powerpoint-specific/04.pdf"}, {"lesson_id": 253, "lesson_order": 6, "title": "05 · Thực hành có hướng dẫn tiếng Việt", "pdf": "/course-materials/vedu-powerpoint-specific/05.pdf"}, {"lesson_id": 254, "lesson_order": 7, "title": "06 · Dự án: pitch đề xuất trong 300 giây", "pdf": "/course-materials/vedu-powerpoint-specific/06.pdf"}, {"lesson_id": 255, "lesson_order": 8, "title": "07 · Mở rộng: khả năng tiếp cận và bản bàn giao", "pdf": "/course-materials/vedu-powerpoint-specific/07.pdf"}]$JSON$::jsonb) LOOP
   lid:=(x->>'lesson_id')::bigint;newurl:=x->>'pdf';
   IF NOT EXISTS(SELECT 1 FROM lms.lessons l WHERE l.lesson_id=lid AND l.course_id=58
      AND l.lesson_order=(x->>'lesson_order')::integer AND l.title=(x->>'title')
      AND l.is_published AND NOT l.is_deleted) THEN
     RAISE EXCEPTION 'PowerPoint lesson mismatch: %',lid;
   END IF;
   IF NOT EXISTS(SELECT 1 FROM lms.lesson_resources WHERE lesson_id=lid AND resource_type='PDF' AND resource_url=newurl) THEN
     INSERT INTO lms.lesson_resources(lesson_id,resource_type,title,resource_url,display_order)
     VALUES(lid,'PDF','VEDU - PDF thực hành theo đúng bài PowerPoint',newurl,
       (SELECT COALESCE(MAX(display_order),0)+1 FROM lms.lesson_resources WHERE lesson_id=lid));
     n:=n+1;
   END IF;
 END LOOP;
 RAISE NOTICE 'Added % lesson-specific PowerPoint PDFs',n;
END $fix$;
COMMIT;
