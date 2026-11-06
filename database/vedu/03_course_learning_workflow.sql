BEGIN;
ALTER TABLE lms.courses ADD COLUMN IF NOT EXISTS learning_type text NOT NULL DEFAULT 'ACADEMIC'
  CHECK (learning_type IN ('ACADEMIC','SKILL_BASED'));
ALTER TABLE lms.courses ADD COLUMN IF NOT EXISTS final_mode text NOT NULL DEFAULT 'MCQ_ONLY'
  CHECK (final_mode IN ('MCQ_ONLY','MCQ_ESSAY','MCQ_PRACTICAL'));
ALTER TABLE lms.courses ADD COLUMN IF NOT EXISTS final_mcq_percent integer NOT NULL DEFAULT 40
  CHECK (final_mcq_percent BETWEEN 1 AND 99);
ALTER TABLE lms.course_sections ADD COLUMN IF NOT EXISTS module_key text;
ALTER TABLE lms.course_sections ADD COLUMN IF NOT EXISTS module_type text NOT NULL DEFAULT 'CONTENT';
ALTER TABLE lms.course_sections ADD COLUMN IF NOT EXISTS outcomes jsonb NOT NULL DEFAULT '[]';
ALTER TABLE lms.course_sections ADD COLUMN IF NOT EXISTS is_required boolean NOT NULL DEFAULT false;
ALTER TABLE lms.course_sections ADD COLUMN IF NOT EXISTS week_start integer;
ALTER TABLE lms.course_sections ADD COLUMN IF NOT EXISTS week_end integer;
CREATE UNIQUE INDEX IF NOT EXISTS course_section_module_key ON lms.course_sections(course_id,module_key);

