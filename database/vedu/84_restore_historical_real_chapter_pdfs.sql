\set ON_ERROR_STOP on
BEGIN;
CREATE TEMP TABLE restore84(lesson_id bigint, display_title text, resource_url text) ON COMMIT DROP;
INSERT INTO restore84 VALUES
 (140, '01 - Chap 1- Tong quan.pdf', 'vedu-file:8d16249c-8f0c-9db3-22b8-e4d89f570d6b.pdf'),
 (141, '02 - Chap 2 - Mang neural nhan tao - ann.pdf', 'vedu-file:c2441b8a-8693-4cba-fae0-25f143383b21.pdf'),
 (142, '03 - Chap 3- Huan luyen mang noron.pdf', 'vedu-file:c1833bb7-4085-e82b-3ba9-d4b07753c60b.pdf'),
 (143, '04 - Chap 4- CNN.pdf', 'vedu-file:bc69c51a-50b7-3625-5f73-003e5177d2d1.pdf'),
 (144, 'Tối ưu huấn luyện mạng NN (TKT).pdf', 'vedu-file:bfdec83b-e18f-92f2-282a-e5e84dc0c880.pdf'),
 (146, 'Chuong I_Tổng quan về khai thác dữ liệu.pdf', 'vedu-file:4e91d7cf-9f46-4c59-5468-49329033a255.pdf'),
 (147, 'Chuong II_Tập phổ biến và luật kết hợp.pdf', 'vedu-file:71db5cd1-c144-9ab9-ef77-18e1c76a9839.pdf'),
 (148, 'Chuong III_Phân lớp dữ liệu -31.pdf', 'vedu-file:6ca576f1-25af-c3df-b7ea-ca971761f6b6.pdf'),
 (149, 'Chuong IV_Gom cụm dữ liệu.pdf', 'vedu-file:5282b5e1-9365-bdfe-f098-b7fe65ad70dc.pdf'),
 (150, 'Chuong V_Phân tích tương quan và hồi quy.pdf', 'vedu-file:4fdb9f4c-2354-0c2f-4dd0-0b388fd559a1.pdf'),
 (171, 'LTMNM_Chuong2.pdf', 'vedu-file:d8767e4d-577c-2a53-0255-ac24aebf45da.pdf'),
 (172, 'LTMNM_Chuong3.pdf', 'vedu-file:1fd2bfc9-f849-c674-7262-c665fd01fb84.pdf'),
 (174, 'LTMNM_Chuong5.pdf', 'vedu-file:3676628e-e6fb-cb9d-039a-9c685b0eca48.pdf'),
 (175, 'LTMNM_Chuong6.pdf', 'vedu-file:f344b198-287c-7d4c-f0ef-69bfda0d9417.pdf'),
 (176, 'LTMNM_Chuong7.pdf', 'vedu-file:ba414f49-8522-3449-4b14-54001a0afbe5.pdf'),
 (177, 'LTMNM_Chuong8.pdf', 'vedu-file:1d646770-6563-0b4c-dca6-068c56daa120.pdf'),
 (178, 'LTMNM_Chuong9.pdf', 'vedu-file:9d4de073-1419-6d87-f594-7208dfc61420.pdf'),
 (179, 'LTMNM_Chuong10.pdf', 'vedu-file:ea9a984d-747e-ee1c-51f7-60c633b43bfa.pdf'),
 (191, 'C1_Tong quan.pdf', 'vedu-file:d481e969-9d90-aac1-5ace-937ec810b203.pdf'),
 (192, 'C2_Links analysis.pdf', 'vedu-file:82c346e3-58a8-8dd9-195a-e3efc0962438.pdf'),
 (194, 'Chuong_4_Xu_ly_du_lieu_lon_tren_Apache_Spark.pdf', 'vedu-file:8c533cc4-c2dc-b7fd-876a-15f07a98a14b.pdf'),
 (195, '2019_Mining of Massive Datasets.pdf', 'vedu-file:4b2198f8-2e16-f84a-494e-36d17c7a8224.pdf'),
 (197, 'Lab_1_Tensorflow.pdf', 'vedu-file:a426434b-2383-c482-096c-bf6a7a47ed8e.pdf'),
 (197, 'Lab_1_Numpy_Pandas_ver1.pdf', 'vedu-file:ca452bb3-bc9a-06cb-e000-0dc41735c7fa.pdf'),
 (198, 'Lab_2_ANN.pdf', 'vedu-file:13e564db-c7dc-c1b9-02b4-10962b9a3a13.pdf'),
 (199, 'Lab_3_CNN.pdf', 'vedu-file:244e6664-dafd-2e00-c2ea-3fc3fde7d95a.pdf'),
 (200, 'Lab_4_AutoEncoder (1).pdf', 'vedu-file:b7f1c923-aacb-9a83-5822-5855cf42c115.pdf'),
 (201, 'Lab_5_RNN.pdf', 'vedu-file:8950bf7f-c382-b8b8-5d73-d123287ca7e9.pdf'),
 (202, 'Lab_6_LSTM_ver1.pdf', 'vedu-file:8fb46df8-68c2-98f7-0f85-fb0305163aa4.pdf'),
 (204, 'Tuan1_Gioi thieu Python.docx.pdf', 'vedu-file:1f40cf0c-bdd4-508c-d43d-125397bdc345.pdf'),
 (205, 'Tuan2_Tim kiem theo AKT và A-star.pdf', 'vedu-file:8d9550fc-3a2c-5b18-2235-f77bbb65df10.pdf'),
 (206, 'Tuan3_Tim kiem doi khang.docx (1).pdf', 'vedu-file:3900c847-55ec-fb07-f1c9-a86c13fe5454.pdf'),
 (215, '20412D-Lab01-Ex01-Configuring Advanced DHCP Settings-Template.pdf', 'vedu-file:36af74d6-5d23-0671-9bb3-aa8ad621f19a.pdf'),
 (216, '20412D-Lab01-Ex02-Configuring Advanced DNS Settings-Template.pdf', 'vedu-file:837a3e29-17e3-a575-c56d-259bf50557fa.pdf'),
 (217, '20412D-Lab01-Ex03-Configuring IPAM-Template.pdf', 'vedu-file:cb777041-1d9e-a5aa-73f5-f7fc2b6ad591.pdf'),
 (218, '20412D-Lab02A-Ex01-Configuring iSCSI Storage-Template.pdf', 'vedu-file:76f23f2d-d8ef-65ce-7447-7e687a0e7506.pdf'),
 (219, '20412D-Lab02A-Ex02-Configuring the File Classification Infrastructure-Template.pdf', 'vedu-file:4913584c-daf6-c210-ce8f-6ea0207c68b2.pdf'),
 (220, '20412D-Lab02B-Ex01-Configuring the Main Office Servers for BranchCache-Template.pdf', 'vedu-file:284cbf2e-1ec9-93ea-041f-8b9cdb512cce.pdf'),
 (220, '20412D-Lab02B-Ex02-Configuring the Branch Office Servers for BranchCache-Template.pdf', 'vedu-file:60e12548-458a-a3f6-a4f0-d285c78213b3.pdf'),
 (220, '20412D-Lab02B-Ex04-Monitoring BranchCache-Template.pdf', 'vedu-file:c83acebb-867e-7745-8a22-f310f744fa53.pdf'),
 (220, '20412D-Lab02B-Ex03-Configuring Client Computers for BranchCache-Template.pdf', 'vedu-file:d24387d1-1f12-a7e6-48ef-6b760458b4f5.pdf'),
 (221, '20412D-Lab03-Ex03-Validating and Remediating DAC-Template.pdf', 'vedu-file:1e0079e7-fd4b-2998-9503-e19375e45102.pdf'),
 (221, '20412D-Lab03-Ex02-Implementing DAC-Template.pdf', 'vedu-file:6acd7d65-9502-93c5-1e0d-8e01ed46c195.pdf'),
 (221, '20412D-Lab03-Ex01-Preparing for DAC Deployment-Template.pdf', 'vedu-file:7d0fa5bc-64fc-cbe8-1d3f-6c235e10fdef.pdf'),
 (222, '20412D-Lab03-Ex04-Implementing Work Folders-Template.pdf', 'vedu-file:b0bdea07-2c78-72a1-f597-868c5524f5f5.pdf'),
 (223, '20412D-Lab04-Ex02-Implementing Forest Trusts-Template.pdf', 'vedu-file:643c2ac1-919a-78a4-8a0b-a28147cb0607.pdf'),
 (223, '20412D-Lab04-Ex01-Implementing Child Domains in AD DS-Template.pdf', 'vedu-file:b8f38173-520d-7cac-e97b-f0ae93a5fc4f.pdf'),
 (224, '20412D-Lab05-Ex04-Monitoring and Troubleshooting AD DS Replication-Template.pdf', 'vedu-file:06a800e3-051f-3355-7ba0-c1cde0e4e3c3.pdf'),
 (224, '20412D-Lab05-Ex01-Modifying the Default Site-Template.pdf', 'vedu-file:1097cfe2-234a-4ad5-b906-8c896a5a8eb4.pdf'),
 (224, '20412D-Lab05-Ex02-Creating Additional Sites and Subnets-Template.pdf', 'vedu-file:91446aef-e087-58c4-5368-aa211dacc1c8.pdf'),
 (224, '20412D-Lab05-Ex03-Configuring AD DS Replication-Template.pdf', 'vedu-file:fefead45-2c94-395c-8a6f-c12c819c9625.pdf'),
 (226, 'Bai giang TH PTTK HT_14DHTH.pdf', 'vedu-file:05e207b6-3812-6e81-1b4d-e464def11d6e.pdf'),
 (227, 'Bai giang TH PTTK HT_14DHTH.pdf', 'vedu-file:05e207b6-3812-6e81-1b4d-e464def11d6e.pdf'),
 (228, 'Bai giang TH PTTK HT_14DHTH.pdf', 'vedu-file:05e207b6-3812-6e81-1b4d-e464def11d6e.pdf'),
 (229, 'Bai giang TH PTTK HT_14DHTH.pdf', 'vedu-file:05e207b6-3812-6e81-1b4d-e464def11d6e.pdf'),
 (230, 'Bai giang TH PTTK HT_14DHTH.pdf', 'vedu-file:05e207b6-3812-6e81-1b4d-e464def11d6e.pdf'),
 (231, 'Bai giang TH PTTK HT_14DHTH.pdf', 'vedu-file:05e207b6-3812-6e81-1b4d-e464def11d6e.pdf'),
 (283, 'Chuong 1_PTTKHTTT_Tong quan ve HTTT.pdf', 'vedu-file:3d5488ae-b74d-28f5-4150-e729b32cc40d.pdf'),
 (284, 'Chuong 2_PTTKHTTT_Xac dinh yeu cau.pdf', 'vedu-file:9810bd4f-fb73-fc46-27ae-e1195ea4bba8.pdf'),
 (285, 'Chuong 3_PTTKHTTT_Mo hinh hoa nghiep vu.pdf', 'vedu-file:9ce71489-8257-5352-58d0-2c7ded1ea084.pdf'),
 (286, 'Chuong 4_PTTKHTTT_Mo hinh hoa chuc nang.pdf', 'vedu-file:b9c9b494-37c2-04ab-947f-4a2a6686ec29.pdf'),
 (287, 'Chuong 5_PTTKHTTT_Mo hinh hoa cau truc.pdf', 'vedu-file:6f8641cb-a775-7074-15f1-061f2eaea0fc.pdf'),
 (288, 'Chuong 6_PTTKHTTT_Thiet ke lop du lieu.pdf', 'vedu-file:090274d7-1ebd-494b-4065-4b2508633114.pdf'),
 (289, 'Chuong 7_PTTKHTTT_Thiet ke chuc nang he thong - Copy.pdf', 'vedu-file:6f53bf01-b9a9-ba70-bc3b-1a94bc730a3a.pdf'),
 (306, 'Chương 01 – Bài giảng gốc mạng máy tính', 'https://itc.edu.vn/Data/Sites/1/media/thongbao/2026/Dao%20tao/Kiemdinh/Baigiang/co_ly/B%C3%A0i%201_T%E1%BB%95ng%20quan%20v%E1%BB%81%20m%E1%BA%A1ng%20m%C3%A1y%20t%C3%ADnh.pdf'),
 (307, 'Chương 02 – Bài giảng gốc mạng máy tính', 'https://itc.edu.vn/Data/Sites/1/media/thongbao/2026/Dao%20tao/Kiemdinh/Baigiang/co_ly/B%C3%A0i%202_M%C3%B4%20h%C3%ACnh%20OSI%20v%C3%A0%20giao%20th%E1%BB%A9c%20truy%E1%BB%81n%20th%C3%B4ng%20tr%C3%AAn%20h%E1%BB%87%20th%E1%'),
 (308, 'Chương 03 – Bài giảng gốc mạng máy tính', 'https://itc.edu.vn/Data/Sites/1/media/thongbao/2026/Dao%20tao/Kiemdinh/Baigiang/co_ly/B%C3%A0i%203_%C4%90%E1%BB%8Ba%20ch%E1%BB%89%20IP.pdf'),
 (309, 'Chương 04 – Bài giảng gốc mạng máy tính', 'https://itc.edu.vn/Data/Sites/1/media/thongbao/2026/Dao%20tao/Kiemdinh/Baigiang/co_ly/B%C3%A0i%204_VLSM%20-%20Subnetting.pdf'),
 (310, 'Chương 05 – Bài giảng gốc mạng máy tính', 'https://itc.edu.vn/Data/Sites/1/media/thongbao/2026/Dao%20tao/Kiemdinh/Baigiang/co_ly/B%C3%A0i%205_Gi%E1%BB%9Bi%20thi%E1%BB%87u%20t%E1%BA%A7ng%20Physical.pdf'),
 (311, 'Chương 06 – Bài giảng gốc mạng máy tính', 'https://itc.edu.vn/Data/Sites/1/media/thongbao/2026/Dao%20tao/Kiemdinh/Baigiang/co_ly/B%C3%A0i%206_T%E1%BA%A7ng%20Datalink%20-%20Ethernet%20-%20Switching.pdf'),
 (312, 'Chương 07 – Bài giảng gốc mạng máy tính', 'https://itc.edu.vn/Data/Sites/1/media/thongbao/2026/Dao%20tao/Kiemdinh/Baigiang/co_ly/B%C3%A0i%207_T%E1%BA%A7ng%20Network%20v%C3%A0%20IP.pdf'),
 (313, 'Chương 08 – Bài giảng gốc mạng máy tính', 'https://itc.edu.vn/Data/Sites/1/media/thongbao/2026/Dao%20tao/Kiemdinh/Baigiang/co_ly/B%C3%A0i%208_Transport%20-%20Layer.pdf'),
 (314, 'Chương 09 – Bài giảng gốc mạng máy tính', 'https://itc.edu.vn/Data/Sites/1/media/thongbao/2026/Dao%20tao/Kiemdinh/Baigiang/co_ly/B%C3%A0i%209_T%E1%BA%A7ng%20Application.pdf'),
 (315, 'Chương 10 – Bài giảng gốc mạng máy tính', 'https://itc.edu.vn/Data/Sites/1/media/thongbao/2026/Dao%20tao/Kiemdinh/Baigiang/co_ly/B%C3%A0i%2010_X%C3%A2y%20d%E1%BB%B1ng%20h%E1%BB%87%20th%E1%BB%91ng%20m%E1%BA%A1ng%20c%C6%A1%20b%E1%BA%A3n.pdf');
