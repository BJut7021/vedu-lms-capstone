from pathlib import Path
from docx import Document
from docx.enum.section import WD_SECTION_START
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.shared import Cm, Pt, RGBColor
from docx.oxml import OxmlElement
from docx.oxml.ns import qn


SOURCE = Path(r"C:\2025-2026_Dai_Hoc\hk1-2026-namcuoi\CNTT_KLCN_260_EDU\work\CNTT-KLCN260-EDU-4Chuong.docx")
OUT_DIR = Path(r"C:\Project\vedu-lms-capstone\deliverables\reports")
OUTPUT = OUT_DIR / "CNTT-KLCN260-EDU-5Chuong-HoanChinh.docx"
EXP_DIR = Path(r"C:\Project\vedu-lms-capstone\docs\experiments\2026-11-03-local")


def set_cell_shading(cell, fill):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = tc_pr.find(qn("w:shd"))
    if shd is None:
        shd = OxmlElement("w:shd")
        tc_pr.append(shd)
    shd.set(qn("w:fill"), fill)


def set_repeat_table_header(row):
    tr_pr = row._tr.get_or_add_trPr()
    tbl_header = OxmlElement("w:tblHeader")
    tbl_header.set(qn("w:val"), "true")
    tr_pr.append(tbl_header)


def keep_with_next(paragraph):
    p_pr = paragraph._p.get_or_add_pPr()
    keep = OxmlElement("w:keepNext")
    p_pr.append(keep)


def format_run(run, size=13, bold=False, italic=False, color=None):
    run.font.name = "Times New Roman"
    run._element.rPr.rFonts.set(qn("w:eastAsia"), "Times New Roman")
    run.font.size = Pt(size)
    run.bold = bold
    run.italic = italic
    if color:
        run.font.color.rgb = RGBColor(*color)


def format_body(paragraph, first_line=True):
    paragraph.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    paragraph.paragraph_format.line_spacing = 1.5
    paragraph.paragraph_format.space_after = Pt(6)
    if first_line:
        paragraph.paragraph_format.first_line_indent = Cm(1)
    for run in paragraph.runs:
        format_run(run, 13)


def add_body(doc, text, first_line=True):
    p = doc.add_paragraph(text, style="Body Text")
    format_body(p, first_line=first_line)
    return p


def add_bullet(doc, text):
    p = doc.add_paragraph(text, style="List Paragraph")
    p.paragraph_format.left_indent = Cm(0.75)
    p.paragraph_format.first_line_indent = Cm(-0.45)
    p.paragraph_format.line_spacing = 1.5
    p.paragraph_format.space_after = Pt(4)
    for run in p.runs:
        format_run(run, 13)
    if p.runs:
        p.runs[0].text = "– " + p.runs[0].text
    return p


def add_heading(doc, text, level):
    p = doc.add_paragraph(text, style=f"Heading {level}")
    keep_with_next(p)
    return p


def add_caption(doc, text):
    p = doc.add_paragraph(text, style="Bang")
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(6)
    p.paragraph_format.space_after = Pt(6)
    for run in p.runs:
        format_run(run, 12, bold=True)
    return p


def add_source_note(doc, text):
    p = doc.add_paragraph(text)
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_after = Pt(6)
    for run in p.runs:
        format_run(run, 10, italic=True, color=(89, 89, 89))
    return p


def add_table(doc, caption, headers, rows, widths=None):
    add_caption(doc, caption)
    table = doc.add_table(rows=1, cols=len(headers))
    table.style = "Table Grid"
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = True
    hdr = table.rows[0]
    set_repeat_table_header(hdr)
    for idx, value in enumerate(headers):
        cell = hdr.cells[idx]
        cell.text = value
        cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
        set_cell_shading(cell, "D9EAF7")
        for p in cell.paragraphs:
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            for r in p.runs:
                format_run(r, 10.5, bold=True)
        if widths:
            cell.width = Cm(widths[idx])
    for row in rows:
        cells = table.add_row().cells
        for idx, value in enumerate(row):
            cells[idx].text = str(value)
            cells[idx].vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
            if widths:
                cells[idx].width = Cm(widths[idx])
            for p in cells[idx].paragraphs:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER if idx > 0 else WD_ALIGN_PARAGRAPH.LEFT
                p.paragraph_format.space_after = Pt(0)
                for r in p.runs:
                    format_run(r, 10.5)
    return table


def replace_paragraph_text(paragraph, text):
    paragraph.text = text
    if paragraph.style.name in ("Body Text", "Normal"):
        format_body(paragraph)
    elif paragraph.style.name == "List Paragraph":
        paragraph.paragraph_format.line_spacing = 1.5
        for run in paragraph.runs:
            format_run(run, 13)


