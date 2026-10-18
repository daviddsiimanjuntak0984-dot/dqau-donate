-- Public media is readable by direct object URL; avoid exposing Storage object listings.
DROP POLICY IF EXISTS creator_media_public_read ON storage.objects;

-- Cover foreign-key filters used by creator social interactions.
CREATE INDEX IF NOT EXISTS idx_creator_post_likes_user
  ON public.creator_post_likes (user_id);

CREATE INDEX IF NOT EXISTS idx_creator_post_comments_author
  ON public.creator_post_comments (author_id);
