\set ON_ERROR_STOP on
BEGIN;
DO $fix$
DECLARE x jsonb; actual text; existing int; n int:=0;
BEGIN
 FOR x IN SELECT value FROM jsonb_array_elements($JSON$[{"course_id": 45, "lesson_id": 141, "lesson_order": 3, "lesson_title": "02 · ANN và lan truyền ngược", "url": "https://www.youtube.com/watch?v=l6YQmOWS2Yk", "resource_title": "Andrew Ng Vietsub - Thuật toán Backpropagation (lan truyền ngược)", "note": "Phụ đề Việt; chính xác phần lan truyền ngược trong ANN"}, {"course_id": 47, "lesson_id": 155, "lesson_order": 5, "lesson_title": "04 · Unit test với NUnit/JUnit", "url": "https://www.youtube.com/watch?v=b7OoE98yj5w", "resource_title": "giáo.làng - Unit Testing with JUnit 4 (phần 1)", "note": "JUnit 4, khớp phần Unit test JUnit, không bao gồm NUnit"}, {"course_id": 49, "lesson_id": 173, "lesson_order": 5, "lesson_title": "04 · MySQL và PDO", "url": "https://www.youtube.com/watch?v=5HMpmXUn-Tw", "resource_title": "Góc làm web - Kết nối MySQL bằng PDO", "note": "Tiếng Việt, demo kết nối PHP MySQL/PDO"}, {"course_id": 53, "lesson_id": 206, "lesson_order": 4, "lesson_title": "03 · Heuristic, AKT và A*", "url": "https://www.youtube.com/watch?v=aPYqcfIVnzo", "resource_title": "Học trực tuyến OLM - Tìm kiếm heuristic phần 3, A*", "note": "Tiếng Việt, khớp A*/heuristic; không giải thích toàn bộ AKT"}, {"course_id": 52, "lesson_id": 202, "lesson_order": 7, "lesson_title": "06 · LSTM", "url": "https://www.youtube.com/watch?v=GJiEBmhRDQo", "resource_title": "Mì AI - Thực hành nhận diện ngôn ngữ với LSTM", "note": "Tiếng Việt, thực hành LSTM với bài toán nhận diện ngôn ngữ"}]$JSON$::jsonb) LOOP
  SELECT l.title INTO actual FROM lms.lessons l WHERE l.lesson_id=(x->>'lesson_id')::bigint
    AND l.course_id=(x->>'course_id')::bigint AND l.lesson_order=(x->>'lesson_order')::int
    AND l.is_published AND NOT l.is_deleted;
  IF actual IS NULL OR btrim(regexp_replace(actual,'[[:space:]]+',' ','g')) IS DISTINCT FROM x->>'lesson_title' THEN
    RAISE EXCEPTION 'Lesson mismatch id=%, db=%, expected=%', x->>'lesson_id',actual,x->>'lesson_title';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM lms.lesson_resources r WHERE r.lesson_id=(x->>'lesson_id')::bigint
      AND r.resource_type='VIDEO' AND r.resource_url=x->>'url') THEN
    IF EXISTS (SELECT 1 FROM lms.lesson_resources r WHERE r.lesson_id=(x->>'lesson_id')::bigint
      AND r.resource_type='LINK' AND r.resource_url=x->>'url') THEN
      UPDATE lms.lesson_resources SET resource_type='VIDEO' WHERE lesson_id=(x->>'lesson_id')::bigint
       AND resource_type='LINK' AND resource_url=x->>'url';
    ELSE
      INSERT INTO lms.lesson_resources(lesson_id,resource_type,title,resource_url,display_order)
      VALUES((x->>'lesson_id')::bigint,'VIDEO',x->>'resource_title',x->>'url',
       (SELECT COALESCE(MAX(display_order),0)+1 FROM lms.lesson_resources WHERE lesson_id=(x->>'lesson_id')::bigint));
    END IF;
    n:=n+1;
  END IF;
  SELECT COUNT(*) INTO existing FROM lms.lesson_resources WHERE lesson_id=(x->>'lesson_id')::bigint
    AND resource_type='VIDEO' AND resource_url=x->>'url';
  IF existing<>1 THEN RAISE EXCEPTION 'Expected one video, found % for lesson %',existing,x->>'lesson_id'; END IF;
  RAISE NOTICE 'Validated VIDEO for lesson %: %', x->>'lesson_id',actual;
 END LOOP;
 RAISE NOTICE 'Added/promoted % target VIDEO rows', n;
END $fix$;
COMMIT;
