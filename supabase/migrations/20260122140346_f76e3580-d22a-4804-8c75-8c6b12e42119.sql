UPDATE exam_answer_keys 
SET correct_answer = 5 
WHERE exam_name = 'SUMMIT' 
  AND exam_round = 1 
  AND subject = 'tax_law' 
  AND question_number = 4;