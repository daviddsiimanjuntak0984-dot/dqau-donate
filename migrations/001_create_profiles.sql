-- Migration: create profiles table and RLS policies for Supabase

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique not null,
  display_name text,
  bio text,
  avatar_url text,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Allow anyone to select public profiles
create policy "Allow select for profiles" on public.profiles for select using (true);

-- Allow authenticated user to insert their own profile
create policy "Allow insert for owners" on public.profiles for insert with check (auth.uid() = id);

-- Allow owners to update their profile
create policy "Allow update for owners" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- Optionally: allow owners to delete their profile
create policy "Allow delete for owners" on public.profiles for delete using (auth.uid() = id);
