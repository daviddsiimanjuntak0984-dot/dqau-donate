-- Creator social profile features. Additive and isolated from legacy posts/donations tables.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS location text NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS public.creator_follows (
  follower_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, following_id),
  CONSTRAINT creator_follows_no_self_follow CHECK (follower_id <> following_id)
);

CREATE TABLE IF NOT EXISTS public.creator_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 1000),
  media_url text,
  media_kind text NOT NULL DEFAULT 'none' CHECK (media_kind IN ('none', 'image', 'video')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.creator_post_likes (
  post_id uuid NOT NULL REFERENCES public.creator_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.creator_post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.creator_posts(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 500),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.creator_stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  media_url text NOT NULL,
  media_kind text NOT NULL DEFAULT 'image' CHECK (media_kind IN ('image', 'video')),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  CHECK (expires_at > created_at)
);

CREATE INDEX IF NOT EXISTS idx_creator_follows_following ON public.creator_follows (following_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_creator_posts_author_created ON public.creator_posts (author_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_creator_post_likes_post ON public.creator_post_likes (post_id);
CREATE INDEX IF NOT EXISTS idx_creator_post_comments_post_created ON public.creator_post_comments (post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_creator_stories_creator_expiry ON public.creator_stories (creator_id, expires_at DESC);

ALTER TABLE public.creator_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_stories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS creator_follows_read ON public.creator_follows;
CREATE POLICY creator_follows_read ON public.creator_follows
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS creator_follows_insert_own ON public.creator_follows;
CREATE POLICY creator_follows_insert_own ON public.creator_follows
  FOR INSERT TO authenticated WITH CHECK (follower_id = (SELECT auth.uid()) AND follower_id <> following_id);
DROP POLICY IF EXISTS creator_follows_delete_own ON public.creator_follows;
CREATE POLICY creator_follows_delete_own ON public.creator_follows
  FOR DELETE TO authenticated USING (follower_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS creator_posts_read_public_profile ON public.creator_posts;
CREATE POLICY creator_posts_read_public_profile ON public.creator_posts
  FOR SELECT TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = author_id AND (p.is_public = true OR p.id = (SELECT auth.uid()))
  ));
DROP POLICY IF EXISTS creator_posts_insert_own ON public.creator_posts;
CREATE POLICY creator_posts_insert_own ON public.creator_posts
  FOR INSERT TO authenticated WITH CHECK (author_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS creator_posts_update_own ON public.creator_posts;
CREATE POLICY creator_posts_update_own ON public.creator_posts
  FOR UPDATE TO authenticated
  USING (author_id = (SELECT auth.uid()))
  WITH CHECK (author_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS creator_posts_delete_own ON public.creator_posts;
CREATE POLICY creator_posts_delete_own ON public.creator_posts
  FOR DELETE TO authenticated USING (author_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS creator_post_likes_read ON public.creator_post_likes;
CREATE POLICY creator_post_likes_read ON public.creator_post_likes
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS creator_post_likes_insert_own ON public.creator_post_likes;
CREATE POLICY creator_post_likes_insert_own ON public.creator_post_likes
  FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS creator_post_likes_delete_own ON public.creator_post_likes;
CREATE POLICY creator_post_likes_delete_own ON public.creator_post_likes
  FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS creator_post_comments_read ON public.creator_post_comments;
CREATE POLICY creator_post_comments_read ON public.creator_post_comments
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS creator_post_comments_insert_own ON public.creator_post_comments;
CREATE POLICY creator_post_comments_insert_own ON public.creator_post_comments
  FOR INSERT TO authenticated WITH CHECK (author_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS creator_post_comments_delete_own ON public.creator_post_comments;
CREATE POLICY creator_post_comments_delete_own ON public.creator_post_comments
  FOR DELETE TO authenticated
  USING (
    author_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.creator_posts p
      WHERE p.id = post_id AND p.author_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS creator_stories_read_active ON public.creator_stories;
CREATE POLICY creator_stories_read_active ON public.creator_stories
  FOR SELECT TO anon, authenticated
  USING (
    expires_at > now()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = creator_id AND (p.is_public = true OR p.id = (SELECT auth.uid()))
    )
  );
DROP POLICY IF EXISTS creator_stories_insert_own ON public.creator_stories;
CREATE POLICY creator_stories_insert_own ON public.creator_stories
  FOR INSERT TO authenticated WITH CHECK (creator_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS creator_stories_delete_own ON public.creator_stories;
CREATE POLICY creator_stories_delete_own ON public.creator_stories
  FOR DELETE TO authenticated USING (creator_id = (SELECT auth.uid()));

GRANT SELECT ON public.creator_follows, public.creator_posts, public.creator_post_likes,
  public.creator_post_comments, public.creator_stories TO anon, authenticated;
GRANT INSERT, DELETE ON public.creator_follows, public.creator_post_likes TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.creator_posts TO authenticated;
GRANT INSERT, DELETE ON public.creator_post_comments TO authenticated;
GRANT INSERT, DELETE ON public.creator_stories TO authenticated;

-- Public media reads are allowed; writes are limited to the signed-in user's own UUID folder.
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
