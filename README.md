# Vedu LMS Capstone

Ứng dụng React + NestJS + PostgreSQL và worker Python HUSPM/BPR/GRU.

- [Kịch bản demo STT 6 và cách chạy](docs/STT6_DEMO_GUIDE.md)
- [Đối chiếu chức năng đã làm / còn thiếu](docs/STT6_COMPLETION_AUDIT.md)
- [Giải thích chi tiết hệ khuyến nghị](docs/RECOMMENDATION_SYSTEM_GUIDE.md)

PowerShell tại thư mục dự án: `docker compose up --build -d`, mở `http://localhost:8080`.
Để huấn luyện Kaggle, chạy `scripts/import-ml-datasets.ps1` trước. Không xóa volume để cập nhật schema.
MoMo Sandbox/SMTP cần khóa riêng của nhóm trong `.env`; HTTPS và tiêu chí kiểm thử–triển khai cuối đang tạm hoãn theo yêu cầu.

Vedu LMS hiện có luồng demo hoàn chỉnh: React gọi NestJS qua REST API, NestJS đọc và ghi PostgreSQL, còn toàn bộ ba dịch vụ được khởi động bằng Docker Compose.

## Kiến trúc demo

```text
Trình duyệt http://localhost:8080
        |
        v
Frontend React + Nginx -- /api --> Backend NestJS :3000
                                      |
                                      v
                               PostgreSQL 16
                         schema vedu_v6 + demo seed
```

PostgreSQL là bắt buộc vì backend đang đọc khóa học, xác thực tài khoản, lưu session, learning event và kết quả quiz trong database. File `database/vedu/vedu_v6.sql` được mount read-only vào container và chỉ chạy tự động khi volume PostgreSQL được tạo lần đầu.

## Cách chạy demo nhanh nhất bằng Docker

Yêu cầu: Docker Desktop đang chạy.

Kiểm tra Docker engine trước khi chạy Compose:

```powershell
docker version
wsl --status
```

Nếu `docker version` báo không kết nối được `dockerDesktopLinuxEngine` hoặc `wsl --list --verbose` không có distribution, mở PowerShell bằng quyền Administrator, cài WSL rồi khởi động lại Windows:

```powershell
wsl --install -d Ubuntu
```

Sau khi khởi động lại, mở Docker Desktop, chờ trạng thái Engine running rồi mới chạy các lệnh bên dưới.

Mở PowerShell tại thư mục gốc dự án rồi chạy:

```powershell
Copy-Item .env.example .env
docker compose config
docker compose up --build -d
docker compose ps
```

Trước khi trình bày thật, hãy mở `.env` và thay `POSTGRES_PASSWORD`, `JWT_SECRET` bằng giá trị riêng. Có thể tạo secret ngẫu nhiên trong PowerShell:

```powershell
[Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(48))
```

Mở ứng dụng tại `http://localhost:8080`.

Giao diện không hiển thị thông tin tài khoản/mật khẩu mẫu. Tại cổng học viên, chọn **Tiếp tục với tài khoản khách** để trải nghiệm một phiên học riêng. Giảng viên và admin cần tài khoản đúng role. Đăng ký thành công hiển thị thông báo và nút **Đăng nhập**, không tự đăng nhập.

Thanh tìm kiếm và trang `/courses` tìm tên khóa/chủ đề/giảng viên qua API PostgreSQL; menu chủ đề được tạo từ catalog đã xuất bản. Giảng viên có thể nhập chủ đề khi tạo khóa mới; danh mục tự cập nhật theo API và khi quay lại/focus trang, không cần sửa frontend.

Báo cáo đối chiếu mức độ hoàn thiện theo mục 8/STT 6 nằm tại [RUBRIC_SECTION_8_ITEM_6_REVIEW.md](docs/RUBRIC_SECTION_8_ITEM_6_REVIEW.md). Các tiêu chí còn thiếu được ghi rõ, đặc biệt AI thật, thanh toán, chứng nhận và bảo vệ các API cũ.

Ba tài khoản theo vai trò đã được seed (đăng nhập bằng username, cùng mật khẩu `Demo@123`):

```text
STUDENT: student
TEACHER: teacher
ADMIN:   admin
```

Các route chính:

