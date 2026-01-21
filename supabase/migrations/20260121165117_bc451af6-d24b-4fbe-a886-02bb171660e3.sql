-- 27번 문제 기존 데이터 삭제 후 26번과 동일하게 재매핑
DELETE FROM related_questions 
WHERE exam_name = 'SUMMIT' AND exam_round = 1 AND subject = 'financial_accounting' AND question_number = 27;

INSERT INTO related_questions (exam_name, exam_round, subject, question_number, related_year, related_question_number, image_path, topic) VALUES
('SUMMIT', 1, 'financial_accounting', 27, 2023, 28, '/questions/summit-1/financial/2023_28.png', '관계기업투자 - 지분법'),
('SUMMIT', 1, 'financial_accounting', 27, 2025, 27, '/questions/summit-1/financial/2025_27.png', '관계기업투자 - 지분법');