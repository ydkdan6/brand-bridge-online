
-- Create extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table with roles
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('buyer', 'seller', 'admin')) NOT NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  brand_name TEXT, -- Seller only
  address TEXT, -- Seller only
  whatsapp_number TEXT, -- Seller only, E.164 format
  calling_number1 TEXT, -- Seller only, E.164 format
  calling_number2 TEXT, -- Seller only, E.164 format
  profile_picture TEXT, -- Public URL from Supabase Storage
  is_verified BOOLEAN DEFAULT FALSE, -- Seller only
  is_active BOOLEAN DEFAULT TRUE, -- Buyer/seller
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  image_url TEXT NOT NULL, -- Public URL from Supabase Storage
  quantity INTEGER NOT NULL CHECK (quantity >= 0),
  category TEXT,
  negotiable BOOLEAN DEFAULT FALSE,
  seller_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  total_price NUMERIC NOT NULL CHECK (total_price > 0),
  payment_method TEXT CHECK (payment_method IN ('bank_transfer', 'cash')) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'completed')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create storage buckets for images
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('product-images', 'product-images', true),
  ('profile-pictures', 'profile-pictures', true);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = auth_id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = auth_id);

CREATE POLICY "Anyone can insert users during registration" ON public.users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all users" ON public.users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE auth_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for products table
CREATE POLICY "Anyone can view products from verified sellers" ON public.products
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = products.seller_id AND users.is_verified = true
    )
  );

CREATE POLICY "Sellers can manage their own products" ON public.products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = products.seller_id AND users.auth_id = auth.uid()
    )
  );

CREATE POLICY "Verified sellers can insert products" ON public.products
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = products.seller_id 
      AND users.auth_id = auth.uid() 
      AND users.is_verified = true
    )
  );

-- RLS Policies for orders table
CREATE POLICY "Users can view their own orders" ON public.orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE (users.id = orders.buyer_id OR users.id = orders.seller_id) 
      AND users.auth_id = auth.uid()
    )
  );

CREATE POLICY "Buyers can create orders" ON public.orders
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = orders.buyer_id AND users.auth_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view and manage all orders" ON public.orders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE auth_id = auth.uid() AND role = 'admin'
    )
  );

-- Storage policies for product images
CREATE POLICY "Anyone can view product images" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can upload product images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'product-images' AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update their own product images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'product-images' AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can delete their own product images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'product-images' AND auth.role() = 'authenticated'
  );

-- Storage policies for profile pictures
CREATE POLICY "Anyone can view profile pictures" ON storage.objects
  FOR SELECT USING (bucket_id = 'profile-pictures');

CREATE POLICY "Authenticated users can upload profile pictures" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'profile-pictures' AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update their own profile pictures" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'profile-pictures' AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can delete their own profile pictures" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'profile-pictures' AND auth.role() = 'authenticated'
  );

-- Create an admin user (you can change these details)
-- Note: This will be created after the first user signs up and we'll manually set their role to admin
