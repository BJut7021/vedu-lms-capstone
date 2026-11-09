\set ON_ERROR_STOP on
BEGIN;
CREATE TEMP TABLE chapter83(course_id bigint, lesson_id bigint, old_title text, new_title text, url text) ON COMMIT DROP;
INSERT INTO chapter83 VALUES
 ('44','129','PDF DSA theo bai (VEDU-V4): PDF bai 01: Tổng quan cấu trúc dữ liệu - Trịnh Thành Trung - ĐHBK Hà Nội','Chương 01 – Tổng quan cấu trúc dữ liệu','https://users.soict.hust.edu.vn/trungtt/uploads/slides/PT05_CauTrucDuLieu.pdf'),
 ('44','130','PDF DSA theo bai (VEDU-V4): PDF bai 02: Phân tích độ phức tạp - Đại học Lâm nghiệp - Bài giảng Toán rời rạc (phần Big-O)','Chương 02 – Phân tích độ phức tạp','https://elib.vnuf.edu.vn/bitstream/123456789/8260/1/BG%20Toan%20roi%20rac.pdf'),
 ('44','131','PDF DSA theo bai (VEDU-V4): PDF bai 03: Đệ quy - Nguyễn Hồng Phương - ĐHBK Hà Nội (phần đệ quy)','Chương 03 – Đệ quy','https://users.soict.hust.edu.vn/phuongnh/tindc/Phan2_GiaiQuyetBaiToan_Chuong2_ThuatToan.pdf#page=5'),
 ('44','132','PDF DSA theo bai (VEDU-V4): PDF bai 04: Mảng và danh sách tuyến tính - Đào Trung Kiên - ĐHBK Hà Nội','Chương 04 – Mảng và danh sách tuyến tính','https://www.mica.edu.vn/perso/Nguyen-Viet-Tung/KTLT/slide/07.%20C%20-%20Data%20Structures.pdf'),
 ('44','133','PDF DSA theo bai (VEDU-V4): PDF bai 05: Danh sách liên kết - Ngô Công Thắng - Học viện Nông nghiệp Việt Nam','Chương 05 – Danh sách liên kết','https://dse.vnua.edu.vn/ncthang/pth02003/SlidePDF/Chuong03.pdf'),
 ('44','134','PDF DSA theo bai (VEDU-V4): PDF bai 06: Ngăn xếp Stack - Trịnh Thành Trung - ĐHBK Hà Nội (phần Stack)','Chương 06 – Ngăn xếp (Stack)','https://users.soict.hust.edu.vn/trungtt/uploads/slides/PT05_CauTrucDuLieu.pdf'),
 ('44','135','PDF DSA theo bai (VEDU-V4): PDF bai 07: Hàng đợi Queue - Ngô Công Thắng - Học viện Nông nghiệp Việt Nam (ứng dụng Queue)','Chương 07 – Hàng đợi (Queue)','https://dse.vnua.edu.vn/ncthang/pth02003/SlidePDF/Chuong03.pdf'),
 ('44','136','PDF DSA theo bai (VEDU-V4): PDF bai 08: Cây nhị phân - Ngô Công Thắng - Học viện Nông nghiệp Việt Nam','Chương 08 – Cây nhị phân','https://dse.vnua.edu.vn/cnpm/pth02004/SlidePDF/Chuong01_Cau-truc-du-lieu-Cay.pdf'),
 ('44','137','PDF DSA theo bai (VEDU-V4): PDF bai 09: Tìm kiếm - Trịnh Thành Trung - ĐHBK Hà Nội (tìm kiếm)','Chương 09 – Tìm kiếm','https://users.soict.hust.edu.vn/trungtt/uploads/slides/KTLT_Bai03.pdf'),
 ('44','138','PDF DSA theo bai (VEDU-V4): PDF bai 10: Sắp xếp - Trịnh Thành Trung - ĐHBK Hà Nội (sắp xếp)','Chương 10 – Sắp xếp','https://users.soict.hust.edu.vn/trungtt/uploads/slides/KTLT_Bai03.pdf'),
 ('48','161','PDF KTLT theo bai (VEDU-V5): Phong cach lap trinh - HUST','Chương 01 – Phong cách lập trình','https://users.soict.hust.edu.vn/trungtt/uploads/slides/KTLT_Bai06.pdf'),
 ('48','161','PDF KTLT theo bai (VEDU-V5): Lap trinh phong ngua, xu ly loi - HUST','Chương 01 – Lập trình phòng ngừa và xử lý lỗi','https://users.soict.hust.edu.vn/trungtt/uploads/slides/KTLT_Bai08.pdf'),
 ('48','162','PDF KTLT theo bai (VEDU-V5): Mang mot chieu - HUST','Chương 02 – Mảng và thuật toán tìm kiếm, sắp xếp','https://users.soict.hust.edu.vn/trungtt/uploads/slides/KTLT_Bai04.pdf'),
 ('48','163','PDF KTLT theo bai (VEDU-V5): Tim kiem va sap xep - HUST','Chương 02 – Mảng và thuật toán tìm kiếm, sắp xếp','https://users.soict.hust.edu.vn/trungtt/uploads/slides/KTLT_Bai03.pdf'),
 ('48','164','PDF KTLT theo bai (VEDU-V5): Mang hai chieu - HUST','Chương 02 – Mảng và thuật toán tìm kiếm, sắp xếp','https://users.soict.hust.edu.vn/trungtt/uploads/slides/KTLT_Bai04.pdf'),
 ('48','165','PDF KTLT theo bai (VEDU-V5): Chuong 3 - Chuoi co ban va chuan hoa (HUFI)','Chương 03 – Xử lý chuỗi','vedu-file:58742a53-4447-9380-2ed0-29cd36efbb6d.pdf'),
 ('48','166','PDF KTLT theo bai (VEDU-V5): Chuong 3 - Tim, dem va thay the chuoi con (HUFI)','Chương 03 – Xử lý chuỗi','vedu-file:58742a53-4447-9380-2ed0-29cd36efbb6d.pdf'),
 ('48','167','PDF KTLT theo bai (VEDU-V5): De quy: co so va phan nhanh - HUST','Chương 04 – Đệ quy','https://users.soict.hust.edu.vn/trungtt/uploads/slides/PT04_DeQui.pdf'),
 ('48','168','PDF KTLT theo bai (VEDU-V5): Chuong 4 - De quy long va ho tuong (HUFI)','Chương 04 – Đệ quy','vedu-file:58742a53-4447-9380-2ed0-29cd36efbb6d.pdf'),
 ('50','181','PDF gốc Python theo bài (VEDU-V5): PDF bài 01: Giới thiệu Python, chạy chương trình, nhập và xuất — nguồn gốc','Chương 01 – Giới thiệu Python và nhập xuất','https://txnam.net/wp-content/uploads/txnam/mon-hoc/python-2023/python.2023.01.pdf'),
 ('50','182','PDF gốc Python theo bài (VEDU-V5): PDF bài 02: Biến, kiểu dữ liệu, phép toán và biểu thức — nguồn gốc','Chương 02 – Biến, kiểu dữ liệu và biểu thức','https://txnam.net/wp-content/uploads/txnam/mon-hoc/python-2022/python.2022.01.pdf'),
 ('50','183','PDF gốc Python theo bài (VEDU-V5): PDF bài 03: Câu lệnh điều kiện và ví dụ rẽ nhánh — nguồn gốc','Chương 03 – Cấu trúc rẽ nhánh','https://txnam.net/wp-content/uploads/txnam/mon-hoc/python-2023/python.2023.02.pdf'),
 ('50','184','PDF gốc Python theo bài (VEDU-V5): PDF bài 04: Vòng lặp for, while, break/continue — nguồn gốc','Chương 04 – Vòng lặp','https://txnam.net/wp-content/uploads/txnam/mon-hoc/python-2023/python.2023.03.pdf'),
 ('50','185','PDF gốc Python theo bài (VEDU-V5): PDF bài 05: Hàm, tham số, giá trị trả về — nguồn gốc','Chương 05 – Hàm và tham số','https://txnam.net/wp-content/uploads/txnam/mon-hoc/python-2023/python.2023.02.pdf'),
 ('50','186','PDF gốc Python theo bài (VEDU-V5): PDF bài 06: Chuỗi, chỉ số, cắt chuỗi và xử lý chuỗi — nguồn gốc','Chương 06 – Xử lý chuỗi','https://txnam.net/wp-content/uploads/txnam/mon-hoc/python-2023/python.2023.04.pdf'),
 ('50','187','PDF gốc Python theo bài (VEDU-V5): PDF bài 07: List, Tuple và các phép xử lý — nguồn gốc','Chương 07 – List và Tuple','https://txnam.net/wp-content/uploads/txnam/mon-hoc/python-2023/python.2023.05.pdf'),
 ('50','188','PDF gốc Python theo bài (VEDU-V5): PDF bài 08: Dictionary, module, package và lambda — nguồn gốc','Chương 08 – Dictionary và Module','https://txnam.net/wp-content/uploads/txnam/mon-hoc/python-2023/python.2023.07.pdf'),
 ('50','189','PDF gốc Python theo bài (VEDU-V5): PDF bài 09: Class/Object, hướng đối tượng và vào/ra dữ liệu — nguồn gốc','Chương 09 – Lập trình hướng đối tượng và tập tin','https://www.cit.ctu.edu.vn/~dtnghi/crypto/basic-python3.pdf'),
 ('50','189','PDF bổ sung Python (VEDU-V5): Đọc/ghi tệp — Trương Xuân Nam','Chương 09 – Đọc và ghi tệp','https://txnam.net/wp-content/uploads/txnam/Bai%20Giang/CSE204-K62/python-09.pdf');