def add_reference(doc, index, text):
    p = doc.add_paragraph()
    p.paragraph_format.left_indent = Cm(0.75)
    p.paragraph_format.first_line_indent = Cm(-0.75)
    p.paragraph_format.line_spacing = 1.2
    p.paragraph_format.space_after = Pt(6)
    run = p.add_run(f"[{index}] {text}")
    format_run(run, 12)
    return p


doc = Document(SOURCE)

for paragraph in doc.paragraphs:
    if "Python Python ML Worker" in paragraph.text:
        replace_paragraph_text(paragraph, paragraph.text.replace("Python Python ML Worker", "Python ML Worker"))

# Hiệu chỉnh các phát biểu cũ hoặc quá mạnh trong Chương 1–4.
replacements = {
    211: "Để giải quyết vấn đề này, đề tài lựa chọn hướng Khai thác mẫu tuần tự hữu ích cao (High-Utility Sequential Pattern Mining - HUSPM) trong lĩnh vực khai thác dữ liệu giáo dục. Khác với khai thác mẫu tuần tự chỉ quan tâm tần suất, HUSPM xem xét đồng thời thứ tự và utility của tương tác [3]. Trong VEDU, utility là một hàm kỹ thuật từ điểm quiz, trạng thái hoàn thành và thời lượng đã chuẩn hóa; đây là tín hiệu phục vụ khai phá, không phải bằng chứng nhân quả rằng một chuỗi sẽ làm người học đạt kết quả tốt hơn.",
    215: "Đề tài hướng đến xây dựng một nền tảng LMS có khả năng ghi nhận tiến độ, xếp hạng nội dung và sinh nhiều phương án lộ trình có ràng buộc. Hai mô hình chính là BPR-MF và GRU; Item-KNN, Popularity và Random được dùng đối chứng. HUSPM khai phá mẫu hành vi có utility và cung cấp bằng chứng giải thích. Path Planner chịu trách nhiệm bảo toàn tiên quyết, quyền học và ngân sách thời gian.",
    217: "Mục tiêu 1: Xây dựng pipeline thực nghiệm có thể tái lập cho BPR-MF và GRU; so sánh với Item-KNN, Popularity và Random trên hai bộ dữ liệu, hai giao thức thời gian và năm seed. Cài VEDU-PrefixProjection-HUSPM, kiểm chứng bằng oracle exhaustive trong miền giới hạn và thực hiện ablation để đánh giá đóng góp của HUSPM vào Hybrid.",
    218: "Mục tiêu 2: Thiết kế và cài đặt ứng dụng Web LMS cho học viên, giảng viên và quản trị viên; bao gồm khóa học, học liệu, tiến độ, quiz, chứng nhận, tương tác, hỗ trợ, báo cáo, đăng ký và cổng quyền học trả phí.",
    219: "Mục tiêu 3: Tích hợp Python ML Worker với Backend NestJS và PostgreSQL; dùng điểm mô hình làm tín hiệu xếp hạng cho Path Planner để sinh từ hai đến bốn phương án lộ trình. Mỗi phương án phải giữ tiên quyết, tôn trọng quyền truy cập và kèm giải thích dựa trên dữ liệu, mô hình và ràng buộc đã áp dụng.",
    223: "Về mặt công nghệ và thuật toán: Nghiên cứu và triển khai pipeline xếp hạng nội dung bằng BPR-MF và GRU, sử dụng Item-KNN làm đối chứng ngoài; đồng thời khai phá mẫu hành vi bằng VEDU-PrefixProjection-HUSPM. Dịch vụ ML được đóng gói độc lập bằng Python ML Worker, lưu manifest, model artifact, per-user ranks và kết quả đánh giá để bảo đảm khả năng truy vết.",
    230: "Về xây dựng ứng dụng: Frontend sử dụng React/Vite; Backend nghiệp vụ sử dụng NestJS; dịch vụ mô hình và khai phá dữ liệu sử dụng Python ML Worker; PostgreSQL là nguồn dữ liệu bền vững và nguồn sự thật chính của hệ thống. Docker Compose đóng gói các thành phần và volume giữ database, media cùng model artifact.",
    229: "Về dữ liệu huấn luyện và khai thác: Hai bộ dữ liệu Kaggle được chuẩn hóa qua adapter riêng để phục vụ thí nghiệm ngoại tuyến; chúng không được ghi thành lịch sử học viên VEDU. Event phát sinh trên VEDU được đánh dấu REAL và xử lý qua pipeline độc lập. Mỗi thí nghiệm lưu dataset hash, code version, cấu hình và artifact để truy vết nguồn dữ liệu.",
    240: "Khi sử dụng Vedu LMS, người dùng kỳ vọng hệ thống không chỉ cung cấp một kho lưu trữ tĩnh mà còn giúp theo dõi tiến độ và so sánh các phương án học. Chất lượng khuyến nghị được đánh giá bằng các chỉ số xếp hạng như Recall@3, MRR@3 và NDCG@3; các chỉ số này không được diễn giải thành mức tăng kết quả học tập.",
    252: "Do Vedu LMS chưa có đủ lịch sử người dùng thật ở giai đoạn đầu, nhóm sử dụng hai bộ dữ liệu tương tác công khai trên Kaggle để kiểm tra pipeline và so sánh mô hình. Mỗi nguồn được ánh xạ về schema tối thiểu user–item–time–utility bằng adapter có lưu hash. Dữ liệu bên ngoài không được trộn với event REAL và không được dùng để khẳng định hiệu quả học tập của học viên VEDU.",
    451: "Trong thực nghiệm, ngưỡng min_support và min_utility được cố định theo manifest của từng lần chạy để bảo đảm so sánh công bằng giữa các seed. Nhóm ghi nhận số pattern, thời gian chạy, coverage và metric khuyến nghị. Khảo sát độ nhạy sâu hơn theo ngưỡng là hướng mở rộng, không được xem là kết quả đã hoàn tất trong báo cáo này.",
    453: "3.7.1. Nguyên tắc khuyến nghị",
    454: "Recommendation Service nhận lịch sử hợp lệ của học viên, gọi model registry và ML Worker để tính điểm. BPR-MF, GRU và HUSPM được chuẩn hóa rồi kết hợp theo trọng số chọn trên validation; Item-KNN không trộn vào hybrid để giữ vai trò đối chứng. Path Planner áp dụng ràng buộc tiên quyết, bài đã hoàn thành, mục tiêu, trình độ, ngữ cảnh nghề nghiệp và ngân sách thời gian. Hệ thống lưu nguồn MODEL_CONSTRAINED hoặc CURRICULUM và không diễn giải điểm xếp hạng thành xác suất học tốt.",
    455: "3.7.2. Ví dụ minh họa",
    456: "Giả sử HUSPM tìm được mẫu “Đơn thức → Đa thức → Cộng và trừ đa thức → Nhân đa thức” với utility cao và support đạt ngưỡng. Một học viên hiện có chuỗi “Đơn thức → Đa thức → Cộng và trừ đa thức”; Recommendation có thể chọn “Nhân đa thức” làm ứng viên tiếp theo, đồng thời lưu pattern_id, recommendation_score và reason để Frontend hiển thị và hệ thống có thể giải thích nguồn gốc đề xuất.",
    458: "Lộ trình được hiển thị bằng các thẻ phương án và danh sách bước học. Mỗi phương án nêu tổng thời lượng dự kiến theo phút, số tuần, mức phù hợp ngân sách, lý do chọn bài, tiên quyết, đầu ra và nguồn khuyến nghị. Học viên có thể chọn phương án, tiếp tục bài học và gửi feedback. Giao diện không tự chạy thuật toán; toàn bộ kế hoạch và kiểm tra quyền được thực hiện ở Backend.",
    505: "Worker hỗ trợ hai adapter Kaggle và dữ liệu VEDU REAL. Student Learning Interaction Logs cung cấp thời lượng và điểm quiz; utility được tính từ 1 + min(duration_seconds, 3600)/600 + quiz_score/100. E-learning Recommender chỉ chứa click nên mỗi tương tác có utility bằng 1. Nhóm dùng hai giao thức chia theo thời gian: global_temporal và per_user_temporal. Mỗi cấu hình chạy với năm seed 13, 21, 42, 77 và 101; chỉ tập train được dùng để học embedding, ma trận KNN và pattern HUSPM.",
    518: "LearningPathService yêu cầu học viên thành viên đã có quyền vào khóa. Form nhận mục tiêu, trình độ tự khai, ngữ cảnh nghề nghiệp, cách học, số giờ mỗi tuần, số tuần và số phương án từ hai đến bốn. Service tải bài đã công bố, metadata sư phạm, tiến độ bền vững và recommendation hiện có trước khi gọi Path Planner.",
    530: "Bằng chứng kiểm thử hiện tại gồm 10 backend test suite với 30/30 test đạt, Frontend vượt qua ESLint và build production, hai ML unit test đạt, cùng 14 pattern HUSPM khớp phép duyệt exhaustive trong miền kiểm chứng. Kết quả này chứng minh các trường hợp đã được kiểm thử, không có nghĩa toàn bộ hệ thống không còn lỗi.",
    531: "Thực nghiệm hoàn tất 20 lượt chạy gồm hai dataset, hai giao thức chia dữ liệu và năm seed; tám mô hình/cấu hình tạo 160 dòng kết quả. Trên E-learning Recommender với per_user_temporal, GRU và Hybrid đạt NDCG@3 trung bình 0,3348 ± 0,0072. Trong global_temporal, chỉ 42/383 target được hỗ trợ nên all-target NDCG@3 giảm mạnh. HUSPM có trọng số bằng 0 trong 19/20 lượt; vì vậy báo cáo không kết luận HUSPM cải thiện xếp hạng ổn định.",
    533: "Chương 4 đã mô tả phần cài đặt từ giao diện đến dữ liệu và mô hình. VEDU cung cấp luồng LMS cho ba vai trò, lưu tiến độ bền vững, bảo vệ quyền học, tích hợp quiz, chứng nhận, Q&A, ticket, báo cáo, payment gate và pipeline khuyến nghị. Hai mô hình BPR-MF và GRU được huấn luyện; Item-KNN làm đối chứng; HUSPM được cài theo prefix projection có SWU và maximum embedding. Path Planner kết hợp điểm mô hình với ràng buộc học thuật để sinh nhiều phương án có giải thích. Chương 5 trình bày thiết kế thực nghiệm, kết quả nhiều seed, kiểm thử hệ thống và các giới hạn còn lại.",
}
for idx, text in replacements.items():
    replace_paragraph_text(doc.paragraphs[idx], text)

