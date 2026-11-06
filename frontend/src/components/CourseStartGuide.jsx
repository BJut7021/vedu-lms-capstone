
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
        Bạn có thể xem các bài đã công bố theo thứ tự phù hợp.
        Hãy xem chuẩn đầu ra và danh sách mô-đun bắt buộc trước khi bắt đầu.
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
            Học theo đề cương hoặc lộ trình gợi ý. Xem video,
            đọc tài liệu PDF và nghiên cứu nội dung
            do giảng viên cung cấp.
          </p>
        </li>

        <li>
          <strong>03 · Đánh giá theo mô-đun</strong>
          <p className="mt-1 opacity-90">
            Làm quiz và nộp bài thực hành nếu mô-đun yêu cầu.
            Dùng kết quả và phản hồi để chọn phần cần ôn hoặc sửa bài.
          </p>
        </li>

        <li>
          <strong>04 · Luyện tập và hoàn thành khóa học</strong>
          <p className="mt-1 opacity-90">
            Sau khi đạt các mô-đun bắt buộc, hoàn thành đánh giá cuối khóa
            theo hình thức đã công bố để nhận chứng nhận.
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
        <strong>Lưu ý:</strong> Tiến độ xem video cho biết bạn đã học đến đâu.
        Kết quả quiz và bài nộp là minh chứng để xét đạt mô-đun.
      </div>
    </section>
  );
}
