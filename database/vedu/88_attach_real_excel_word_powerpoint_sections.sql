\set ON_ERROR_STOP on
BEGIN;
CREATE TEMP TABLE map88(course_id bigint,lesson_id bigint,old_url text,old_title text,new_url text,new_title text) ON COMMIT DROP;
INSERT INTO map88 VALUES
(56,235,'https://cdn-dynmedia-1.microsoft.com/is/content/microsoftcorp/microsoft/bade/documents/products-and-services/en-us/education/Quick-Guide-Word-July2025-Final.pdf','Microsoft Word – Hướng dẫn nhanh (tham khảo chung, chưa theo chương)','https://www.iuv.edu.vn/cms/plugin_upload/download/news/1462/1090/tin-hoc-dai-cuong-1-1.pdf','Bài 3 – Word, mục 3.6: Lập bảng và soạn tài liệu'),
(56,236,'https://cdn-dynmedia-1.microsoft.com/is/content/microsoftcorp/microsoft/bade/documents/products-and-services/en-us/education/Quick-Guide-Word-July2025-Final.pdf','Microsoft Word – Hướng dẫn nhanh (tham khảo chung, chưa theo chương)','https://www.iuv.edu.vn/cms/plugin_upload/download/news/1462/1090/tin-hoc-dai-cuong-1-1.pdf','Bài 3 – Word, mục 3.4: Định dạng văn bản'),
(57,241,'https://thuvienso.tcdktcnsl.edu.vn/files/products/giao_trinh_tin_hoc_van_phong_microsoft_excel_c7e.pdf','Giáo trình Microsoft Excel – Tài liệu tham khảo chung','https://www.iuv.edu.vn/cms/plugin_upload/download/news/1462/1090/tin-hoc-dai-cuong-1-1.pdf','Bài 4 – Excel, mục 4.1: Làm quen và quản lý bảng tính'),
(57,242,'https://thuvienso.tcdktcnsl.edu.vn/files/products/giao_trinh_tin_hoc_van_phong_microsoft_excel_c7e.pdf','Giáo trình Microsoft Excel – Tài liệu tham khảo chung','https://www.iuv.edu.vn/cms/plugin_upload/download/news/1462/1090/tin-hoc-dai-cuong-1-1.pdf','Bài 4 – Excel, mục 4.3–4.4: Nhập và định dạng bảng tính'),
(57,243,'https://thuvienso.tcdktcnsl.edu.vn/files/products/giao_trinh_tin_hoc_van_phong_microsoft_excel_c7e.pdf','Giáo trình Microsoft Excel – Tài liệu tham khảo chung','https://www.iuv.edu.vn/cms/plugin_upload/download/news/1462/1090/tin-hoc-dai-cuong-1-1.pdf','Bài 4 – Excel, mục 4.5.2: SUM và các hàm thống kê'),
(57,244,'https://thuvienso.tcdktcnsl.edu.vn/files/products/giao_trinh_tin_hoc_van_phong_microsoft_excel_c7e.pdf','Giáo trình Microsoft Excel – Tài liệu tham khảo chung','https://www.iuv.edu.vn/cms/plugin_upload/download/news/1462/1090/tin-hoc-dai-cuong-1-1.pdf','Bài 4 – Excel, mục 4.5.2: COUNT và các hàm thống kê'),
(57,245,'https://thuvienso.tcdktcnsl.edu.vn/files/products/giao_trinh_tin_hoc_van_phong_microsoft_excel_c7e.pdf','Giáo trình Microsoft Excel – Tài liệu tham khảo chung','https://www.iuv.edu.vn/cms/plugin_upload/download/news/1462/1090/tin-hoc-dai-cuong-1-1.pdf','Bài 4 – Excel, mục 4.5.3: Hàm điều kiện IF'),
(57,246,'https://thuvienso.tcdktcnsl.edu.vn/files/products/giao_trinh_tin_hoc_van_phong_microsoft_excel_c7e.pdf','Giáo trình Microsoft Excel – Tài liệu tham khảo chung','https://www.iuv.edu.vn/cms/plugin_upload/download/news/1462/1090/tin-hoc-dai-cuong-1-1.pdf','Bài 4 – Excel, mục 4.5.2: Hàm xử lý chuỗi'),
(57,247,'https://thuvienso.tcdktcnsl.edu.vn/files/products/giao_trinh_tin_hoc_van_phong_microsoft_excel_c7e.pdf','Giáo trình Microsoft Excel – Tài liệu tham khảo chung','https://www.iuv.edu.vn/cms/plugin_upload/download/news/1462/1090/tin-hoc-dai-cuong-1-1.pdf','Bài 4 – Excel, mục 4.5.6: VLOOKUP và HLOOKUP'),
(58,250,'https://cdn-dynmedia-1.microsoft.com/is/content/microsoftcorp/microsoft/bade/documents/products-and-services/en-us/education/Quick-Guide-Powerpoint-July2025-Final.pdf','Microsoft PowerPoint – Hướng dẫn nhanh (tham khảo chung, chưa theo chương)','https://uet.vnu.edu.vn/~hoainam/Tai_lieu_PowerPoint.pdf','Phần III – PowerPoint: Bố cục slide và chèn hình ảnh'),
(58,253,'https://cdn-dynmedia-1.microsoft.com/is/content/microsoftcorp/microsoft/bade/documents/products-and-services/en-us/education/Quick-Guide-Powerpoint-July2025-Final.pdf','Microsoft PowerPoint – Hướng dẫn nhanh (tham khảo chung, chưa theo chương)','https://uet.vnu.edu.vn/~hoainam/PP_Bai_Thuc_Hanh_POWERPOINT.pdf','Bài thực hành 2–3 – PowerPoint: Thiết kế và hiệu ứng');
DO $pre$
DECLARE n int;
BEGIN
 IF (SELECT count(*) FROM map88)<>11 OR (SELECT count(DISTINCT course_id) FROM map88)<>3 THEN RAISE EXCEPTION 'Bad mapping cardinality'; END IF;
 IF EXISTS (SELECT 1 FROM map88 GROUP BY lesson_id HAVING count(*)>1) THEN RAISE EXCEPTION 'Duplicate lesson mapping';END IF;
 SELECT count(*) INTO n FROM map88 m LEFT JOIN lms.lessons l ON l.lesson_id=m.lesson_id WHERE l.lesson_id IS NULL OR l.course_id<>m.course_id OR COALESCE(l.is_deleted,false) OR NOT COALESCE(l.is_published,false);
 IF n>0 THEN RAISE EXCEPTION 'Lesson mismatches %; rollback',n; END IF;
 SELECT count(*) INTO n FROM map88 m WHERE NOT EXISTS(SELECT 1 FROM lms.lesson_resources r WHERE r.lesson_id=m.lesson_id AND r.resource_type='PDF' AND ((r.resource_url=m.old_url AND r.title=m.old_title) OR (r.resource_url=m.new_url AND r.title=m.new_title)));
 IF n>0 THEN RAISE EXCEPTION 'Missing or modified original external PDF resources %; rollback',n;END IF;
 SELECT count(*) INTO n FROM map88 m JOIN lms.lesson_resources r ON r.lesson_id=m.lesson_id AND r.resource_type='PDF' AND r.resource_url IN(m.old_url,m.new_url) WHERE r.title NOT IN (m.old_title,m.new_title);
 IF n>0 THEN RAISE EXCEPTION 'Unexpected PDF title overrides %; rollback',n;END IF;
 RAISE NOTICE 'Validated all 11 specific lesson mapping rows; no PDF rows will be deleted';
END $pre$;
UPDATE lms.lesson_resources r SET title=m.new_title,resource_url=m.new_url
FROM map88 m
WHERE r.lesson_id=m.lesson_id AND r.resource_type='PDF' AND r.resource_url=m.old_url AND r.title=m.old_title
AND NOT EXISTS(SELECT 1 FROM lms.lesson_resources already WHERE already.lesson_id=m.lesson_id AND already.resource_type='PDF' AND already.resource_url=m.new_url AND already.title=m.new_title);
DO $post$
DECLARE n int;
BEGIN
 SELECT count(*) INTO n FROM map88 m WHERE NOT EXISTS(SELECT 1 FROM lms.lesson_resources r WHERE r.lesson_id=m.lesson_id AND r.resource_type='PDF' AND r.resource_url=m.new_url AND r.title=m.new_title);
 IF n>0 THEN RAISE EXCEPTION 'Postcheck failed on % PDF mappings; rollback',n;END IF;
 RAISE NOTICE 'Verified 11/11 target PDF references; 21 other lessons unchanged';
END $post$;
COMMIT;
