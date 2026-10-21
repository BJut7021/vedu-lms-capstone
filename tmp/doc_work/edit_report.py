from __future__ import annotations

import shutil
import sys
import zipfile
from pathlib import Path

from docx import Document
from docx.enum.table import WD_CELL_VERTICAL_ALIGNMENT, WD_ROW_HEIGHT_RULE
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt


SOURCE = Path(r"C:\2025-2026_Dai_Hoc\hk1-2026-namcuoi\CNTT_KLCN_260_EDU\CNTT-KLCN260-EDU-HUSPM-FINAL.docx")
OUTPUT = Path(r"C:\Project\vedu-lms-capstone\output\documents\VEDU_KhoaLuan_Chuong4_HoanThien.docx")
MEDIA = Path(r"C:\Project\vedu-lms-capstone\tmp\doc_work\new_media")


def set_cell_shading(cell, fill: str) -> None:
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = tc_pr.find(qn("w:shd"))
    if shd is None:
        shd = OxmlElement("w:shd")
        tc_pr.append(shd)
    shd.set(qn("w:fill"), fill)


def set_cell_margins(cell, top=90, start=110, bottom=90, end=110) -> None:
    tc = cell._tc
    tc_pr = tc.get_or_add_tcPr()
    tc_mar = tc_pr.first_child_found_in("w:tcMar")
    if tc_mar is None:
        tc_mar = OxmlElement("w:tcMar")
        tc_pr.append(tc_mar)
    for margin, value in (("top", top), ("start", start), ("bottom", bottom), ("end", end)):
        node = tc_mar.find(qn(f"w:{margin}"))
        if node is None:
            node = OxmlElement(f"w:{margin}")
            tc_mar.append(node)
        node.set(qn("w:w"), str(value))
        node.set(qn("w:type"), "dxa")


def set_repeat_table_header(row) -> None:
    tr_pr = row._tr.get_or_add_trPr()
    tbl_header = OxmlElement("w:tblHeader")
    tbl_header.set(qn("w:val"), "true")
    tr_pr.append(tbl_header)


def prevent_row_split(row) -> None:
    tr_pr = row._tr.get_or_add_trPr()
    cant_split = OxmlElement("w:cantSplit")
    cant_split.set(qn("w:val"), "true")
    tr_pr.append(cant_split)


def format_run(run, size=13, bold=None, color=None) -> None:
    run.font.name = "Times New Roman"
    run._element.get_or_add_rPr().rFonts.set(qn("w:ascii"), "Times New Roman")
    run._element.get_or_add_rPr().rFonts.set(qn("w:hAnsi"), "Times New Roman")
    run.font.size = Pt(size)
    if bold is not None:
        run.bold = bold
    if color:
        run.font.color.rgb = color


def body(document: Document, text: str, *, indent=True, bold_lead: str | None = None):
    paragraph = document.add_paragraph(style="Body Text")
    paragraph.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    paragraph.paragraph_format.line_spacing = 1.3
    paragraph.paragraph_format.space_after = Pt(5)
    if indent:
        paragraph.paragraph_format.first_line_indent = Cm(1)
    if bold_lead and text.startswith(bold_lead):
        first = paragraph.add_run(bold_lead)
        format_run(first, 13, True)
        rest = paragraph.add_run(text[len(bold_lead):])
        format_run(rest, 13)
    else:
        run = paragraph.add_run(text)
        format_run(run, 13)
    return paragraph


def bullet(document: Document, text: str):
    paragraph = document.add_paragraph(style="List Paragraph")
    paragraph.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    paragraph.paragraph_format.left_indent = Cm(0.75)
    paragraph.paragraph_format.first_line_indent = Cm(-0.5)
    paragraph.paragraph_format.line_spacing = 1.25
    paragraph.paragraph_format.space_after = Pt(3)
    run = paragraph.add_run(f"– {text}")
    format_run(run, 13)
    return paragraph


def heading(document: Document, level: int, text: str):
    paragraph = document.add_paragraph(text, style=f"Heading {level}")
    paragraph.paragraph_format.keep_with_next = True
    for run in paragraph.runs:
        format_run(run, 18 if level == 1 else 14 if level == 2 else 13, True)
    return paragraph


def caption(document: Document, text: str):
    paragraph = document.add_paragraph(style="Body Text")
    paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    paragraph.paragraph_format.keep_with_next = True
    paragraph.paragraph_format.space_before = Pt(5)
    paragraph.paragraph_format.space_after = Pt(5)
    run = paragraph.add_run(text)
    format_run(run, 12, True)
    return paragraph


def add_table(document: Document, headers: list[str], rows: list[list[str]], widths: list[float] | None = None):
    table = document.add_table(rows=1, cols=len(headers))
    table.style = "Table Grid"
    table.autofit = False
    set_repeat_table_header(table.rows[0])
    prevent_row_split(table.rows[0])
    for col, value in enumerate(headers):
        cell = table.rows[0].cells[col]
        set_cell_shading(cell, "1F4E78")
        set_cell_margins(cell)
        cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
        paragraph = cell.paragraphs[0]
        paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = paragraph.add_run(value)
        format_run(run, 11, True)
        run.font.color.rgb = __import__("docx").shared.RGBColor(255, 255, 255)
    for row_index, values in enumerate(rows, start=1):
        row = table.add_row()
        prevent_row_split(row)
        for col, value in enumerate(values):
            cell = row.cells[col]
            if row_index % 2 == 0:
                set_cell_shading(cell, "EAF2F8")
            set_cell_margins(cell)
            cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
            paragraph = cell.paragraphs[0]
            paragraph.alignment = WD_ALIGN_PARAGRAPH.LEFT
            paragraph.paragraph_format.line_spacing = 1.15
            run = paragraph.add_run(value)
            format_run(run, 10.5)
    if widths:
        for row in table.rows:
            for col, width in enumerate(widths):
                row.cells[col].width = Cm(width)
    document.add_paragraph().paragraph_format.space_after = Pt(2)
    return table


