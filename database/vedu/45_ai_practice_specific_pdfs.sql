\set ON_ERROR_STOP on
BEGIN;
DO $fix$
DECLARE x jsonb; lid bigint; newurl text; n integer:=0;
BEGIN
 FOR x IN SELECT value FROM jsonb_array_elements($JSON$[{"course_id": 53, "lesson_id": 204, "lesson_order": 2, "title": "01 · Python nền tảng", "pdf": "/course-materials/vedu-ai-practice-specific/01.pdf"}, {"course_id": 53, "lesson_id": 205, "lesson_order": 3, "title": "02 · BFS, DFS, UCS và giới hạn sâu", "pdf": "/course-materials/vedu-ai-practice-specific/02.pdf"}, {"course_id": 53, "lesson_id": 206, "lesson_order": 4, "title": "03 · Heuristic, AKT và A*", "pdf": "/course-materials/vedu-ai-practice-specific/03.pdf"}, {"course_id": 53, "lesson_id": 207, "lesson_order": 5, "title": "04 · Leo đồi và thuật toán di truyền", "pdf": "/course-materials/vedu-ai-practice-specific/04.pdf"}, {"course_id": 53, "lesson_id": 208, "lesson_order": 6, "title": "05 · Minimax và alpha-beta", "pdf": "/course-materials/vedu-ai-practice-specific/05.pdf"}, {"course_id": 53, "lesson_id": 209, "lesson_order": 7, "title": "06 · GTS và tô màu đồ thị", "pdf": "/course-materials/vedu-ai-practice-specific/06.pdf"}, {"course_id": 53, "lesson_id": 210, "lesson_order": 8, "title": "07 · Logic mệnh đề, Vương Hạo và Robinson", "pdf": "/course-materials/vedu-ai-practice-specific/07.pdf"}, {"course_id": 53, "lesson_id": 211, "lesson_order": 9, "title": "08 · Luật sinh và mạng ngữ nghĩa", "pdf": "/course-materials/vedu-ai-practice-specific/08.pdf"}, {"course_id": 53, "lesson_id": 212, "lesson_order": 10, "title": "09 · Học máy có giám sát", "pdf": "/course-materials/vedu-ai-practice-specific/09.pdf"}, {"course_id": 53, "lesson_id": 213, "lesson_order": 11, "title": "10 · Học không giám sát và K-means", "pdf": "/course-materials/vedu-ai-practice-specific/10.pdf"}]$JSON$::jsonb) LOOP
  lid:=(x->>'lesson_id')::bigint; newurl:=x->>'pdf';
  IF NOT EXISTS (SELECT 1 FROM lms.lessons l WHERE l.lesson_id=lid
   AND l.course_id=(x->>'course_id')::bigint AND l.lesson_order=(x->>'lesson_order')::int
   AND l.title=x->>'title' AND l.is_published AND NOT l.is_deleted)
  THEN RAISE EXCEPTION 'Lesson mismatch, id=%', lid; END IF;
  IF NOT EXISTS(SELECT 1 FROM lms.lesson_resources WHERE lesson_id=lid
   AND resource_type='PDF' AND resource_url=newurl) THEN
    INSERT INTO lms.lesson_resources(lesson_id,resource_type,title,resource_url,display_order)
    VALUES (lid,'PDF','VEDU - Bài thực hành AI riêng theo nội dung bài',newurl,
    (SELECT COALESCE(MAX(display_order),0)+1 FROM lms.lesson_resources WHERE lesson_id=lid));
    n:=n+1;
  END IF;
 END LOOP;
 RAISE NOTICE 'Added % AI practice lesson-specific PDFs',n;
END $fix$;
COMMIT;
