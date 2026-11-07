\set ON_ERROR_STOP on

BEGIN;

DO $excel_upgrade$
DECLARE
  excel_course_id bigint;
  target_lesson_id bigint;
  target_quiz_id bigint;
  target_final_quiz_id bigint;
  quiz_def record;
  item jsonb;
  answer_item jsonb;
  source_question record;
  source_answer record;
  created_question_id bigint;
  question_position integer;
  answer_position integer;
BEGIN
  SELECT course_id INTO excel_course_id
  FROM lms.curated_courses
  WHERE course_key = 'excel';

  IF excel_course_id IS NULL THEN
    RAISE EXCEPTION 'Excel course_key=excel not found; aborting';
  END IF;

  UPDATE lms.course_sections
  SET title = CASE module_key
        WHEN 'intro' THEN 'Giới thiệu môn học'
        WHEN 'core-1' THEN 'Nền tảng và nhập liệu'
        WHEN 'core-2' THEN 'Hàm tính tổng, đếm và điều kiện'
        WHEN 'core-3' THEN 'Xử lý chuỗi và tra cứu'
        ELSE title
      END,
      is_required = module_key IN ('core-1','core-2'),
      outcomes = '[]'::jsonb
  WHERE course_id = excel_course_id;

  UPDATE lms.lessons l
  SET title = v.title,
      content = v.content,
      updated_at = now()
  FROM (VALUES
    (1, 'Giới thiệu môn học', 'Chào mừng bạn đã đến với khóa học của VEDU! Hãy tiếp tục hành trình học tập.'),
    (2, '01 · Các thao tác với file Excel', 'Khởi động Excel, lưu tệp, phân biệt ô, hàng, cột, kiểu dữ liệu và thao tác với trang tính.'),
    (3, '02 · Nhập liệu và làm quen với các thẻ', 'Nhập dữ liệu theo mẫu, sử dụng thanh truy cập nhanh và nhận biết các thẻ lệnh quan trọng.'),
    (4, '03 · Các hàm SUM, SUMIF và SUMIFS', 'Tính tổng toàn bộ dữ liệu, tính tổng theo một điều kiện và nhiều điều kiện.'),
    (5, '04 · Các hàm COUNT, COUNTA, COUNTBLANK, COUNTIF và COUNTIFS', 'Đếm ô số, ô có dữ liệu, ô trống và đếm theo một hoặc nhiều điều kiện.'),
    (6, '05 · Các hàm IF, AND và OR', 'Xây dựng điều kiện, kết hợp nhiều biểu thức logic và phân loại dữ liệu.'),
    (7, '06 · Các hàm xử lý chuỗi', 'Làm sạch, chuyển đổi và tách chuỗi bằng TRIM, PROPER, UPPER, LOWER, LEN, LEFT, RIGHT và MID.'),
    (8, '07 · Các hàm VLOOKUP và HLOOKUP', 'Tra cứu theo cột hoặc hàng, lựa chọn kiểu dò chính xác và cố định vùng tra cứu.')
  ) AS v(lesson_order,title,content)
  WHERE l.course_id = excel_course_id
    AND l.lesson_order = v.lesson_order
    AND l.is_published
    AND NOT l.is_deleted;

  IF (SELECT count(*) FROM lms.lessons
      WHERE course_id = excel_course_id AND lesson_order BETWEEN 1 AND 8
        AND is_published AND NOT is_deleted) <> 8 THEN
    RAISE EXCEPTION 'Excel must contain introduction plus seven published lessons';
  END IF;

  -- Keep the course owner clearly visible in every video resource title.
  -- Bài 00 is supplementary to lesson 01; Bài 01-07 are the primary videos.
  INSERT INTO lms.lesson_resources(lesson_id,resource_type,title,resource_url,display_order)
  SELECT l.lesson_id,'VIDEO',v.title,v.url,v.display_order
  FROM (VALUES
    (2, 'Video bổ trợ Gà Excel — Bài 00: Excel là gì?', 'https://www.youtube.com/watch?v=LC19SdKG4_c&list=PLApuTT4CRzA9XAywWsReLBID1UYrPCwWB', 101),
    (2, 'Video Gà Excel — Bài 01: Các thao tác với Excel', 'https://www.youtube.com/watch?v=t-RLqZ-FZuo&list=PLApuTT4CRzA9XAywWsReLBID1UYrPCwWB&index=2', 102),
    (3, 'Video Gà Excel — Bài 02: Nhập liệu và các thẻ', 'https://www.youtube.com/watch?v=YUQODIm2hrE&list=PLApuTT4CRzA9XAywWsReLBID1UYrPCwWB&index=3', 101),
    (4, 'Video Gà Excel — Bài 03: SUM, SUMIF, SUMIFS', 'https://www.youtube.com/watch?v=RXj9T-wSZWk&list=PLApuTT4CRzA9XAywWsReLBID1UYrPCwWB&index=4', 101),
    (5, 'Video Gà Excel — Bài 04: Các hàm COUNT', 'https://www.youtube.com/watch?v=yHLGXACgTU0&list=PLApuTT4CRzA9XAywWsReLBID1UYrPCwWB&index=5', 101),
    (6, 'Video Gà Excel — Bài 05: Hàm IF', 'https://www.youtube.com/watch?v=_41-_Q6_LsE&list=PLApuTT4CRzA9XAywWsReLBID1UYrPCwWB&index=6', 101),
    (7, 'Video Gà Excel — Bài 06: Các hàm xử lý chuỗi', 'https://www.youtube.com/watch?v=olnU9t2Dr4Y&list=PLApuTT4CRzA9XAywWsReLBID1UYrPCwWB&index=7', 101),
    (8, 'Video Gà Excel — Bài 07: VLOOKUP và HLOOKUP', 'https://www.youtube.com/watch?v=zlVq9bUpbyc&list=PLApuTT4CRzA9XAywWsReLBID1UYrPCwWB&index=8', 101)
  ) AS v(lesson_order,title,url,display_order)
  JOIN lms.lessons l ON l.course_id=excel_course_id
    AND l.lesson_order=v.lesson_order AND l.is_published AND NOT l.is_deleted
  WHERE NOT EXISTS (
    SELECT 1 FROM lms.lesson_resources old
    WHERE old.lesson_id=l.lesson_id AND old.resource_type='VIDEO' AND old.resource_url=v.url
  );

  -- Retain attempt history but remove old quiz versions from the active classroom.
  UPDATE assessment.quizzes
  SET is_published=false,updated_at=now()
  WHERE course_id=excel_course_id AND is_published AND NOT is_deleted;

  FOR quiz_def IN
    SELECT * FROM (VALUES
      (2, 'Quiz bài 01 — Các thao tác với file Excel', 'excel-basics', $json$[
        {"text":"Lệnh Save As phù hợp nhất khi nào?","answers":[{"text":"Khi muốn lưu thành một tệp mới với tên hoặc vị trí khác","correct":true},{"text":"Khi chỉ muốn đóng Excel","correct":false},{"text":"Khi muốn xóa trang tính","correct":false},{"text":"Khi muốn đổi màu ô","correct":false}]},
        {"text":"Giao điểm giữa một hàng và một cột trong Excel được gọi là gì?","answers":[{"text":"Ô (cell)","correct":true},{"text":"Trang chiếu","correct":false},{"text":"Đoạn văn","correct":false},{"text":"Biểu mẫu","correct":false}]},
        {"text":"Hàng trong Excel được nhận biết bằng thành phần nào?","answers":[{"text":"Số ở cạnh trái trang tính","correct":true},{"text":"Chữ cái ở phía trên","correct":false},{"text":"Tên tệp","correct":false},{"text":"Tên công thức","correct":false}]},
        {"text":"Cột trong Excel được nhận biết bằng thành phần nào?","answers":[{"text":"Chữ cái ở phía trên trang tính","correct":true},{"text":"Số ở cạnh trái","correct":false},{"text":"Màu của ô","correct":false},{"text":"Tên người dùng","correct":false}]},
        {"text":"Dữ liệu nào thường được Excel nhận là kiểu số?","answers":[{"text":"1250","correct":true},{"text":"Báo cáo tháng","correct":false},{"text":"Nguyễn Văn A","correct":false},{"text":"Tổng doanh thu","correct":false}]},
        {"text":"Một công thức Excel thường bắt đầu bằng ký tự nào?","answers":[{"text":"=","correct":true},{"text":"#","correct":false},{"text":"@","correct":false},{"text":"&","correct":false}]},
        {"text":"Workbook trong Excel là gì?","answers":[{"text":"Tệp Excel có thể chứa nhiều worksheet","correct":true},{"text":"Một ô dữ liệu","correct":false},{"text":"Một cột","correct":false},{"text":"Một kiểu chữ","correct":false}]},
        {"text":"Worksheet là gì?","answers":[{"text":"Một trang tính nằm trong workbook","correct":true},{"text":"Một tệp PDF","correct":false},{"text":"Một máy in","correct":false},{"text":"Một biểu tượng lưu tệp","correct":false}]},
        {"text":"Phần mở rộng phổ biến của workbook Excel hiện đại là gì?","answers":[{"text":".xlsx","correct":true},{"text":".pptx","correct":false},{"text":".docx","correct":false},{"text":".mp3","correct":false}]},
        {"text":"Để đổi tên một worksheet, thao tác phù hợp là gì?","answers":[{"text":"Đổi tên thẻ sheet","correct":true},{"text":"Xóa toàn bộ workbook","correct":false},{"text":"Đổi độ sáng màn hình","correct":false},{"text":"Đóng thanh công thức","correct":false}]}
      ]$json$::jsonb),
      (3, 'Quiz bài 02 — Nhập liệu và các thẻ', 'excel-entry', $json$[
        {"text":"Thanh Quick Access Toolbar dùng để làm gì?","answers":[{"text":"Truy cập nhanh các lệnh thường dùng","correct":true},{"text":"Chỉ hiển thị công thức","correct":false},{"text":"Chỉ hiển thị tên sheet","correct":false},{"text":"Khóa bàn phím","correct":false}]},
        {"text":"Có thể bổ sung lệnh vào Quick Access Toolbar không?","answers":[{"text":"Có, có thể tùy chỉnh các lệnh","correct":true},{"text":"Không bao giờ","correct":false},{"text":"Chỉ khi không có workbook","correct":false},{"text":"Chỉ với tệp PDF","correct":false}]},
        {"text":"Thẻ Home thường chứa nhóm lệnh nào?","answers":[{"text":"Định dạng chữ, căn chỉnh và số","correct":true},{"text":"Chỉ in tệp","correct":false},{"text":"Chỉ tạo mật khẩu","correct":false},{"text":"Chỉ đổi tên workbook","correct":false}]},
        {"text":"Thẻ Insert phù hợp để thực hiện thao tác nào?","answers":[{"text":"Chèn bảng, hình hoặc biểu đồ","correct":true},{"text":"Đóng Excel","correct":false},{"text":"Xóa hệ điều hành","correct":false},{"text":"Đổi mật khẩu email","correct":false}]},
        {"text":"Thẻ Formulas hỗ trợ công việc nào?","answers":[{"text":"Làm việc với hàm và công thức","correct":true},{"text":"Chỉ đổi màu nền Windows","correct":false},{"text":"Chỉ chèn video","correct":false},{"text":"Chỉ gửi email","correct":false}]},
        {"text":"Thẻ Data thường dùng cho việc nào?","answers":[{"text":"Sắp xếp, lọc và xử lý dữ liệu","correct":true},{"text":"Đổi hình nền máy tính","correct":false},{"text":"Tạo tài khoản Windows","correct":false},{"text":"Chỉnh âm lượng","correct":false}]},
        {"text":"Thẻ Review phù hợp với thao tác nào?","answers":[{"text":"Kiểm tra và nhận xét nội dung","correct":true},{"text":"Chỉ tính tổng","correct":false},{"text":"Chỉ tạo sheet mới","correct":false},{"text":"Chỉ phóng to ảnh","correct":false}]},
        {"text":"Khi nhập xong dữ liệu vào một ô, phím nào thường dùng để xác nhận?","answers":[{"text":"Enter","correct":true},{"text":"Esc rồi xóa tệp","correct":false},{"text":"Caps Lock","correct":false},{"text":"Print Screen","correct":false}]},
        {"text":"Muốn dữ liệu hiển thị theo dạng ngày tháng, cần chọn gì?","answers":[{"text":"Định dạng Date phù hợp","correct":true},{"text":"Định dạng âm thanh","correct":false},{"text":"Hiệu ứng chuyển trang","correct":false},{"text":"Chế độ trình chiếu","correct":false}]},
        {"text":"Có thể thay đổi font mặc định khi tạo workbook mới không?","answers":[{"text":"Có, thông qua thiết lập Excel","correct":true},{"text":"Không thể trong mọi trường hợp","correct":false},{"text":"Chỉ bằng cách xóa Office","correct":false},{"text":"Chỉ khi tệp là PDF","correct":false}]}
      ]$json$::jsonb),
      (4, 'Quiz bài 03 — SUM, SUMIF và SUMIFS', 'excel-sum', $json$[
        {"text":"Hàm SUM dùng để làm gì?","answers":[{"text":"Tính tổng các số hoặc vùng ô","correct":true},{"text":"Đếm ô trống","correct":false},{"text":"Tách chuỗi","correct":false},{"text":"Tra cứu theo cột","correct":false}]},
        {"text":"Công thức nào tính tổng từ D4 đến D18?","answers":[{"text":"=SUM(D4:D18)","correct":true},{"text":"=COUNT(D4:D18)","correct":false},{"text":"=LEFT(D4:D18)","correct":false},{"text":"=IF(D4:D18)","correct":false}]},
        {"text":"SUMIF phù hợp khi cần tính tổng theo bao nhiêu điều kiện chính?","answers":[{"text":"Một điều kiện","correct":true},{"text":"Không có điều kiện","correct":false},{"text":"Chỉ bốn điều kiện","correct":false},{"text":"Chỉ mười điều kiện","correct":false}]},
        {"text":"SUMIFS phù hợp khi nào?","answers":[{"text":"Khi tính tổng theo một hoặc nhiều điều kiện","correct":true},{"text":"Khi đổi tên sheet","correct":false},{"text":"Khi tách họ tên","correct":false},{"text":"Khi đếm ô trống","correct":false}]},
        {"text":"Trong SUMIF(range, criteria, sum_range), range là gì?","answers":[{"text":"Vùng được kiểm tra điều kiện","correct":true},{"text":"Tên workbook","correct":false},{"text":"Mật khẩu tệp","correct":false},{"text":"Màu của biểu đồ","correct":false}]},
        {"text":"Trong SUMIF, sum_range là gì?","answers":[{"text":"Vùng chứa các giá trị cần tính tổng","correct":true},{"text":"Vùng chứa tên sheet","correct":false},{"text":"Vùng chứa hình ảnh","correct":false},{"text":"Vùng dùng để đổi font","correct":false}]},
        {"text":"Thứ tự đối số đầu tiên của SUMIFS là gì?","answers":[{"text":"sum_range","correct":true},{"text":"Tên sheet","correct":false},{"text":"Màu ô","correct":false},{"text":"Số trang in","correct":false}]},
        {"text":"Muốn tính doanh thu khu vực Bắc, hàm phù hợp nhất là gì nếu chỉ có một điều kiện?","answers":[{"text":"SUMIF","correct":true},{"text":"COUNTBLANK","correct":false},{"text":"RIGHT","correct":false},{"text":"HLOOKUP","correct":false}]},
        {"text":"Muốn tính doanh thu của SP 01 tại khu vực Bắc, hàm phù hợp nhất là gì?","answers":[{"text":"SUMIFS","correct":true},{"text":"SUM không điều kiện","correct":false},{"text":"LEN","correct":false},{"text":"PROPER","correct":false}]},
        {"text":"Criteria trong các hàm tính tổng có điều kiện mang ý nghĩa gì?","answers":[{"text":"Điều kiện dùng để chọn dữ liệu","correct":true},{"text":"Tên người tạo tệp","correct":false},{"text":"Độ rộng cột","correct":false},{"text":"Tên máy in","correct":false}]}
      ]$json$::jsonb),
      (5, 'Quiz bài 04 — Các hàm COUNT', 'excel-count', $json$[
        {"text":"COUNT dùng để đếm loại ô nào?","answers":[{"text":"Ô chứa giá trị số","correct":true},{"text":"Chỉ ô chứa hình ảnh","correct":false},{"text":"Chỉ ô trống","correct":false},{"text":"Chỉ tên sheet","correct":false}]},
        {"text":"COUNTA dùng để đếm gì?","answers":[{"text":"Các ô không trống","correct":true},{"text":"Chỉ các ô trống","correct":false},{"text":"Chỉ số âm","correct":false},{"text":"Chỉ công thức SUM","correct":false}]},
        {"text":"COUNTBLANK dùng để đếm gì?","answers":[{"text":"Các ô trống trong vùng","correct":true},{"text":"Các ô có số","correct":false},{"text":"Các sheet","correct":false},{"text":"Các workbook","correct":false}]},
        {"text":"COUNTIF dùng trong tình huống nào?","answers":[{"text":"Đếm theo một điều kiện","correct":true},{"text":"Tính tổng không điều kiện","correct":false},{"text":"Tách chuỗi","correct":false},{"text":"Tra cứu ngang","correct":false}]},
        {"text":"COUNTIFS dùng trong tình huống nào?","answers":[{"text":"Đếm theo nhiều điều kiện","correct":true},{"text":"Chỉ đổi font","correct":false},{"text":"Chỉ lưu tệp","correct":false},{"text":"Chỉ đếm sheet","correct":false}]},
        {"text":"Công thức nào đếm số ô có giá trị lớn hơn 50 trong A1:A20?","answers":[{"text":"=COUNTIF(A1:A20,\">50\")","correct":true},{"text":"=SUM(A1:A20,\">50\")","correct":false},{"text":"=LEFT(A1:A20,50)","correct":false},{"text":"=HLOOKUP(50,A1:A20)","correct":false}]},
        {"text":"Muốn đếm học viên có ĐTB từ 6 trở lên, hàm phù hợp là gì?","answers":[{"text":"COUNTIF","correct":true},{"text":"SUM","correct":false},{"text":"RIGHT","correct":false},{"text":"LOWER","correct":false}]},
        {"text":"Muốn đếm học viên vừa đạt ĐTB từ 6 vừa có điểm Excel trên 5, dùng gì?","answers":[{"text":"COUNTIFS","correct":true},{"text":"COUNTBLANK","correct":false},{"text":"LEN","correct":false},{"text":"VLOOKUP","correct":false}]},
        {"text":"Trong COUNTIF(range, criteria), range là gì?","answers":[{"text":"Vùng ô cần kiểm tra","correct":true},{"text":"Tên tệp","correct":false},{"text":"Tên máy tính","correct":false},{"text":"Mật khẩu","correct":false}]},
        {"text":"Điều kiện bắt đầu bằng chuỗi com có thể biểu diễn bằng mẫu nào?","answers":[{"text":"\"com*\"","correct":true},{"text":"\"*com*\" chỉ","correct":false},{"text":"\"=SUM\"","correct":false},{"text":"\"#REF!\"","correct":false}]}
      ]$json$::jsonb),
      (6, 'Quiz bài 05 — IF, AND và OR', 'excel-logic', $json$[
        {"text":"Hàm IF dùng để làm gì?","answers":[{"text":"Trả kết quả khác nhau theo điều kiện đúng hoặc sai","correct":true},{"text":"Chỉ tính tổng","correct":false},{"text":"Chỉ đếm ô trống","correct":false},{"text":"Chỉ tra cứu ngang","correct":false}]},
        {"text":"Cú pháp cơ bản của IF gồm thành phần nào?","answers":[{"text":"Điều kiện, giá trị khi đúng và giá trị khi sai","correct":true},{"text":"Chỉ tên workbook","correct":false},{"text":"Chỉ số hàng","correct":false},{"text":"Chỉ màu nền","correct":false}]},
        {"text":"AND trả về TRUE khi nào?","answers":[{"text":"Tất cả điều kiện đều đúng","correct":true},{"text":"Ít nhất một điều kiện đúng","correct":false},{"text":"Tất cả ô đều trống","correct":false},{"text":"Workbook được đóng","correct":false}]},
        {"text":"OR trả về TRUE khi nào?","answers":[{"text":"Ít nhất một điều kiện đúng","correct":true},{"text":"Chỉ khi mọi điều kiện sai","correct":false},{"text":"Chỉ khi ô trống","correct":false},{"text":"Chỉ khi workbook bị khóa","correct":false}]},
        {"text":"IF lồng nhau phù hợp khi nào?","answers":[{"text":"Khi cần phân loại theo nhiều mức","correct":true},{"text":"Khi chỉ lưu tệp","correct":false},{"text":"Khi chỉ đổi tên sheet","correct":false},{"text":"Khi chèn hình ảnh","correct":false}]},
        {"text":"Công thức nào trả về Đỗ nếu F2 từ 7 trở lên?","answers":[{"text":"=IF(F2>=7,\"Đỗ\",\"Trượt\")","correct":true},{"text":"=SUM(F2>=7)","correct":false},{"text":"=COUNTBLANK(F2)","correct":false},{"text":"=LEFT(F2,7)","correct":false}]},
        {"text":"Muốn yêu cầu đồng thời ĐTB từ 7 và đạo đức Tốt, nên kết hợp IF với hàm nào?","answers":[{"text":"AND","correct":true},{"text":"OR duy nhất","correct":false},{"text":"SUM","correct":false},{"text":"LEN","correct":false}]},
        {"text":"Muốn chấp nhận một trong hai điều kiện, nên dùng hàm nào?","answers":[{"text":"OR","correct":true},{"text":"AND","correct":false},{"text":"COUNTBLANK","correct":false},{"text":"HLOOKUP","correct":false}]},
        {"text":"Biểu thức H19>100 trả về loại giá trị nào?","answers":[{"text":"TRUE hoặc FALSE","correct":true},{"text":"Chỉ văn bản dài","correct":false},{"text":"Chỉ hình ảnh","correct":false},{"text":"Chỉ tên sheet","correct":false}]},
        {"text":"Trong IF, value_if_false được dùng khi nào?","answers":[{"text":"Khi điều kiện trả về FALSE","correct":true},{"text":"Khi điều kiện trả về TRUE","correct":false},{"text":"Khi mở workbook","correct":false},{"text":"Khi đổi độ rộng cột","correct":false}]}
      ]$json$::jsonb),
      (7, 'Quiz bài 06 — Các hàm xử lý chuỗi', 'excel-text', $json$[
        {"text":"TRIM dùng để làm gì?","answers":[{"text":"Loại bỏ khoảng trắng thừa trong chuỗi","correct":true},{"text":"Tính tổng","correct":false},{"text":"Đếm ô trống","correct":false},{"text":"Tra cứu ngang","correct":false}]},
        {"text":"PROPER dùng để làm gì?","answers":[{"text":"Viết hoa chữ cái đầu của mỗi từ","correct":true},{"text":"Viết thường toàn bộ","correct":false},{"text":"Đếm số ô","correct":false},{"text":"Tính trung bình","correct":false}]},
        {"text":"UPPER trả về kết quả nào?","answers":[{"text":"Chuỗi viết hoa toàn bộ","correct":true},{"text":"Chuỗi viết thường toàn bộ","correct":false},{"text":"Số lượng ô trống","correct":false},{"text":"Tổng một vùng","correct":false}]},
        {"text":"LOWER trả về kết quả nào?","answers":[{"text":"Chuỗi viết thường toàn bộ","correct":true},{"text":"Chuỗi viết hoa toàn bộ","correct":false},{"text":"Một biểu đồ","correct":false},{"text":"Một worksheet mới","correct":false}]},
        {"text":"LEN dùng để làm gì?","answers":[{"text":"Đếm số ký tự trong chuỗi","correct":true},{"text":"Tính tổng các số","correct":false},{"text":"Đếm sheet","correct":false},{"text":"Tra cứu dọc","correct":false}]},
        {"text":"LEFT dùng để lấy phần nào của chuỗi?","answers":[{"text":"Các ký tự từ bên trái","correct":true},{"text":"Các ký tự từ bên phải","correct":false},{"text":"Chỉ số lớn nhất","correct":false},{"text":"Chỉ ô trống","correct":false}]},
        {"text":"RIGHT dùng để lấy phần nào của chuỗi?","answers":[{"text":"Các ký tự từ bên phải","correct":true},{"text":"Các ký tự từ bên trái","correct":false},{"text":"Toàn bộ workbook","correct":false},{"text":"Tên sheet","correct":false}]},
        {"text":"MID cần những thông tin chính nào?","answers":[{"text":"Chuỗi, vị trí bắt đầu và số ký tự","correct":true},{"text":"Chỉ tên workbook","correct":false},{"text":"Chỉ màu ô","correct":false},{"text":"Chỉ số sheet","correct":false}]},
        {"text":"FIND khác SEARCH ở điểm quan trọng nào?","answers":[{"text":"FIND phân biệt chữ hoa và chữ thường","correct":true},{"text":"FIND chỉ tính tổng","correct":false},{"text":"SEARCH chỉ đếm ô trống","correct":false},{"text":"Hai hàm chỉ dùng cho số","correct":false}]},
        {"text":"SUBSTITUTE dùng để làm gì?","answers":[{"text":"Thay chuỗi con bằng chuỗi khác","correct":true},{"text":"Tính tổng theo điều kiện","correct":false},{"text":"Đếm số ô","correct":false},{"text":"Tạo workbook mới","correct":false}]}
      ]$json$::jsonb),
      (8, 'Quiz bài 07 — VLOOKUP và HLOOKUP', 'excel-lookup', $json$[
        {"text":"VLOOKUP tra cứu theo hướng nào?","answers":[{"text":"Theo cột dọc","correct":true},{"text":"Theo hàng ngang","correct":false},{"text":"Theo màu ô","correct":false},{"text":"Theo tên tệp","correct":false}]},
        {"text":"HLOOKUP tra cứu theo hướng nào?","answers":[{"text":"Theo hàng ngang","correct":true},{"text":"Theo cột dọc","correct":false},{"text":"Theo kích thước chữ","correct":false},{"text":"Theo tên người dùng","correct":false}]},
        {"text":"Trong VLOOKUP, giá trị dò phải nằm ở đâu trong bảng dò?","answers":[{"text":"Cột đầu tiên của bảng dò","correct":true},{"text":"Cột cuối cùng bắt buộc","correct":false},{"text":"Bất kỳ hình ảnh nào","correct":false},{"text":"Tên sheet","correct":false}]},
        {"text":"Trong HLOOKUP, giá trị dò phải nằm ở đâu?","answers":[{"text":"Hàng đầu tiên của bảng dò","correct":true},{"text":"Hàng cuối cùng bắt buộc","correct":false},{"text":"Tên workbook","correct":false},{"text":"Thanh trạng thái","correct":false}]},
        {"text":"Đối số FALSE hoặc 0 trong VLOOKUP mang ý nghĩa gì?","answers":[{"text":"Dò chính xác","correct":true},{"text":"Dò gần đúng","correct":false},{"text":"Không dò dữ liệu","correct":false},{"text":"Xóa bảng dò","correct":false}]},
        {"text":"Đối số TRUE hoặc 1 trong VLOOKUP thường mang ý nghĩa gì?","answers":[{"text":"Dò gần đúng","correct":true},{"text":"Dò chính xác tuyệt đối","correct":false},{"text":"Xóa workbook","correct":false},{"text":"Đếm ô trống","correct":false}]},
        {"text":"col_index_num trong VLOOKUP chỉ điều gì?","answers":[{"text":"Thứ tự cột trả về trong bảng dò","correct":true},{"text":"Số workbook đang mở","correct":false},{"text":"Màu của cột","correct":false},{"text":"Độ rộng cột","correct":false}]},
        {"text":"row_index_num trong HLOOKUP chỉ điều gì?","answers":[{"text":"Thứ tự hàng trả về trong bảng dò","correct":true},{"text":"Tên workbook","correct":false},{"text":"Số biểu đồ","correct":false},{"text":"Độ cao hàng","correct":false}]},
        {"text":"Vì sao thường cố định table_array bằng dấu $?","answers":[{"text":"Để vùng bảng dò không dịch chuyển khi sao chép công thức","correct":true},{"text":"Để xóa bảng dò","correct":false},{"text":"Để đổi màu dữ liệu","correct":false},{"text":"Để đóng workbook","correct":false}]},
        {"text":"Khi dò gần đúng, bảng mốc thường cần điều kiện gì?","answers":[{"text":"Sắp xếp tăng dần theo cột hoặc hàng dò","correct":true},{"text":"Xóa toàn bộ tiêu đề","correct":false},{"text":"Đổi tất cả thành hình ảnh","correct":false},{"text":"Đóng mọi sheet","correct":false}]}
      ]$json$::jsonb)
    ) AS definitions(lesson_order,quiz_title,skill,questions)
  LOOP
    SELECT lesson_id INTO target_lesson_id
    FROM lms.lessons
    WHERE course_id=excel_course_id AND lesson_order=quiz_def.lesson_order
      AND is_published AND NOT is_deleted;

    SELECT quiz_id INTO target_quiz_id
    FROM assessment.quizzes
    WHERE course_id=excel_course_id AND lesson_id=target_lesson_id
      AND description='[VEDU-EXCEL-GA-EXCEL-v1]'
      AND NOT is_deleted
    ORDER BY quiz_id DESC LIMIT 1;

    IF target_quiz_id IS NULL THEN
      INSERT INTO assessment.quizzes(
        course_id,lesson_id,title,description,time_limit_seconds,
        passing_score,max_attempts,is_published
      ) VALUES(
        excel_course_id,target_lesson_id,quiz_def.quiz_title,
        '[VEDU-EXCEL-GA-EXCEL-v1]',600,7,3,true
      ) RETURNING quiz_id INTO target_quiz_id;
    ELSE
      UPDATE assessment.quizzes
      SET title=quiz_def.quiz_title,time_limit_seconds=600,passing_score=7,
          max_attempts=3,is_published=true,updated_at=now()
      WHERE quiz_id=target_quiz_id;
    END IF;

    IF (SELECT count(*) FROM assessment.questions WHERE quiz_id=target_quiz_id)=0 THEN
      question_position:=0;
      FOR item IN SELECT value FROM jsonb_array_elements(quiz_def.questions)
      LOOP
        question_position:=question_position+1;
        INSERT INTO assessment.questions(
          quiz_id,question_text,question_type,question_order,points
        ) VALUES(
          target_quiz_id,item->>'text','SINGLE_CHOICE',question_position,1
        ) RETURNING question_id INTO created_question_id;

        INSERT INTO assessment.question_skills(question_id,skill)
        VALUES(created_question_id,quiz_def.skill)
        ON CONFLICT(question_id) DO NOTHING;

        answer_position:=0;
        FOR answer_item IN SELECT value FROM jsonb_array_elements(item->'answers')
        LOOP
          answer_position:=answer_position+1;
          INSERT INTO assessment.answers(question_id,answer_text,is_correct,answer_order)
          VALUES(created_question_id,answer_item->>'text',COALESCE((answer_item->>'correct')::boolean,false),answer_position);
        END LOOP;
      END LOOP;
    ELSIF (SELECT count(*) FROM assessment.questions WHERE quiz_id=target_quiz_id)<>10 THEN
      RAISE EXCEPTION 'Excel quiz % has unexpected question count',target_quiz_id;
    END IF;
  END LOOP;

  SELECT quiz_id INTO target_final_quiz_id
  FROM assessment.quizzes
  WHERE course_id=excel_course_id AND lesson_id IS NULL
    AND description='[VEDU-EXCEL-GA-EXCEL-FINAL-v1]'
    AND NOT is_deleted
  ORDER BY quiz_id DESC LIMIT 1;

  IF target_final_quiz_id IS NULL THEN
    INSERT INTO assessment.quizzes(
      course_id,lesson_id,title,description,time_limit_seconds,
      passing_score,max_attempts,is_published
    ) VALUES(
      excel_course_id,NULL,'Bài kiểm tra cuối khóa — Excel cơ bản đến nâng cao',
      '[VEDU-EXCEL-GA-EXCEL-FINAL-v1]',1200,7,3,true
    ) RETURNING quiz_id INTO target_final_quiz_id;
  ELSE
    UPDATE assessment.quizzes
    SET title='Bài kiểm tra cuối khóa — Excel cơ bản đến nâng cao',
        time_limit_seconds=1200,passing_score=7,max_attempts=3,
        is_published=true,updated_at=now()
    WHERE quiz_id=target_final_quiz_id;
  END IF;

  IF (SELECT count(*) FROM assessment.questions WHERE quiz_id=target_final_quiz_id)=0 THEN
    question_position:=0;
    FOR source_question IN
      SELECT qu.question_id,qu.question_text,qu.question_type,qu.points,qs.skill
      FROM assessment.quizzes q
      JOIN lms.lessons l ON l.lesson_id=q.lesson_id
      JOIN assessment.questions qu ON qu.quiz_id=q.quiz_id
      LEFT JOIN assessment.question_skills qs ON qs.question_id=qu.question_id
      WHERE q.course_id=excel_course_id
        AND q.description='[VEDU-EXCEL-GA-EXCEL-v1]'
        AND q.is_published AND NOT q.is_deleted
      ORDER BY qu.question_order,l.lesson_order
      LIMIT 20
    LOOP
      question_position:=question_position+1;
      INSERT INTO assessment.questions(
        quiz_id,question_text,question_type,question_order,points
      ) VALUES(
        target_final_quiz_id,source_question.question_text,
        source_question.question_type,question_position,source_question.points
      ) RETURNING question_id INTO created_question_id;

      IF source_question.skill IS NOT NULL THEN
        INSERT INTO assessment.question_skills(question_id,skill)
        VALUES(created_question_id,source_question.skill)
        ON CONFLICT(question_id) DO NOTHING;
      END IF;

      FOR source_answer IN
        SELECT answer_text,is_correct,answer_order
        FROM assessment.answers
        WHERE question_id=source_question.question_id
        ORDER BY answer_order,answer_id
      LOOP
        INSERT INTO assessment.answers(question_id,answer_text,is_correct,answer_order)
        VALUES(created_question_id,source_answer.answer_text,source_answer.is_correct,source_answer.answer_order);
      END LOOP;
    END LOOP;
  ELSIF (SELECT count(*) FROM assessment.questions WHERE quiz_id=target_final_quiz_id)<>20 THEN
    RAISE EXCEPTION 'Excel final quiz % has unexpected question count',target_final_quiz_id;
  END IF;

  UPDATE lms.course_overviews
  SET practice_note='Video và bài thực hành tham khảo khóa Excel cơ bản đến nâng cao của kênh YouTube Gà Excel. Hai module Nền tảng và nhập liệu; Hàm tính tổng, đếm và điều kiện là bắt buộc. Module Xử lý chuỗi và tra cứu là nội dung mở rộng.',
      updated_at=now()
  WHERE course_id=excel_course_id;
END $excel_upgrade$;

COMMIT;