CREATE TABLE IF NOT EXISTS assessment.course_assignments (
  assignment_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  course_id bigint NOT NULL REFERENCES lms.courses,
  section_id bigint,
  assignment_key text NOT NULL,
  title text NOT NULL,
  instructions text NOT NULL,
  rubric jsonb NOT NULL,
  passing_score numeric(4,2) NOT NULL DEFAULT 7 CHECK(passing_score BETWEEN 1 AND 10),
  required boolean NOT NULL DEFAULT true,
  UNIQUE(course_id,assignment_key),
  FOREIGN KEY(course_id,section_id) REFERENCES lms.course_sections(course_id,section_id)
);
CREATE TABLE IF NOT EXISTS assessment.course_assignment_versions (
  version_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  assignment_id bigint NOT NULL REFERENCES assessment.course_assignments,
  student_id bigint NOT NULL REFERENCES auth.users,
  attempt_id bigint REFERENCES assessment.quiz_attempts,
  version_no integer NOT NULL CHECK(version_no>0),
  status text NOT NULL CHECK(status IN ('DRAFT','SUBMITTED','UNDER_REVIEW','NEEDS_REVISION','GRADED')),
  answer_text text NOT NULL DEFAULT '',
  answer_url text,
  file_data bytea,
  file_name text,
  rubric_scores jsonb,
  score numeric(4,2) CHECK(score BETWEEN 0 AND 10),
  outcome text CHECK(outcome IN ('PASS','FAIL','REVISE')),
  feedback text,
  graded_by bigint REFERENCES auth.users,
  graded_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS course_assignment_version_key
  ON assessment.course_assignment_versions(assignment_id,student_id,COALESCE(attempt_id,0),version_no);
CREATE TABLE IF NOT EXISTS assessment.question_skills (
  question_id bigint PRIMARY KEY REFERENCES assessment.questions ON DELETE CASCADE,
  skill text NOT NULL
);

DO $modules$
DECLARE c record; part record; sid bigint; position integer; start_week integer; end_week integer;
BEGIN
  FOR c IN SELECT cc.*, count(l.lesson_id)::int AS n
    FROM lms.curated_courses cc JOIN lms.lessons l USING(course_id)
    WHERE l.is_published AND NOT l.is_deleted GROUP BY cc.course_key,cc.course_id,cc.revision
  LOOP
    UPDATE lms.courses SET
      learning_type=CASE WHEN c.course_key IN ('word','excel','powerpoint','digital','digital-literacy') THEN 'SKILL_BASED' ELSE 'ACADEMIC' END,
      final_mode=CASE WHEN c.course_key='excel' THEN 'MCQ_PRACTICAL'
        WHEN c.course_key IN ('word','powerpoint','digital','digital-literacy') THEN 'MCQ_ONLY' ELSE 'MCQ_ESSAY' END,
      final_mcq_percent=CASE WHEN c.course_key='excel' THEN 30 ELSE 40 END
    WHERE course_id=c.course_id AND NOT EXISTS (
      SELECT 1 FROM lms.course_sections WHERE course_id=c.course_id AND module_key='intro'
    );
    UPDATE lms.course_sections SET module_key='intro',module_type='INTRO',title='Bắt đầu và đề cương',
      outcomes='["Nắm chuẩn đầu ra và cách đánh giá của khóa"]'
    WHERE course_id=c.course_id AND section_order=1 AND module_key IS NULL
      AND title='Hướng dẫn, bài học và thực hành';
    INSERT INTO lms.course_sections(course_id,section_order,title,module_key,module_type,outcomes)
      VALUES(c.course_id, (SELECT COALESCE(max(section_order),0)+1 FROM lms.course_sections WHERE course_id=c.course_id),
        'Bắt đầu và đề cương','intro','INTRO','["Nắm chuẩn đầu ra và cách đánh giá của khóa"]')
      ON CONFLICT(course_id,module_key) DO NOTHING;
    UPDATE lms.lessons SET section_id=(SELECT section_id FROM lms.course_sections WHERE course_id=c.course_id AND module_key='intro')
      WHERE course_id=c.course_id AND lesson_order=1 AND section_id IS NULL AND is_published AND NOT is_deleted;
    FOR part IN SELECT * FROM (VALUES
      ('core-1',2,CASE WHEN c.course_key='oop' THEN 5 WHEN c.course_key='excel' THEN 3 ELSE 1+ceil((c.n-1)/2.0)::int END,
       CASE WHEN c.course_key='oop' THEN 'Lớp, đóng gói và tổ chức đối tượng' WHEN c.course_key='excel' THEN 'Bảng dữ liệu và công thức' ELSE 'Chủ đề nền tảng' END),
      ('core-2',CASE WHEN c.course_key='oop' THEN 6 WHEN c.course_key='excel' THEN 4 ELSE 2+ceil((c.n-1)/2.0)::int END,
       CASE WHEN c.course_key='oop' THEN 8 WHEN c.course_key='excel' THEN 6 ELSE c.n END,
       CASE WHEN c.course_key='oop' THEN 'Kế thừa, đa hình và interface' WHEN c.course_key='excel' THEN 'Ngân sách và kiểm tra lỗi' ELSE 'Chủ đề vận dụng' END),
      ('core-3',CASE WHEN c.course_key='oop' THEN 9 WHEN c.course_key='excel' THEN 7 ELSE c.n+1 END,c.n,
       CASE WHEN c.course_key='oop' THEN 'Thiết kế hướng đối tượng' ELSE 'Báo cáo bán hàng và tổng hợp' END)
    ) AS v(key,first_lesson,last_lesson,title) WHERE first_lesson<=last_lesson
    LOOP
      SELECT COALESCE(max(section_order),0)+1 INTO position FROM lms.course_sections WHERE course_id=c.course_id;
      start_week := NULL; end_week := NULL;
      IF c.course_key NOT IN ('word','excel','powerpoint','digital','digital-literacy') THEN
        start_week := part.first_lesson-1; end_week := part.last_lesson-1;
      END IF;
      INSERT INTO lms.course_sections(course_id,section_order,title,module_key,module_type,is_required,week_start,week_end,outcomes)
      SELECT c.course_id,position,part.title,part.key,
        CASE WHEN start_week IS NULL THEN 'TASK' ELSE 'CONTENT' END,
        (c.course_key='oop' AND part.key='core-2') OR (c.course_key='excel' AND part.key='core-1'),
        start_week,end_week,COALESCE(jsonb_agg('Vận dụng nội dung: '||title ORDER BY lesson_order),'[]'::jsonb)
      FROM lms.lessons WHERE course_id=c.course_id AND is_published AND NOT is_deleted
        AND lesson_order BETWEEN part.first_lesson AND part.last_lesson
      ON CONFLICT(course_id,module_key) DO NOTHING;
      SELECT section_id INTO sid FROM lms.course_sections WHERE course_id=c.course_id AND module_key=part.key;
      UPDATE lms.lessons SET section_id=sid WHERE course_id=c.course_id AND is_published AND NOT is_deleted
        AND lesson_order BETWEEN part.first_lesson AND part.last_lesson
        AND (section_id IS NULL OR section_id=(SELECT section_id FROM lms.course_sections
          WHERE course_id=c.course_id AND module_key='intro'));
    END LOOP;
  END LOOP;
END $modules$;

INSERT INTO assessment.course_assignments(course_id,section_id,assignment_key,title,instructions,rubric)
SELECT cc.course_id,s.section_id,v.assignment_key,v.title,v.instructions,v.rubric::jsonb
FROM (VALUES
 ('oop','core-2','inheritance-lab','Thực hành C# — Kế thừa và đa hình',
  'Dựa trên bài Kế thừa, Đa hình và Interface, mở rộng ví dụ đã học bằng hai lớp triển khai khác nhau. Nộp mã nguồn hoặc liên kết và giải thích kết quả chạy cùng ít nhất hai ca kiểm thử.',
  '[{"id":"inheritance","label":"Quan hệ lớp cha/con đúng","skill":"inheritance","max":4,"min":2},{"id":"polymorphism","label":"Gọi hành vi đa hình","skill":"polymorphism","max":4,"min":2},{"id":"tests","label":"Minh chứng kiểm thử","skill":"oop-testing","max":2,"min":0}]'),
 ('excel','core-1','formula-lab','Thực hành Excel — Bảng và công thức',
  'Dùng dữ liệu ở bài công thức để lập bảng, tính thành tiền và tổng. Minh họa một ô tham chiếu tuyệt đối. Nộp tệp XLSX để giảng viên kiểm tra công thức.',
  '[{"id":"table","label":"Kiểu dữ liệu và cấu trúc bảng","skill":"excel-tables","max":3,"min":1},{"id":"formulas","label":"Công thức và tham chiếu ô","skill":"excel-formulas","max":5,"min":3},{"id":"checks","label":"Đối chiếu kết quả","skill":"excel-checks","max":2,"min":0}]'),
 ('excel',NULL,'final-practical','Sản phẩm cuối khóa — Báo cáo bán hàng',
  'Dùng tệp thực hành của dự án báo cáo bán hàng mini. Nộp bảng tính XLSX có dữ liệu, công thức, tổng hợp theo nhóm và kết quả đối chiếu khi thêm một dòng.',
  '[{"id":"data","label":"Bảng dữ liệu kiểm tra được","skill":"excel-tables","max":3,"min":2},{"id":"formulas","label":"Công thức đúng, cập nhật được","skill":"excel-formulas","max":4,"min":2},{"id":"report","label":"Tổng hợp theo nhóm và đối chiếu","skill":"excel-reporting","max":3,"min":2}]')
) AS v(course_key,module_key,assignment_key,title,instructions,rubric)
JOIN lms.curated_courses cc ON cc.course_key=v.course_key
LEFT JOIN lms.course_sections s ON s.course_id=cc.course_id AND s.module_key=v.module_key
WHERE v.module_key IS NULL OR s.section_id IS NOT NULL
ON CONFLICT(course_id,assignment_key) DO NOTHING;

DO $module_quizzes$
DECLARE sample record; target record; quiz bigint; question bigint; item jsonb; n integer; i integer;
BEGIN
  FOR sample IN SELECT * FROM (VALUES
    ('oop',8,'Kiểm tra mô-đun — Kế thừa và đa hình','[
      {"text":"Trong C#, từ khóa nào dùng để cài đặt lại phương thức virtual của lớp cha?","skill":"polymorphism","options":["override","static","readonly"]},
      {"text":"Một XeMay là một Xe. Quan hệ này phù hợp nhất với cơ chế nào?","skill":"inheritance","options":["Kế thừa","Tham chiếu ô","Nạp chồng constructor"]},
      {"text":"Nếu B : A và constructor A nhận một mã bắt buộc, lớp B truyền mã cho A bằng cú pháp nào?","skill":"inheritance","options":["base(mã)","this.mã()","static(mã)"]}
    ]'),
    ('excel',3,'Kiểm tra mô-đun — Bảng và công thức','[
      {"text":"Trong Excel, ô B2 là số lượng, C2 là đơn giá. Công thức thành tiền ở D2 là gì?","skill":"excel-formulas","options":["=B2*C2","=B2+C2","=SUM(B2:C2)"]},
      {"text":"Để cố định cả hàng lẫn cột của ô G3 khi sao chép, dùng tham chiếu nào?","skill":"excel-formulas","options":["$G$3","G3","G$3"]},
      {"text":"Để tính tổng chính xác, cột số tiền nên lưu dưới kiểu nào?","skill":"excel-tables","options":["Số, có thể định dạng tiền tệ","Văn bản gõ thêm chữ đồng","Ngày tháng"]}
    ]')
  ) v(course_key,lesson_order,title,questions)
  LOOP
    SELECT l.lesson_id,l.course_id INTO target FROM lms.lessons l JOIN lms.curated_courses cc USING(course_id)
    WHERE cc.course_key=sample.course_key AND l.lesson_order=sample.lesson_order AND l.is_published AND NOT l.is_deleted;
    IF NOT FOUND OR EXISTS (SELECT 1 FROM assessment.quizzes WHERE lesson_id=target.lesson_id AND is_published AND NOT is_deleted) THEN
      CONTINUE;
    END IF;
    INSERT INTO assessment.quizzes(course_id,lesson_id,title,description,time_limit_seconds,passing_score,max_attempts,is_published)
    VALUES(target.course_id,target.lesson_id,sample.title,'Câu kiểm tra vận dụng học liệu trong mô-đun VEDU.',600,7,10,true)
    RETURNING quiz_id INTO quiz;
    n:=0;
    FOR item IN SELECT value FROM jsonb_array_elements(sample.questions::jsonb) LOOP
      n:=n+1;
      INSERT INTO assessment.questions(quiz_id,question_text,question_type,question_order,points)
      VALUES(quiz,item->>'text','SINGLE_CHOICE',n,1) RETURNING question_id INTO question;
      INSERT INTO assessment.question_skills VALUES(question,item->>'skill');
      FOR i IN 0..2 LOOP
        INSERT INTO assessment.answers(question_id,answer_text,is_correct,answer_order)
        VALUES(question,item->'options'->>i,i=0,1+((i+n)%3));
      END LOOP;
    END LOOP;
  END LOOP;
END $module_quizzes$;

INSERT INTO assessment.question_skills(question_id,skill)
SELECT question_id,
  CASE WHEN cc.course_key='oop' THEN CASE WHEN question_order=10 THEN 'inheritance'
    WHEN question_order BETWEEN 11 AND 14 THEN 'polymorphism' ELSE 'oop-design' END
  ELSE CASE WHEN question_order IN (1,2,5,6,7) THEN 'excel-formulas'
    WHEN question_order=8 THEN 'excel-tables' ELSE 'excel-reporting' END END
FROM assessment.questions JOIN assessment.quizzes q USING(quiz_id)
JOIN lms.curated_courses cc USING(course_id)
WHERE cc.course_key IN ('oop','excel') AND q.lesson_id IS NULL AND q.is_published AND NOT q.is_deleted
ON CONFLICT(question_id) DO NOTHING;

UPDATE lms.lesson_pedagogy p SET skills = CASE
  WHEN cc.course_key='oop' AND l.lesson_order=6 THEN '["inheritance"]'
  WHEN cc.course_key='oop' AND l.lesson_order IN (7,8) THEN '["polymorphism"]'
  WHEN cc.course_key='oop' THEN '["oop-design"]'
  WHEN l.lesson_order=2 THEN '["excel-tables"]'
  WHEN l.lesson_order BETWEEN 3 AND 6 THEN '["excel-formulas","excel-checks"]'
  ELSE '["excel-reporting"]' END::jsonb
FROM lms.lessons l JOIN lms.curated_courses cc USING(course_id)
WHERE p.lesson_id=l.lesson_id AND cc.course_key IN ('oop','excel') AND l.lesson_order>1;

UPDATE lms.course_overviews o SET practice_note=CASE c.final_mode
  WHEN 'MCQ_ONLY' THEN 'Đánh giá cuối khóa bằng trắc nghiệm. Hoạt động thực hành trong học liệu dùng để tự luyện.'
  WHEN 'MCQ_PRACTICAL' THEN 'Đạt mô-đun bắt buộc trước khi thi. Điểm cuối khóa gồm trắc nghiệm và sản phẩm thực hành do giảng viên chấm.'
  ELSE 'Điểm cuối khóa gồm trắc nghiệm và tự luận do giảng viên chấm. Nếu khóa có mô-đun bắt buộc, cần đạt mô-đun trước khi thi.' END
FROM lms.courses c JOIN lms.curated_courses cc USING(course_id) WHERE o.course_id=c.course_id;

CREATE OR REPLACE FUNCTION assessment.final_score(p_attempt bigint)
RETURNS numeric LANGUAGE sql STABLE AS $$
  SELECT CASE c.final_mode
    WHEN 'MCQ_ONLY' THEN a.score
    WHEN 'MCQ_ESSAY' THEN round((a.score*c.final_mcq_percent+s.grade*(100-c.final_mcq_percent))/100,2)
    WHEN 'MCQ_PRACTICAL' THEN round((a.score*c.final_mcq_percent+v.score*(100-c.final_mcq_percent))/100,2)
  END
  FROM assessment.quiz_attempts a JOIN lms.courses c USING(course_id)
  LEFT JOIN assessment.final_essay_submissions s USING(attempt_id)
  LEFT JOIN LATERAL (
    SELECT v.score,v.outcome FROM assessment.course_assignment_versions v
    JOIN assessment.course_assignments t USING(assignment_id)
    WHERE v.attempt_id=a.attempt_id AND v.student_id=a.student_id
      AND t.course_id=a.course_id AND t.section_id IS NULL AND v.status='GRADED'
    ORDER BY v.version_no DESC LIMIT 1
  ) v ON true
  WHERE a.attempt_id=p_attempt AND a.status IN ('GRADED','SUBMITTED')
$$;

CREATE OR REPLACE FUNCTION assessment.final_passed(p_attempt bigint)
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT COALESCE(assessment.final_score(p_attempt)>=q.passing_score AND (
    c.final_mode<>'MCQ_PRACTICAL' OR EXISTS (
      SELECT 1 FROM assessment.course_assignment_versions v JOIN assessment.course_assignments t USING(assignment_id)
      WHERE v.attempt_id=a.attempt_id AND v.student_id=a.student_id AND t.course_id=a.course_id
        AND t.section_id IS NULL AND v.status='GRADED' AND v.outcome='PASS'
    )),false)
  FROM assessment.quiz_attempts a JOIN assessment.quizzes q USING(quiz_id)
  JOIN lms.courses c ON c.course_id=a.course_id WHERE a.attempt_id=p_attempt
$$;

-- 04_student_workflow_ux extends this result set. Drop first so rerunning the
-- complete seed chain remains idempotent even after that extension exists.
DROP FUNCTION IF EXISTS assessment.module_results(bigint,bigint);
CREATE FUNCTION assessment.module_results(p_course bigint,p_student bigint)
RETURNS TABLE(section_id bigint,title varchar,is_required boolean,passed boolean) LANGUAGE sql STABLE AS $$
  SELECT s.section_id,s.title,s.is_required,
    (EXISTS(SELECT 1 FROM assessment.course_assignments t WHERE t.section_id=s.section_id AND t.required)
      OR EXISTS(SELECT 1 FROM assessment.quizzes q JOIN lms.lessons l USING(lesson_id)
        WHERE l.section_id=s.section_id AND l.is_published AND NOT l.is_deleted AND q.is_published AND NOT q.is_deleted))
    AND NOT EXISTS (
      SELECT 1 FROM assessment.course_assignments t WHERE t.section_id=s.section_id AND t.required
      AND NOT EXISTS (SELECT 1 FROM assessment.course_assignment_versions v
        WHERE v.assignment_id=t.assignment_id AND v.student_id=p_student AND v.outcome='PASS' AND v.status='GRADED')
    ) AND NOT EXISTS (
      SELECT 1 FROM assessment.quizzes q JOIN lms.lessons l USING(lesson_id)
      WHERE l.section_id=s.section_id AND l.is_published AND NOT l.is_deleted AND q.is_published AND NOT q.is_deleted
        AND NOT EXISTS (SELECT 1 FROM assessment.quiz_attempts a
          WHERE a.quiz_id=q.quiz_id AND a.student_id=p_student AND a.status='GRADED' AND a.score>=q.passing_score)
    )
  FROM lms.course_sections s WHERE s.course_id=p_course ORDER BY s.section_order
$$;
COMMIT;
