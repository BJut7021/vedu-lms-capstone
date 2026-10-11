export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-12 text-sm border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">V</div>
            <span className="text-lg font-bold text-white">Vedu LMS</span>
          </div>
          <p className="text-xs leading-relaxed text-gray-400">
            Hệ thống quản lý và khuyến nghị lộ trình học tập cá nhân hóa dựa trên khai phá dữ liệu giáo dục.
          </p>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-3">Đề tài Khóa luận</h4>
          <p className="text-xs leading-relaxed">
            Mã đề tài: CNTT-KLCN260<br />
            Khoa Công nghệ Thông tin<br />
            Trường Đại học Công Thương TP.HCM (HUIT)
          </p>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-3">Nhóm thực hiện</h4>
          <p className="text-xs leading-relaxed">
            • Phan Minh Thiện (Nhóm trưởng)<br />
            • Trương Hoàng Thời (Frontend & UI)<br />
            • Trần Nguyễn Khánh Duy (Backend & DB)
          </p>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-3">Giảng viên hướng dẫn</h4>
          <p className="text-xs leading-relaxed">
            ThS. Lê Thị Thùy Lan
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 mt-8 border-t border-gray-800 text-center text-xs text-gray-500">
        © 2026 Vedu LMS Capstone Project. All rights reserved.
      </div>
    </footer>
  );
}