```text
/                         Trang chủ công khai dành cho học viên
/student/login            Đăng nhập học viên
/student/register         Đăng ký học viên
/student                  Trang chủ sau đăng nhập của học viên
/teacher/login            Đăng nhập giảng viên
/teacher                  Trang chủ sau đăng nhập của giảng viên
/admin/login              Đăng nhập quản trị viên (không có quên mật khẩu)
/admin                    Trang chủ sau đăng nhập của quản trị viên
/courses/:courseId        Chi tiết khóa học
/learn/:courseId/:lessonId Phòng học
/quiz/:courseId/:quizId   Bài kiểm tra
```

Backend kiểm tra `expectedRole`, vì vậy tài khoản giảng viên không thể đăng nhập tại route học viên và ngược lại. Access token có hiệu lực `259200` giây (3 ngày).

### Gửi PIN quên mật khẩu qua Gmail

Tạo **App Password** cho tài khoản Gmail cá nhân, sau đó điền vào `.env`:

```dotenv
PASSWORD_RESET_DEMO_MODE=false
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-personal-email@gmail.com
SMTP_PASS=your-16-character-app-password
SMTP_FROM=Vedu LMS <your-personal-email@gmail.com>
```

Không dùng mật khẩu Gmail thường và không commit `.env`. Khi demo ngoại tuyến có thể để `PASSWORD_RESET_DEMO_MODE=true`; API sẽ trả `demoResetPin` để trình bày mà không phụ thuộc Internet. Production phải đặt `false` để PIN chỉ đi qua email.

Hướng dẫn trình bày theo từng role và kịch bản demo 12–15 phút nằm tại `docs/DEMO_GUIDE.md`.

Kiểm tra API và log:

```powershell
Invoke-RestMethod http://localhost:3000/api/health
Invoke-RestMethod http://localhost:3000/api/courses
docker compose logs -f backend
```

Nhấn `Ctrl+C` để thoát chế độ theo dõi log. Dừng hệ thống nhưng giữ dữ liệu:

```powershell
docker compose down
```

Khởi động lại với dữ liệu cũ:

```powershell
docker compose up -d
```

## Kiểm tra PostgreSQL trong container

Không cần cài PostgreSQL trực tiếp trên Windows. Database không publish cổng 5432 ra máy host; chỉ backend trong Docker network truy cập được.

Mở `psql` ngay trong container:

```powershell
docker compose exec db psql -U vedu_app -d vedu
```

Các lệnh hữu ích trong `psql`:

```sql
\dn
\dt lms.*
SELECT course_id, course_name, status FROM lms.courses;
SELECT user_id, username, full_name, email, phone, role FROM auth.users;
SELECT attempt_id, student_id, score, status FROM assessment.quiz_attempts;
SELECT log_id, action, lesson_id, occurred_at FROM learning.learning_sequence_logs ORDER BY log_id DESC;
\q
```

Để xem lệnh khởi tạo schema có lỗi hay không:

```powershell
docker compose logs db
```

## Reset database để chạy lại file vedu_v6.sql

PostgreSQL chỉ chạy thư mục `/docker-entrypoint-initdb.d` khi volume rỗng. Khi schema hoặc seed thay đổi và muốn tạo lại database demo từ đầu:

```powershell
docker compose down -v
docker compose up --build -d
```

Lưu ý: `down -v` xóa toàn bộ dữ liệu trong volume demo. Hãy backup trước nếu đã nhập dữ liệu cần giữ:

```powershell
docker compose exec -T db pg_dump -U vedu_app -d vedu -Fc > vedu-demo.backup
```

Khôi phục một backup vào database rỗng:

```powershell
Get-Content -AsByteStream .\vedu-demo.backup | docker compose exec -T db pg_restore -U vedu_app -d vedu --clean --if-exists
```

## Chạy trong Visual Studio Code

Mở đúng thư mục gốc `vedu-lms-capstone` bằng VS Code:

```powershell
code C:\Project\vedu-lms-capstone
```

Sau đó nhấn `Ctrl+Shift+P`, chọn `Tasks: Run Task`, rồi chọn `Vedu: Start development`. Task này sẽ thực hiện theo thứ tự:

