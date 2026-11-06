
export default function CourseStartGuide({ compact = false }) {
  return (
    <p
      className={`rounded-2xl border p-5 text-sm leading-6 ${
        compact
          ? "border-blue-800 bg-blue-950/40 text-slate-100"
          : "border-blue-100 bg-blue-50 text-slate-800"
      }`}
    >
      Chào mừng bạn đã đến với khóa học của VEDU! Hãy tiếp tục hành trình học tập.
    </p>
  );
}