# Cập nhật bảng đối chiếu STT 6 ở cuối Chương 4.
mapping_rows = [
    ("Xác thực và phân quyền", "JWT/session, đổi mật khẩu, revoke, role và ownership.", "SMTP thật chưa nghiệm thu."),
    ("Khóa học và tiến độ", "Nội dung, PDF/MP4, signed media, heartbeat và progress.", "Học liệu vẫn cần giảng viên thẩm định; chưa hỗ trợ chấm file dự án."),
    ("Khuyến nghị", "BPR, GRU, Item-KNN, HUSPM, inference và 2–4 path; đã chạy 5 seed/2 protocol.", "Chưa có dữ liệu VEDU đủ lớn và đánh giá tác động học tập trên người thật."),
    ("Thanh toán", "Order, payment gate, QR MoMo cá nhân và quản trị viên đối soát.", "Chưa tích hợp MoMo Business/Sandbox IPN và hoàn tiền tự động."),
    ("Quiz/chứng nhận", "Quiz nhiều đáp án, deadline, chấm điểm phía server, PDF và verify.", "Chưa có giám sát thi và thu hồi chứng nhận nâng cao."),
    ("Tương tác/hỗ trợ", "Phân công, Q&A, ticket và workflow trạng thái.", "Chưa realtime, SLA, CSAT và thông báo đa kênh."),
    ("Báo cáo", "Lọc theo khóa/ngày và xuất CSV theo quyền.", "Chưa có xuất Excel/PDF nhiều sheet và tác vụ nền."),
    ("Triển khai", "Docker Compose, healthcheck và volume bền vững.", "Chưa CI/CD, HTTPS public, kiểm thử tải/bảo mật và diễn tập backup."),
]
table = doc.tables[25]
for row_idx, values in enumerate(mapping_rows, start=1):
    for col_idx, value in enumerate(values):
        table.rows[row_idx].cells[col_idx].text = value
        for p in table.rows[row_idx].cells[col_idx].paragraphs:
            for r in p.runs:
                format_run(r, 10.5)

