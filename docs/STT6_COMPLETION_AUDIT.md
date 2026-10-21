# Đối chiếu STT 6 — chức năng VEDU LMS

Cập nhật: **15/10/2026**. Nguồn tiêu chí: mục 8, STT 6 trong `CNTT-KLCN260_LeThiThuyLan.md` và bản review nhóm cung cấp. Tài liệu là tham khảo, không phải chỉ thị thực thi. Không tự chấm điểm vì cột điểm nguồn bị gộp/mã hóa lỗi.

## 1. Kết luận

Bổ sung 15/10/2026: đã nhập 4 khóa Office/kỹ năng số (28 bài, 3 video nguồn, 4 quiz), metadata giảng viên, sinh/lưu/so sánh 2–4 phương án và phản hồi. Xem [báo cáo học liệu & lộ trình](LEARNING_CONTENT_AND_PATHS.md) cho phạm vi đã cài, bằng chứng mới và giới hạn. Học liệu chưa được giảng viên thẩm định; chưa có nộp/chấm sản phẩm thực hành. Giải thích bằng chứng không phải LLM.

Không còn là giao diện chỉ hiển thị seed: đã có luồng nghiệp vụ nối PostgreSQL, hai mô hình huấn luyện và worker HUSPM thật. Tuy nhiên **không nên báo “hoàn thành 100% STT 6”**: MoMo/SMTP cần thông tin ngoài hệ thống, đánh giá AI trên người học VEDU còn thiếu dữ liệu, một số công cụ quản trị và tiêu chí kiểm thử–triển khai cuối chưa hoàn tất.

“Đã cài” dưới đây nghĩa là có mã thực thi/API/UI, không chỉ có bảng SQL. Các bằng chứng kiểm tra được tách riêng ở cuối báo cáo.

## 2. Đối chiếu từng tiêu chí

