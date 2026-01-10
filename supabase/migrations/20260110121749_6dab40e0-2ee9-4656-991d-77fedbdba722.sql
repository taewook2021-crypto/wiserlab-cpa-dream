-- discount_codes 테이블에 assigned_email 컬럼 추가
-- 이 컬럼은 카카오 로그인 이메일을 저장하여 결제 시 자동 할인 적용에 사용됨
ALTER TABLE public.discount_codes ADD COLUMN assigned_email TEXT;

-- assigned_email로 빠른 검색을 위한 인덱스 추가
CREATE INDEX idx_discount_codes_assigned_email ON public.discount_codes(assigned_email);

-- 이메일로 지정된 코드 조회를 위한 정책 추가 (기존 정책과 함께 동작)
-- 사용자는 자신의 이메일로 지정된 미사용 코드를 조회할 수 있음
CREATE POLICY "Users can view codes assigned to their email"
ON public.discount_codes
FOR SELECT
USING (
  assigned_email IS NOT NULL 
  AND assigned_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  AND is_used = false
);