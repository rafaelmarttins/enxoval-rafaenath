-- Create profiles table for storing basic user info
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Policies: users can manage only their own profile
create policy "Users can view own profile"
  on public.profiles
  for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles
  for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles
  for update
  using (auth.uid() = id);

-- Generic function to auto-update updated_at columns
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create enxoval_items table to store registry items per user
create table if not exists public.enxoval_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  categoria text not null,
  prioridade text not null,
  status text not null,
  quantidade_desejada integer not null default 1,
  quantidade_adquirida integer not null default 0,
  valor_unitario numeric(12,2),
  loja text,
  observacoes text,
  image_url text,
  product_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.enxoval_items enable row level security;

-- RLS: each user only accesses their own items
create policy "Users can view own items"
  on public.enxoval_items
  for select
  using (auth.uid() = user_id);

create policy "Users can insert own items"
  on public.enxoval_items
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update own items"
  on public.enxoval_items
  for update
  using (auth.uid() = user_id);

create policy "Users can delete own items"
  on public.enxoval_items
  for delete
  using (auth.uid() = user_id);

-- Trigger to keep updated_at in sync for enxoval_items
create or replace trigger set_enxoval_items_updated_at
before update on public.enxoval_items
for each row
execute function public.set_updated_at();