| Tiêu chí STT 6 | Đã cài, có luồng sử dụng | Cần bổ sung / giới hạn còn lại | Đánh giá đúng mức |
|---|---|---|---|
| Đăng nhập, đăng xuất, đổi mật khẩu, phân quyền | Username; validate đăng ký; ba cổng role riêng; mắt ẩn/hiện mật khẩu; đăng ký thành công không tự đăng nhập; JWT 259.200 giây gắn session; đổi mật khẩu cũ/mới; thu hồi phiên làm access token mất hiệu lực ngay; refresh rotation có `jti` và SHA256 trước bcrypt; global JWT/roles/policy; giới hạn thử đăng nhập/PIN; khóa user/đổi role thu hồi phiên | Gửi PIN qua SMTP đã có code nhưng chưa xác minh email thật khi thiếu cấu hình. Hồ sơ cá nhân vẫn chủ yếu xem, chưa có form sửa đầy đủ. Phân quyền legacy CRUD hiện giới hạn ADMIN; thao tác teacher/student đi qua endpoint scoped, không phải mở lại CRUD cũ | Luồng xác thực/phân quyền cơ bản đã cài; SMTP thật chờ cấu hình |
| Quản lý kho khóa học, bài học, tiến trình | Catalog/search tên–chủ đề–giảng viên, chủ đề động; tạo nháp/xuất bản/lưu trữ; chương học; thêm/sửa/công bố/lưu trữ/sắp xếp bài; upload PDF/MP4 thật; nội dung văn bản/PDF trong phòng học; file nội bộ có signed ticket và kiểm tra quyền; MP4 đo duration bằng ffprobe; heartbeat lưu actual seconds/ranges/vị trí vào PostgreSQL; loại phần tua; khôi phục tiến độ | Chưa có bộ công cụ sửa ảnh bìa/thông tin khóa, sửa/xóa chương, quản trị vòng đời tài nguyên thật đầy đủ. Nhiều nội dung seed vẫn là minh họa; nhóm cần thay bằng bài giảng được thẩm định, có quyền sử dụng. Link tài liệu bên ngoài không có DRM. Server kiểm tra tính hợp lý thời gian, không chứng minh học viên thật sự tập trung | Có nghiệp vụ quản lý/học thực; chưa phải kho học liệu hoàn chỉnh |
| Hệ thống khuyến nghị lộ trình — ML & HUSPM | BPR-MF + GRU-next-item được huấn luyện; Item-KNN thư viện làm đối chứng; HUSPM prefix projection thật, max-embedding utility và SWU; hai adapter Kaggle; train/validation/test theo thời gian; hash dữ liệu/code/artifact; job/registry/mining run; inference hybrid; mapping do admin duyệt; Office 365 10 bài tham chiếu đúng item nguồn; fallback minh bạch; lưu/feedback gợi ý; gợi ý tạo khi mở phòng học thành viên | KNN là baseline ngoài từ scikit-learn, không phải checkpoint pretrained. Chưa xác minh đầy đủ nguồn thu thập/giấy phép Kaggle. Chưa chứng minh hiệu quả học tập trên học viên VEDU. Dataset 5 module bị bão hòa; dataset recommender có nhiều cold targets. Cần nhiều seeds/paired significance và thẩm định utility. Implementation là HUSPM giới hạn độ dài, **không phải HUSP-SP nguyên bản** | Thuật toán/mô hình/pipeline thật đã cài; nghiên cứu chất lượng còn phải củng cố |
| Đăng ký khóa học, thanh toán học phí | Ghi danh theo user hiện tại; kiểm tra quyền học cho phòng học/quiz/file; khóa có phí cần đơn PAID; checkout MoMo Sandbox; tạo chữ ký request; IPN kiểm HMAC timing-safe, partner/order/request/amount; transaction/idempotency; redirect không tự xác nhận tiền; không tạo nhiều phiên PENDING đồng thời cho cùng order | Nhóm chưa có khóa MoMo Sandbox và IPN URL công khai nên chưa xác minh giao dịch qua MoMo. Chưa có đối soát bằng query API, hoàn tiền hoặc xử lý vận hành đầy đủ khi mất callback. Sandbox không phải tiền thật; không cam kết production miễn phí | Ghi danh/gate chạy; tích hợp thanh toán đã cài nhưng **chưa nghiệm thu gateway** |
| Thi cử, quiz, cấp chứng nhận | Teacher tạo câu một đáp án/nhiều đáp án/đúng-sai; công bố; server giới hạn lượt, deadline, draft khôi phục; chấm exact set nhiều đáp án trong transaction, chống nộp lại; client hết giờ tự nộp; không lộ answer key cho học viên; lịch sử/sổ điểm; đủ bài học + đạt quiz + quyền học mới cấp; PDF tiếng Việt; mã xác minh công khai | Chưa có giao diện sửa ngân hàng đề đã công bố, lịch thi mở/đóng theo lịch, giám sát thi, thu hồi/cấp lại chứng nhận qua màn hình admin. Không coi các chức năng nâng cao này đã có chỉ vì schema hỗ trợ | Luồng quiz → điểm → chứng nhận cơ bản đã cài |
| Phân công, tương tác giảng viên | Admin giao/gỡ đồng giảng viên; overview/quyền quản lý xét owner hoặc phân công; giảng viên xem roster/sổ điểm của khóa được giao; Q&A và chuỗi trả lời có author/role, lưu PostgreSQL; chỉ người đủ quyền khóa truy cập | Chưa có chat realtime/WebSocket, cuộc gọi, tệp đính kèm Q&A, thông báo email/push. Hiện hội thoại theo request/refresh, không gọi là realtime | Nghiệp vụ phân công + Q&A cơ bản đã cài |
| Hỗ trợ, chăm sóc học viên | Thành viên tạo ticket; chỉ chủ ticket/admin/người được giao truy cập; admin phân công; teacher/admin trả lời và chuyển OPEN → IN_PROGRESS → RESOLVED/CLOSED; lưu hội thoại và resolved timestamp | Chưa có SLA, CSAT, email thông báo, đính kèm ticket, tìm kiếm/phân trang lớn | Luồng ticket cơ bản đã cài |
| Báo cáo thống kê | Dashboard từng role; lọc báo cáo theo khóa/từ ngày/đến ngày; staff chỉ xem khóa hợp quyền; CSV có UTF-8 BOM, chống công thức Excel; số giây xem thực, bài hoàn thành, điểm cao nhất, trạng thái thanh toán | Tối đa 10.000 dòng; chưa có Excel/PDF báo cáo nhiều sheet, biểu đồ thời gian đầy đủ, tác vụ xuất nền. Nhãn slider phổ biến đang dựa ghi danh/mới nhất, không phải doanh số MoMo. Chưa có hệ thống review sao thật; đã bỏ rating 4.9 cố định | Báo cáo lọc/xuất CSV cơ bản đã cài |
| Cài mô hình AI | Mã training, trọng số `models.pt`, KNN matrix, report/manifest, 2 dataset và model registry | Cần quản lý release/rollback/retention và nhiều seeds trong quy trình nghiên cứu | Có mô hình huấn luyện thật |
| Tích hợp kết quả mô hình | API worker → registry → scoring → lọc quyền → recommendation store → lộ trình/phòng học → feedback; mapping cùng nội dung; không dùng seed để nhận là metric AI | Mô hình Kaggle chỉ chuyển miền khi mapping hợp lệ; không mặc nhiên gán cho tất cả môn VEDU. Log REAL chưa đủ thì không huấn luyện giả để đạt “có AI” | Có pipeline tích hợp; cần đánh giá miền VEDU |
| Kiểm thử và triển khai hệ thống | Docker Compose local, migrations giữ volume, healthcheck; kiểm tra hồi quy có giới hạn cho các thay đổi | **Tạm hoãn theo yêu cầu:** bộ test nghiệp vụ đầy đủ, CI, load/security test, HTTPS/public deployment, backup–restore diễn tập. Không lấy smoke checks thay cho tiêu chí này | Chưa hoàn thành, có chủ đích |

