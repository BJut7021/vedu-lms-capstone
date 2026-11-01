-- Demo-only data for the local Docker environment.
-- Credentials: student@vedu.local / Demo@123

DO $$
DECLARE
    v_teacher_id BIGINT;
    v_student_id BIGINT;
    v_course_web_id BIGINT;
    v_course_data_id BIGINT;
    v_course_db_id BIGINT;
    v_lesson_intro_id BIGINT;
    v_lesson_react_id BIGINT;
    v_lesson_quiz_id BIGINT;
    v_quiz_id BIGINT;
    v_question_id BIGINT;
BEGIN
    SELECT user_id INTO v_teacher_id
    FROM auth.users
    WHERE lower(email) = 'teacher@vedu.local';

    IF v_teacher_id IS NULL THEN
        SELECT auth.fn_create_user(
            'Nguyễn Hoàng Phúc',
            'teacher@vedu.local',
            crypt('Demo@123', gen_salt('bf', 10)),
            'TEACHER'
        ) INTO v_teacher_id;
    END IF;

    SELECT user_id INTO v_student_id
    FROM auth.users
    WHERE lower(email) = 'student@vedu.local';

    IF v_student_id IS NULL THEN
        SELECT auth.fn_create_user(
            'Học viên Demo',
            'student@vedu.local',
            crypt('Demo@123', gen_salt('bf', 10)),
            'STUDENT'
        ) INTO v_student_id;
    END IF;

    INSERT INTO lms.courses(
        course_name, description, teacher_id, price, status, thumbnail_url
    ) VALUES (
        'Lập trình Web với React và Node.js',
        'Khóa học full-stack minh họa luồng React - NestJS - PostgreSQL của Vedu LMS.',
        v_teacher_id, 0, 'PUBLISHED',
        'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=900&auto=format&fit=crop&q=80'
    ) RETURNING course_id INTO v_course_web_id;

    INSERT INTO lms.courses(
        course_name, description, teacher_id, price, status, thumbnail_url
    ) VALUES (
        'Khai phá dữ liệu chuỗi hành vi với HUSPM',
        'Nhập môn chuỗi hành vi học tập, utility và pipeline khai phá mẫu tuần tự.',
        v_teacher_id, 0, 'PUBLISHED',
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=900&auto=format&fit=crop&q=80'
    ) RETURNING course_id INTO v_course_data_id;

    INSERT INTO lms.courses(
        course_name, description, teacher_id, price, status, thumbnail_url
    ) VALUES (
        'PostgreSQL và thiết kế dữ liệu LMS',
        'Thiết kế schema theo domain, ràng buộc toàn vẹn, index, function và trigger.',
        v_teacher_id, 0, 'PUBLISHED',
        'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=900&auto=format&fit=crop&q=80'
    ) RETURNING course_id INTO v_course_db_id;

    INSERT INTO lms.lessons(
        course_id, title, content, lesson_order, estimated_duration_seconds
    ) VALUES (
        v_course_web_id,
        '1. Giới thiệu kiến trúc Vedu LMS',
        'Frontend React gọi REST API NestJS; PostgreSQL là nguồn dữ liệu bền vững.',
        1, 760
    ) RETURNING lesson_id INTO v_lesson_intro_id;

    INSERT INTO lms.lesson_resources(
        lesson_id, resource_type, title, resource_url, display_order
    ) VALUES (
        v_lesson_intro_id, 'VIDEO', 'Video giới thiệu',
        'https://www.w3schools.com/html/mov_bbb.mp4', 1
    );

    INSERT INTO lms.lessons(
        course_id, title, content, lesson_order, estimated_duration_seconds
    ) VALUES (
        v_course_web_id,
        '2. React state và kết nối REST API',
        'Thực hành tải dữ liệu khóa học, xác thực và lưu tiến độ qua API.',
        2, 1080
    ) RETURNING lesson_id INTO v_lesson_react_id;

    INSERT INTO lms.lesson_resources(
        lesson_id, resource_type, title, resource_url, display_order
    ) VALUES (
        v_lesson_react_id, 'VIDEO', 'React API integration',
        'https://www.w3schools.com/html/movie.mp4', 1
    );

    INSERT INTO lms.lessons(
        course_id, title, content, lesson_order, estimated_duration_seconds
    ) VALUES (
        v_course_web_id,
        '3. Quiz kiểm tra kiến thức tích hợp',
        'Bài kiểm tra được chấm tại backend và lưu kết quả vào PostgreSQL.',
        3, 600
    ) RETURNING lesson_id INTO v_lesson_quiz_id;

    INSERT INTO lms.lessons(course_id, title, content, lesson_order, estimated_duration_seconds)
    VALUES
        (v_course_data_id, '1. Chuỗi hành vi học tập và utility', 'Khái niệm sequence, support và utility.', 1, 900),
        (v_course_data_id, '2. Pipeline HUSPM trong Vedu', 'Từ learning log đến high-utility pattern.', 2, 1200),
        (v_course_db_id, '1. Tổ chức schema theo domain', 'Tám schema nghiệp vụ trong cùng PostgreSQL database.', 1, 840),
        (v_course_db_id, '2. Ràng buộc, function và trigger', 'Bảo vệ toàn vẹn dữ liệu ở tầng cơ sở dữ liệu.', 2, 1260);

    INSERT INTO assessment.quizzes(
        course_id, lesson_id, title, description, time_limit_seconds,
        passing_score, max_attempts
    ) VALUES (
        v_course_web_id, v_lesson_quiz_id,
        'Kiểm tra luồng tích hợp Vedu LMS',
        'Quiz demo được tải từ PostgreSQL và chấm bởi NestJS.',
        600, 7, 99
    ) RETURNING quiz_id INTO v_quiz_id;

    INSERT INTO assessment.questions(
        quiz_id, question_text, question_type, question_order, points
    ) VALUES (
        v_quiz_id,
        'Frontend Vedu dùng công nghệ nào trong bản demo?',
        'SINGLE_CHOICE', 1, 1
    ) RETURNING question_id INTO v_question_id;
    INSERT INTO assessment.answers(question_id, answer_text, is_correct, answer_order) VALUES
        (v_question_id, 'React', TRUE, 1),
        (v_question_id, 'Flutter', FALSE, 2),
        (v_question_id, 'Laravel Blade', FALSE, 3),
        (v_question_id, 'Django Template', FALSE, 4);

    INSERT INTO assessment.questions(
        quiz_id, question_text, question_type, question_order, points
    ) VALUES (
        v_quiz_id,
        'Thành phần nào là nguồn dữ liệu bền vững và nguồn sự thật chính?',
        'SINGLE_CHOICE', 2, 1
    ) RETURNING question_id INTO v_question_id;
    INSERT INTO assessment.answers(question_id, answer_text, is_correct, answer_order) VALUES
        (v_question_id, 'localStorage của trình duyệt', FALSE, 1),
        (v_question_id, 'PostgreSQL', TRUE, 2),
        (v_question_id, 'File mockData.js', FALSE, 3),
        (v_question_id, 'Redis cache', FALSE, 4);

    INSERT INTO assessment.questions(
        quiz_id, question_text, question_type, question_order, points
    ) VALUES (
        v_quiz_id,
        'Khi học viên nộp quiz, thành phần nào chấm điểm và lưu kết quả?',
        'SINGLE_CHOICE', 3, 1
    ) RETURNING question_id INTO v_question_id;
    INSERT INTO assessment.answers(question_id, answer_text, is_correct, answer_order) VALUES
        (v_question_id, 'Frontend tự sửa trực tiếp database', FALSE, 1),
        (v_question_id, 'Nginx', FALSE, 2),
        (v_question_id, 'Backend NestJS', TRUE, 3),
        (v_question_id, 'Docker Desktop', FALSE, 4);

    PERFORM enrollment.fn_enroll_student(v_student_id, v_course_web_id, 0);
    PERFORM enrollment.fn_enroll_student(v_student_id, v_course_data_id, 0);
    PERFORM enrollment.fn_enroll_student(v_student_id, v_course_db_id, 0);
END;
$$;
