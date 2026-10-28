# Nâng cấp học liệu, thương hiệu và vận hành VEDU — 23/10/2026

## Chạy ứng dụng hiện tại

Mở Docker Desktop, chờ Engine running. Trong terminal PowerShell tại thư mục dự án:

```powershell
cd C:\Project\vedu-lms-capstone
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build -d
```

Mở http://localhost:8080, nhấn Ctrl+F5 nếu còn giao diện cũ. Không chạy `docker compose down -v`: thao tác đó xóa volume dữ liệu.

Nếu chạy frontend/backend bằng VS Code, dùng task khởi động PostgreSQL trước; task đã được bổ sung migration `content_workflow.sql`. Sau đó chạy backend và frontend như trước. Vite dùng cổng 5173, bản Docker dùng 8080; không nhầm hai bản giao diện.

## Hai khóa miễn phí

Trên CSDL máy này:

| Khóa | Trang | Bài chuyên môn | Bài hướng dẫn | Thi cuối khóa |
|---|---|---:|---:|---|
| Cấu trúc rời rạc | http://localhost:8080/courses/68 | 14 | 1 | 14 câu, 840 giây |
| Mạng máy tính | http://localhost:8080/courses/69 | 10 | 1 | 10 câu, 600 giây |

ID có thể khác trên CSDL mới; tìm theo tên khóa. Đạt 7/10, tối đa 5 lượt. Điều kiện mở thi cuối khóa mới: hoàn thành tất cả bài học; điều kiện chứng nhận: hoàn thành các bài và đạt mọi quiz đã công bố. Các quiz khóa cũ không tự động bị thay đổi quy tắc mở thi.

Nguồn nhập: hai RAR do nhóm cung cấp. Danh mục Cấu trúc rời rạc có 14 trang liên kết HTML, không chứa slide PDF gốc. Danh mục Mạng máy tính ghi 10 PDF công khai của ITC. Đã kiểm tra 10 liên kết PDF trả về HTTP 200, kiểu application/pdf vào 23/10/2026.

VEDU bổ sung tóm tắt, ví dụ, slide HTML có thể in/lưu PDF, bài tập nhỏ, gợi ý và câu tự kiểm tra. Đây là học liệu tự biên soạn theo chủ đề trong danh mục, không phải bản sao bài giảng của trường. Không sao chép ngân hàng trắc nghiệm của bên thứ ba. Giảng viên cần thẩm định độ khó và mở rộng ngân hàng câu hỏi trước khi đánh giá chính thức; đề hiện tại phù hợp kiểm tra nền tảng/demo, chưa phải đề thi học phần chuẩn hóa.

Video: Cấu trúc rời rạc có một playlist chung từ danh mục gốc, chưa đối chiếu được từng video với từng bài. Giữ playlist ở dạng LINK tham khảo, không giả thời lượng hay coi là video đã được theo dõi. Mạng máy tính chưa có video đã xác minh nên không thêm video không liên quan. PDF nguồn cần Internet; nếu nguồn chặn nhúng, mở liên kết bên dưới iframe. Chỉ lưu bản sao khi được chủ sở hữu cho phép.

## Nhập lại trên máy khác/CSDL mới

Sau khi đã có `.env`, cài phụ thuộc backend và khởi động PostgreSQL bằng task VS Code `Vedu: Database (Docker)` (hoặc script dưới):

```powershell
npm.cmd --prefix backend ci
powershell -ExecutionPolicy Bypass -File .\scripts\start-dev-db.ps1
node .\scripts\import-computing-curriculum.mjs
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build -d
```

Script dùng kết nối localhost:5432 từ `.env`, tạo hai khóa theo marker riêng, không ghi đè khóa có cùng tên của người dùng. Chạy lại không nhân đôi bài/quiz hay tái công khai khóa đã bị admin ẩn. Slide HTML nằm trong `frontend/public/course-materials`; nội dung và câu hỏi gốc ở `data/learning/computing-curriculum.mjs`. Không sinh lịch sử học viên giả. Báo cáo nhập ở `docs/validation/computing-curriculum-import.json`.

## Demo học viên

1. Đăng nhập học viên thường; khách chỉ xem thử hai bài, không thi/cấp chứng nhận.
2. Tìm tên khóa, mở chi tiết, đọc “Lần đầu học? Bắt đầu tại đây”.
3. Bấm “Bắt đầu từ hướng dẫn học”: bài 00 giới thiệu mục tiêu, kiến thức chuẩn bị, đề cương và điều kiện hoàn thành.
4. Mở bài 01, đọc nội dung, xem slide HTML, mở PDF gốc nếu có. Tự làm bài tập trước khi mở gợi ý.
5. Bấm “Tôi đã đọc tài liệu”; tải lại để kiểm tra tiến độ bền vững. Đây là tự xác nhận đọc, không phải máy đã chấm bài thực hành.
6. Bấm “Bài kế tiếp”. Sau khi hoàn thành toàn bộ bài, làm thi cuối khóa.
7. Bảng điều khiển → Chứng chỉ → chọn khóa → cấp/tải PDF; mở mã tra cứu để xác minh.

