-- Create profiles table (linked to Supabase Auth)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  email text unique not null,
  role text check (role in ('user', 'admin')) default 'user',
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Create policies for profiles
create policy "Users can view their own profile" 
on public.profiles 
for select 
using (auth.uid() = id);

create policy "Users can update their own profile" 
on public.profiles 
for update 
using (auth.uid() = id);

create policy "Users can insert their own profile" 
on public.profiles 
for insert 
with check (auth.uid() = id);

-- Create categories table
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  description text,
  created_at timestamp with time zone default now()
);

-- Enable RLS for categories
alter table public.categories enable row level security;

-- Categories are publicly viewable
create policy "Categories are viewable by everyone" 
on public.categories 
for select 
using (true);

-- Only admins can manage categories
create policy "Admins can manage categories" 
on public.categories 
for all 
using (
  exists (
    select 1 from public.profiles 
    where id = auth.uid() and role = 'admin'
  )
);

-- Create NGOs table
create table public.ngos (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  category_id uuid references public.categories(id) on delete set null,
  location text,
  contact_email text,
  contact_phone text,
  website text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default now()
);

-- Enable RLS for NGOs
alter table public.ngos enable row level security;

-- NGOs are publicly viewable
create policy "NGOs are viewable by everyone" 
on public.ngos 
for select 
using (true);

-- Only admins can manage NGOs
create policy "Admins can manage NGOs" 
on public.ngos 
for all 
using (
  exists (
    select 1 from public.profiles 
    where id = auth.uid() and role = 'admin'
  )
);

-- Create donations table
create table public.donations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  ngo_id uuid references public.ngos(id) on delete cascade,
  amount numeric(10,2) check (amount >= 0),
  message text,
  created_at timestamp with time zone default now()
);

-- Enable RLS for donations
alter table public.donations enable row level security;

-- Users can view their own donations
create policy "Users can view their own donations" 
on public.donations 
for select 
using (auth.uid() = user_id);

-- Users can create their own donations
create policy "Users can create donations" 
on public.donations 
for insert 
with check (auth.uid() = user_id);

-- Admins can view all donations
create policy "Admins can view all donations" 
on public.donations 
for select 
using (
  exists (
    select 1 from public.profiles 
    where id = auth.uid() and role = 'admin'
  )
);

-- Create impact metrics table
create table public.impact_metrics (
  id uuid primary key default gen_random_uuid(),
  ngo_id uuid references public.ngos(id) on delete cascade,
  metric_name text not null,
  metric_value integer not null,
  created_at timestamp with time zone default now()
);

-- Enable RLS for impact metrics
alter table public.impact_metrics enable row level security;

-- Impact metrics are publicly viewable
create policy "Impact metrics are viewable by everyone" 
on public.impact_metrics 
for select 
using (true);

-- Only admins can manage impact metrics
create policy "Admins can manage impact metrics" 
on public.impact_metrics 
for all 
using (
  exists (
    select 1 from public.profiles 
    where id = auth.uid() and role = 'admin'
  )
);

-- Insert sample categories
insert into public.categories (name, description) values
('Clothing', 'Donate clothes, shoes, and accessories to help those in need'),
('Education Supplies', 'Books, stationery, and educational materials for students'),
('Healthcare & Hygiene', 'Medical supplies, hygiene kits, and healthcare essentials'),
('Shelter Support', 'Blankets, mattresses, and temporary shelter materials'),
('Financial Contributions', 'Monetary donations for various NGO programs'),
('Other Essentials', 'Miscellaneous items and emergency supplies');

-- Insert sample NGOs
insert into public.ngos (name, description, category_id, location, contact_email, contact_phone, website) 
select 
  'Helping Hands Foundation',
  'Dedicated to providing educational support and supplies to underprivileged children',
  c.id,
  'Mumbai, Maharashtra',
  'contact@helpinghands.org',
  '+91-9876543210',
  'https://helpinghands.org'
from public.categories c where c.name = 'Education Supplies';

insert into public.ngos (name, description, category_id, location, contact_email, contact_phone, website) 
select 
  'Care4Health Trust',
  'Providing healthcare and hygiene support to communities in need',
  c.id,
  'Delhi, India',
  'info@care4health.org',
  '+91-9876543211',
  'https://care4health.org'
from public.categories c where c.name = 'Healthcare & Hygiene';

insert into public.ngos (name, description, category_id, location, contact_email, contact_phone, website) 
select 
  'Warm Shelter NGO',
  'Supporting homeless individuals with shelter and essential supplies',
  c.id,
  'Bangalore, Karnataka',
  'support@warmshelter.org',
  '+91-9876543212',
  'https://warmshelter.org'
from public.categories c where c.name = 'Shelter Support';

-- Create trigger function to handle new user registration
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- Create trigger for new user registration
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to update timestamps
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql set search_path = public;