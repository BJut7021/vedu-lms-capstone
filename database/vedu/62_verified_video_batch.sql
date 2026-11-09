\set ON_ERROR_STOP on
BEGIN;
DO $fix$
DECLARE x jsonb; current_title text; n_insert int:=0; n_convert int:=0; n_verified int; changed int;
BEGIN
 FOR x IN SELECT value FROM jsonb_array_elements($JSON$[{"course_id": 45, "lesson_id": 140, "lesson_order": 2, "lesson_title": "01 · Tổng quan", "mode": "ADD_VIDEO", "resource_id": null, "url": "https://www.youtube.com/watch?v=9SXPnnhvn5o", "resource_title": "Tổng quan các kiến trúc Deep Learning – Việt Nguyễn AI", "evidence": "YouTube title/description"}, {"course_id": 45, "lesson_id": 143, "lesson_order": 5, "lesson_title": "04 · CNN và ResNet", "mode": "ADD_VIDEO", "resource_id": null, "url": "https://www.youtube.com/watch?v=WMC7_kvsrZg", "resource_title": "Các lớp trong Convolutional Neural Network – Việt Nguyễn AI", "evidence": "YouTube title/description; hỗ trợ CNN, chưa chuyên sâu ResNet"}, {"course_id": 47, "lesson_id": 152, "lesson_order": 2, "lesson_title": "01 · Tổng quan kiểm thử", "mode": "ADD_VIDEO", "resource_id": null, "url": "https://www.youtube.com/watch?v=Mbkvcg_haQk", "resource_title": "Giới thiệu tổng quan về testing – NextGen Learning", "evidence": "YouTube title/description"}, {"course_id": 47, "lesson_id": 153, "lesson_order": 3, "lesson_title": "02 · Quy trình và kế hoạch kiểm thử", "mode": "ADD_VIDEO", "resource_id": null, "url": "https://www.youtube.com/watch?v=mSLw0pngyZo", "resource_title": "Quy trình Testing dự án phần mềm – NextGen Learning", "evidence": "YouTube title/description; chưa chuyên sâu kế hoạch"}, {"course_id": 47, "lesson_id": 157, "lesson_order": 7, "lesson_title": "06 · Kiểm thử UI với Selenium IDE", "mode": "ADD_VIDEO", "resource_id": null, "url": "https://www.youtube.com/watch?v=1wdUKOuDQxI", "resource_title": "Hướng dẫn Selenium IDE để làm Automation – Lê Vũ Nguyên", "evidence": "YouTube title/description"}, {"course_id": 47, "lesson_id": 158, "lesson_order": 8, "lesson_title": "07 · Kiểm thử API với Postman", "mode": "ADD_VIDEO", "resource_id": null, "url": "https://www.youtube.com/watch?v=fsWEqTa_MGg", "resource_title": "Hướng dẫn Tester dùng Postman test API – NextGen Learning", "evidence": "YouTube title/description"}, {"course_id": 52, "lesson_id": 200, "lesson_order": 5, "lesson_title": "04 · Autoencoder", "mode": "PROMOTE_LINK", "resource_id": 625, "url": "https://www.youtube.com/watch?v=7MWng0n6ULE", "resource_title": "Autoencoders: lý thuyết và tái tạo hình ảnh", "evidence": "Existing lesson-specific LINK; chưa xác minh playback"}]$JSON$::jsonb) LOOP
  SELECT l.title INTO current_title FROM lms.lessons l WHERE l.lesson_id=(x->>'lesson_id')::bigint
  AND l.course_id=(x->>'course_id')::bigint AND l.lesson_order=(x->>'lesson_order')::int
  AND l.is_published AND NOT l.is_deleted;
  IF current_title IS NULL OR btrim(regexp_replace(current_title,'[[:space:]]+',' ','g')) IS DISTINCT FROM x->>'lesson_title' THEN
   RAISE EXCEPTION 'Lesson mismatch id %: db % expected %',x->>'lesson_id',current_title,x->>'lesson_title';
  END IF;
  IF x->>'mode'='PROMOTE_LINK' THEN
    IF NOT EXISTS (SELECT 1 FROM lms.lesson_resources r WHERE r.resource_id=(x->>'resource_id')::bigint AND r.lesson_id=(x->>'lesson_id')::bigint
    AND r.resource_url=x->>'url' AND r.resource_type IN ('LINK','VIDEO')) THEN
      RAISE EXCEPTION 'Source LINK mismatch lesson % resource %',x->>'lesson_id',x->>'resource_id';
    END IF;
    UPDATE lms.lesson_resources SET resource_type='VIDEO' WHERE resource_id=(x->>'resource_id')::bigint AND lesson_id=(x->>'lesson_id')::bigint
    AND resource_url=x->>'url' AND resource_type='LINK';
    GET DIAGNOSTICS changed = ROW_COUNT; n_convert:=n_convert+changed;
  ELSE
    IF NOT EXISTS (SELECT 1 FROM lms.lesson_resources WHERE lesson_id=(x->>'lesson_id')::bigint AND resource_type='VIDEO')
       AND NOT EXISTS (SELECT 1 FROM lms.lesson_resources WHERE lesson_id=(x->>'lesson_id')::bigint AND resource_url=x->>'url' AND resource_type IN ('LINK','VIDEO')) THEN
     INSERT INTO lms.lesson_resources (lesson_id,resource_type,title,resource_url,display_order)
     VALUES ((x->>'lesson_id')::bigint,'VIDEO',x->>'resource_title',x->>'url',
     (SELECT COALESCE(MAX(display_order),0)+1 FROM lms.lesson_resources WHERE lesson_id=(x->>'lesson_id')::bigint));
     n_insert:=n_insert+1;
    END IF;
  END IF;
  SELECT COUNT(*) INTO n_verified FROM lms.lesson_resources WHERE lesson_id=(x->>'lesson_id')::bigint AND resource_type='VIDEO' AND resource_url=x->>'url';
  IF n_verified <> 1 THEN RAISE EXCEPTION 'VIDEO verification failed for lesson %; found %',x->>'lesson_id',n_verified; END IF;
  RAISE NOTICE 'Verified lesson %: %',x->>'lesson_id',current_title;
 END LOOP;
 RAISE NOTICE 'Added % VIDEO entries, promoted % exact LINK entries',n_insert,n_convert;
END $fix$;
COMMIT;
