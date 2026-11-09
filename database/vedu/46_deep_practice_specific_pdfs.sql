\set ON_ERROR_STOP on
BEGIN;
DO $fix$
DECLARE x jsonb; lid bigint; newurl text; n integer:=0; match_count integer; actual_title text;
BEGIN
 FOR x IN SELECT value FROM jsonb_array_elements($JSON$[{"course_id": 52, "lesson_id": 197, "lesson_order": 2, "title": "01 · Pandas và TensorFlow", "pdf": "/course-materials/vedu-deep-practice-specific/01.pdf"}, {"course_id": 52, "lesson_id": 198, "lesson_order": 3, "title": "02 · ANN", "pdf": "/course-materials/vedu-deep-practice-specific/02.pdf"}, {"course_id": 52, "lesson_id": 199, "lesson_order": 4, "title": "03 · CNN", "pdf": "/course-materials/vedu-deep-practice-specific/03.pdf"}, {"course_id": 52, "lesson_id": 200, "lesson_order": 5, "title": "04 · Autoencoder", "pdf": "/course-materials/vedu-deep-practice-specific/04.pdf"}, {"course_id": 52, "lesson_id": 201, "lesson_order": 6, "title": "05 · RNN", "pdf": "/course-materials/vedu-deep-practice-specific/05.pdf"}, {"course_id": 52, "lesson_id": 202, "lesson_order": 7, "title": "06 · LSTM", "pdf": "/course-materials/vedu-deep-practice-specific/06.pdf"}]$JSON$::jsonb) LOOP
  lid:=(x->>'lesson_id')::bigint; newurl:=x->>'pdf';
  IF NOT EXISTS (SELECT 1 FROM lms.lessons l WHERE l.lesson_id=lid
   AND l.course_id=(x->>'course_id')::bigint AND l.lesson_order=(x->>'lesson_order')::int
   AND l.is_published AND NOT l.is_deleted)
  THEN RAISE EXCEPTION 'Lesson ID/course/order mismatch or unpublished, id=%',lid; END IF;
  SELECT l.title INTO actual_title FROM lms.lessons l WHERE l.lesson_id=lid;
  IF NOT (CASE (x->>'lesson_order')::int
    WHEN 2 THEN actual_title ~* '(Pandas|TensorFlow)'
    WHEN 3 THEN actual_title ~* 'ANN'
    WHEN 4 THEN actual_title ~* 'CNN'
    WHEN 5 THEN actual_title ~* 'Autoencoder'
    WHEN 6 THEN actual_title ~* 'RNN'
    WHEN 7 THEN actual_title ~* 'LSTM'
    ELSE false END) THEN
     RAISE EXCEPTION 'Lesson topic mismatch at id=%; actual title=%', lid, actual_title;
  END IF;
  RAISE NOTICE 'Validated lesson %: %', lid, actual_title;
  IF NOT EXISTS (SELECT 1 FROM lms.lesson_resources WHERE lesson_id=lid AND resource_type='PDF' AND resource_url=newurl) THEN
   INSERT INTO lms.lesson_resources(lesson_id,resource_type,title,resource_url,display_order)
   VALUES(lid,'PDF','VEDU - Phiếu thực hành Học sâu theo bài',newurl,
    (SELECT COALESCE(MAX(display_order),0)+1 FROM lms.lesson_resources WHERE lesson_id=lid));
   n:=n+1;
  END IF;
 END LOOP;
 RAISE NOTICE 'Added % deep practice lesson-specific PDFs',n;
END $fix$;
COMMIT;
