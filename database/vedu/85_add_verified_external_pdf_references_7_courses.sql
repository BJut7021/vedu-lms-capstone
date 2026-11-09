\set ON_ERROR_STOP on
BEGIN;
CREATE TEMP TABLE ref85(course_id bigint,lesson_id bigint,display_title text,resource_url text) ON COMMIT DROP;
INSERT INTO ref85 VALUES
(47,152,'Chương 01 – Tổng quan kiểm thử (Tài liệu tham khảo)','https://thuvien.utm.edu.vn/ktpm/GiaoTrinhKTPM.pdf'),
(47,153,'Chương 02 – Quy trình và kế hoạch kiểm thử (Tài liệu tham khảo)','https://thuvien.utm.edu.vn/ktpm/GiaoTrinhKTPM.pdf'),
(47,154,'Chương 03 – Thiết kế test case và test data (Tài liệu tham khảo)','https://thuvien.utm.edu.vn/ktpm/GiaoTrinhKTPM.pdf'),
(47,155,'Chương 04 – Unit test với NUnit/JUnit (Tài liệu tham khảo)','https://thuvien.utm.edu.vn/ktpm/GiaoTrinhKTPM.pdf'),
(47,156,'Chương 05 – BDD và Gherkin (Tài liệu tham khảo)','https://thuvien.utm.edu.vn/ktpm/GiaoTrinhKTPM.pdf'),
(47,157,'Chương 06 – Kiểm thử UI với Selenium IDE (Tài liệu tham khảo)','https://thuvien.utm.edu.vn/ktpm/GiaoTrinhKTPM.pdf'),
(47,158,'Chương 07 – Kiểm thử API với Postman (Tài liệu tham khảo)','https://thuvien.utm.edu.vn/ktpm/GiaoTrinhKTPM.pdf'),
(47,159,'Chương 08 – Thực thi, báo lỗi và hồi quy (Tài liệu tham khảo)','https://thuvien.utm.edu.vn/ktpm/GiaoTrinhKTPM.pdf'),
(56,233,'Chương 01 – Tạo tài liệu và quản lý phiên bản (Tài liệu tham khảo)','https://cdn-dynmedia-1.microsoft.com/is/content/microsoftcorp/microsoft/bade/documents/products-and-services/en-us/education/Quick-Guide-Word-July2025-Final.pdf'),
(56,234,'Chương 02 – Cấu trúc báo cáo bằng Styles (Tài liệu tham khảo)','https://cdn-dynmedia-1.microsoft.com/is/content/microsoftcorp/microsoft/bade/documents/products-and-services/en-us/education/Quick-Guide-Word-July2025-Final.pdf'),
(56,235,'Chương 03 – Thực hành: biên bản họp và bảng phân công (Tài liệu tham khảo)','https://cdn-dynmedia-1.microsoft.com/is/content/microsoftcorp/microsoft/bade/documents/products-and-services/en-us/education/Quick-Guide-Word-July2025-Final.pdf'),
(56,236,'Chương 04 – Ôn tập: sửa năm lỗi thường gặp (Tài liệu tham khảo)','https://cdn-dynmedia-1.microsoft.com/is/content/microsoftcorp/microsoft/bade/documents/products-and-services/en-us/education/Quick-Guide-Word-July2025-Final.pdf'),
(56,237,'Chương 05 – Thực hành có hướng dẫn tiếng Việt (Tài liệu tham khảo)','https://cdn-dynmedia-1.microsoft.com/is/content/microsoftcorp/microsoft/bade/documents/products-and-services/en-us/education/Quick-Guide-Word-July2025-Final.pdf'),
(56,238,'Chương 06 – Dự án: hồ sơ đề xuất hoạt động nhóm (Tài liệu tham khảo)','https://cdn-dynmedia-1.microsoft.com/is/content/microsoftcorp/microsoft/bade/documents/products-and-services/en-us/education/Quick-Guide-Word-July2025-Final.pdf'),
(56,239,'Chương 07 – Mở rộng: nhận xét và kiểm soát bản sửa (Tài liệu tham khảo)','https://cdn-dynmedia-1.microsoft.com/is/content/microsoftcorp/microsoft/bade/documents/products-and-services/en-us/education/Quick-Guide-Word-July2025-Final.pdf'),
(57,241,'Chương 01 – Làm quen Excel và quản lý bảng tính (Tài liệu tham khảo)','https://thuvienso.tcdktcnsl.edu.vn/files/products/giao_trinh_tin_hoc_van_phong_microsoft_excel_c7e.pdf'),
(57,242,'Chương 02 – Nhập liệu và định dạng bảng tính (Tài liệu tham khảo)','https://thuvienso.tcdktcnsl.edu.vn/files/products/giao_trinh_tin_hoc_van_phong_microsoft_excel_c7e.pdf'),
(57,243,'Chương 03 – Hàm SUM và thống kê chi phí (Tài liệu tham khảo)','https://thuvienso.tcdktcnsl.edu.vn/files/products/giao_trinh_tin_hoc_van_phong_microsoft_excel_c7e.pdf'),
(57,244,'Chương 04 – Các hàm COUNT và đếm dữ liệu (Tài liệu tham khảo)','https://thuvienso.tcdktcnsl.edu.vn/files/products/giao_trinh_tin_hoc_van_phong_microsoft_excel_c7e.pdf'),
(57,245,'Chương 05 – Hàm IF và điều kiện (Tài liệu tham khảo)','https://thuvienso.tcdktcnsl.edu.vn/files/products/giao_trinh_tin_hoc_van_phong_microsoft_excel_c7e.pdf'),
(57,246,'Chương 06 – Hàm xử lý chuỗi (Tài liệu tham khảo)','https://thuvienso.tcdktcnsl.edu.vn/files/products/giao_trinh_tin_hoc_van_phong_microsoft_excel_c7e.pdf'),
(57,247,'Chương 07 – Tra cứu dữ liệu bằng VLOOKUP/HLOOKUP (Tài liệu tham khảo)','https://thuvienso.tcdktcnsl.edu.vn/files/products/giao_trinh_tin_hoc_van_phong_microsoft_excel_c7e.pdf'),
(58,249,'Chương 01 – Thông điệp và cấu trúc câu chuyện (Tài liệu tham khảo)','https://cdn-dynmedia-1.microsoft.com/is/content/microsoftcorp/microsoft/bade/documents/products-and-services/en-us/education/Quick-Guide-Powerpoint-July2025-Final.pdf'),
(58,250,'Chương 02 – Bố cục, tương phản và nguồn hình ảnh (Tài liệu tham khảo)','https://cdn-dynmedia-1.microsoft.com/is/content/microsoftcorp/microsoft/bade/documents/products-and-services/en-us/education/Quick-Guide-Powerpoint-July2025-Final.pdf'),
(58,251,'Chương 03 – Thực hành: biến bảng số thành thông điệp (Tài liệu tham khảo)','https://cdn-dynmedia-1.microsoft.com/is/content/microsoftcorp/microsoft/bade/documents/products-and-services/en-us/education/Quick-Guide-Powerpoint-July2025-Final.pdf'),
(58,252,'Chương 04 – Ôn tập: giản lược slide quá tải (Tài liệu tham khảo)','https://cdn-dynmedia-1.microsoft.com/is/content/microsoftcorp/microsoft/bade/documents/products-and-services/en-us/education/Quick-Guide-Powerpoint-July2025-Final.pdf'),
(58,253,'Chương 05 – Thực hành có hướng dẫn tiếng Việt (Tài liệu tham khảo)','https://cdn-dynmedia-1.microsoft.com/is/content/microsoftcorp/microsoft/bade/documents/products-and-services/en-us/education/Quick-Guide-Powerpoint-July2025-Final.pdf'),
(58,254,'Chương 06 – Dự án: pitch đề xuất trong 300 giây (Tài liệu tham khảo)','https://cdn-dynmedia-1.microsoft.com/is/content/microsoftcorp/microsoft/bade/documents/products-and-services/en-us/education/Quick-Guide-Powerpoint-July2025-Final.pdf'),
(58,255,'Chương 07 – Mở rộng: khả năng tiếp cận và bản bàn giao (Tài liệu tham khảo)','https://cdn-dynmedia-1.microsoft.com/is/content/microsoftcorp/microsoft/bade/documents/products-and-services/en-us/education/Quick-Guide-Powerpoint-July2025-Final.pdf'),
(59,257,'Chương 01 – Tổ chức tệp và bản sao lưu (Tài liệu tham khảo)','https://www.congdanso.edu.vn/assets/file/Ky%20nang%20so%20co%20ban%20Tai%20lieu%20huong%20dan%20cho%20giao%20vien%202.0.pdf'),
(59,258,'Chương 02 – Email công việc và nhận diện phishing (Tài liệu tham khảo)','https://www.congdanso.edu.vn/assets/file/Ky%20nang%20so%20co%20ban%20Tai%20lieu%20huong%20dan%20cho%20giao%20vien%202.0.pdf'),
(59,259,'Chương 03 – Thực hành: ma trận quyền chia sẻ (Tài liệu tham khảo)','https://www.congdanso.edu.vn/assets/file/Ky%20nang%20so%20co%20ban%20Tai%20lieu%20huong%20dan%20cho%20giao%20vien%202.0.pdf'),
(59,260,'Chương 04 – Ôn tập: phân loại năm tình huống số (Tài liệu tham khảo)','https://www.congdanso.edu.vn/assets/file/Ky%20nang%20so%20co%20ban%20Tai%20lieu%20huong%20dan%20cho%20giao%20vien%202.0.pdf'),
(59,261,'Chương 05 – Tình huống: link tài liệu bị gửi nhầm (Tài liệu tham khảo)','https://www.congdanso.edu.vn/assets/file/Ky%20nang%20so%20co%20ban%20Tai%20lieu%20huong%20dan%20cho%20giao%20vien%202.0.pdf'),
(59,262,'Chương 06 – Dự án: bộ quy tắc làm việc số cho nhóm (Tài liệu tham khảo)','https://www.congdanso.edu.vn/assets/file/Ky%20nang%20so%20co%20ban%20Tai%20lieu%20huong%20dan%20cho%20giao%20vien%202.0.pdf'),
(59,263,'Chương 07 – Mở rộng: tối thiểu hóa dữ liệu và quyền riêng tư (Tài liệu tham khảo)','https://www.congdanso.edu.vn/assets/file/Ky%20nang%20so%20co%20ban%20Tai%20lieu%20huong%20dan%20cho%20giao%20vien%202.0.pdf'),
(60,265,'Chương 01 – Tìm kiếm thông tin có mục tiêu (Tài liệu tham khảo)','https://www.congdanso.edu.vn/assets/file/Ky%20nang%20so%20co%20ban%20Tai%20lieu%20huong%20dan%20cho%20giao%20vien%202.0.pdf'),
(60,266,'Chương 02 – Đánh giá nguồn và thời điểm công bố (Tài liệu tham khảo)','https://www.congdanso.edu.vn/assets/file/Ky%20nang%20so%20co%20ban%20Tai%20lieu%20huong%20dan%20cho%20giao%20vien%202.0.pdf'),
(60,267,'Chương 03 – Trích dẫn và sử dụng hình ảnh (Tài liệu tham khảo)','https://www.congdanso.edu.vn/assets/file/Ky%20nang%20so%20co%20ban%20Tai%20lieu%20huong%20dan%20cho%20giao%20vien%202.0.pdf'),
(60,268,'Chương 04 – Đọc bảng dữ liệu và biểu đồ (Tài liệu tham khảo)','https://www.congdanso.edu.vn/assets/file/Ky%20nang%20so%20co%20ban%20Tai%20lieu%20huong%20dan%20cho%20giao%20vien%202.0.pdf'),
(60,269,'Chương 05 – Sử dụng công cụ AI có kiểm chứng (Tài liệu tham khảo)','https://www.congdanso.edu.vn/assets/file/Ky%20nang%20so%20co%20ban%20Tai%20lieu%20huong%20dan%20cho%20giao%20vien%202.0.pdf'),
(60,270,'Chương 06 – Bài thực hành: hồ sơ thông tin đáng tin cậy (Tài liệu tham khảo)','https://www.congdanso.edu.vn/assets/file/Ky%20nang%20so%20co%20ban%20Tai%20lieu%20huong%20dan%20cho%20giao%20vien%202.0.pdf'),
(63,291,'Chương 01 – Tổng quan về đồ thị (Tài liệu tham khảo)','https://lic.haui.edu.vn/media/book%20Toan%20Th%E1%BB%A7y/Gi%C3%A1o%20tr%C3%ACnh%20to%C3%A1n%20r%E1%BB%9Di%20r%E1%BA%A1c.pdf'),
(63,292,'Chương 02 – Biểu diễn đồ thị (Tài liệu tham khảo)','https://lic.haui.edu.vn/media/book%20Toan%20Th%E1%BB%A7y/Gi%C3%A1o%20tr%C3%ACnh%20to%C3%A1n%20r%E1%BB%9Di%20r%E1%BA%A1c.pdf'),
(63,293,'Chương 03 – Các bài toán về đồ thị (phần 1) (Tài liệu tham khảo)','https://lic.haui.edu.vn/media/book%20Toan%20Th%E1%BB%A7y/Gi%C3%A1o%20tr%C3%ACnh%20to%C3%A1n%20r%E1%BB%9Di%20r%E1%BA%A1c.pdf'),
(63,294,'Chương 04 – Các bài toán về đồ thị (phần 2) (Tài liệu tham khảo)','https://lic.haui.edu.vn/media/book%20Toan%20Th%E1%BB%A7y/Gi%C3%A1o%20tr%C3%ACnh%20to%C3%A1n%20r%E1%BB%9Di%20r%E1%BA%A1c.pdf'),
(63,295,'Chương 05 – Bài toán tìm đường đi ngắn nhất (Tài liệu tham khảo)','https://lic.haui.edu.vn/media/book%20Toan%20Th%E1%BB%A7y/Gi%C3%A1o%20tr%C3%ACnh%20to%C3%A1n%20r%E1%BB%9Di%20r%E1%BA%A1c.pdf'),
(63,296,'Chương 06 – Bài toán tìm cây khung nhỏ nhất (Tài liệu tham khảo)','https://lic.haui.edu.vn/media/book%20Toan%20Th%E1%BB%A7y/Gi%C3%A1o%20tr%C3%ACnh%20to%C3%A1n%20r%E1%BB%9Di%20r%E1%BA%A1c.pdf'),
(63,297,'Chương 07 – Logic học – Mệnh đề và dạng mệnh đề (Tài liệu tham khảo)','https://lic.haui.edu.vn/media/book%20Toan%20Th%E1%BB%A7y/Gi%C3%A1o%20tr%C3%ACnh%20to%C3%A1n%20r%E1%BB%9Di%20r%E1%BA%A1c.pdf'),
(63,298,'Chương 08 – Logic học – Các luật suy diễn (Tài liệu tham khảo)','https://lic.haui.edu.vn/media/book%20Toan%20Th%E1%BB%A7y/Gi%C3%A1o%20tr%C3%ACnh%20to%C3%A1n%20r%E1%BB%9Di%20r%E1%BA%A1c.pdf'),
(63,299,'Chương 09 – Logic học – Vị từ (Tài liệu tham khảo)','https://lic.haui.edu.vn/media/book%20Toan%20Th%E1%BB%A7y/Gi%C3%A1o%20tr%C3%ACnh%20to%C3%A1n%20r%E1%BB%9Di%20r%E1%BA%A1c.pdf'),
(63,300,'Chương 10 – Phương pháp đếm – Tập hợp – Ánh xạ (Tài liệu tham khảo)','https://lic.haui.edu.vn/media/book%20Toan%20Th%E1%BB%A7y/Gi%C3%A1o%20tr%C3%ACnh%20to%C3%A1n%20r%E1%BB%9Di%20r%E1%BA%A1c.pdf'),
(63,301,'Chương 11 – Phương pháp đếm – Phép đếm – Giải tích tổ hợp (Tài liệu tham khảo)','https://lic.haui.edu.vn/media/book%20Toan%20Th%E1%BB%A7y/Gi%C3%A1o%20tr%C3%ACnh%20to%C3%A1n%20r%E1%BB%9Di%20r%E1%BA%A1c.pdf'),
(63,302,'Chương 12 – Phương pháp đếm (Tài liệu tham khảo)','https://lic.haui.edu.vn/media/book%20Toan%20Th%E1%BB%A7y/Gi%C3%A1o%20tr%C3%ACnh%20to%C3%A1n%20r%E1%BB%9Di%20r%E1%BA%A1c.pdf'),
(63,303,'Chương 13 – Quan hệ (phần 1) (Tài liệu tham khảo)','https://lic.haui.edu.vn/media/book%20Toan%20Th%E1%BB%A7y/Gi%C3%A1o%20tr%C3%ACnh%20to%C3%A1n%20r%E1%BB%9Di%20r%E1%BA%A1c.pdf'),
(63,304,'Chương 14 – Quan hệ (phần 2) (Tài liệu tham khảo)','https://lic.haui.edu.vn/media/book%20Toan%20Th%E1%BB%A7y/Gi%C3%A1o%20tr%C3%ACnh%20to%C3%A1n%20r%E1%BB%9Di%20r%E1%BA%A1c.pdf');
DO $audit$
DECLARE bad integer;
BEGIN
IF (SELECT count(*) FROM ref85)<>56 OR (SELECT count(DISTINCT course_id) FROM ref85)<>7 THEN RAISE EXCEPTION 'Wrong mapping count';END IF;
SELECT count(*) INTO bad FROM ref85 r LEFT JOIN lms.lessons l ON l.lesson_id=r.lesson_id WHERE l.lesson_id IS NULL OR l.course_id<>r.course_id OR COALESCE(l.is_deleted,false) OR NOT COALESCE(l.is_published,false) OR l.lesson_order<=1;
IF bad>0 THEN RAISE EXCEPTION 'Unsafe lesson mappings: %; rollback',bad;END IF;
IF EXISTS(SELECT 1 FROM ref85 GROUP BY lesson_id HAVING count(*)>1) THEN RAISE EXCEPTION 'Duplicate lessons in mapping';END IF;
RAISE NOTICE 'Validated 56 lesson topics in 7 courses; leaving all existing PDFs alone';
END $audit$;
WITH missing AS (
 SELECT x.*,row_number() OVER(PARTITION BY x.lesson_id ORDER BY x.resource_url) rn
 FROM ref85 x WHERE NOT EXISTS (SELECT 1 FROM lms.lesson_resources r WHERE r.lesson_id=x.lesson_id AND r.resource_type='PDF' AND split_part(r.resource_url,'#',1)=x.resource_url)
), bases AS (
 SELECT m.lesson_id,coalesce(max(r.display_order),0) mx FROM (SELECT DISTINCT lesson_id FROM missing) m LEFT JOIN lms.lesson_resources r ON r.lesson_id=m.lesson_id GROUP BY m.lesson_id
)
INSERT INTO lms.lesson_resources(lesson_id,resource_type,title,resource_url,display_order)
SELECT m.lesson_id,'PDF',m.display_title,m.resource_url,b.mx+m.rn FROM missing m JOIN bases b ON b.lesson_id=m.lesson_id;
DO $verify$
DECLARE bad integer;
BEGIN
SELECT count(*) INTO bad FROM ref85 x WHERE NOT EXISTS (SELECT 1 FROM lms.lesson_resources r WHERE r.lesson_id=x.lesson_id AND r.resource_type='PDF' AND split_part(r.resource_url,'#',1)=x.resource_url);
IF bad>0 THEN RAISE EXCEPTION 'Missing % external PDF references; rollback',bad;END IF;
RAISE NOTICE '56/56 lessons now have links to authentic external PDF references; existing notes untouched';
END $verify$;
COMMIT;