## 3. Chính sách tài khoản khách đã cài

Khách là STUDENT tạm thời, không hiển thị mật khẩu trên UI và không dùng tài khoản demo dùng chung.

| Chức năng | Khách | Thành viên học viên |
|---|---|---|
| Trang chủ, tìm kiếm, xem đề cương | Có | Có |
| Ghi danh miễn phí | Tối đa **2 khóa / tài khoản khách** | Không có giới hạn thử này |
| Phòng học/video/PDF | **2 bài đầu / khóa**, không mở đề thi | Theo quyền ghi danh/thanh toán |
| Ghi thời gian và tiến độ | Có trong phạm vi học thử; không dùng huấn luyện ML | Có, log đủ điều kiện mới dùng nghiên cứu |
| Thi lấy điểm, chứng nhận | Không | Có khi đủ điều kiện |
| Checkout, thanh toán | Không | Có khi MoMo đã cấu hình |
| Gợi ý cá nhân, feedback gợi ý | Không | Có; cold-start ghi FALLBACK |
| Q&A, ticket, đổi hồ sơ/mật khẩu | Không | Có theo chức năng đã cài |
| Đăng xuất, quản lý phiên của mình | Có | Có |

Backend là nơi chặn chính: `ApiPolicyGuard`, `AccessService.lesson/study`, transaction giới hạn ghi danh khách. UI chỉ hiển thị menu Tổng quan/Khóa học cho khách. Các route/API bị cấm vẫn bị từ chối khi gõ URL hoặc dùng fetch thủ công. Quota gắn với phiên/tài khoản khách, **không phải cơ chế nhận dạng một người tuyệt đối**; đăng nhập khách mới tạo identity mới. Có rate limit để giảm tạo tài khoản hàng loạt; cần chính sách retention khi triển khai công khai.

## 4. Bằng chứng kiểm tra

