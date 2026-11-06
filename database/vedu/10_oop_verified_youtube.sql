-- OOP course-only YouTube refresh. Executes AFTER seed 06 and quiz seed 09.
-- Safe on re-run: never changes quiz/attempt data and does not delete teacher-added YouTube videos.
BEGIN;
DO $oop_video_update$
DECLARE
  c_id bigint;
  change_count integer;
BEGIN
  SELECT course_id INTO c_id FROM lms.curated_courses WHERE course_key = 'oop';
  IF c_id IS NULL THEN
    RAISE EXCEPTION 'OOP course_key=oop not found; aborting';
  END IF;
  -- Only remove the specific Microsoft-hosted MP4 resources seeded for these lessons.
  DELETE FROM lms.lesson_resources r
  USING lms.lessons l
  WHERE r.lesson_id = l.lesson_id
    AND l.course_id = c_id AND l.lesson_order IN (5, 10, 11)
    AND r.resource_type = 'VIDEO'
    AND r.resource_url LIKE 'https://videoencodingpublic-hgeaeyeba8gycee3.b01.azurefd.net/%';
  GET DIAGNOSTICS change_count = ROW_COUNT;
  RAISE NOTICE 'Removed % seeded Microsoft MP4 video resources from OOP', change_count;

  -- lesson_order 5 = Bài 04; 10 = Bài 09; 11 = Bài 10.
  -- The WHERE NOT EXISTS condition prevents duplicates if the migration is re-applied.
  INSERT INTO lms.lesson_resources(lesson_id,resource_type,title,resource_url,display_order)
  SELECT l.lesson_id,'VIDEO',v.title,v.url,v.display_order
  FROM (VALUES
    (5, 'List trong C# — HowKteam', 'https://www.youtube.com/watch?v=p4oHYfmAvfU', 101),
    (10,'SOLID — Những nguyên lý sống còn — CodeGym', 'https://www.youtube.com/watch?v=SoNrd1wYprM',101),
    (11,'Factory Method Design Pattern — Ông Dev', 'https://www.youtube.com/watch?v=nimvrH0eruQ',101),
    (11,'Abstract Factory Design Pattern — Ông Dev', 'https://www.youtube.com/watch?v=D-envMwXBI8',102)
  ) AS v(lesson_order,title,url,display_order)
  JOIN lms.lessons l ON l.course_id=c_id AND l.lesson_order=v.lesson_order
     AND l.is_published AND NOT l.is_deleted
  WHERE NOT EXISTS (
    SELECT 1 FROM lms.lesson_resources old
    WHERE old.lesson_id=l.lesson_id AND old.resource_type='VIDEO' AND old.resource_url=v.url
  );
  GET DIAGNOSTICS change_count=ROW_COUNT;
  RAISE NOTICE 'Inserted % verified YouTube URLs into OOP lessons',change_count;
  -- Validate the three target lessons exist: no silent success against the wrong data.
  IF (SELECT COUNT(*) FROM lms.lessons
      WHERE course_id=c_id AND lesson_order IN(5,10,11) AND is_published AND NOT is_deleted)<>3 THEN
    RAISE EXCEPTION 'Missing OOP lessons 04,09,10; rolling back';
  END IF;
END $oop_video_update$;
COMMIT;