def replace_run_text(document: Document, old: str, new: str) -> None:
    paragraphs = list(document.paragraphs)
    for table in document.tables:
        for row in table.rows:
            for cell in row.cells:
                paragraphs.extend(cell.paragraphs)
    for paragraph in paragraphs:
        for run in paragraph.runs:
            if old in run.text:
                run.text = run.text.replace(old, new)


def set_paragraph_text(paragraph, text: str) -> None:
    for run in list(paragraph.runs):
        run._element.getparent().remove(run._element)
    run = paragraph.add_run(text)
    format_run(run, 13)


def insert_before(reference, text: str, style: str):
    paragraph = reference.insert_paragraph_before(text, style=style)
    for run in paragraph.runs:
        format_run(run, 13)
    return paragraph


def replace_media(docx_path: Path) -> None:
    temp = docx_path.with_suffix(".media.tmp.docx")
    with zipfile.ZipFile(docx_path, "r") as source, zipfile.ZipFile(temp, "w", zipfile.ZIP_DEFLATED) as target:
        for item in source.infolist():
            payload = source.read(item.filename)
            name = Path(item.filename).name
            replacement = MEDIA / name
            if item.filename.startswith("word/media/image") and replacement.exists() and name != "image1.png":
                payload = replacement.read_bytes()
            target.writestr(item, payload)
    temp.replace(docx_path)


