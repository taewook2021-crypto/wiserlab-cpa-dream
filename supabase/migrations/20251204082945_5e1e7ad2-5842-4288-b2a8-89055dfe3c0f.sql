-- Create enum for exam subjects
CREATE TYPE public.exam_subject AS ENUM ('financial_accounting', 'tax_law');

-- Create table for exam answer keys
CREATE TABLE public.exam_answer_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_name TEXT NOT NULL,
  exam_round INTEGER NOT NULL,
  subject exam_subject NOT NULL,
  question_number INTEGER NOT NULL,
  correct_answer INTEGER NOT NULL CHECK (correct_answer >= 1 AND correct_answer <= 5),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (exam_name, exam_round, subject, question_number)
);

-- Enable RLS
ALTER TABLE public.exam_answer_keys ENABLE ROW LEVEL SECURITY;

-- Allow public read access (answer keys can be public for scoring)
CREATE POLICY "Anyone can view answer keys"
ON public.exam_answer_keys
FOR SELECT
USING (true);

-- Only authenticated users can insert/update/delete (admin functionality later)
CREATE POLICY "Authenticated users can manage answer keys"
ON public.exam_answer_keys
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);