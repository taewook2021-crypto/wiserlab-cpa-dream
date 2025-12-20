-- 특정 사용자에게 admin 역할 부여
INSERT INTO public.user_roles (user_id, role)
VALUES ('1212fb08-8db5-4fd0-962a-1d818c36971d', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;