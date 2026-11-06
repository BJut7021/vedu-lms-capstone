from pathlib import Path

from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.table import WD_ALIGN_VERTICAL, WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor


ROOT = Path(r"C:\Project\vedu-lms-capstone")
OUTPUT = ROOT / "deliverables" / "guides" / "VEDU_HuongDan_CapNhat_Code_Git_Docker.docx"


def set_cell_shading(cell, fill):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = tc_pr.find(qn("w:shd"))
    if shd is None:
        shd = OxmlElement("w:shd")
        tc_pr.append(shd)
    shd.set(qn("w:fill"), fill)


def set_cell_border(cell, color="D9D9D9", size="6"):
    tc_pr = cell._tc.get_or_add_tcPr()
    borders = tc_pr.first_child_found_in("w:tcBorders")
    if borders is None:
        borders = OxmlElement("w:tcBorders")
        tc_pr.append(borders)
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        tag = "w:" + edge
        element = borders.find(qn(tag))
        if element is None:
            element = OxmlElement(tag)
            borders.append(element)
        element.set(qn("w:val"), "single")
        element.set(qn("w:sz"), size)
        element.set(qn("w:color"), color)


def set_cell_margins(cell, top=100, start=120, bottom=100, end=120):
    tc = cell._tc
    tc_pr = tc.get_or_add_tcPr()
    tc_mar = tc_pr.first_child_found_in("w:tcMar")
    if tc_mar is None:
        tc_mar = OxmlElement("w:tcMar")
        tc_pr.append(tc_mar)
    for m, value in (("top", top), ("start", start), ("bottom", bottom), ("end", end)):
        node = tc_mar.find(qn("w:" + m))
        if node is None:
            node = OxmlElement("w:" + m)
            tc_mar.append(node)
        node.set(qn("w:w"), str(value))
        node.set(qn("w:type"), "dxa")


def font_run(run, name="Arial", size=11, bold=False, color="000000"):
    run.font.name = name
    run._element.get_or_add_rPr().rFonts.set(qn("w:ascii"), name)
    run._element.get_or_add_rPr().rFonts.set(qn("w:hAnsi"), name)
    run._element.get_or_add_rPr().rFonts.set(qn("w:eastAsia"), name)
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.color.rgb = RGBColor.from_string(color)
    return run


def add_text(doc, text="", bold_lead=None, after=6):
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(after)
    p.paragraph_format.line_spacing = 1.15
    if bold_lead and text.startswith(bold_lead):
        font_run(p.add_run(bold_lead), bold=True)
        font_run(p.add_run(text[len(bold_lead):]))
    else:
        font_run(p.add_run(text))
    return p


def add_bullet(doc, text, level=0):
    p = doc.add_paragraph(style="List Bullet" if level == 0 else "List Bullet 2")
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.line_spacing = 1.1
    font_run(p.add_run(text))
    return p


def add_number(doc, text, level=0):
    p = doc.add_paragraph(style="List Number" if level == 0 else "List Number 2")
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.line_spacing = 1.12
    font_run(p.add_run(text))
    return p


def add_manual_number(doc, number, text):
    p = doc.add_paragraph()
    p.paragraph_format.left_indent = Cm(0.65)
    p.paragraph_format.first_line_indent = Cm(-0.65)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.line_spacing = 1.12
    font_run(p.add_run(f"{number}."), bold=False)
    font_run(p.add_run("  " + text))
    return p


def add_code(doc, lines):
    for i, line in enumerate(lines):
        p = doc.add_paragraph()
        p.paragraph_format.left_indent = Cm(0.65)
        p.paragraph_format.right_indent = Cm(0.35)
        p.paragraph_format.space_before = Pt(1 if i else 4)
        p.paragraph_format.space_after = Pt(1 if i < len(lines) - 1 else 7)
        p.paragraph_format.keep_together = True
        p.paragraph_format.keep_with_next = i < len(lines) - 1
        p_pr = p._p.get_or_add_pPr()
        shd = OxmlElement("w:shd")
        shd.set(qn("w:fill"), "F3F4F6")
        p_pr.append(shd)
        font_run(p.add_run(line), name="Consolas", size=9.5, color="1F2937")


