-- 수험번호 테이블 생성
CREATE TABLE public.exam_numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_number TEXT UNIQUE NOT NULL,
  batch_name TEXT NOT NULL,
  is_used BOOLEAN DEFAULT FALSE NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- RLS 활성화
ALTER TABLE public.exam_numbers ENABLE ROW LEVEL SECURITY;

-- 누구나 유효성 검증을 위해 조회 가능
CREATE POLICY "Anyone can check exam numbers"
ON public.exam_numbers
FOR SELECT
USING (true);

-- 관리자만 생성 가능
CREATE POLICY "Admins can insert exam numbers"
ON public.exam_numbers
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 관리자만 수정 가능 (사용 처리)
CREATE POLICY "Admins can update exam numbers"
ON public.exam_numbers
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- 인증된 사용자가 채점 시 사용 처리 가능
CREATE POLICY "Users can mark exam number as used"
ON public.exam_numbers
FOR UPDATE
USING (is_used = false);

-- 관리자만 삭제 가능
CREATE POLICY "Admins can delete exam numbers"
ON public.exam_numbers
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- scoring_results 테이블에 exam_number_id 컬럼 추가
ALTER TABLE public.scoring_results
ADD COLUMN exam_number_id UUID REFERENCES public.exam_numbers(id);

-- exam_number_id 인덱스 추가
CREATE INDEX idx_scoring_results_exam_number_id ON public.scoring_results(exam_number_id);