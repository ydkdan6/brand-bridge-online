
-- Insert an admin user directly into the auth.users table and users table
-- Note: This creates a user with email 'admin@priscillamarket.com' and password 'AdminPass123!'

-- First, let's insert into auth.users (Supabase's auth table)
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'admin@priscillamarket.com',
  crypt('AdminPass123!', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Admin User"}',
  false,
  'authenticated'
);

-- Now insert the corresponding user profile with admin role
INSERT INTO public.users (
  auth_id,
  email,
  name,
  role,
  is_verified,
  is_active
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'admin@priscillamarket.com'),
  'admin@priscillamarket.com',
  'Admin User',
  'admin',
  true,
  true
);
