# Ảnh đại diện khóa học — 27/10/2026

Đã làm ảnh bìa riêng cho cả **50 khóa đang công bố**, tổng dung lượng **1.275.682 byte (khoảng 1,22 MiB)**. Các ảnh đều nằm trong ứng dụng, không cần tải từ dịch vụ ảnh ngẫu nhiên bên ngoài.

## Nội dung và thiết kế

- Mạng máy tính: switch, cáp và sơ đồ kết nối; nhãn OSI, IP, TCP/UDP dựa trên đề cương.
- Cấu trúc rời rạc: đồ thị, logic, tập hợp và phép đếm.
- Word: báo cáo, cấu trúc tài liệu và nhận xét; Excel: bảng chi phí, công thức và báo cáo; PowerPoint: bố cục slide, biểu đồ và thuyết trình dự án.
- Kỹ năng số: tệp, chia sẻ, cộng tác và an toàn email; Office 365 tham chiếu: đồng bộ tệp, chia sẻ và email.
- React/Node.js: giao diện, state và kết nối API; PostgreSQL: schema và ràng buộc; HUSPM: chuỗi hành vi, utility và mẫu lặp lại.
- Bốn nhóm thực hành mẫu có 40 ảnh minh họa riêng, cùng hệ thiết kế nhưng khác bố cục, đồ họa và số thứ tự. Các khóa này mới có nội dung nhập môn chung; ảnh không bổ sung các lời hứa về kỹ năng nâng cao chưa có trong học liệu.

Mười ảnh minh họa biên tập của các khóa có nội dung cụ thể được tạo bằng **ImageGen tích hợp**, theo phong cách vật liệu thật, ánh sáng tự nhiên, không dùng robot/đầu não phát sáng/neon. Đây là ảnh minh họa có hỗ trợ AI, không phải ảnh chụp hoạt động thật hoặc ảnh giao diện sản phẩm chính thức. Bộ prompt đầy đủ: [course-cover-prompts.json](validation/course-cover-prompts.json).

Ảnh hiển thị tỷ lệ 16:9 ở danh mục và trang giới thiệu; ảnh nhỏ trong phòng học chỉ hiện hình, ẩn phần chữ để không rối. Chữ tiếng Việt được đặt bằng giao diện, không phụ thuộc khả năng viết chữ của mô hình. Các ảnh khóa học được chọn đồng nhất ở trang chủ, danh mục, giới thiệu và phòng học.

## File đã lưu và cách bảo trì

- Toàn bộ 50 ảnh cuối cùng: `frontend/public/images/course-covers/v2/course-<id>.webp`.
- Tên khóa, ảnh, tiêu đề ngắn và nhãn kỹ năng: `frontend/src/data/course-covers.json`.
- Bản chụp nội dung đề cương dùng rà soát: `data/course-covers/catalog.json`.
- Phân giải ảnh: `frontend/src/services/courseCovers.js`; giao diện dùng chung: `frontend/src/components/CourseImage.jsx`.
- Giữ ảnh do giảng viên tự chọn. Nếu tải lỗi, chuyển sang ảnh đã rà soát của đúng khóa; nếu ảnh nội bộ cũng thiếu, dùng minh họa môn học dự phòng. Không dùng ảnh của một khóa cùng tên nhưng ID khác.
- Không thay đổi cơ sở dữ liệu, bài học, học phí hoặc tiến độ của học viên.

Chạy `node scripts/build-course-covers.mjs` để dựng lại ảnh mẫu/manifest; mười ảnh minh họa cuối cùng đã lưu trong dự án được giữ nếu nguồn ImageGen cục bộ không còn. Không cần API key hoặc tạo ảnh lại để chạy ứng dụng từ bản đóng gói. Khi thêm khóa mới, ưu tiên ảnh giảng viên tự cung cấp; ảnh dự phòng được tạo tự động theo môn và định danh khóa.

## Kiểm tra

- 50 file khác nhau về đường dẫn và SHA-256; kiểm tra phần đồ họa bằng dấu vân tay ảnh không phát hiện bản trùng hoàn toàn. Đây là kiểm tra lặp ảnh, không chứng minh các khóa mẫu có nội dung đào tạo khác nhau.
- Giải mã đủ 50 WebP, kiểm tra tỷ lệ ảnh, dung lượng và dữ liệu tải thực qua frontend Docker.
- Sáu tình huống React bổ sung: ảnh đúng khóa, giữ ảnh riêng của giảng viên, lỗi ảnh riêng, lỗi ảnh nội bộ, thay ảnh mặc định cũ, khóa cùng tên khác định danh. Tổng bộ kiểm tra giao diện hiện có 36 tình huống.
- Kiểm tra trực quan danh mục ở 1280×720 và 390×844: ảnh và chữ hiển thị, không tràn ngang. Ảnh minh chứng nằm tại `docs/screenshots/course-covers-desktop-2026-10-27.png` và bản mobile tương ứng.
- Minh chứng tự động: `docs/validation/course-cover-checks.json`, `course-covers-v2.json` và `ui-interactions.json`.

Mở <http://localhost:8080/courses> rồi **Ctrl+F5** để xem bản mới. Không cần nhập lại database.
