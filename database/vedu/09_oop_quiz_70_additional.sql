-- VEDU OOP - PHASE 1: 70 additional teacher-review questions (4..10 each quiz)
-- THE QUESTIONS ARE ADAPTED/COMPOSED FROM KNOWLEDGE SOURCES, NOT QUOTED ORIGINAL QUESTIONS.
-- SELF-REVIEWED for technical accuracy; adapted questions, not verbatim published question bank.
-- Source URLs in bundled CSV are references for concepts, not origin of wording.
-- No DELETE, no UPDATE to existing questions/attempts. Idempotent on repeated execution.
BEGIN;
DO $oop_70$
DECLARE
  v_course_id bigint;
  v_quiz_id bigint;
  v_question_id bigint;
  v_lesson_id bigint;
  v_spec jsonb;
  v_answer text;
  v_idx int;
BEGIN
  SELECT course_id INTO v_course_id FROM lms.curated_courses WHERE course_key = 'oop';
  IF v_course_id IS NULL THEN RAISE EXCEPTION 'Missing OOP curated course'; END IF;
  FOR v_spec IN SELECT value FROM jsonb_array_elements($quiz_json$
[
  {
    "lessonOrder": 2,
    "questionOrder": 4,
    "text": "Trong C#, từ khóa nào thường dùng để khai báo một lớp?",
    "options": [
      "class",
      "object",
      "namespace",
      "method"
    ],
    "source": "https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/tutorials/oop"
  },
  {
    "lessonOrder": 2,
    "questionOrder": 5,
    "text": "Tính trừu tượng trong OOP giúp điều gì?",
    "options": [
      "Chỉ mô hình hóa đặc điểm và hành vi cần thiết của đối tượng",
      "Bắt buộc công khai mọi trường dữ liệu",
      "Thay thế hoàn toàn kiểu dữ liệu",
      "Ngăn mọi lớp có phương thức"
    ],
    "source": "https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/tutorials/oop"
  },
  {
    "lessonOrder": 2,
    "questionOrder": 6,
    "text": "Đối tượng (object) của một lớp được hiểu đúng là gì?",
    "options": [
      "Một thể hiện được tạo từ định nghĩa lớp",
      "Một kiểu namespace",
      "Một câu lệnh rẽ nhánh",
      "Một đoạn chú thích"
    ],
    "source": "https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/tutorials/oop"
  },
  {
    "lessonOrder": 2,
    "questionOrder": 7,
    "text": "Phát biểu nào đúng về phương thức (method) của lớp?",
    "options": [
      "Mô tả hành vi của đối tượng hoặc lớp",
      "Chỉ chứa kiểu dữ liệu hằng",
      "Là tên thay thế của dự án",
      "Luôn là phương thức static"
    ],
    "source": "https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/tutorials/oop"
  },
  {
    "lessonOrder": 2,
    "questionOrder": 8,
    "text": "Trong C#, cú pháp nào tạo đối tượng của lớp Student?",
    "options": [
      "new Student()",
      "class Student()",
      "using Student()",
      "override Student()"
    ],
    "source": "https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/tutorials/oop"
  },
  {
    "lessonOrder": 2,
    "questionOrder": 9,
    "text": "Lợi ích thường thấy khi chia chương trình thành các lớp có trách nhiệm rõ ràng là gì?",
    "options": [
      "Dễ bảo trì và tái sử dụng hơn",
      "Luôn không cần kiểm thử",
      "Loại bỏ toàn bộ lỗi biên dịch",
      "Đảm bảo không cần bộ nhớ"
    ],
    "source": "https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/tutorials/oop"
  },
  {
    "lessonOrder": 2,
    "questionOrder": 10,
    "text": "Bốn nguyên lý OOP thường được nhắc đến gồm những gì?",
    "options": [
      "Trừu tượng, đóng gói, kế thừa, đa hình",
      "Biến, vòng lặp, mảng, hàm",
      "Nhập, xuất, ép kiểu, điều kiện",
      "GUI, BLL, DAL, DTO"
    ],
    "source": "https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/tutorials/oop"
  },
  {
    "lessonOrder": 3,
    "questionOrder": 4,
    "text": "Từ khóa nào giúp giới hạn thành viên chỉ được truy cập bên trong chính lớp khai báo?",
    "options": [
      "private",
      "public",
      "protected",
      "internal"
    ],
    "source": "https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/object-oriented/"
  },
  {
    "lessonOrder": 3,
    "questionOrder": 5,
    "text": "Một property có get công khai và set riêng tư giúp điều gì?",
    "options": [
      "Cho phép đọc bên ngoài nhưng kiểm soát chỗ thay đổi",
      "Cho phép mọi mã gán tùy ý",
      "Tự động biến lớp thành static",
      "Xóa dữ liệu khi đọc"
    ],
    "source": "https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/object-oriented/"
  },
  {
    "lessonOrder": 3,
    "questionOrder": 6,
    "text": "Tại sao không nên công khai trực tiếp mọi field của đối tượng?",
    "options": [
      "Khó bảo vệ bất biến dữ liệu và thay đổi cài đặt về sau",
      "Làm chương trình không thể biên dịch",
      "Vì C# không cho khai báo field public",
      "Vì field chỉ lưu được số nguyên"
    ],
    "source": "https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/object-oriented/"
  },
  {
    "lessonOrder": 3,
    "questionOrder": 7,
    "text": "Trong một lớp C#, this thường trỏ tới đâu?",
    "options": [
      "Thể hiện hiện tại đang thực hiện phương thức",
      "Lớp cha trực tiếp",
      "Namespace gốc",
      "Toàn bộ đối tượng của ứng dụng"
    ],
    "source": "https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/object-oriented/"
  },
  {
    "lessonOrder": 3,
    "questionOrder": 8,
    "text": "Phương thức public của lớp thường được dùng để làm gì?",
    "options": [
      "Cung cấp thao tác hợp lệ cho mã sử dụng lớp",
      "Ẩn hoàn toàn mọi hành vi",
      "Tự động tạo lớp dẫn xuất",
      "Đổi tên assembly"
    ],
    "source": "https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/object-oriented/"
  },
  {
    "lessonOrder": 3,
    "questionOrder": 9,
    "text": "Thuộc tính nào sau đây phù hợp để giới hạn số dư tài khoản chỉ đọc từ bên ngoài?",
    "options": [
      "public decimal Balance { get; private set; }",
      "public decimal Balance;",
      "public decimal Balance { set; }",
      "private decimal Balance { set; }"
    ],
    "source": "https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/object-oriented/"
  },
  {
    "lessonOrder": 3,
    "questionOrder": 10,
    "text": "Một class C# có thể định nghĩa gì?",
    "options": [
      "Field, property, method và constructor",
      "Chỉ có field",
      "Chỉ có namespace",
      "Chỉ có vòng lặp"
    ],
    "source": "https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/object-oriented/"
  },
  {
    "lessonOrder": 4,
    "questionOrder": 4,
    "text": "Constructor có tham số thường được gọi vào thời điểm nào?",
    "options": [
      "Khi tạo thể hiện phù hợp bằng new",
      "Khi ứng dụng tự đóng",
      "Chỉ khi lớp bị hủy",
      "Khi namespace được import"
    ],
    "source": "https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/types/classes"
  },
  {
    "lessonOrder": 4,
    "questionOrder": 5,
    "text": "Một lớp C# có thể có nhiều constructor không?",
    "options": [
      "Có, nếu danh sách tham số phân biệt được",
      "Không, luôn chỉ một",
      "Chỉ khi là static class",
      "Chỉ khi không có field"
    ],
    "source": "https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/types/classes"
  },
  {
    "lessonOrder": 4,
    "questionOrder": 6,
    "text": "Từ khóa this(...) trong constructor thường dùng để làm gì?",
    "options": [
      "Gọi một constructor khác cùng lớp",
      "Gọi constructor của lớp cha",
      "Tạo namespace",
      "Khai báo interface"
    ],
    "source": "https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/types/classes"
  },
  {
    "lessonOrder": 4,
    "questionOrder": 7,
    "text": "Khi lớp con cần gọi constructor của lớp cha có tham số, thường dùng cú pháp gì?",
    "options": [
      "base(...)",
      "this.class(...)",
      "static(...)",
      "virtual(...)"
    ],
    "source": "https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/types/classes"
  },
  {
    "lessonOrder": 4,
    "questionOrder": 8,
    "text": "Biến static thông thường được chia sẻ như thế nào?",
    "options": [
      "Giữa các thể hiện của cùng một kiểu",
      "Mỗi đối tượng có một bản độc lập",
      "Chỉ trong một phương thức local",
      "Không thể truy cập từ lớp"
    ],
    "source": "https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/types/classes"
  },
  {
    "lessonOrder": 4,
    "questionOrder": 9,
    "text": "Phương thức nào có thể được gọi mà không tạo thể hiện nếu khai báo phù hợp?",
    "options": [
      "Phương thức static",
      "Phương thức instance private",
      "Constructor instance",
      "Phương thức abstract chưa cài đặt"
    ],
    "source": "https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/types/classes"
  },
  {
    "lessonOrder": 4,
    "questionOrder": 10,
    "text": "Chỉ thay đổi kiểu trả về của hai phương thức cùng tên và tham số có tạo nạp chồng hợp lệ không?",
    "options": [
      "Không, chỉ kiểu trả về là không đủ",
      "Có, luôn hợp lệ",
      "Có, nếu khác mức truy cập",
      "Có, nếu đặt ở một file khác"
    ],
    "source": "https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/types/classes"
  },
  {
    "lessonOrder": 5,
    "questionOrder": 4,
    "text": "Cấu trúc nào phù hợp để lưu danh sách sinh viên tăng giảm số lượng?",
    "options": [
      "List<Student>",
      "Student duy nhất",
      "int đơn",
      "bool đơn"
    ],
    "source": "https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/collections"
  },
  {
    "lessonOrder": 5,
    "questionOrder": 5,
    "text": "Để thêm một phần tử vào List<int> scores, dùng cách nào?",
    "options": [
      "scores.Add(10)",
      "scores.InsertKey(10)",
      "scores.PushKey(10)",
      "scores.Make(10)"
    ],
    "source": "https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/collections"
  },
  {
    "lessonOrder": 5,
    "questionOrder": 6,
    "text": "Cách tra cứu giá trị theo khóa trong Dictionary<string, int> thường dùng gì?",
    "options": [
      "dict[\"key\"]",
      "dict(0)",
      "dict.FirstKeyOnly",
      "dict.AsList()"
    ],
    "source": "https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/collections"
  },
  {
    "lessonOrder": 5,
    "questionOrder": 7,
    "text": "Kiểu phần tử của List<string> là gì?",
    "options": [
      "string",
      "int",
      "object[]",
      "Dictionary"
    ],
    "source": "https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/collections"
  },
  {
    "lessonOrder": 5,
    "questionOrder": 8,
    "text": "Lợi ích chính của generic so với collection không định kiểu là gì?",
    "options": [
      "Kiểm tra kiểu tốt hơn khi biên dịch",
      "Luôn nhanh hơn mọi cấu trúc dữ liệu",
      "Tự động mã hóa dữ liệu",
      "Không bao giờ phát sinh lỗi runtime"
    ],
    "source": "https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/collections"
  },
  {
    "lessonOrder": 5,
    "questionOrder": 9,
    "text": "Để kiểm tra Dictionary có chứa khóa k mà không ném lỗi khi khóa vắng mặt, thường dùng gì?",
    "options": [
      "ContainsKey(k)",
      "HasItemAt(0)",
      "IndexOfValue(k)",
      "KeyLength(k)"
    ],
    "source": "https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/collections"
  },
  {
    "lessonOrder": 5,
    "questionOrder": 10,
    "text": "foreach phù hợp với công việc nào?",
    "options": [
      "Duyệt lần lượt phần tử của collection",
      "Bắt buộc sắp xếp lại danh sách",
      "Chỉ truy vấn cơ sở dữ liệu",
      "Tạo lớp mới lúc chạy"
    ],
    "source": "https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/collections"
  },
  {
    "lessonOrder": 6,
    "questionOrder": 4,
    "text": "Khai báo class Car : Vehicle trong C# biểu thị điều gì?",
    "options": [
      "Car kế thừa Vehicle",
      "Vehicle kế thừa Car",
      "Car implements nhiều lớp cha",
      "Car là namespace của Vehicle"
    ],
    "source": "https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/object-oriented/inheritance"
  },
  {
    "lessonOrder": 6,
    "questionOrder": 5,
    "text": "C# cho phép một lớp kế thừa trực tiếp mấy lớp cơ sở?",
    "options": [
      "Tối đa một lớp cơ sở",
      "Không giới hạn lớp cơ sở",
      "Ít nhất hai lớp cơ sở",
      "Không có lớp cơ sở nào"
    ],
    "source": "https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/object-oriented/inheritance"
  },
  {
    "lessonOrder": 6,
    "questionOrder": 6,
    "text": "Thành viên protected trong lớp cha có thể được truy cập ở đâu?",
    "options": [
      "Bên trong lớp cha và lớp dẫn xuất phù hợp",
      "Mọi đoạn mã bên ngoài",
      "Chỉ namespace khác",
      "Chỉ file Program.cs"
    ],
    "source": "https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/object-oriented/inheritance"
  },
  {
    "lessonOrder": 6,
    "questionOrder": 7,
    "text": "Một đối tượng của lớp con có thể được gán cho biến kiểu lớp cha khi nào?",
    "options": [
      "Khi lớp con dẫn xuất từ lớp cha và phép chuyển kiểu hợp lệ",
      "Chỉ khi hai lớp cùng tên",
      "Chỉ khi cả hai static",
      "Không bao giờ"
    ],
    "source": "https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/object-oriented/inheritance"
  },
  {
    "lessonOrder": 6,
    "questionOrder": 8,
    "text": "Kế thừa phù hợp nhất với quan hệ nào?",
    "options": [
      "IS-A",
      "HAS-A",
      "PART-OF bắt buộc",
      "HAS-KEY"
    ],
    "source": "https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/object-oriented/inheritance"
  },
  {
    "lessonOrder": 6,
    "questionOrder": 9,
    "text": "Composition thường phù hợp với mô tả nào?",
    "options": [
      "Một đối tượng chứa hoặc sử dụng đối tượng khác",
      "Một lớp là chuyên biệt của lớp kia",
      "Hai lớp phải trùng tên",
      "Một lớp chỉ có phương thức static"
    ],
    "source": "https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/object-oriented/inheritance"
  },
  {
    "lessonOrder": 6,
    "questionOrder": 10,
    "text": "Constructor của lớp cha được kế thừa nguyên dạng vào lớp con không?",
    "options": [
      "Không, constructor instance không được kế thừa",
      "Có, tất cả được kế thừa như method",
      "Chỉ được nếu là private",
      "Chỉ được khi lớp cha sealed"
    ],
    "source": "https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/object-oriented/inheritance"
  },
  {
    "lessonOrder": 7,
    "questionOrder": 4,
    "text": "Phương thức lớp cha cần khai báo gì để lớp con override được cách cài đặt thông thường?",
    "options": [
      "virtual hoặc abstract",
      "private static",
      "const",
      "using"
    ],
    "source": "https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/object-oriented/polymorphism"
  },
  {
    "lessonOrder": 7,
    "questionOrder": 5,
    "text": "Từ khóa override ở lớp con có ý nghĩa gì?",
    "options": [
      "Cung cấp cài đặt thay thế cho thành viên ảo của lớp cha",
      "Tạo field mới độc lập",
      "Biến lớp con thành interface",
      "Khởi tạo constructor mặc định"
    ],
    "source": "https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/object-oriented/polymorphism"
  },
  {
    "lessonOrder": 7,
    "questionOrder": 6,
    "text": "Nếu Shape s = new Circle(); s.Draw() và Circle override Draw, bản nào thường được gọi?",
    "options": [
      "Draw của Circle",
      "Luôn Draw của Shape",
      "Không được gọi",
      "Chỉ chạy constructor"
    ],
    "source": "https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/object-oriented/polymorphism"
  },
  {
    "lessonOrder": 7,
    "questionOrder": 7,
    "text": "Một abstract class có thể chứa phương thức đã cài đặt không?",
    "options": [
      "Có",
      "Không, mọi phương thức phải abstract",
      "Chỉ khi không có constructor",
      "Chỉ khi là static"
    ],
    "source": "https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/object-oriented/polymorphism"
  },
  {
    "lessonOrder": 7,
    "questionOrder": 8,
    "text": "Phương thức abstract trong abstract class có phần thân phương thức thông thường không?",
    "options": [
      "Không, phương thức abstract khai báo hợp đồng cần lớp cụ thể cài đặt",
      "Có, luôn có phần thân",
      "Bắt buộc private",
      "Bắt buộc static"
    ],
    "source": "https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/object-oriented/polymorphism"
  },
  {
    "lessonOrder": 7,
    "questionOrder": 9,
    "text": "Sự khác biệt chính giữa override và new khi trùng tên phương thức là gì?",
    "options": [
      "override tham gia dispatch đa hình; new che giấu thành viên",
      "Cả hai hoàn toàn giống nhau",
      "new luôn gọi phương thức lớp con khi biến kiểu cha",
      "override chỉ dùng cho field"
    ],
    "source": "https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/object-oriented/polymorphism"
  },
  {
    "lessonOrder": 7,
    "questionOrder": 10,
    "text": "Một lớp sealed có thể bị lớp khác kế thừa không?",
    "options": [
      "Không",
      "Có, không giới hạn",
      "Chỉ được hai lần",
      "Có nếu thêm virtual"
    ],
    "source": "https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/object-oriented/polymorphism"
  },
  {
    "lessonOrder": 8,
    "questionOrder": 4,
    "text": "Trong C#, một lớp có thể thực thi đồng thời hai interface không?",
    "options": [
      "Có",
      "Không",
      "Chỉ khi lớp là sealed",
      "Chỉ khi interface cùng namespace"
    ],
    "source": "https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/types/interfaces"
  },
  {
    "lessonOrder": 8,
    "questionOrder": 5,
    "text": "Interface thường giúp tách phần nào khỏi phần cài đặt?",
    "options": [
      "Hợp đồng hành vi",
      "Mọi trường dữ liệu runtime",
      "Tên assembly",
      "Cấu hình Docker"
    ],
    "source": "https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/types/interfaces"
  },
  {
    "lessonOrder": 8,
    "questionOrder": 6,
    "text": "Nếu class EmailSender : ISender, lớp cụ thể phải làm gì?",
    "options": [
      "Cài đặt những thành viên interface yêu cầu",
      "Xóa mọi phương thức công khai",
      "Kế thừa từ hai lớp",
      "Luôn khai báo static"
    ],
    "source": "https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/types/interfaces"
  },
  {
    "lessonOrder": 8,
    "questionOrder": 7,
    "text": "Một interface có thể được sử dụng làm kiểu của biến trong C# không?",
    "options": [
      "Có",
      "Không",
      "Chỉ trong constructor",
      "Chỉ trong enum"
    ],
    "source": "https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/types/interfaces"
  },
  {
    "lessonOrder": 8,
    "questionOrder": 8,
    "text": "Vì sao tiêm dependency qua interface hữu ích?",
    "options": [
      "Giảm phụ thuộc vào cài đặt cụ thể và dễ thay thế mock",
      "Bắt buộc tăng số lần new",
      "Làm mọi lớp thành singleton",
      "Ngăn kiểm thử đơn vị"
    ],
    "source": "https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/types/interfaces"
  },
  {
    "lessonOrder": 8,
    "questionOrder": 9,
    "text": "Trong C#, cách khai báo interface nào đúng?",
    "options": [
      "interface ILogger { void Log(string message); }",
      "class interface ILogger { }",
      "implements ILogger { }",
      "interface = ILogger"
    ],
    "source": "https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/types/interfaces"
  },
  {
    "lessonOrder": 8,
    "questionOrder": 10,
    "text": "Với một lớp thực thi interface, phương thức công khai tương ứng thường cần mức truy cập nào?",
    "options": [
      "public",
      "private",
      "protected",
      "file-only"
    ],
    "source": "https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/types/interfaces"
  },
  {
    "lessonOrder": 9,
    "questionOrder": 4,
    "text": "Trong ứng dụng ba lớp, Presentation Layer chủ yếu làm gì?",
    "options": [
      "Nhận tương tác và hiển thị dữ liệu",
      "Trực tiếp quản lý mọi truy vấn SQL",
      "Lưu toàn bộ logic nghiệp vụ trong nút bấm",
      "Thay thế cơ sở dữ liệu"
    ],
    "source": "https://legiacong.blogspot.com/2018/12/lap-trinh-ud-desktop14-design-pattern.html"
  },
  {
    "lessonOrder": 9,
    "questionOrder": 5,
    "text": "Business Logic Layer nên chịu trách nhiệm gì?",
    "options": [
      "Quy tắc nghiệp vụ và xử lý tình huống",
      "Tạo bảng vật lý cho mọi thao tác",
      "Trang trí màu nút bấm",
      "Cấu hình card mạng"
    ],
    "source": "https://legiacong.blogspot.com/2018/12/lap-trinh-ud-desktop14-design-pattern.html"
  },
  {
    "lessonOrder": 9,
    "questionOrder": 6,
    "text": "Data Access Layer thường cung cấp dịch vụ gì?",
    "options": [
      "Đọc ghi và truy vấn dữ liệu",
      "Vẽ biểu đồ giao diện",
      "Kiểm tra font chữ",
      "Xử lý sự kiện chuột trực tiếp"
    ],
    "source": "https://legiacong.blogspot.com/2018/12/lap-trinh-ud-desktop14-design-pattern.html"
  },
  {
    "lessonOrder": 9,
    "questionOrder": 7,
    "text": "Luồng phụ thuộc thường được khuyến nghị trong ứng dụng 3 lớp đơn giản là gì?",
    "options": [
      "Presentation gọi BLL, BLL gọi DAL",
      "DAL gọi GUI để quyết định mọi luật nghiệp vụ",
      "GUI truy cập trực tiếp bảng ở mọi nút",
      "BLL luôn chứa màn hình"
    ],
    "source": "https://legiacong.blogspot.com/2018/12/lap-trinh-ud-desktop14-design-pattern.html"
  },
  {
    "lessonOrder": 9,
    "questionOrder": 8,
    "text": "Đưa câu SQL trực tiếp vào sự kiện Click của giao diện gây rủi ro gì?",
    "options": [
      "Tăng kết dính và làm khó kiểm thử, bảo trì",
      "Luôn tăng tốc độ ứng dụng",
      "Tự động loại bỏ SQL injection",
      "Giúp thay CSDL mà không sửa code"
    ],
    "source": "https://legiacong.blogspot.com/2018/12/lap-trinh-ud-desktop14-design-pattern.html"
  },
  {
    "lessonOrder": 9,
    "questionOrder": 9,
    "text": "DTO thường được dùng để làm gì?",
    "options": [
      "Chuyển dữ liệu giữa các lớp hoặc ranh giới",
      "Tạo cửa sổ Windows Form",
      "Thay thế mọi kết nối DB",
      "Mã hóa source code"
    ],
    "source": "https://legiacong.blogspot.com/2018/12/lap-trinh-ud-desktop14-design-pattern.html"
  },
  {
    "lessonOrder": 9,
    "questionOrder": 10,
    "text": "Khi đổi từ SQL Server sang nguồn dữ liệu khác, tách DAL giúp điều gì?",
    "options": [
      "Giảm phạm vi thay đổi ở các lớp phía trên",
      "Bắt buộc sửa tất cả form",
      "Làm mất mọi business rule",
      "Loại bỏ hoàn toàn kiểm thử"
    ],
    "source": "https://legiacong.blogspot.com/2018/12/lap-trinh-ud-desktop14-design-pattern.html"
  },
  {
    "lessonOrder": 10,
    "questionOrder": 4,
    "text": "SRP trong SOLID thường được hiểu là gì?",
    "options": [
      "Một lớp nên có một lý do chính để thay đổi",
      "Một lớp chỉ được có một phương thức",
      "Mọi lớp đều phải static",
      "Một dự án chỉ có một lớp"
    ],
    "source": "https://learn.microsoft.com/en-us/dotnet/standard/modern-web-apps-azure-architecture/architectural-principles"
  },
  {
    "lessonOrder": 10,
    "questionOrder": 5,
    "text": "Open/Closed Principle khuyến khích cách mở rộng nào?",
    "options": [
      "Thêm hành vi qua trừu tượng/thành phần mới thay vì sửa mã ổn định",
      "Sửa mọi lớp cũ khi có tính năng",
      "Cấm sử dụng interface",
      "Chỉ sử dụng biến toàn cục"
    ],
    "source": "https://learn.microsoft.com/en-us/dotnet/standard/modern-web-apps-azure-architecture/architectural-principles"
  },
  {
    "lessonOrder": 10,
    "questionOrder": 6,
    "text": "Liskov Substitution Principle liên quan đến điều gì?",
    "options": [
      "Lớp con thay thế lớp cha mà không làm sai hợp đồng mong đợi",
      "Lớp con phải đổi mọi tên method",
      "Mọi lớp có một constructor",
      "Chỉ dùng một loại kiểu dữ liệu"
    ],
    "source": "https://learn.microsoft.com/en-us/dotnet/standard/modern-web-apps-azure-architecture/architectural-principles"
  },
  {
    "lessonOrder": 10,
    "questionOrder": 7,
    "text": "Interface Segregation Principle khuyên thiết kế interface thế nào?",
    "options": [
      "Nhỏ và tập trung để client không phụ thuộc thành viên không cần",
      "Một interface khổng lồ cho mọi lớp",
      "Mọi interface đều trống",
      "Chỉ một interface trong dự án"
    ],
    "source": "https://learn.microsoft.com/en-us/dotnet/standard/modern-web-apps-azure-architecture/architectural-principles"
  },
  {
    "lessonOrder": 10,
    "questionOrder": 8,
    "text": "Dependency Inversion Principle đặt trọng tâm vào điều gì?",
    "options": [
      "Module cấp cao và cấp thấp phụ thuộc vào trừu tượng",
      "Module cấp cao phải new trực tiếp lớp database",
      "Mọi module phải dùng singleton",
      "Chỉ lớp cha mới được có constructor"
    ],
    "source": "https://learn.microsoft.com/en-us/dotnet/standard/modern-web-apps-azure-architecture/architectural-principles"
  },
  {
    "lessonOrder": 10,
    "questionOrder": 9,
    "text": "Một lớp vừa lưu DB vừa gửi email vừa xuất PDF dễ vi phạm nguyên lý nào?",
    "options": [
      "Single Responsibility Principle",
      "Open/Closed Principle duy nhất",
      "Liskov Substitution Principle duy nhất",
      "Interface Segregation Principle duy nhất"
    ],
    "source": "https://learn.microsoft.com/en-us/dotnet/standard/modern-web-apps-azure-architecture/architectural-principles"
  },
  {
    "lessonOrder": 10,
    "questionOrder": 10,
    "text": "Giải pháp nào thường làm giảm coupling giữa nghiệp vụ và dịch vụ gửi email?",
    "options": [
      "Phụ thuộc vào IEmailSender và tiêm implementation",
      "new SmtpClient sâu trong mọi quy trình",
      "Copy mã gửi email vào mỗi lớp",
      "Biến mọi method thành static"
    ],
    "source": "https://learn.microsoft.com/en-us/dotnet/standard/modern-web-apps-azure-architecture/architectural-principles"
  },
  {
    "lessonOrder": 11,
    "questionOrder": 4,
    "text": "Factory Method tập trung vào nhóm vấn đề nào?",
    "options": [
      "Khởi tạo đối tượng",
      "Nén dữ liệu",
      "Quản lý bộ nhớ thủ công",
      "Sắp xếp mảng duy nhất"
    ],
    "source": "https://refactoring.guru/design-patterns/catalog"
  },
  {
    "lessonOrder": 11,
    "questionOrder": 5,
    "text": "Strategy phù hợp với trường hợp nào?",
    "options": [
      "Có nhiều thuật toán cùng mục tiêu cần chọn lúc chạy",
      "Chỉ có một thuật toán bất biến",
      "Cần tách tên assembly",
      "Chỉ lưu ảnh tĩnh"
    ],
    "source": "https://refactoring.guru/design-patterns/catalog"
  },
  {
    "lessonOrder": 11,
    "questionOrder": 6,
    "text": "Adapter giải quyết vấn đề nào?",
    "options": [
      "Làm tương thích hai giao diện không trùng nhau",
      "Chỉ tạo một instance duy nhất",
      "Đảm bảo mọi lớp sealed",
      "Ẩn tất cả ngoại lệ"
    ],
    "source": "https://refactoring.guru/design-patterns/catalog"
  },
  {
    "lessonOrder": 11,
    "questionOrder": 7,
    "text": "Facade có vai trò điển hình nào?",
    "options": [
      "Cung cấp API đơn giản cho hệ con phức tạp",
      "Tạo nhiều lớp con bằng kế thừa",
      "Tự động thay thế tất cả interface",
      "Chỉ dùng làm iterator"
    ],
    "source": "https://refactoring.guru/design-patterns/catalog"
  },
  {
    "lessonOrder": 11,
    "questionOrder": 8,
    "text": "Observer phù hợp với nhu cầu nào?",
    "options": [
      "Nhiều đối tượng nhận thông báo khi trạng thái nguồn thay đổi",
      "Tạo một thư mục vật lý",
      "Tạo constructor private",
      "Quản lý khóa chính"
    ],
    "source": "https://refactoring.guru/design-patterns/catalog"
  },
  {
    "lessonOrder": 11,
    "questionOrder": 9,
    "text": "Singleton thường cố gắng bảo đảm điều gì?",
    "options": [
      "Một điểm truy cập đến một instance được kiểm soát",
      "Mỗi lần gọi tạo một instance",
      "Luôn cho phép kế thừa nhiều lớp",
      "Mọi dữ liệu đều immutable"
    ],
    "source": "https://refactoring.guru/design-patterns/catalog"
  },
  {
    "lessonOrder": 11,
    "questionOrder": 10,
    "text": "Decorator cho phép mở rộng hành vi theo cách nào?",
    "options": [
      "Bọc đối tượng bằng thành phần bổ sung có cùng hợp đồng",
      "Chỉnh sửa trực tiếp mọi lớp đã biên dịch",
      "Xóa các interface",
      "Chuyển mọi lớp thành enum"
    ],
    "source": "https://refactoring.guru/design-patterns/catalog"
  }
]
$quiz_json$::jsonb)
  LOOP
    SELECT lesson_id INTO v_lesson_id FROM lms.lessons
      WHERE course_id=v_course_id AND lesson_order=(v_spec->>'lessonOrder')::int
        AND is_published AND NOT is_deleted;
    IF v_lesson_id IS NULL THEN
       RAISE EXCEPTION 'Missing OOP lesson order %', v_spec->>'lessonOrder';
    END IF;
    SELECT quiz_id INTO v_quiz_id FROM assessment.quizzes
      WHERE course_id=v_course_id AND lesson_id=v_lesson_id AND NOT is_deleted
        AND description='[VEDU-OOP-LESSON-v1] Quiz cuối bài dựa trên học liệu được gắn với bài học.'
      ORDER BY quiz_id DESC LIMIT 1;
    IF v_quiz_id IS NULL THEN RAISE EXCEPTION 'Missing OOP quiz for lesson %', v_spec->>'lessonOrder'; END IF;
    SELECT question_id INTO v_question_id FROM assessment.questions
      WHERE quiz_id=v_quiz_id AND question_order=(v_spec->>'questionOrder')::int;
    IF v_question_id IS NULL THEN
      INSERT INTO assessment.questions (quiz_id, question_text, question_type, question_order, points)
      VALUES (v_quiz_id, v_spec->>'text', 'SINGLE_CHOICE', (v_spec->>'questionOrder')::int, 1)
      RETURNING question_id INTO v_question_id;
      v_idx := 0;
      FOR v_answer IN SELECT value#>>'{}' FROM jsonb_array_elements(v_spec->'options') LOOP
        v_idx := v_idx + 1;
        INSERT INTO assessment.answers (question_id, answer_text, is_correct, answer_order)
        VALUES (v_question_id, v_answer, v_idx=1, 1 + ((v_idx + (v_spec->>'questionOrder')::int - 2) % 4));
      END LOOP;
    ELSE
      IF (SELECT question_text FROM assessment.questions WHERE question_id=v_question_id) IS DISTINCT FROM v_spec->>'text' THEN
        RAISE EXCEPTION 'Quiz % question_order % already occupied by other question; no changes committed.',v_quiz_id,v_spec->>'questionOrder';
      END IF;
      IF (SELECT count(*) FROM assessment.answers WHERE question_id=v_question_id) <> 4 THEN
        RAISE EXCEPTION 'Quiz % question % has nonstandard answer count; no changes committed',v_quiz_id,v_question_id;
      END IF;
    END IF;
    INSERT INTO assessment.question_skills (question_id, skill)
    VALUES(v_question_id,'oop-extended-questions')
    ON CONFLICT(question_id) DO NOTHING;
  END LOOP;
END $oop_70$;
-- Ten multiple-choice questions need more time than the original three-question quiz.
-- This affects subsequent attempts only, not prior recorded scores.
UPDATE assessment.quizzes q
SET time_limit_seconds = 900, updated_at = now()
FROM lms.curated_courses c
JOIN lms.lessons l ON l.course_id = c.course_id
WHERE c.course_key = 'oop' AND q.course_id = c.course_id AND q.lesson_id = l.lesson_id
  AND l.lesson_order BETWEEN 2 AND 11
  AND q.description = '[VEDU-OOP-LESSON-v1] Quiz cuối bài dựa trên học liệu được gắn với bài học.'
  AND NOT q.is_deleted;
COMMIT;