# Chương 5 bắt đầu ở section mới với lề chuẩn A4.
section = doc.add_section(WD_SECTION_START.NEW_PAGE)
section.page_width = Cm(21.0)
section.page_height = Cm(29.7)
section.top_margin = Cm(2.0)
section.bottom_margin = Cm(2.0)
section.left_margin = Cm(3.0)
section.right_margin = Cm(2.0)
section.header.is_linked_to_previous = True
section.footer.is_linked_to_previous = True

add_heading(doc, "CHƯƠNG 5: THỬ NGHIỆM, ĐÁNH GIÁ MÔ HÌNH VÀ TRIỂN KHAI ỨNG DỤNG", 1)
add_body(doc, "Chương này đánh giá hai phần của đề tài: độ tin cậy của sản phẩm phần mềm và chất lượng xếp hạng của pipeline khuyến nghị. Nhóm tách riêng việc kiểm chứng thuật toán HUSPM khỏi việc chứng minh HUSPM cải thiện khuyến nghị. Cách trình bày này tránh đồng nhất một thuật toán chạy đúng với một mô hình tạo ra hiệu quả học tập tốt hơn.")

add_heading(doc, "5.1. Mục tiêu và câu hỏi thực nghiệm", 2)
add_body(doc, "Thực nghiệm được thiết kế để trả lời bốn câu hỏi nghiên cứu sau:")
add_bullet(doc, "RQ1: BPR-MF, GRU và Item-KNN khác nhau như thế nào về chất lượng xếp hạng bước học tiếp theo?")
add_bullet(doc, "RQ2: Kết quả thay đổi ra sao giữa global_temporal và per_user_temporal, đặc biệt khi xuất hiện người dùng hoặc item chưa có lịch sử?")
add_bullet(doc, "RQ3: Thành phần HUSPM có được cài đặt đúng trong miền kiểm chứng và có cải thiện Hybrid ổn định hay không?")
add_bullet(doc, "RQ4: Kết quả có thể tái lập từ dataset hash, seed, manifest, model artifact và per-user ranks hay không?")

