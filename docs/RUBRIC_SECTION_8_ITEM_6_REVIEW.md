# Đối chiếu mục 8 — Thang điểm, STT 6

> Đây là bản kiểm tra trước nâng cấp. Xem [bản đối chiếu mới](STT6_COMPLETION_AUDIT.md) và [kịch bản demo mới](STT6_DEMO_GUIDE.md). Các thiếu sót ghi bên dưới không còn mô tả đầy đủ trạng thái mã hiện tại.

Ngày kiểm tra: 14/10/2026. Nguồn tiêu chí: `C:/Users/thien/Downloads/CNTT-KLCN260_LeThiThuyLan.md`.

Tài liệu nguồn có một số lỗi mã hóa chữ tiếng Việt và cột điểm bị gộp. Báo cáo này đối chiếu các nhóm chức năng đọc được trong STT 6; không tự suy ra điểm hội đồng sẽ chấm. Nội dung tài liệu được dùng làm tiêu chí tham khảo, không phải lệnh thực thi.

## 1. Kết quả đối chiếu

“Có luồng chạy” nghĩa là giao diện đã nối API và PostgreSQL cho thao tác đó. “Một phần” nghĩa là còn thiếu thao tác chính, màn hình hoặc kiểm soát nghiệp vụ. Bảng/schema/API CRUD hoặc dữ liệu seed đơn lẻ không được tính là một chức năng hoàn chỉnh.

