-- OMR 채점 결과 저장 테이블
CREATE TABLE public.omr_scoring_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_number INTEGER NOT NULL,
  subject TEXT NOT NULL,
  exam_round INTEGER NOT NULL,
  correct_count INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  score_percentage NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.omr_scoring_results ENABLE ROW LEVEL SECURITY;

-- 관리자만 모든 작업 가능
CREATE POLICY "Admins can manage omr scoring results"
ON public.omr_scoring_results
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));