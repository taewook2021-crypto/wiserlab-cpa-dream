-- Create table for individual question answers
CREATE TABLE public.scoring_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scoring_result_id UUID NOT NULL REFERENCES public.scoring_results(id) ON DELETE CASCADE,
  question_number INTEGER NOT NULL,
  user_answer INTEGER NOT NULL,
  correct_answer INTEGER NOT NULL,
  is_correct BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure unique answer per question per scoring result
  UNIQUE(scoring_result_id, question_number)
);

-- Enable Row Level Security
ALTER TABLE public.scoring_answers ENABLE ROW LEVEL SECURITY;

-- Users can insert their own answers (via scoring_results ownership)
CREATE POLICY "Users can insert their own answers"
ON public.scoring_answers
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.scoring_results
    WHERE id = scoring_result_id AND user_id = auth.uid()
  )
  OR
  -- Allow anonymous exam number scoring
  EXISTS (
    SELECT 1 FROM public.scoring_results
    WHERE id = scoring_result_id AND user_id = '00000000-0000-0000-0000-000000000000'
  )
);

-- Users can view their own answers
CREATE POLICY "Users can view their own answers"
ON public.scoring_answers
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.scoring_results
    WHERE id = scoring_result_id AND user_id = auth.uid()
  )
);

-- Admins can view all answers
CREATE POLICY "Admins can view all answers"
ON public.scoring_answers
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Create index for faster queries
CREATE INDEX idx_scoring_answers_result_id ON public.scoring_answers(scoring_result_id);
CREATE INDEX idx_scoring_answers_question ON public.scoring_answers(question_number);