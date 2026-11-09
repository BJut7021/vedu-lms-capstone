\set ON_ERROR_STOP on
BEGIN;
DO $fix$
DECLARE x jsonb; lid bigint; newurl text; n integer:=0;
BEGIN
 FOR x IN SELECT value FROM jsonb_array_elements($JSON$[{"course_id": 64, "lesson_id": 306, "lesson_order": 2, "title": "01 · Tổng quan về mạng máy tính", "pdf": "/course-materials/vedu-network-specific/01.pdf"}, {"course_id": 64, "lesson_id": 307, "lesson_order": 3, "title": "02 · Mô hình OSI và giao thức truyền thông", "pdf": "/course-materials/vedu-network-specific/02.pdf"}, {"course_id": 64, "lesson_id": 308, "lesson_order": 4, "title": "03 · Địa chỉ IP", "pdf": "/course-materials/vedu-network-specific/03.pdf"}, {"course_id": 64, "lesson_id": 309, "lesson_order": 5, "title": "04 · VLSM và Subnetting", "pdf": "/course-materials/vedu-network-specific/04.pdf"}, {"course_id": 64, "lesson_id": 310, "lesson_order": 6, "title": "05 · Tầng vật lý – Physical", "pdf": "/course-materials/vedu-network-specific/05.pdf"}, {"course_id": 64, "lesson_id": 311, "lesson_order": 7, "title": "06 · Ethernet và Switching", "pdf": "/course-materials/vedu-network-specific/06.pdf"}, {"course_id": 64, "lesson_id": 312, "lesson_order": 8, "title": "07 · Tầng mạng và giao thức IP", "pdf": "/course-materials/vedu-network-specific/07.pdf"}, {"course_id": 64, "lesson_id": 313, "lesson_order": 9, "title": "08 · Tầng vận chuyển – TCP/UDP", "pdf": "/course-materials/vedu-network-specific/08.pdf"}, {"course_id": 64, "lesson_id": 314, "lesson_order": 10, "title": "09 · Tầng ứng dụng", "pdf": "/course-materials/vedu-network-specific/09.pdf"}, {"course_id": 64, "lesson_id": 315, "lesson_order": 11, "title": "10 · Xây dựng hệ thống mạng cơ bản", "pdf": "/course-materials/vedu-network-specific/10.pdf"}]$JSON$::jsonb)
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
    VALUES(lid,'PDF','VEDU - PDF Mạng máy tính theo bài',newurl,
      (SELECT COALESCE(MAX(display_order),0)+1 FROM lms.lesson_resources WHERE lesson_id=lid));
    n:=n+1;
  END IF;
 END LOOP;
 RAISE NOTICE 'Added % network lesson-specific PDF links',n;
END $fix$;
COMMIT;