add_heading(doc, "5.2. Dữ liệu và nguồn gốc", 2)
add_body(doc, "Nhóm sử dụng hai bộ dữ liệu công khai trên Kaggle. Student Learning Interaction Logs chứa chuỗi tương tác, thời lượng và điểm quiz; E-learning Recommender System Dataset chứa lịch sử click trên danh mục nội dung. Các bộ dữ liệu này chỉ dùng cho thí nghiệm ngoại tuyến. Pipeline lưu hash của tệp nguồn trong research-lock.json và manifest của từng lượt chạy. Vì nhóm chưa thu thập đủ dữ liệu người dùng thật trên VEDU, kết quả không được suy rộng thành mức tăng kết quả học tập của sinh viên.")
add_table(doc, "Bảng 5.1: Nguồn dữ liệu và cách chuẩn hóa", ["Nguồn", "Tín hiệu", "Utility", "Vai trò"], [
    ("Student Learning Interaction Logs", "user, module, time, duration, quiz", "1 + min(duration,3600)/600 + quiz/100", "Kiểm tra pipeline trên danh mục nhỏ"),
    ("E-learning Recommender", "user, item, timestamp/click", "1 cho mỗi click", "Đánh giá xếp hạng trên danh mục lớn hơn"),
    ("VEDU REAL", "event học tập trong PostgreSQL", "Theo cấu hình pipeline", "Nguồn dự kiến khi có đủ log thật"),
], widths=[4.0, 4.0, 4.2, 4.2])
add_source_note(doc, "Nguồn: Nhóm tác giả tổng hợp từ manifest thí nghiệm và hai trang dữ liệu Kaggle [10], [11].")

add_heading(doc, "5.3. Thiết kế thí nghiệm", 2)
add_body(doc, "Hai giao thức chia dữ liệu đều bảo toàn thứ tự thời gian. global_temporal dùng một mốc thời gian chung, gần với tình huống triển khai nhưng dễ tạo cold-start. per_user_temporal giữ phần lịch sử đầu của từng người dùng để huấn luyện và phần cuối để đánh giá; đây là phép đo warm-history. Validation chọn checkpoint và trọng số Hybrid; test chỉ được dùng để báo cáo kết quả.")
add_table(doc, "Bảng 5.2: Cấu hình thực nghiệm", ["Thành phần", "Giá trị"], [
    ("Dataset", "kaggle_logs; kaggle_recommender"),
    ("Giao thức", "global_temporal; per_user_temporal"),
    ("Seed", "13, 21, 42, 77, 101"),
    ("Số lượt chạy", "2 dataset × 2 protocol × 5 seed = 20"),
    ("Cấu hình đánh giá", "BPR, GRU, Item-KNN, Popularity, Random, HUSPM-only, Hybrid, Hybrid bỏ HUSPM"),
    ("Số dòng kết quả", "20 × 8 = 160"),
    ("Bằng chứng", "CSV, per-user ranks, manifest, model hash, notebook có output"),
], widths=[5.0, 11.5])

add_heading(doc, "5.4. Mô hình và chỉ số đánh giá", 2)
add_body(doc, "BPR-MF tối ưu xếp hạng cặp từ phản hồi ngầm [1]. GRU khai thác thứ tự tương tác để dự đoán item tiếp theo, dựa trên hướng tiếp cận khuyến nghị theo phiên [2] nhưng implementation của nhóm là GRU next-item tùy biến, không khẳng định là bản GRU4Rec nguyên gốc. Item-KNN dùng cosine NearestNeighbors của scikit-learn làm mô hình đối chứng ngoài [4], còn Popularity và Random là baseline đơn giản.")
add_body(doc, "Recall@3 đo tỷ lệ target xuất hiện trong ba đề xuất đầu. MRR@3 quan tâm vị trí của target đầu tiên. NDCG@3 giảm trọng số khi target nằm ở vị trí thấp và chuẩn hóa theo thứ hạng lý tưởng [5]. Catalog coverage@10 phản ánh tỷ lệ item được mô hình đưa vào danh sách đề xuất. NDCG không phải phần trăm độ chính xác và không đo trực tiếp mức tăng kiến thức.")

