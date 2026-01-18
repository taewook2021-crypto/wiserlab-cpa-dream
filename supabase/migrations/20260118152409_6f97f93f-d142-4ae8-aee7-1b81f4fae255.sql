-- Create table for storing question-to-past-question mappings
CREATE TABLE public.related_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_name TEXT NOT NULL,
  exam_round INTEGER NOT NULL,
  subject public.exam_subject NOT NULL,
  question_number INTEGER NOT NULL,
  related_year INTEGER NOT NULL,
  related_question_number INTEGER NOT NULL,
  image_path TEXT NOT NULL,
  topic TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient lookups
CREATE INDEX idx_related_questions_lookup ON public.related_questions (exam_name, exam_round, subject, question_number);

-- Enable RLS
ALTER TABLE public.related_questions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read related questions (public data)
CREATE POLICY "Anyone can view related questions"
ON public.related_questions
FOR SELECT
USING (true);

-- Only admins can manage related questions
CREATE POLICY "Admins can manage related questions"
ON public.related_questions
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert initial data for questions 10, 12, 13
INSERT INTO public.related_questions (exam_name, exam_round, subject, question_number, related_year, related_question_number, image_path, topic)
VALUES
  -- 10번 문제 연관
  ('SUMMIT', 1, 'financial_accounting', 10, 2024, 13, '/questions/summit-1/financial/2024_13.png', '충당부채 - 제품보증충당부채'),
  -- 12번 문제 연관
  ('SUMMIT', 1, 'financial_accounting', 12, 2021, 6, '/questions/summit-1/financial/2021_6.png', '금융자산 - 사업모형 변경'),
  -- 13번 문제 연관
  ('SUMMIT', 1, 'financial_accounting', 13, 2021, 12, '/questions/summit-1/financial/2021_12.png', '확정급여제도 - 순확정급여자산'),
  ('SUMMIT', 1, 'financial_accounting', 13, 2023, 14, '/questions/summit-1/financial/2023_14.png', '확정급여제도 - 총포괄이익');