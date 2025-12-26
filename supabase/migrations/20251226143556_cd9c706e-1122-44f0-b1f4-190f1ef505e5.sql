INSERT INTO public.orders (
  user_id,
  order_id,
  product_name,
  amount,
  status,
  paid_at,
  buyer_name,
  buyer_email,
  buyer_phone,
  shipping_address,
  shipping_postal_code,
  exam_number,
  payment_key
)
VALUES (
  '8523b3ed-6f7e-4f90-92a7-e148470ac45f',
  'TEST_ORDER_' || to_char(now(), 'YYYYMMDDHH24MISS'),
  'SUMMIT 전과목 PACK',
  165000,
  'paid',
  now(),
  '테스트 사용자',
  'test@example.com',
  '010-0000-0000',
  '테스트 주소',
  '00000',
  'TEST-EXAM-' || substr(md5(random()::text), 1, 8),
  'TEST_PAYMENT_KEY'
);