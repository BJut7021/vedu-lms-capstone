# Ghi chú tổng hợp màn hình & chức năng hệ thống Vedu LMS
*Tui note lại chi tiết giao diện và luồng dữ liệu 3 role để ông Thiện với Duy dựa vào đây chốt bảng DB PostgreSQL với viết API nhé*

---

## TỔNG SỐ MÀN HÌNH DỰ KIẾN: 14 màn hình
Chia làm 4 cụm:
1. Dùng chung / Khách: 3 trang
2. Role Học viên (Student): 5 trang
3. Role Giảng viên (Teacher): 3 trang
4. Role Quản trị (Admin): 3 trang

---

## 1. CỤM DÙNG CHUNG & KHÁCH (Public)

### 1.1. Trang chủ (Home) - [Giao diện đã làm xong]
- **Người dùng thấy gì:** 
  - Header (logo, menu, thanh search khóa học, nút đăng nhập/đăng ký).
  - Banner giới thiệu web.
  - Danh sách "Khóa học nổi bật" (card hiển thị thumbnail, tên khóa, tên giảng viên, số sao, số bài học, tổng thời lượng).
  - Footer thông tin nhóm và bản quyền.
- **Backend cần:**
  - API lấy danh sách khóa học nổi bật (`GET /api/courses/featured`).
  - DB cần bảng: `courses`, `users` (để lấy tên giảng viên).

### 1.2. Popup Đăng nhập / Đăng ký (Auth Modal) - [Giao diện đã làm xong]
- **Người dùng thao tác:**
  - Tab Đăng nhập: nhập email, mật khẩu -> bấm Đăng nhập.
  - Tab Đăng ký: nhập họ tên, email, mật khẩu, chọn vai trò (Học viên hoặc Giảng viên) -> bấm Đăng ký.
- **Backend cần:**
  - API login: kiểm tra pass hash, trả về JWT token + role của user (`POST /api/auth/login`).
  - API register: tạo tài khoản mới trong DB (`POST /api/auth/register`).
  - DB cần bảng: `users` (id, email, password_hash, full_name, role, created_at).

### 1.3. Trang Tìm kiếm & Lọc khóa học (Course Catalog)
- **Người dùng thao tác:**
  - Ô search từ khóa môn học.
  - Bộ lọc bên trái: lọc theo danh mục (Web, AI, Database,...), lọc theo cấp độ (Cơ bản, Nâng cao).
  - Danh sách kết quả trả về dạng lưới có phân trang.
- **Backend cần:**
  - API tìm kiếm khóa học có query params lọc (`GET /api/courses?search=...&category=...&page=...`).
  - DB cần bảng: `categories`, `courses`.

---

## 2. ROLE HỌC VIÊN (Student)

### 2.1. Trang Chi tiết khóa học & Đề cương - [Giao diện đã làm xong]
- **Người dùng thấy gì:**
  - Banner thông tin: tên môn, mô tả, giảng viên, tổng số bài, đánh giá.
  - Đề cương chia theo Chương 1, Chương 2... bấm vào xổ ra danh sách bài học con.
  - Biểu tượng phân biệt loại bài (video, tài liệu PDF, bài quiz) kèm trạng thái bài nào đã học xong (tích xanh).
  - Nút "Vào phòng học ngay" để nhảy thẳng vào bài học tiếp theo.
- **Backend cần:**
  - API lấy chi tiết khóa học + cấu trúc chương/bài (`GET /api/courses/:id`).
  - DB cần bảng: `sections` (chương), `lessons` (bài học), `enrollments` (học viên nào đã đăng ký môn nào).

### 2.2. Màn hình Phòng học trực tuyến (Classroom) - [Giao diện đã làm xong]
- **Người dùng thao tác:**
  - Cột trái: menu danh sách các bài học trong khóa, click bài nào thì màn hình bên phải chuyển sang bài đó.
  - Cột phải: 
    - Nếu là bài video: chạy video, tự động bắt tiến độ xem. Khi học viên xem đạt từ 85% trở lên thì tự động đánh dấu bài đó hoàn thành và cập nhật thanh tiến độ khóa học.
    - Nếu là tài liệu PDF: xem nội dung tài liệu và có nút bấm "Đã đọc xong".
- **Backend cần:**
  - API lưu tiến độ học của từng bài (`POST /api/progress/lesson-complete`).
  - DB cần bảng: `lesson_progress` (user_id, lesson_id, status, completed_at), `learning_logs` (lưu lại log để làm dữ liệu cho mô hình AI chạy gợi ý).

### 2.3. Màn hình Làm bài Quiz trắc nghiệm - [Giao diện đã làm xong]
- **Người dùng thao tác:**
  - Đồng hồ đếm ngược (ví dụ 10 phút), hết giờ tự động khóa và thu bài.
  - Chọn đáp án trắc nghiệm A, B, C, D cho từng câu hỏi.
  - Bấm "Nộp bài": hệ thống tự chấm điểm (thang điểm 10), báo Đạt/Không đạt, hiện đáp án đúng (xanh) và sai (đỏ).