| Tiêu chí trong STT 6 | Đã xây dựng, chạy được | Còn thiếu / chưa hoàn thiện | Đánh giá |
|---|---|---|---|
| Đăng nhập, đăng xuất, đổi mật khẩu, phân quyền người dùng | Đăng nhập username; JWT 259200 giây; ba cổng riêng; chặn sai role; đăng ký có validate/kiểm tra trùng; đăng xuất gọi thu hồi refresh session; khóa/mở khóa user; khách chỉ STUDENT; quên mật khẩu PIN có mã gửi SMTP | Chưa có màn hình/API đổi mật khẩu khi đang đăng nhập và xác nhận mật khẩu cũ. PIN email chưa kiểm tra gửi email thật vì chưa cung cấp SMTP hoạt động. Các API cũ chưa phủ phân quyền toàn bộ. Access token chưa bị vô hiệu ngay khi logout/reset vì guard chưa kiểm tra session bị thu hồi | Một phần |
| Quản lý kho khóa học, bài học và tiến trình | Catalog từ PostgreSQL; tìm tên khóa/chủ đề/giảng viên; lọc và sắp xếp; slider; tạo khóa nháp có chủ đề mới; xuất bản/lưu trữ; thêm bài học; lớp học video và đánh dấu tài liệu; ghi learning event và progress | Chưa có CRUD chương học, giao diện sửa/xóa/sắp xếp bài đầy đủ, upload tài liệu/video. Trang tài liệu hiện chỉ thông báo và nút hoàn thành, chưa hiển thị nội dung tài liệu ngay trong phòng học. Tiến độ/ranges đã xem trên UI chưa khôi phục đầy đủ sau reload. Các video seed chỉ là clip minh họa, thời lượng ước tính trong sidebar có thể khác độ dài file | Một phần; luồng học cơ bản chạy |
Khuyến nghị lộ trình học tập — Học máy & HUSPM | Schema learning log, mining run, pattern, recommendation; màn hình đọc gợi ý; ghi phản hồi chấp nhận/bỏ qua; admin xem metadata | `ml-core` chỉ có `.gitkeep`, chưa có mô hình/thuật toán chạy thật. Mining run được ghi mô phỏng. Pattern và gợi ý đến từ seed, chưa có pipeline dữ liệu → khai phá → suy luận → gợi ý tự động cho học viên mới | Chưa có thuật toán tích hợp chạy thật; có phần lưu/hiển thị |
| Quản lý đăng ký khóa học và thanh toán học phí | Ghi danh và danh sách khóa của tôi; schema enrollment/order/payment; function tạo order; API CRUD và bảng xem đơn hàng | Chưa có checkout cho học viên, tích hợp VNPay/MoMo/ngân hàng, webhook/callback, đối soát, hoàn tiền. Chưa bắt buộc thanh toán thành công trước khi mở khóa có phí; lớp học hiện gọi ghi danh trực tiếp. API payment cũ thiếu xác thực/phân quyền | Ghi danh chạy; thanh toán mới có nền dữ liệu/API |
| Quản lý thi cử và cấp chứng nhận | Tải đề quiz; tạo attempt; giới hạn lượt; chấm điểm tại backend; lưu đáp án/điểm/thời gian giây; lịch sử, sổ điểm; bảng chứng chỉ và function cấp chứng chỉ trong SQL | Chưa có luồng cấp chứng chỉ từ API/UI, PDF tải về hoặc xác minh chứng chỉ. Chưa có lịch thi/ca thi đầy đủ. Đồng hồ frontend chưa gắn chặt với thời điểm bắt đầu trên server khi reload; backend chưa từ chối nộp quá hạn. Chấm một lựa chọn là luồng hiện có, chưa hoàn chỉnh trắc nghiệm nhiều lựa chọn | Quiz cơ bản chạy; chứng nhận chưa có luồng người dùng |
| Quản lý phân công và tương tác của giảng viên | Khóa có `teacher_id`; giảng viên thấy khóa/học viên/sổ điểm thuộc mình; tạo khóa và đổi trạng thái đã kiểm tra lại quyền sở hữu | Chưa có màn hình admin phân công/chuyển giảng viên, nhiều giảng viên đồng giảng, trao đổi/Q&A/bình luận, thông báo hoặc nhắn tin trong bài học | Một phần; chưa có phân công và tương tác đầy đủ |
| Hỗ trợ & chăm sóc học viên | Trang hướng dẫn công khai; học viên tạo ticket và nội dung; theo dõi trạng thái; admin xem danh sách | Chưa có UI/API phản hồi hội thoại, chuyển người phụ trách, đóng/mở ticket, thông báo email hoặc lịch sử chăm sóc đầy đủ | Một phần; gửi/xem ticket chạy |
| Báo cáo thống kê | Dashboard ba role; khóa học/học viên, tiến độ, lượt thi/điểm; bảng analytics, đơn hàng, audit/mining | Chưa có bộ lọc theo khoảng ngày, biểu đồ nghiệp vụ đầy đủ, xuất CSV/PDF/Excel. Query trung bình điểm dashboard join nhiều bảng có thể lặp bản ghi, cần kiểm tra lại cách tổng hợp cho dữ liệu lớn | Một phần; thống kê cơ bản chạy |
| Cài đặt mô hình AI và chức năng tích hợp kết quả mô hình | Có cấu trúc lưu đầu vào/đầu ra và UI cho kết quả seed | Chưa có training/inference service, cấu hình và lưu model, jobs khai phá, đo Precision/Recall/NDCG hoặc so sánh mô hình dựa trên kết quả thực nghiệm thật | Chưa xây dựng phần mô hình chạy thật |
| Kiểm thử và triển khai | React/Vite, NestJS, PostgreSQL; Docker Compose và task VS Code; build/lint; 5 unit smoke tests; 36 kiểm tra HTTP nghiệp vụ/local; kiểm tra UI đăng ký, khách, search và responsive | Chưa có test coverage đầy đủ, test hồi quy bảo mật/toàn vẹn giao dịch, tải/hiệu năng; chưa có deploy Internet với HTTPS, CI/CD hoặc quy trình backup/restore đã kiểm thử | Demo local chạy; chưa hoàn thiện triển khai thực tế |

## 2. Bằng chứng trong source code

