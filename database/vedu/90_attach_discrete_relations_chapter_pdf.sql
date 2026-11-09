\set ON_ERROR_STOP on
BEGIN;
CREATE TEMP TABLE map90(course_id bigint,lesson_id bigint,old_url text,old_title text,new_url text,new_title text) ON COMMIT DROP;
INSERT INTO map90 VALUES
(63,303,'https://lic.haui.edu.vn/media/book%20Toan%20Th%E1%BB%A7y/Gi%C3%A1o%20tr%C3%ACnh%20to%C3%A1n%20r%E1%BB%9Di%20r%E1%BA%A1c.pdf','Chương 02 – Quan hệ (Giáo trình Toán rời rạc)','https://hoaithuan94.github.io/dismath/Lectures/6quanhe.pdf','Chương 6 – Quan hệ: Quan hệ hai ngôi, tính chất và biểu diễn'),
(63,304,'https://lic.haui.edu.vn/media/book%20Toan%20Th%E1%BB%A7y/Gi%C3%A1o%20tr%C3%ACnh%20to%C3%A1n%20r%E1%BB%9Di%20r%E1%BA%A1c.pdf','Chương 02 – Quan hệ (Giáo trình Toán rời rạc)','https://hoaithuan94.github.io/dismath/Lectures/6quanhe.pdf','Chương 6 – Quan hệ: Quan hệ tương đương và quan hệ thứ tự');
DO $pre$
DECLARE n integer;
BEGIN
 IF (SELECT count(*) FROM map90) <> 2 OR (SELECT count(DISTINCT lesson_id) FROM map90) <> 2 THEN RAISE EXCEPTION 'Unexpected mapping count'; END IF;
 SELECT count(*) INTO n FROM map90 m LEFT JOIN lms.lessons l ON l.lesson_id=m.lesson_id WHERE l.lesson_id IS NULL OR l.course_id<>m.course_id OR COALESCE(l.is_deleted,false) OR NOT COALESCE(l.is_published,false);
 IF n>0 THEN RAISE EXCEPTION 'Lesson mismatch: %',n; END IF;
 SELECT count(*) INTO n FROM map90 m WHERE NOT EXISTS(SELECT 1 FROM lms.lesson_resources r WHERE r.lesson_id=m.lesson_id AND r.resource_type='PDF' AND ((r.resource_url=m.old_url AND r.title=m.old_title) OR (r.resource_url=m.new_url AND r.title=m.new_title)));
 IF n>0 THEN RAISE EXCEPTION 'Missing expected PDF resource on % lesson(s)',n; END IF;
 RAISE NOTICE 'Validated 2/2 lesson references; no PDFs deleted';
END $pre$;
UPDATE lms.lesson_resources r SET title=m.new_title,resource_url=m.new_url
FROM map90 m
WHERE r.lesson_id=m.lesson_id AND r.resource_type='PDF' AND r.resource_url=m.old_url AND r.title=m.old_title
AND NOT EXISTS (SELECT 1 FROM lms.lesson_resources r2 WHERE r2.lesson_id=m.lesson_id AND r2.resource_type='PDF' AND r2.resource_url=m.new_url AND r2.title=m.new_title);
DO $post$
DECLARE n integer;
BEGIN
 SELECT count(*) INTO n FROM map90 m WHERE NOT EXISTS(SELECT 1 FROM lms.lesson_resources r WHERE r.lesson_id=m.lesson_id AND r.resource_type='PDF' AND r.resource_url=m.new_url AND r.title=m.new_title);
 IF n>0 THEN RAISE EXCEPTION 'Postcheck failed for % lessons',n; END IF;
 RAISE NOTICE 'Verified 2/2 chapter-specific PDF references';
END $post$;
COMMIT;
