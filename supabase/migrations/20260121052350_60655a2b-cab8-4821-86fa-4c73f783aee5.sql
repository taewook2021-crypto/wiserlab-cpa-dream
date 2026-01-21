
-- 모든 가입자에게 유료 주문 기록 추가 (이미 유료 주문이 있는 사용자 제외)
INSERT INTO orders (
  order_id, 
  product_name, 
  amount, 
  buyer_name, 
  buyer_email, 
  buyer_phone, 
  shipping_address, 
  shipping_postal_code, 
  user_id, 
  status, 
  paid_at
)
SELECT 
  'ADMIN-GRANT-' || p.id::text,
  'SUMMIT 전과목 PACK (관리자 부여)',
  0,
  COALESCE(p.email, 'Unknown'),
  COALESCE(p.email, 'unknown@unknown.com'),
  '000-0000-0000',
  '관리자 부여',
  '00000',
  p.id,
  'paid',
  NOW()
FROM profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM orders o 
  WHERE o.user_id = p.id AND o.status = 'paid'
);
