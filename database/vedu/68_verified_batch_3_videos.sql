\set ON_ERROR_STOP on
BEGIN;
DO $fix$
DECLARE x jsonb; actual text; n int:=0; existing int;
BEGIN
 FOR x IN SELECT value FROM jsonb_array_elements($JSON$[{"course_id": 45, "lesson_id": 142, "lesson_order": 4, "lesson_title": "03 · Huấn luyện mạng nơron", "url": "https://www.youtube.com/watch?v=-E-s6QYy-Mc", "resource_title": "CodeXplore - Deep Learning TensorFlow: loss, optimizer, train và evaluate", "note": "Tiếng Việt; minh họa train ANN bằng TensorFlow/Fashion MNIST, loss/optimizer/epoch; không bao trùm toàn bộ lý thuyết"}, {"course_id": 49, "lesson_id": 177, "lesson_order": 9, "lesson_title": "08 · Migration, Eloquent và quan hệ", "url": "https://www.youtube.com/watch?v=j98KcrFQM7E", "resource_title": "Tung Phan Thanh - Laravel Eloquent ORM & Relationships (tiếng Việt)", "note": "Tiếng Việt; minh họa quan hệ Eloquent; chưa bao phủ Laravel migrations"}, {"course_id": 52, "lesson_id": 199, "lesson_order": 4, "lesson_title": "03 · CNN", "url": "https://www.youtube.com/watch?v=IpbSvrXuq8E", "resource_title": "HCMUT ML & IoT Lab - Convolutional Neural Network 01: Introduction", "note": "Nguồn học thuật HCMUT, giới thiệu CNN; ngôn ngữ/khả năng nhúng cần kiểm tra trên web thực tế"}]$JSON$::jsonb) LOOP
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
  IF existing<>1 THEN RAISE EXCEPTION 'Expected one VIDEO, found % for lesson %',existing,x->>'lesson_id'; END IF;
  RAISE NOTICE 'Validated VIDEO lesson %: %',x->>'lesson_id',actual;
 END LOOP;
 RAISE NOTICE 'Added/promoted % target VIDEO rows',n;
END $fix$;
COMMIT;
