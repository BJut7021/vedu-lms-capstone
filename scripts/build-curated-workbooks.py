"""Create new attributable study workbooks; original supplied PDFs remain unmodified."""
import json, pathlib, hashlib, html
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
ROOT=pathlib.Path(__file__).resolve().parents[1]
OUT=ROOT/'data/learning/curated-assets'
pdfmetrics.registerFont(TTFont('Arial',r'C:\Windows\Fonts\arial.ttf'))
pdfmetrics.registerFont(TTFont('ArialBold',r'C:\Windows\Fonts\arialbd.ttf'))
styles=getSampleStyleSheet()
styles.add(ParagraphStyle(name='BodyVI',fontName='Arial',fontSize=10,leading=15,spaceAfter=8,wordWrap='CJK'))
styles.add(ParagraphStyle(name='TitleVI',fontName='ArialBold',fontSize=22,leading=29,textColor=colors.HexColor('#163b71'),spaceAfter=18,wordWrap='CJK'))
styles.add(ParagraphStyle(name='HeadVI',fontName='ArialBold',fontSize=14,leading=20,spaceBefore=12,spaceAfter=10,keepWithNext=True,wordWrap='CJK'))
catalog=json.loads((ROOT/'data/learning/curated-catalog.json').read_text(encoding='utf-8'))
def p(text,style='BodyVI'):
    return Paragraph(html.escape(str(text)).replace('\n','<br/>'),styles[style])
def footer(canvas,doc):
    canvas.setFont('Arial',8); canvas.setFillColor(colors.HexColor('#64748b'))
    canvas.drawString(42,25,'VEDU | Tài liệu tự học bổ sung | Phiên bản 2026.11')
    canvas.drawRightString(A4[0]-42,25,str(doc.page))
for course in catalog['courses']:
    pages=[p(course['name'],'TitleVI'),p('SỔ TỰ HỌC, BÀI TẬP VÀ HƯỚNG DẪN ĐÁNH GIÁ','HeadVI'),p(course['summary']),p('Phạm vi và nguồn','HeadVI'),p('Bản tổng hợp phục vụ khóa tự học VEDU, dựa trên học liệu gốc và các tài liệu tham khảo liệt kê cuối sổ. Các tình huống, câu hỏi và tiêu chí luyện tập là nội dung bổ sung; không phải đề thi chính thức hoặc chứng nhận của đơn vị nguồn. Nội dung cần được giảng viên thẩm định trước khi dùng làm đánh giá chuyên môn chính thức.'),p('Chuẩn bị: '+course['preparation']),p('Cách học và điều kiện hoàn thành','HeadVI'),p('1. Đọc hướng dẫn và đề cương; học các bài theo thứ tự.\n2. Mở tài liệu gốc, làm bài tập, lưu sản phẩm và tự kiểm tra.\n3. Hoàn thành các bài học trên hệ thống và đạt bài kiểm tra kiến thức cuối khóa từ 7/10.\n4. Bài thực hành/tự luận là luyện tập theo tiêu chí; hệ thống chưa tự chấm sản phẩm code, file văn phòng hoặc mô hình. Chứng nhận VEDU xác nhận hoàn thành khóa tự học, không thay thế chứng chỉ MOS, văn bằng hoặc đánh giá thực hành của trường.'),p('Đề cương khóa tự học','HeadVI')]
    for i,l in enumerate(course['lessons'],1): pages.append(p(f'{i}. {l["title"]}'))
    for i,l in enumerate(course['lessons'],1):
        pages.extend([PageBreak(),p(f'Bài {i}. {l["title"]}','TitleVI')])
        for block in l['content'].split('\n\n'): pages.append(p(block))
    pages.extend([PageBreak(),p('Bài tổng hợp và đề tự luận tham khảo','TitleVI'),p('Không phải đề thi chính thức. Dùng để luyện tập và trao đổi với giảng viên; không dùng kết quả tự đánh giá làm điểm chấm tự động.'),p('Nhiệm vụ','HeadVI'),p('Chọn bài thực hành cuối của khóa, trình bày sản phẩm và giải thích một quyết định thiết kế/thao tác quan trọng. Đối chiếu với tài liệu gốc; bổ sung trường hợp biên, kiểm thử và nguồn tham khảo.'),p('Tiêu chí tự đánh giá: kiến thức và đầu ra 4 điểm; quy trình và xử lý ngoại lệ 2; bằng chứng thực hiện 2; giải thích và ghi nguồn 2. Không ghi kết quả thực nghiệm khi chưa thực hiện.'),p('Tài liệu gốc và tham khảo','HeadVI')])
    if course.get('archive'): pages.append(p('Gói học liệu do nhóm cung cấp: '+course['archive']))
    for f in course['files']: pages.append(p('Tài liệu gốc: '+f['name']))
    for r in course.get('references',[]):
        if r.get('url'): pages.extend([p(r.get('title','Nguồn tham khảo')),p(r['url'])])
    pages.append(p('Nguồn gốc nội dung bổ sung: biên tập có hỗ trợ công cụ AI, dựa trên những nguồn đã liệt kê; AI không được dùng làm tài liệu tham khảo khoa học. Chưa có xác nhận thẩm định độc lập. Ngày rà soát liên kết: 01/11/2026.'))
    dest=OUT/f'{course["key"]}-workbook.pdf'
    SimpleDocTemplate(str(dest),pagesize=A4,rightMargin=42,leftMargin=42,topMargin=40,bottomMargin=45,title=course['name'],author='VEDU - học liệu tự học bổ sung').build(pages,onFirstPage=footer,onLaterPages=footer)
    buf=dest.read_bytes(); h=hashlib.sha256(buf).hexdigest();name=f'{h[:8]}-{h[8:12]}-{h[12:16]}-{h[16:20]}-{h[20:32]}.pdf'
    (OUT/name).write_bytes(buf)
    course['workbook']={'file':name,'name':'Sổ tự học, đề cương và bài tập tham khảo','sha256':h}
(ROOT/'data/learning/curated-catalog.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2),encoding='utf-8')
print('Created workbooks:',len(catalog['courses']))
