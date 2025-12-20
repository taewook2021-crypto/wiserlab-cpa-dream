-- 공지사항 첨부파일용 스토리지 버킷 생성
INSERT INTO storage.buckets (id, name, public)
VALUES ('notice-attachments', 'notice-attachments', true);

-- 스토리지 정책: 누구나 파일 조회 가능
CREATE POLICY "Anyone can view notice attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'notice-attachments');

-- 스토리지 정책: 관리자만 업로드 가능
CREATE POLICY "Admins can upload notice attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'notice-attachments' 
  AND public.has_role(auth.uid(), 'admin')
);

-- 스토리지 정책: 관리자만 삭제 가능
CREATE POLICY "Admins can delete notice attachments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'notice-attachments' 
  AND public.has_role(auth.uid(), 'admin')
);

-- notices 테이블에 첨부파일 URL 컬럼 추가
ALTER TABLE public.notices 
ADD COLUMN attachment_url TEXT,
ADD COLUMN attachment_name TEXT;