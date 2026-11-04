
CREATE OR REPLACE FUNCTION assessment.fn_validate_quiz_attempt()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    PERFORM 1
    FROM assessment.quizzes
    WHERE quiz_id = NEW.quiz_id
      AND course_id = NEW.course_id
      AND is_deleted = FALSE
      AND is_published = TRUE;

    IF NOT FOUND THEN
        RAISE EXCEPTION
            'Quiz % is unavailable for course %',
            NEW.quiz_id,
            NEW.course_id;
    END IF;

    RETURN NEW;
END;
$$;
