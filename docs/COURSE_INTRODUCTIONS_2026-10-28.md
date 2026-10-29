# Trang giới thiệu trước khi học và menu học viên

Đã thống nhất tên/ảnh đại diện/menu tài khoản ở trang chủ, danh mục, trang giới thiệu và phòng học. Menu có Hồ sơ & ảnh đại diện, Không gian học tập và Đăng xuất; đóng khi chọn mục, bấm ra ngoài hoặc nhấn Escape. Khách không có liên kết chỉnh hồ sơ; giảng viên/quản trị đi về bảng điều khiển đúng vai trò.

## Học viên

1. Mở <http://localhost:8080>, đăng nhập tài khoản học viên. Góc phải thanh điều hướng hiển thị tên và ảnh của tài khoản đang đăng nhập. Bấm tên để mở menu.
2. Mở một khóa học. Ngay phần đầu có **Xem đề cương & yêu cầu khóa học**, dẫn đến mục **Trước khi bắt đầu**.
3. Xem **Bạn sẽ học được gì?**, **Khóa học dành cho ai?**, **Cần chuẩn bị gì?**, **Điều kiện hoàn thành & chứng nhận**. Điểm đạt, số lượt, thời gian quiz và điều kiện mở thi cuối khóa lấy từ dữ liệu thực của từng khóa.
4. Nếu khóa có đề cương được công bố, chọn **Đọc đề cương**. PDF hiển thị ngay trong trang, có **Mở PDF đề cương** để đọc bằng trình xem riêng. Không cần ghi danh hoặc đăng nhập để đọc đề cương được công bố.
5. Sau khi hiểu nội dung và yêu cầu, chọn **Bắt đầu học**. Người đã học vẫn dùng **Tiếp tục học**; hoàn thành dùng **Ôn tập** theo tiến độ cũ.

Hai khóa có PDF gốc xem trước: [Lập trình hướng đối tượng](http://localhost:8080/courses/75), [Phân tích thiết kế hệ thống](http://localhost:8080/courses/76). Cấu trúc rời rạc và Mạng máy tính dùng liên kết hướng dẫn/đề cương HTML đã có. Bốn khóa Office lấy chuẩn đầu ra từ học liệu hiện có. Khóa chưa có yêu cầu/chuẩn đầu ra được công bố sẽ ghi rõ, không tự tạo lời hứa về kỹ năng.

## Giảng viên và quản trị

Vào **Nội dung & học liệu**, chọn khóa được sở hữu/phân công, bấm **Tải nội dung khóa học**. Trong phần **Giới thiệu trước khi học**:

- Nhập đối tượng học viên, kiến thức/công cụ cần chuẩn bị, chuẩn đầu ra (mỗi dòng một mục), cách đánh giá thực hành.
- Để trống chuẩn đầu ra để tự lấy từ các bài đã công bố.
- Chọn đúng tài liệu đề cương ở danh sách tài liệu của khóa; tài liệu này sẽ đọc được công khai. Không chọn đáp án, tài liệu riêng hoặc đề kiểm tra.
- Bấm **Lưu giới thiệu khóa học**. Khi sửa quiz, điều kiện hiển thị trên trang giới thiệu tự đổi theo cấu hình mới.
- Muốn ngừng chia sẻ đề cương, chọn **Không công bố tài liệu đề cương** rồi lưu. API PDF công khai đóng ngay.

## Dữ liệu và quyền truy cập

- Bảng mới `lms.course_overviews` lưu thông tin và ID đúng một tài liệu đề cương được chọn. Tạo bảng qua bản cập nhật `database/vedu/content_workflow.sql`, được dùng trong Docker và tác vụ VS Code hiện có.
- Chuẩn đầu ra mặc định lấy từ `lms.lesson_pedagogy.outcomes` của bài đã công bố. Không đọc toàn bộ nội dung bài học thành bản giới thiệu.
- Chỉ giảng viên sở hữu/được phân công hoặc admin sửa được. Không chọn tài liệu từ khóa khác, bài bị ẩn, tệp MP4 nội bộ hoặc đường dẫn tùy ý.
- `/api/courses/:id/syllabus` chỉ trả PDF được chọn thuộc bài/khóa đang công bố. Không nhận đường dẫn hoặc ID tài liệu từ tham số người xem.
- Xem đề cương không tạo ghi danh, không bỏ qua thanh toán và không mở những tài liệu còn lại. Những tài liệu đó tiếp tục đi qua API media có kiểm tra quyền.

## Chạy trên máy mới

Sau khi nhập các khóa học và API đã sẵn sàng, chạy từ thư mục gốc:

```powershell
node scripts/configure-course-overviews.mjs
docker compose up -d --build
```

Công cụ cấu hình tạo thông tin ban đầu cho tám khóa có học liệu cụ thể, không ghi đè bản giới thiệu đã được giảng viên sửa. Trên máy hiện tại đã áp dụng; chỉ cần Ctrl+F5.

Minh chứng: `docs/validation/course-introduction-checks.json` (API và quyền truy cập), `docs/validation/course-introduction-browser-checks.json` (trình duyệt), `docs/validation/ui-interactions.json` (42 tình huống React). Ảnh minh chứng ở `docs/screenshots/learner-header-home-2026-10-28.png`, `course-introduction-desktop-2026-10-28.png` và `course-syllabus-preview-2026-10-28.png`.