def main() -> None:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    document = Document(SOURCE)

    # Complete the existing abbreviation table for terms used in Chapter 4.
    abbreviations = [
        ("BPR-MF", "Bayesian Personalized Ranking - Matrix Factorization", "Xếp hạng cá nhân hóa theo phân rã ma trận"),
        ("GRU", "Gated Recurrent Unit", "Mạng hồi tiếp có cổng"),
        ("KNN", "K-Nearest Neighbors", "K láng giềng gần nhất"),
        ("JWT", "JSON Web Token", "Mã thông báo Web dạng JSON"),
        ("CSV", "Comma-Separated Values", "Dữ liệu phân tách bằng dấu phẩy"),
    ]
    acronym_table = document.tables[0]
    existing_acronyms = {row.cells[0].text.strip() for row in acronym_table.rows}
    for short, english, vietnamese in abbreviations:
        if short in existing_acronyms:
            continue
        row = acronym_table.add_row()
        row.height_rule = WD_ROW_HEIGHT_RULE.AT_LEAST
        row.height = Cm(0.72)
        for cell, value in zip(row.cells, (short, english, vietnamese)):
            cell.text = value
            set_cell_margins(cell, top=70, start=80, bottom=70, end=80)
            cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
            for paragraph in cell.paragraphs:
                paragraph.paragraph_format.space_after = Pt(0)
                paragraph.paragraph_format.line_spacing = 1.05
                for run in paragraph.runs:
                    format_run(run, 10.5)

    # Correct terminology around the existing diagrams without changing their count or placement.
    replacements = [
        ("Học sinh", "Học viên"),
        ("học sinh", "học viên"),
        ("HUSP-SP", "VEDU-PrefixProjection-HUSPM"),
        ("PrefixSpan", "VEDU-PrefixProjection-HUSPM"),
        ("FastAPI", "Python ML Worker"),
        ("React Flow", "giao diện thẻ lộ trình và các bước học"),
    ]
    for old, new in replacements:
        replace_run_text(document, old, new)

    targeted = {
        215: "Triển khai dịch vụ khai thác dữ liệu độc lập bằng Python. Worker dùng PyTorch cho BPR-MF và GRU, scikit-learn cho Item-KNN, đồng thời thực thi VEDU-PrefixProjection-HUSPM và giao tiếp với Backend bằng API nội bộ có token.",
        328: "Trong đề tài, nhóm cài đặt VEDU-PrefixProjection-HUSPM theo chiến lược prefix projection cho chuỗi singleton-itemset. Thuật toán lưu mọi vị trí kết thúc hợp lệ, tính utility theo maximum embedding trong từng chuỗi và dùng Sequence Weighted Utility (SWU) làm cận trên để cắt tỉa. Phạm vi khai thác được giới hạn bởi độ dài mẫu cấu hình; vì vậy báo cáo không đồng nhất implementation này với HUSP-SP hoặc USpan nguyên bản.",
        339: "Hệ thống Vedu được cài theo kiến trúc phân tầng. Frontend React/Vite cung cấp giao diện theo vai trò; Backend NestJS xử lý xác thực, phân quyền và nghiệp vụ; PostgreSQL 16 lưu dữ liệu bền vững; Python ML Worker huấn luyện BPR-MF, GRU, Item-KNN và khai thác HUSPM. Backend gọi worker bằng token nội bộ, còn frontend chỉ truy cập các API được phép. Docker Compose cô lập PostgreSQL và worker trong mạng riêng.",
        346: "Luồng xử lý bắt đầu khi học viên thao tác trên Frontend. Backend xác thực JWT, kiểm tra session, vai trò, quyền sở hữu và quyền học; sau đó ghi sự kiện vào learning.learning_sequence_logs bằng thời gian máy chủ. Worker đọc dữ liệu hợp lệ, chia train/validation/test theo thời gian, huấn luyện BPR-MF và GRU, dựng Item-KNN, khai thác HUSPM rồi lưu artifact và metadata. Recommendation Service kết hợp điểm mô hình với mapping cùng nội dung; Path Planner tiếp tục áp dụng mục tiêu, trình độ, quỹ thời gian và quan hệ tiên quyết để tạo 2–4 phương án. Khi không có lịch sử hoặc mapping hợp lệ, hệ thống trả nguồn CURRICULUM thay vì gắn nhãn mô hình.",
        349: "Ví dụ triển khai: sau khi học viên hoàn thành một bài Office 365 đã được admin ánh xạ đúng với item nguồn, Recommendation Service có thể trả điểm BPR/GRU/HUSPM cho các bài ứng viên. Path Planner chỉ dùng điểm đó để xếp các bài đã thỏa tiên quyết; mô hình không được bỏ qua điều kiện học thuật hoặc quyền thanh toán.",
        350: "HUSPM phát hiện chuỗi có utility cao; BPR-MF và GRU cung cấp tín hiệu phù hợp dài hạn và thứ tự kế tiếp; Item-KNN giữ vai trò đối chứng. Quyết định hiển thị cuối cùng thuộc Recommendation Service và Path Planner. PostgreSQL lưu log, experiment, model registry, recommendation, path set và feedback để bảo đảm truy vết.",
        368: "Cơ sở dữ liệu triển khai hiện có tám schema và 42 bảng sau khi áp dụng vedu_v6.sql cùng platform_upgrade.sql. Hai mươi routine, 39 trigger và bảy view thực hiện kiểm tra vai trò, đồng bộ tiến độ, ghi audit, cấp chứng nhận và phục vụ báo cáo. Các chỉ mục gồm khóa chính, unique index và index truy vấn theo người học, khóa học, thời gian, trạng thái và phiên.",
        373: "ERD mức miền thể hiện tám schema: auth quản lý người dùng, session, PIN và rate limit; lms quản lý khóa, chương, bài, học liệu, metadata sư phạm, Q&A và chứng nhận; enrollment và payment quản lý ghi danh, đơn hàng, giao dịch và yêu cầu MoMo; assessment lưu quiz, câu hỏi, đáp án, attempt và draft; learning lưu log, tiến độ, video state, experiment, mapping, model registry, HUSPM, recommendation và path set; support lưu ticket; system_config lưu cấu hình và audit.",
        420: "Python ML Worker cài VEDU-PrefixProjection-HUSPM cho chuỗi singleton-itemset với độ dài tối đa được cấu hình. Utility của một mẫu trong mỗi chuỗi là embedding có tổng utility lớn nhất; SWU được dùng làm cận trên an toàn. Nếu số ứng viên vượt giới hạn, job thất bại thay vì lưu kết quả dở dang. Mỗi lần chạy lưu dataset hash, code hash, tham số, metric và artifact; Recommendation Service chỉ dùng model đã đăng ký và mapping cùng nội dung.",
        426: "Recommendation Service nhận lịch sử hợp lệ của học viên, gọi model registry và ML Worker để tính điểm. BPR-MF, GRU và HUSPM được chuẩn hóa rồi kết hợp theo trọng số chọn trên validation; Item-KNN không trộn vào hybrid để giữ vai trò đối chứng. Path Planner áp dụng ràng buộc tiên quyết, bài đã hoàn thành, mục tiêu, trình độ, ngữ cảnh nghề nghiệp và ngân sách thời gian. Hệ thống lưu nguồn MODEL_CONSTRAINED hoặc CURRICULUM và không diễn giải điểm xếp hạng thành xác suất học tốt.",
        430: "Lộ trình được hiển thị bằng các thẻ phương án và danh sách bước học. Mỗi phương án nêu tổng số giây dự kiến, số tuần, mức phù hợp ngân sách, lý do chọn bài, tiên quyết, đầu ra và nguồn khuyến nghị. Học viên có thể chọn phương án, tiếp tục bài học và gửi feedback. Giao diện không tự chạy thuật toán; toàn bộ kế hoạch và kiểm tra quyền được thực hiện ở Backend.",
        432: "Chương 3 đã thiết kế Vedu theo kiến trúc phân tầng gồm React/Vite, NestJS, PostgreSQL và Python ML Worker. Mô hình dữ liệu được mở rộng thành 42 bảng thuộc tám schema, bao quát xác thực, LMS, ghi danh, thanh toán, assessment, learning, support và cấu hình hệ thống.",
        433: "learning_sequence_logs là cầu nối giữa nghiệp vụ LMS và pipeline dữ liệu. experiments, mining_runs, high_utility_patterns và model_registry quản lý thí nghiệm; learning_path_recommendations, path_sets và các bảng feedback lưu kết quả phục vụ cá nhân hóa. Thiết kế này là cơ sở cho phần cài đặt được trình bày trong Chương 4.",
    }
    for index, text in targeted.items():
        set_paragraph_text(document.paragraphs[index], text)

    # Update existing figure captions only; no new figure is added.
    caption_updates = {
        "Hình 2.2:  Sơ đồ Use Case phân hệ học viên": "Hình 2.2: Sơ đồ Use Case phân hệ Học viên",
        "Hình 3.1: Sơ đồ kiến trúc tổng thể hệ thống Vedu": "Hình 3.1: Sơ đồ kiến trúc triển khai hệ thống Vedu",
        "Hình 3.4: Sơ đồ ERD cơ sở dữ liệu hệ thống Vedu": "Hình 3.4: Sơ đồ ERD mức miền dữ liệu hệ thống Vedu",
        "Hình 3.5: Sơ đồ luồng khai thác mẫu tuần tự và khuyến nghị lộ trình học tập": "Hình 3.5: Pipeline huấn luyện, HUSPM và sinh lộ trình học tập",
        "Hình 2.2: Sơ đồ Use Case phân hệ học viên\t22": "Hình 2.2: Sơ đồ Use Case phân hệ Học viên\t22",
        "Hình 3.1: Sơ đồ kiến trúc tổng thể hệ thống Vedu\t30": "Hình 3.1: Sơ đồ kiến trúc triển khai hệ thống Vedu\t30",
        "Hình 3.4: Sơ đồ ERD cơ sở dữ liệu hệ thống Vedu\t35": "Hình 3.4: Sơ đồ ERD mức miền dữ liệu hệ thống Vedu\t35",
        "Hình 3.5: Sơ đồ luồng khai thác mẫu tuần tự và khuyến nghị lộ trình học tập\t48": "Hình 3.5: Pipeline huấn luyện, HUSPM và sinh lộ trình học tập\t48",
    }
    for paragraph in document.paragraphs:
        if paragraph.text in caption_updates:
            set_paragraph_text(paragraph, caption_updates[paragraph.text])

    # Extend the existing materialized TOC and list of tables with placeholders.
    toc_reference = document.paragraphs[144]
    toc_rows = [
        ("CHƯƠNG 4: CÀI ĐẶT HỆ THỐNG\t52", "toc 1"),
        ("4.1. Kiến trúc và môi trường cài đặt\t52", "toc 2"),
        ("4.2. Tổ chức mã nguồn và cấu hình\t52", "toc 2"),
        ("4.3. Cài đặt cơ sở dữ liệu PostgreSQL\t53", "toc 2"),
        ("4.4. Cài đặt Backend NestJS\t54", "toc 2"),
        ("4.5. Cài đặt Frontend React\t56", "toc 2"),
        ("4.6. Cài đặt mô hình và HUSPM\t56", "toc 2"),
        ("4.7. Cài đặt chức năng sinh lộ trình\t58", "toc 2"),
        ("4.8. Đóng gói và vận hành bằng Docker\t58", "toc 2"),
        ("4.9. Kiểm chứng cài đặt và giới hạn\t59", "toc 2"),
        ("4.10. Kết luận chương\t60", "toc 2"),
    ]
    for text, style in toc_rows:
        insert_before(toc_reference, text, style)

    list_table_reference = document.paragraphs[175 + len(toc_rows)]
    for text in [
        "Bảng 4.1: Thành phần công nghệ cài đặt\t52",
        "Bảng 4.2: Cấu hình môi trường quan trọng\t53",
        "Bảng 4.3: Các lớp bảo vệ và kiểm tra nghiệp vụ Backend\t54",
        "Bảng 4.4: Thành phần pipeline mô hình và HUSPM\t57",
        "Bảng 4.5: Đối chiếu chức năng STT 6 với phần cài đặt\t59",
    ]:
        insert_before(list_table_reference, text, "Normal")

    document.add_page_break()
    heading(document, 1, "CHƯƠNG 4: CÀI ĐẶT HỆ THỐNG")
    body(document, "Chương này trình bày cách hiện thực hệ thống Vedu từ thiết kế ở Chương 3. Nội dung tập trung vào cấu trúc mã nguồn, cơ sở dữ liệu, Backend, Frontend, pipeline mô hình, HUSPM, cơ chế sinh nhiều lộ trình và quy trình đóng gói bằng Docker. Các mô tả phản ánh mã nguồn đang có trong dự án; những tích hợp phụ thuộc tài khoản bên ngoài hoặc chưa được nghiệm thu được nêu rõ ở cuối chương.")

    heading(document, 2, "4.1. Kiến trúc và môi trường cài đặt")
    body(document, "VEDU được cài theo kiến trúc bốn lớp. Lớp giao diện chạy trên React/Vite; lớp nghiệp vụ dùng NestJS; lớp dữ liệu dùng PostgreSQL; lớp phân tích dùng Python, PyTorch và scikit-learn. Trong môi trường Docker, Nginx phục vụ frontend và chuyển tiếp /api tới Backend. PostgreSQL và ML Worker nằm trong mạng riêng, chỉ Backend trao đổi trực tiếp với hai dịch vụ này.")
    caption(document, "Bảng 4.1: Thành phần công nghệ cài đặt")
    add_table(document,
              ["Thành phần", "Công nghệ", "Vai trò trong hệ thống"],
              [
                  ["Frontend", "React 19, Vite 8, React Router 7, Tailwind CSS 4", "Trang công khai, đăng nhập theo vai trò, phòng học, quiz và dashboard."],
                  ["Backend", "NestJS 12, TypeScript 6, TypeORM/DataSource", "Xác thực, phân quyền, nghiệp vụ LMS, thanh toán, báo cáo và tích hợp mô hình."],
                  ["Cơ sở dữ liệu", "PostgreSQL 16", "Lưu dữ liệu bền vững, giao dịch, ràng buộc, audit và model registry."],
                  ["ML Worker", "Python, PyTorch, NumPy, pandas, SciPy, scikit-learn", "Huấn luyện BPR/GRU, Item-KNN, khai thác HUSPM, replay và inference."],
                  ["Triển khai", "Docker Compose, Nginx, named volumes", "Đóng gói dịch vụ, cô lập mạng và giữ dữ liệu sau khi khởi động lại."],
              ], [3.0, 5.2, 8.0])

    heading(document, 2, "4.2. Tổ chức mã nguồn và cấu hình")
    body(document, "Mã nguồn được tổ chức theo từng trách nhiệm. Thư mục frontend chứa giao diện và lớp gọi API; backend chứa module NestJS; ml-core chứa engine, server và artifact; database/vedu chứa schema, migration và seed; scripts chứa các lệnh nhập dữ liệu, kiểm tra hồi quy và vận hành môi trường phát triển. Cách tách này cho phép thay đổi giao diện hoặc mô hình mà không đưa logic học máy vào request của trình duyệt.")
    bullet(document, "frontend/src/components chứa các màn hình AuthModal, Classroom, QuizView, LearningPaths, Operations và các trang công khai.")
    bullet(document, "backend/src/auth cài xác thực và session; backend/src/platform tập trung các nghiệp vụ mở rộng như media, quiz nâng cao, chứng nhận, MoMo, Q&A, ticket, báo cáo và mô hình.")
    bullet(document, "ml-core/engine.py thực hiện tiền xử lý, huấn luyện, đánh giá, HUSPM và dự đoán; ml-core/server.py cung cấp API nội bộ; ml-core/replay.py chạy lại lịch sử bên ngoài đã ẩn danh.")
    bullet(document, "database/vedu/vedu_v6.sql tạo schema nền; platform_upgrade.sql bổ sung các bảng theo hướng migration lặp lại được và không xóa volume.")
    caption(document, "Bảng 4.2: Cấu hình môi trường quan trọng")
    add_table(document,
              ["Nhóm", "Biến cấu hình", "Nguyên tắc sử dụng"],
              [
                  ["Database", "POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD", "Chỉ lưu trong .env cục bộ; Backend nhận qua biến DB_* khi chạy container."],
                  ["JWT và ML", "JWT_SECRET, ML_INTERNAL_TOKEN", "Dùng chuỗi bí mật riêng; không đặt giá trị thật trong mã nguồn hoặc báo cáo."],
                  ["SMTP", "SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM", "Dùng gửi PIN quên mật khẩu; demo mode chỉ dành cho môi trường local."],
                  ["MoMo", "MOMO_PARTNER_CODE, MOMO_ACCESS_KEY, MOMO_SECRET_KEY, MOMO_IPN_URL", "Mặc định sandbox; redirect không tự xác nhận giao dịch thành công."],
                  ["Giải thích ngoài", "PATH_EXPLAIN_PROVIDER, PATH_EXPLAIN_URL, PATH_EXPLAIN_API_KEY", "Mặc định disabled; chỉ gọi gateway khi học viên đồng ý."],
              ], [3.0, 6.2, 7.0])

    heading(document, 2, "4.3. Cài đặt cơ sở dữ liệu PostgreSQL")
    body(document, "Cơ sở dữ liệu sử dụng tám schema: auth, lms, enrollment, payment, assessment, learning, support và system_config. Bản đang chạy có 42 bảng. Nhóm auth quản lý tài khoản, session, token đặt lại mật khẩu và giới hạn request. Nhóm lms lưu khóa, chương, bài, tài nguyên, metadata sư phạm, đồng giảng viên, Q&A và chứng nhận. Nhóm learning giữ log, tiến độ, trạng thái video, thí nghiệm, HUSPM, model registry, recommendation và path set.")
    body(document, "Các khóa ngoại ghép bảo vệ quan hệ course–lesson và quiz–question–answer. Trigger kiểm tra vai trò STUDENT/TEACHER trước khi ghi dữ liệu nghiệp vụ, đồng bộ lesson progress từ event, cập nhật trạng thái thanh toán và lưu audit. Dữ liệu lịch sử như payment, quiz attempt, learning event và kết quả mô hình không bị xóa dây chuyền; khóa học, bài học và quiz sử dụng trạng thái hoặc soft delete.")
    body(document, "Docker gắn named volume vedu_postgres_data vào /var/lib/postgresql/data. Các file SQL chỉ khởi tạo database mới; dịch vụ demo-seed áp dụng lại migration cộng thêm cho volume đã tồn tại. Quy trình này tránh khắc phục lỗi bằng cách xóa dữ liệu. TypeORM đặt synchronize=false để schema sản xuất không bị tự động thay đổi theo entity.")

    heading(document, 2, "4.4. Cài đặt Backend NestJS")
    heading(document, 3, "4.4.1. Xác thực, session và phân quyền")
    body(document, "Người dùng đăng nhập bằng username tại đúng cổng vai trò. Backend kiểm tra mật khẩu băm bcrypt, trạng thái tài khoản và expectedRole trước khi cấp access token cùng refresh token. Access token có thời hạn 259.200 giây và chứa sessionId. JwtAuthGuard kiểm tra chữ ký, user đang hoạt động và session chưa bị thu hồi; vì vậy logout, đổi mật khẩu, khóa tài khoản hoặc thu hồi phiên làm token mất hiệu lực ngay.")
    body(document, "Refresh token có jti và chỉ lưu bản băm tại auth.user_sessions. Khi refresh, hệ thống thực hiện rotation và thay hash trong cùng session. Quên mật khẩu áp dụng cho học viên và giảng viên; PIN sáu chữ số được băm trước khi lưu, hết hạn sau 900 giây và bị giới hạn số lần thử. Cổng quản trị không hiển thị quên mật khẩu.")
    caption(document, "Bảng 4.3: Các lớp bảo vệ và kiểm tra nghiệp vụ Backend")
    add_table(document,
              ["Lớp kiểm tra", "Nhiệm vụ", "Ví dụ"],
              [
                  ["JwtAuthGuard", "Xác thực JWT, user và session", "Từ chối token của phiên đã revoke."],
                  ["ApiPolicyGuard", "Chặn controller cũ và áp dụng role/policy", "Học viên không đọc answer key hoặc sửa PAID."],
                  ["AuthRateGuard", "Giới hạn login, quên mật khẩu và nhập PIN", "Giảm dò mật khẩu và tạo request hàng loạt."],
                  ["AccessService", "Kiểm tra enrollment, thanh toán, guest quota và lesson gate", "Khóa trả phí chỉ mở sau order PAID."],
                  ["Ownership check", "Giới hạn teacher theo owner hoặc phân công", "Giảng viên không sửa khóa ngoài phạm vi."],
              ], [3.4, 6.0, 6.8])

    heading(document, 3, "4.4.2. Khóa học, học liệu và tiến độ")
    body(document, "CoursesService cung cấp catalog công khai, tìm kiếm theo tên, chủ đề và giảng viên. Giảng viên tạo khóa nháp, quản lý chương, bài, thứ tự, trạng thái công bố và tài nguyên. File PDF/MP4 được lưu trong media volume; Backend phát signed ticket ngắn hạn và kiểm tra quyền trước khi stream. MP4 hỗ trợ HTTP byte range; duration được đo bằng ffprobe trong image Docker.")
    body(document, "Classroom gửi heartbeat định kỳ khi video thực sự phát. Backend dùng server-clock, watch session, receipt idempotent và watched ranges để cộng số giây hợp lý; tua đến vị trí mới không được tính như xem liên tục. video_state giữ vị trí cuối, tốc độ phát và duration để khôi phục sau reload. Hoàn thành tài liệu, bài học và quiz tạo learning event có eventUuid chống ghi trùng.")

    heading(document, 3, "4.4.3. Quiz và chứng nhận")
    body(document, "ExamService tạo attempt theo quyền học, giới hạn số lượt và trả deadline tính từ server. Draft đáp án được lưu riêng để khôi phục. Khi nộp, Backend khóa attempt trong transaction, kiểm tra câu hỏi thuộc quiz, chuẩn hóa tập answerId và chấm exact set đối với multiple choice. Answer key không được gửi qua API chơi quiz.")
    body(document, "Chứng nhận chỉ được cấp khi học viên có quyền học, hoàn thành toàn bộ bài bắt buộc và đạt điều kiện quiz. Backend sinh PDF tiếng Việt bằng PDFKit, tạo mã tra cứu và cung cấp endpoint verify công khai. Chứng nhận VEDU xác nhận hoàn thành khóa trong ứng dụng, không thay thế chứng chỉ Microsoft hoặc chứng nhận nghề nghiệp.")

    heading(document, 3, "4.4.4. Thanh toán, Q&A, ticket và báo cáo")
    body(document, "MomoService tạo order PENDING, ký HMAC theo hợp đồng Sandbox và lưu momo_requests. IPN kiểm tra chữ ký theo cách timing-safe, partnerCode, orderId, requestId và amount; callback được xử lý idempotent. Redirect từ trình duyệt không tự chuyển order sang PAID. Do nhóm chưa có khóa Sandbox và URL IPN công khai, adapter đã được cài nhưng chưa nghiệm thu giao dịch với gateway.")
    body(document, "Admin có thể phân công hoặc gỡ đồng giảng viên. Course Q&A và ticket hỗ trợ được lưu thành chuỗi message có tác giả và vai trò. Ticket hỗ trợ phân công người xử lý và các trạng thái OPEN, IN_PROGRESS, RESOLVED, CLOSED. Báo cáo cho phép lọc khóa và khoảng ngày; teacher chỉ thấy khóa có quyền, còn admin thấy toàn hệ thống. CSV thêm UTF-8 BOM và vô hiệu hóa tiền tố có thể tạo công thức khi mở bằng Excel.")

    heading(document, 2, "4.5. Cài đặt Frontend React")
    heading(document, 3, "4.5.1. Route công khai và route theo vai trò")
    body(document, "React Router khai báo route cho trang chủ, catalog, chi tiết khóa, hỗ trợ, checkout và tra cứu chứng nhận. Ba cổng /student/login, /teacher/login và /admin/login truyền expectedRole khác nhau. Sau khi đăng nhập, hệ thống điều hướng lần lượt đến /student, /teacher hoặc /admin; ProtectedPortal kiểm tra lại role trước khi render. Các route phòng học và quiz chỉ chấp nhận STUDENT.")
    heading(document, 3, "4.5.2. Màn hình học viên")
    body(document, "Trang chủ là màn hình mặc định của học viên, có banner VEDU Learning Management System, tìm kiếm, chủ đề động và slider khóa học. Học viên thành viên có thể ghi danh, checkout, mở phòng học, xem PDF/video, làm quiz, tải chứng nhận, tham gia Q&A, tạo ticket và quản lý phiên. Tài khoản khách chỉ được thử tối đa hai khóa và hai bài đầu mỗi khóa; khách không được thi, nhận chứng nhận, thanh toán hoặc dùng gợi ý cá nhân.")
    heading(document, 3, "4.5.3. Màn hình giảng viên và quản trị viên")
    body(document, "Portal dùng thanh điều hướng dọc màu tối và chỉ hiển thị chức năng theo role. Giảng viên quản lý nội dung, học liệu, quiz, roster, sổ điểm, Q&A, báo cáo và metadata phục vụ sinh lộ trình. Quản trị viên quản lý người dùng, phân công, ticket, giao dịch, model experiment, HUSPM, mapping và báo cáo. Việc ẩn menu chỉ hỗ trợ trải nghiệm; Backend vẫn là nơi chặn truy cập khi người dùng nhập URL hoặc gọi API thủ công.")

    heading(document, 2, "4.6. Cài đặt mô hình và HUSPM")
    heading(document, 3, "4.6.1. Nguồn dữ liệu và chia tập")
    body(document, "Worker hỗ trợ hai adapter Kaggle và dữ liệu VEDU REAL. Student Learning Interaction Logs cung cấp thời lượng và điểm quiz; utility được tính từ 1 + thời lượng cắt ngưỡng + điểm chuẩn hóa. E-learning Recommender chỉ chứa click nên mỗi tương tác có utility bằng 1. Dữ liệu được sắp xếp theo thời gian và chia toàn cục 70% train, 15% validation, 15% test. Chỉ train được dùng để học embedding, ma trận KNN và pattern HUSPM.")
    body(document, "Kaggle là nguồn dữ liệu bên ngoài, không được ghi thành lịch sử học viên VEDU. Replay dùng năm lịch sử test đủ điều kiện đầu tiên, ẩn danh mã user và chỉ dùng tương tác trước target. Với dữ liệu VEDU, pipeline loại khách và tài khoản kiểm thử; ngưỡng kỹ thuật tối thiểu 30 event, ba user và ba item chỉ giúp ngăn job vô nghĩa, không đủ để kết luận chất lượng nghiên cứu.")
    heading(document, 3, "4.6.2. BPR-MF, GRU và Item-KNN")
    body(document, "BPR-MF học embedding user–item bằng loss cặp ưu tiên. Với dataset năm module bị bão hòa, cặp ưu tiên được xây từ utility trung bình chỉ trong train; hạn chế này được lưu trong manifest. GRU nhận tối đa 20 item trước target và tối ưu cross-entropy cho bài kế tiếp. Item-KNN dùng cosine NearestNeighbors trên ma trận item–user của train và giữ vai trò mô hình đối chứng ngoài từ scikit-learn.")
    body(document, "Validation chọn checkpoint BPR/GRU và trọng số blend. Test chỉ dùng để đo Recall, MRR, NDCG và catalog coverage. Báo cáo lưu thêm test_all_targets, trong đó target cold-start được tính là miss. Trọng số hybrid không được điều chỉnh theo test. Điểm chuẩn hóa 0–1 dùng để xếp hạng, không phải xác suất người học đạt kết quả tốt.")
    heading(document, 3, "4.6.3. VEDU-PrefixProjection-HUSPM")
    body(document, "Mỗi lịch sử train được chuyển thành chuỗi các cặp item–utility, tối đa 100 tương tác cuối. Thuật toán mở rộng prefix theo thứ tự, lưu mọi vị trí kết thúc khớp và utility embedding tốt nhất tại từng vị trí. Utility của pattern trong một chuỗi là giá trị maximum embedding; utility toàn tập là tổng giá trị lớn nhất của các chuỗi chứa pattern. Support là tỷ lệ chuỗi chứa mẫu.")
    body(document, "SWU cộng tổng utility của các chuỗi chứa prefix và được dùng làm cận trên. Prefix bị loại khi không đạt min_support hoặc SWU thấp hơn min_utility. Mặc định min_support là 0,02, min_utility bằng 0,01 tổng utility và max_length bằng 3. Implementation xử lý singleton-itemset và giới hạn độ dài; tên sử dụng trong báo cáo là VEDU-PrefixProjection-HUSPM, không phải HUSP-SP nguyên bản.")
    caption(document, "Bảng 4.4: Thành phần pipeline mô hình và HUSPM")
    add_table(document,
              ["Thành phần", "Đầu vào", "Đầu ra lưu trữ"],
              [
                  ["Adapter", "CSV Kaggle hoặc event VEDU REAL", "DataFrame chuẩn user, item, time, utility và source hash."],
                  ["BPR-MF", "Cặp ưu tiên chỉ từ train", "Embedding user/item trong models.pt."],
                  ["GRU", "Cửa sổ tối đa 20 item", "Checkpoint next-item trong models.pt."],
                  ["Item-KNN", "Ma trận item–user train", "Ma trận cosine knn.npy."],
                  ["HUSPM", "Chuỗi item–utility train", "Pattern, support, utility và mining metadata."],
                  ["Experiment", "Config, code và dataset version", "report.json, hashes, metrics và model registry."],
              ], [3.2, 6.0, 7.0])
    heading(document, 3, "4.6.4. Tích hợp kết quả mô hình")
    body(document, "RecommendationService tạo training job, theo dõi trạng thái, lưu report vào experiments/mining_runs và đăng ký artifact. Khi suy luận, lịch sử được ánh xạ sang item cùng nội dung đã được admin duyệt. Với user ngoài dataset, BPR dùng trung bình embedding của các item trong lịch sử như một heuristic fold-in. Nếu worker lỗi, không có history hoặc mapping không hợp lệ, API trả FALLBACK/CURRICULUM để việc học không bị chặn.")

    heading(document, 2, "4.7. Cài đặt chức năng sinh lộ trình")
    body(document, "LearningPathService yêu cầu học viên thành viên đã có quyền vào khóa. Form nhận mục tiêu, trình độ tự khai, ngữ cảnh nghề nghiệp, cách học, số giây mỗi tuần, số tuần và số phương án từ hai đến bốn. Service tải bài đã công bố, metadata sư phạm, tiến độ bền vững và recommendation hiện có trước khi gọi Path Planner.")
    body(document, "Path Planner tạo các biến thể Nền tảng vững, Học cân bằng, Ứng dụng nhanh và Mở rộng chuyên sâu. Thuật toán loại bài đã hoàn thành, bổ sung bao đóng tiên quyết, phát hiện vòng lặp, sau đó sắp xếp topo. Điểm mô hình chỉ thay đổi thứ tự giữa các bài đang cùng đủ điều kiện. Nếu ngân sách thiếu, kế hoạch hiển thị cảnh báo thay vì xóa bài tiên quyết; các phương án có cùng danh sách bài bị loại trùng.")
    body(document, "Mỗi path set lưu snapshot nhu cầu, kế hoạch, evidence, selectedPlanId và feedback. Giải thích mặc định được tạo từ mục tiêu, đầu ra, tiên quyết, thời gian và các thành phần score hiện có. Adapter AI ngoài chỉ diễn đạt lại văn bản khi provider được cấu hình và người học đồng ý; adapter không được thêm lesson, đổi thứ tự, thay quyền hoặc thay score. Mặc định provider bị tắt.")

    heading(document, 2, "4.8. Đóng gói và vận hành bằng Docker")
    body(document, "docker-compose.yml định nghĩa năm service: db, demo-seed, backend, frontend và ml. db dùng postgres:16-alpine và volume bền vững; demo-seed chạy một lần để áp migration/fixture local; backend và frontend chỉ bind vào 127.0.0.1; ml không công bố cổng ra host. Các service liên lạc qua mạng vedu_private và chờ healthcheck trước khi khởi động phụ thuộc.")
    bullet(document, "Tại thư mục dự án, tạo .env từ .env.example và tự điền secret trên máy; không đưa secret lên Git hoặc chèn vào báo cáo.")
    bullet(document, "Chạy docker compose up --build -d để build và khởi động; dùng docker compose ps để kiểm tra health của db, backend và ml.")
    bullet(document, "Mở địa chỉ http://localhost:8080 theo cấu hình mặc định. Khi đổi VEDU_WEB_PORT, CORS_ORIGINS và WEB_URL được truyền đồng bộ cho Backend.")
    bullet(document, "Không dùng docker compose down -v khi chỉ cần khởi động lại, vì -v xóa volume PostgreSQL, media và model artifact.")

    heading(document, 2, "4.9. Kiểm chứng cài đặt và giới hạn")
    caption(document, "Bảng 4.5: Đối chiếu chức năng STT 6 với phần cài đặt")
    add_table(document,
              ["Tiêu chí", "Phần đã cài", "Giới hạn còn lại"],
              [
                  ["Xác thực và phân quyền", "JWT/session, đổi mật khẩu, revoke, role và ownership.", "SMTP thật chưa nghiệm thu."],
                  ["Khóa học và tiến độ", "Nội dung, PDF/MP4, signed media, heartbeat và progress.", "Học liệu cần giảng viên thẩm định; chưa nộp/chấm file dự án."],
                  ["Khuyến nghị", "BPR, GRU, Item-KNN, HUSPM, inference và 2–4 path.", "Cần 3–5 seed, paired significance và dữ liệu VEDU thật."],
                  ["Thanh toán", "Order, payment gate và MoMo Sandbox adapter.", "Chưa có khóa Sandbox/IPN public và đối soát/refund."],
                  ["Quiz/chứng nhận", "Draft, deadline, multiple answer, PDF và verify.", "Chưa có lịch thi/giám sát/thu hồi chứng nhận nâng cao."],
                  ["Tương tác/hỗ trợ", "Phân công, Q&A, ticket và workflow trạng thái.", "Chưa realtime, SLA, CSAT và thông báo."],
                  ["Báo cáo", "Lọc theo khóa/ngày và xuất CSV theo quyền.", "Chưa có Excel/PDF nhiều sheet và tác vụ xuất nền."],
                  ["Triển khai", "Docker Compose, healthcheck và volume bền vững.", "Chưa có CI/CD, HTTPS public, load/security test và diễn tập backup."],
              ], [3.2, 7.0, 6.0])
    body(document, "Ba bộ bằng chứng đã lưu gồm 54 kiểm tra nghiệp vụ, 9 kiểm tra phân công/suy luận mô hình và 41 kiểm tra học liệu/lộ trình. Ngoài ra, planner có 10 kiểm tra bất biến và HUSPM có 14 pattern khớp phép duyệt exhaustive. Các bộ này chứng minh những phạm vi cụ thể, không thay thế một test suite toàn hệ thống và không được cộng thành số tiêu chí đã hoàn tất.")
    body(document, "Kết quả seed 42 cho thấy pipeline chạy thật nhưng hybrid chưa vượt BPR trên hai dataset. Dataset recommender còn nhiều cold target. Vì vậy Chương 5 cần thực nghiệm nhiều seed, paired bootstrap, utility sensitivity và báo cáo cả test_all_targets. Hiệu quả dự đoán bài kế tiếp trên dữ liệu ngoài không tự chứng minh lộ trình cải thiện kết quả học tập của người dùng VEDU.")

    heading(document, 2, "4.10. Kết luận chương")
    body(document, "Chương 4 đã mô tả phần cài đặt từ giao diện đến dữ liệu và mô hình. VEDU hiện cung cấp luồng LMS cho ba vai trò, lưu tiến độ bền vững, bảo vệ quyền học, tích hợp quiz, chứng nhận, Q&A, ticket, báo cáo, payment gate và pipeline khuyến nghị. Hai mô hình BPR-MF và GRU được huấn luyện; Item-KNN làm đối chứng; HUSPM được cài theo prefix projection có SWU và maximum embedding. Path Planner kết hợp kết quả mô hình với ràng buộc học thuật để sinh nhiều phương án có giải thích. Các giới hạn về dữ liệu thật, MoMo/SMTP, đánh giá nhiều seed và triển khai HTTPS được chuyển sang phạm vi thực nghiệm và hoàn thiện tiếp theo.")

    # Keep body typography consistent for newly added content.
    for paragraph in document.paragraphs:
        if paragraph.style and paragraph.style.name in {"Body Text", "List Paragraph"}:
            for run in paragraph.runs:
                if run.font.name is None or paragraph.text.startswith("CHƯƠNG 4"):
                    format_run(run, 13, run.bold)

    document.save(OUTPUT)
    replace_media(OUTPUT)
    print(OUTPUT)


if __name__ == "__main__":
    main()
