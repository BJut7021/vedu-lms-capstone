// Original VEDU Vietnamese activities. External works are linked, never copied/rebranded.
const microsoft = (title, url) => ({
  title,
  url,
  provider: "Microsoft Support",
  rights:
    "Liên kết tài liệu gốc; không sao chép/tái cấp phép nội dung Microsoft.",
});
const handbook = {
  title: "Getting Started with LibreOffice 7.5 — PDF",
  url: "https://books.libreoffice.org/en/GS75/GS75-GettingStarted.pdf",
  provider: "The Document Foundation",
  rights:
    "Đọc giấy phép trong sách; chỉ liên kết bản gốc. LibreOffice không có giao diện giống hoàn toàn Microsoft Office.",
};
const learnfree = (title, id) => ({
  title,
  url: `https://www.youtube.com/watch?v=${id}`,
  provider: "LearnFree (GCFGlobal)",
  rights:
    "Video gốc nhúng qua trình phát YouTube; không tải lại, không nhận quyền sở hữu. Giao diện phiên bản 2016/2019 có thể khác Microsoft 365 hiện tại.",
});
const sources = {
  word: microsoft(
    "Basic tasks in Word",
    "https://support.microsoft.com/en-us/word/basic-tasks-in-word",
  ),
  excel: microsoft(
    "Examples of commonly used formulas",
    "https://support.microsoft.com/en-us/excel/examples-of-commonly-used-formulas",
  ),
  ppt: microsoft(
    "Create a presentation in PowerPoint",
    "https://support.microsoft.com/en-us/powerpoint/training/create-a-presentation-in-powerpoint",
  ),
  safety: microsoft(
    "Protect yourself from phishing",
    "https://support.microsoft.com/en-us/security/protect-yourself-from-phishing",
  ),
};
const lesson = (key, title, kind, seconds, content, options = {}) => ({
  key,
  title,
  kind,
  seconds,
  content,
  difficulty: 1,
  core: false,
  requires: [1, 2],
  outcomes: [],
  goals: ["STUDENT", "OFFICE"],
  ...options,
});
const quiz = (text, correct, wrong) => ({
  text,
  type: "SINGLE_CHOICE",
  options: [
    { text: correct, correct: true },
    { text: wrong, correct: false },
  ],
});
export const officeCurriculum = [
  {
    key: "word",
    name: "Word thực hành — Báo cáo và hồ sơ văn phòng",
    topic: "Tin học văn phòng",
    summary:
      "Tạo báo cáo nhóm, biên bản và hồ sơ có cấu trúc. Cần Word bản được cấp phép hoặc Writer miễn phí; các thao tác giao diện có thể khác nhau.",
    source: sources.word,
    video: learnfree("Word: Getting Started", "j-ZAVHk5SaU"),
    lessons: [
      lesson(
        "start",
        "Tạo tài liệu và quản lý phiên bản",
        "CONCEPT",
        900,
        "MỤC TIÊU\nTạo hồ sơ có thể tìm lại, mở lại và phân biệt bản sửa.\n\nTHỰC HIỆN\n1. Tạo thư mục BaoCaoNhom, bên trong có TaiLieuGoc, BanLamViec và BanNop.\n2. Trong Word/Writer tạo tài liệu có tên BaoCaoTienDo_v01, ghi ngày lập, người soạn và mục đích.\n3. Lưu bản làm việc ở định dạng chỉnh sửa; tạo bản xuất PDF riêng để gửi. Đóng rồi mở lại từ thư mục đã lưu.\n4. Sau khi sửa một đoạn, lưu thành v02 và viết một dòng nhật ký thay đổi. Không dùng tên chứa thông tin cá nhân nhạy cảm.\n\nTỰ KIỂM\nBạn có mở được đúng bản v02 mà không dựa vào danh sách Recent? PDF có mở được trên thiết bị khác?\n\nĐẦU RA\nMột thư mục gọn, hai phiên bản chỉnh sửa và một bản PDF. Bài tập được soạn riêng cho VEDU; đọc nguồn gốc bên dưới để đối chiếu thao tác.",
        {
          core: true,
          requires: [],
          outcomes: ["Lưu và mở lại tài liệu; phân biệt file nguồn và PDF"],
        },
      ),
      lesson(
        "styles",
        "Cấu trúc báo cáo bằng Styles",
        "CONCEPT",
        1200,
        "BÀI TOÁN\nBáo cáo 6 trang thường bị lỗi mục lục nếu chỉ tăng cỡ chữ thủ công.\n\nTHỰC HIỆN\n1. Soạn ba phần: Mục tiêu, Kết quả, Kế hoạch tiếp theo. Áp Heading 1 cho các phần và Heading 2 cho hai mục nhỏ trong mỗi phần.\n2. Sửa kiểu Normal một lần để thống nhất nội dung, không bôi đen từng đoạn.\n3. Chèn ngắt trang trước phần Kết quả, đánh số trang và tạo mục lục tự động từ heading.\n4. Thêm một mục nhỏ rồi cập nhật mục lục; kiểm tra số trang.\n\nKIỂM TRA CHẤT LƯỢNG\nMục lục phải thay đổi khi cập nhật; các tiêu đề không được là đoạn Normal chỉ được tô đậm. Dùng Navigation/Outline để quan sát cấu trúc.\n\nĐẦU RA\nBáo cáo có cấu trúc, mục lục và số trang. Chưa cần thiết kế trang bìa cầu kỳ.",
        {
          core: true,
          requires: [1],
          outcomes: ["Dùng heading, mục lục và ngắt trang đúng cấu trúc"],
        },
      ),
      lesson(
        "table",
        "Thực hành: biên bản họp và bảng phân công",
        "PRACTICE",
        1500,
        "TÌNH HUỐNG\nNhóm 3 người họp chuẩn bị ngày hội tuyển dụng. Cần biên bản để người vắng họp vẫn biết trách nhiệm.\n\nDỮ LIỆU BÀI TẬP\nAn: khảo sát 20 doanh nghiệp, hạn 20/10; Bình: làm poster, hạn 21/10; Chi: tổng hợp chi phí, hạn 22/10. Đây là nhân vật hư cấu phục vụ bài tập, không phải học viên thật.\n\nYÊU CẦU\nTạo bảng gồm Công việc, Phụ trách, Hạn, Trạng thái. Bên trên ghi thời gian, thành phần và ba quyết định họp. Cho hàng tiêu đề lặp lại nếu bảng sang trang. Không căn cột bằng phím Space.\n\nTỰ ĐÁNH GIÁ\nMỗi công việc phải có người chịu trách nhiệm và hạn; không có hàng bị cắt khó đọc. Xuất PDF và kiểm tra chữ tiếng Việt.\n\nĐẦU RA\nBienBanHop_v01.docx hoặc .odt và bản PDF.",
        {
          outcomes: ["Lập biên bản có bảng phân công rõ trách nhiệm"],
          goals: ["OFFICE", "STUDENT", "TEACHER"],
        },
      ),
      lesson(
        "review",
        "Ôn tập: sửa năm lỗi thường gặp",
        "REVIEW",
        600,
        "Tạo bản sao tài liệu rồi chủ động tạo 5 lỗi: tiêu đề dùng Normal, xuống trang bằng nhiều Enter, căn bảng bằng Space, ảnh không có mô tả và mục lục chưa cập nhật.\n\nVới mỗi lỗi, ghi ba cột: Dấu hiệu — Cách sửa — Cách kiểm chứng. Sau đó tự sửa trên bản sao. Không sửa/xóa file gốc duy nhất.\n\nĐáp án định hướng: dùng heading; dùng page break; dùng table/tab stop; bổ sung mô tả phù hợp; cập nhật trường mục lục. Việc đánh dấu đã đọc không thay thế đánh giá chất lượng sản phẩm.\n\nĐầu ra: bản sửa và checklist 5 dòng.",
        { outcomes: ["Phát hiện và sửa lỗi cấu trúc tài liệu"] },
      ),
      lesson(
        "video",
        "Video nguồn: làm quen Word",
        "VIDEO",
        282,
        "Xem video LearnFree bằng trình phát bên dưới. Video tiếng Anh; có thể bật phụ đề nếu nguồn hỗ trợ. Sau mỗi thao tác hãy dừng và thử trên tài liệu riêng.\n\nGhi ba vị trí bạn tìm được: thanh lệnh, vùng tài liệu và lệnh lưu. Giao diện trong video thuộc Office 2016/2019, không phải mọi nút đều giống bản đang dùng.\n\nVideo là tài sản của LearnFree/GCFGlobal, không phải bài giảng do VEDU sản xuất. Thời lượng hiển thị trong phòng học được lấy từ trình phát, con số kế hoạch chỉ là ước tính.",
        { requires: [], outcomes: ["Nhận diện các vùng thao tác trong Word"] },
      ),
      lesson(
        "project",
        "Dự án: hồ sơ đề xuất hoạt động nhóm",
        "PROJECT",
        2700,
        "ĐỀ BÀI\nĐề xuất một buổi tập huấn kỹ năng số cho lớp hoặc phòng ban. Người nhận hồ sơ phải quyết định có phê duyệt hay không.\n\nSẢN PHẨM\nBáo cáo 4–6 trang gồm vấn đề, đối tượng, mục tiêu đo được, lịch hoạt động, bảng phân công, chi phí dự kiến và tài liệu tham khảo. Dùng dữ liệu tự tạo hoặc dữ liệu được phép sử dụng; ghi rõ phần giả định.\n\nCHECKLIST TỰ CHẤM /10\nCấu trúc heading/mục lục 2; thông tin đủ để ra quyết định 3; bảng rõ ràng 2; trình bày nhất quán 2; nguồn và phiên bản 1.\n\nCÁCH NỘP\nLưu file chỉnh sửa và PDF trong thư mục học tập của bạn; dùng Q&A để nhờ giảng viên nhận xét. Hiện ứng dụng chưa có chấm tự động sản phẩm Word, không nhận việc bấm hoàn thành là giảng viên đã chấm đạt.",
        {
          outcomes: [
            "Hoàn thành hồ sơ đề xuất 4–6 trang có thể dùng trong công việc",
          ],
          goals: ["STUDENT", "OFFICE", "TEACHER"],
        },
      ),
      lesson(
        "advanced",
        "Mở rộng: nhận xét và kiểm soát bản sửa",
        "PRACTICE",
        1500,
        "Tạo bản sao hồ sơ. Bật theo dõi thay đổi, sửa hai đoạn và thêm một nhận xét yêu cầu làm rõ ngân sách. Kiểm tra bản hiển thị thay đổi và bản nội dung cuối trước khi chấp nhận/từ chối.\n\nKhông gửi hồ sơ thật hoặc thông tin riêng tư cho người lạ. Trong bài tập, trao đổi bản sao bằng kênh nội bộ đã được phép.\n\nĐầu ra: bảng nhật ký gồm người sửa, lý do và quyết định; một PDF cuối không còn nhận xét nội bộ ngoài ý muốn. Thử mở bằng Writer nếu không có Word, ghi lại điểm khác giao diện.\n\nTự kiểm: bản cuối có vô tình lộ nhận xét không? Người nhận có quyền chỉnh sửa quá mức cần thiết không?",
        {
          difficulty: 3,
          requires: [1, 2, 3],
          outcomes: ["Rà soát và bàn giao tài liệu không lộ nhận xét nội bộ"],
        },
      ),
    ],
    questions: [
      quiz(
        "Muốn mục lục tự cập nhật, cần làm gì?",
        "Dùng heading phù hợp và cập nhật mục lục",
        "Chỉ tăng cỡ chữ tiêu đề",
      ),
      quiz(
        "Cách tạo trang mới ổn định?",
        "Dùng ngắt trang",
        "Nhấn Enter nhiều lần",
      ),
      quiz(
        "Bản gửi để đọc trên nhiều máy nên kèm gì?",
        "PDF đã kiểm tra bố cục",
        "Chỉ ảnh chụp màn hình",
      ),
      quiz(
        "Nhận xét nội bộ trước khi bàn giao nên xử lý thế nào?",
        "Rà soát để tránh lộ thông tin ngoài ý muốn",
        "Bỏ qua vì không ai có thể xem",
      ),
    ],
  },
  {
    key: "excel",
    name: "Excel thực hành — Quản lý chi phí và báo cáo bán hàng",
    topic: "Tin học văn phòng",
    summary:
      "Làm bảng chi phí, công thức có tham chiếu, kiểm tra dữ liệu và báo cáo nhỏ. Có thể thực hành bằng Excel hoặc LibreOffice Calc.",
    source: sources.excel,
    video: learnfree("Excel: Getting Started", "lgIWIPDJuPo"),
    lessons: [
      lesson(
        "start",
        "Dữ liệu dạng bảng và kiểu dữ liệu",
        "CONCEPT",
        900,
        "TẠO BẢNG\nNhập vào A1:D6 các cột: Mã, Mặt hàng, Số lượng, Đơn giá. Năm dòng lần lượt là SP01/Bút/12/5000; SP02/Vở/8/12000; SP03/Giấy/3/65000; SP04/Bìa/10/3000; SP05/Kẹp/5/15000. Các số liệu do VEDU tự tạo cho bài tập, không phải doanh số thật.\n\nNGUYÊN TẮC\nMột hàng là một bản ghi, một cột là một thuộc tính. Không gộp ô trong vùng dữ liệu. Định dạng tiền để hiển thị, không gõ chữ đồng vào giá trị số.\n\nTHỰC HÀNH\nLọc theo mặt hàng; sắp xếp đơn giá tăng dần và kiểm tra toàn bộ dòng cùng di chuyển. Lưu file gốc trước khi sắp xếp.\n\nĐẦU RA\nBảng 5 dòng có header, số lượng/giá là số và không mất liên kết mã–mặt hàng.",
        {
          core: true,
          requires: [],
          outcomes: ["Tổ chức bảng dữ liệu sạch và đúng kiểu"],
        },
      ),
      lesson(
        "formula",
        "Công thức, SUM và tham chiếu ô",
        "CONCEPT",
        1200,
        "TỪ BẢNG BÀI TRƯỚC\nThêm cột Thành tiền tại E. Nhập =C2*D2 rồi sao chép đến E6. Tổng tại E7 là =SUM(E2:E6). Kết quả tự kiểm lần lượt 60000, 96000, 195000, 30000, 75000; tổng 456000.\n\nTHỬ THAY ĐỔI\nĐổi số lượng Bút từ 12 thành 13. Tổng phải tăng 5000. Sau đó hoàn tác.\n\nTHAM CHIẾU\nGhi tỷ lệ dự phòng 10% ở H1. Dùng =E2*$H$1 rồi sao chép; kiểm tra địa chỉ H1 không dịch. Dấu phân cách hàm có thể khác tùy cài đặt vùng.\n\nĐỪNG LÀM\nKhông thay tổng bằng số gõ tay, không kéo công thức khi chưa kiểm tra hai hàng đầu.\n\nĐẦU RA\nBảng tính tự cập nhật và một ghi chú giải thích tham chiếu tương đối/tuyệt đối.",
        {
          core: true,
          requires: [1],
          outcomes: [
            "Tính đúng tổng 456000 bằng công thức và dùng tham chiếu tuyệt đối",
          ],
        },
      ),
      lesson(
        "practice",
        "Thực hành: theo dõi ngân sách hoạt động",
        "PRACTICE",
        1800,
        "Thêm các cột Ngân sách dự kiến và Chênh lệch vào bảng. Giả định ngân sách từng dòng là 70000, 100000, 200000, 35000, 80000. Tính chênh lệch = ngân sách - thành tiền; dùng IF để ghi Vượt nếu chênh lệch âm, còn lại Trong mức.\n\nThử một trường hợp vượt bằng cách tăng đơn giá Giấy, quan sát cảnh báo rồi khôi phục. Tạo biểu đồ so sánh dự kiến/thực chi có nhãn và đơn vị VND.\n\nĐầu ra: bảng có công thức, trường hợp kiểm thử và một biểu đồ. Không sử dụng biểu đồ 3D để che chênh lệch. Đây là bài tập giả định, không thay cho nghiệp vụ kế toán.\n\nTự kiểm: tổng chênh lệch có bằng tổng dự kiến trừ tổng thực chi không?",
        {
          outcomes: ["Kiểm soát chi phí bằng IF và đối chiếu tổng"],
          goals: ["OFFICE", "SALES", "STUDENT"],
        },
      ),
      lesson(
        "review",
        "Ôn tập: phát hiện lỗi bảng tính",
        "REVIEW",
        600,
        "Tạo bản sao rồi thử: nhập một giá dưới dạng chuỗi; xóa công thức một hàng; đưa tổng vào phạm vi sắp xếp; sao chép công thức dùng H1 không khóa địa chỉ.\n\nVới mỗi lỗi, ghi dấu hiệu và cách phát hiện. Dùng tổng tính lại độc lập để đối chiếu, xem công thức thay vì chỉ nhìn kết quả.\n\nCâu hỏi tự kiểm: một ô hiển thị 0 có chắc dữ liệu gốc bằng 0? Chỉ dựa vào màu ô có đủ phát hiện lỗi không?\n\nĐầu ra: checklist lỗi và bản sửa có công thức kiểm soát.",
        { outcomes: ["Phát hiện lỗi kiểu dữ liệu và tham chiếu"] },
      ),
      lesson(
        "video",
        "Video nguồn: làm quen Excel",
        "VIDEO",
        256,
        "Xem video LearnFree, sau đó tìm workbook, worksheet, formula bar trên máy của bạn. Dừng video để thử thao tác; không chỉ mở video rồi bỏ đó.\n\nTự tạo sheet ChiPhi, đặt tên file rõ ràng và mở lại. Video tiếng Anh, giao diện Office cũ; dùng tài liệu Microsoft hiện tại để đối chiếu nếu nút khác. Video nguồn không phải do VEDU sản xuất.",
        { requires: [], outcomes: ["Phân biệt workbook và worksheet"] },
      ),
      lesson(
        "project",
        "Dự án: báo cáo bán hàng mini có kiểm soát",
        "PROJECT",
        3000,
        "ĐỀ BÀI\nMột quầy văn phòng phẩm cần xem doanh thu của 5 mặt hàng. Từ bảng dữ liệu đã có, tạo sheet BaoCao nêu tổng doanh thu, mặt hàng doanh thu cao nhất và một biểu đồ.\n\nYÊU CẦU\nGiữ sheet DuLieuGoc không sửa; sheet TinhToan chứa công thức; sheet BaoCao chỉ trình bày chỉ số và kết luận. Thử thay một số lượng để chứng minh báo cáo cập nhật. Không suy ra lợi nhuận nếu chưa có giá vốn.\n\nCHECKLIST /10\nCông thức đúng 3; kiểm soát thay đổi 2; biểu đồ rõ 2; kết luận đúng phạm vi dữ liệu 2; ghi nguồn giả định 1.\n\nĐẦU RA\nFile .xlsx hoặc .ods và PDF báo cáo một trang. Hiện chưa có trình chấm file bảng tính tự động; dùng Q&A xin nhận xét của giảng viên.",
        {
          outcomes: [
            "Tạo báo cáo doanh thu một trang, không nhầm doanh thu với lợi nhuận",
          ],
          goals: ["SALES", "OFFICE", "STUDENT"],
        },
      ),
      lesson(
        "advanced",
        "Mở rộng: tổng hợp theo nhóm và PivotTable",
        "PRACTICE",
        1800,
        "Tạo 10 dòng giao dịch giả định, thêm cột Nhóm hàng gồm Viết, Giấy, Phụ kiện. Mỗi dòng có ngày, số lượng và thành tiền. Tạo PivotTable tổng theo nhóm; Calc dùng Data Pivot Table với tên lệnh khác.\n\nĐối chiếu tổng Pivot với SUM của nguồn. Thêm một giao dịch mới, làm mới bảng tổng hợp và kiểm tra vùng dữ liệu có chứa dòng mới không. Không đưa thông tin khách hàng thật vào bài tập.\n\nĐầu ra: bảng tổng hợp kèm hai lần kiểm tra trước/sau thêm dữ liệu.\n\nMở rộng không bắt buộc cho phương án học nhanh; cần hoàn thành bài dữ liệu và công thức trước.",
        {
          difficulty: 3,
          requires: [1, 2, 3],
          outcomes: ["Tổng hợp nhóm và kiểm tra số liệu sau refresh"],
          goals: ["SALES", "OFFICE"],
        },
      ),
    ],
    questions: [
      quiz(
        "Tổng năm mặt hàng ở bài công thức là bao nhiêu?",
        "456000",
        "45600",
      ),
      quiz("Sao chép công thức mà giữ H1 cố định dùng gì?", "$H$1", "H1"),
      quiz(
        "Doanh thu có đồng nghĩa lợi nhuận không?",
        "Không; cần biết chi phí/giá vốn",
        "Có; chỉ cần tổng bán hàng",
      ),
      quiz(
        "Thêm dòng vào nguồn Pivot cần kiểm tra gì?",
        "Vùng nguồn và làm mới bảng tổng hợp",
        "Chỉ đổi màu tiêu đề",
      ),
    ],
  },
  {
    key: "powerpoint",
    name: "PowerPoint thực hành — Thuyết trình dự án rõ ràng",
    topic: "Tin học văn phòng",
    summary:
      "Xây dựng một bài trình bày có thông điệp, biểu đồ và ghi chú nói. Có thể dùng PowerPoint hoặc LibreOffice Impress.",
    source: sources.ppt,
    video: learnfree("PowerPoint: Getting Started", "k6pg4nZS6fA"),
    lessons: [
      lesson(
        "start",
        "Thông điệp và cấu trúc câu chuyện",
        "CONCEPT",
        900,
        "BÀI TOÁN\nBạn có 300 giây để đề xuất một hoạt động cho lớp/phòng ban. Viết một câu duy nhất: người nghe cần hiểu và quyết định điều gì?\n\nLẬP DÀN Ý\nTạo 5 slide: vấn đề; đối tượng; giải pháp; nguồn lực; lời đề nghị. Mỗi slide có tiêu đề thể hiện một ý, không chép toàn bộ báo cáo Word.\n\nTỰ KIỂM\nChỉ đọc tiêu đề 5 slide, người nghe có nắm câu chuyện không? Dữ liệu nào là giả định phải được đánh dấu ngay.\n\nĐẦU RA\nStoryboard năm khung trên giấy hoặc trong file trình bày, chưa cần hiệu ứng.",
        {
          core: true,
          requires: [],
          outcomes: ["Xác định thông điệp và storyboard 5 slide"],
        },
      ),
      lesson(
        "layout",
        "Bố cục, tương phản và nguồn hình ảnh",
        "CONCEPT",
        1200,
        "Tạo một slide mẫu với tiêu đề, vùng nội dung và nguồn. Chọn tối đa hai font có tiếng Việt; kiểm tra cỡ chữ bằng cách xem ở kích thước trình chiếu thực tế.\n\nDùng canh hàng/lưới để đặt ba đối tượng thẳng nhau; giữ khoảng cách nhất quán. Chọn tương phản đủ rõ, không dùng mỗi màu để truyền đạt trạng thái.\n\nThử xuất PDF rồi đọc lại dấu tiếng Việt. Chỉ dùng ảnh do bạn tạo hoặc ảnh có quyền sử dụng; ghi nguồn, không lấy ảnh tìm kiếm bất kỳ rồi coi là miễn phí.\n\nĐầu ra: slide mẫu và một bản lỗi/đã sửa để giải thích lựa chọn thiết kế.",
        {
          core: true,
          requires: [1],
          outcomes: ["Thiết kế bố cục nhất quán và ghi nguồn hình"],
        },
      ),
      lesson(
        "practice",
        "Thực hành: biến bảng số thành thông điệp",
        "PRACTICE",
        1200,
        "DỮ LIỆU GIẢ ĐỊNH\nBa phương án tập huấn A/B/C có số người tham gia 15/30/24 và chi phí 1500000/2400000/2160000 VND.\n\nNHIỆM VỤ\nTính chi phí/người rồi tạo biểu đồ cột để so sánh: 100000/80000/90000 VND. Tiêu đề slide phải nêu thông điệp, không chỉ ghi Biểu đồ. Trục có đơn vị; không cắt trục để phóng đại khác biệt.\n\nTỰ KIỂM\nPhương án B rẻ nhất/người nhưng có phải lựa chọn tốt nhất trong mọi điều kiện không? Nêu thêm giới hạn về ngân sách tổng và sức chứa.\n\nĐầu ra: một slide biểu đồ và một đoạn giải thích 3 câu.",
        {
          outcomes: [
            "Trình bày chỉ số đúng đơn vị và không suy diễn quá dữ liệu",
          ],
          goals: ["TEACHER", "SALES", "STUDENT", "OFFICE"],
        },
      ),
      lesson(
        "review",
        "Ôn tập: giản lược slide quá tải",
        "REVIEW",
        600,
        "Tạo một slide có đoạn văn dài rồi sửa thành một kết luận, ba bằng chứng và nguồn. Chuyển phần cần nói sang speaker notes.\n\nNhờ một người đọc slide trong 10 giây và kể lại thông điệp. Nếu chưa rõ, sửa tiêu đề trước khi thêm hình hoặc hiệu ứng. Đây là kiểm tra giao tiếp nhỏ, không phải đo chất lượng mô hình AI.\n\nĐầu ra: ảnh/bản slide trước và sau, kèm lý do bỏ từng thành phần.",
        { outcomes: ["Giảm tải chữ và làm rõ thông điệp"] },
      ),
      lesson(
        "video",
        "Video nguồn: làm quen PowerPoint",
        "VIDEO",
        303,
        "Xem video LearnFree và nhận diện các vùng slide, thanh lệnh, chế độ trình chiếu. Dừng video để thử thêm, nhân bản và sắp xếp slide trong một bản nháp.\n\nVideo tiếng Anh, trình bày Office phiên bản cũ. Không dùng video này như bằng chứng mọi tính năng Microsoft 365 vẫn có vị trí giống nhau. VEDU chỉ nhúng trình phát gốc, không sở hữu video.",
        {
          requires: [],
          outcomes: ["Thao tác được các chế độ làm việc cơ bản"],
        },
      ),
      lesson(
        "project",
        "Dự án: pitch đề xuất trong 300 giây",
        "PROJECT",
        2700,
        "Xây dựng bài pitch 5–7 slide cho đề xuất tập huấn. Có vấn đề, đối tượng, giải pháp, một biểu đồ, lịch triển khai và quyết định cần xin.\n\nLuyện trình bày bằng đồng hồ 300 giây; ghi speaker notes thay vì đọc slide. Chuẩn bị một câu trả lời về chi phí và một câu về rủi ro.\n\nCHECKLIST /10\nThông điệp 3; bằng chứng/nguồn 2; thiết kế dễ đọc 2; đúng thời gian 2; lời đề nghị rõ 1.\n\nĐầu ra: file chỉnh sửa, PDF và bảng tự nhận xét. Chỉ tự quay video nếu bạn đồng ý, không quay người khác khi chưa được phép. Hiện ứng dụng không chấm tự động kỹ năng thuyết trình; xin giảng viên nhận xét qua Q&A.",
        {
          outcomes: ["Trình bày đề xuất có căn cứ trong 300 giây"],
          goals: ["STUDENT", "TEACHER", "SALES", "OFFICE"],
        },
      ),
      lesson(
        "advanced",
        "Mở rộng: khả năng tiếp cận và bản bàn giao",
        "PRACTICE",
        1200,
        "Thêm mô tả cho hình/biểu đồ, kiểm tra thứ tự đọc, dùng tiêu đề riêng cho mỗi slide. Nếu có công cụ kiểm tra accessibility, xem từng cảnh báo rồi quyết định sửa; không coi hết cảnh báo là tài liệu chắc chắn tiếp cận hoàn hảo.\n\nXuất PDF, kiểm tra font và các liên kết. Chuẩn bị bản không phụ thuộc Internet để thuyết trình.\n\nĐầu ra: checklist bàn giao gồm file nguồn, PDF, nguồn tài nguyên và lưu ý thiết bị. Không phát hành lại tài nguyên bên ngoài khi chưa có quyền.",
        {
          difficulty: 3,
          requires: [1, 2, 3],
          outcomes: ["Bàn giao slide có lưu ý khả năng tiếp cận và offline"],
          goals: ["TEACHER", "OFFICE"],
        },
      ),
    ],
    questions: [
      quiz(
        "Trước khi thiết kế slide cần chốt gì?",
        "Thông điệp và quyết định muốn người nghe đưa ra",
        "Hiệu ứng chuyển slide",
      ),
      quiz("Chi phí/người của phương án B là?", "80000 VND", "2400000 VND"),
      quiz(
        "Nguồn số liệu giả định nên ghi thế nào?",
        "Ghi rõ là dữ liệu bài tập giả định",
        "Gọi là khảo sát học viên thật",
      ),
      quiz(
        "Phần lời nói chi tiết nên đặt đâu?",
        "Speaker notes",
        "Dồn hết lên slide",
      ),
    ],
  },
  {
    key: "digital",
    name: "Kỹ năng số thực hành — Tệp, cộng tác và an toàn email",
    topic: "Kỹ năng số",
    summary:
      "Tổ chức hồ sơ, chia sẻ có kiểm soát, xử lý email và tình huống lừa đảo. Chỉ dùng dữ liệu giả định, không yêu cầu cung cấp mật khẩu hoặc OTP.",
    source: sources.safety,
    lessons: [
      lesson(
        "start",
        "Tổ chức tệp và bản sao lưu",
        "CONCEPT",
        900,
        "Tạo cấu trúc thư mục cho một dự án gồm Nguon, LamViec, BanGiao. Đặt tên file theo nội dung, ngày và phiên bản; tránh đặt tên chứa số giấy tờ cá nhân.\n\nLàm một bản sao vào vị trí khác được phép sử dụng. Thử phục hồi một file bài tập vào thư mục tạm, không xóa dữ liệu thật để thử.\n\nPhân biệt đồng bộ và sao lưu: việc xóa/ghi đè trong thư mục đồng bộ có thể lan sang bản khác. Hãy kiểm tra tính năng lịch sử phiên bản/thùng rác của dịch vụ đang dùng.\n\nĐầu ra: sơ đồ lưu trữ và một biên bản thử phục hồi. Không ghi khóa hoặc mật khẩu vào tài liệu này.",
        {
          core: true,
          requires: [],
          outcomes: ["Tổ chức tệp và thử phục hồi an toàn"],
        },
      ),
      lesson(
        "email",
        "Email công việc và nhận diện phishing",
        "CONCEPT",
        1200,
        "SOẠN EMAIL\nViết email giả định gửi giảng viên xin góp ý báo cáo: tiêu đề rõ, giới thiệu ngắn, yêu cầu cụ thể, hạn mong muốn và tên tệp. Không gửi email thật trong bài tập.\n\nTÌNH HUỐNG\nMột email tự xưng bộ phận IT yêu cầu nhập OTP vào liên kết lạ trong 300 giây. Ghi lại các dấu hiệu cần xác minh: địa chỉ gửi, tên miền đích, yêu cầu bí mật và áp lực thời gian. Không mở liên kết hoặc gửi mã.\n\nXỬ LÝ\nXác minh bằng kênh chính thức đã biết, báo người phụ trách và không chuyển tiếp tệp nguy hiểm. Nếu đã lộ thông tin, làm theo hướng dẫn bảo vệ tài khoản của tổ chức.\n\nĐầu ra: email nháp và checklist đánh giá thông điệp đáng ngờ.",
        {
          core: true,
          requires: [1],
          outcomes: ["Soạn email rõ ràng và biết khi nào cần xác minh"],
        },
      ),
      lesson(
        "practice",
        "Thực hành: ma trận quyền chia sẻ",
        "PRACTICE",
        1200,
        "Cho ba vai trò: người soạn, người góp ý và người nhận bản cuối. Tạo ma trận Ai — Tài nguyên — Quyền — Hạn cần truy cập.\n\nChỉ dùng file bài tập không nhạy cảm. Đọc cài đặt chia sẻ của dịch vụ trước khi tạo link; ưu tiên người nhận xác định thay vì bất kỳ ai có link. Không thay đổi quyền của file thật khi chưa được chủ file cho phép.\n\nTự kiểm: người chỉ cần đọc có được quyền chỉnh sửa không? Nếu link bị chuyển tiếp có rủi ro gì? Khi kết thúc dự án cần rà soát quyền nào?\n\nĐầu ra: ma trận và kế hoạch thu hồi quyền. Với demo không cần thực sự gửi link cho người ngoài.",
        {
          outcomes: ["Thiết kế quyền tối thiểu cho cộng tác"],
          goals: ["OFFICE", "TEACHER", "STUDENT"],
        },
      ),
      lesson(
        "review",
        "Ôn tập: phân loại năm tình huống số",
        "REVIEW",
        600,
        "Phân loại các tình huống thành An toàn có điều kiện / Cần xác minh / Không nên làm: gửi OTP cho người tự xưng hỗ trợ; gửi PDF đã rà soát qua kênh được phép; mở tệp thực thi từ email lạ; dùng cùng mật khẩu cho mọi dịch vụ; khôi phục file bài tập từ bản sao.\n\nGiải thích mỗi lựa chọn bằng một câu. Đáp án định hướng: OTP và tệp thực thi lạ không nên làm; PDF cần đúng quyền/người nhận; dùng lại mật khẩu làm tăng rủi ro; khôi phục bản sao cần kiểm tra nguồn.\n\nKhông đưa thông tin tài khoản thật vào phần trả lời.",
        { outcomes: ["Giải thích lựa chọn thay vì chỉ nhớ đáp án"] },
      ),
      lesson(
        "case",
        "Tình huống: link tài liệu bị gửi nhầm",
        "PRACTICE",
        900,
        "Bạn phát hiện một link tài liệu nhóm được gửi nhầm cho người không tham gia. Lập trình tự xử lý: ngừng phát tán thêm, báo chủ tài nguyên, rà soát quyền, điều chỉnh theo thẩm quyền, kiểm tra lịch sử nếu có và rút kinh nghiệm.\n\nKhông tự xóa dấu vết hoặc truy cập tài khoản người khác. Không hứa thu hồi quyền sẽ xóa mọi bản sao đã tải về.\n\nĐầu ra: sơ đồ quyết định bằng văn bản và một mẫu thông báo nội bộ không chứa dữ liệu nhạy cảm.",
        {
          requires: [1, 2, 3],
          outcomes: ["Xử lý sự cố chia sẻ nhầm đúng thẩm quyền"],
        },
      ),
      lesson(
        "project",
        "Dự án: bộ quy tắc làm việc số cho nhóm",
        "PROJECT",
        1800,
        "Soạn quy tắc một trang cho nhóm 3 người: đặt tên file, lưu bản nguồn, sao lưu, chia sẻ, email, nhận diện liên kết đáng ngờ và xử lý sự cố.\n\nThêm ba tình huống diễn tập bằng dữ liệu hư cấu và kết quả mong đợi. Không cần thao tác trên tài khoản hoặc tài liệu thật của tổ chức.\n\nCHECKLIST /10\nQuy trình rõ 3; quyền tối thiểu 2; khôi phục được 2; nhận diện rủi ro 2; có người chịu trách nhiệm 1.\n\nĐầu ra: quy tắc, ma trận trách nhiệm và biên bản diễn tập. Dùng Q&A xin giảng viên góp ý; hiện chưa có chấm tự động dự án.",
        {
          outcomes: ["Có quy tắc và kịch bản diễn tập dùng được trong nhóm"],
          goals: ["OFFICE", "STUDENT", "TEACHER", "SALES"],
        },
      ),
      lesson(
        "advanced",
        "Mở rộng: tối thiểu hóa dữ liệu và quyền riêng tư",
        "PRACTICE",
        1200,
        "Rà soát biểu mẫu khảo sát giả định. Với từng trường, ghi mục đích thu thập, ai được xem và thời hạn giữ. Loại trường không cần cho mục đích học tập.\n\nThử thay tên bằng mã ẩn danh nhưng lưu ý mã ẩn danh vẫn có thể liên kết lại nếu giữ bảng đối chiếu. Không công khai log học tập có thể nhận diện người.\n\nĐầu ra: biểu mẫu tối giản và kế hoạch xóa/ẩn danh sau nghiên cứu. Đây là bài tập thực hành kỹ năng, không thay thế tư vấn pháp lý hoặc quy định của tổ chức.",
        {
          difficulty: 3,
          requires: [1, 2, 3],
          outcomes: ["Giảm dữ liệu thu thập và có kế hoạch lưu giữ"],
          goals: ["OFFICE", "TEACHER"],
        },
      ),
    ],
    questions: [
      quiz(
        "Người tự xưng IT yêu cầu OTP qua link lạ, nên làm gì?",
        "Không gửi mã; xác minh qua kênh chính thức",
        "Gửi ngay vì có hạn thời gian",
      ),
      quiz(
        "Người chỉ cần đọc bản cuối nên có quyền gì?",
        "Quyền đọc phù hợp phạm vi cần thiết",
        "Quyền sửa mọi file dự án",
      ),
      quiz(
        "Đồng bộ có luôn thay cho sao lưu không?",
        "Không; xóa/ghi đè có thể đồng bộ sang nơi khác",
        "Có, không cần kiểm tra phục hồi",
      ),
      quiz("Thu hồi link có chắc xóa mọi bản đã tải không?", "Không", "Có"),
    ],
  },
];
export function materialSources(course, item) {
  const refs = [course.source];
  if (course.key !== "digital") refs.push(handbook);
  if (item.kind === "VIDEO") refs.push(course.video);
  return refs;
}
