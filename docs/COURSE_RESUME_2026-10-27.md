# Thời gian theo phút và tiếp tục học — 27/10/2026

## Giao diện

- Bỏ dòng thời lượng đọc dự kiến dưới tên các bài trong phòng học.
- Thời gian xem video thực, nội dung đã xem, thời lượng video, thời gian bài thi và thời gian lộ trình hiển thị bằng phút. Ví dụ 900 giây → 15 phút; 90 giây → 1,5 phút. Đồng hồ bài thi vẫn đếm theo hạn nộp máy chủ, không thay đổi thời điểm hết giờ.
- Biểu mẫu giảng viên nhập thời lượng bài học/bài thi bằng phút, tự đổi về giây trước khi gọi API. Giữ được thời lượng cũ không tròn phút.
- API, database và phép tính tiến độ tiếp tục dùng giây. Không thay đổi dữ liệu lịch sử, access token hay thời gian xử lý kỹ thuật của hệ thống. Nội dung học thuật tự do của bài học không bị tìm/thay đơn vị một cách tự động.

## Nút vào khóa

| Tiến độ thực | Nút | Đích mở |
|---|---|---|
| Chưa học | Bắt đầu học | Hướng dẫn đầu khóa |
| Đã mở một bài chưa hoàn thành | Tiếp tục học | Bài đang học dở gần nhất |
| Bài vừa học đã hoàn thành | Tiếp tục học | Bài chưa hoàn thành kế tiếp |
| Hoàn thành bài học, còn bài thi chưa đạt | Tiếp tục học | Bài thi còn thiếu |
| Hoàn thành bài học và đạt các bài thi được công bố | Ôn tập | Bài nội dung đầu tiên, bỏ qua bài hướng dẫn khi nhận diện được |

Mở bài đọc sẽ lưu sự kiện xem bài để lần sau quay lại đúng bài. Việc mở bài không tự hoàn thành tài liệu, không cộng thời gian xem video. Xem lại bài đã hoàn thành không làm mất kết quả. Khách vẫn bị giới hạn học thử; lộ trình/nút vào khóa không vượt qua thanh toán hoặc điều kiện thi.

Trang chi tiết khóa tải tiến độ riêng của người đăng nhập từ `GET /api/platform/courses/:id/study-state`; API không nhận ID học viên từ phía client, không ghi danh hay mở khóa học qua GET. Trong khi tải, nút chờ tiến độ để tránh nhảy nhầm về hướng dẫn. Nếu tải lỗi, nút bị vô hiệu; tải lại trang để thử lại. Danh sách khóa học trong không gian học tập cũng nhận biết trạng thái học xong dù chưa yêu cầu cấp chứng nhận.

## Kiểm tra

- `docs/validation/course-resume-2026-10-27.json`: 14 kiểm tra API với PostgreSQL thật, gồm người mới, tiếp tục bài đọc, chuyển bài tiếp theo, bài thi cuối, ôn tập, giữ kết quả khi xem lại, cô lập giữa học viên và bảo vệ học phí.
- `docs/validation/ui-interactions.json`: 30 kiểm tra React/JSDOM, gồm chọn đúng nhãn/đích nút, chờ tải tiến độ, hiển thị phút và bỏ dòng đọc dự kiến, cùng các kiểm tra giao diện trước đó.
- Frontend/backend build và lint; 5 kiểm thử backend. Kiểm tra trực quan trong trình duyệt không được tính là hoàn tất ở lần cập nhật này.

Kiểm tra API chỉ dùng các tài khoản kiểm thử được đánh dấu `is_test_account`, thu hồi phiên và khóa sau khi xong. Không sửa tiến độ học viên hiện có.

Mở <http://localhost:8080/> và **Ctrl+F5** để tải giao diện mới. Không cần nhập lại database.

Chạy lại:

```powershell
cd C:\Project\vedu-lms-capstone
npm --prefix frontend run test:ui
node scripts/verify-course-resume.mjs
```