def add_heading(doc, text, level=1):
    p = doc.add_paragraph(style=f"Heading {level}")
    p.paragraph_format.keep_with_next = True
    p.paragraph_format.space_before = Pt(10 if level == 1 else 7)
    p.paragraph_format.space_after = Pt(5)
    for r in p.runs:
        font_run(r, size=15 if level == 1 else 12, bold=True)
    if not p.runs:
        font_run(p.add_run(text), size=15 if level == 1 else 12, bold=True)
    else:
        p.runs[0].text = text
    return p


def add_table(doc, headers, rows, widths=None):
    table = doc.add_table(rows=1, cols=len(headers))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    table.rows[0]._tr.get_or_add_trPr().append(OxmlElement("w:tblHeader"))
    for j, header in enumerate(headers):
        cell = table.rows[0].cells[j]
        set_cell_shading(cell, "1F4E78")
        set_cell_border(cell)
        set_cell_margins(cell)
        cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
        cell.text = ""
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_after = Pt(0)
        font_run(p.add_run(header), size=9.5, bold=True, color="FFFFFF")
        if widths:
            cell.width = Cm(widths[j])
    for i, row in enumerate(rows):
        cells = table.add_row().cells
        for j, value in enumerate(row):
            cell = cells[j]
            set_cell_shading(cell, "F4F8FC" if i % 2 else "FFFFFF")
            set_cell_border(cell)
            set_cell_margins(cell)
            cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
            cell.text = ""
            p = cell.paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.line_spacing = 1.05
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER if j == 0 else WD_ALIGN_PARAGRAPH.LEFT
            font_run(p.add_run(str(value)), size=9.2)
            if widths:
                cell.width = Cm(widths[j])
    doc.add_paragraph().paragraph_format.space_after = Pt(1)
    return table


def add_page_number(paragraph):
    paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = paragraph.add_run("Trang ")
    font_run(run, size=9, color="666666")
    fld_char1 = OxmlElement("w:fldChar")
    fld_char1.set(qn("w:fldCharType"), "begin")
    instr_text = OxmlElement("w:instrText")
    instr_text.set(qn("xml:space"), "preserve")
    instr_text.text = "PAGE"
    fld_char2 = OxmlElement("w:fldChar")
    fld_char2.set(qn("w:fldCharType"), "end")
    run._r.append(fld_char1)
    run._r.append(instr_text)
    run._r.append(fld_char2)


