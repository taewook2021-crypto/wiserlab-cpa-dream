-- 기존의 제한적인 정책 삭제
DROP POLICY IF EXISTS "Users can view codes assigned to their email" ON discount_codes;

-- 새로운 정책: 자신의 이메일로 발급된 모든 할인코드 조회 가능 (사용 여부 상관없이)
CREATE POLICY "Users can view their assigned codes"
ON discount_codes
FOR SELECT
USING (
  assigned_email IS NOT NULL 
  AND assigned_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);