-- 특정 사용자에게 admin 역할 부여
INSERT INTO public.user_roles (user_id, role)
VALUES ('b914b9b9-a8c3-40d2-b541-8438fd0ff0dd', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;