def build():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    doc = Document()
    sec = doc.sections[0]
    sec.top_margin = Cm(1.8)
    sec.bottom_margin = Cm(1.7)
    sec.left_margin = Cm(2.0)
    sec.right_margin = Cm(2.0)

    normal = doc.styles["Normal"]
    normal.font.name = "Arial"
    normal._element.rPr.rFonts.set(qn("w:ascii"), "Arial")
    normal._element.rPr.rFonts.set(qn("w:hAnsi"), "Arial")
    normal._element.rPr.rFonts.set(qn("w:eastAsia"), "Arial")
    normal.font.size = Pt(11)
    normal.paragraph_format.space_after = Pt(6)

    for style_name, size in (("Title", 23), ("Heading 1", 15), ("Heading 2", 12)):
        style = doc.styles[style_name]
        style.font.name = "Arial"
        style._element.rPr.rFonts.set(qn("w:ascii"), "Arial")
        style._element.rPr.rFonts.set(qn("w:hAnsi"), "Arial")
        style._element.rPr.rFonts.set(qn("w:eastAsia"), "Arial")
        style.font.size = Pt(size)
        style.font.bold = True
        style.font.color.rgb = RGBColor(0, 0, 0)
        style_p_pr = style._element.get_or_add_pPr()
        style_border = style_p_pr.find(qn("w:pBdr"))
        if style_border is not None:
            style_p_pr.remove(style_border)

    title = doc.add_paragraph(style="Title")
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    title.paragraph_format.space_before = Pt(24)
    title.paragraph_format.space_after = Pt(14)
    font_run(title.add_run("Hướng dẫn cập nhật code VEDU bằng Git và Docker"), size=23, bold=True)
    title_p_pr = title._p.get_or_add_pPr()
    title_border = title_p_pr.find(qn("w:pBdr"))
    if title_border is not None:
        title_p_pr.remove(title_border)

    subtitle = doc.add_paragraph()
    subtitle.alignment = WD_ALIGN_PARAGRAPH.CENTER
    subtitle.paragraph_format.space_after = Pt(22)
    font_run(subtitle.add_run("Dùng cho nhánh develop và feature thien integrate fe be"), size=12, color="404040")

    add_text(doc, "Tài liệu này giúp thành viên nhóm lấy phiên bản mới nhất từ GitHub, đưa thay đổi của develop vào nhánh cá nhân, cập nhật ứng dụng và dữ liệu Docker mà không xóa dữ liệu đang có. Quy trình ưu tiên an toàn: kiểm tra thay đổi cục bộ, cập nhật develop bằng fast-forward, hợp nhất develop vào feature, sau đó mới xây dựng và kiểm thử ứng dụng.")
    add_text(doc, "Kết luận ngắn: luôn làm việc trên nhánh cá nhân; chỉ dùng develop để nhận bản đã được nhóm gộp; không dùng lệnh xóa dữ liệu hoặc ghi đè lịch sử khi chưa có sự đồng ý của nhóm.", bold_lead="Kết luận ngắn:")

    add_heading(doc, "Trạng thái đã cập nhật ngày 5 tháng 11 năm 2026", 1)
    add_table(
        doc,
        ["Mục", "Trạng thái"],
        [
            ["Commit mới nhất", "6ba98b5  feat  cai tien VEDU"],
            ["Nhánh develop", "Đã cập nhật và trùng origin develop"],
            ["Nhánh cá nhân", "Đã nhận đầy đủ code từ develop và đang là nhánh hiện hành"],
            ["Dữ liệu cục bộ", "Được giữ nguyên; có bước sao lưu trước khi cập nhật Docker"],
        ],
        widths=[4.2, 12.0],
    )
    add_text(doc, "Sau lần cập nhật này, nhánh cá nhân có thể hiện trạng thái ahead so với origin feature vì đã nhận các commit mới từ develop. Đây không phải lỗi. Chỉ push khi muốn đồng bộ nhánh cá nhân lên GitHub.")

    doc.add_page_break()
    add_heading(doc, "Quy trình chuẩn để lấy code mới nhất", 1)
    add_heading(doc, "Bước 1 Mở đúng thư mục trong VS Code", 2)
    add_number(doc, "Mở VS Code.")
    add_number(doc, "Chọn File, Open Folder và mở C:\\Project\\vedu-lms-capstone.")
    add_number(doc, "Chọn Terminal, New Terminal. Kiểm tra dòng lệnh bắt đầu bằng PS C:\\Project\\vedu-lms-capstone>.")
    add_code(doc, [r"cd C:\Project\vedu-lms-capstone"])

    add_heading(doc, "Bước 2 Kiểm tra trước khi kéo code", 2)
    add_code(doc, ["git branch --show-current", "git status"])
    add_text(doc, "Nếu Git báo có file Modified hoặc Untracked do bạn đang sửa code, hãy commit trên nhánh cá nhân trước khi chuyển nhánh. Không nên tiếp tục kéo code khi chưa biết các file đó có cần giữ hay không.")
    add_code(doc, [
        "git add duong-dan-file-da-sua",
        'git commit -m "chore: save local work before sync"',
    ])
    add_text(doc, "Không dùng git add . một cách máy móc vì có thể đưa file tạm, backup hoặc kết quả render vào commit.")

    add_heading(doc, "Bước 3 Cập nhật nhánh develop", 2)
    add_code(doc, [
        "git fetch origin --prune",
        "git switch develop",
        "git pull --ff-only origin develop",
        "git status -sb",
    ])
    add_text(doc, "Kết quả đúng thường có dòng develop...origin/develop và không có chữ behind. Tùy thời điểm, Git có thể báo Already up to date hoặc Fast-forward; cả hai đều bình thường.")

    add_heading(doc, "Bước 4 Đưa code develop vào nhánh cá nhân", 2)
    add_code(doc, [
        "git switch feature/thien-integrate-fe-be",
        "git merge --no-edit origin/develop",
        "git status -sb",
        "git log --oneline --decorate -5",
    ])
    add_text(doc, "Nếu nhánh cá nhân chưa có commit riêng mới, lệnh merge thường chỉ fast-forward. Nếu có commit riêng, Git sẽ tạo merge commit hoặc yêu cầu xử lý xung đột. Không dùng force push để né xung đột.")

    doc.add_page_break()
    add_heading(doc, "Xử lý các tình huống thường gặp", 1)
    add_heading(doc, "Màn hình nhập thông điệp merge xuất hiện", 2)
    add_text(doc, "Nếu Terminal hiện tệp .git/MERGE_MSG với nhiều dòng bắt đầu bằng dấu thăng, Git đang mở Vim để xác nhận thông điệp merge. Giữ nguyên nội dung mặc định và thực hiện:")
    add_code(doc, ["Nhấn Esc", "Gõ :wq", "Nhấn Enter"])
    add_text(doc, "Nếu muốn hủy màn hình mà chưa hoàn tất merge, nhấn Esc, gõ :q! rồi Enter; sau đó kiểm tra bằng git status.")

    add_heading(doc, "Có xung đột merge", 2)
    add_code(doc, [
        "git status",
        "# Mở từng file có chữ both modified và chọn nội dung đúng",
        "git add duong-dan-file-da-xu-ly",
        'git commit -m "merge: sync develop into feature"',
    ])
    add_text(doc, "Nếu chưa chắc cách giải quyết, dừng merge để quay về trạng thái trước đó:")
    add_code(doc, ["git merge --abort"])

    add_heading(doc, "Nhánh develop không kéo được bằng fast forward", 2)
    add_text(doc, "Điều này thường xảy ra khi có commit cục bộ trực tiếp trên develop. Không reset cứng. Hãy chuyển thay đổi cần giữ sang nhánh cá nhân hoặc nhờ thành viên phụ trách Git xem lịch sử trước khi tiếp tục.")
    add_code(doc, [
        "git status",
        "git log --oneline --decorate --graph -12",
        "git rev-list --left-right --count develop...origin/develop",
    ])

    add_heading(doc, "Các lệnh tuyệt đối tránh trong quy trình hằng ngày", 2)
    for item in [
        "git reset --hard vì có thể làm mất thay đổi chưa commit.",
        "git clean -fd vì có thể xóa file báo cáo, học liệu hoặc kết quả thí nghiệm chưa được Git theo dõi.",
        "docker compose down -v vì tùy chọn -v xóa volume database.",
        "force push lên develop vì có thể ghi đè lịch sử chung của nhóm.",
    ]:
        add_bullet(doc, item)

    doc.add_page_break()
    add_heading(doc, "Cập nhật Docker và database sau khi kéo code", 1)
    add_text(doc, "Chạy phần này trên máy đang làm máy chủ chung của nhóm. Script của dự án sẽ khởi động database và mô hình, sao lưu PostgreSQL vào thư mục .work\\backups, xây dựng lại các service, cập nhật dữ liệu mẫu và học liệu, rồi khởi động lại ứng dụng. Volume tài khoản, tiến độ, thanh toán và media được giữ lại.")
    add_code(doc, [
        r"cd C:\Project\vedu-lms-capstone",
        "powershell -NoProfile -ExecutionPolicy Bypass `",
        "  -File .\\scripts\\update-team-server.ps1",
    ])
    add_text(doc, "Không thêm tham số -Pull trong lần này vì code đã được cập nhật thủ công và repository có các file tài liệu chưa được Git theo dõi.")

    add_heading(doc, "Kiểm tra dịch vụ sau khi cập nhật", 2)
    add_code(doc, [
        "docker compose -f docker-compose.yml -f docker-compose.team.yml ps",
        "docker compose -f docker-compose.yml -f docker-compose.team.yml logs --tail 80 backend",
        'Start-Process "http://localhost:8080"',
    ])
    add_text(doc, "Các service chính cần ở trạng thái Up hoặc healthy gồm db, ml, backend và frontend. Nếu nhóm dùng URL mạng nội bộ hoặc VPN, hai thành viên còn lại mở đúng URL chung đã cấu hình thay vì chạy database riêng.")

    add_heading(doc, "Điểm quan trọng về đồng bộ database", 2)
    add_bullet(doc, "Git đồng bộ mã nguồn và các script dữ liệu, không đồng bộ trực tiếp PostgreSQL volume.")
    add_bullet(doc, "Máy chủ chung chạy update-team-server.ps1 để áp dụng dữ liệu chuẩn và giữ dữ liệu giao dịch hiện có.")
    add_bullet(doc, "Hai máy thành viên dùng chung website của máy chủ sẽ thấy thay đổi dữ liệu ngay sau khi tải lại trang.")
    add_bullet(doc, "Nếu mỗi người tự chạy Docker cục bộ, dữ liệu tài khoản, tiến độ và thanh toán sẽ là ba bản khác nhau; chỉ dữ liệu seed từ code có thể giống nhau.")

    doc.add_page_break()
    add_heading(doc, "Kiểm thử nhanh trước khi tiếp tục chỉnh sửa", 1)
    add_table(
        doc,
        ["Phần", "Lệnh", "Kết quả mong đợi"],
        [
            ["Frontend lint", "cd frontend; npm run lint", "Không có lỗi ESLint"],
            ["Frontend build", "npm run build", "Build thành công; cảnh báo chunk lớn không làm build thất bại"],
            ["Backend test", "cd ..\\backend; npm test -- --runInBand --forceExit", "Các test kết thúc ở trạng thái passed"],
            ["Ứng dụng", "Mở http://localhost:8080", "Đăng nhập và mở đúng dashboard theo role"],
        ],
        widths=[3.1, 7.2, 6.2],
    )
    add_text(doc, "Có thể chạy từng nhóm kiểm thử riêng. Khi mục tiêu chỉ là xem giao diện mới, ưu tiên kiểm tra Docker, đăng nhập theo ba role và các màn hình vừa thay đổi; sau đó mới chạy toàn bộ test.")

    add_heading(doc, "Quy trình làm việc sau khi đã đồng bộ", 1)
    add_manual_number(doc, 1, "Luôn xác nhận đang ở feature/thien-integrate-fe-be trước khi sửa code.")
    add_manual_number(doc, 2, "Chỉ sửa đúng phạm vi được phân công và kiểm thử phần liên quan.")
    add_manual_number(doc, 3, "Xem danh sách file trước khi commit.")
    add_code(doc, ["git status", "git diff --stat", "git diff"])
    add_manual_number(doc, 4, "Thêm từng file cần thiết, commit có mô tả rõ và push nhánh cá nhân.")
    add_code(doc, [
        "git add duong-dan-file-1 duong-dan-file-2",
        'git commit -m "feat: mo ta ngan gon thay doi"',
        "git push origin feature/thien-integrate-fe-be",
    ])
    add_manual_number(doc, 5, "Tạo Pull Request từ feature/thien-integrate-fe-be sang develop; thành viên khác xem lại trước khi merge.")
    add_manual_number(doc, 6, "Sau khi Pull Request được merge, lặp lại quy trình cập nhật develop và merge develop vào feature ở đầu tài liệu.")

    add_heading(doc, "Danh sách kiểm tra một phút", 1)
    for item in [
        "Đúng thư mục C:\\Project\\vedu-lms-capstone.",
        "Đã kiểm tra git status và không bỏ quên thay đổi quan trọng.",
        "develop đã pull bằng --ff-only.",
        "feature đã merge origin/develop.",
        "Đang đứng ở feature/thien-integrate-fe-be để tiếp tục sửa.",
        "Máy chủ chung đã chạy update-team-server.ps1.",
        "Docker services đang Up hoặc healthy.",
        "Đã mở ứng dụng và kiểm tra ít nhất một tài khoản theo role liên quan.",
    ]:
        add_bullet(doc, "□ " + item)

    add_heading(doc, "Lệnh tóm tắt dùng hằng ngày", 1)
    add_code(doc, [
        r"cd C:\Project\vedu-lms-capstone",
        "git status",
        "git fetch origin --prune",
        "git switch develop",
        "git pull --ff-only origin develop",
        "git switch feature/thien-integrate-fe-be",
        "git merge --no-edit origin/develop",
        "powershell -NoProfile -ExecutionPolicy Bypass `",
        "  -File .\\scripts\\update-team-server.ps1",
        "docker compose -f docker-compose.yml -f docker-compose.team.yml ps",
    ])

    for section in doc.sections:
        section.footer_distance = Cm(0.8)
        add_page_number(section.footer.paragraphs[0])

    doc.core_properties.title = "Hướng dẫn cập nhật code VEDU bằng Git và Docker"
    doc.core_properties.subject = "Quy trình đồng bộ develop, nhánh cá nhân và dữ liệu Docker"
    doc.core_properties.author = "Nhóm VEDU"
    doc.core_properties.keywords = "VEDU, Git, Docker, develop, feature, hướng dẫn"
    doc.save(OUTPUT)
    print(OUTPUT)


if __name__ == "__main__":
    build()
