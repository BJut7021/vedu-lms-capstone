# Kịch bản demo VEDU LMS theo STT 6

Cập nhật 15/10/2026. Mục tiêu: trình diễn luồng nghiệp vụ đã nối API/PostgreSQL, không chỉ lướt các bảng dữ liệu.

## 1. Chạy nhanh trong terminal VS Code — khuyến nghị cho báo cáo

Mở Docker Desktop, đợi **Engine running**. Mở đúng thư mục `C:\Project\vedu-lms-capstone` trong VS Code, Terminal → New Terminal → PowerShell:

```powershell
Set-Location C:\Project\vedu-lms-capstone
# Chỉ tạo .env nếu chưa có; không ghi đè cấu hình riêng đang dùng.
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\import-ml-datasets.ps1
docker compose up --build -d
docker compose ps
```

Mở **http://localhost:8080**. Cách này vẫn chạy từ terminal VS Code, nhưng frontend/backend/ML/PostgreSQL đều trong Docker. Không cần cài PostgreSQL trực tiếp trên Windows. PostgreSQL và ML không mở cổng công khai; database/học liệu/trọng số có volume riêng, không mất khi dừng container.

`import-ml-datasets.ps1` mặc định đọc hai thư mục ZIP đã giải nén ở `C:\2025-2026_Dai_Hoc\hk1-2026-namcuoi\CNTT_KLCN_260_EDU\dataset_training`. Nếu ở máy khác:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\import-ml-datasets.ps1 -SourceDirectory 'D:\du-lieu-kaggle-da-giai-nen'
```

Cập nhật code/schema: chạy lại `docker compose up --build -d`. Migration `platform_upgrade.sql` cộng thêm cấu trúc, không yêu cầu xóa database. **Không dùng `docker compose down -v` để sửa lỗi khởi động.**

Log khi lỗi:

```powershell
docker compose logs --tail 80 backend
docker compose logs --tail 80 ml
docker compose logs --tail 50 db
```

## 2. Nếu muốn frontend/backend chạy watch trực tiếp trong VS Code

Không chạy backend Docker và backend watch cùng cổng 3000. Không mở URL 5173 nếu chỉ chạy bản Docker 8080.

Terminal 1 — database:

```powershell
Set-Location C:\Project\vedu-lms-capstone
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\start-dev-db.ps1
```

Terminal 2 — ML Python (Python 3.11):

```powershell
Set-Location C:\Project\vedu-lms-capstone\ml-core
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install torch --index-url https://download.pytorch.org/whl/cpu
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
powershell -NoProfile -ExecutionPolicy Bypass -File ..\scripts\start-ml-dev.ps1
```

Terminal 3 — backend:

```powershell
Set-Location C:\Project\vedu-lms-capstone\backend
npm ci
powershell -NoProfile -ExecutionPolicy Bypass -File ..\scripts\start-backend-dev.ps1
```

Script lấy DB credentials từ `.env` gốc, dừng **chỉ container backend/frontend của dự án** để giải phóng cổng; không dừng database hay xóa volume.

Terminal 4 — frontend:

```powershell
Set-Location C:\Project\vedu-lms-capstone\frontend
npm ci
npm run dev
```

Mở **http://localhost:5173**. Để upload MP4 khi backend chạy native, máy cần `ffprobe` trong PATH hoặc cấu hình `FFPROBE_PATH`; bản Docker đã cài sẵn. Khi báo cáo nên dùng bản Docker để tránh lệch môi trường và dữ liệu artifact giữa Python native/Docker. Các job trong một môi trường không mặc nhiên đọc artifact của môi trường còn lại.

VS Code có task `Vedu: Full Docker demo (with ML)`; không cần mở terminal chạy từng service nếu dùng task này.

## 3. Chuẩn bị trước buổi demo

- Dùng tài khoản thành viên học viên và tài khoản teacher/admin của nhóm; **không trình chiếu credentials mặc định**. Tài khoản khách chỉ dùng cho đoạn học thử, không demo toàn bộ chức năng bằng khách.
- Tạo sẵn khóa nhỏ **“Demo bảo vệ đồ án”**, miễn phí, 1 chương, 1 video ngắn hợp quyền sử dụng, 1 PDF/ngắn văn bản và 1 quiz có 1–2 câu. Video thật cần xem ≥85%, không tua để giả hoàn thành.
- Huấn luyện hai dataset trước buổi demo để có kết quả sẵn, rồi có thể bắt đầu thêm một job trong lúc trình bày chức năng khác:

```powershell
Set-Location C:\Project\vedu-lms-capstone
node .\scripts\run-ml-benchmarks.mjs
python .\scripts\prepare-reference-course.py
```

Benchmark dùng tài khoản nội bộ seed cho môi trường local. Nếu nhóm đã đổi credentials, tự đặt `VEDU_ADMIN_USERNAME`/`VEDU_ADMIN_PASSWORD` và `VEDU_TEACHER_USERNAME`/`VEDU_TEACHER_PASSWORD` trong terminal riêng; không ghi secrets vào Git hay slide. Khóa Office 365 tham chiếu có 10 bài metadata cùng ID Kaggle để thử chuyển miền, không giả mạo một bộ học liệu do nhóm giảng dạy.

- Có SMTP thì thử nhận PIN trước. Có MoMo Sandbox thì thử một đơn sandbox trước. Chưa có thì nêu đúng “đã cài adapter, chưa nghiệm thu gateway/email thật”.

## 4. Kịch bản 15–20 phút, bám từng tiêu chí

### A. Trang chủ và phân quyền — 2 phút

1. Mở `/`: banner sáng **VEDU Learning Management System**, hai cổng teacher/admin ở thanh ngang trên, tìm tên khóa/chủ đề/giảng viên.
2. `/student/login` → đăng nhập khách. Dashboard khách chỉ có Tổng quan/Khóa học. Học thử khóa miễn phí, chỉ 2 bài đầu. Cho thấy không có quiz/chứng nhận/thanh toán/AI cá nhân/Q&A/ticket. Có thể kiểm tra quota bằng ghi danh khóa miễn phí thứ ba; phải bị từ chối.
3. Đăng xuất → `/student/register`: nhập thông tin hợp lệ; thấy thông báo thành công và **Đăng nhập**, không tự vào dashboard. Đăng nhập tài khoản vừa tạo.
4. Nếu demo sai cổng, dùng tài khoản teacher tại student login: bị từ chối; không cần công khai mật khẩu. Đổi mật khẩu chỉ nên demo cuối buổi vì thao tác sẽ đăng xuất toàn bộ thiết bị.

Câu giải thích: “Role được kiểm tra ở server. UI ẩn menu chỉ là hỗ trợ; không phải lớp bảo vệ duy nhất.”

### B. Quản lý khóa/chương/học liệu — 3 phút

1. Teacher → **Soạn khóa học**: tạo khóa nháp, chủ đề mới, thêm bài.
2. **Tài liệu & video**: chọn khóa → Tải nội dung → thêm chương → chọn bài → nhập nội dung/đưa vào chương/công bố; thử đổi thứ tự bằng “Đưa lên”.
3. Upload PDF/MP4 → lưu. Video được đo thời lượng bằng ffprobe. **Quản lý khóa học** → xuất bản; tìm lại từ trang chủ bằng chủ đề mới, không sửa frontend.
4. Học viên mở lớp: xem PDF/văn bản; video chạy và ghi actual seconds. Tua sang đoạn khác: phần đã nhảy không được tính. Refresh rồi kiểm tra vị trí/ranges được khôi phục.

Câu giải thích: “Giây đã xem thực và giây nội dung duy nhất khác nhau. Xem lại tăng thời gian thực nhưng không nhân đôi phần nội dung đã phủ.”

### C. ML + HUSPM — 5–7 phút, phần trọng tâm

1. Admin → **HUSPM Mining** → chọn Kaggle Recommender → epochs 8 → Huấn luyện. Trong lúc chạy có thể trình bày nhánh khác; đừng hứa thời gian hoàn thành cố định.
2. Mở job **SUCCEEDED** có sẵn: đọc nguồn, SHA256, cắt thời gian train/validation/test, số người/item, tham số và thời gian chạy. Cho thấy BPR và GRU có loss/trọng số/artifact thật.
3. So sánh BPR, GRU, Item-KNN; mở thêm HUSPM-only/ablation/Popularity nếu report của lần chạy đó đã có. Không lấy metric từ JSON khác protocol để ghép bảng.
4. Nêu chính xác: “Hybrid chưa chắc tốt hơn. Dataset 5 module không dùng Recall@5 làm thành tích. Dataset recommender có nhiều cold targets, nên cần đọc cả số người được đánh giá và metric trên toàn target.”
5. Chỉ ra mẫu HUSPM `A → B → C`, support, utility; giải thích maximum embedding bằng ví dụ trong [hướng dẫn chuyên sâu](RECOMMENDATION_SYSTEM_GUIDE.md).
6. Học viên thành viên → khóa **Office 365 — Nội dung tham chiếu Kaggle**: đọc hoàn thành một bài → chuyển/mở lại phòng học → **Lộ trình gợi ý** → chọn khóa → tạo gợi ý. Ban đầu FALLBACK là đúng; khi có lịch sử mapping hợp lệ phải ra MODEL. Chọn Phù hợp/Bỏ qua, dữ liệu phản hồi lưu PostgreSQL.

Câu giải thích: “Hai mạng/mô hình chính là BPR-MF và GRU. Item-KNN là baseline ngoài từ thư viện. HUSPM là nhánh khai phá pattern riêng; mapping giữ đúng nội dung gốc, không đổi tùy tiện ID dataset thành bài VEDU.”

### D. Quiz → chứng nhận — 3 phút

1. Teacher → **Ngân hàng quiz**: tạo đề gắn khóa, thời gian bằng giây, điểm đạt, thêm câu một/nhiều đáp án, công bố.
2. Học viên → đề cương → bài kiểm tra khóa → chọn đáp án. Refresh giữa chừng để cho thấy draft/deadline khôi phục. Nộp → điểm do backend chấm; chưa chọn câu vẫn nộp được, câu đó 0 điểm. Hết giờ tự nộp, server không cho làm lại bằng reset timer frontend.
3. Hoàn thành mọi bài và đạt quiz → **Chứng chỉ** → chọn khóa → Kiểm tra điều kiện và cấp PDF → mở PDF/route `/verify/<mã>`.
4. Nếu thiếu bài/quiz thì phải từ chối cấp, không sửa database để giả đủ điều kiện trước mặt GVHD.

### E. Phân công, Q&A, ticket, báo cáo — 3 phút

1. Admin → **Phân công giảng viên**: giao khóa cho giảng viên khác; giảng viên được giao nhìn thấy khóa trong dashboard và có quyền nội dung. Giảng viên không được giao không truy cập được.
2. Học viên → **Hỏi đáp khóa học**: chọn khóa đã đủ quyền, gửi câu hỏi; teacher trả lời; học viên làm mới xem hội thoại. Nói rõ đây là hội thoại lưu bền vững, chưa phải realtime.
3. Học viên → **Hỗ trợ** tạo ticket → admin **Xử lý ticket** giao teacher → teacher trả lời/chuyển RESOLVED → học viên mở **Hội thoại hỗ trợ** xem phản hồi.
4. Teacher/admin → **Báo cáo & xuất file**: chọn khóa, ngày → Lọc → Xuất CSV → mở trong Excel; chỉ ra completed lessons, actual seconds, best score và payment status.

### F. Thanh toán — thêm 2 phút nếu đã có khóa Sandbox

1. Teacher tạo/xuất bản khóa có phí VND ≥1.000.
2. Thành viên học viên bấm vào học: đi `/checkout/<id>`, không mở được phòng học khi chưa PAID.
3. Chọn MoMo → thanh toán **Sandbox** → quay về. Quyền chỉ mở sau IPN có chữ ký đúng; tự sửa `resultCode=0` trên URL không mở quyền.
4. Chưa có keys/IPN URL: chỉ demo bước khóa quyền và thông báo cần cấu hình; không nói giao dịch MoMo đã thành công.

## 5. Cấu hình MoMo và email

Trong `.env` riêng, không đưa vào Git:

```dotenv
MOMO_ENV=sandbox
MOMO_PARTNER_CODE=<từ tài khoản Sandbox>
MOMO_ACCESS_KEY=<từ tài khoản Sandbox>
MOMO_SECRET_KEY=<từ tài khoản Sandbox>
MOMO_IPN_URL=https://<test-host-công-khai>/api/platform/payments/momo/ipn
MOMO_REDIRECT_URL=
SMTP_HOST=<smtp-server>
SMTP_PORT=587
SMTP_USER=<email-gửi>
SMTP_PASS=<mật-khẩu-ứng-dụng>
SMTP_FROM=VEDU LMS <email-gửi>
PASSWORD_RESET_DEMO_MODE=false
```

Sau thay đổi env: `docker compose up -d --force-recreate backend`. `MOMO_REDIRECT_URL` trống dùng URL quay về theo khóa. MoMo không gọi được `localhost` của máy nhóm; cần endpoint công khai khi thử gateway. Việc triển khai HTTPS/public vẫn đang hoãn, không tự coi nó đã hoàn thành chỉ vì adapter có IPN route.

PIN chỉ dành học viên/giảng viên, hiệu lực 900 giây; production không trả PIN ra response để thay thế email. Backend có rate limit gửi/thử PIN. Không dùng mật khẩu đăng nhập email thông thường nếu nhà cung cấp yêu cầu app password.

Tài liệu chính thức: [MoMo tạo thanh toán](https://developers.momo.vn/v3/vi/docs/payment/api/wallet/onetime/), [MoMo IPN và chữ ký](https://developers.momo.vn/v3/vi/docs/payment/api/result-handling/notification/). Sandbox để thử nghiệm; điều kiện/chi phí production cần xác nhận với MoMo, không suy ra là miễn phí.

## 6. Checklist trước khi gặp GVHD

```powershell
Set-Location C:\Project\vedu-lms-capstone
node .\scripts\verify-upgrade.mjs
node .\scripts\verify-role-ml.mjs
python .\scripts\check-huspm.py
```

Script regression tạo fixture/tài khoản test, lưu trữ khóa fixture và thu hồi phiên sau chạy; không xóa database. Có thể giữ các dòng test trong lịch sử/audit, nhưng chúng bị loại khỏi dữ liệu huấn luyện REAL. Kết quả lưu ở `docs/validation/upgrade-checks.json` (54 checks) và `docs/validation/role-ml-checks.json` (9 checks). Script thứ hai cần khóa Office 365 tham chiếu và một job Kaggle Recommender SUCCEEDED; chuẩn bị bằng các lệnh tại mục 3. Không chạy script trong lúc đang thao tác bài thi thật trên cùng tài khoản seed.

Chốt khi trình bày: “Đã có luồng chức năng cơ bản và pipeline thuật toán thật. Các phần còn thiếu được ghi công khai trong [đối chiếu STT 6](STT6_COMPLETION_AUDIT.md). Tiêu chí kiểm thử–triển khai hệ thống đầy đủ/HTTPS chưa được nhận là hoàn tất.”
