import { resolve } from 'path';
// Original VEDU mark; not an institutional/legal stamp or digital signature.
export function drawCertificate(
  doc: PDFKit.PDFDocument,
  c: {
    status: string;
    full_name: string;
    course_name: string;
    issued_at: string;
    certificate_code: string;
  },
) {
  const issued = c.status === 'ISSUED';
  doc.font(resolve('assets/DejaVuSans.ttf'));
  doc.rect(0, 0, 842, 595).fill('#ffffff');
  doc.rect(23, 23, 796, 549).lineWidth(1.5).stroke('#153d78');
  doc.rect(31, 31, 780, 533).lineWidth(0.5).stroke('#bacde6');
  doc.rect(23, 23, 14, 549).fill('#153d78');
  doc.roundedRect(69, 54, 43, 43, 12).fill('#2563eb');
  doc.path('M78 66 L90 72 L103 66 L103 84 L90 90 L78 84 Z').fill('#ffffff');
  doc
    .moveTo(90, 72)
    .lineTo(90, 90)
    .strokeColor('#2563eb')
    .lineWidth(1.5)
    .stroke();
  doc.fillColor('#153d78').fontSize(22).text('VEDU', 124, 53, { width: 620 });
  doc
    .fillColor('#64748b')
    .fontSize(10)
    .text('LEARNING MANAGEMENT SYSTEM', 124, 82, { width: 620 });
  doc
    .fillColor(issued ? '#153d78' : '#b42335')
    .fontSize(27)
    .text(issued ? 'CHỨNG NHẬN HOÀN THÀNH' : 'CHỨNG NHẬN ĐÃ THU HỒI', 65, 132, {
      width: 710,
      align: 'center',
    });
  doc
    .fillColor('#64748b')
    .fontSize(11)
    .text('Chứng nhận học viên', 65, 187, { width: 710, align: 'center' });
  let size = 28;
  while (size > 16 && doc.fontSize(size).widthOfString(c.full_name) > 690)
    size--;
  doc
    .fillColor('#0f172a')
    .fontSize(size)
    .text(c.full_name, 70, 216, { width: 700, align: 'center', height: 48 });
  doc
    .strokeColor('#cbd5e1')
    .lineWidth(0.7)
    .moveTo(180, 267)
    .lineTo(662, 267)
    .stroke();
  doc
    .fillColor('#64748b')
    .fontSize(11)
    .text('Đã hoàn thành yêu cầu học tập và đánh giá của khóa học', 65, 284, {
      width: 710,
      align: 'center',
    });
  size = 19;
  while (
    size > 12 &&
    doc.fontSize(size).heightOfString(c.course_name, { width: 650 }) > 57
  )
    size--;
  doc
    .fillColor('#153d78')
    .fontSize(size)
    .text(c.course_name, 95, 312, { width: 650, align: 'center', height: 60 });
  doc
    .fillColor('#475569')
    .fontSize(10)
    .text(
      `Ngày cấp: ${new Date(c.issued_at).toLocaleDateString('vi-VN', {timeZone:'Asia/Ho_Chi_Minh'})}`,
      78,
      402,
      { width: 440 },
    );
  doc.text(`Mã tra cứu: ${c.certificate_code}`, 78, 424, { width: 440 });
  const url = `${process.env.WEB_URL || 'http://localhost:8080'}/verify/${encodeURIComponent(c.certificate_code)}`;
  doc
    .fillColor('#2563eb')
    .fontSize(9)
    .text(url, 78, 448, { width: 445, link: url, underline: true });
  const x = 682,
    y = 432;
  doc
    .save()
    .strokeColor(issued ? '#b42335' : '#64748b')
    .fillColor(issued ? '#b42335' : '#64748b');
  doc.circle(x, y, 62).lineWidth(1.8).stroke();
  doc.circle(x, y, 57).lineWidth(0.6).stroke();
  doc
    .fontSize(10)
    .text('VEDU LMS', x - 45, y - 47, { width: 90, align: 'center' });
  doc
    .moveTo(x - 18, y - 6)
    .lineTo(x - 4, y + 7)
    .lineTo(x + 21, y - 21)
    .lineWidth(3)
    .stroke();
  doc.fontSize(16).text('VEDU', x - 45, y + 13, { width: 90, align: 'center' });
  doc
    .fontSize(6)
    .text(issued ? 'XÁC NHẬN' : 'ĐÃ THU HỒI', x - 40, y + 34, {
      width: 80,
      align: 'center',
    });
  if(issued) doc.text('HOÀN THÀNH',x-40,y+43,{width:80,align:'center'});
  doc.restore();
  doc
    .fillColor('#64748b')
    .fontSize(8)
    .text(
      'Chứng nhận hoàn thành nội bộ VEDU. Không thay thế văn bằng, chứng chỉ được cơ quan có thẩm quyền công nhận.',
      65,
      515,
      { width: 710, align: 'center', lineBreak: false },
    );
}
