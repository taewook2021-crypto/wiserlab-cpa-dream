INSERT INTO public.user_roles (user_id, role)
VALUES ('8523b3ed-6f7e-4f90-92a7-e148470ac45f', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;