-- 서울대/연세대 무료배포 수험번호 160개 삭제
DELETE FROM exam_numbers WHERE batch_name IN ('SNU-무료배포', 'YSU-무료배포');