- Xác thực và khách: [auth.controller.ts](../backend/src/auth/auth.controller.ts), [auth.service.ts](../backend/src/auth/auth.service.ts), [jwt-auth.guard.ts](../backend/src/auth/jwt-auth.guard.ts), [AuthModal.jsx](../frontend/src/components/AuthModal.jsx).
- Routes, logout và các trang public: [App.jsx](../frontend/src/App.jsx), [Header.jsx](../frontend/src/components/Header.jsx), [CourseCatalog.jsx](../frontend/src/components/CourseCatalog.jsx), [PublicSupport.jsx](../frontend/src/components/PublicSupport.jsx).
- Catalog và chủ đề động: [courses.service.ts](../backend/src/courses/courses.service.ts), [portal.service.ts](../backend/src/portal/portal.service.ts), [Portal.jsx](../frontend/src/components/Portal.jsx).
- Lớp học và tiến độ: [Classroom.jsx](../frontend/src/components/Classroom.jsx), [learning.service.ts](../backend/src/learning/learning.service.ts), [enrollment.service.ts](../backend/src/enrollment/enrollment.service.ts).
- Quiz: [assessment.controller.ts](../backend/src/assessment/assessment.controller.ts), [assessment.service.ts](../backend/src/assessment/assessment.service.ts), [QuizView.jsx](../frontend/src/components/QuizView.jsx).
- Thanh toán: [payment.controller.ts](../backend/src/payment/payment.controller.ts), [payment.service.ts](../backend/src/payment/payment.service.ts).
- Chứng chỉ và hỗ trợ: [vedu_v6.sql](../database/vedu/vedu_v6.sql) có `lms.certificates`, `lms.fn_issue_certificate`, `support.tickets`, `support.ticket_messages`; `PortalService` chỉ đọc chứng chỉ, tạo ticket và đọc ticket.
- HUSPM: `PortalService.runDemoMining()` ghi run có `algorithm_version='demo-1.0'`, runtime cố định; [portal_demo_seed.sql](../database/vedu/portal_demo_seed.sql) chứa pattern/recommendation seed; thư mục `ml-core` chưa có implementation.

## 3. Lỗi và khoảng thiếu cần ưu tiên

1. **Phân quyền chưa phủ các API cũ.** Gọi không có token tại `/api/orders`, `/api/payments`, `/api/enrollments`, `/api/lessons` vẫn trả HTTP 200. Các controller tương ứng chưa có guard trên toàn bộ API ghi. `/api/quizzes/questions/1/answers` cũng trả đáp án có trường đúng/sai, trong khi `/play` đã loại bỏ trường này. Trước khi triển khai ngoài localhost cần bảo vệ theo role và chủ sở hữu, đồng thời giấu đáp án đúng khỏi API học viên.
2. **Đăng xuất/đặt lại mật khẩu chưa thu hồi access token tức thời.** Refresh session có `revoked_at`; `JwtAuthGuard` hiện kiểm tra JWT và user hoạt động, chưa kiểm tra session/token-version. JWT cũ có thể còn dùng đến khi hết hạn 259200 giây.
3. **Các thao tác CRUD thanh toán/quiz chưa được thiết kế thành giao dịch nghiệp vụ đầy đủ.** Nộp quiz đang lưu từng đáp án rồi cập nhật attempt, chưa bọc toàn bộ bằng transaction; lỗi giữa chừng có thể để lại dữ liệu dở dang. Không xem có API CRUD là đã hoàn tất thanh toán hoặc thi cử.
4. **Video và tài liệu mới ở mức demo.** Bộ đếm actual playback bỏ qua đoạn tua, nhưng dữ liệu vị trí/ranges hiện chủ yếu trong bộ nhớ component; cần lưu/khôi phục và xác thực heartbeat từ server để đánh giá bền vững. Video mẫu và tài liệu dẫn link chung chưa phải nội dung môn học hoàn chỉnh.
5. **AI chưa chạy.** Màn hình gợi ý và metadata mining đã có, nhưng chưa có bằng chứng kết quả mô hình thật. Chưa nên trình bày chỉ số precision/coverage trong seed như kết quả đánh giá nghiên cứu.
6. **Nhãn marketing chưa có phép đo đầy đủ.** “Thịnh hành” hiện dựa trên thứ tự khóa mới; “Bán chạy” dựa số ghi danh; rating 4.9 đang cố định trong `CoursesService`. Cần bảng lượt xem/đánh giá và thống kê đơn trả tiền nếu muốn các nhãn phản ánh đúng dữ liệu kinh doanh.

