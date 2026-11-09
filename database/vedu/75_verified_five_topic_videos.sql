\set ON_ERROR_STOP on
BEGIN;
DO $fix$
DECLARE x jsonb; actual text; n int:=0; existing int;
BEGIN
 FOR x IN SELECT value FROM jsonb_array_elements($JSON$[{"course_id": 54, "lesson_id": 220, "lesson_order": 7, "lesson_title": "06 · BranchCache", "url": "https://www.youtube.com/watch?v=zq11EoNnZUA", "resource_title": "BTNHD - Cấu hình BranchCache trên Windows Server 2016 (tiếng Anh, bổ trợ)", "language": "en supplementary", "notes": "Bổ trợ phần triển khai, đọc PDF tiếng Việt để học cơ chế và mô hình"}, {"course_id": 53, "lesson_id": 209, "lesson_order": 7, "lesson_title": "06 · GTS và tô màu đồ thị", "url": "https://www.youtube.com/watch?v=el-9xybFaoE", "resource_title": "Đoàn Vũ Thịnh - Tô màu đồ thị (tiếng Việt)", "language": "vi partial", "notes": "Phần tô màu đồ thị, GTS sử dụng PDF để học thêm"}, {"course_id": 51, "lesson_id": 191, "lesson_order": 2, "lesson_title": "01 · Tổng quan dữ liệu lớn", "url": "https://www.youtube.com/watch?v=w91y_WB-klo", "resource_title": "Tri Thức Nhân Loại - Big Data là gì? (tiếng Việt)", "language": "vi partial", "notes": "Video nhập môn về Big Data, cần PDF bổ sung kiến trúc chi tiết"}, {"course_id": 49, "lesson_id": 174, "lesson_order": 6, "lesson_title": "05 · MySQL nâng cao", "url": "https://www.youtube.com/watch?v=saZr66o5zNw", "resource_title": "Lê Vũ Nguyên - Hướng dẫn sử dụng Index trong MySQL (tiếng Việt)", "language": "vi partial", "notes": "Video chỉ bao quát index và tối ưu truy vấn, PDF bổ sung join và transaction"}, {"course_id": 62, "lesson_id": 288, "lesson_order": 7, "lesson_title": "06 · Thiết kế lớp và dữ liệu", "url": "https://www.youtube.com/watch?v=XFkPGQ5MJ1Q", "resource_title": "Việt Trần - Class Diagram UML trong thiết kế phần mềm (tiếng Việt)", "language": "vi partial", "notes": "Video Class Diagram, PDF bổ sung thiết kế dữ liệu"}]$JSON$::jsonb) LOOP
  SELECT l.title INTO actual FROM lms.lessons l WHERE l.lesson_id=(x->>'lesson_id')::bigint
    AND l.course_id=(x->>'course_id')::bigint AND l.lesson_order=(x->>'lesson_order')::int
    AND l.is_published AND NOT l.is_deleted;
  IF actual IS NULL OR btrim(regexp_replace(actual,'[[:space:]]+',' ','g')) IS DISTINCT FROM x->>'lesson_title' THEN
    RAISE EXCEPTION 'Lesson mismatch id=%, db=%, expected=%', x->>'lesson_id',actual,x->>'lesson_title';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM lms.lesson_resources r WHERE r.lesson_id=(x->>'lesson_id')::bigint
      AND r.resource_type='VIDEO' AND r.resource_url=x->>'url') THEN
    IF EXISTS (SELECT 1 FROM lms.lesson_resources r WHERE r.lesson_id=(x->>'lesson_id')::bigint
      AND r.resource_type='LINK' AND r.resource_url=x->>'url') THEN
      UPDATE lms.lesson_resources SET resource_type='VIDEO' WHERE lesson_id=(x->>'lesson_id')::bigint
       AND resource_type='LINK' AND resource_url=x->>'url';
    ELSE
      INSERT INTO lms.lesson_resources(lesson_id,resource_type,title,resource_url,display_order)
      VALUES((x->>'lesson_id')::bigint,'VIDEO',x->>'resource_title',x->>'url',
       (SELECT COALESCE(MAX(display_order),0)+1 FROM lms.lesson_resources WHERE lesson_id=(x->>'lesson_id')::bigint));
    END IF;
    n:=n+1;
  END IF;
  SELECT COUNT(*) INTO existing FROM lms.lesson_resources WHERE lesson_id=(x->>'lesson_id')::bigint
    AND resource_type='VIDEO' AND resource_url=x->>'url';
  IF existing<>1 THEN RAISE EXCEPTION 'Expected one VIDEO, found % for lesson %',existing,x->>'lesson_id'; END IF;
  RAISE NOTICE 'Validated VIDEO lesson %: %',x->>'lesson_id',actual;
 END LOOP;
 RAISE NOTICE 'Added/promoted % migration75 lesson-specific VIDEO rows',n;
END $fix$;
COMMIT;
