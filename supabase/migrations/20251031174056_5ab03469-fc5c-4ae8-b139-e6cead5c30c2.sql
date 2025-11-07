-- Fix 1: Remove role from profiles table and create proper user_roles system

-- First, drop all policies that depend on the role column
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can manage NGOs" ON public.ngos;
DROP POLICY IF EXISTS "Admins can view all donations" ON public.donations;
DROP POLICY IF EXISTS "Admins can manage impact metrics" ON public.impact_metrics;

-- Now we can safely drop the role column from profiles
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;

-- Add length constraints to profiles table (skip if already exists)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'full_name_length') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT full_name_length CHECK (char_length(full_name) <= 100);
  END IF;
END $$;

-- Create enum for user roles (skip if already exists)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'user');
  END IF;
END $$;

-- Create user_roles table with proper access control
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  assigned_by UUID REFERENCES auth.users(id),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles table
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Only admins can assign roles" ON public.user_roles;
CREATE POLICY "Only admins can assign roles"
  ON public.user_roles
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Recreate policies using security definer function (fixes RLS recursion issue)

-- Categories table policies
CREATE POLICY "Admins can manage categories"
  ON public.categories
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- NGOs table policies
CREATE POLICY "Admins can manage NGOs"
  ON public.ngos
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Donations table policies
CREATE POLICY "Admins can view all donations"
  ON public.donations
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Impact metrics table policies
CREATE POLICY "Admins can manage impact metrics"
  ON public.impact_metrics
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Fix 2: Add server-side input validation constraints

-- Donations table validation
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'donation_amount_positive') THEN
    ALTER TABLE public.donations ADD CONSTRAINT donation_amount_positive CHECK (amount > 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'donation_amount_reasonable') THEN
    ALTER TABLE public.donations ADD CONSTRAINT donation_amount_reasonable CHECK (amount <= 1000000);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'donation_message_length') THEN
    ALTER TABLE public.donations ADD CONSTRAINT donation_message_length CHECK (char_length(message) <= 1000);
  END IF;
END $$;

-- NGOs table validation
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ngo_name_length') THEN
    ALTER TABLE public.ngos ADD CONSTRAINT ngo_name_length CHECK (char_length(name) BETWEEN 1 AND 200);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ngo_description_length') THEN
    ALTER TABLE public.ngos ADD CONSTRAINT ngo_description_length CHECK (char_length(description) <= 2000);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ngo_location_length') THEN
    ALTER TABLE public.ngos ADD CONSTRAINT ngo_location_length CHECK (char_length(location) <= 200);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ngo_email_format') THEN
    ALTER TABLE public.ngos ADD CONSTRAINT ngo_email_format CHECK (contact_email IS NULL OR contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ngo_website_format') THEN
    ALTER TABLE public.ngos ADD CONSTRAINT ngo_website_format CHECK (website IS NULL OR website ~* '^https?://');
  END IF;
END $$;

-- Categories table validation
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'category_name_length') THEN
    ALTER TABLE public.categories ADD CONSTRAINT category_name_length CHECK (char_length(name) BETWEEN 1 AND 100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'category_description_length') THEN
    ALTER TABLE public.categories ADD CONSTRAINT category_description_length CHECK (char_length(description) <= 500);
  END IF;
END $$;

-- Impact metrics validation
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'metric_name_length') THEN
    ALTER TABLE public.impact_metrics ADD CONSTRAINT metric_name_length CHECK (char_length(metric_name) BETWEEN 1 AND 100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'metric_value_positive') THEN
    ALTER TABLE public.impact_metrics ADD CONSTRAINT metric_value_positive CHECK (metric_value >= 0);
  END IF;
END $$;

-- Update the handle_new_user function to assign default 'user' role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  
  -- Assign default 'user' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user');
  
  RETURN new;
END;
$$;