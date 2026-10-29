# Cập nhật giao diện và hồ sơ — 24/10/2026

## Những thay đổi có thể thao tác

- Trang chủ sáng, bố cục hai cột theo ảnh tham khảo; ảnh lớp học thật, banner học tập và dải thống kê. Số khóa học và chủ đề lấy từ danh mục được công bố qua API, không gắn số cố định. Hiện dữ liệu kiểm tra có **50 khóa học, 7 chủ đề**. Làm mới khi quay lại cửa sổ, thao tác tìm kiếm/chủ đề và định kỳ 30 giây.
- Phòng học có danh sách chương/bài bên trái, nội dung ở giữa, học liệu và tiến độ bên phải trên màn hình rộng. Màn hình nhỏ dùng bộ chọn bài, tab tài liệu vẫn truy cập được. Chỉ hiện tab video/bài tập khi bài có nội dung tương ứng. Giữ nguyên học liệu thật, quyền học và ghi nhận thời gian xem video.
- Bấm **Bài kế tiếp**, **Bài trước** hoặc chọn bài trong danh sách sẽ mở route bài tương ứng và cuộn tức thời về đầu, cả trục dọc và ngang. Không tự đánh dấu bài hoàn thành khi bấm kế tiếp. Tài liệu cần bấm xác nhận đã đọc; video theo dõi nội dung thực xem.
- **Lộ trình gợi ý → Quỹ thời gian mỗi tuần (giờ)**: nhập từ 0,5 đến 40, bước 0,25 giờ. Ví dụ 2,5 giờ = 9.000 giây. Chỉ đổi đơn vị người dùng nhập; API và PostgreSQL giữ `weeklySeconds` để thống nhất với các phép tính hiện có. Đọc lại lộ trình cũ tự chuyển giây về giờ.
- **Không gian học tập → Hồ sơ cá nhân → Chọn ảnh đại diện → Lưu ảnh đại diện** dùng cho học viên và giảng viên. Routes: `/student/profile`, `/teacher/profile`. Ảnh xuất hiện trên thanh điều hướng, bảng điều khiển và hồ sơ; giữ sau tải lại/đăng nhập lại. Khách không có chức năng tải ảnh.

## Lưu avatar

Nhận JPG/PNG/WebP tối đa 5 MB, kiểm tra nội dung ảnh thực phía máy chủ, giới hạn 25 megapixel. Máy chủ xoay theo hướng ảnh, cắt vuông 256×256, chuyển JPEG và bỏ metadata. Không nhận SVG. Tên tệp do máy chủ tạo; người dùng chỉ đổi ảnh của tài khoản đang đăng nhập. Khi thay ảnh, chỉ xóa ảnh cũ do hệ thống tạo cho chính tài khoản đó.

- Upload: `POST /api/users/me/avatar`, multipart field `file`, access token của học viên/giảng viên.
- URL ảnh: `GET /api/users/avatars/:filename` để hiển thị avatar công khai trong giao diện; không nên dùng ảnh riêng tư cho avatar.
- PostgreSQL lưu URL tại `auth.users.avatar_url`; tệp ảnh nằm trong Docker volume `vedu_media`, thư mục `/app/media/avatars`. Cần sao lưu cả volume cùng database để giữ ảnh. Không cần tạo cột mới.
- Chạy backend trực tiếp trong VS Code: ảnh lưu tại `backend/media/avatars` khi chạy trong thư mục backend và chưa đặt `MEDIA_DIR`.

## Mở bản mới

Đã dựng và chạy bằng Docker trên máy. Mở <http://localhost:8080/> và nhấn **Ctrl+F5** để nhận giao diện mới.

Nếu cần dựng lại từ terminal VS Code tại thư mục dự án:

```powershell
cd C:\Project\vedu-lms-capstone
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
```

Không xóa volume để cập nhật giao diện/ảnh. Luồng chạy frontend/backend trực tiếp bằng các task VS Code hiện có vẫn được giữ; backend cần `npm ci` sau khi cập nhật vì bổ sung thư viện xử lý ảnh.

## Minh chứng kiểm tra

- `docs/validation/profile-ui-checks.json`: 22 kiểm tra trên API chạy thật qua frontend Docker và PostgreSQL, gồm học viên/giảng viên tải ảnh; chặn khách/quản trị/không đăng nhập; tệp sai định dạng, PNG hỏng, hơn 5 MB; ảnh JPEG 256×256 bỏ EXIF; quyền sở hữu; thay/xóa ảnh cũ; lưu URL; lớp học; lưu 2,5 giờ thành 9.000 giây và đọc lịch sử.
- Kiểm tra bổ sung: ảnh vẫn trả về JPEG HTTP 200 sau khi khởi động lại container backend.
- `docs/validation/ui-interactions.json`: 15 kiểm tra thao tác React trong JSDOM: đổi giờ/đọc dữ liệu cũ/gửi biểu mẫu; chuyển bài, cuộn về đầu và giữ tiến độ; tab tài liệu/bàn phím; chọn ảnh, báo sai định dạng và cập nhật avatar cho cả hai vai trò; số khóa học và ảnh thật trên trang chủ.
- Backend: 5 bộ kiểm thử / 5 kiểm thử đạt. Frontend và backend build/lint đạt.
- Chưa xác minh trực quan bố cục trong trình duyệt ở lần này: công cụ chụp cửa sổ Chrome bị lỗi `computer-use request timed out: get_window_state` hai lần. Kiểm tra React/JSDOM xác minh hành vi, không thay thế kiểm tra bố cục ở các kích thước màn hình. Không dùng ảnh minh chứng cũ để đại diện giao diện mới.

Chạy lại kiểm tra:

```powershell
npm --prefix frontend run test:ui
node scripts/verify-profile-upgrade.mjs
npm --prefix frontend run lint
npm --prefix frontend run build
npm --prefix backend run build
npm --prefix backend run lint
npm --prefix backend test -- --runInBand
```

Kiểm tra API tạo tài khoản được đánh dấu `is_test_account`, sau đó thu hồi phiên và khóa chúng. Dữ liệu học của các tài khoản này là dữ liệu kiểm thử, không phải hành vi học viên thật để đánh giá mô hình.
