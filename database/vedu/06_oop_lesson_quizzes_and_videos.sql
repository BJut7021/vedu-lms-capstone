BEGIN;

DO $oop_lesson_content$
DECLARE
  v_course_id bigint;
  v_lesson_id bigint;
  v_quiz_id bigint;
  v_question_id bigint;
  v_spec jsonb;
  v_question jsonb;
  v_answer jsonb;
  v_video jsonb;
  v_question_order integer;
  v_answer_order integer;
  v_video_order integer;
BEGIN
  SELECT course_id INTO v_course_id
  FROM lms.curated_courses
  WHERE course_key = 'oop';

  IF v_course_id IS NULL THEN
    RAISE NOTICE 'OOP course is not available; lesson quizzes and videos skipped.';
    RETURN;
  END IF;

  -- The introduction remains an information activity so its syllabus can be
  -- opened from the course tree, but it is not timed or assessed as a lesson.
  UPDATE lms.lessons
  SET estimated_duration_seconds = 0
  WHERE course_id = v_course_id AND lesson_order = 1
    AND is_published AND NOT is_deleted;

  -- Preserve old attempts, but stop exposing the mismatched legacy lesson quiz.
  UPDATE assessment.quizzes
  SET is_published = false, updated_at = now()
  WHERE course_id = v_course_id AND lesson_id IS NOT NULL
    AND is_published AND NOT is_deleted
    AND description IS DISTINCT FROM '[VEDU-OOP-LESSON-v1] Quiz cuối bài dựa trên học liệu được gắn với bài học.';

  -- Video rows are rebuilt by lesson order so the migration works on both a
  -- fresh database and an existing team volume without relying on numeric IDs.
  DELETE FROM lms.lesson_resources r
  USING lms.lessons l
  WHERE r.lesson_id = l.lesson_id AND l.course_id = v_course_id
    AND l.lesson_order BETWEEN 2 AND 11 AND r.resource_type = 'VIDEO';

  FOR v_spec IN
    SELECT value FROM jsonb_array_elements($json$
    [
      {
        "lessonOrder": 2,
        "title": "Quiz cuối bài 01 — Ôn C# và phương pháp hướng đối tượng",
        "skill": "oop-foundations",
        "videos": [
          {"title":"Tổng quan lập trình OOP với C# — HowKteam","url":"https://www.youtube.com/watch?v=WQ9j2sPRstk"}
        ],
        "questions": [
          {"text":"Theo học liệu Chương 01, ba đặc điểm chính của lập trình hướng đối tượng là gì?","options":["Đóng gói, kế thừa và đa hình","Biên dịch, liên kết và thực thi","Mảng, danh sách và hàng đợi","Nhập, xuất và ép kiểu"]},
          {"text":"Trong cách tiếp cận hướng đối tượng, chương trình được xem như thế nào?","options":["Tập hợp các đối tượng trao đổi thông điệp với nhau","Một chuỗi lệnh chỉ dùng biến toàn cục","Một bảng dữ liệu không có hành vi","Một hàm duy nhất xử lý toàn bộ hệ thống"]},
          {"text":"Khi chuyển từ kiểu có miền giá trị lớn sang kiểu nhỏ hơn và C# không chuyển ngầm, cách thực hiện phù hợp là gì?","options":["Ép kiểu tường minh và kiểm soát giá trị","Chỉ đổi tên biến","Thêm từ khóa using","Dùng vòng lặp foreach"]}
        ]
      },
      {
        "lessonOrder": 3,
        "title": "Quiz cuối bài 02 — Lớp, đối tượng và đóng gói",
        "skill": "encapsulation",
        "videos": [
          {"title":"Class trong lập trình hướng đối tượng — HowKteam","url":"https://www.youtube.com/watch?v=pXcMdI3LVEE"}
        ],
        "questions": [
          {"text":"Lớp (class) mô tả điều gì trong mô hình hướng đối tượng?","options":["Nhóm đối tượng có đặc tính và hành vi tương tự","Một giá trị số nguyên duy nhất","Một tệp cấu hình không có dữ liệu","Một vòng lặp của chương trình"]},
          {"text":"Mục đích chính của đóng gói là gì?","options":["Che giấu chi tiết cài đặt và kiểm soát truy cập dữ liệu","Cho mọi thành phần truy cập trực tiếp dữ liệu","Loại bỏ toàn bộ phương thức của lớp","Bắt buộc mọi thuộc tính là static"]},
          {"text":"Property trong C# thường được dùng để làm gì?","options":["Cung cấp truy cập có kiểm soát qua get/set","Thay thế hoàn toàn constructor","Khai báo một namespace mới","Tạo vòng lặp tự động"]}
        ]
      },
      {
        "lessonOrder": 4,
        "title": "Quiz cuối bài 03 — Constructor, nạp chồng và thành phần tĩnh",
        "skill": "object-lifecycle",
        "videos": [
          {"title":"Class và constructor trong OOP — HowKteam","url":"https://www.youtube.com/watch?v=pXcMdI3LVEE"},
          {"title":"Từ khóa static trong OOP — HowKteam","url":"https://www.youtube.com/watch?v=9p6oW56Zo3c"}
        ],
        "questions": [
          {"text":"Đặc điểm đúng của constructor trong C# là gì?","options":["Trùng tên lớp và không khai báo kiểu trả về","Luôn trả về kiểu int","Chỉ được gọi thủ công sau khi tạo đối tượng","Bắt buộc phải là static"]},
          {"text":"Hai phương thức cùng tên được xem là nạp chồng hợp lệ khi nào?","options":["Danh sách tham số khác nhau","Chỉ khác kiểu trả về","Chỉ khác tên tham số","Mọi thành phần đều giống hệt nhau"]},
          {"text":"Thành phần static thuộc về đâu và thường được truy cập như thế nào?","options":["Thuộc về lớp và truy cập qua tên lớp","Thuộc riêng từng đối tượng và chỉ qua this","Thuộc về namespace và chỉ qua using","Thuộc về constructor sao chép"]}
        ]
      },
      {
        "lessonOrder": 5,
        "title": "Quiz cuối bài 04 — Generic collections và mô hình lớp",
        "skill": "collections",
        "videos": [
          {"title":"Working with Collections — Microsoft Learn","url":"https://videoencodingpublic-hgeaeyeba8gycee3.b01.azurefd.net/public-652b0c55-41da-43c3-b9fe-b987ed2a2885/working-with-collections_high.mp4"}
        ],
        "questions": [
          {"text":"Generic cho phép định nghĩa lớp hoặc phương thức như thế nào?","options":["Chưa cần cố định kiểu dữ liệu cho đến khi sử dụng","Chỉ làm việc với kiểu int","Không được nhận tham số","Không thể tái sử dụng mã"]},
          {"text":"Đặc điểm phù hợp của List<T> là gì?","options":["Lưu phần tử theo chỉ số và có thể thay đổi số lượng linh động","Chỉ lưu đúng một phần tử","Luôn lưu cặp khóa–giá trị","Chỉ hoạt động theo LIFO"]},
          {"text":"Collection nào lưu dữ liệu theo cặp khóa–giá trị?","options":["Dictionary<TKey, TValue>","List<T>","Queue<T>","Stack<T>"]}
        ]
      },
      {
        "lessonOrder": 6,
        "title": "Quiz cuối bài 05 — Kế thừa và quan hệ giữa các lớp",
        "skill": "inheritance",
        "videos": [
          {"title":"Kế thừa trong lập trình hướng đối tượng — HowKteam","url":"https://www.youtube.com/watch?v=tgxT3xRdfvU"}
        ],
        "questions": [
          {"text":"Theo học liệu, lớp con hình thành từ lớp cha theo cách hiểu nào?","options":["Giữ đặc tính chung của lớp cha và bổ sung đặc tính riêng","Xóa toàn bộ đặc tính của lớp cha","Sao chép mã nhưng không tạo quan hệ","Chỉ thay đổi tên lớp"]},
          {"text":"Trong constructor lớp con, cú pháp nào truyền tham số cho constructor lớp cha?","options":["base(thamSo)","static(thamSo)","override(thamSo)","namespace(thamSo)"]},
          {"text":"Quan hệ 'XeMáy là một Xe' phù hợp nhất với quan hệ nào?","options":["IS-A bằng kế thừa","HAS-A bằng composition","Khóa–giá trị","Producer–consumer"]}
        ]
      },
      {
        "lessonOrder": 7,
        "title": "Quiz cuối bài 06 — Đa hình và lớp trừu tượng",
        "skill": "polymorphism",
        "videos": [
          {"title":"Đa hình trong lập trình hướng đối tượng — HowKteam","url":"https://www.youtube.com/watch?v=SfFAk5LEW0I"}
        ],
        "questions": [
          {"text":"Đa hình khi chạy trong C# cần điều kiện cốt lõi nào?","options":["Có quan hệ kế thừa và phương thức lớp con ghi đè phương thức lớp cha","Các lớp không liên quan và mọi phương thức đều static","Chỉ cần hai phương thức khác tên","Chỉ cần dùng một namespace"]},
          {"text":"Cặp từ khóa nào dùng cho phương thức đa hình ở lớp cha và lớp con?","options":["virtual và override","private và sealed","static và const","using và namespace"]},
          {"text":"Phát biểu nào đúng về abstract class?","options":["Không thể khởi tạo trực tiếp đối tượng từ abstract class","Bắt buộc mọi phương thức đều static","Không thể có phương thức đã cài đặt","Có thể tạo bằng new như lớp thường"]}
        ]
      },
      {
        "lessonOrder": 8,
        "title": "Quiz cuối bài 07 — Interface và hợp đồng hành vi",
        "skill": "interface-contract",
        "videos": [
          {"title":"Interface trong lập trình hướng đối tượng — HowKteam","url":"https://www.youtube.com/watch?v=nKNE6EFCasw"}
        ],
        "questions": [
          {"text":"Theo học liệu của bài, interface được dùng chủ yếu để làm gì?","options":["Mô tả hợp đồng hành vi chung mà lớp thực thi phải tuân theo","Lưu trạng thái riêng của từng đối tượng","Thay thế mọi lớp cụ thể bằng biến toàn cục","Tạo constructor dùng chung"]},
          {"text":"Một lớp C# có thể thực thi bao nhiêu interface?","options":["Có thể thực thi nhiều interface","Chỉ đúng một interface","Không thể thực thi interface","Chỉ thực thi khi lớp là static"]},
          {"text":"Nếu lớp chưa cài đặt đầy đủ các thành phần bắt buộc của interface thì lớp đó phải như thế nào?","options":["Trở thành lớp trừu tượng","Tự động trở thành sealed","Bị đổi thành namespace","Tự động xóa interface"]}
        ]
      },
      {
        "lessonOrder": 9,
        "title": "Quiz cuối bài 08 — Tổ chức ứng dụng theo ba lớp",
        "skill": "layered-architecture",
        "videos": [
          {"title":"Giới thiệu mô hình 3 lớp — HowKteam","url":"https://www.youtube.com/watch?v=zeyIss4SPMI"}
        ],
        "questions": [
          {"text":"Trong mô hình ba lớp, thành phần nào tương tác trực tiếp với người sử dụng?","options":["GUI","BLL","DAL","DTO"]},
          {"text":"BLL chịu trách nhiệm chính nào?","options":["Xử lý nghiệp vụ và kiểm tra tính hợp lệ của dữ liệu","Vẽ giao diện và nhận mọi thao tác bàn phím","Kết nối trực tiếp mọi control với cơ sở dữ liệu","Chỉ lưu cấu hình giao diện"]},
          {"text":"DAL có vai trò chính nào?","options":["Giao tiếp với cơ sở dữ liệu hoặc nguồn lưu trữ","Hiển thị kết quả lên màn hình","Quyết định bố cục giao diện","Thay thế toàn bộ DTO"]}
        ]
      },
      {
        "lessonOrder": 10,
        "title": "Quiz cuối bài 09 — Nguyên lý SOLID",
        "skill": "solid-principles",
        "videos": [
          {"title":"SOLID Design Patterns — Microsoft Learn","url":"https://videoencodingpublic-hgeaeyeba8gycee3.b01.azurefd.net/public-8623d4ac-5290-47b3-8c91-e05b84af6af2/vstoolboxsolidsoftwaredesignpatterns_high.mp4"}
        ],
        "questions": [
          {"text":"Nguyên lý Open/Closed khuyến nghị thành phần phần mềm như thế nào?","options":["Mở cho mở rộng nhưng đóng cho sửa đổi trực tiếp","Đóng cho mở rộng và mở cho sửa mọi mã cũ","Chỉ dùng lớp static","Không được dùng interface"]},
          {"text":"Liskov Substitution yêu cầu điều gì?","options":["Đối tượng lớp con có thể thay thế lớp cha mà không phá vỡ hành vi mong đợi","Lớp con phải xóa toàn bộ hành vi lớp cha","Mọi lớp phải có cùng tên","Mọi phương thức phải private"]},
          {"text":"Dependency Inversion khuyến nghị module cấp cao phụ thuộc vào đâu?","options":["Trừu tượng thay vì cài đặt cụ thể","Trực tiếp mọi lớp truy cập dữ liệu","Biến toàn cục","Giao diện người dùng"]}
        ]
      },
      {
        "lessonOrder": 11,
        "title": "Quiz cuối bài 10 — Các nhóm mẫu thiết kế",
        "skill": "design-patterns",
        "videos": [
          {"title":"Design Patterns — Factories — Microsoft Learn","url":"https://videoencodingpublic-hgeaeyeba8gycee3.b01.azurefd.net/public-fd0ed36c-62e8-4f76-b372-34211d17fedb/designpatternsfactories_high.mp4"},
          {"title":"Design Patterns — Strategy — Microsoft Learn","url":"https://videoencodingpublic-hgeaeyeba8gycee3.b01.azurefd.net/public-5082cb5a-dd96-4a1f-9cae-50ccf7832532/designpatternsstrategy_high.mp4"},
          {"title":"Design Patterns — Adapter và Facade — Microsoft Learn","url":"https://videoencodingpublic-hgeaeyeba8gycee3.b01.azurefd.net/public-ffc54a94-31aa-4b2e-97f1-8610b71966c6/designpatternsadapterfacade_high.mp4"}
        ],
        "questions": [
          {"text":"Nhóm Factory pattern tập trung giải quyết vấn đề nào?","options":["Đóng gói và lựa chọn cách khởi tạo đối tượng","Sắp xếp dữ liệu bằng một thuật toán cố định","Chuyển đổi mọi lớp thành static","Lưu đối tượng vào XML tự động"]},
          {"text":"Strategy pattern phù hợp khi nào?","options":["Cần hoán đổi các thuật toán hoặc hành vi tại thời điểm chạy","Chỉ có duy nhất một hành vi không đổi","Cần tạo khóa chính cơ sở dữ liệu","Cần ẩn toàn bộ giao diện người dùng"]},
          {"text":"Mục đích đúng của Adapter và Facade là gì?","options":["Adapter làm tương thích giao diện; Facade cung cấp giao diện đơn giản cho hệ con","Cả hai chỉ tạo đối tượng","Cả hai chỉ dùng để kế thừa nhiều lớp","Adapter lưu dữ liệu; Facade biên dịch mã"]}
        ]
      }
    ]
    $json$::jsonb)
  LOOP
    SELECT lesson_id INTO v_lesson_id
    FROM lms.lessons
    WHERE course_id = v_course_id
      AND lesson_order = (v_spec->>'lessonOrder')::integer
      AND is_published AND NOT is_deleted;

    IF v_lesson_id IS NULL THEN
      RAISE EXCEPTION 'Missing published OOP lesson_order %', v_spec->>'lessonOrder';
    END IF;

    SELECT quiz_id INTO v_quiz_id
    FROM assessment.quizzes
    WHERE course_id = v_course_id AND lesson_id = v_lesson_id
      AND description = '[VEDU-OOP-LESSON-v1] Quiz cuối bài dựa trên học liệu được gắn với bài học.'
      AND NOT is_deleted
    ORDER BY quiz_id DESC LIMIT 1;

    IF v_quiz_id IS NULL THEN
      INSERT INTO assessment.quizzes(
        course_id, lesson_id, title, description, time_limit_seconds,
        passing_score, max_attempts, is_published
      ) VALUES (
        v_course_id, v_lesson_id, v_spec->>'title',
        '[VEDU-OOP-LESSON-v1] Quiz cuối bài dựa trên học liệu được gắn với bài học.',
        420, 7, 3, true
      ) RETURNING quiz_id INTO v_quiz_id;
    ELSE
      UPDATE assessment.quizzes
      SET title = v_spec->>'title', time_limit_seconds = 420,
          passing_score = 7, max_attempts = 3, is_published = true,
          updated_at = now()
      WHERE quiz_id = v_quiz_id;
    END IF;

    v_question_order := 0;
    FOR v_question IN SELECT value FROM jsonb_array_elements(v_spec->'questions')
    LOOP
      v_question_order := v_question_order + 1;
      SELECT question_id INTO v_question_id
      FROM assessment.questions
      WHERE quiz_id = v_quiz_id AND question_order = v_question_order;

      IF v_question_id IS NULL THEN
        INSERT INTO assessment.questions(
          quiz_id, question_text, question_type, question_order, points
        ) VALUES (
          v_quiz_id, v_question->>'text', 'SINGLE_CHOICE', v_question_order, 1
        ) RETURNING question_id INTO v_question_id;
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM assessment.answers WHERE question_id = v_question_id
      ) THEN
        v_answer_order := 0;
        FOR v_answer IN SELECT value FROM jsonb_array_elements(v_question->'options')
        LOOP
          v_answer_order := v_answer_order + 1;
          INSERT INTO assessment.answers(
            question_id, answer_text, is_correct, answer_order
          ) VALUES (
            v_question_id, v_answer#>>'{}', v_answer_order = 1,
            1 + ((v_answer_order + v_question_order - 2) % 4)
          );
        END LOOP;
      END IF;

      INSERT INTO assessment.question_skills(question_id, skill)
      VALUES(v_question_id, v_spec->>'skill')
      ON CONFLICT(question_id) DO UPDATE SET skill = EXCLUDED.skill;
    END LOOP;

    v_video_order := 0;
    FOR v_video IN SELECT value FROM jsonb_array_elements(v_spec->'videos')
    LOOP
      v_video_order := v_video_order + 1;
      INSERT INTO lms.lesson_resources(
        lesson_id, resource_type, title, resource_url, display_order
      ) VALUES (
        v_lesson_id, 'VIDEO', v_video->>'title', v_video->>'url',
        100 + v_video_order
      );
    END LOOP;
  END LOOP;