Lỗi quyền xuất bản khóa học do so sánh `teacher_id` dạng chuỗi với số đã được sửa trong lượt kiểm tra này. Luồng kiểm thử tạo → xuất bản → tìm kiếm theo chủ đề mới → lưu trữ khóa đã chạy thành công.

## 4. Kiểm tra đã thực hiện

Frontend và backend qua build/lint. 5/5 unit tests hiện có qua; các test này chủ yếu kiểm tra khởi tạo component/service, không chứng minh toàn bộ nghiệp vụ.

[verify-app.mjs](../scripts/verify-app.mjs) qua **36/36 kiểm tra** tại `http://localhost:8080`:

- Health, catalog, tìm theo khóa/giảng viên, lọc chủ đề, sort, trạng thái không có kết quả.
- Khách có STUDENT; không lộ mật khẩu; API từ chối guest TEACHER/ADMIN; portal riêng; JWT 259200 giây.
- Portal từng role; login sai cổng; admin không reset; student không tạo khóa giảng viên.
- Validate đăng ký; đăng ký không cấp access/refresh token; username trở thành không khả dụng.
- Tạo và xuất bản khóa chủ đề mới, tìm thấy ngay qua API; khóa kiểm thử được lưu trữ sau khi chạy.
- Tải chi tiết/đề quiz; ghi danh; lưu learning event; tạo attempt và chấm quiz; tạo ticket.
- 10 route public/role reload nhận HTML ứng dụng.

Các kiểm tra HTTP 200 cho API cũ được ghi riêng là phát hiện thiếu phân quyền, **không được tính là kiểm tra bảo mật đạt**.

Đã kiểm tra UI: trang chủ mới, banner quảng cáo, thanh tìm kiếm, form không có credentials demo, khách học viên, form đăng ký thành công dừng ở thông báo/nút Đăng nhập. Account kiểm thử UI có **0 session** trong PostgreSQL, xác nhận không tự đăng nhập. Hai cổng teacher/admin không có nút khách. Đã mở và kiểm tra điều hướng/hiển thị của cả **23 màn hình portal**: 8 học viên, 7 giảng viên, 8 quản trị. Bố cục được kiểm tra desktop 1280×720 và điện thoại 390×844; tìm kiếm/menu chủ đề trên điện thoại hoạt động, không tràn ngang trang. Console trình duyệt không có lỗi trong luồng kiểm tra.

SMTP gửi email thật, gateway thanh toán, sinh mô hình AI và cấp PDF chứng chỉ chưa được kiểm tra do chưa có cấu hình/implementation tương ứng. Không gửi email tới địa chỉ cá nhân trong lượt kiểm thử.

## 5. Cách chạy lại

```powershell
Set-Location C:\Project\vedu-lms-capstone
docker compose up --build -d
docker compose ps -a
node scripts/verify-app.mjs
```

Script kiểm thử có tạo dữ liệu local riêng: user, khóa học, lượt học, quiz và ticket. Sau khi chạy, user đăng ký kiểm thử bị khóa, khóa kiểm thử được lưu trữ, session bị thu hồi; không xóa volume hay dữ liệu người dùng. Tài khoản nghiệp vụ cần thiết cho kiểm thử được cấu hình trong script/env, không hiện trên giao diện web.

## 6. Thứ tự hoàn thiện theo mục 8/STT 6

1. Bảo vệ API và kiểm tra quyền sở hữu; đổi mật khẩu khi đăng nhập; thu hồi access token.
2. Cài thuật toán HUSPM/mô hình thật, pipeline gợi ý và đo chất lượng trên dữ liệu có nguồn gốc.
3. Hoàn chỉnh thi/quiz và cấp chứng nhận; tài liệu/video thực và tiến độ bền vững.
4. Checkout, callback thanh toán và khóa quyền học trước khi trả phí.
5. Phân công giảng viên, Q&A/hội thoại và xử lý ticket.
6. Báo cáo có lọc/xuất file, test nghiệp vụ và triển khai HTTPS.

Với trạng thái hiện tại, có thể demo nền LMS và các luồng cơ bản; chưa đủ bằng chứng để khẳng định toàn bộ STT 6 đã hoàn thành.
