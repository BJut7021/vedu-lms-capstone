\set ON_ERROR_STOP on
BEGIN;
DO $fix$
DECLARE n integer;
BEGIN
  -- Chỉ chuyển LINK YouTube dạng video đơn lẻ khi nhan đề resource khớp đúng tên bài.
  -- Không đổi playlist, không chèn video tự đoán, không đụng VIDEO hiện có.
  WITH eligible AS (
   SELECT r.resource_id
   FROM lms.lesson_resources r
   JOIN lms.lessons l ON l.lesson_id = r.lesson_id
   WHERE l.course_id BETWEEN 44 AND 64 AND l.lesson_order > 1
     AND l.is_published AND NOT l.is_deleted
     AND r.resource_type='LINK'
     AND (r.resource_url ~* '^https://(www\.)?youtube\.com/watch\?v=[a-zA-Z0-9_-]{11}([&#?].*)?$'
       OR r.resource_url ~* '^https://youtu\.be/[a-zA-Z0-9_-]{11}([?].*)?$')
     AND LOWER(BTRIM(REGEXP_REPLACE(r.title, '^[[:space:]]*(Video|Bài giảng video)[[:space:]:–-]*', '', 'i')))
          = LOWER(BTRIM(l.title))
     AND NOT EXISTS(SELECT 1 FROM lms.lesson_resources rv WHERE rv.lesson_id=l.lesson_id AND rv.resource_type='VIDEO')
  ), updated AS (
   UPDATE lms.lesson_resources r SET resource_type='VIDEO'
   WHERE r.resource_id IN (SELECT resource_id FROM eligible)
   RETURNING r.resource_id
  ) SELECT count(*) INTO n FROM updated;
  RAISE NOTICE 'Promoted % exactly title-matched standalone YouTube LINK(s) to VIDEO; playlists untouched', n;
END $fix$;
COMMIT;
