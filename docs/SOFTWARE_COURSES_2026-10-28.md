# Hai khóa học mới và ảnh Tin học văn phòng — 28/10/2026

Ứng dụng hiện có **52 khóa công bố**. Hai khóa mới miễn phí:

| Khóa học | Bài học | Quiz cuối khóa | Đường dẫn |
|---|---|---|---|
| Lập trình hướng đối tượng | 1 hướng dẫn + 10 bài C# | 20 câu, 20 phút | <http://localhost:8080/courses/75> |
| Phân tích thiết kế hệ thống | 1 hướng dẫn + 7 chương UML | 14 câu, 14 phút | <http://localhost:8080/courses/76> |

Mỗi bài có mục tiêu, đối chiếu đề cương, nội dung tóm tắt, hai bài tập nhỏ, bài thực hành cuối bài, tiêu chí tự đánh giá, phiếu thực hành HTML và PDF/nguồn bổ trợ. Phân tích thiết kế hệ thống dùng tình huống giao–nộp–chấm bài LMS xuyên suốt. Chương 6 được gọi “Thiết kế lớp và dữ liệu” để khớp cả phần thiết kế lớp trong slide gốc và phần ánh xạ dữ liệu trong học liệu bổ sung.

Lập trình hướng đối tượng gồm: ôn C#; lớp/đóng gói; constructor/overload/static; generic/List/XML/UML; kế thừa; đa hình/abstract; interface; ba lớp; OCP/Liskov/DIP; ba nhóm mẫu thiết kế. Hai bài cuối chưa có slide chuyên đề riêng trong RAR nên ghi rõ dùng đề cương cùng nguồn Microsoft bổ trợ.

## Cách demo

1. Mở VS Code tại thư mục dự án. Trong terminal chạy `docker compose up -d`, đợi backend và database khỏe.
2. Mở <http://localhost:8080/courses>, nhấn **Ctrl+F5**. Có thể tìm theo tên hai khóa mới hoặc chọn chủ đề.
3. Đăng nhập tài khoản học viên của nhóm, chọn **Bắt đầu học**. Khóa miễn phí được ghi danh theo luồng có sẵn.
4. Đọc hướng dẫn, mở tab **Tài liệu** và PDF đề cương. Sang bài đầu, thử PDF gốc, phiếu thực hành và tab **Bài tập**. PDF được lưu trong hệ thống nên mở được khi nguồn ngoài không có mạng.
5. Bấm xác nhận đã đọc; thoát và vào lại để kiểm tra **Tiếp tục học** cùng tiến độ lưu bền vững.
6. Hoàn thành các bài rồi mở **Thi cuối khóa**, làm quiz, nộp và xem kết quả. Đạt từ **7/10**, tối đa 5 lượt. Chưa hoàn thành bài học sẽ bị chặn thi.
7. Vào **Không gian học tập → Chứng chỉ** để cấp/tải PDF sau khi hoàn thành bài và đạt quiz. Khóa hoàn thành chuyển sang **Ôn tập**.

## Phạm vi đánh giá và video

- Quiz được biên soạn riêng cho VEDU, xoay thứ tự lựa chọn và chấm bằng hệ thống. Đây là bài kiểm tra kiến thức phục vụ khóa tự học, không thay cơ cấu điểm học phần của trường.
- Bài thực hành code/UML và đề tự luận mẫu trong RAR hiện là hoạt động luyện tập, **chưa có nộp/chấm code, chấm sơ đồ hoặc quy trình giảng viên chấm tự luận riêng**. Không dùng trạng thái “đã đọc” làm bằng chứng đã đạt thực hành.
- Các liên kết Kteam, Microsoft Learn và Lucid mở trang gốc. Không tải lại video, không tuyên bố đã nhúng/kiểm tra phát hết từng video, không ghi thời gian xem nguồn ngoài thành thời gian xem trong VEDU.
- Bài tập bổ sung trong RAR có ghi nguồn ChatGPT. PDF gốc giữ nguyên, VEDU không tự nhận là tác giả tài liệu hay đơn vị cấp chứng chỉ chính thức của trường.

## Tài liệu và bảo vệ truy cập