DO $validate$
DECLARE bad int; cnt int;
BEGIN
 SELECT count(*) INTO cnt FROM chapter83;
 IF cnt <> 29 THEN RAISE EXCEPTION 'Expected 29 historical PDF rows; found %',cnt; END IF;
 SELECT count(*) INTO bad FROM chapter83 m
 LEFT JOIN lms.lessons l ON l.lesson_id=m.lesson_id
 WHERE l.lesson_id IS NULL OR l.course_id<>m.course_id OR l.is_deleted OR NOT l.is_published;
 IF bad>0 THEN RAISE EXCEPTION 'Wrong lesson/course/status: % rows',bad; END IF;
 SELECT count(*) INTO bad FROM chapter83 m WHERE
 (SELECT count(*) FROM lms.lesson_resources r WHERE r.lesson_id=m.lesson_id AND r.resource_type='PDF' AND r.resource_url=m.url)<>1;
 IF bad>0 THEN RAISE EXCEPTION 'Missing/duplicate original PDF reference: % rows; no changes applied',bad; END IF;
 -- Require exact previously restored title or already-updated target title; never rename an unrelated resource.
 SELECT count(*) INTO bad FROM chapter83 m WHERE NOT EXISTS
 (SELECT 1 FROM lms.lesson_resources r WHERE r.lesson_id=m.lesson_id AND r.resource_type='PDF' AND r.resource_url=m.url AND r.title IN (m.old_title,m.new_title));
 IF bad>0 THEN RAISE EXCEPTION 'Historical title has changed on % rows; no changes applied',bad; END IF;
 RAISE NOTICE 'Validated 29 original PDF resources; OOP and all other courses are outside scope';
END $validate$;
UPDATE lms.lesson_resources r SET title=m.new_title FROM chapter83 m
WHERE r.lesson_id=m.lesson_id AND r.resource_type='PDF' AND r.resource_url=m.url AND r.title=m.old_title;
DO $verify$
DECLARE bad int;
BEGIN
 SELECT count(*) INTO bad FROM chapter83 m WHERE NOT EXISTS (
  SELECT 1 FROM lms.lesson_resources r WHERE r.lesson_id=m.lesson_id AND r.resource_type='PDF' AND r.resource_url=m.url AND r.title=m.new_title);
 IF bad>0 THEN RAISE EXCEPTION 'Failed to normalize % titles; rollback',bad; END IF;
 RAISE NOTICE '29/29 restored original PDF references display chapter-style titles; URL/content untouched';
END $verify$;
COMMIT;
