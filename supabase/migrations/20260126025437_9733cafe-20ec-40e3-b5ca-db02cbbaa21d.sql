-- 1. affiliates 테이블 (제휴자 정보)
CREATE TABLE public.affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  bank_name TEXT,
  bank_account TEXT,
  account_holder TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. referral_codes 테이블 (레퍼럴 코드)
CREATE TABLE public.referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  discount_amount INTEGER NOT NULL DEFAULT 10000,
  reward_amount INTEGER NOT NULL DEFAULT 10000,
  is_active BOOLEAN NOT NULL DEFAULT true,
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. referral_usages 테이블 (레퍼럴 사용 내역)
CREATE TABLE public.referral_usages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_code_id UUID NOT NULL REFERENCES public.referral_codes(id) ON DELETE CASCADE,
  order_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  discount_applied INTEGER NOT NULL,
  reward_amount INTEGER NOT NULL,
  is_settled BOOLEAN NOT NULL DEFAULT false,
  settled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 인덱스 생성
CREATE INDEX idx_referral_codes_affiliate_id ON public.referral_codes(affiliate_id);
CREATE INDEX idx_referral_codes_code ON public.referral_codes(code);
CREATE INDEX idx_referral_usages_referral_code_id ON public.referral_usages(referral_code_id);
CREATE INDEX idx_referral_usages_is_settled ON public.referral_usages(is_settled);
CREATE INDEX idx_referral_usages_user_id ON public.referral_usages(user_id);

-- RLS 활성화
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_usages ENABLE ROW LEVEL SECURITY;

-- affiliates RLS 정책 (관리자만 CRUD)
CREATE POLICY "Admins can manage affiliates"
ON public.affiliates
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- referral_codes RLS 정책
CREATE POLICY "Admins can manage referral codes"
ON public.referral_codes
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view active referral codes"
ON public.referral_codes
FOR SELECT
USING (is_active = true);

-- referral_usages RLS 정책
CREATE POLICY "Admins can manage referral usages"
ON public.referral_usages
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert their own referral usages"
ON public.referral_usages
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own referral usages"
ON public.referral_usages
FOR SELECT
USING (auth.uid() = user_id);

-- updated_at 트리거 추가
CREATE TRIGGER update_affiliates_updated_at
BEFORE UPDATE ON public.affiliates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();