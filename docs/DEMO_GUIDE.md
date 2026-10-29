# Hướng dẫn chạy và kịch bản demo Vedu LMS

> Hướng dẫn cũ. Bản cập nhật sau khi tích hợp ML và giới hạn khách nằm ở [STT6_DEMO_GUIDE.md](STT6_DEMO_GUIDE.md). Khách không còn được dùng quiz, chứng nhận, thanh toán hay gợi ý cá nhân.

Tài liệu này dùng cho môi trường Windows + Visual Studio Code. PostgreSQL chạy trong Docker; không cần cài PostgreSQL trực tiếp trên Windows.

## 1. Tài khoản demo

Thông tin dưới đây dành cho nhóm phát triển kiểm thử nội bộ; giao diện người dùng không hiển thị credentials mẫu. Để trình bày với vai trò học viên, dùng nút **Tiếp tục với tài khoản khách** ở `/student/login`. Giảng viên/admin không có nút này. Đăng ký kết thúc bằng thông báo thành công và nút **Đăng nhập**.

Tất cả tài khoản dùng mật khẩu `Demo@123`.

| Vai trò | Username | Route đăng nhập | Không gian sau đăng nhập |
|---|---|---|---|
| Học viên | `student` | `/student/login` | Khóa học, tiến độ, quiz, lộ trình, đơn hàng, chứng chỉ, hỗ trợ, session |
| Giảng viên | `teacher` | `/teacher/login` | Khóa học, course builder, ngân hàng quiz, roster, sổ điểm, analytics |
| Quản trị | `admin` | `/admin/login` | Người dùng/RBAC, catalog, đơn hàng, HUSPM, pattern, support, cấu hình, audit |

## 2. Chạy bằng VS Code để phát triển

### Cách một lệnh/task

1. Mở Docker Desktop và đợi Engine running.
2. Mở đúng thư mục dự án:

```powershell
code C:\Project\vedu-lms-capstone
```

3. Trong VS Code nhấn `Ctrl+Shift+P` → `Tasks: Run Task` → `Vedu: Start development`.
4. Đợi terminal backend có dòng `Nest application successfully started` và terminal frontend có `Local: http://localhost:5173/`.
5. Mở `http://localhost:5173`.

### Cách ba terminal (dễ quan sát khi báo cáo)

Terminal 1 — PostgreSQL Docker và seed role:

```powershell
Set-Location C:\Project\vedu-lms-capstone
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\start-dev-db.ps1
```

Terminal 2 — NestJS backend:

```powershell
Set-Location C:\Project\vedu-lms-capstone\backend
npm ci
npm run start:dev
```

Terminal 3 — React/Vite frontend:

```powershell
Set-Location C:\Project\vedu-lms-capstone\frontend
npm ci
npm run dev
```

Nếu `node_modules` đã đúng theo `package-lock.json`, những lần sau có thể bỏ `npm ci`.

Kiểm tra trước khi demo:

```powershell
Invoke-RestMethod http://localhost:3000/api/health
Invoke-RestMethod http://localhost:5173/api/health
docker compose -f docker-compose.yml -f docker-compose.dev.yml ps
```

Hai URL health phải trả về `status: ok`; container `db` phải ở trạng thái `healthy`.

## 3. Chạy toàn bộ bằng Docker

```powershell
Set-Location C:\Project\vedu-lms-capstone
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
docker compose config --quiet
docker compose up --build -d
docker compose ps -a
```

Mở `http://localhost:8080`. Service `demo-seed` ở trạng thái `Exited (0)` là bình thường: đây là job chạy một lần để bảo đảm tài khoản role và dữ liệu portal có mặt kể cả khi dùng volume cũ.

Dừng ứng dụng nhưng giữ dữ liệu:

```powershell
docker compose down
```

Không chạy `docker compose down -v` trước buổi bảo vệ vì lệnh đó xóa volume database. Chỉ dùng khi chủ động muốn tạo lại dữ liệu demo từ đầu.

## 4. Kịch bản demo đề xuất (12–15 phút)

### Phần A — Kiến trúc và trang công khai (1 phút)

1. Mở trang chủ học viên, chỉ slider thịnh hành, bán chạy và danh mục theo bốn chủ đề được tải từ PostgreSQL qua NestJS.
2. Giải thích luồng: React → `/api` → NestJS → PostgreSQL 16.
3. Mở `/student/login` và chọn **Tiếp tục với tài khoản khách**. Các cổng teacher/admin không có đăng nhập khách. Có thể kiểm thử riêng việc chặn tài khoản sai cổng bằng tài khoản nội bộ.

### Phần B — Học viên (4–5 phút)

1. Vào `/student/login`, đăng nhập `student / Demo@123`; URL chuyển sang `/student`.
2. Ở Tổng quan: chỉ số khóa đang học, bài hoàn thành, lượt quiz và điểm trung bình.
3. Mở `Khóa học của tôi` → `Tiếp tục học` → chọn bài học.
4. Xem rồi tua video: video cho phép tua nhưng đoạn nhảy không cộng thời gian. Phòng học hiển thị thời lượng bằng giây, số giây xem thực tế, số giây nội dung duy nhất và phần trăm hoàn thành.
5. Mở quiz, chọn đáp án và nộp; backend chấm điểm, lưu attempt/answer.
6. Quay lại dashboard → `Lộ trình gợi ý`; giải thích score, reason và nguồn HUSPM. Có thể bấm Chấp nhận để lưu feedback.
7. Chỉ nhanh các màn hình Đơn hàng, Chứng chỉ, Hỗ trợ và Hồ sơ/Phiên đăng nhập. Trạng thái rỗng của đơn hàng/chứng chỉ là hợp lệ vì khóa demo miễn phí và chưa hoàn thành toàn bộ điều kiện.

