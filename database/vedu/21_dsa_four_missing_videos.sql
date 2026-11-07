\set ON_ERROR_STOP on
BEGIN;
DO $dsa_four_videos$
DECLARE
  target_course bigint;
  rec record;
  updated_rows int := 0;
  inserted_rows int := 0;
  affected int;
BEGIN
  SELECT course_id INTO target_course FROM lms.curated_courses WHERE course_key='dsa';
  IF target_course IS NULL THEN RAISE EXCEPTION 'DSA not found'; END IF;

  IF (SELECT count(*) FROM lms.lessons l JOIN lms.course_sections s ON s.section_id=l.section_id
      WHERE l.course_id=target_course AND s.module_key<>'intro' AND l.is_published AND NOT l.is_deleted) <> 10 THEN
    RAISE EXCEPTION 'Expected 10 active DSA lessons';
  END IF;

  FOR rec IN
    WITH numbered AS (
      SELECT l.lesson_id, l.title, row_number() OVER(ORDER BY l.lesson_order,l.lesson_id) AS rn
      FROM lms.lessons l JOIN lms.course_sections s ON s.section_id=l.section_id
      WHERE l.course_id=target_course AND s.module_key<>'intro' AND l.is_published AND NOT l.is_deleted
    )
    SELECT n.lesson_id,n.title,n.rn,v.topic,v.url
    FROM numbered n
    JOIN (VALUES
      (4,'Mảng và danh sách tuyến tính','https://www.youtube.com/watch?v=rI__qzRXKpQ'),
      (5,'Danh sách liên kết','https://www.youtube.com/watch?v=FfcXdp_KS98'),
      (6,'Ngăn xếp (Stack)','https://www.youtube.com/watch?v=PMs-IUjZoag'),
      (7,'Hàng đợi (Queue)','https://www.youtube.com/watch?v=9yytlPu-DKM')
    ) AS v(rn,topic,url) ON v.rn=n.rn
  LOOP
    IF trim(regexp_replace(rec.title, '^\s*[0-9]+\s*[.·:–-]\s*','')) <> rec.topic THEN
      RAISE EXCEPTION 'DSA lesson % title unexpected: %',rec.rn,rec.title;
    END IF;
    -- Convert an exact matching original source link into a playable VIDEO.
    UPDATE lms.lesson_resources
       SET resource_type='VIDEO',
           title='Video DSA - ' || rec.topic
     WHERE lesson_id=rec.lesson_id
       AND resource_url IN (rec.url, rec.url || '&list=PLNz_ygAlIfQM&index=' || rec.rn)
       AND resource_type <> 'VIDEO';
    GET DIAGNOSTICS affected = ROW_COUNT;
    updated_rows := updated_rows + affected;

    -- If old link is missing, add one video; never duplicate exact URL/video.
    IF NOT EXISTS (
       SELECT 1 FROM lms.lesson_resources
       WHERE lesson_id=rec.lesson_id AND resource_type='VIDEO'
         AND (resource_url=rec.url OR resource_url LIKE rec.url || '&%')
    ) THEN
      INSERT INTO lms.lesson_resources(lesson_id,resource_type,title,resource_url,display_order)
      VALUES(rec.lesson_id,'VIDEO','Video DSA - ' || rec.topic,rec.url,
          (SELECT coalesce(max(display_order),0)+1 FROM lms.lesson_resources WHERE lesson_id=rec.lesson_id));
      inserted_rows := inserted_rows + 1;
    END IF;
  END LOOP;
  RAISE NOTICE 'DSA 04-07: converted %, inserted % video resources',updated_rows,inserted_rows;
END $dsa_four_videos$;
COMMIT;
