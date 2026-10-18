/*
# Profile media fields + creator-media storage bucket

1. Plain-English explanation
   Adds Facebook-style media fields to the existing profiles table and creates
   the creator-media storage bucket. Existing data is preserved; columns use
   IF NOT EXISTS. Mirrors supabase/migrations/20261017151158 and 20261017161017
   from the repository.

2. Modified tables
   - public.profiles: adds avatar_url, cover_url, album_urls (jsonb array),
     social_links (jsonb object), is_public (boolean, default true),
     updated_at, plus a check that album_urls is a JSON array.

3. Security
   - RLS policies for profiles replaced with: public can read only profiles
     marked is_public; owners can insert/update only their own row.
   - creator-media bucket: public read via direct object URL only (no object
     listing policy); insert/update/delete restricted to the owner's own
     auth.uid() folder.
*/
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS cover_url text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS album_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS social_links jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_album_urls_is_array'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_album_urls_is_array
      CHECK (jsonb_typeof(album_urls) = 'array') NOT VALID;
  END IF;
END $$;
ALTER TABLE public.profiles VALIDATE CONSTRAINT profiles_album_urls_is_array;

DROP POLICY IF EXISTS "Profiles are publicly readable" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;

DROP POLICY IF EXISTS profiles_read ON public.profiles;
CREATE POLICY profiles_read ON public.profiles
  FOR SELECT TO anon, authenticated
  USING (is_public = true OR id = (SELECT auth.uid()));

DROP POLICY IF EXISTS profiles_insert ON public.profiles;
CREATE POLICY profiles_insert ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS profiles_update ON public.profiles;
CREATE POLICY profiles_update ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT INSERT, UPDATE ON public.profiles TO authenticated;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'creator-media',
  'creator-media',
  true,
  31457280,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'video/mp4', 'video/webm']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = GREATEST(storage.buckets.file_size_limit, EXCLUDED.file_size_limit),
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS creator_media_owner_insert ON storage.objects;
CREATE POLICY creator_media_owner_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'creator-media'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

DROP POLICY IF EXISTS creator_media_owner_update ON storage.objects;
CREATE POLICY creator_media_owner_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'creator-media'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  )
  WITH CHECK (
    bucket_id = 'creator-media'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

DROP POLICY IF EXISTS creator_media_owner_delete ON storage.objects;
CREATE POLICY creator_media_owner_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'creator-media'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

DROP POLICY IF EXISTS creator_media_public_read ON storage.objects;
