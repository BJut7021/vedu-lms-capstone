\set ON_ERROR_STOP on
BEGIN;
CREATE TEMP TABLE restore82(course_id bigint,lesson_id bigint,title text,resource_url text) ON COMMIT DROP;
INSERT INTO restore82 VALUES
 (44,129,'PDF DSA theo bai (VEDU-V4): PDF bai 01: Tổng quan cấu trúc dữ liệu - Trịnh Thành Trung - ĐHBK Hà Nội','https://users.soict.hust.edu.vn/trungtt/uploads/slides/PT05_CauTrucDuLieu.pdf'),
 (44,130,'PDF DSA theo bai (VEDU-V4): PDF bai 02: Phân tích độ phức tạp - Đại học Lâm nghiệp - Bài giảng Toán rời rạc (phần Big-O)','https://elib.vnuf.edu.vn/bitstream/123456789/8260/1/BG%20Toan%20roi%20rac.pdf'),
 (44,131,'PDF DSA theo bai (VEDU-V4): PDF bai 03: Đệ quy - Nguyễn Hồng Phương - ĐHBK Hà Nội (phần đệ quy)','https://users.soict.hust.edu.vn/phuongnh/tindc/Phan2_GiaiQuyetBaiToan_Chuong2_ThuatToan.pdf#page=5'),
 (44,132,'PDF DSA theo bai (VEDU-V4): PDF bai 04: Mảng và danh sách tuyến tính - Đào Trung Kiên - ĐHBK Hà Nội','https://www.mica.edu.vn/perso/Nguyen-Viet-Tung/KTLT/slide/07.%20C%20-%20Data%20Structures.pdf'),
 (44,133,'PDF DSA theo bai (VEDU-V4): PDF bai 05: Danh sách liên kết - Ngô Công Thắng - Học viện Nông nghiệp Việt Nam','https://dse.vnua.edu.vn/ncthang/pth02003/SlidePDF/Chuong03.pdf'),
 (44,134,'PDF DSA theo bai (VEDU-V4): PDF bai 06: Ngăn xếp Stack - Trịnh Thành Trung - ĐHBK Hà Nội (phần Stack)','https://users.soict.hust.edu.vn/trungtt/uploads/slides/PT05_CauTrucDuLieu.pdf'),
 (44,135,'PDF DSA theo bai (VEDU-V4): PDF bai 07: Hàng đợi Queue - Ngô Công Thắng - Học viện Nông nghiệp Việt Nam (ứng dụng Queue)','https://dse.vnua.edu.vn/ncthang/pth02003/SlidePDF/Chuong03.pdf'),
 (44,136,'PDF DSA theo bai (VEDU-V4): PDF bai 08: Cây nhị phân - Ngô Công Thắng - Học viện Nông nghiệp Việt Nam','https://dse.vnua.edu.vn/cnpm/pth02004/SlidePDF/Chuong01_Cau-truc-du-lieu-Cay.pdf'),
 (44,137,'PDF DSA theo bai (VEDU-V4): PDF bai 09: Tìm kiếm - Trịnh Thành Trung - ĐHBK Hà Nội (tìm kiếm)','https://users.soict.hust.edu.vn/trungtt/uploads/slides/KTLT_Bai03.pdf'),
 (44,138,'PDF DSA theo bai (VEDU-V4): PDF bai 10: Sắp xếp - Trịnh Thành Trung - ĐHBK Hà Nội (sắp xếp)','https://users.soict.hust.edu.vn/trungtt/uploads/slides/KTLT_Bai03.pdf'),
 (48,161,'PDF KTLT theo bai (VEDU-V5): Phong cach lap trinh - HUST','https://users.soict.hust.edu.vn/trungtt/uploads/slides/KTLT_Bai06.pdf'),
 (48,161,'PDF KTLT theo bai (VEDU-V5): Lap trinh phong ngua, xu ly loi - HUST','https://users.soict.hust.edu.vn/trungtt/uploads/slides/KTLT_Bai08.pdf'),
 (48,162,'PDF KTLT theo bai (VEDU-V5): Mang mot chieu - HUST','https://users.soict.hust.edu.vn/trungtt/uploads/slides/KTLT_Bai04.pdf'),
 (48,163,'PDF KTLT theo bai (VEDU-V5): Tim kiem va sap xep - HUST','https://users.soict.hust.edu.vn/trungtt/uploads/slides/KTLT_Bai03.pdf'),
 (48,164,'PDF KTLT theo bai (VEDU-V5): Mang hai chieu - HUST','https://users.soict.hust.edu.vn/trungtt/uploads/slides/KTLT_Bai04.pdf'),
 (48,165,'PDF KTLT theo bai (VEDU-V5): Chuong 3 - Chuoi co ban va chuan hoa (HUFI)','vedu-file:58742a53-4447-9380-2ed0-29cd36efbb6d.pdf'),
 (48,166,'PDF KTLT theo bai (VEDU-V5): Chuong 3 - Tim, dem va thay the chuoi con (HUFI)','vedu-file:58742a53-4447-9380-2ed0-29cd36efbb6d.pdf'),
 (48,167,'PDF KTLT theo bai (VEDU-V5): De quy: co so va phan nhanh - HUST','https://users.soict.hust.edu.vn/trungtt/uploads/slides/PT04_DeQui.pdf'),
 (48,168,'PDF KTLT theo bai (VEDU-V5): Chuong 4 - De quy long va ho tuong (HUFI)','vedu-file:58742a53-4447-9380-2ed0-29cd36efbb6d.pdf'),
 (50,181,'PDF gốc Python theo bài (VEDU-V5): PDF bài 01: Giới thiệu Python, chạy chương trình, nhập và xuất — nguồn gốc','https://txnam.net/wp-content/uploads/txnam/mon-hoc/python-2023/python.2023.01.pdf'),
 (50,182,'PDF gốc Python theo bài (VEDU-V5): PDF bài 02: Biến, kiểu dữ liệu, phép toán và biểu thức — nguồn gốc','https://txnam.net/wp-content/uploads/txnam/mon-hoc/python-2022/python.2022.01.pdf'),
 (50,183,'PDF gốc Python theo bài (VEDU-V5): PDF bài 03: Câu lệnh điều kiện và ví dụ rẽ nhánh — nguồn gốc','https://txnam.net/wp-content/uploads/txnam/mon-hoc/python-2023/python.2023.02.pdf'),
 (50,184,'PDF gốc Python theo bài (VEDU-V5): PDF bài 04: Vòng lặp for, while, break/continue — nguồn gốc','https://txnam.net/wp-content/uploads/txnam/mon-hoc/python-2023/python.2023.03.pdf'),
 (50,185,'PDF gốc Python theo bài (VEDU-V5): PDF bài 05: Hàm, tham số, giá trị trả về — nguồn gốc','https://txnam.net/wp-content/uploads/txnam/mon-hoc/python-2023/python.2023.02.pdf'),
 (50,186,'PDF gốc Python theo bài (VEDU-V5): PDF bài 06: Chuỗi, chỉ số, cắt chuỗi và xử lý chuỗi — nguồn gốc','https://txnam.net/wp-content/uploads/txnam/mon-hoc/python-2023/python.2023.04.pdf'),
 (50,187,'PDF gốc Python theo bài (VEDU-V5): PDF bài 07: List, Tuple và các phép xử lý — nguồn gốc','https://txnam.net/wp-content/uploads/txnam/mon-hoc/python-2023/python.2023.05.pdf'),
 (50,188,'PDF gốc Python theo bài (VEDU-V5): PDF bài 08: Dictionary, module, package và lambda — nguồn gốc','https://txnam.net/wp-content/uploads/txnam/mon-hoc/python-2023/python.2023.07.pdf'),
 (50,189,'PDF gốc Python theo bài (VEDU-V5): PDF bài 09: Class/Object, hướng đối tượng và vào/ra dữ liệu — nguồn gốc','https://www.cit.ctu.edu.vn/~dtnghi/crypto/basic-python3.pdf'),
 (50,189,'PDF bổ sung Python (VEDU-V5): Đọc/ghi tệp — Trương Xuân Nam','https://txnam.net/wp-content/uploads/txnam/Bai%20Giang/CSE204-K62/python-09.pdf');
