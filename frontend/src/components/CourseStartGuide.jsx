export default function CourseStartGuide({ compact = false }) {
  return (
    <section
      className={`rounded-2xl border p-5 ${compact ? "border-blue-800 bg-blue-950/40 text-slate-100" : "border-blue-100 bg-blue-50 text-slate-800"}`}
    >
      <h2 className="text-lg font-bold">Lần đầu học? Bắt đầu tại đây</h2>
      <ol className="mt-3 grid gap-3 text-sm leading-6 sm:grid-cols-2">
        <li>
          <strong>01 · Đọc hướng dẫn & đề cương</strong>
          <p>
            Nắm mục tiêu, kiến thức cần có và thứ tự bài học ở danh sách nội
            dung.
          </p>
        </li>
        <li>
          <strong>02 · Học từng bài</strong>
          <p>
            Đọc bài giảng, mở slide/tài liệu bên dưới. Xem video nếu bài có
            video; không phải khóa nào cũng có.
          </p>
        </li>
        <li>
          <strong>03 · Làm bài tập nhỏ</strong>
          <p>
            Tự làm trước khi xem gợi ý. Với tài liệu, bấm “Tôi đã đọc tài liệu”
            để lưu tiến độ, sau đó chọn bài kế tiếp.
          </p>
        </li>
        <li>
          <strong>04 · Thi & nhận chứng nhận</strong>
          <p>
            Hoàn thành các bài, đạt tất cả quiz. Vào Bảng điều khiển → Chứng chỉ
            để yêu cầu cấp và tải PDF.
          </p>
        </li>
      </ol>
    </section>
  );
}
