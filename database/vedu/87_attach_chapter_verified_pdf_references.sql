\set ON_ERROR_STOP on
BEGIN;
CREATE TEMP TABLE map87(course_id bigint,lesson_id bigint,old_url text,old_title text,new_url text,new_title text) ON COMMIT DROP;
INSERT INTO map87 VALUES
(47,152,'https://thuvien.utm.edu.vn/ktpm/GiaoTrinhKTPM.pdf','Chương 01 – Tổng quan về kiểm thử (Giáo trình Kiểm thử phần mềm)','https://thuvien.utm.edu.vn/ktpm/GiaoTrinhKTPM.pdf','Chương 01 – Tổng quan về kiểm thử'),
(47,154,'https://thuvien.utm.edu.vn/ktpm/GiaoTrinhKTPM.pdf','Chương 01 – Tổng quan về kiểm thử, mục Ca kiểm thử (tham khảo)','https://thuvien.utm.edu.vn/ktpm/GiaoTrinhKTPM.pdf','Chương 01 – Ca kiểm thử và thiết kế ca kiểm thử'),
(47,155,'https://thuvien.utm.edu.vn/ktpm/GiaoTrinhKTPM.pdf','Giáo trình Kiểm thử phần mềm – Tài liệu tham khảo chung','https://thuvien.utm.edu.vn/ktpm/GiaoTrinhKTPM.pdf','Chương 09 – Kiểm thử tự động với JUnit và NUnit'),
(47,156,'https://thuvien.utm.edu.vn/ktpm/GiaoTrinhKTPM.pdf','Giáo trình Kiểm thử phần mềm – Tài liệu tham khảo chung','https://thuvien.utm.edu.vn/ktpm/GiaoTrinhKTPM.pdf','Chương 09 – Cucumber (tài liệu bổ trợ cho BDD)'),
(47,157,'https://thuvien.utm.edu.vn/ktpm/GiaoTrinhKTPM.pdf','Giáo trình Kiểm thử phần mềm – Tài liệu tham khảo chung','https://thuvien.utm.edu.vn/ktpm/GiaoTrinhKTPM.pdf','Chương 08 – Công cụ Selenium'),
(56,233,'https://cdn-dynmedia-1.microsoft.com/is/content/microsoftcorp/microsoft/bade/documents/products-and-services/en-us/education/Quick-Guide-Word-July2025-Final.pdf','Microsoft Word – Hướng dẫn nhanh (tham khảo chung, chưa theo chương)','https://www.congdanso.edu.vn/assets/file/Ky%20nang%20so%20co%20ban%20Tai%20lieu%20huong%20dan%20cho%20giao%20vien%202.0.pdf','Khóa học 05 – Làm việc với tài liệu Word'),
(56,237,'https://cdn-dynmedia-1.microsoft.com/is/content/microsoftcorp/microsoft/bade/documents/products-and-services/en-us/education/Quick-Guide-Word-July2025-Final.pdf','Microsoft Word – Hướng dẫn nhanh (tham khảo chung, chưa theo chương)','https://www.congdanso.edu.vn/assets/file/Ky%20nang%20so%20co%20ban%20Tai%20lieu%20huong%20dan%20cho%20giao%20vien%202.0.pdf','Khóa học 05 – Định dạng và chỉnh sửa văn bản Word'),
(59,257,'https://www.congdanso.edu.vn/assets/file/Ky%20nang%20so%20co%20ban%20Tai%20lieu%20huong%20dan%20cho%20giao%20vien%202.0.pdf','Kỹ năng số cơ bản – Tài liệu tham khảo chung','https://www.congdanso.edu.vn/assets/file/Ky%20nang%20so%20co%20ban%20Tai%20lieu%20huong%20dan%20cho%20giao%20vien%202.0.pdf','Khóa học 06 – Lưu trữ và quản lý nội dung số'),
(59,258,'https://www.congdanso.edu.vn/assets/file/Ky%20nang%20so%20co%20ban%20Tai%20lieu%20huong%20dan%20cho%20giao%20vien%202.0.pdf','Kỹ năng số cơ bản – Tài liệu tham khảo chung','https://www.congdanso.edu.vn/assets/file/Ky%20nang%20so%20co%20ban%20Tai%20lieu%20huong%20dan%20cho%20giao%20vien%202.0.pdf','Khóa học 03–04 – Email và an toàn trực tuyến'),
(59,259,'https://www.congdanso.edu.vn/assets/file/Ky%20nang%20so%20co%20ban%20Tai%20lieu%20huong%20dan%20cho%20giao%20vien%202.0.pdf','Kỹ năng số cơ bản – Tài liệu tham khảo chung','https://www.congdanso.edu.vn/assets/file/Ky%20nang%20so%20co%20ban%20Tai%20lieu%20huong%20dan%20cho%20giao%20vien%202.0.pdf','Khóa học 06 – Cộng tác và chia sẻ tài liệu'),
(59,261,'https://www.congdanso.edu.vn/assets/file/Ky%20nang%20so%20co%20ban%20Tai%20lieu%20huong%20dan%20cho%20giao%20vien%202.0.pdf','Kỹ năng số cơ bản – Tài liệu tham khảo chung','https://www.congdanso.edu.vn/assets/file/Ky%20nang%20so%20co%20ban%20Tai%20lieu%20huong%20dan%20cho%20giao%20vien%202.0.pdf','Khóa học 06 – Cộng tác và chia sẻ tài liệu'),
(59,263,'https://www.congdanso.edu.vn/assets/file/Ky%20nang%20so%20co%20ban%20Tai%20lieu%20huong%20dan%20cho%20giao%20vien%202.0.pdf','Kỹ năng số cơ bản – Tài liệu tham khảo chung','https://www.congdanso.edu.vn/assets/file/Ky%20nang%20so%20co%20ban%20Tai%20lieu%20huong%20dan%20cho%20giao%20vien%202.0.pdf','Khóa học 04 – Bảo mật và an toàn trực tuyến'),
(60,265,'https://www.congdanso.edu.vn/assets/file/Ky%20nang%20so%20co%20ban%20Tai%20lieu%20huong%20dan%20cho%20giao%20vien%202.0.pdf','Kỹ năng số cơ bản – Tài liệu tham khảo chung','https://www.congdanso.edu.vn/assets/file/Ky%20nang%20so%20co%20ban%20Tai%20lieu%20huong%20dan%20cho%20giao%20vien%202.0.pdf','Khóa học 02 – Tìm kiếm trên mạng'),
(60,266,'https://www.congdanso.edu.vn/assets/file/Ky%20nang%20so%20co%20ban%20Tai%20lieu%20huong%20dan%20cho%20giao%20vien%202.0.pdf','Kỹ năng số cơ bản – Tài liệu tham khảo chung','https://www.congdanso.edu.vn/assets/file/Ky%20nang%20so%20co%20ban%20Tai%20lieu%20huong%20dan%20cho%20giao%20vien%202.0.pdf','Khóa học 02 – Tìm kiếm và đánh giá thông tin'),
(60,270,'https://www.congdanso.edu.vn/assets/file/Ky%20nang%20so%20co%20ban%20Tai%20lieu%20huong%20dan%20cho%20giao%20vien%202.0.pdf','Kỹ năng số cơ bản – Tài liệu tham khảo chung','https://www.congdanso.edu.vn/assets/file/Ky%20nang%20so%20co%20ban%20Tai%20lieu%20huong%20dan%20cho%20giao%20vien%202.0.pdf','Khóa học 02 – Tìm kiếm và đánh giá thông tin'),
(63,291,'https://lic.haui.edu.vn/media/book%20Toan%20Th%E1%BB%A7y/Gi%C3%A1o%20tr%C3%ACnh%20to%C3%A1n%20r%E1%BB%9Di%20r%E1%BA%A1c.pdf','Chương 04 – Lý thuyết đồ thị (Giáo trình Toán rời rạc)','https://elib.vnuf.edu.vn/bitstream/123456789/8260/1/BG%20Toan%20roi%20rac.pdf','Chương 03 – Đồ thị: khái niệm cơ bản'),
(63,292,'https://lic.haui.edu.vn/media/book%20Toan%20Th%E1%BB%A7y/Gi%C3%A1o%20tr%C3%ACnh%20to%C3%A1n%20r%E1%BB%9Di%20r%E1%BA%A1c.pdf','Chương 04 – Lý thuyết đồ thị (Giáo trình Toán rời rạc)','https://elib.vnuf.edu.vn/bitstream/123456789/8260/1/BG%20Toan%20roi%20rac.pdf','Chương 03 – Đồ thị: biểu diễn đồ thị'),
(63,293,'https://lic.haui.edu.vn/media/book%20Toan%20Th%E1%BB%A7y/Gi%C3%A1o%20tr%C3%ACnh%20to%C3%A1n%20r%E1%BB%9Di%20r%E1%BA%A1c.pdf','Chương 04 – Lý thuyết đồ thị (Giáo trình Toán rời rạc)','https://elib.vnuf.edu.vn/bitstream/123456789/8260/1/BG%20Toan%20roi%20rac.pdf','Chương 03–04 – Các bài toán về đồ thị'),
(63,294,'https://lic.haui.edu.vn/media/book%20Toan%20Th%E1%BB%A7y/Gi%C3%A1o%20tr%C3%ACnh%20to%C3%A1n%20r%E1%BB%9Di%20r%E1%BA%A1c.pdf','Chương 04 – Lý thuyết đồ thị (Giáo trình Toán rời rạc)','https://elib.vnuf.edu.vn/bitstream/123456789/8260/1/BG%20Toan%20roi%20rac.pdf','Chương 04–05 – Đồ thị và bài toán tối ưu'),
(63,295,'https://lic.haui.edu.vn/media/book%20Toan%20Th%E1%BB%A7y/Gi%C3%A1o%20tr%C3%ACnh%20to%C3%A1n%20r%E1%BB%9Di%20r%E1%BA%A1c.pdf','Chương 04 – Lý thuyết đồ thị (Giáo trình Toán rời rạc)','https://elib.vnuf.edu.vn/bitstream/123456789/8260/1/BG%20Toan%20roi%20rac.pdf','Chương 05 – Bài toán đường đi ngắn nhất'),
(63,296,'https://lic.haui.edu.vn/media/book%20Toan%20Th%E1%BB%A7y/Gi%C3%A1o%20tr%C3%ACnh%20to%C3%A1n%20r%E1%BB%9Di%20r%E1%BA%A1c.pdf','Chương 04 – Lý thuyết đồ thị (Giáo trình Toán rời rạc)','https://elib.vnuf.edu.vn/bitstream/123456789/8260/1/BG%20Toan%20roi%20rac.pdf','Chương 06 – Cây khung nhỏ nhất'),
(63,300,'https://lic.haui.edu.vn/media/book%20Toan%20Th%E1%BB%A7y/Gi%C3%A1o%20tr%C3%ACnh%20to%C3%A1n%20r%E1%BB%9Di%20r%E1%BA%A1c.pdf','Chương 03 – Một số bài toán tổ hợp cơ bản (Giáo trình Toán rời rạc)','https://elib.vnuf.edu.vn/bitstream/123456789/8260/1/BG%20Toan%20roi%20rac.pdf','Chương 02 – Bài toán đếm và tổ hợp'),
(63,301,'https://lic.haui.edu.vn/media/book%20Toan%20Th%E1%BB%A7y/Gi%C3%A1o%20tr%C3%ACnh%20to%C3%A1n%20r%E1%BB%9Di%20r%E1%BA%A1c.pdf','Chương 03 – Một số bài toán tổ hợp cơ bản (Giáo trình Toán rời rạc)','https://elib.vnuf.edu.vn/bitstream/123456789/8260/1/BG%20Toan%20roi%20rac.pdf','Chương 02 – Phép đếm và giải tích tổ hợp'),
(63,302,'https://lic.haui.edu.vn/media/book%20Toan%20Th%E1%BB%A7y/Gi%C3%A1o%20tr%C3%ACnh%20to%C3%A1n%20r%E1%BB%9Di%20r%E1%BA%A1c.pdf','Chương 03 – Một số bài toán tổ hợp cơ bản (Giáo trình Toán rời rạc)','https://elib.vnuf.edu.vn/bitstream/123456789/8260/1/BG%20Toan%20roi%20rac.pdf','Chương 02 – Các phương pháp đếm');
DO $pre$
DECLARE n int;
BEGIN
 IF (SELECT count(*) FROM map87)<>24 OR (SELECT count(DISTINCT course_id) FROM map87)<>5 THEN RAISE EXCEPTION 'Bad mapping cardinality'; END IF;
 IF EXISTS (SELECT 1 FROM map87 GROUP BY lesson_id HAVING count(*)>1) THEN RAISE EXCEPTION 'Duplicate lesson mapping';END IF;
 SELECT count(*) INTO n FROM map87 m LEFT JOIN lms.lessons l ON l.lesson_id=m.lesson_id WHERE l.lesson_id IS NULL OR l.course_id<>m.course_id OR COALESCE(l.is_deleted,false) OR NOT COALESCE(l.is_published,false);
 IF n>0 THEN RAISE EXCEPTION 'Lesson mismatches %; rollback',n; END IF;
 SELECT count(*) INTO n FROM map87 m WHERE NOT EXISTS(SELECT 1 FROM lms.lesson_resources r WHERE r.lesson_id=m.lesson_id AND r.resource_type='PDF' AND r.resource_url IN(m.old_url,m.new_url) AND r.title IN(m.old_title,m.new_title));
 IF n>0 THEN RAISE EXCEPTION 'Missing or modified original external PDF resources %; rollback',n;END IF;
 SELECT count(*) INTO n FROM map87 m JOIN lms.lesson_resources r ON r.lesson_id=m.lesson_id AND r.resource_type='PDF' AND r.resource_url IN(m.old_url,m.new_url) WHERE r.title NOT IN (m.old_title,m.new_title);
 IF n>0 THEN RAISE EXCEPTION 'Unexpected PDF title overrides %; rollback',n;END IF;
 RAISE NOTICE 'Validated 24/24 chapter/section mappings; no PDF row deletions';
END $pre$;
UPDATE lms.lesson_resources r SET title=m.new_title,resource_url=m.new_url
FROM map87 m
WHERE r.lesson_id=m.lesson_id AND r.resource_type='PDF' AND r.resource_url=m.old_url AND r.title=m.old_title
AND NOT EXISTS(SELECT 1 FROM lms.lesson_resources already WHERE already.lesson_id=m.lesson_id AND already.resource_type='PDF' AND already.resource_url=m.new_url AND already.title=m.new_title);
DO $post$
DECLARE n int;
BEGIN
 SELECT count(*) INTO n FROM map87 m WHERE NOT EXISTS(SELECT 1 FROM lms.lesson_resources r WHERE r.lesson_id=m.lesson_id AND r.resource_type='PDF' AND r.resource_url=m.new_url AND r.title=m.new_title);
 IF n>0 THEN RAISE EXCEPTION 'Postcheck failed on % chapter links; rollback',n;END IF;
 RAISE NOTICE 'Verified 24/24 chapter-specific references; 32 other lessons unchanged';
END $post$;
COMMIT;
