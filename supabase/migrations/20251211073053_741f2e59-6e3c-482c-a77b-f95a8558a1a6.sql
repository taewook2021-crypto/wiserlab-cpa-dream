-- Create scoring_results table to store user exam results
CREATE TABLE public.scoring_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subject text NOT NULL,
  exam_name text NOT NULL,
  exam_round integer NOT NULL,
  correct_count integer NOT NULL,
  total_questions integer NOT NULL,
  score_percentage numeric(5,2) NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, subject, exam_round)
);

-- Enable Row Level Security
ALTER TABLE public.scoring_results ENABLE ROW LEVEL SECURITY;

-- Users can view their own results
CREATE POLICY "Users can view their own results"
ON public.scoring_results
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own results
CREATE POLICY "Users can insert their own results"
ON public.scoring_results
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_scoring_results_user_id ON public.scoring_results(user_id);