add_heading(doc, "5.5. Kết quả trên Student Learning Interaction Logs", 2)
add_table(doc, "Bảng 5.3: NDCG@3 và Recall@3 trung bình qua năm seed", ["Protocol", "Mô hình", "NDCG@3 (mean ± std)", "Recall@3 (mean ± std)"], [
    ("global_temporal", "BPR-MF", "0,4448 ± 0,0065", "0,6040 ± 0,0111"),
    ("global_temporal", "GRU", "0,3797 ± 0,0096", "0,5336 ± 0,0140"),
    ("global_temporal", "Item-KNN", "0,4291 ± 0,0000", "0,6007 ± 0,0000"),
    ("global_temporal", "Hybrid", "0,3943 ± 0,0215", "0,5537 ± 0,0276"),
    ("per_user_temporal", "BPR-MF", "0,4161 ± 0,0100", "0,5813 ± 0,0132"),
    ("per_user_temporal", "GRU", "0,4216 ± 0,0146", "0,6007 ± 0,0182"),
    ("per_user_temporal", "Item-KNN", "0,4048 ± 0,0000", "0,5567 ± 0,0000"),
    ("per_user_temporal", "Hybrid", "0,4296 ± 0,0168", "0,6133 ± 0,0213"),
], widths=[3.2, 3.2, 5.0, 5.0])
add_body(doc, "Dataset này chỉ có năm item nên Recall@3 của Random và Popularity cao theo cấu trúc bài toán. Vì vậy không nên dùng riêng Recall để kết luận mô hình tốt; nhóm báo cáo đồng thời NDCG, MRR và coverage. Trong global_temporal, BPR đạt NDCG@3 cao nhất trong nhóm mô hình chính. Trong per_user_temporal, Hybrid nhỉnh hơn GRU nhưng chênh lệch không đủ để kết luận HUSPM tạo cải thiện ổn định.")

add_heading(doc, "5.6. Kết quả trên E-learning Recommender", 2)
add_table(doc, "Bảng 5.4: Kết quả trên E-learning Recommender", ["Protocol", "Mô hình", "NDCG@3 hỗ trợ", "NDCG@3 all-target", "Recall@3 hỗ trợ"], [
    ("global_temporal", "BPR-MF", "0,1079 ± 0,0152", "0,0118 ± 0,0017", "0,1238 ± 0,0199"),
    ("global_temporal", "GRU", "0,0638 ± 0,0352", "0,0070 ± 0,0039", "0,0714 ± 0,0412"),
    ("global_temporal", "Item-KNN", "0,0388 ± 0,0000", "0,0043 ± 0,0000", "0,0476 ± 0,0000"),
    ("global_temporal", "Hybrid", "0,0882 ± 0,0193", "0,0097 ± 0,0021", "0,1048 ± 0,0130"),
    ("per_user_temporal", "BPR-MF", "0,1104 ± 0,0110", "0,1091 ± 0,0109", "0,1515 ± 0,0127"),
    ("per_user_temporal", "GRU", "0,3348 ± 0,0071", "0,3307 ± 0,0071", "0,3987 ± 0,0085"),
    ("per_user_temporal", "Item-KNN", "0,1224 ± 0,0000", "0,1209 ± 0,0000", "0,1573 ± 0,0000"),
    ("per_user_temporal", "Hybrid", "0,3348 ± 0,0071", "0,3307 ± 0,0071", "0,3987 ± 0,0085"),
], widths=[3.0, 3.0, 3.6, 3.6, 3.6])
add_body(doc, "Ở per_user_temporal, GRU và Hybrid cùng đạt NDCG@3 0,3348 ± 0,0071 vì validation chọn trọng số HUSPM bằng 0. Ở global_temporal, chỉ 42/383 target có lịch sử và item đã biết; 341 target còn lại được tính là miss trong all-target. Đây là bằng chứng về hạn chế cold-start và coverage, không phải lỗi tính metric. Nhóm công bố cả kết quả trên nhóm được hỗ trợ và toàn bộ target để tránh kết luận quá lạc quan.")

for image_name, caption in [
    ("ndcg-at-3.png", "Hình 5.1: NDCG@3 trung bình theo dataset, giao thức và mô hình"),
    ("recall-at-3.png", "Hình 5.2: Recall@3 trung bình theo dataset, giao thức và mô hình"),
]:
    path = EXP_DIR / image_name
    if path.exists():
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.add_run().add_picture(str(path), width=Cm(15.5))
        add_caption(doc, caption)
        add_source_note(doc, "Nguồn: Kết quả 20 lượt chạy được tổng hợp từ model-results.csv.")