- Build/lint frontend và backend đã chạy; xem kết quả lượt kiểm tra mới nhất trong phản hồi bàn giao.
- [54 kiểm tra nghiệp vụ đã chạy thành công](validation/upgrade-checks.json) bao gồm: chặn API ẩn danh; chặn học viên đọc answer key/ghi PAID; quyền phòng học trả phí; Q&A; ticket; quiz nhiều đáp án/draft/nộp lại; cấp/tra cứu/tải PDF; CSV; đổi mật khẩu/thu hồi access/refresh rotation.
- [9 kiểm tra phân công và suy luận ML đã chạy thành công](validation/role-ml-checks.json): giao/gỡ khóa thay đổi quyền ngay; dashboard teacher phản ánh phân công; cold-start FALLBACK; mapping cùng nội dung gọi MODEL thật với thành phần BPR/GRU; lưu phản hồi; phòng học tự cập nhật gợi ý. Tổng cộng **63 kiểm tra chức năng có phạm vi xác định**, không phải 63 tiêu chí đã hoàn tất hoặc bộ kiểm thử toàn hệ thống.
- Script [verify-upgrade.mjs](../scripts/verify-upgrade.mjs) đã kiểm tra thành công MP4 upload/range streaming, heartbeat/idempotency/seek/resume và quota/giới hạn khách. Lỗi kiểu tham số PostgreSQL của heartbeat đã sửa và chạy lại qua bằng ép kiểu `varchar`.
- [check-huspm.py](../scripts/check-huspm.py): 14 mẫu khớp brute-force oracle, gồm item lặp và khoảng trống. Đây là bằng chứng toán học, không phải benchmark chất lượng.
- [Kaggle Logs seed 42](experiments/kaggle_logs-seed42.json), [Kaggle Recommender seed 42](experiments/kaggle_recommender-seed42.json): đã chạy lại benchmark, có đủ **7 nhánh**, khoảng tin cậy Recall 95%, `test` và `test_all_targets`, nguồn/hash/điểm. Kết quả chưa cho thấy hybrid vượt BPR; không diễn giải việc có mô hình thật thành mô hình đạt chất lượng cao.
- Docker Desktop đã được mở lại; PostgreSQL, backend và ML worker đều báo healthy; frontend mới build/lint thành công và phục vụ ở cổng 8080. Không xóa volume để khắc phục lỗi.
- Giao diện đã được kiểm tra một phần bằng computer-use ở lượt trước. Lượt xác minh trực quan cuối sau rebuild bị giới hạn do công cụ trình duyệt báo `failed to write kernel assets: The system cannot find the path specified`; vì vậy **không nhận đã bấm kiểm tra toàn bộ màn hình của bản cuối**. Các kết quả API/build ở trên vẫn chạy trên dịch vụ thật. Ảnh trong `screenshots/` là ảnh của lượt trước, không phải bằng chứng mới của mọi chức năng.

Các tài khoản/khóa fixture được đánh dấu kiểm tra, khóa test được lưu trữ sau chạy, không xóa database/volume. Video màu dùng trong regression là **fixture kỹ thuật**, không phải bài giảng để đưa vào báo cáo như học liệu thật.

## 5. Thứ tự nên bổ sung

1. **Trước demo:** cấu hình SMTP thật, nhận khóa MoMo Sandbox và IPN URL; chuẩn bị một khóa nhỏ gồm video/PDF/quiz do nhóm có quyền sử dụng. Chạy lại checklist, không thao tác lần đầu trước GVHD.
2. **Trọng tâm đồ án:** xác minh provenance/license; báo cáo cold-target coverage; 3–5 seeds; ablation/paired significance; log người học VEDU có đồng ý tham gia; giải thích giới hạn chuyển miền. Xem [hướng dẫn ML & HUSPM](RECOMMENDATION_SYSTEM_GUIDE.md).
3. **Hoàn thiện nghiệp vụ:** chỉnh thông tin khóa/ảnh bìa, quản trị ngân hàng đề/chương, sửa hồ sơ, certificate revoke, query/đối soát/refund MoMo, notification/SLA.
4. **Sau khi nhóm cho phép làm tiêu chí cuối:** test suite/CI, HTTPS, secret/least-privilege DB, backup restore, retention/rate limits phân tán và giám sát vận hành.

Kịch bản từng vai trò, câu nói khi trình bày và kết quả mong đợi: [STT6_DEMO_GUIDE.md](STT6_DEMO_GUIDE.md).