END $oop_lesson_content$;

-- Intro sections are informational and therefore excluded from lesson counts.
CREATE OR REPLACE VIEW lms.v_course_catalog AS
SELECT
  c.course_id, c.course_name, c.description, c.teacher_id,
  u.full_name AS teacher_name, c.price, c.currency, c.status,
  c.thumbnail_url,
  COUNT(l.lesson_id) FILTER (
    WHERE l.is_deleted = false AND l.is_published = true
      AND COALESCE(s.module_type, 'CONTENT') <> 'INTRO'
  ) AS lesson_count,
  c.created_at, c.updated_at
FROM lms.courses c
JOIN auth.users u ON u.user_id = c.teacher_id
LEFT JOIN lms.lessons l ON l.course_id = c.course_id
LEFT JOIN lms.course_sections s ON s.section_id = l.section_id
WHERE c.is_deleted = false
GROUP BY c.course_id, u.full_name;

CREATE OR REPLACE VIEW learning.v_student_progress AS
WITH lesson_counts AS (
  SELECT l.course_id, COUNT(*) AS total_lessons
  FROM lms.lessons l
  LEFT JOIN lms.course_sections s ON s.section_id = l.section_id
  WHERE l.is_deleted = false AND l.is_published = true
    AND COALESCE(s.module_type, 'CONTENT') <> 'INTRO'
  GROUP BY l.course_id
), completed AS (
  SELECT p.student_id, p.course_id,
    COUNT(*) FILTER (WHERE p.status = 'LEARNED') AS completed_lessons,
    MAX(p.last_viewed_at) AS last_activity_at
  FROM learning.lesson_progress p
  JOIN lms.lessons l ON l.lesson_id = p.lesson_id
  LEFT JOIN lms.course_sections s ON s.section_id = l.section_id
  WHERE l.is_deleted = false AND l.is_published = true
    AND COALESCE(s.module_type, 'CONTENT') <> 'INTRO'
  GROUP BY p.student_id, p.course_id
)
SELECT
  e.student_id, e.course_id, c.course_name,
  COALESCE(lc.total_lessons, 0) AS total_lessons,
  COALESCE(cp.completed_lessons, 0) AS completed_lessons,
  CASE WHEN COALESCE(lc.total_lessons, 0) = 0 THEN 0::numeric
       ELSE ROUND((COALESCE(cp.completed_lessons, 0)::numeric / lc.total_lessons::numeric) * 100, 2)
  END AS progress_percent,
  cp.last_activity_at,
  e.status AS enrollment_status
FROM enrollment.enrollments e
JOIN lms.courses c ON c.course_id = e.course_id AND c.is_deleted = false
LEFT JOIN lesson_counts lc ON lc.course_id = e.course_id
LEFT JOIN completed cp ON cp.student_id = e.student_id AND cp.course_id = e.course_id;

-- Keep the learner-facing terminology consistent on upgraded databases too.
-- Older volumes may still contain text inserted by migration 03 before the
-- application standardized the Vietnamese loanword "module".
UPDATE assessment.quizzes
SET title = replace(replace(title, 'mô-đun', 'module'), 'Mô-đun', 'Module'),
    description = replace(replace(description, 'mô-đun', 'module'), 'Mô-đun', 'Module')
WHERE title ILIKE '%mô-đun%' OR description ILIKE '%mô-đun%';

UPDATE lms.course_overviews
SET practice_note = replace(
  replace(practice_note, 'mô-đun', 'module'),
  'Mô-đun', 'Module'
)
WHERE practice_note ILIKE '%mô-đun%';

COMMIT;
