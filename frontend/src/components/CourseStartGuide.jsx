
export default function CourseStartGuide({ compact = false }) {
  return (
    <section
      className={`rounded-2xl border p-5 ${
        compact
          ? "border-blue-800 bg-blue-950/40 text-slate-100"
          : "border-blue-100 bg-blue-50 text-slate-800"
      }`}
    >
      <h2 className="text-lg font-bold">
        Hướng dẫn học tập trên VEDU
      </h2>

      <p className="mt-2 text-sm leading-6">
        Học viên cần hoàn thành bài kiểm tra của từng bài học
        trước khi chuyển sang bài tiếp theo.
      </p>

      <ol className="mt-4 grid gap-4 text-sm leading-6 sm:grid-cols-2">
        <li>
          <strong>01 · Tìm hiểu khóa học</strong>
          <p className="mt-1 opacity-90">
            Xem tổng quan khóa học, chuẩn đầu ra, môn học
            tiên quyết và điều kiện hoàn thành.
          </p>
        </li>

        <li>
          <strong>02 · Học nội dung bài học</strong>
          <p className="mt-1 opacity-90">
            Học theo thứ tự được mở khóa. Xem video,
            đọc tài liệu PDF và nghiên cứu nội dung
            do giảng viên cung cấp.
          </p>
        </li>

        <li>
          <strong>03 · Làm quiz để mở bài tiếp theo</strong>
          <p className="mt-1 opacity-90">
            Hoàn thành quiz của bài hiện tại và đạt
            mức điểm quy định để được mở bài tiếp theo.
            Nếu chưa đạt, học viên cần ôn tập và làm lại.
          </p>
        </li>

        <li>
          <strong>04 · Luyện tập và hoàn thành khóa học</strong>
          <p className="mt-1 opacity-90">
            Nếu giảng viên giao bài tập PDF, học viên
            có thể nộp để luyện tập thêm. Bài tập này
            không ảnh hưởng đến việc mở khóa bài học.
            Hoàn thành các yêu cầu để nhận chứng nhận.
          </p>
        </li>
      </ol>

      <div
        className={`mt-5 rounded-xl p-3 text-sm leading-6 ${
          compact
            ? "bg-blue-900/60 text-blue-100"
            : "bg-white text-blue-800"
        }`}
      >
        <strong>Lưu ý:</strong> Chỉ đạt quiz mới được
        công nhận hoàn thành bài học. Việc xem hết
        video hoặc đọc xong tài liệu không tự động
        mở khóa bài tiếp theo.
      </div>
    </section>
  );
}