## Mục đích và demo kiểm duyệt

Trước đây “Kiểm duyệt nội dung” chỉ hiển thị danh mục, không có thao tác. Hiện admin có thể xem cả bản nháp/đã công khai/đã ẩn, xem nội dung học liệu, nhập nhận xét bắt buộc, duyệt công khai, trả về chỉnh sửa hoặc ẩn khóa. Lưu người duyệt, thời điểm, lý do; gửi thông báo tới giảng viên chính và phụ.

1. Giảng viên tạo khóa và bài học, công bố bài học, bấm “Gửi duyệt” ở Khóa học của tôi. Khóa ở DRAFT/PENDING, chưa hiện trên trang chủ.
2. Admin → Kiểm duyệt nội dung → lọc Đang chờ duyệt → Xem nội dung bài học.
3. Nhập nhận xét → Trả về chỉnh sửa (khóa vẫn riêng tư), hoặc Duyệt công khai (cần ít nhất một bài công bố).
4. Kiểm tra danh mục trang chủ; xem lịch sử duyệt và thông báo của giảng viên.
5. Ẩn khóa: gỡ khỏi danh mục và chặn học qua API theo chính sách hiện tại. Cân nhắc học viên đang học trước khi ẩn.

Giới hạn: chưa có phiên bản nội dung/snapshot được duyệt tách khỏi bản đang sửa. Kiểm duyệt hiện quản lý trạng thái công khai của khóa; chưa phải quy trình duyệt lại từng lần sửa bài học hay kiểm tra bản quyền tự động.

## Phân công và Q&A

1. Admin → Phân công giảng viên → chọn khóa và giảng viên phụ → Phân công.
2. Giảng viên phụ đăng nhập đúng cổng → Khóa học của tôi: khóa có nhãn Giảng viên hỗ trợ. Giao diện làm mới mỗi 15 giây khi đang hiển thị, khi quay lại cửa sổ hoặc bấm Làm mới.
3. Mở Thông báo ở đầu bảng điều khiển: xem phân công mới/đã có, đánh dấu đã đọc, mở mục liên quan.
4. Nội dung & học liệu và Hỏi đáp khóa học dùng danh sách khóa phụ trách, gồm cả khóa được giao. Hỏi đáp → chọn khóa → Mở hội thoại → Trả lời.
5. Admin gỡ phân công: giảng viên nhận thông báo, không còn khóa trong danh sách và API nội dung/Q&A trả 403 nếu không phải giảng viên chính.

## Logo, ảnh khóa và chứng nhận

Logo vector mới: sách mở + nét V/check + điểm nhấn xanh ngọc; dùng trên header, footer, thanh bên và favicon. Ảnh khóa thay các ảnh Picsum ngẫu nhiên/logo dự phòng bằng minh họa SVG riêng dựa trên tên/ID; biểu tượng phù hợp nhóm nội dung, bảng màu và mã riêng cho từng khóa. Không hiển thị nhãn chủ đề trên thẻ; bộ lọc chủ đề vẫn hoạt động.

Dấu VEDU là thiết kế gốc, tham khảo cách dùng dấu tròn đỏ và tra cứu chứng nhận điện tử trong các mẫu công khai; không sao chép quốc huy, dấu hoặc chữ ký của đơn vị thật. Đây không phải chữ ký số hay dấu có giá trị pháp lý. PDF ghi rõ chứng nhận hoàn thành nội bộ, có mã tra cứu; bản bị thu hồi không được thể hiện là hợp lệ.

Tham khảo: https://iuyouth.edu.vn/van-ban-doan/yeu-cau-cap-gcn-certificate/ và https://ueh.edu.vn/cuoc-song-ueh/tin-tuc/ueh-tien-phong-chuyen-doi-so-cham-soc-ho-tro-toi-da-nhu-cau-nguoi-hoc-59737

## Kiểm tra

```powershell
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd --prefix backend run build
npm.cmd --prefix backend test -- --runInBand
node .\scripts\verify-content-workflow.mjs
```

Script nghiệp vụ tạo tài khoản đánh dấu is_test_account, khóa có tiền tố [TEST], kiểm tra quyền/nghiệp vụ rồi khóa tài khoản, thu hồi phiên và lưu trữ khóa kiểm thử. Không dùng dữ liệu này để huấn luyện mô hình. Không xóa lịch sử để còn đối chiếu. Kết quả tại `docs/validation/content-workflow-checks.json`; PDF kiểm thử là mẫu, không phải chứng nhận của học viên thật.
