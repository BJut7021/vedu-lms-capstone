\set ON_ERROR_STOP on
BEGIN;
CREATE TEMP TABLE vedu_restore81(lesson_id bigint, title text, resource_url text) ON COMMIT DROP;
INSERT INTO vedu_restore81 VALUES
 (272,'Chương 00 — Tổng quan C#','vedu-file:de591cca-3b7f-6899-1ae1-55d5e8692323.pdf'),
 (272,'Chương 01 — Phương pháp lập trình hướng đối tượng','vedu-file:ea7a97b6-dae5-5a0b-90e2-67b145c8ba50.pdf'),
 (273,'Chương 02 — Lớp và đối tượng','vedu-file:eff0c0bb-211d-c006-e37e-36787a1cd2e0.pdf'),
 (274,'Chương 02 — Lớp và đối tượng','vedu-file:eff0c0bb-211d-c006-e37e-36787a1cd2e0.pdf'),
 (275,'Chương 02 — Lớp và đối tượng','vedu-file:eff0c0bb-211d-c006-e37e-36787a1cd2e0.pdf'),
 (276,'Chương 03 — Kế thừa và đa hình','vedu-file:daca8dde-125e-6ffe-ded1-aa6d1f0e0fae.pdf'),
 (277,'Chương 03 — Kế thừa và đa hình','vedu-file:daca8dde-125e-6ffe-ded1-aa6d1f0e0fae.pdf'),
 (278,'Chương 03 — Kế thừa và đa hình','vedu-file:daca8dde-125e-6ffe-ded1-aa6d1f0e0fae.pdf'),
 (279,'Chương 04 — Mô hình ba lớp','vedu-file:347d7c41-f920-4df1-60dd-c46573880f93.pdf'),
 (280,'Tài liệu tham khảo OOP với C# — phần thiết kế','vedu-file:025b6f84-fcfd-ae30-ccec-02714b4582ab.pdf'),
 (281,'Tài liệu tham khảo OOP với C# — phần thiết kế','vedu-file:025b6f84-fcfd-ae30-ccec-02714b4582ab.pdf');
DO $check$
DECLARE bad integer;
BEGIN
 IF (SELECT count(*) FROM vedu_restore81)<>11 OR (SELECT count(DISTINCT lesson_id) FROM vedu_restore81)<>10 THEN
 RAISE EXCEPTION 'OOP original PDF inventory mismatch'; END IF;
 SELECT count(*) INTO bad FROM vedu_restore81 m LEFT JOIN lms.lessons l ON l.lesson_id=m.lesson_id
 WHERE l.lesson_id IS NULL OR l.course_id<>61 OR NOT l.is_published OR l.is_deleted;
 IF bad>0 THEN RAISE EXCEPTION 'OOP lesson IDs have changed (%); abort',bad; END IF;
 SELECT count(*) INTO bad FROM (SELECT DISTINCT lesson_id FROM vedu_restore81) x
 WHERE NOT EXISTS(SELECT 1 FROM lms.lesson_resources r WHERE r.lesson_id=x.lesson_id
 AND r.resource_type='PDF' AND r.resource_url LIKE '/course-materials/vedu-oop-specific/%.pdf');
 IF bad>0 THEN RAISE EXCEPTION 'Missing one-page PDF links in % OOP lessons; abort',bad; END IF;
END $check$;
-- Assign a unique free display_order within each lesson, across ALL resource types.
-- Use max existing display_order + row_number to avoid uq_lesson_resources_order conflicts.
WITH missing AS (
 SELECT m.lesson_id, m.title, m.resource_url,
        row_number() OVER (PARTITION BY m.lesson_id ORDER BY m.resource_url) AS rn
 FROM vedu_restore81 m
 WHERE NOT EXISTS (
   SELECT 1 FROM lms.lesson_resources r
   WHERE r.lesson_id=m.lesson_id AND r.resource_type='PDF' AND r.resource_url=m.resource_url
 )
), offsets AS (
 SELECT m.lesson_id, COALESCE(MAX(r.display_order),0) AS max_order
 FROM (SELECT DISTINCT lesson_id FROM missing) m
 LEFT JOIN lms.lesson_resources r ON r.lesson_id=m.lesson_id
 GROUP BY m.lesson_id
)
INSERT INTO lms.lesson_resources(lesson_id,resource_type,title,resource_url,display_order)
SELECT m.lesson_id,'PDF',m.title,m.resource_url,o.max_order+m.rn
FROM missing m JOIN offsets o ON o.lesson_id=m.lesson_id;
DO $verify$
DECLARE bad integer;
BEGIN
 SELECT count(*) INTO bad FROM vedu_restore81 m WHERE NOT EXISTS
 (SELECT 1 FROM lms.lesson_resources r WHERE r.lesson_id=m.lesson_id AND r.resource_type='PDF' AND r.resource_url=m.resource_url);
 IF bad>0 THEN RAISE EXCEPTION 'Cannot restore % original OOP PDFs',bad; END IF;
 RAISE NOTICE 'Restored all 11 original OOP chapter PDF references in 10 lessons';
END $verify$;
-- Remove ONLY the generated 1-page summaries for OOP, AFTER old original references are restored.
DELETE FROM lms.lesson_resources r
USING lms.lessons l
WHERE r.lesson_id=l.lesson_id AND l.course_id=61 AND l.lesson_id BETWEEN 272 AND 281
AND r.resource_type='PDF' AND r.resource_url LIKE '/course-materials/vedu-oop-specific/%.pdf'
AND EXISTS (SELECT 1 FROM vedu_restore81 m WHERE m.lesson_id=l.lesson_id);
DO $final$
DECLARE n integer;
BEGIN
 SELECT count(DISTINCT l.lesson_id) INTO n FROM lms.lessons l JOIN lms.lesson_resources r ON r.lesson_id=l.lesson_id
 WHERE l.course_id=61 AND l.lesson_id BETWEEN 272 AND 281 AND r.resource_type='PDF' AND r.resource_url LIKE 'vedu-file:%.pdf';
 IF n<>10 THEN RAISE EXCEPTION 'OOP coverage only %/10, rollback',n; END IF;
 RAISE NOTICE 'OOP PDF chapter coverage 10/10; legacy genuine files restored';
END $final$;
COMMIT;
