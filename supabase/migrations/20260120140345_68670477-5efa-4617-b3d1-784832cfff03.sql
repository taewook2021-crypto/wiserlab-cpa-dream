-- 기존 정책들 삭제
DROP POLICY IF EXISTS "Authenticated users can view discount codes" ON discount_codes;
DROP POLICY IF EXISTS "Users can view their assigned codes" ON discount_codes;

-- 새로운 PERMISSIVE 정책: 자신의 이메일로 발급된 할인코드 조회
CREATE POLICY "Users can view their assigned codes"
ON discount_codes
FOR SELECT
TO authenticated
USING (
  assigned_email IS NOT NULL 
  AND assigned_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);