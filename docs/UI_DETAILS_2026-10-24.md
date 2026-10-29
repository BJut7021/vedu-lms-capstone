# Họa tiết trang chủ, avatar và tiến độ phòng học

Cập nhật tiếp ngày 24/10/2026 theo hai ảnh giao diện tham khảo.

- Hai bên trang chủ dùng bộ minh họa VEDU mới: chồng sách/mũ tốt nghiệp, laptop/lập trình, cây xanh, máy bay giấy, ngôi sao và chữ trang trí. Hình SVG tải từ ứng dụng, không phụ thuộc dịch vụ ảnh bên ngoài. Nội dung trang chủ rộng tối đa 1.120 px để chừa khoảng trống cân đối. Hình hai bên hiện từ 1.280 px và co theo lề; màn hình nhỏ giữ họa tiết nền nhẹ để tránh che chữ/nút.
- Trong phòng học, thanh điều hướng hiển thị ảnh đại diện thật đã tải lên kèm tên người đang đăng nhập. Bấm avatar/tên để mở hồ sơ, không gian học tập hoặc đăng xuất. Chưa có ảnh thì dùng chữ cái tên; không gán ảnh người khác cho học viên.
- Danh sách bài có đường nối, vòng trạng thái xanh dương/xanh lá và số bài hoàn thành theo chương. Khung tiến độ có thanh phần trăm cùng chú giải số bài đã hoàn thành, chưa học và đang học. Tính theo dữ liệu tiến độ, không dùng số liệu trong ảnh mẫu. Mục chỉ chứa quiz hiện số bài thi, không hiện tỷ lệ 0/0.
- Tài liệu có biểu tượng tệp gấp góc kèm nhãn: PDF đỏ, PPT xanh dương, DOC xanh lá, XLS xanh, WEB tím. Nhận dạng theo phần mở rộng URL/tên tệp hoặc loại tài liệu được lưu. Liên kết/tệp chưa xác định có biểu tượng riêng. Không đổi slide HTML thành PPT giả, không tạo tài liệu hoặc dung lượng MB giả.
- Màn hình từ 1.280 px hiển thị khung tài liệu và tiến độ bên phải; màn hình nhỏ hơn dùng tab Tài liệu. Điện thoại có thanh tiến độ khóa học và bộ chọn bài riêng. Thẻ bài tiếp theo có ảnh khóa học và nút tiếp tục.

Mở <http://localhost:8080/> rồi **Ctrl+F5** để tải giao diện mới. Đổi ảnh tại **Hồ sơ cá nhân** của học viên/giảng viên. Mở một bài có tài liệu để xem biểu tượng định dạng; không phải bài nào cũng có đủ PDF/PPT/Word.

Kiểm tra: frontend build/lint đạt; 23 kiểm tra thao tác React/JSDOM đạt, gồm tiến độ theo số bài hoàn thành, chú giải trạng thái, bốn định dạng tệp, avatar/tên và liên kết hồ sơ, đổi bài/cuộn về đầu và tải ảnh. Minh chứng tại `docs/validation/ui-interactions.json`. SVG được kết xuất kiểm tra riêng. Kiểm tra trực quan toàn trang trong trình duyệt chưa hoàn tất do công cụ điều khiển cửa sổ không ổn định; không có ảnh chụp toàn trang mới được dùng làm minh chứng.
