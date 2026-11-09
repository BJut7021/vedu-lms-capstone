\set ON_ERROR_STOP on
BEGIN;
CREATE TEMP TABLE vedu_pdf80 (lesson_id bigint PRIMARY KEY, expected_url text NOT NULL, expected_title text, lesson_order integer NOT NULL) ON COMMIT DROP;
INSERT INTO vedu_pdf80(lesson_id,expected_url,expected_title,lesson_order) VALUES
  (233,'/course-materials/vedu-word-specific/01.pdf','01 · Tạo tài liệu và quản lý phiên bản',2),
  (234,'/course-materials/vedu-word-specific/02.pdf','02 · Cấu trúc báo cáo bằng Styles',3),
  (235,'/course-materials/vedu-word-specific/03.pdf','03 · Thực hành: biên bản họp và bảng phân công',4),
  (236,'/course-materials/vedu-word-specific/04.pdf','04 · Ôn tập: sửa năm lỗi thường gặp',5),
  (237,'/course-materials/vedu-word-specific/05.pdf','05 · Thực hành có hướng dẫn tiếng Việt',6),
  (238,'/course-materials/vedu-word-specific/06.pdf','06 · Dự án: hồ sơ đề xuất hoạt động nhóm',7),
  (239,'/course-materials/vedu-word-specific/07.pdf','07 · Mở rộng: nhận xét và kiểm soát bản sửa',8),
  (249,'/course-materials/vedu-powerpoint-specific/01.pdf','01 · Thông điệp và cấu trúc câu chuyện',2),
  (250,'/course-materials/vedu-powerpoint-specific/02.pdf','02 · Bố cục, tương phản và nguồn hình ảnh',3),
  (251,'/course-materials/vedu-powerpoint-specific/03.pdf','03 · Thực hành: biến bảng số thành thông điệp',4),
  (252,'/course-materials/vedu-powerpoint-specific/04.pdf','04 · Ôn tập: giản lược slide quá tải',5),
  (253,'/course-materials/vedu-powerpoint-specific/05.pdf','05 · Thực hành có hướng dẫn tiếng Việt',6),
  (254,'/course-materials/vedu-powerpoint-specific/06.pdf','06 · Dự án: pitch đề xuất trong 300 giây',7),
  (255,'/course-materials/vedu-powerpoint-specific/07.pdf','07 · Mở rộng: khả năng tiếp cận và bản bàn giao',8),
  (257,'/course-materials/vedu-digital-files-specific/01.pdf','01 · Tổ chức tệp và bản sao lưu',2),
  (258,'/course-materials/vedu-digital-files-specific/02.pdf','02 · Email công việc và nhận diện phishing',3),
  (259,'/course-materials/vedu-digital-files-specific/03.pdf','03 · Thực hành: ma trận quyền chia sẻ',4),
  (260,'/course-materials/vedu-digital-files-specific/04.pdf','04 · Ôn tập: phân loại năm tình huống số',5),
  (261,'/course-materials/vedu-digital-files-specific/05.pdf','05 · Tình huống: link tài liệu bị gửi nhầm',6),
  (262,'/course-materials/vedu-digital-files-specific/06.pdf','06 · Dự án: bộ quy tắc làm việc số cho nhóm',7),
  (263,'/course-materials/vedu-digital-files-specific/07.pdf','07 · Mở rộng: tối thiểu hóa dữ liệu và quyền riêng tư',8),
  (265,'/course-materials/vedu-digital-ai-specific/01.pdf','01 · Tìm kiếm thông tin có mục tiêu',2),
  (266,'/course-materials/vedu-digital-ai-specific/02.pdf','02 · Đánh giá nguồn và thời điểm công bố',3),
  (267,'/course-materials/vedu-digital-ai-specific/03.pdf','03 · Trích dẫn và sử dụng hình ảnh',4),
  (268,'/course-materials/vedu-digital-ai-specific/04.pdf','04 · Đọc bảng dữ liệu và biểu đồ',5),
  (269,'/course-materials/vedu-digital-ai-specific/05.pdf','05 · Sử dụng công cụ AI có kiểm chứng',6),
  (270,'/course-materials/vedu-digital-ai-specific/06.pdf','06 · Bài thực hành: hồ sơ thông tin đáng tin cậy',7),
  (226,'/course-materials/vedu-sad-practice/01.pdf','01 · Khảo sát và mô hình nghiệp vụ',2),
  (227,'/course-materials/vedu-sad-practice/02.pdf','02 · Đối tượng nghiệp vụ, tuần tự và cộng tác',3),
  (228,'/course-materials/vedu-sad-practice/03.pdf','03 · Use case hệ thống và đặc tả',4),
  (229,'/course-materials/vedu-sad-practice/04.pdf','04 · Class diagram mức phân tích',5),
  (230,'/course-materials/vedu-sad-practice/05.pdf','05 · Tinh chế lớp và thiết kế dữ liệu',6),
  (231,'/course-materials/vedu-sad-practice/06.pdf','06 · Thiết kế chức năng ba tầng và bàn giao',7),
  (283,'/course-materials/vedu-sad-theory/01.pdf','01 · Tổng quan về hệ thống thông tin',2),
  (284,'/course-materials/vedu-sad-theory/02.pdf','02 · Xác định yêu cầu',3),
  (285,'/course-materials/vedu-sad-theory/03.pdf','03 · Mô hình hóa nghiệp vụ',4),
  (286,'/course-materials/vedu-sad-theory/04.pdf','04 · Mô hình hóa chức năng',5),
  (287,'/course-materials/vedu-sad-theory/05.pdf','05 · Mô hình hóa cấu trúc',6),
  (288,'/course-materials/vedu-sad-theory/06.pdf','06 · Thiết kế lớp và dữ liệu',7),
  (289,'/course-materials/vedu-sad-theory/07.pdf','07 · Thiết kế chức năng hệ thống',8),
  (291,'/course-materials/vedu-discrete-specific/01.pdf','01 · Tổng quan về đồ thị',2),
  (292,'/course-materials/vedu-discrete-specific/02.pdf','02 · Biểu diễn đồ thị',3),
  (293,'/course-materials/vedu-discrete-specific/03.pdf','03 · Các bài toán về đồ thị (phần 1)',4),
  (294,'/course-materials/vedu-discrete-specific/04.pdf','04 · Các bài toán về đồ thị (phần 2)',5),
  (295,'/course-materials/vedu-discrete-specific/05.pdf','05 · Bài toán tìm đường đi ngắn nhất',6),
  (296,'/course-materials/vedu-discrete-specific/06.pdf','06 · Bài toán tìm cây khung nhỏ nhất',7),
  (297,'/course-materials/vedu-discrete-specific/07.pdf','07 · Logic học – Mệnh đề và dạng mệnh đề',8),
  (298,'/course-materials/vedu-discrete-specific/08.pdf','08 · Logic học – Các luật suy diễn',9),
  (299,'/course-materials/vedu-discrete-specific/09.pdf','09 · Logic học – Vị từ',10),
  (300,'/course-materials/vedu-discrete-specific/10.pdf','10 · Phương pháp đếm – Tập hợp – Ánh xạ',11),
  (301,'/course-materials/vedu-discrete-specific/11.pdf','11 · Phương pháp đếm – Phép đếm – Giải tích tổ hợp',12),
  (302,'/course-materials/vedu-discrete-specific/12.pdf','12 · Phương pháp đếm',13),
  (303,'/course-materials/vedu-discrete-specific/13.pdf','13 · Quan hệ (phần 1)',14),
  (304,'/course-materials/vedu-discrete-specific/14.pdf','14 · Quan hệ (phần 2)',15),
  (306,'/course-materials/vedu-network-specific/01.pdf','01 · Tổng quan về mạng máy tính',2),
  (307,'/course-materials/vedu-network-specific/02.pdf','02 · Mô hình OSI và giao thức truyền thông',3),
  (308,'/course-materials/vedu-network-specific/03.pdf','03 · Địa chỉ IP',4),
  (309,'/course-materials/vedu-network-specific/04.pdf','04 · VLSM và Subnetting',5),
  (310,'/course-materials/vedu-network-specific/05.pdf','05 · Tầng vật lý – Physical',6),
  (311,'/course-materials/vedu-network-specific/06.pdf','06 · Ethernet và Switching',7),
  (312,'/course-materials/vedu-network-specific/07.pdf','07 · Tầng mạng và giao thức IP',8),
  (313,'/course-materials/vedu-network-specific/08.pdf','08 · Tầng vận chuyển – TCP/UDP',9),
  (314,'/course-materials/vedu-network-specific/09.pdf','09 · Tầng ứng dụng',10),
  (315,'/course-materials/vedu-network-specific/10.pdf','10 · Xây dựng hệ thống mạng cơ bản',11),
  (241,'/course-materials/vedu-excel-specific/01.pdf','',2),
  (242,'/course-materials/vedu-excel-specific/02.pdf','',3),
  (243,'/course-materials/vedu-excel-specific/03.pdf','',4),
  (244,'/course-materials/vedu-excel-specific/04.pdf','',5),
  (245,'/course-materials/vedu-excel-specific/05.pdf','',6),
  (246,'/course-materials/vedu-excel-specific/06.pdf','',7),
  (247,'/course-materials/vedu-excel-specific/07.pdf','',8),
  (215,'/course-materials/vedu-network-admin-specific/01.pdf','',2),
  (216,'/course-materials/vedu-network-admin-specific/02.pdf','',3),
  (217,'/course-materials/vedu-network-admin-specific/03.pdf','',4),
  (218,'/course-materials/vedu-network-admin-specific/04.pdf','',5),
  (219,'/course-materials/vedu-network-admin-specific/05.pdf','',6),
  (220,'/course-materials/vedu-network-admin-specific/06.pdf','',7),
  (221,'/course-materials/vedu-network-admin-specific/07.pdf','',8),
  (222,'/course-materials/vedu-network-admin-specific/08.pdf','',9),
  (223,'/course-materials/vedu-network-admin-specific/09.pdf','',10),
  (224,'/course-materials/vedu-network-admin-specific/10.pdf','',11),
  (204,'/course-materials/vedu-ai-practice-specific/01.pdf','01 · Python nền tảng',2),
  (205,'/course-materials/vedu-ai-practice-specific/02.pdf','02 · BFS, DFS, UCS và giới hạn sâu',3),
  (206,'/course-materials/vedu-ai-practice-specific/03.pdf','03 · Heuristic, AKT và A*',4),
  (207,'/course-materials/vedu-ai-practice-specific/04.pdf','04 · Leo đồi và thuật toán di truyền',5),
  (208,'/course-materials/vedu-ai-practice-specific/05.pdf','05 · Minimax và alpha-beta',6),
  (209,'/course-materials/vedu-ai-practice-specific/06.pdf','06 · GTS và tô màu đồ thị',7),
  (210,'/course-materials/vedu-ai-practice-specific/07.pdf','07 · Logic mệnh đề, Vương Hạo và Robinson',8),
  (211,'/course-materials/vedu-ai-practice-specific/08.pdf','08 · Luật sinh và mạng ngữ nghĩa',9),
  (212,'/course-materials/vedu-ai-practice-specific/09.pdf','09 · Học máy có giám sát',10),
  (213,'/course-materials/vedu-ai-practice-specific/10.pdf','10 · Học không giám sát và K-means',11),
  (197,'/course-materials/vedu-deep-practice-specific/01.pdf','01 · Pandas và TensorFlow',2),
  (198,'/course-materials/vedu-deep-practice-specific/02.pdf','02 · ANN',3),
  (199,'/course-materials/vedu-deep-practice-specific/03.pdf','03 · CNN',4),
  (200,'/course-materials/vedu-deep-practice-specific/04.pdf','04 · Autoencoder',5),
  (201,'/course-materials/vedu-deep-practice-specific/05.pdf','05 · RNN',6),
  (202,'/course-materials/vedu-deep-practice-specific/06.pdf','06 · LSTM',7),
  (140,'/course-materials/vedu-deep-theory-specific/01.pdf','Tổng quan mạng học sâu',2),
  (141,'/course-materials/vedu-deep-theory-specific/02.pdf','Mạng truyền thẳng ANN',3),
  (142,'/course-materials/vedu-deep-theory-specific/03.pdf','Quy trình tối ưu và đánh giá',4),
  (143,'/course-materials/vedu-deep-theory-specific/04.pdf','Mạng tích chập và residual learning',5),
  (144,'/course-materials/vedu-deep-theory-specific/05.pdf','Mạng học chuỗi',6),
  (146,'/course-materials/vedu-data-mining-specific/01.pdf','Tiền xử lý dữ liệu',2),
  (147,'/course-materials/vedu-data-mining-specific/02.pdf','Apriori và luật kết hợp',3),
  (148,'/course-materials/vedu-data-mining-specific/03.pdf','Phân loại và đánh giá',4),
  (149,'/course-materials/vedu-data-mining-specific/04.pdf','Phân cụm K-means',5),
  (150,'/course-materials/vedu-data-mining-specific/05.pdf','Tương quan, kiểm định, hồi quy',6),
  (152,'/course-materials/vedu-software-testing-specific/01.pdf','01 · Tổng quan kiểm thử',2),
  (153,'/course-materials/vedu-software-testing-specific/02.pdf','02 · Quy trình và kế hoạch kiểm thử',3),
  (154,'/course-materials/vedu-software-testing-specific/03.pdf','03 · Thiết kế test case và test data',4),
  (155,'/course-materials/vedu-software-testing-specific/04.pdf','04 · Unit test với NUnit/JUnit',5),
  (156,'/course-materials/vedu-software-testing-specific/05.pdf','05 · BDD và Gherkin',6),
  (157,'/course-materials/vedu-software-testing-specific/06.pdf','06 · Kiểm thử UI với Selenium IDE',7),
  (158,'/course-materials/vedu-software-testing-specific/07.pdf','07 · Kiểm thử API với Postman',8),
  (159,'/course-materials/vedu-software-testing-specific/08.pdf','08 · Thực thi, báo lỗi và hồi quy',9),
  (170,'/course-materials/vedu-open-source-specific/01.pdf','01 · PHP và môi trường',2),
  (171,'/course-materials/vedu-open-source-specific/02.pdf','02 · OOP trong PHP',3),
  (172,'/course-materials/vedu-open-source-specific/03.pdf','03 · JavaScript, DOM và AJAX',4),
  (173,'/course-materials/vedu-open-source-specific/04.pdf','04 · MySQL và PDO',5),
  (174,'/course-materials/vedu-open-source-specific/05.pdf','05 · MySQL nâng cao',6),
  (175,'/course-materials/vedu-open-source-specific/06.pdf','06 · Laravel và MVC',7),
  (176,'/course-materials/vedu-open-source-specific/07.pdf','07 · Routing, Controller và Blade',8),
  (177,'/course-materials/vedu-open-source-specific/08.pdf','08 · Migration, Eloquent và quan hệ',9),
  (178,'/course-materials/vedu-open-source-specific/09.pdf','09 · Validation và phân quyền',10),
  (179,'/course-materials/vedu-open-source-specific/10.pdf','10 · Website tin tức và triển khai',11),
  (191,'/course-materials/vedu-big-data-specific/01.pdf','01 · Tổng quan dữ liệu lớn',2),
  (192,'/course-materials/vedu-big-data-specific/02.pdf','02 · Phân tích liên kết: PageRank và HITS',3),
  (193,'/course-materials/vedu-big-data-specific/03.pdf','03 · Cluster, DFS, sharding và replication',4),
  (194,'/course-materials/vedu-big-data-specific/04.pdf','04 · MapReduce, Spark RDD, DataFrame và luồng',5),
  (195,'/course-materials/vedu-big-data-specific/05.pdf','05 · Phân lớp, hồi quy, lọc cộng tác và phân tích',6),
  (161,'/course-materials/vedu-programming-techniques-specific/01.pdf','01 · Phong cách lập trình, ngoại lệ và tập tin',2),
  (162,'/course-materials/vedu-programming-techniques-specific/02.pdf','02 · Mảng một chiều: tổng, đếm, tìm kiếm, min/max',3),
  (163,'/course-materials/vedu-programming-techniques-specific/03.pdf','03 · Sắp xếp, thêm và xóa phần tử',4),
  (164,'/course-materials/vedu-programming-techniques-specific/04.pdf','04 · Mảng hai chiều và ma trận',5),
  (165,'/course-materials/vedu-programming-techniques-specific/05.pdf','05 · Chuỗi cơ bản, chuẩn hóa và token',6),
  (166,'/course-materials/vedu-programming-techniques-specific/06.pdf','06 · Tìm kiếm, đếm và thay thế chuỗi con',7),
  (167,'/course-materials/vedu-programming-techniques-specific/07.pdf','07 · Đệ quy tuyến tính và nhị phân',8),
  (168,'/course-materials/vedu-programming-techniques-specific/08.pdf','08 · Đệ quy lồng, hỗ tương và ứng dụng',9),
  (181,'/course-materials/vedu-python-specific/01.pdf','',2),
  (182,'/course-materials/vedu-python-specific/02.pdf','',3),
  (183,'/course-materials/vedu-python-specific/03.pdf','',4),
  (184,'/course-materials/vedu-python-specific/04.pdf','',5),
  (185,'/course-materials/vedu-python-specific/05.pdf','',6),
  (186,'/course-materials/vedu-python-specific/06.pdf','',7),
  (187,'/course-materials/vedu-python-specific/07.pdf','',8),
  (188,'/course-materials/vedu-python-specific/08.pdf','',9),
  (189,'/course-materials/vedu-python-specific/09.pdf','',10),
  (129,'/course-materials/vedu-dsa-specific/01.pdf','Tổng quan về cấu trúc dữ liệu',2),
  (130,'/course-materials/vedu-dsa-specific/02.pdf','Phân tích độ phức tạp thuật toán',3),
  (131,'/course-materials/vedu-dsa-specific/03.pdf','Đệ quy và điều kiện dừng',4),
  (132,'/course-materials/vedu-dsa-specific/04.pdf','Mảng và danh sách tuyến tính',5),
  (133,'/course-materials/vedu-dsa-specific/05.pdf','Danh sách liên kết',6),
  (134,'/course-materials/vedu-dsa-specific/06.pdf','Ngăn xếp Stack',7),
  (135,'/course-materials/vedu-dsa-specific/07.pdf','Hàng đợi Queue',8),
  (136,'/course-materials/vedu-dsa-specific/08.pdf','Cây nhị phân và duyệt cây',9),
  (137,'/course-materials/vedu-dsa-specific/09.pdf','Tìm kiếm tuyến tính và nhị phân',10),
  (138,'/course-materials/vedu-dsa-specific/10.pdf','Thuật toán sắp xếp',11),
  (272,'/course-materials/vedu-oop-specific/01.pdf','Tổng quan lập trình hướng đối tượng với C#',2),
  (273,'/course-materials/vedu-oop-specific/02.pdf','Lớp, đối tượng và constructor',3),
  (274,'/course-materials/vedu-oop-specific/03.pdf','Thành viên static và phạm vi truy cập',4),
  (275,'/course-materials/vedu-oop-specific/04.pdf','Collection và generic trong C#',5),
  (276,'/course-materials/vedu-oop-specific/05.pdf','Kế thừa và tái sử dụng',6),
  (277,'/course-materials/vedu-oop-specific/06.pdf','Đa hình và virtual/override',7),
  (278,'/course-materials/vedu-oop-specific/07.pdf','Interface và lớp trừu tượng',8),
  (279,'/course-materials/vedu-oop-specific/08.pdf','Mô hình ba lớp và tách trách nhiệm',9),
  (280,'/course-materials/vedu-oop-specific/09.pdf','Nguyên tắc SOLID và thiết kế lớp',10),
  (281,'/course-materials/vedu-oop-specific/10.pdf','Design Patterns cơ bản',11);