add_heading(doc, "5.7. Đánh giá đóng góp của HUSPM", 2)
add_body(doc, "HUSPM thuộc nhóm khai phá mẫu tuần tự có độ hữu ích cao, trong đó thứ tự và utility cùng được xét [3]. VEDU cài một biến thể prefix projection cho singleton-itemset, giới hạn độ dài ba, dùng SWU để cắt tỉa và maximum embedding để tính utility. Vì implementation không có cấu trúc seqPro/TRSU đầy đủ của HUSP-SP, báo cáo sử dụng tên VEDU-PrefixProjection-HUSPM thay vì tuyên bố cài nguyên bản HUSP-SP.")
add_table(doc, "Bảng 5.5: Kết quả kiểm chứng và ablation HUSPM", ["Bằng chứng", "Kết quả", "Diễn giải"], [
    ("Oracle exhaustive", "14/14 pattern khớp", "Chứng minh tính đúng trong miền kiểm chứng giới hạn"),
    ("Trọng số Hybrid", "19/20 lượt = 0", "Validation thường không chọn HUSPM cho ranking"),
    ("Lượt ngoại lệ", "weight = 0,2", "kaggle_logs/per_user_temporal/seed 21"),
    ("Delta lượt ngoại lệ", "+0,0133 NDCG@3; +0,0367 Recall@3", "Chỉ một seed, không đủ kết luận ổn định"),
], widths=[4.0, 4.0, 8.2])
add_body(doc, "Kết luận phù hợp với dữ liệu là: thuật toán khai phá đã được kiểm chứng trên bộ oracle giới hạn và có thể cung cấp pattern phục vụ giải thích; thí nghiệm hiện tại chưa chứng minh HUSPM cải thiện chất lượng xếp hạng ổn định. Do đó HUSPM không được mô tả như một mô hình học sâu thứ ba và không được dùng để che lấp kết quả ablation âm hoặc bằng không.")

add_heading(doc, "5.8. Kiểm thử chức năng và bảo vệ nghiệp vụ", 2)
add_table(doc, "Bảng 5.6: Bằng chứng kiểm thử ngày 03/11/2026", ["Hạng mục", "Kết quả", "Phạm vi chứng minh"], [
    ("Backend", "10 suite; 30/30 test đạt", "Auth/session, ownership, quiz, payment và nghiệp vụ đã viết test"),
    ("Frontend", "ESLint và production build đạt", "Không có lỗi lint; bundle tạo thành công"),
    ("ML core", "2/2 unit test đạt", "Pipeline và hợp đồng ML đã kiểm tra"),
    ("HUSPM", "14 pattern khớp oracle", "Tính đúng trong miền dữ liệu kiểm chứng"),
    ("Container", "db/backend/ml healthy; frontend chạy", "Khởi động được bằng Docker Compose"),
], widths=[4.0, 4.0, 8.2])
add_body(doc, "Các test không chứng minh hệ thống không còn lỗi. Nhóm vẫn kiểm tra thủ công luồng học viên, giảng viên và quản trị viên; đặc biệt kiểm tra backend không cho gọi API để bỏ qua quyền sở hữu, quyền học trả phí, điều kiện hoàn thành quiz hoặc điều kiện cấp chứng nhận.")

add_heading(doc, "5.9. Triển khai ứng dụng", 2)
add_body(doc, "Ứng dụng được đóng gói bằng Docker Compose gồm PostgreSQL 16, Backend NestJS, Frontend React/Nginx, Python ML Worker và tác vụ seed dữ liệu. Docker volume giữ database, media và model artifact khi dừng/khởi động container [8], [9]. Healthcheck giúp xác định trạng thái service trước khi demo. Phiên bản hiện tại phục vụ local/LAN; nhóm chưa nghiệm thu HTTPS public, CI/CD, kiểm thử tải và diễn tập phục hồi backup.")
add_bullet(doc, "Khởi động: docker compose up --build -d; kiểm tra: docker compose ps.")
add_bullet(doc, "Dừng tạm thời: docker compose -f docker-compose.yml -f docker-compose.team.yml stop.")
add_bullet(doc, "Không dùng down -v trong vận hành thông thường vì tùy chọn -v xóa volume dữ liệu.")

add_heading(doc, "5.10. Đối chiếu với tiêu chí STT 6", 2)
add_body(doc, "Hệ thống đã hiện thực các nhóm chức năng chính trong STT 6: xác thực và phân quyền; khóa học và tiến độ; khuyến nghị lộ trình tích hợp ML/HUSPM; đăng ký và payment gate; quiz và chứng nhận; phân công và tương tác giảng viên; hỗ trợ học viên; báo cáo; kiểm thử và Docker. Những phần chưa nghiệm thu gồm thanh toán tự động qua IPN, SMTP thật, HTTPS public, kiểm thử tải/bảo mật và đánh giá tác động lộ trình trên người dùng thật. Nhóm trình bày các phần này là giới hạn thay vì coi là chức năng hoàn thành.")

