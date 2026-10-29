# Nâng cấp lộ trình và thanh toán — 29/10/2026

## Mở bản ứng dụng đã cập nhật

Docker Desktop phải ở trạng thái đang chạy. Trong terminal VS Code tại `C:\Project\vedu-lms-capstone`:

```powershell
docker compose up -d --build --wait
```

Mở [VEDU tại localhost:8080](http://localhost:8080/) và nhấn Ctrl+F5 nếu còn giao diện cũ. Máy hiện tại đã cập nhật các bảng đối soát và đang chạy đủ frontend, backend, PostgreSQL và dịch vụ mô hình. Lệnh khởi động cũng chạy bản cập nhật SQL cộng thêm qua dịch vụ `demo-seed`; không cần xóa dữ liệu để nâng cấp.

## Lộ trình học

Vào **Không gian học tập → Lộ trình gợi ý**. Chọn khóa đã ghi danh, mục tiêu, trình độ, ngữ cảnh, cách học, giờ mỗi tuần và số tuần. Bấm **Tạo và so sánh lộ trình**.

- Bảng so sánh cho biết thời gian còn dự kiến, phần ôn/luyện và số tuần tương ứng.
- Có 2–4 phương án khi dữ liệu còn lại đủ để tạo kế hoạch khác nhau. Khóa có dưới ba bài còn lại có thể có ít phương án hơn; không nhân bản kế hoạch chỉ để đủ số lượng.
- Với khóa có các nhánh tự chọn, phương án có thể khác tập bài/thứ tự hợp lệ. Với khóa bắt buộc tuần tự như OOP/UML, thứ tự môn không đổi; bốn phương án khác thời gian tự ôn/luyện và lịch tuần. Nhãn **khác nhịp ôn và luyện tập** phân biệt rõ điều này.
- Lịch tuần tôn trọng quỹ giờ đã chọn; bài dài có thể chia qua nhiều tuần. Nếu vượt số tuần mong muốn, hệ thống chỉ rõ phần vượt, không xóa tiên quyết để làm kế hoạch trông vừa thời gian.
- Chọn phương án, mở lịch tuần và bấm **Học bài tiếp theo theo lộ trình**. Tiến độ lấy từ bài đã hoàn thành trong PostgreSQL; bài xong được bỏ khỏi lịch còn lại.
- Khi học liệu thay đổi, có cảnh báo và không đề xuất nút tiếp tục theo lịch cũ. Bấm **Cập nhật lộ trình theo tiến độ mới** để tạo lại.
- Thời gian học, ôn và luyện là ước tính kế hoạch; không được cộng thành log xem video thực. Quỹ tuần hiển thị giờ; thời gian từng bài/hoạt động hiển thị phút; API/CSDL vẫn dùng giây.

### Học máy và giới hạn

Vẫn sử dụng pipeline BPR + GRU + HUSPM hiện có. Điểm mô hình chỉ xếp hạng những bài đủ điều kiện tiên quyết; không tự bỏ qua quyền học hoặc thay điều kiện chứng nhận. Với tài khoản/khóa chưa có lịch sử hay mapping phù hợp, ứng dụng ghi rõ gợi ý dựa trên chương trình và nhu cầu, không giả nhận kết quả mô hình. Cải tiến này bổ sung lập lịch/so sánh và theo dõi tiến độ; không tuyên bố đã huấn luyện lại mô hình hoặc đã đo được hiệu quả trên người học thật.

## Thanh toán đã có

1. **QR chuyển khoản ngân hàng:** mã VietQR chứa ngân hàng nhận, số tài khoản, đúng số tiền và mã đối soát riêng của đơn. Ảnh QR được tạo tại backend bằng `qrcode`, không cần gọi dịch vụ tạo ảnh QR bên ngoài.
2. **Thu phí trực tiếp:** học viên gửi mã đơn cho bộ phận hỗ trợ, nộp học phí và giữ biên nhận; quản trị viên đối chiếu, xác nhận đã thu đủ tiền rồi mở quyền học.
3. MoMo giữ nguyên như phương thức bổ sung khi nhóm có khóa tích hợp; không phải điều kiện để dùng hai luồng trên.

**Tình trạng hiện tại:** nhóm chưa có tài khoản ngân hàng nhận tiền, nên QR thật đang tắt; không đặt số tài khoản giả vào ứng dụng. Thu phí trực tiếp và quy trình đối soát có thể sử dụng ngay. Chưa có xác nhận tự động từ ngân hàng/webhook mới. Việc quét QR hay bấm “đã chuyển khoản” không chứng minh đã nhận tiền.

Luồng chuyển tiền QR của NAPAS vẫn yêu cầu người chuyển xác nhận giao dịch trong ứng dụng ngân hàng: [Cẩm nang thanh toán số — NAPAS](https://napas.com.vn/cam-nang-thanh-toan-so). Có thể tra BIN ngân hàng ở [API Banks — VietQR](https://www.vietqr.io/api-bank). Thư viện tạo ảnh QR tham khảo [tài liệu node-qrcode](https://github.com/soldair/node-qrcode). Phí chuyển tiền phụ thuộc ngân hàng; ứng dụng không cam kết mọi tài khoản đều được miễn phí ngân hàng.

## Bổ sung ngân hàng sau

Mở `.env` ở thư mục gốc (đã thêm sẵn các ô trống):

```dotenv
BANK_BIN=
BANK_NAME=
BANK_ACCOUNT_NO=
BANK_ACCOUNT_NAME=
```

`BANK_BIN` là BIN NAPAS sáu chữ số, không phải tên viết tắt; `BANK_ACCOUNT_NO` là số tài khoản nhận tiền; tên chủ tài khoản và tên ngân hàng phải khớp tài khoản của nhóm. Không nhập mật khẩu ngân hàng, OTP hoặc thông tin đăng nhập. Nhóm cần thử quét mã và kiểm tra đúng người nhận trước khi dùng nhận học phí thật.

Sau khi lưu, trong terminal VS Code tại gốc dự án:

```powershell
docker compose up -d --no-deps --force-recreate --wait backend
docker compose restart frontend
```

Nếu chạy backend bằng task **Vedu: Backend** thì dừng/chạy lại task; script khởi động đã đọc bốn cấu hình trên. Không xóa database hoặc volume để đổi ngân hàng.

Đơn chuyển khoản giữ ảnh chụp thông tin ngân hàng tại lúc tạo; đổi cấu hình không đổi tài khoản nhận của đơn cũ. Không tự chuyển phương thức của đơn đang đối soát; khi cần đổi, liên hệ hỗ trợ để tránh ghi nhận trùng.

## Demo học viên

1. Đăng nhập tài khoản học viên, mở khóa có học phí và bấm **Bắt đầu học**. Nếu chưa trả phí, chuyển sang trang thanh toán.
2. Khi chưa cấu hình ngân hàng, chọn **Thanh toán trực tiếp**. Hệ thống tạo một đơn và mã `VEDU…`; tải lại trang vẫn thấy đúng đơn cũ.
3. Sau khi đã nộp tiền, nhập ghi chú/biên nhận rồi bấm **Tôi đã nộp học phí — gửi đối soát**. Trạng thái chuyển sang chờ đối soát; khóa vẫn chưa mở.
4. Nếu đã có ngân hàng, chọn **QR chuyển khoản**, quét trong ứng dụng ngân hàng, kiểm tra người nhận/số tiền/mã nội dung rồi xác nhận. Sau đó bấm **Tôi đã chuyển khoản — gửi đối soát**.
5. Giữ trang thanh toán: tự kiểm tra trạng thái mỗi 10 giây hoặc bấm làm mới. Khi admin xác nhận, hiện **Quyền học đã mở**.
6. Tại **Đơn hàng**, có liên kết trở lại thanh toán/đối soát; đơn đã trả phí dẫn về khóa học.

## Demo quản trị viên

Dùng trình duyệt hoặc cửa sổ riêng để giữ hai phiên học viên/admin:

1. Vào **Quản trị → Đơn hàng & thanh toán**.
2. Lọc **Học viên đã báo thanh toán**, chọn đúng người và khóa.
3. Đối chiếu sổ thu/biên nhận hoặc giao dịch nhận tiền. Nhập **số tiền thực nhận**, **mã đối soát**, **mã giao dịch ngân hàng/số biên nhận**, ghi chú quyết định.
4. Nếu chưa khớp, bấm **Chưa khớp — yêu cầu kiểm tra lại**. Học viên thấy lý do và gửi đối soát lại; vẫn chưa mở khóa.
5. Khi đã nhận đúng và đủ tiền, tích xác nhận đã đối chiếu rồi bấm **Xác nhận nhận tiền & mở khóa**.
6. Trở về phiên học viên, làm mới trạng thái và vào học. Chỉ đúng học viên của đơn được mở quyền; tài khoản khác vẫn bị chặn.

Không ghi nhận một khoản chưa nhận thành học phí thật chỉ để trình diễn. Có thể demo tới bước chờ đối soát hoặc dùng bộ kiểm thử cách ly đã cung cấp. Dữ liệu kiểm thử được đánh dấu riêng, không dùng huấn luyện mô hình thật; các khoản giả lập được kết thúc bằng trạng thái hoàn tiền mô phỏng sau kiểm tra, không thực hiện chuyển/hoàn tiền qua ngân hàng.

## Kiểm tra và giới hạn vận hành

- Kiểm tra QR bằng bộ giải mã `jsqr` độc lập, đối chiếu BIN/tài khoản/số tiền/nội dung/CRC. Dùng tài khoản giả lập chỉ trong tiến trình kiểm thử, không cấu hình trên ứng dụng đang chạy. Chưa thử giao dịch ngân hàng thực vì nhóm chưa cung cấp tài khoản.
- Tạo đơn và xác nhận có khóa giao dịch; gửi lại không tạo thanh toán trùng. Mã giao dịch/biên nhận không được dùng để trả hai đơn.
- Học viên/khách/giảng viên không thể gọi API xác nhận. Báo đã trả tiền chỉ tạo yêu cầu kiểm tra. Số tiền lấy từ snapshot đơn trong CSDL, không nhận số tiền học viên tự gửi để mở khóa.
- Lưu người xác nhận, ghi chú và lịch sử các bước ở `payment.manual_requests`, `payment.manual_events`, `payment.payments` và `payment.orders`.
- Không có OCR tự xác minh biên nhận, kết nối tài khoản ngân hàng tự động hoặc webhook ngân hàng trong đợt này. Nếu sau này chọn SePay hoặc cổng khác, cần tài khoản dịch vụ, cấu hình xác thực và URL HTTPS; không được dùng webhook không xác thực để mở khóa. [Tài liệu webhook của SePay](https://docs.sepay.vn/tich-hop-webhooks.html) mô tả các yêu cầu tích hợp.
- Sao lưu cả PostgreSQL và volume media như trước. Các bảng mới được tạo qua bản cập nhật cộng thêm `database/vedu/content_workflow.sql`; máy hiện tại đã áp dụng.

Kết quả kiểm tra bản cập nhật:

- 29 kiểm tra API/CSDL: quyền truy cập, khóa học chưa trả phí, số tiền/mã đơn, xác nhận trùng, tiến độ và lộ trình riêng của từng người. [Báo cáo](validation/payments-plans-checks.json).
- 10 kiểm tra mã QR/lập lịch: giải mã QR độc lập, CRC, bảo toàn thời gian và thứ tự tiên quyết. [Báo cáo](validation/qr-schedule-checks.json).
- 48 kiểm tra tương tác các thành phần giao diện. [Báo cáo](validation/ui-interactions.json).
- 4 luồng thao tác trên trình duyệt Edge: học viên gửi biên nhận, admin xác nhận, học viên thấy quyền học được mở, tạo/so sánh/chọn lộ trình. Không có lỗi JavaScript; màn hình 390 px không tràn ngang. [Báo cáo](validation/payments-plans-browser-checks.json).
- Build frontend/backend, lint frontend và 5 bài kiểm tra backend đã đạt. Backend lint còn một cảnh báo có sẵn trong CoursesService, không có lỗi chặn build.

Ảnh minh chứng: [so sánh lộ trình](screenshots/path-comparison-2026-10-29.png), [lịch tuần trên điện thoại](screenshots/path-weekly-mobile-2026-10-29.png), [admin đối soát](screenshots/admin-payment-review-2026-10-29.png), [học viên đã mở quyền](screenshots/payment-access-open-2026-10-29.png).
