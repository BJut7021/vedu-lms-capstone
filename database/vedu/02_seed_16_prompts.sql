-- VEDU: Seed 16 original essay prompts for existing published course final quizzes.
-- Safe rerun: preserve nonempty teacher-written prompts; no new quiz is created.
-- 56-60 deliberately excluded.
BEGIN;
SET LOCAL client_min_messages TO notice;
DO $vedu$
DECLARE
  item record;
  selected_quiz bigint;
  count_updated integer := 0;
BEGIN
  FOR item IN
    SELECT * FROM (VALUES
      (44, 'Cấu trúc dữ liệu và giải thuật'::text, $prompt_44$Bài toán: Một thư viện cần quản lý danh sách sách và tìm kiếm sách theo mã. Giả sử có 12 sách, mã lần lượt: 18, 5, 24, 7, 13, 2, 21, 9, 16, 4, 11, 20.
1) Đề xuất cấu trúc dữ liệu phù hợp khi cần chèn, xóa và tìm kiếm theo mã; nêu ưu/nhược điểm so với mảng không sắp xếp.
2) Minh họa các bước sắp xếp tăng dần bằng một thuật toán đã học (thể hiện tối thiểu 3 bước trung gian).
3) Viết mã giả tìm kiếm sách có mã 13, nêu độ phức tạp thời gian trường hợp tốt và xấu.
4) Đề xuất ít nhất 3 ca kiểm thử với dữ liệu biên.
Thang chấm 10: lựa chọn và giải thích 2đ; mô phỏng thuật toán 3đ; mã giả và độ phức tạp 3đ; kiểm thử 2đ.$prompt_44$::text),
      (45, 'Học sâu'::text, $prompt_45$Tình huống: Xây dựng bộ phân loại ảnh chữ số viết tay gồm 10 lớp. Dữ liệu có 10.000 ảnh, chia tập train/validation/test theo tỷ lệ 70/15/15.
1) Vẽ sơ đồ mạng học sâu phù hợp, ghi rõ đầu vào, các lớp chính và đầu ra.
2) Giải thích vai trò hàm mất mát, lan truyền ngược, learning rate và epoch trong quá trình huấn luyện.
3) Trình bày kế hoạch tránh overfitting và rò rỉ dữ liệu, nêu ít nhất 3 biện pháp.
4) Nêu các chỉ số cần báo cáo và giải thích cách phân tích nhầm lẫn giữa hai lớp chữ số.
Thang chấm 10: kiến trúc 3đ; quy trình học 3đ; kiểm soát overfitting 2đ; đánh giá 2đ.$prompt_45$::text),
      (46, 'Khai phá dữ liệu'::text, $prompt_46$Tình huống: Một cửa hàng có 1.000 hóa đơn, mỗi hóa đơn gồm các mặt hàng đã mua.
1) Mô tả quy trình làm sạch dữ liệu trước khi khai phá luật kết hợp.
2) Giả sử 200 hóa đơn có sản phẩm A, 150 hóa đơn có B và 90 hóa đơn có cả A, B. Tính support(A→B), confidence(A→B) và lift(A→B); giải thích ý nghĩa.
3) Nêu một cách ứng dụng kết quả gợi ý sản phẩm và một rủi ro diễn giải sai luật kết hợp.
4) So sánh ngắn gọn bài toán luật kết hợp với phân lớp hoặc gom cụm.
Thang chấm 10: tiền xử lý 2đ; công thức và kết quả 4đ; ứng dụng và giới hạn 2đ; so sánh 2đ.$prompt_46$::text),
      (47, 'Kiểm định phần mềm'::text, $prompt_47$Tình huống: Website VEDU có chức năng đăng nhập, đăng ký khóa học và làm quiz.
1) Lập bảng ít nhất 8 test case cho chức năng đăng nhập (dữ liệu đầu vào, thao tác, kết quả mong đợi).
2) Thiết kế kiểm thử giá trị biên cho mật khẩu có độ dài hợp lệ từ 8 đến 32 ký tự.
3) Viết một kịch bản BDD/Gherkin cho đăng nhập thành công và một kịch bản cho đăng nhập thất bại.
4) Giả sử phát hiện lỗi học viên chưa ghi danh vẫn xem được bài: lập mẫu bug report có bước tái hiện, kết quả thực tế, kết quả mong đợi, mức độ nghiêm trọng.
Thang chấm 10: test case 4đ; giá trị biên 2đ; BDD 2đ; bug report 2đ.$prompt_47$::text),
      (48, 'Kỹ thuật lập trình'::text, $prompt_48$Tình huống: Viết chương trình quản lý điểm cho 5 sinh viên, mỗi sinh viên có mã, họ tên và 3 điểm thành phần.
1) Thiết kế cấu trúc lưu dữ liệu; giải thích lựa chọn kiểu dữ liệu.
2) Viết mã giả hoặc mã nguồn một ngôn ngữ đã học để nhập, kiểm tra dữ liệu điểm trong khoảng 0–10 và tính điểm trung bình.
3) Viết chức năng sắp xếp theo điểm trung bình giảm dần, có cách xử lý bằng điểm.
4) Nêu 4 ca kiểm thử bao gồm dữ liệu sai và dữ liệu biên.
Thang chấm 10: dữ liệu 2đ; nhập và tính 4đ; sắp xếp 2đ; kiểm thử 2đ.$prompt_48$::text),
      (49, 'Lập trình mã nguồn mở'::text, $prompt_49$Tình huống: Nhóm 3 người phát triển một ứng dụng web dùng Git và một thư viện mã nguồn mở.
1) Vẽ quy trình làm việc bằng nhánh tính năng (feature branch), pull request và code review.
2) Giải thích cách xử lý khi hai người sửa cùng một dòng dẫn đến merge conflict.
3) So sánh ngắn gọn giấy phép MIT với GPL về việc phân phối sản phẩm phái sinh.
4) Lập checklist ít nhất 5 mục để đưa dự án lên kho mã nguồn công khai mà không làm lộ khóa bí mật.
Thang chấm 10: quy trình Git 3đ; xung đột 2đ; giấy phép 2đ; checklist 3đ.$prompt_49$::text),
      (50, 'Lập trình Python cơ bản'::text, $prompt_50$Tình huống: Một cửa hàng lưu danh sách 6 đơn hàng, mỗi đơn có tên sản phẩm, số lượng và đơn giá.
1) Viết chương trình Python nhận danh sách đơn hàng và kiểm tra số lượng, đơn giá không âm.
2) Tính tổng doanh thu và tìm đơn hàng có giá trị lớn nhất.
3) Dùng hàm để thống kê doanh thu theo tên sản phẩm.
4) Nêu ít nhất 4 ca kiểm thử, bao gồm danh sách rỗng, tên sản phẩm trùng và dữ liệu không hợp lệ.
Thang chấm 10: đầu vào/kiểm tra 2đ; doanh thu 3đ; hàm thống kê 3đ; kiểm thử 2đ.$prompt_50$::text),
      (51, 'Nhập môn Big Data'::text, $prompt_51$Tình huống: Nền tảng học trực tuyến thu thập 1 triệu sự kiện xem video và làm quiz mỗi ngày.
1) Phân tích dữ liệu theo ít nhất 3 đặc trưng của Big Data (Volume, Velocity, Variety...).
2) Đề xuất sơ đồ thu nhận, lưu trữ và xử lý dữ liệu theo lô hoặc dòng, nêu vai trò từng thành phần.
3) Giải thích khi nào nên dùng xử lý phân tán thay vì cơ sở dữ liệu truyền thống.
4) Nêu 3 biện pháp giảm rủi ro lộ dữ liệu học viên và 2 cách kiểm soát chất lượng dữ liệu.
Thang chấm 10: đặc trưng 2đ; kiến trúc 4đ; lựa chọn công nghệ 2đ; bảo mật/chất lượng 2đ.$prompt_51$::text),
      (52, 'Thực hành Học sâu'::text, $prompt_52$Tình huống: Huấn luyện mô hình phân loại ảnh hai nhóm: mèo và chó. Có 2.000 ảnh đã gán nhãn.
1) Trình bày pipeline thực hành: chia dữ liệu, chuẩn hóa, tăng cường dữ liệu, huấn luyện, validation, test.
2) Viết mã giả hoặc mô tả từng khối chính để xây dựng và train mô hình CNN hoặc transfer learning.
3) Vẽ biểu đồ loss/accuracy train và validation minh họa tình huống overfitting; giải thích biện pháp cải thiện.
4) Đề xuất cách lưu model và kiểm thử dự đoán ảnh mới.
Thang chấm 10: pipeline 3đ; cấu trúc/mã 3đ; đánh giá 2đ; triển khai thử 2đ.$prompt_52$::text),
      (53, 'Thực hành Trí tuệ nhân tạo'::text, $prompt_53$Tình huống: Thiết kế tác tử tìm đường ngắn từ điểm A tới điểm B trên bản đồ lưới có vật cản.
1) Mô hình hóa trạng thái, hành động, chi phí và điều kiện đích.
2) So sánh BFS, Dijkstra và A* theo giả định cạnh có trọng số; chọn thuật toán phù hợp cho từng trường hợp.
3) Minh họa tối thiểu 5 bước mở rộng nút trên một lưới tự vẽ 5×5 có ít nhất 4 vật cản.
4) Đề xuất một heuristic cho A* và giải thích khi nào heuristic đó có thể bảo đảm tìm đường tối ưu.
Thang chấm 10: mô hình 2đ; so sánh 3đ; minh họa 3đ; heuristic 2đ.$prompt_53$::text),
      (54, 'Thực hành quản trị hệ thống mạng'::text, $prompt_54$Tình huống: Phòng máy gồm 20 PC, một switch quản lý, một router và một máy chủ dùng trong nội bộ.
1) Vẽ sơ đồ kết nối và đề xuất kế hoạch địa chỉ IPv4 cho các thiết bị trong một mạng riêng.
2) Mô tả bước cấu hình DHCP, DNS và gateway mặc định cho các máy trạm.
3) Viết checklist tối thiểu 6 bước kiểm tra khi PC không truy cập được website nội bộ.
4) Đề xuất biện pháp bảo vệ thiết bị quản trị, phân quyền và sao lưu cấu hình.
Thang chấm 10: sơ đồ/IP 3đ; cấu hình 2đ; xử lý sự cố 3đ; an toàn 2đ.$prompt_54$::text),
      (55, 'Thực hành phân tích thiết kế hệ thống'::text, $prompt_55$Tình huống: Xây dựng chức năng học viên nộp bài tập trên VEDU và giảng viên phản hồi.
1) Viết yêu cầu chức năng và phi chức năng, ít nhất 4 yêu cầu mỗi loại.
2) Vẽ use case diagram có các tác nhân học viên, giảng viên và quản trị viên (nếu cần); mô tả 1 use case chính.
3) Vẽ activity diagram hoặc sequence diagram cho luồng nộp bài và giảng viên chấm.
4) Thiết kế tối thiểu 3 bảng dữ liệu, khóa chính/khóa ngoại và nêu 2 quy tắc toàn vẹn.
Thang chấm 10: yêu cầu 2đ; use case 3đ; sơ đồ hành vi 3đ; dữ liệu 2đ.$prompt_55$::text),
      (61, 'Lập trình hướng đối tượng'::text, $prompt_61$Tình huống: Viết hệ thống quản lý khóa học gồm Course, Lesson, Student và Enrollment.
1) Vẽ UML class diagram, chỉ ra thuộc tính, phương thức và quan hệ.
2) Minh họa đóng gói và giải thích lý do không cho sửa trực tiếp trạng thái ghi danh.
3) Viết mã giả hoặc C# cho một interface, một lớp triển khai và ví dụ đa hình.
4) Nêu cách tổ chức chương trình theo ít nhất 2 lớp trách nhiệm để dễ kiểm thử.
Thang chấm 10: UML 3đ; đóng gói 2đ; interface/đa hình 3đ; kiến trúc 2đ.$prompt_61$::text),
      (62, 'Phân tích thiết kế hệ thống'::text, $prompt_62$Tình huống: Phân tích hệ thống đăng ký khóa học trực tuyến có thanh toán và xác nhận ghi danh.
1) Xác định stakeholder, 5 yêu cầu chức năng và 3 yêu cầu phi chức năng.
2) Vẽ use case diagram và mô tả use case Đăng ký khóa học với luồng chính và luồng ngoại lệ.
3) Vẽ sequence diagram cho quá trình thanh toán và kích hoạt ghi danh.
4) Đề xuất mô hình thực thể quan hệ tối thiểu 4 bảng, thể hiện khóa chính/khóa ngoại.
Thang chấm 10: phân tích yêu cầu 2đ; use case 3đ; sequence 3đ; dữ liệu 2đ.$prompt_62$::text),
      (63, 'Cấu trúc rời rạc'::text, $prompt_63$Tình huống: Xét một đồ thị vô hướng G có V={A,B,C,D,E,F}, E={AB,AC,BC,BD,CE,DE,EF}.
1) Vẽ đồ thị và ghi bậc của từng đỉnh; kiểm chứng định lý bắt tay.
2) Xác định đồ thị có liên thông hay không và giải thích.
3) Tìm một đường đi từ A đến F, cho biết có chu trình nào trong đồ thị.
4) Viết ma trận kề theo thứ tự A,B,C,D,E,F.
Thang chấm 10: vẽ và bậc 3đ; liên thông 2đ; đường đi/chu trình 2đ; ma trận kề 3đ.$prompt_63$::text),
      (64, 'Mạng máy tính'::text, $prompt_64$Tình huống: Công ty nhỏ cần kết nối hai phòng ban, mỗi phòng có 20 máy tính và dùng Internet chung.
1) Vẽ mô hình mạng đơn giản gồm router, switch, máy trạm và kết nối Internet.
2) Chọn dải địa chỉ IP riêng, chia subnet đủ cho mỗi phòng; ghi network address, subnet mask, gateway mẫu.
3) Trình bày quá trình một máy gửi yêu cầu truy cập website theo vai trò DNS, TCP/IP, router và NAT.
4) Đề xuất ít nhất 4 giải pháp tăng an toàn và khả năng xử lý sự cố mạng.
Thang chấm 10: sơ đồ 2đ; chia mạng 4đ; giải thích giao tiếp 2đ; an toàn/vận hành 2đ.$prompt_64$::text)
    ) AS v(course_id, course_name, prompt_text)
  LOOP
    SELECT q.quiz_id INTO selected_quiz
    FROM assessment.quizzes q
    JOIN lms.courses c ON c.course_id = q.course_id
    WHERE q.course_id = item.course_id
      AND q.lesson_id IS NULL AND q.is_published AND NOT q.is_deleted
      AND c.is_deleted = false
    ORDER BY q.quiz_id DESC LIMIT 1;
    IF selected_quiz IS NULL THEN
      RAISE WARNING 'Course % (%) has no published final quiz; skipped', item.course_id, item.course_name;
      CONTINUE;
    END IF;
    INSERT INTO assessment.final_essay_prompts(quiz_id,prompt_text)
    VALUES(selected_quiz,item.prompt_text)
    ON CONFLICT(quiz_id) DO UPDATE SET
      prompt_text=EXCLUDED.prompt_text, updated_at=now()
      WHERE btrim(assessment.final_essay_prompts.prompt_text)='';
    IF FOUND THEN count_updated := count_updated+1; END IF;
  END LOOP;
  RAISE NOTICE 'New or previously empty essay prompts filled: %', count_updated;
END;
$vedu$;
SELECT c.course_id,c.course_name,q.quiz_id,
       CASE WHEN p.quiz_id IS NULL THEN 'MISSING' ELSE 'READY' END AS essay_prompt
FROM lms.courses c
LEFT JOIN LATERAL (SELECT quiz_id FROM assessment.quizzes
  WHERE course_id=c.course_id AND lesson_id IS NULL AND is_published AND NOT is_deleted
  ORDER BY quiz_id DESC LIMIT 1) q ON TRUE
LEFT JOIN assessment.final_essay_prompts p ON p.quiz_id=q.quiz_id
WHERE c.course_id IN (44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 61, 62, 63, 64)
ORDER BY c.course_id;
COMMIT;
