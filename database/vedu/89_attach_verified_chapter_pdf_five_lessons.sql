\set ON_ERROR_STOP on
BEGIN;
CREATE TEMP TABLE map89(course_id bigint,lesson_id bigint,old_url text,old_title text,new_url text,new_title text) ON COMMIT DROP;
INSERT INTO map89 VALUES
(56,239,'https://cdn-dynmedia-1.microsoft.com/is/content/microsoftcorp/microsoft/bade/documents/products-and-services/en-us/education/Quick-Guide-Word-July2025-Final.pdf','Microsoft Word – Hướng dẫn nhanh (tham khảo chung, chưa theo chương)','https://congdanso.edu.vn/assets/file/Ky%20nang%20so%20co%20ban%20Tai%20lieu%20huong%20dan%20cho%20giao%20vien%202.0.pdf','Khóa học 6 – Cộng tác và chia sẻ tài liệu: Nhận xét, Track Changes (trang 104–106)'),
(60,267,'https://www.congdanso.edu.vn/assets/file/Ky%20nang%20so%20co%20ban%20Tai%20lieu%20huong%20dan%20cho%20giao%20vien%202.0.pdf','Kỹ năng số cơ bản – Tài liệu tham khảo chung','https://congdanso.edu.vn/assets/file/Ky%20nang%20so%20co%20ban%20Tai%20lieu%20huong%20dan%20cho%20giao%20vien%202.0.pdf','Khóa học 4 – Văn minh trực tuyến: Trích dẫn và bản quyền (trang 69–71)'),
(63,297,'https://lic.haui.edu.vn/media/book%20Toan%20Th%E1%BB%A7y/Gi%C3%A1o%20tr%C3%ACnh%20to%C3%A1n%20r%E1%BB%9Di%20r%E1%BA%A1c.pdf','Chương 01 – Cơ sở logic (Giáo trình Toán rời rạc)','https://dulieu.tailieuhoctap.vn/books/cong-nghe-thong-tin/the-loai-khac/file_goc_771096.pdf','Chương 6 – Đại cương về toán logic, mục 6.1.1–6.1.4: Mệnh đề (trang 120–125)'),
(63,298,'https://lic.haui.edu.vn/media/book%20Toan%20Th%E1%BB%A7y/Gi%C3%A1o%20tr%C3%ACnh%20to%C3%A1n%20r%E1%BB%9Di%20r%E1%BA%A1c.pdf','Chương 01 – Cơ sở logic (Giáo trình Toán rời rạc)','https://dulieu.tailieuhoctap.vn/books/cong-nghe-thong-tin/the-loai-khac/file_goc_771096.pdf','Chương 6 – Đại cương về toán logic, mục 6.1.5: Quy tắc suy diễn (trang 127)'),
(63,299,'https://lic.haui.edu.vn/media/book%20Toan%20Th%E1%BB%A7y/Gi%C3%A1o%20tr%C3%ACnh%20to%C3%A1n%20r%E1%BB%9Di%20r%E1%BA%A1c.pdf','Chương 01 – Cơ sở logic (Giáo trình Toán rời rạc)','https://dulieu.tailieuhoctap.vn/books/cong-nghe-thong-tin/the-loai-khac/file_goc_771096.pdf','Chương 6 – Đại cương về toán logic, mục 6.2: Logic vị từ (trang 131–134)');
DO $pre$
DECLARE n integer;
BEGIN
 IF (SELECT count(*) FROM map89) <> 5 OR (SELECT count(DISTINCT lesson_id) FROM map89) <> 5 THEN RAISE EXCEPTION 'Unexpected 89 mapping count'; END IF;
 SELECT count(*) INTO n FROM map89 m LEFT JOIN lms.lessons l ON l.lesson_id=m.lesson_id WHERE l.lesson_id IS NULL OR l.course_id<>m.course_id OR COALESCE(l.is_deleted,false) OR NOT COALESCE(l.is_published,false);
 IF n>0 THEN RAISE EXCEPTION 'Lesson mismatches %, rollback',n; END IF;
 SELECT count(*) INTO n FROM map89 m WHERE NOT EXISTS(SELECT 1 FROM lms.lesson_resources r WHERE r.lesson_id=m.lesson_id AND r.resource_type='PDF' AND ((r.resource_url=m.old_url AND r.title=m.old_title) OR (r.resource_url=m.new_url AND r.title=m.new_title)));
 IF n>0 THEN RAISE EXCEPTION 'Missing original reference / mismatched title on % lessons; rollback',n; END IF;
 SELECT count(*) INTO n FROM map89 m JOIN lms.lesson_resources r ON r.lesson_id=m.lesson_id AND r.resource_type='PDF' AND r.resource_url IN (m.old_url,m.new_url) WHERE r.title NOT IN (m.old_title,m.new_title);
 IF n>0 THEN RAISE EXCEPTION 'Unexpected title override on % rows; rollback',n; END IF;
 RAISE NOTICE 'Validated 5 lesson-specific references; no deletions';
END $pre$;
UPDATE lms.lesson_resources r SET title=m.new_title,resource_url=m.new_url
FROM map89 m
WHERE r.lesson_id=m.lesson_id AND r.resource_type='PDF' AND r.resource_url=m.old_url AND r.title=m.old_title
AND NOT EXISTS (SELECT 1 FROM lms.lesson_resources r2 WHERE r2.lesson_id=m.lesson_id AND r2.resource_type='PDF' AND r2.resource_url=m.new_url AND r2.title=m.new_title);
DO $post$
DECLARE n integer;
BEGIN
 SELECT count(*) INTO n FROM map89 m WHERE NOT EXISTS(SELECT 1 FROM lms.lesson_resources r WHERE r.lesson_id=m.lesson_id AND r.resource_type='PDF' AND r.resource_url=m.new_url AND r.title=m.new_title);
 IF n>0 THEN RAISE EXCEPTION 'Postcheck: % missing target PDF references; rollback',n; END IF;
 RAISE NOTICE 'Verified 5/5 chapter-specific PDF resource references';
END $post$;
COMMIT;
