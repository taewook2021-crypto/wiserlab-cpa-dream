-- 인증된 사용자가 OMR 결과를 조회할 수 있도록 SELECT 정책 추가
CREATE POLICY "Authenticated users can view omr results for statistics"
ON omr_scoring_results FOR SELECT
TO authenticated
USING (true);