### Phần C — Giảng viên (3 phút)

1. Đăng xuất, vào `/teacher/login`, đăng nhập `teacher / Demo@123`; URL chuyển sang `/teacher`.
2. Tổng quan: số khóa, học viên và bài đã chấm.
3. `Quản lý khóa học`: trạng thái DRAFT/PUBLISHED/ARCHIVED và nút xuất bản/lưu trữ.
4. `Soạn khóa học`: tạo khóa nháp và thêm bài học. Nếu không muốn làm thay đổi dữ liệu ngay trước hội đồng, chỉ trình bày form.
5. `Ngân hàng quiz`: số câu, điểm đạt, số lần làm.
6. `Danh sách học viên`, `Sổ điểm`, `Phân tích học tập`: chứng minh giảng viên chỉ thấy dữ liệu khóa mình phụ trách.

### Phần D — Quản trị viên (3–4 phút)

1. Đăng xuất, vào `/admin/login`, đăng nhập `admin / Demo@123`; URL chuyển sang `/admin`. Cổng admin không hiển thị quên mật khẩu.
2. Tổng quan: users, courses, learning events, mining runs và tickets.
3. `Người dùng & RBAC`: giải thích khóa tài khoản sẽ thu hồi session; không khóa chính tài khoản admin đang dùng.
4. `Kiểm duyệt nội dung` và `Đơn hàng & thanh toán`.
5. `HUSPM Mining`: chỉ metadata chạy, dataset version, sequence/event count và runtime.
6. Có thể bấm `Chạy mô phỏng`; nói rõ đây là run mô phỏng phục vụ demo pipeline và truy vết, chưa phải thuật toán Python nghiên cứu chạy thật.
7. `Mẫu & khuyến nghị`: chỉ support, utility và feedback loop.
8. `Cấu hình & nhật ký`: chỉ tham số HUSPM/recommendation và audit INSERT/UPDATE/DELETE.

### Phần E — Chứng minh dữ liệu thật (1–2 phút)

```powershell
docker compose exec db psql -U vedu_app -d vedu
```

Trong `psql`:

```sql
SELECT user_id, username, email, phone, role, is_active FROM auth.users ORDER BY user_id;
SELECT course_id, course_name, topic, status FROM lms.courses ORDER BY course_id;
SELECT log_id, student_id, action, lesson_id, occurred_at
FROM learning.learning_sequence_logs ORDER BY log_id DESC LIMIT 10;
SELECT attempt_id, student_id, score, status
FROM assessment.quiz_attempts ORDER BY attempt_id DESC LIMIT 10;
SELECT recommendation_id, source_type, recommendation_score, status
FROM learning.learning_path_recommendations ORDER BY recommendation_id DESC;
SELECT mining_run_id, dataset_version, sequence_count, event_count, status
FROM learning.mining_runs ORDER BY mining_run_id DESC;
SELECT action, schema_name, table_name, record_id, created_at
FROM system_config.audit_logs ORDER BY audit_id DESC LIMIT 10;
\q
```

## 5. Ranh giới chức năng cần nói rõ

- Chạy thật: xác thực/JWT/session, phân quyền role, catalog, ghi danh, lớp học, learning event, progress, quiz/chấm điểm, portal theo role, feedback, ticket, tạo course/lesson, quản trị user và audit.
- Quên mật khẩu: học viên/giảng viên nhận PIN 6 chữ số qua SMTP, PIN hết hạn sau 900 giây; admin không dùng luồng này. Demo ngoại tuyến có thể bật `PASSWORD_RESET_DEMO_MODE=true`.
- Access token: 259200 giây; mọi thời lượng trong phòng học, quiz, learning event và API dùng đơn vị giây.
- Dữ liệu demo có truy vết: mining run, high-utility pattern và recommendation seed.
- Chưa chạy thuật toán nghiên cứu thật: service Python trong `ml-core` chưa được nối thành pipeline production. Nút `Chạy mô phỏng` luôn ghi rõ trạng thái demo để không trình bày sai mức độ hoàn thiện.

## 6. Xử lý lỗi nhanh

### Frontend báo 502 hoặc ECONNREFUSED

Backend chưa lắng nghe cổng 3000. Kiểm tra Terminal 2 và chạy:

```powershell
Invoke-RestMethod http://localhost:3000/api/health
```

Nếu backend dừng vì database, chạy lại Terminal 1 rồi khởi động backend.

### Docker không kết nối được engine

```powershell
docker version
wsl --status
```

Mở Docker Desktop và chờ Engine running. Nếu máy chưa có WSL distribution, mở PowerShell Administrator:

```powershell
wsl --install -d Ubuntu
```

### Kiểm tra chất lượng trước buổi bảo vệ

```powershell
Set-Location C:\Project\vedu-lms-capstone\backend
npm run build
npm run lint
npm test -- --runInBand

Set-Location C:\Project\vedu-lms-capstone\frontend
npm run lint
npm run build
```