DO $validate$
DECLARE wrong integer; matched integer;
BEGIN
 IF (SELECT count(*) FROM vedu_pdf80)<>167 THEN RAISE EXCEPTION 'Expected 167 rows'; END IF;
 -- Lesson titles may have been edited/renamed in live VEDU, so do NOT compare to an older snapshot title.
 -- Instead ensure mapping includes EXACTLY all 167 published main lessons, no missing or foreign lessons.
 SELECT count(*) INTO wrong FROM vedu_pdf80 m LEFT JOIN lms.lessons l ON l.lesson_id=m.lesson_id
 WHERE l.lesson_id IS NULL OR l.course_id NOT BETWEEN 44 AND 64
 OR l.lesson_order<=1 OR NOT l.is_published OR l.is_deleted;
 IF wrong>0 THEN RAISE EXCEPTION 'Target lesson scope mismatches: %; no modifications',wrong; END IF;
 SELECT count(*) INTO wrong FROM lms.lessons l
 WHERE l.course_id BETWEEN 44 AND 64 AND l.lesson_order>1 AND l.is_published AND NOT l.is_deleted
 AND NOT EXISTS (SELECT 1 FROM vedu_pdf80 m WHERE m.lesson_id=l.lesson_id);
 IF wrong>0 THEN RAISE EXCEPTION 'Main lessons missing in PDF mapping: %; no modifications',wrong; END IF;
 -- The former snapshot title/order are only diagnostic, not authoritative after edits.
 SELECT count(*) INTO wrong FROM vedu_pdf80 m JOIN lms.lessons l USING (lesson_id)
 WHERE l.lesson_order<>m.lesson_order OR (m.expected_title<>'' AND l.title<>m.expected_title);
 RAISE NOTICE 'Live lesson title/order differs from original PDF mapping on % lessons; accepting current lesson metadata',wrong;
 SELECT count(*) INTO matched FROM vedu_pdf80 m WHERE EXISTS
  (SELECT 1 FROM lms.lesson_resources r WHERE r.lesson_id=m.lesson_id
  AND r.resource_url=m.expected_url AND r.resource_type='PDF');
 IF matched<>167 THEN RAISE EXCEPTION 'Matching lesson-specific PDF links: %/167; stopped without modifying',matched; END IF;
 RAISE NOTICE 'Validated all 167 lessons and exact PDF URLs';
