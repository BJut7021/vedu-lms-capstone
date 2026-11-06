BEGIN;

DO $oop$
DECLARE
  v_course_id bigint;
BEGIN
  SELECT course_id INTO v_course_id
  FROM lms.curated_courses
  WHERE course_key = 'oop';

  IF v_course_id IS NULL THEN
    RAISE NOTICE 'OOP course is not available; refinement skipped.';
    RETURN;
  END IF;

  -- The first activity is an introduction, not a numbered learning module.
  UPDATE lms.course_sections
  SET title = 'Giới thiệu môn học', outcomes = '[]'::jsonb
  WHERE course_id = v_course_id AND module_key = 'intro';

  UPDATE lms.lessons
  SET title = 'Giới thiệu môn học',
      content = 'Chào mừng bạn đã đến với khóa học của VEDU! Hãy tiếp tục hành trình học tập.'
  WHERE course_id = v_course_id AND lesson_order = 1
    AND is_published AND NOT is_deleted;

  UPDATE lms.course_overviews
  SET outcomes = '[]'::jsonb, updated_at = now()
  WHERE course_id = v_course_id;

  UPDATE lms.lesson_resources r
  SET title = 'Đề cương và hướng dẫn môn học'
  FROM lms.lessons l
  WHERE r.lesson_id = l.lesson_id AND l.course_id = v_course_id
    AND l.lesson_order = 1 AND lower(r.title) LIKE '%chuẩn đầu ra%';

  -- Older catalog seeds attached every PDF to every lesson. Remove only the
  -- duplicated OOP PDFs; links and videos remain attached to their source lesson.
  DELETE FROM lms.lesson_resources r
  USING lms.lessons l
  WHERE r.lesson_id = l.lesson_id AND l.course_id = v_course_id
    AND r.resource_type = 'PDF';

  -- Introduction: syllabus, course rules and the original reference textbook.
  INSERT INTO lms.lesson_resources(lesson_id, resource_type, title, resource_url, display_order)
  SELECT l.lesson_id, x.resource_type, x.title, x.url, x.display_order
  FROM lms.lessons l
  CROSS JOIN (VALUES
    ('PDF', 'Đề cương chi tiết học phần Lập trình hướng đối tượng',
      'vedu-file:3a509392-ba22-e087-fdda-2a4434482e37.pdf', 10),
    ('PDF', 'Quy định học phần',
      'vedu-file:e47aa138-f98d-c68e-d374-213714bdb6b4.pdf', 20),
    ('PDF', 'Object Oriented Programming using C# — S. Kendal',
      'vedu-file:025b6f84-fcfd-ae30-ccec-02714b4582ab.pdf', 30)
  ) AS x(resource_type, title, url, display_order)
  WHERE l.course_id = v_course_id AND l.lesson_order = 1
    AND l.is_published AND NOT l.is_deleted;

  -- Chapter 00 and 01 support the C# review and OOP-method lesson.
  INSERT INTO lms.lesson_resources(lesson_id, resource_type, title, resource_url, display_order)
  SELECT l.lesson_id, 'PDF', x.title, x.url, x.display_order
  FROM lms.lessons l
  CROSS JOIN (VALUES
    ('Chương 00 — Tổng quan C#',
      'vedu-file:de591cca-3b7f-6899-1ae1-55d5e8692323.pdf', 10),
    ('Chương 01 — Phương pháp lập trình hướng đối tượng',
      'vedu-file:ea7a97b6-dae5-5a0b-90e2-67b145c8ba50.pdf', 20)
  ) AS x(title, url, display_order)
  WHERE l.course_id = v_course_id AND l.lesson_order = 2
    AND l.is_published AND NOT l.is_deleted;

  -- Class, object, constructor, static members and collections belong to chapter 02.
  INSERT INTO lms.lesson_resources(lesson_id, resource_type, title, resource_url, display_order)
  SELECT l.lesson_id, 'PDF', 'Chương 02 — Lớp và đối tượng',
    'vedu-file:eff0c0bb-211d-c006-e37e-36787a1cd2e0.pdf', 10
  FROM lms.lessons l
  WHERE l.course_id = v_course_id AND l.lesson_order BETWEEN 3 AND 5
    AND l.is_published AND NOT l.is_deleted;

  -- Inheritance, polymorphism and interfaces belong to chapter 03.
  INSERT INTO lms.lesson_resources(lesson_id, resource_type, title, resource_url, display_order)
  SELECT l.lesson_id, 'PDF', 'Chương 03 — Kế thừa và đa hình',
    'vedu-file:daca8dde-125e-6ffe-ded1-aa6d1f0e0fae.pdf', 10
  FROM lms.lessons l
  WHERE l.course_id = v_course_id AND l.lesson_order BETWEEN 6 AND 8
    AND l.is_published AND NOT l.is_deleted;

  -- The three-layer architecture PDF is used only by its matching lesson.
  INSERT INTO lms.lesson_resources(lesson_id, resource_type, title, resource_url, display_order)
  SELECT l.lesson_id, 'PDF', 'Chương 04 — Mô hình ba lớp',
    'vedu-file:347d7c41-f920-4df1-60dd-c46573880f93.pdf', 10
  FROM lms.lessons l
  WHERE l.course_id = v_course_id AND l.lesson_order = 9
    AND l.is_published AND NOT l.is_deleted;

  -- Design principles and patterns use the provided reference textbook.
  INSERT INTO lms.lesson_resources(lesson_id, resource_type, title, resource_url, display_order)
  SELECT l.lesson_id, 'PDF', 'Tài liệu tham khảo OOP với C# — phần thiết kế',
    'vedu-file:025b6f84-fcfd-ae30-ccec-02714b4582ab.pdf', 10
  FROM lms.lessons l
  WHERE l.course_id = v_course_id AND l.lesson_order BETWEEN 10 AND 11
    AND l.is_published AND NOT l.is_deleted;

  UPDATE assessment.course_assignments
  SET allowed_file_types = ARRAY['pdf','docx','zip']::text[]
  WHERE course_id = v_course_id AND assignment_key IN ('inheritance-lab', 'final-essay');
END $oop$;

COMMIT;
