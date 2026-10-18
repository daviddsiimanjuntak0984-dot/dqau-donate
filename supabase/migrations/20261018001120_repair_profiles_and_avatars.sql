/*
# Repair profiles schema, RLS policies, signup trigger, and avatars bucket

1. Plain-English explanation
   The app (src/App.tsx) reads and writes the `profiles` table and uploads
   profile pictures to a storage bucket named `avatars`. An earlier partial
   setup created the table but missed the `avatar_url` column, the write
   policies, the signup trigger, and the bucket. This migration completes
   the setup without touching any existing data.

2. Modified tables
   - `public.profiles`
     - ADD COLUMN `avatar_url text` (nullable) — link to the profile picture.
     - `username` is already NOT NULL + UNIQUE (verified), which the app relies on.

3. Security changes (RLS on `profiles`)
   - SELECT: public read for anyone (profiles are public showcase pages), TO anon + authenticated.
   - INSERT / UPDATE / DELETE: only the signed-in owner (auth.uid() = id).
   - RLS stays enabled — this migration never disables it.

4. Automation
   - Refresh `handle_new_user` as a SECURITY DEFINER function with a fixed search_path,
     and attach the `on_auth_user_created` trigger on auth.users so every new
     signup automatically gets a profile row.

5. Storage
   - Create the `avatars` bucket: public read, 2 MB limit, images only.
   - Policies: anyone can view avatar files; signed-in users can add/change/remove
     files only inside their own user-id folder (path must start with auth.uid()).
*/

-- 2. Column
alter table public.profiles add column if not exists avatar_url text;

-- 3. Policies (drop first so re-runs are safe)
drop policy if exists "Users can view profiles" on public.profiles;
drop policy if exists "Profiles are publicly readable" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can delete own profile" on public.profiles;

create policy "Profiles are publicly readable"
  on public.profiles for select
  to anon, authenticated
  using (true);

create policy "Users can insert own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users can delete own profile"
  on public.profiles for delete
  to authenticated
  using (auth.uid() = id);

-- 4. Trigger function + trigger
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, 'user_' || left(replace(new.id::text, '-', ''), 12))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 5. Avatars bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do nothing;

drop policy if exists "Avatars are publicly readable" on storage.objects;
drop policy if exists "Users can upload own avatars" on storage.objects;
drop policy if exists "Users can update own avatars" on storage.objects;
drop policy if exists "Users can delete own avatars" on storage.objects;

create policy "Avatars are publicly readable"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'avatars');

create policy "Users can upload own avatars"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can update own avatars"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can delete own avatars"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