- 20 PDF học viên từ hai RAR được đối chiếu SHA-256, lưu tại `data/learning/software-course-assets/`, sao vào `backend/media/` và volume `vedu_media` đang chạy.
- Không đưa PDF gốc vào `frontend/public`. Khi mở, API dùng vé có hạn và kiểm tra phiên đăng nhập, ghi danh, vai trò/quyền sở hữu. Khách vẫn chỉ học thử hai bài đầu.
- Không sao chép thư mục `04_DanhChoGiangVien`, `lessons_teacher.json`, `exam_teacher.json`, `teacher_only.json` hoặc các PDF đáp án lên web. Các tệp này vẫn nằm trong RAR gốc của nhóm, chưa có trang quản lý đáp án riêng trên ứng dụng.
- `software-curriculum.json` là dữ liệu học viên đã chuẩn hóa, giữ mục tiêu, bài tập và nguồn. `software-assessments.mjs` là ngân hàng quiz phía công cụ nhập, không nằm trong bundle frontend.

## Cài lại trên máy khác hoặc sau khi tạo database/volume mới

Từ thư mục gốc dự án, sau khi có `.env` và Docker chạy:

```powershell
npm ci --prefix backend
docker compose up -d
node scripts/import-software-curriculum.mjs
node scripts/configure-course-overviews.mjs
node scripts/build-course-covers.mjs
docker compose build frontend
docker compose up -d --no-deps frontend
```

Không cần giải nén lại nếu đã mang theo thư mục `data/learning/software-course-assets` và dữ liệu chuẩn hóa. Công cụ nhập kiểm tra hash, sao PDF vào volume và tạo dữ liệu khóa; chạy lại không tạo bản trùng hoặc ghi đè tiến độ/nội dung bài đã nhập. ID khóa có thể khác trên database mới, vì vậy công cụ cập nhật lại danh mục và ảnh trước khi build frontend.

Nếu chỉ chạy backend bằng VS Code, dùng `node scripts/import-software-curriculum.mjs --local-only` và để backend dùng `backend/media` làm thư mục media mặc định. Chạy lệnh từ gốc dự án; API cần sẵn sàng để cập nhật danh mục ảnh. Lưu ý sao lưu cả PostgreSQL **và** volume media khi bàn giao.

Để chuẩn hóa lại từ RAR đã giải nén: `node scripts/prepare-software-curriculum.mjs <thu-muc-chua-hai-goi-da-giai-nen>`. Công cụ chỉ đọc dữ liệu học viên và danh sách PDF được cho phép; không đọc JSON đáp án giảng viên.

## Ảnh khóa học

Word: trang báo cáo, Styles/Heading và mục lục bố cục; Excel: ô dữ liệu chi phí, SUM và tổng; PowerPoint: danh sách slide, bố cục và biểu đồ; Microsoft 365: tệp, mail và cộng tác. OOP có C#/lớp/đa hình, Phân tích thiết kế có actor/use case/lớp và chuỗi yêu cầu→mô hình→hiện thực. Sáu ảnh là đồ họa gốc bằng mã, không cần dịch vụ AI hoặc ảnh ngẫu nhiên. Tôn trọng ảnh riêng giảng viên đã chọn.

## Minh chứng kiểm tra

- `docs/validation/software-curriculum-import.json`: ID khóa, bài, quiz sau khi nhập.
- `docs/validation/software-course-checks.json`: 28 kiểm tra API/CSDL, bao gồm PDF nguyên bản, phân quyền, điều kiện thi, chấm điểm, cấp chứng nhận và loại tài khoản kiểm thử khỏi số học viên công bố.
- `docs/validation/software-course-browser-checks.json`: ảnh đúng môn tải thành công trên sáu khóa, không lỗi JavaScript; trang mới ở màn hình 390 px không tràn ngang.
- `docs/validation/course-cover-checks.json`: 52 ảnh có đường dẫn/hash riêng, không trùng hoàn toàn theo dấu vân tay ảnh, tải đúng qua frontend.
- `docs/validation/ui-interactions.json`: 36 kiểm tra React có sẵn vẫn đạt.

Kiểm tra nghiệp vụ sử dụng tài khoản riêng có `is_test_account=true`; thu hồi phiên và khóa tài khoản sau khi kiểm tra. Bản ghi hoàn thành được giữ để kiểm tra dấu vết, không được tính vào số học viên hiển thị trên thẻ/trang khóa. Không thay tiến độ của học viên thật.