- **Backend cần:**
  - API lấy đề thi quiz (`GET /api/quizzes/:id`).
  - API nộp bài và lưu điểm (`POST /api/quizzes/:id/submit`).
  - DB cần bảng: `quizzes`, `quiz_questions`, `quiz_options`, `quiz_results` (user_id, quiz_id, score, time_spent).

### 2.4. Dashboard học viên (Student Dashboard)
- **Người dùng thấy gì:**
  - Danh sách các khóa học mình đang học kèm thanh % tiến độ đã hoàn thành.
  - **Khối quan trọng của đề tài (Lộ trình AI gợi ý):** Hiển thị danh sách các bài học gợi ý tiếp theo dựa trên lịch sử xem video và điểm thi quiz vừa qua.
  - Thống kê nhanh: tổng số giờ học, số bài kiểm tra đã làm.
- **Backend cần:**
  - API lấy danh sách khóa đang học của user (`GET /api/student/my-courses`).
  - API trả về kết quả gợi ý từ model AI (`GET /api/student/recommendations`).
  - DB cần bảng: `recommendations` (user_id, recommended_lesson_id, reason).

### 2.5. Trang Cá nhân học viên (Profile)
- **Người dùng thao tác:**
  - Xem và sửa thông tin: họ tên, số điện thoại, avatar.
  - Đổi mật khẩu.
  - Xem bảng lịch sử điểm số các bài quiz đã làm.
- **Backend cần:**
  - API xem/sửa profile (`GET/PUT /api/users/profile`).

---

## 3. ROLE GIẢNG VIÊN (Teacher)

### 3.1. Dashboard giảng viên
- **Giảng viên thấy gì:**
  - Thẻ thống kê: tổng số khóa học đang dạy, tổng số học viên đăng ký, đánh giá sao trung bình.
  - Biểu đồ số lượng học viên học theo tuần/tháng.
- **Backend cần:**
  - API thống kê tổng quan (`GET /api/teacher/dashboard-stats`).

### 3.2. Quản lý danh sách khóa học (Course List)
- **Giảng viên thao tác:**
  - Bảng danh sách các khóa của mình: tên khóa, danh mục, số học viên, trạng thái (Bản nháp / Đã xuất bản).
  - Nút: Thêm khóa học mới, Chỉnh sửa, Xóa khóa.
- **Backend cần:**
  - API lấy danh sách khóa do giảng viên tạo (`GET /api/teacher/courses`).
  - API xóa khóa học (`DELETE /api/courses/:id`).

### 3.3. Trang Soạn & Sửa nội dung khóa học (Course Builder)
- **Giảng viên thao tác:**
  - Tab 1: Nhập thông tin chung (tên khóa, mô tả, chọn danh mục, up ảnh bìa).
  - Tab 2: Thêm Chương -> Trong chương thêm bài học (nhập tên bài, gắn link video hoặc up file PDF).
  - Tab 3: Tạo bài Quiz (nhập câu hỏi, 4 đáp án lựa chọn, tích chọn câu nào đúng, set thời gian làm bài).
- **Backend cần:**
  - Các API CRUD khóa học, chương, bài học và quiz (`POST/PUT /api/courses`, `/sections`, `/lessons`, `/quizzes`).

---

## 4. ROLE QUẢN TRỊ VIÊN (Admin)

### 4.1. Dashboard hệ thống
- **Admin thấy gì:**
  - Thống kê toàn sàn: tổng số user (bao nhiêu học viên, bao nhiêu giảng viên), tổng số khóa học đang mở.
  - Biểu đồ tăng trưởng người dùng mới.
- **Backend cần:**
  - API thống kê hệ thống (`GET /api/admin/stats`).

### 4.2. Quản lý Người dùng (User Management)
- **Admin thao tác:**
  - Bảng danh sách tất cả tài khoản trên web (tên, email, role, ngày tạo, trạng thái).
  - Bộ lọc theo role (Student / Teacher / Admin).
  - Nút: Phân quyền vai trò, Khóa tài khoản (Block), Mở khóa.
- **Backend cần:**
  - API lấy danh sách user và cập nhật trạng thái user (`GET /api/admin/users`, `PUT /api/admin/users/:id/status`).

### 4.3. Quản lý Danh mục & Duyệt khóa học
- **Admin thao tác:**
  - Thêm / sửa / xóa các danh mục ngành học (Lập trình web, AI, Hệ điều hành,...).
  - Duyệt khóa học: Xem trước nội dung khóa học do Giảng viên tạo -> bấm "Duyệt" (Public lên web) hoặc "Từ chối".
- **Backend cần:**
  - API quản lý danh mục (`CRUD /api/categories`).
  - API duyệt khóa học (`PUT /api/admin/courses/:id/approve`).