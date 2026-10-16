-- Dqau Donate: skema awal. TINJAU dulu, lalu jalankan di Supabase > SQL Editor.
-- HANYA untuk project baru. TIDAK aman diulang: menjalankan ulang gagal dengan "already exists" (tidak menghapus data).

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_]{3,20}$'),
  display_name text not null default '' check (char_length(display_name) <= 40),
  bio text not null default '' check (char_length(bio) <= 300),
  created_at timestamptz not null default now()
);

-- Profil dibuat otomatis saat pengguna mendaftar.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, username, display_name)
  values (new.id, 'user_' || substr(replace(new.id::text, '-', ''), 1, 15), '');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  image_path text check (image_path is null or image_path like author_id::text || '/%'),
  created_at timestamptz not null default now()
);
create index posts_created_idx on public.posts (created_at desc);
create index posts_author_idx on public.posts (author_id, created_at desc);

create table public.likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)  -- mencegah like ganda
);
create index likes_user_idx on public.likes (user_id);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);
create index comments_post_idx on public.comments (post_id, created_at);

create table public.albums (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 60),
  created_at timestamptz not null default now()
);
create index albums_owner_idx on public.albums (owner_id, created_at desc);

create table public.photos (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references public.albums(id) on delete cascade,
  owner_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  path text not null check (path like owner_id::text || '/%'),
  caption text not null default '' check (char_length(caption) <= 200),
  created_at timestamptz not null default now()
);
create index photos_album_idx on public.photos (album_id, created_at desc);

-- Donasi: HANYA ditulis oleh backend (service role / Edge Function) setelah penyedia pembayaran mengonfirmasi.
create table public.donations (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid references public.profiles(id) on delete set null, -- catatan keuangan tetap disimpan saat akun dihapus
  donor_id uuid references public.profiles(id) on delete set null,
  donor_name text not null default 'Anonim' check (char_length(donor_name) <= 40),
  amount_idr integer not null check (amount_idr between 1000 and 10000000),
  message text not null default '' check (char_length(message) <= 200),
  status text not null default 'pending' check (status in ('pending','paid','failed','expired')),
  provider text,
  provider_ref text unique,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
create index donations_recipient_idx on public.donations (recipient_id, created_at desc);

-- Anti-spam: batasi jumlah postingan/komentar per 10 menit.
create function public.limit_rate() returns trigger language plpgsql set search_path = '' as $$
declare n int; lim int := tg_argv[0]::int; col text := tg_argv[1];
begin
  perform pg_advisory_xact_lock(hashtextextended(tg_table_name || ':' || (to_jsonb(new) ->> col), 0)); -- serialkan permintaan bersamaan per pengguna
  execute format('select count(*) from %I.%I where %I = $1 and created_at > now() - interval ''10 minutes''',
                 tg_table_schema, tg_table_name, col) into n using (to_jsonb(new) ->> col)::uuid;
  if n >= lim then raise exception 'Terlalu banyak aksi, coba lagi beberapa menit lagi.' using errcode = 'P0001'; end if;
  return new;
end $$;
create trigger posts_rate before insert on public.posts for each row execute function public.limit_rate(10, 'author_id');
create trigger comments_rate before insert on public.comments for each row execute function public.limit_rate(30, 'author_id');
create trigger photos_rate before insert on public.photos for each row execute function public.limit_rate(30, 'owner_id');

-- Row Level Security
alter table public.profiles  enable row level security;
alter table public.posts     enable row level security;
alter table public.likes     enable row level security;
alter table public.comments  enable row level security;
alter table public.albums    enable row level security;
alter table public.photos    enable row level security;
alter table public.donations enable row level security;

create policy profiles_read   on public.profiles for select using (true);
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy posts_read   on public.posts for select using (true);
create policy posts_insert on public.posts for insert to authenticated with check (author_id = auth.uid());
create policy posts_delete on public.posts for delete to authenticated using (author_id = auth.uid());

create policy likes_read   on public.likes for select using (true);
create policy likes_insert on public.likes for insert to authenticated with check (user_id = auth.uid());
create policy likes_delete on public.likes for delete to authenticated using (user_id = auth.uid());

create policy comments_read   on public.comments for select using (true);
create policy comments_insert on public.comments for insert to authenticated with check (author_id = auth.uid());
create policy comments_delete on public.comments for delete to authenticated
  using (author_id = auth.uid() or exists (select 1 from public.posts p where p.id = post_id and p.author_id = auth.uid()));

create policy albums_read   on public.albums for select using (true);
create policy albums_insert on public.albums for insert to authenticated with check (owner_id = auth.uid());
create policy albums_delete on public.albums for delete to authenticated using (owner_id = auth.uid());

create policy photos_read   on public.photos for select using (true);
create policy photos_insert on public.photos for insert to authenticated
  with check (owner_id = auth.uid() and exists (select 1 from public.albums a where a.id = album_id and a.owner_id = auth.uid()));
create policy photos_delete on public.photos for delete to authenticated using (owner_id = auth.uid());

-- Donasi: hanya penerima dan donatur yang bisa melihat barisnya. Tidak ada policy insert/update/delete untuk klien.
create policy donations_read on public.donations for select to authenticated
  using (recipient_id = auth.uid() or donor_id = auth.uid());

-- Storage: bucket publik "media" (hanya gambar, maks 5 MB). Folder pertama = id pemilik.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg','image/png','image/webp'];

-- Tanpa policy select publik: isi bucket tidak bisa didaftar orang lain. Foto tetap terbuka lewat URL publik (bucket publik).
create policy media_read   on storage.objects for select to authenticated using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy media_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy media_delete on storage.objects for delete to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);

-- Grants: RLS saja tidak cukup. Cabut semua hak, lalu beri seminimal mungkin (insert per kolom;
-- id, author_id/owner_id/user_id, dan created_at selalu diisi database, tidak bisa dipalsukan klien).
revoke all on public.profiles, public.posts, public.likes, public.comments, public.albums, public.photos, public.donations from anon, authenticated;
grant select on public.profiles, public.posts, public.likes, public.comments, public.albums, public.photos to anon, authenticated;
grant select on public.donations to authenticated;
grant update (username, display_name, bio) on public.profiles to authenticated;
grant insert (body, image_path) on public.posts to authenticated;
grant insert (post_id) on public.likes to authenticated;
grant insert (post_id, body) on public.comments to authenticated;
grant insert (title) on public.albums to authenticated;
grant insert (album_id, path, caption) on public.photos to authenticated;
grant delete on public.posts, public.likes, public.comments, public.albums, public.photos to authenticated;
revoke execute on function public.handle_new_user(), public.limit_rate() from public, anon, authenticated;

-- Security hardening: prevent direct API/RPC execution of existing event-trigger helper.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