END $validate$;
CREATE TEMP TABLE vedu_pdf80_keep ON COMMIT DROP AS
SELECT m.lesson_id,MIN(r.resource_id) AS resource_id
FROM vedu_pdf80 m JOIN lms.lesson_resources r ON r.lesson_id=m.lesson_id
AND r.resource_type='PDF' AND r.resource_url=m.expected_url GROUP BY m.lesson_id;
DO $check$ BEGIN IF (SELECT count(*) FROM vedu_pdf80_keep)<>167 THEN RAISE EXCEPTION 'Keep mapping not complete'; END IF; END $check$;
UPDATE lms.lesson_resources r SET title='VEDU - PDF bài học: '||l.title
FROM vedu_pdf80_keep k JOIN lms.lessons l ON l.lesson_id=k.lesson_id
WHERE r.resource_id=k.resource_id AND r.title IS DISTINCT FROM 'VEDU - PDF bài học: '||l.title;
-- Remove legacy/shared PDF resource LINKS only within exactly these 167 published main lessons.
-- Preserve videos, YouTube links, HTML slides, quiz records, files on disk, intro lessons.
DELETE FROM lms.lesson_resources r USING vedu_pdf80_keep k
WHERE r.lesson_id=k.lesson_id AND r.resource_id<>k.resource_id
AND (r.resource_type='PDF' OR r.resource_url ~* '\.pdf([?#].*)?$' OR r.resource_url ILIKE 'vedu-file:%.pdf');
DO $verify$
DECLARE n integer;
BEGIN
 SELECT count(*) INTO n FROM vedu_pdf80 m WHERE
   (SELECT count(*) FROM lms.lesson_resources r WHERE r.lesson_id=m.lesson_id
    AND (r.resource_type='PDF' OR r.resource_url ~* '\.pdf([?#].*)?$' OR r.resource_url ILIKE 'vedu-file:%.pdf'))=1
 AND EXISTS(SELECT 1 FROM lms.lesson_resources r WHERE r.lesson_id=m.lesson_id
    AND r.resource_type='PDF' AND r.resource_url=m.expected_url);
 IF n<>167 THEN RAISE EXCEPTION 'Final lesson PDF validation failed %/167',n; END IF;
 RAISE NOTICE 'Verified exactly one correct lesson-specific PDF on 167/167 lessons';
END $verify$;
COMMIT;