DO $pre$
DECLARE bad integer;
BEGIN
 SELECT count(*) INTO bad FROM restore84 x LEFT JOIN lms.lessons l ON l.lesson_id=x.lesson_id
 WHERE l.lesson_id IS NULL OR l.course_id IN (44,48,50,61) OR l.course_id NOT BETWEEN 45 AND 64 OR l.is_deleted OR NOT l.is_published OR l.lesson_order<=1;
 IF bad>0 THEN RAISE EXCEPTION 'Unsafe/missing lesson targets: %; nothing changed',bad; END IF;
 SELECT count(*) INTO bad FROM (SELECT lesson_id,resource_url,count(*) n FROM restore84 GROUP BY 1,2 HAVING count(*)>1) a;
 IF bad>0 THEN RAISE EXCEPTION 'Duplicate mapping: %',bad;END IF;
 RAISE NOTICE 'Validated % historical PDF mappings in % lessons', (SELECT count(*) FROM restore84),(SELECT count(distinct lesson_id) FROM restore84);
END $pre$;
-- Only add missing references. Allocate unique (lesson_id, display_order) slots.
WITH newrows AS (
 SELECT x.*,row_number() OVER(PARTITION BY x.lesson_id ORDER BY x.resource_url) AS rn
 FROM restore84 x WHERE NOT EXISTS(SELECT 1 FROM lms.lesson_resources r WHERE r.lesson_id=x.lesson_id AND r.resource_type='PDF' AND r.resource_url=x.resource_url)
), bases AS (
 SELECT n.lesson_id,coalesce(max(r.display_order),0) AS max_order FROM (SELECT DISTINCT lesson_id FROM newrows) n
 LEFT JOIN lms.lesson_resources r ON r.lesson_id=n.lesson_id GROUP BY n.lesson_id
)
INSERT INTO lms.lesson_resources(lesson_id,resource_type,title,resource_url,display_order)
SELECT n.lesson_id,'PDF',n.display_title,n.resource_url,b.max_order+n.rn
FROM newrows n JOIN bases b ON b.lesson_id=n.lesson_id;
DO $post$
DECLARE bad integer;
BEGIN
 SELECT count(*) INTO bad FROM restore84 x WHERE NOT EXISTS (
 SELECT 1 FROM lms.lesson_resources r WHERE r.lesson_id=x.lesson_id AND r.resource_type='PDF' AND r.resource_url=x.resource_url);
 IF bad>0 THEN RAISE EXCEPTION 'Missing restored URLs: %, rolling back',bad;END IF;
 RAISE NOTICE 'Verified historical chapter PDFs present: % rows / % lessons', (SELECT count(*) FROM restore84),(SELECT count(distinct lesson_id) FROM restore84);
END $post$;
COMMIT;
