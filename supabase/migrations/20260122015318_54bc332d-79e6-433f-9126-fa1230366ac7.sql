-- 통계 공개 설정 테이블
CREATE TABLE public.statistics_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  exam_round INTEGER NOT NULL,
  is_released BOOLEAN DEFAULT false,
  released_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(subject, exam_round)
);

-- RLS 활성화
ALTER TABLE public.statistics_settings ENABLE ROW LEVEL SECURITY;

-- 관리자만 수정 가능
CREATE POLICY "Admins can manage statistics settings"
ON public.statistics_settings FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 인증된 사용자는 조회 가능
CREATE POLICY "Authenticated users can view statistics settings"
ON public.statistics_settings FOR SELECT
TO authenticated
USING (true);

-- updated_at 자동 갱신 트리거
CREATE TRIGGER update_statistics_settings_updated_at
BEFORE UPDATE ON public.statistics_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();