DO $check$
DECLARE n integer; bad integer;
BEGIN
 SELECT count(*) INTO n FROM restore82;
 IF n<>29 OR (SELECT count(DISTINCT lesson_id) FROM restore82)<>27 THEN RAISE EXCEPTION 'Original PDF manifest incomplete';END IF;
 SELECT count(*) INTO bad FROM restore82 x LEFT JOIN lms.lessons l ON l.lesson_id=x.lesson_id
 WHERE l.lesson_id IS NULL OR l.course_id<>x.course_id OR NOT l.is_published OR l.is_deleted OR l.lesson_order<=1;
 IF bad>0 THEN RAISE EXCEPTION 'Lesson identifiers/status changed (% mismatches); rollback',bad; END IF;
 SELECT count(*) INTO bad FROM (SELECT course_id, count(DISTINCT lesson_id) n FROM restore82 GROUP BY course_id) x
 WHERE (x.course_id=44 AND x.n<>10) OR (x.course_id=48 AND x.n<>8) OR (x.course_id=50 AND x.n<>9);
 IF bad>0 THEN RAISE EXCEPTION 'Course lesson coverage changed; rollback'; END IF;
 SELECT count(*) INTO bad FROM (SELECT DISTINCT lesson_id FROM restore82) x WHERE NOT EXISTS
  (SELECT 1 FROM lms.lesson_resources r WHERE r.lesson_id=x.lesson_id AND r.resource_type='PDF' AND r.resource_url LIKE '/course-materials/vedu-%-specific/%.pdf');
 IF bad>0 THEN RAISE EXCEPTION 'Expected generated PDF missing on % lessons; rollback',bad; END IF;
 RAISE NOTICE 'Validated 29 historical original PDF references across 27 lessons';