1. Cài dependencies cho backend và frontend.
2. Tạo `.env` từ `.env.example` nếu chưa có.
3. Chạy PostgreSQL bằng Docker và chỉ mở cổng 5432 trên localhost.
4. Chạy NestJS watch mode tại `http://localhost:3000`.
5. Chạy Vite tại `http://localhost:5173`.

Có thể chạy thủ công bằng ba terminal VS Code.

Terminal 1 - PostgreSQL và seed demo theo role:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\start-dev-db.ps1
```

Terminal 2 - Backend:

```powershell
Set-Location C:\Project\vedu-lms-capstone\backend
npm ci
npm run start:dev
```

Chỉ chuyển sang terminal frontend khi backend in ra `Nest application successfully started`.

Terminal 3 - Frontend:

```powershell
Set-Location C:\Project\vedu-lms-capstone\frontend
npm ci
npm run dev
```

Kiểm tra trước khi đăng nhập:

```powershell
Invoke-RestMethod http://localhost:3000/api/health
Invoke-RestMethod http://localhost:5173/api/health
```

Cả hai lệnh phải trả về `status: ok`. Vite proxy `/api` sang `http://localhost:3000`, vì vậy lỗi `502 Bad Gateway` nghĩa là backend chưa chạy hoặc đã dừng vì không kết nối được PostgreSQL.

## Luồng nên trình bày với giảng viên hướng dẫn

1. Mở trang chủ học viên; trình bày slider thịnh hành, bán chạy và bốn nhóm chủ đề (mỗi nhóm ít nhất 10 khóa học).
2. Mở các URL đăng nhập theo role, chứng minh backend từ chối tài khoản dùng sai cổng.
3. Đăng nhập bằng username demo; backend kiểm tra hash mật khẩu và tạo bản ghi trong `auth.user_sessions`.
4. Mở khóa học; thời lượng không hiển thị ở trang giới thiệu nhưng hiển thị bằng giây trong phòng học.
5. Tua video để chứng minh đoạn bỏ qua không được tính; hệ thống ghi số giây phát thực tế và vùng nội dung đã xem duy nhất.
6. Làm quiz; backend chấm điểm, lưu `assessment.quiz_attempts` và `assessment.quiz_attempt_answers`.
7. Dùng các câu lệnh SQL phía trên để chứng minh dữ liệu đã được lưu thật, không còn lấy từ `mockData.js`.

## Lưu ý bảo mật khi đóng gói database

- Docker giúp tái lập môi trường và cô lập mạng, nhưng tự nó không mã hóa hay tự động làm database an toàn.
- Không commit file `.env`; repository chỉ lưu `.env.example`.
- Database không mở cổng 5432 ra ngoài ở cấu hình mặc định.
- File SQL được mount read-only; dữ liệu chạy thật nằm trong named volume `vedu_postgres_data`.
- Đổi toàn bộ mật khẩu demo và JWT secret trước khi triển khai ngoài máy cá nhân.
- Khi triển khai thật, dùng secret manager, TLS, role PostgreSQL có quyền tối thiểu, backup định kỳ và không dùng tài khoản owner cho request ứng dụng.

## Các file tích hợp chính

- `docker-compose.yml`: khởi động PostgreSQL, backend và frontend.
- `database/vedu/vedu_v6.sql`: schema PostgreSQL chính.
- `database/vedu/demo_seed.sql`: dữ liệu phục vụ demo.
- `database/vedu/portal_demo_seed.sql`: tài khoản Admin, tiến độ, HUSPM pattern và recommendation mẫu; chạy lặp lại an toàn.
- `backend/src/portal`: API dashboard và thao tác phân quyền cho Student/Teacher/Admin.
- `frontend/src/components/Portal.jsx`: giao diện responsive theo role.
- `docs/DEMO_GUIDE.md`: hướng dẫn chạy, xử lý lỗi và kịch bản trình bày đầy đủ.
- `backend/src/courses`: API catalog và chi tiết khóa học.
- `backend/src/assessment`: tải quiz, tạo attempt và chấm bài.
- `backend/src/learning`: ghi learning event.
- `frontend/src/services/api.js`: lớp gọi REST API dùng chung.

# Học liệu và nhiều lộ trình (15/10/2026)

Xem [hướng dẫn học liệu thực hành, 2–4 phương án và giải thích](docs/LEARNING_CONTENT_AND_PATHS.md).
