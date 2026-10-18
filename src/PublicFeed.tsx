import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';
import type { User } from '@supabase/supabase-js';

interface FeedProfile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  is_public?: boolean;
}

interface FeedPost {
  id: string;
  author_id: string;
  content: string;
  media_url: string | null;
  media_kind: string | null;
  created_at: string;
  profile: FeedProfile | null;
  likes_count: number;
  comments_count: number;
  liked_by_me: boolean;
}

interface FeedComment {
  id: string;
  author_id: string;
  content: string;
  created_at: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
}

interface PublicFeedProps {
  user: User | null;
  onNeedLogin: () => void;
  onOpenCreator: (username: string) => void;
}

const PAGE_SIZE = 10;

function formatTimestamp(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'baru saja';
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} hari lalu`;
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function PublicFeed({ user, onNeedLogin, onOpenCreator }: PublicFeedProps) {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [expandedComments, setExpandedComments] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, FeedComment[]>>({});
  const [commentDraft, setCommentDraft] = useState('');
  const [commentBusy, setCommentBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [lightbox, setLightbox] = useState<string | null>(null);

  const loadPage = useCallback(async (pageIndex: number, append: boolean) => {
    if (!append) setLoading(true);
    else setLoadingMore(true);
    setError('');
    const { data, error: queryError } = await supabase
      .from('creator_posts')
      .select('id, author_id, content, media_url, media_kind, created_at, author:profiles!creator_posts_author_id_fkey(id, username, display_name, avatar_url, is_public)')
      .order('created_at', { ascending: false })
      .range(pageIndex * PAGE_SIZE, pageIndex * PAGE_SIZE + PAGE_SIZE - 1);
    if (queryError) {
      setError('Feed belum dapat dimuat. Periksa koneksi dan kebijakan database, lalu coba lagi.');
      setLoading(false);
      setLoadingMore(false);
      return;
    }
    type PostRow = Omit<FeedPost, 'profile' | 'likes_count' | 'comments_count' | 'liked_by_me'> & {
      author: FeedProfile & { is_public: boolean } | FeedProfile[] | null;
    };
    const rows = ((data || []) as unknown as PostRow[])
      .filter((row) => {
        const author = Array.isArray(row.author) ? row.author[0] : row.author;
        return author && author.is_public !== false;
      })
      .map((row) => ({ ...row, author: Array.isArray(row.author) ? row.author[0] : row.author }));
    const postIds = rows.map((row) => row.id);
    let likeRows: Array<{ post_id: string; user_id: string }> = [];
    let commentCounts: Array<{ post_id: string }> = [];
    if (postIds.length) {
      const [likesRes, commentsRes] = await Promise.all([
        supabase.from('creator_post_likes').select('post_id,user_id').in('post_id', postIds),
        supabase.from('creator_post_comments').select('post_id').in('post_id', postIds),
      ]);
      likeRows = (likesRes.data || []) as Array<{ post_id: string; user_id: string }>;
      commentCounts = (commentsRes.data || []) as Array<{ post_id: string }>;
    }
    const mapped: FeedPost[] = rows.map((row) => ({
      ...row,
      profile: row.author,
      likes_count: likeRows.filter((like) => like.post_id === row.id).length,
      comments_count: commentCounts.filter((comment) => comment.post_id === row.id).length,
      liked_by_me: Boolean(user && likeRows.some((like) => like.post_id === row.id && like.user_id === user.id)),
    }));
    setPosts((current) => (append ? [...current, ...mapped] : mapped));
    setHasMore(rows.length === PAGE_SIZE);
    setPage(pageIndex);
    setLoading(false);
    setLoadingMore(false);
  }, [user]);

  useEffect(() => { void loadPage(0, false); }, [loadPage]);

  const toggleLike = async (post: FeedPost) => {
    if (!user) { onNeedLogin(); return; }
    if (post.liked_by_me) {
      setPosts((current) => current.map((item) => item.id === post.id ? { ...item, liked_by_me: false, likes_count: Math.max(0, item.likes_count - 1) } : item));
      const { error } = await supabase.from('creator_post_likes').delete().eq('post_id', post.id).eq('user_id', user.id);
      if (error) setPosts((current) => current.map((item) => item.id === post.id ? { ...item, liked_by_me: true, likes_count: item.likes_count + 1 } : item));
    } else {
      setPosts((current) => current.map((item) => item.id === post.id ? { ...item, liked_by_me: true, likes_count: item.likes_count + 1 } : item));
      const { error } = await supabase.from('creator_post_likes').insert({ post_id: post.id, user_id: user.id });
      if (error) setPosts((current) => current.map((item) => item.id === post.id ? { ...item, liked_by_me: false, likes_count: Math.max(0, item.likes_count - 1) } : item));
    }
  };

  const loadComments = async (postId: string) => {
    const { data, error } = await supabase
      .from('creator_post_comments')
      .select('id, post_id, author_id, content, created_at')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
      .limit(50);
    if (error) { setNotice('Komentar belum dapat dimuat.'); return; }
    const rows = (data || []) as Array<Omit<FeedComment, 'display_name' | 'username' | 'avatar_url'>>;
    const authorIds = Array.from(new Set(rows.map((row) => row.author_id)));
    let authors: FeedProfile[] = [];
    if (authorIds.length) {
      const result = await supabase.from('profiles').select('id, username, display_name, avatar_url').in('id', authorIds);
      if (!result.error && result.data) authors = result.data as FeedProfile[];
    }
    const names = new Map(authors.map((author) => [author.id, author]));
    setComments((current) => ({
      ...current,
      [postId]: rows.map((row) => {
        const author = names.get(row.author_id);
        return { ...row, display_name: author?.display_name || author?.username || 'Kreator', username: author?.username || '', avatar_url: author?.avatar_url || null };
      }),
    }));
  };

  const toggleComments = async (postId: string) => {
    if (expandedComments === postId) { setExpandedComments(null); return; }
    setExpandedComments(postId);
    await loadComments(postId);
  };

  const submitComment = async (postId: string) => {
    if (!user) { onNeedLogin(); return; }
    const content = commentDraft.trim();
    if (!content || content.length > 500) return;
    setCommentBusy(true);
    const { error } = await supabase.from('creator_post_comments').insert({ post_id: postId, author_id: user.id, content });
    if (error) setNotice('Komentar belum berhasil dikirim. Coba lagi.');
    else {
      setCommentDraft('');
      await loadComments(postId);
      setPosts((current) => current.map((item) => item.id === postId ? { ...item, comments_count: item.comments_count + 1 } : item));
    }
    setCommentBusy(false);
  };

  const sharePost = async (post: FeedPost) => {
    const url = window.location.origin + '/u/' + encodeURIComponent(post.profile?.username || '');
    try {
      if (navigator.share) await navigator.share({ title: 'Dqua Donate', text: post.content.slice(0, 80), url });
      else {
        await navigator.clipboard.writeText(url);
        setNotice('Tautan disalin ke clipboard.');
        window.setTimeout(() => setNotice(''), 2000);
      }
    } catch {
      /* dibatalkan pengguna */
    }
  };

  return (
    <section className="public-feed" aria-label="Feed komunitas">
      {notice && <p className="feed-state" role="status">{notice}</p>}
      {loading ? (
        <div className="feed-skeleton-list" aria-hidden>
          {[0, 1, 2].map((index) => <div className="feed-skeleton-card" key={index} />)}
        </div>
      ) : error ? (
        <div className="feed-state" role="alert">
          <p>{error}</p>
          <button className="btn btn-ghost" type="button" onClick={() => void loadPage(0, false)}>Coba lagi</button>
        </div>
      ) : posts.length === 0 ? (
        <div className="feed-state">
          <h3>Feed masih kosong</h3>
          <p>Postingan dari kreator akan muncul di sini. Tidak ada konten contoh.</p>
        </div>
      ) : (
        <>
          {posts.map((post) => (
            <article className="feed-card" key={post.id}>
              <header className="feed-card-header">
                {post.profile?.avatar_url ? (
                  <img src={post.profile.avatar_url} alt="" loading="lazy" />
                ) : (
                  <span className="feed-avatar-fallback">{(post.profile?.display_name || 'K').charAt(0).toUpperCase()}</span>
                )}
                <div className="feed-card-author">
                  <button type="button" onClick={() => onOpenCreator(post.profile?.username || '')}>
                    {post.profile?.display_name || post.profile?.username || 'Kreator'}
                  </button>
                  <small>@{post.profile?.username || ''} · {formatTimestamp(post.created_at)}</small>
                </div>
              </header>
              <p className="feed-card-content">{post.content}</p>
              {post.media_url && post.media_kind === 'image' && (
                <button type="button" className="feed-media-button" onClick={() => setLightbox(post.media_url)}>
                  <img src={post.media_url} alt="Media postingan" loading="lazy" />
                </button>
              )}
              {post.media_url && post.media_kind === 'video' && (
                <video className="feed-media" src={post.media_url} controls playsInline preload="metadata" />
              )}
              <div className="feed-card-actions">
                <button type="button" aria-pressed={post.liked_by_me} className={post.liked_by_me ? 'feed-action is-liked' : 'feed-action'} onClick={() => void toggleLike(post)}>
                  {post.liked_by_me ? '♥' : '♡'} {post.likes_count}
                </button>
                <button type="button" className="feed-action" onClick={() => void toggleComments(post.id)}>
                  💬 {post.comments_count}
                </button>
                <button type="button" className="feed-action" onClick={() => void sharePost(post)}>Bagikan</button>
              </div>
              {expandedComments === post.id && (
                <div className="feed-comments">
                  {(comments[post.id] || []).map((comment) => (
                    <div className="feed-comment" key={comment.id}>
                      {comment.avatar_url ? <img src={comment.avatar_url} alt="" /> : <span>{comment.display_name.charAt(0).toUpperCase()}</span>}
                      <div>
                        <strong>{comment.display_name}</strong>
                        <p>{comment.content}</p>
                      </div>
                    </div>
                  ))}
                  {(comments[post.id] || []).length === 0 && <p className="feed-comments-empty">Belum ada komentar.</p>}
                  <div className="feed-comment-composer">
                    <label htmlFor={'comment-' + post.id} className="sr-only">Tulis komentar</label>
                    <input
                      id={'comment-' + post.id}
                      value={commentDraft}
                      onChange={(event) => setCommentDraft(event.target.value)}
                      maxLength={500}
                      placeholder="Tulis komentar..."
                    />
                    <button className="btn btn-primary" type="button" disabled={commentBusy || !commentDraft.trim()} onClick={() => void submitComment(post.id)}>Kirim</button>
                  </div>
                </div>
              )}
            </article>
          ))}
          {hasMore && (
            <button className="btn btn-ghost feed-load-more" type="button" disabled={loadingMore} onClick={() => void loadPage(page + 1, true)}>
              {loadingMore ? 'Memuat…' : 'Muat lebih banyak'}
            </button>
          )}
        </>
      )}
      {lightbox && (
        <div className="modal" role="dialog" aria-modal="true" onClick={() => setLightbox(null)}>
          <div className="feed-lightbox" onClick={(event) => event.stopPropagation()}>
            <img src={lightbox} alt="Tampilan penuh media postingan" />
            <button className="close" type="button" aria-label="Tutup" onClick={() => setLightbox(null)}>×</button>
          </div>
        </div>
      )}
    </section>
  );
}
