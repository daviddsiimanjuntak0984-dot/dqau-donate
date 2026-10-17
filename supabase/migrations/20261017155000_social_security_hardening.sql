ALTER TABLE public.creator_stories
  DROP CONSTRAINT IF EXISTS creator_stories_expiry_max_24h;
ALTER TABLE public.creator_stories
  ADD CONSTRAINT creator_stories_expiry_max_24h
  CHECK (expires_at <= created_at + interval '24 hours');

DROP POLICY IF EXISTS creator_follows_read ON public.creator_follows;
CREATE POLICY creator_follows_read ON public.creator_follows
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = following_id AND (p.is_public = true OR p.id = (SELECT auth.uid()))
    )
  );

DROP POLICY IF EXISTS creator_follows_insert_own ON public.creator_follows;
CREATE POLICY creator_follows_insert_own ON public.creator_follows
  FOR INSERT TO authenticated
  WITH CHECK (
    follower_id = (SELECT auth.uid())
    AND follower_id <> following_id
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = following_id AND p.is_public = true
    )
  );

DROP POLICY IF EXISTS creator_post_likes_read ON public.creator_post_likes;
CREATE POLICY creator_post_likes_read ON public.creator_post_likes
  FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.creator_posts p WHERE p.id = post_id));

DROP POLICY IF EXISTS creator_post_comments_read ON public.creator_post_comments;
CREATE POLICY creator_post_comments_read ON public.creator_post_comments
  FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.creator_posts p WHERE p.id = post_id));