add_heading(doc, "5.11. Hạn chế và hướng phát triển", 2)
add_bullet(doc, "Dữ liệu Kaggle giúp kiểm tra pipeline nhưng không đại diện đầy đủ cho học viên VEDU; cần thu thập log REAL có đồng thuận và quy trình ẩn danh.")
add_bullet(doc, "Cold-start làm giảm all-target NDCG trong global_temporal; cần thêm mô hình nội dung, metadata kỹ năng và chiến lược fallback có đánh giá.")
add_bullet(doc, "Năm seed đo biến thiên do khởi tạo, không thay thế nhiều dataset độc lập hoặc kiểm định trên người dùng thật.")
add_bullet(doc, "Các metric offline đo xếp hạng, chưa đo learning gain, mức hài lòng hoặc chất lượng sư phạm của lộ trình.")
add_bullet(doc, "HUSPM chưa tạo cải thiện ranking ổn định; cần nghiên cứu utility có cơ sở sư phạm, độ nhạy ngưỡng và kiểm định paired trên per-user ranks.")
add_bullet(doc, "Cần hoàn thiện MoMo Business/Sandbox IPN, SMTP thật, HTTPS, backup/restore, CI/CD và kiểm thử bảo mật trước khi triển khai production.")

add_heading(doc, "5.12. Kết luận chương", 2)
add_body(doc, "Chương 5 đã trình bày thiết kế thí nghiệm có khả năng tái lập trên hai dataset, hai giao thức và năm seed. GRU đạt kết quả tốt nhất trong phép đo warm-history trên E-learning Recommender, trong khi global_temporal cho thấy hạn chế cold-start nghiêm trọng. HUSPM chạy đúng trong miền oracle giới hạn nhưng chưa chứng minh cải thiện xếp hạng ổn định. Về hệ thống, các luồng LMS chính đã được kiểm thử và đóng gói bằng Docker; các tích hợp ngoài và đánh giá tác động trên người dùng thật vẫn là phạm vi hoàn thiện tiếp theo.")

doc.add_page_break()
add_heading(doc, "TÀI LIỆU THAM KHẢO", 1)
references = [
    "S. Rendle, C. Freudenthaler, Z. Gantner và L. Schmidt-Thieme, “BPR: Bayesian Personalized Ranking from Implicit Feedback,” Proceedings of UAI 2009, tr. 460–469. https://proceedings.mlr.press/r7/rendle09a.html",
    "B. Hidasi, A. Karatzoglou, L. Baltrunas và D. Tikk, “Session-based Recommendations with Recurrent Neural Networks,” ICLR 2016. https://arxiv.org/abs/1511.06939",
    "C. Zhang, Y. Yang, Z. Du, W. Gan và P. S. Yu, “HUSP-SP: Faster Utility Mining on Sequence Data,” ACM Transactions on Knowledge Discovery from Data, vol. 18, no. 1, 2023. https://doi.org/10.1145/3597935",
    "Scikit-learn Developers, “NearestNeighbors,” Scikit-learn Documentation. https://scikit-learn.org/stable/modules/generated/sklearn.neighbors.NearestNeighbors.html",
    "K. Järvelin và J. Kekäläinen, “Cumulated gain-based evaluation of IR techniques,” ACM Transactions on Information Systems, vol. 20, no. 4, tr. 422–446, 2002. https://doi.org/10.1145/582415.582418",
    "PyTorch Contributors, “torch.nn.GRU,” PyTorch Documentation. https://docs.pytorch.org/docs/stable/generated/torch.nn.GRU.html",
    "The PostgreSQL Global Development Group, “PostgreSQL 16 Documentation.” https://www.postgresql.org/docs/16/",
    "Docker Inc., “Docker Compose.” https://docs.docker.com/compose/",
    "NestJS, “Authentication and Authorization,” NestJS Documentation. https://docs.nestjs.com/security/authentication",
    "Ziya07, “Student Learning Interaction Logs Dataset,” Kaggle. https://www.kaggle.com/datasets/ziya07/student-learning-interaction-logs-dataset/data",
    "Nhon Dang Code, “E-learning Recommender System Dataset,” Kaggle. https://www.kaggle.com/datasets/nhondangcode/e-learning-recommender-system-dataset",
    "React Team, “React Documentation.” https://react.dev/",
    "OWASP Foundation, “Application Security Verification Standard.” https://owasp.org/www-project-application-security-verification-standard/",
]
for idx, ref in enumerate(references, start=1):
    add_reference(doc, idx, ref)

# Cập nhật thuộc tính tài liệu.
doc.core_properties.title = "Ứng dụng quản lý và khuyến nghị lộ trình học tập tại VEDU"
doc.core_properties.subject = "Báo cáo khóa luận 5 chương"
doc.core_properties.author = "Phan Minh Thiện; Trương Hoàng Thời; Trần Nguyễn Khánh Duy"
doc.core_properties.comments = "Bản hoàn chỉnh Chương 4 và bổ sung Chương 5 ngày 04/11/2026"

OUT_DIR.mkdir(parents=True, exist_ok=True)
doc.save(OUTPUT)
print(OUTPUT)