END $check$;
-- Insert only missing original references; allocate non-conflicting order for every lesson.
WITH missing AS (
 SELECT m.*, row_number() OVER(PARTITION BY lesson_id ORDER BY resource_url) rn
 FROM restore82 m WHERE NOT EXISTS(SELECT 1 FROM lms.lesson_resources r
  WHERE r.lesson_id=m.lesson_id AND r.resource_type='PDF' AND r.resource_url=m.resource_url)
), offsets AS (
 SELECT m.lesson_id,COALESCE(MAX(r.display_order),0) max_order
 FROM (SELECT DISTINCT lesson_id FROM missing) m LEFT JOIN lms.lesson_resources r ON r.lesson_id=m.lesson_id GROUP BY m.lesson_id
)
INSERT INTO lms.lesson_resources(lesson_id,resource_type,title,resource_url,display_order)
SELECT m.lesson_id,'PDF',m.title,m.resource_url,o.max_order+m.rn
FROM missing m JOIN offsets o ON o.lesson_id=m.lesson_id;
DO $verified$
DECLARE bad integer;
BEGIN
 SELECT count(*) INTO bad FROM restore82 m WHERE NOT EXISTS
 (SELECT 1 FROM lms.lesson_resources r WHERE r.lesson_id=m.lesson_id AND r.resource_type='PDF' AND r.resource_url=m.resource_url);
 IF bad>0 THEN RAISE EXCEPTION 'Failed restoring % original PDFs',bad;END IF;
 RAISE NOTICE 'All 29 original PDF references restored';
END $verified$;
-- Only after originals are restored: remove the generated one-page replacement references for THESE 27 lessons.
DELETE FROM lms.lesson_resources r USING restore82 m
WHERE r.lesson_id=m.lesson_id AND r.resource_type='PDF' AND r.resource_url LIKE '/course-materials/vedu-%-specific/%.pdf';
DO $final$
DECLARE n integer; bad integer;
BEGIN
 SELECT count(DISTINCT m.lesson_id) INTO n FROM restore82 m JOIN lms.lesson_resources r ON r.lesson_id=m.lesson_id
 WHERE r.resource_type='PDF' AND r.resource_url=m.resource_url;
 IF n<>27 THEN RAISE EXCEPTION 'Original PDFs restored to only % of 27 lessons; rollback',n;END IF;
 SELECT count(*) INTO bad FROM (SELECT DISTINCT lesson_id FROM restore82) m WHERE NOT EXISTS
  (SELECT 1 FROM lms.lesson_resources r WHERE r.lesson_id=m.lesson_id AND r.resource_type='PDF');
 IF bad>0 THEN RAISE EXCEPTION '% lessons without PDF after restore',bad; END IF;
 RAISE NOTICE 'Restored 27/27 lessons; 3 courses: DSA 10, Programming Techniques 8, Python 9';
END $final$;
COMMIT;
