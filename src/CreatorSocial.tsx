import { useCallback, useEffect, useMemo, useState } from 'react';
import { isSupabaseConfigured, supabase } from './supabase';
import { DonationForm } from './DonationForm';

export interface SocialProfile {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url?: string | null;
  cover_url?: string | null;
  album_urls?: string[];
  social_links?: Record<string, string>;
  category?: string;
  location?: string;
  is_public?: boolean;
  created_at?: string;
}

type MediaKind = 'none' | 'image' | 'video';
type SocialPost = {
  id: string;
  author_id: string;
  content: string;
  media_url: string | null;
  media_kind: MediaKind;
  created_at: string;
  likes_count: number;
  comments_count: number;
  liked_by_me: boolean;
};
type SocialStory = {
  id: string;
  creator_id: string;
  media_url: string;
  media_kind: 'image' | 'video';
  created_at: string;
  expires_at: string;
};
type SocialComment = {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
};
type ConnectionProfile = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
};

function formatCount(n: number) {
  return new Intl.NumberFormat('id-ID', { notation: n >= 10000 ? 'compact' : 'standard', maximumFractionDigits: 1 }).format(n);
}
function formatDate(value: string) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? 'Baru saja' : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}
function validExternalUrl(value: string) {
  try {
    const url = new URL(value.startsWith('http://') || value.startsWith('https://') ? value : 'https://' + value);
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : '';
  } catch {
    return '';
  }
}
function uploadExtension(file: File): string | null {
  const types: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/avif': 'avif',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
  };
  return types[file.type] || null;
}

export function CreatorDashboard({
  profileId,
  profile,
  onOpenProfile,
  onNeedLogin,
}: {
  profileId: string;
  profile: SocialProfile | null;
  onOpenProfile: () => void;
  onNeedLogin: () => void;
}) {
  const [stats, setStats] = useState({ followers: 0, following: 0, posts: 0, stories: 0 });
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setNotice('');
      if (!isSupabaseConfigured) {
        setNotice('Hubungkan Supabase terlebih dahulu untuk melihat statistik akun.');
        setLoading(false);
        return;
      }
      const [followers, following, posts, stories] = await Promise.all([
        supabase.from('creator_follows').select('follower_id', { count: 'exact', head: true }).eq('following_id', profileId),
        supabase.from('creator_follows').select('following_id', { count: 'exact', head: true }).eq('follower_id', profileId),
        supabase.from('creator_posts').select('id', { count: 'exact', head: true }).eq('author_id', profileId),
        supabase.from('creator_stories').select('id', { count: 'exact', head: true }).eq('creator_id', profileId).gt('expires_at', new Date().toISOString()),
      ]);
      if (!active) return;
      const error = followers.error || following.error || posts.error || stories.error;
      if (error) {
        setNotice('Statistik komunitas belum aktif pada database ini. Pastikan migration fitur sosial sudah diterapkan.');
      } else {
        setStats({
          followers: followers.count ?? 0,
          following: following.count ?? 0,
          posts: posts.count ?? 0,
          stories: stories.count ?? 0,
        });
      }
      setLoading(false);
    };
    void load();
    return () => { active = false; };
  }, [profileId]);

  return (
    <section className="creator-dashboard" aria-labelledby="creatorDashboardTitle">
      <div className="creator-dashboard-heading">
        <div>
          <p className="creator-dashboard-eyebrow">RUANG KREATOR</p>
          <h3 id="creatorDashboardTitle">Dasbor kreator</h3>
          <p>Pantau komunitas dan kelola karya dari satu tempat.</p>
        </div>
        <span className="creator-dashboard-mark" aria-hidden="true">✦</span>
      </div>
      <div className="creator-dashboard-stats">
        <div className="creator-dashboard-stat"><span>Pengikut</span><strong>{loading ? '—' : formatCount(stats.followers)}</strong></div>
        <div className="creator-dashboard-stat"><span>Mengikuti</span><strong>{loading ? '—' : formatCount(stats.following)}</strong></div>
        <div className="creator-dashboard-stat"><span>Postingan</span><strong>{loading ? '—' : formatCount(stats.posts)}</strong></div>
        <div className="creator-dashboard-stat"><span>Cerita aktif</span><strong>{loading ? '—' : formatCount(stats.stories)}</strong></div>
      </div>
      {notice && <p className="creator-social-notice" role="status">{notice}</p>}
      <div className="creator-dashboard-actions">
        <button className="btn btn-primary" type="button" onClick={() => profile ? onOpenProfile() : onNeedLogin()} disabled={loading && !profile}>
          {profile ? 'Buka profil publik' : 'Buat profil kreator'}
        </button>
        <a className="creator-dashboard-link" href="#kreator">Temukan kreator ↗</a>
      </div>
    </section>
  );
}

export function CreatorSocialProfile({
  profile,
  viewerId,
  onClose,
  onNeedLogin,
}: {
  profile: SocialProfile;
  viewerId: string | null;
  onClose: () => void;
  onNeedLogin: () => void;
}) {
  const [tab, setTab] = useState<'profil' | 'posting' | 'reels' | 'foto' | 'tautan' | 'dukung'>('profil');
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [following, setFollowing] = useState(false);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [stories, setStories] = useState<SocialStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [postText, setPostText] = useState('');
  const [postFile, setPostFile] = useState<File | null>(null);
  const [postPreview, setPostPreview] = useState<string | null>(null);
  const [postError, setPostError] = useState('');
  const [featureNotice, setFeatureNotice] = useState('');
  const [expandedComments, setExpandedComments] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, SocialComment[]>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [commentBusy, setCommentBusy] = useState<string | null>(null);
  const [connectionType, setConnectionType] = useState<'followers' | 'following' | null>(null);
  const [connections, setConnections] = useState<ConnectionProfile[]>([]);
  const [connectionLoading, setConnectionLoading] = useState(false);
  const [connectionError, setConnectionError] = useState('');
  const [activeStory, setActiveStory] = useState<SocialStory | null>(null);
  const [storyBusy, setStoryBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const ownProfile = viewerId === profile.id;
  const albumUrls = useMemo(() => (Array.isArray(profile.album_urls) ? profile.album_urls.filter((url): url is string => typeof url === 'string') : []), [profile.album_urls]);

  const loadSocialData = useCallback(async () => {
    setLoading(true);
    setFeatureNotice('');
    if (!isSupabaseConfigured) {
      setFeatureNotice('Fitur komunitas memerlukan koneksi Supabase.');
      setLoading(false);
      return;
    }
    const [followersRes, followingRes, followRes, postsRes, storiesRes] = await Promise.all([
      supabase.from('creator_follows').select('follower_id', { count: 'exact', head: true }).eq('following_id', profile.id),
      supabase.from('creator_follows').select('following_id', { count: 'exact', head: true }).eq('follower_id', profile.id),
      viewerId && viewerId !== profile.id
        ? supabase.from('creator_follows').select('follower_id').eq('follower_id', viewerId).eq('following_id', profile.id).maybeSingle()
        : Promise.resolve({ data: null, error: null, count: null, status: 200, statusText: 'OK' } as any),
      supabase.from('creator_posts').select('id, author_id, content, media_url, media_kind, created_at').eq('author_id', profile.id).order('created_at', { ascending: false }).limit(40),
      supabase.from('creator_stories').select('id, creator_id, media_url, media_kind, created_at, expires_at').eq('creator_id', profile.id).gt('expires_at', new Date().toISOString()).order('created_at', { ascending: false }).limit(20),
    ]);
    const tableError = followersRes.error || followingRes.error || postsRes.error || storiesRes.error;
    if (tableError) {
      setFeatureNotice('Fitur pengikut/postingan belum aktif di database ini. Migration fitur sosial perlu diterapkan terlebih dahulu.');
      setPosts([]);
      setStories([]);
      setLoading(false);
      return;
    }
    setFollowersCount(followersRes.count ?? 0);
    setFollowingCount(followingRes.count ?? 0);
    setFollowing(Boolean(followRes.data));
    const rows = (postsRes.data || []) as Array<Omit<SocialPost, 'likes_count' | 'comments_count' | 'liked_by_me'>>;
    const postIds = rows.map((row) => row.id);
    if (!postIds.length) {
      setPosts([]);
    } else {
      const [likesRes, commentsRes] = await Promise.all([
        supabase.from('creator_post_likes').select('post_id,user_id').in('post_id', postIds),
        supabase.from('creator_post_comments').select('post_id').in('post_id', postIds),
      ]);
      if (likesRes.error || commentsRes.error) {
        setFeatureNotice('Postingan tampil, tetapi data suka/komentar belum dapat dibaca. Periksa kebijakan RLS.');
      }
      const likes = (likesRes.data || []) as Array<{ post_id: string; user_id: string }>;
      const commentRows = (commentsRes.data || []) as Array<{ post_id: string }>;
      setPosts(rows.map((row) => ({
        ...row,
        media_kind: row.media_kind || 'none',
        likes_count: likes.filter((like) => like.post_id === row.id).length,
        comments_count: commentRows.filter((comment) => comment.post_id === row.id).length,
        liked_by_me: Boolean(viewerId && likes.some((like) => like.post_id === row.id && like.user_id === viewerId)),
      })));
    }
    setStories((storiesRes.data || []) as SocialStory[]);
    setLoading(false);
  }, [profile.id, viewerId]);

  useEffect(() => { void loadSocialData(); }, [loadSocialData]);
  useEffect(() => () => {
    if (postPreview && postPreview.startsWith('blob:')) URL.revokeObjectURL(postPreview);
  }, [postPreview]);

  const uploadCreatorAsset = async (file: File, folder: 'post' | 'story'): Promise<{ url: string; kind: 'image' | 'video'; path: string } | null> => {
    if (!viewerId || viewerId !== profile.id) throw new Error('Hanya pemilik profil yang dapat mengunggah media.');
    const ext = uploadExtension(file);
    if (!ext) throw new Error('Format didukung: JPG, PNG, WebP, GIF, AVIF, MP4, atau WebM.');
    const kind: 'image' | 'video' = file.type.startsWith('video/') ? 'video' : 'image';
    const limit = kind === 'video' ? 30 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > limit) throw new Error(kind === 'video' ? 'Video maksimal 30MB.' : 'Gambar maksimal 5MB.');
    const path = viewerId + '/' + folder + '/' + crypto.randomUUID() + '.' + ext;
    const { error } = await supabase.storage.from('creator-media').upload(path, file, { upsert: false, contentType: file.type, cacheControl: '3600' });
    if (error) throw error;
    const { data } = supabase.storage.from('creator-media').getPublicUrl(path);
    return { url: data.publicUrl, kind, path };
  };

  const createPost = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!viewerId) { onNeedLogin(); return; }
    if (!ownProfile) return;
    const text = postText.trim();
    if (!text || text.length > 1000) {
      setPostError('Isi postingan 1–1.000 karakter.');
      return;
    }
    setPosting(true);
    setPostError('');
    let uploaded: { url: string; kind: 'image' | 'video'; path: string } | null = null;
    try {
      if (postFile) uploaded = await uploadCreatorAsset(postFile, 'post');
      const { error } = await supabase.from('creator_posts').insert({
        author_id: viewerId,
        content: text,
        media_url: uploaded?.url || null,
        media_kind: uploaded?.kind || 'none',
      });
      if (error) {
        if (uploaded) await supabase.storage.from('creator-media').remove([uploaded.path]);
        throw error;
      }
      setPostText('');
      setPostFile(null);
      setPostPreview(null);
      setFeatureNotice('Postingan berhasil diterbitkan.');
      await loadSocialData();
    } catch (err) {
      setPostError(err instanceof Error ? err.message : 'Postingan belum berhasil disimpan.');
    } finally {
      setPosting(false);
    }
  };

  const toggleFollow = async () => {
    if (!viewerId) { onNeedLogin(); return; }
    if (ownProfile) return;
    setFeatureNotice('');
    if (following) {
      const { error } = await supabase.from('creator_follows').delete().eq('follower_id', viewerId).eq('following_id', profile.id);
      if (error) { setFeatureNotice('Belum berhasil berhenti mengikuti. Periksa koneksi lalu coba lagi.'); return; }
      setFollowing(false);
      setFollowersCount((count) => Math.max(0, count - 1));
    } else {
      const { error } = await supabase.from('creator_follows').insert({ follower_id: viewerId, following_id: profile.id });
      if (error) {
        setFeatureNotice(error.code === '23505' ? 'Kamu sudah mengikuti kreator ini.' : 'Belum berhasil mengikuti. Pastikan profilmu sudah dibuat.');
        return;
      }
      setFollowing(true);
      setFollowersCount((count) => count + 1);
    }
  };

  const toggleLike = async (post: SocialPost) => {
    if (!viewerId) { onNeedLogin(); return; }
    if (post.liked_by_me) {
      const { error } = await supabase.from('creator_post_likes').delete().eq('post_id', post.id).eq('user_id', viewerId);
      if (error) { setFeatureNotice('Belum berhasil membatalkan suka.'); return; }
      setPosts((current) => current.map((item) => item.id === post.id ? { ...item, liked_by_me: false, likes_count: Math.max(0, item.likes_count - 1) } : item));
    } else {
      const { error } = await supabase.from('creator_post_likes').insert({ post_id: post.id, user_id: viewerId });
      if (error) { setFeatureNotice(error.code === '23505' ? 'Postingan sudah kamu sukai.' : 'Belum berhasil menyukai postingan.'); return; }
      setPosts((current) => current.map((item) => item.id === post.id ? { ...item, liked_by_me: true, likes_count: item.likes_count + 1 } : item));
    }
  };

  const loadComments = async (postId: string) => {
    const { data, error } = await supabase.from('creator_post_comments').select('id, post_id, author_id, content, created_at').eq('post_id', postId).order('created_at', { ascending: true }).limit(50);
    if (error) { setFeatureNotice('Komentar belum dapat dimuat. Periksa koneksi dan izin database.'); return; }
    const rows = (data || []) as Array<Omit<SocialComment, 'display_name' | 'username' | 'avatar_url'>>;
    const authorIds = Array.from(new Set(rows.map((row) => row.author_id)));
    let authors: ConnectionProfile[] = [];
    if (authorIds.length) {
      const result = await supabase.from('profiles').select('id, username, display_name, avatar_url').in('id', authorIds);
      if (!result.error && result.data) authors = result.data as ConnectionProfile[];
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
    if (!viewerId) { onNeedLogin(); return; }
    const content = (commentDrafts[postId] || '').trim();
    if (!content || content.length > 500) return;
    setCommentBusy(postId);
    const { error } = await supabase.from('creator_post_comments').insert({ post_id: postId, author_id: viewerId, content });
    if (error) setFeatureNotice('Komentar belum berhasil dikirim. Periksa koneksi lalu coba lagi.');
    else {
      setCommentDrafts((current) => ({ ...current, [postId]: '' }));
      await loadComments(postId);
      setPosts((current) => current.map((item) => item.id === postId ? { ...item, comments_count: item.comments_count + 1 } : item));
    }
    setCommentBusy(null);
  };

  const deletePost = async (post: SocialPost) => {
    if (!ownProfile || !window.confirm('Hapus postingan ini?')) return;
    const { error } = await supabase.from('creator_posts').delete().eq('id', post.id).eq('author_id', viewerId || '');
    if (error) { setFeatureNotice('Postingan belum berhasil dihapus.'); return; }
    setPosts((current) => current.filter((item) => item.id !== post.id));
    setFeatureNotice('Postingan berhasil dihapus.');
  };

  const showConnections = async (kind: 'followers' | 'following') => {
    setConnectionType(kind);
    setConnectionLoading(true);
    setConnections([]);
    setConnectionError('');
    const query = kind === 'followers'
      ? supabase.from('creator_follows').select('follower_id').eq('following_id', profile.id)
      : supabase.from('creator_follows').select('following_id').eq('follower_id', profile.id);
    const { data, error } = await query;
    if (error) {
      setConnectionError('Daftar pengikut belum tersedia di database ini.');
      setConnectionLoading(false);
      return;
    }
    const ids = Array.from(new Set((data || []).map((row: any) => kind === 'followers' ? row.follower_id : row.following_id))) as string[];
    if (ids.length) {
      const result = await supabase.from('profiles').select('id, username, display_name, avatar_url').in('id', ids);
      if (result.error) setConnectionError('Profil anggota belum dapat dimuat.');
      else setConnections((result.data || []) as ConnectionProfile[]);
    }
    setConnectionLoading(false);
  };

  const createStory = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !viewerId) return;
    setStoryBusy(true);
    setFeatureNotice('');
    try {
      const uploaded = await uploadCreatorAsset(file, 'story');
      if (!uploaded) return;
      const { error } = await supabase.from('creator_stories').insert({
        creator_id: viewerId,
        media_url: uploaded.url,
        media_kind: uploaded.kind,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });
      if (error) {
        await supabase.storage.from('creator-media').remove([uploaded.path]);
        throw error;
      }
      setFeatureNotice('Cerita berhasil ditambahkan dan akan hilang otomatis setelah 24 jam.');
      await loadSocialData();
    } catch (err) {
      setFeatureNotice(err instanceof Error ? err.message : 'Cerita belum berhasil diunggah.');
    } finally {
      setStoryBusy(false);
    }
  };

  const shareProfile = async () => {
    const url = window.location.origin + '/?creator=' + encodeURIComponent(profile.username);
    try {
      if (navigator.share) await navigator.share({ title: profile.display_name || profile.username, text: 'Lihat profil kreator di Dqua Donate', url });
      else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      }
    } catch {
      try { await navigator.clipboard.writeText(url); setCopied(true); window.setTimeout(() => setCopied(false), 1800); }
      catch { window.prompt('Salin tautan profil:', url); }
    }
  };

  const visiblePosts = posts.filter((post) => tab === 'reels' ? post.media_kind === 'video' : tab === 'foto' ? post.media_kind === 'image' : true);

  return (
    <div className="modal profile-view-modal" role="dialog" aria-modal="true" aria-labelledby="creatorSocialTitle" onClick={onClose}>
      <div className="profile-view-dialog creator-social-dialog" onClick={(event) => event.stopPropagation()}>
        <button className="close profile-view-close" type="button" aria-label="Tutup profil" onClick={onClose}>×</button>
        <div className="profile-view-cover">
          {profile.cover_url ? <img src={profile.cover_url} alt={'Sampul ' + (profile.display_name || profile.username)} /> : <div className="profile-view-cover-placeholder"><span>✦</span><span>DQUA CREATOR</span></div>}
          <div className="profile-view-cover-shade" />
          {ownProfile && <label className="creator-story-add-cover" title="Tambahkan cerita">＋ Cerita<input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif,video/mp4,video/webm" onChange={createStory} disabled={storyBusy} /></label>}
        </div>
        <div className="profile-view-identity creator-social-identity">
          {profile.avatar_url ? <img className="profile-view-avatar" src={profile.avatar_url} alt={profile.display_name || profile.username} /> : <div className="profile-view-avatar profile-view-avatar-fallback">{(profile.display_name || profile.username || 'K').charAt(0).toUpperCase()}</div>}
          <div className="profile-view-name">
            <h2 id="creatorSocialTitle">{profile.display_name || profile.username}</h2>
            <span>@{profile.username}</span>
            <small>{profile.category || 'Kreator Dqua Donate'}{profile.location ? ' · ' + profile.location : ''}</small>
          </div>
          <div className="creator-social-primary-actions">
            {!ownProfile && <button className={'btn ' + (following ? 'btn-ghost' : 'btn-primary')} type="button" onClick={() => void toggleFollow()}>{following ? '✓ Mengikuti' : '+ Ikuti'}</button>}
            <button className="btn btn-primary profile-support-shortcut" type="button" onClick={() => setTab('dukung')}>♡ Dukung</button>
            <button className="btn btn-ghost" type="button" onClick={() => void shareProfile()}>{copied ? 'Tautan disalin ✓' : 'Bagikan ↗'}</button>
          </div>
        </div>
        <div className="creator-social-stats">
          <button type="button" onClick={() => void showConnections('followers')}><strong>{formatCount(followersCount)}</strong><span>Pengikut</span></button>
          <button type="button" onClick={() => void showConnections('following')}><strong>{formatCount(followingCount)}</strong><span>Mengikuti</span></button>
          <button type="button" onClick={() => setTab('posting')}><strong>{formatCount(posts.length)}</strong><span>Postingan</span></button>
        </div>
        <div className="creator-story-strip">
          {ownProfile && <label className="creator-story-bubble creator-story-create" title="Tambah cerita"><span>＋</span><small>Tambah cerita<input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif,video/mp4,video/webm" onChange={createStory} disabled={storyBusy} /></small></label>}
          {stories.map((story) => <button type="button" className="creator-story-bubble" key={story.id} onClick={() => setActiveStory(story)} aria-label={'Lihat cerita dari ' + profile.display_name}><span className="creator-story-ring">{story.media_kind === 'video' ? '▶' : <img src={story.media_url} alt="" />}</span><small>{formatDate(story.created_at)}</small></button>)}
          {stories.length === 0 && !ownProfile && <span className="creator-story-empty">Belum ada cerita terbaru.</span>}
        </div>
        <div className="profile-view-tabs creator-social-tabs" role="tablist" aria-label="Bagian profil kreator">
          <button type="button" role="tab" aria-selected={tab === 'profil'} className={tab === 'profil' ? 'is-active' : ''} onClick={() => setTab('profil')}>Profil</button>
          <button type="button" role="tab" aria-selected={tab === 'posting'} className={tab === 'posting' ? 'is-active' : ''} onClick={() => setTab('posting')}>Postingan</button>
          <button type="button" role="tab" aria-selected={tab === 'reels'} className={tab === 'reels' ? 'is-active' : ''} onClick={() => setTab('reels')}>Reels</button>
          <button type="button" role="tab" aria-selected={tab === 'foto'} className={tab === 'foto' ? 'is-active' : ''} onClick={() => setTab('foto')}>Foto & Album</button>
          <button type="button" role="tab" aria-selected={tab === 'tautan'} className={tab === 'tautan' ? 'is-active' : ''} onClick={() => setTab('tautan')}>Tautan</button>
          <button type="button" role="tab" aria-selected={tab === 'dukung'} className={tab === 'dukung' ? 'is-active' : ''} onClick={() => setTab('dukung')}>Dukung</button>
        </div>
        {featureNotice && <p className="creator-social-notice" role="status">{featureNotice}</p>}
        <div className="profile-view-body creator-social-body">
          {tab === 'profil' && (
            <section className="profile-about-panel" role="tabpanel">
              <h3>Tentang kreator</h3>
              <p className="creator-social-bio">{profile.bio || 'Kreator ini belum menambahkan bio.'}</p>
              <div className="profile-about-meta"><span>✦</span><div><strong>@{profile.username}</strong><small>Profil kreator Dqua Donate</small></div></div>
              {profile.location && <p className="creator-profile-detail">⌖ {profile.location}</p>}
              {profile.category && <p className="creator-profile-detail">✦ {profile.category}</p>}
              {albumUrls.length > 0 && <div className="profile-gallery-preview"><div className="profile-gallery-preview-heading"><h3>Foto terbaru</h3><button type="button" onClick={() => setTab('foto')}>Lihat semua</button></div><div className="profile-gallery-grid compact">{albumUrls.slice(0, 3).map((url, index) => <img src={url} key={url} alt={'Foto kreator ' + (index + 1)} loading="lazy" />)}</div></div>}
            </section>
          )}
          {(tab === 'posting' || tab === 'reels' || tab === 'foto') && (
            <section className="creator-posts-panel" role="tabpanel">
              {ownProfile && tab === 'posting' && (
                <form className="creator-post-composer" onSubmit={createPost}>
                  <label htmlFor="creatorPostText">Bagikan sesuatu ke komunitas</label>
                  <textarea id="creatorPostText" value={postText} onChange={(event) => setPostText(event.target.value)} maxLength={1000} rows={3} placeholder="Apa yang sedang kamu kerjakan?" required />
                  {postPreview && <div className="creator-post-preview">{postFile?.type.startsWith('video/') ? <video src={postPreview} controls /> : <img src={postPreview} alt="Pratinjau lampiran postingan" />}<button type="button" onClick={() => { setPostFile(null); setPostPreview(null); }}>Hapus lampiran</button></div>}
                  <div className="creator-post-composer-actions">
                    <label className="btn btn-ghost creator-file-button">＋ Foto / video<input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif,video/mp4,video/webm" onChange={(event) => { const file = event.target.files?.[0] || null; if (file) { const ext = uploadExtension(file); const kind = file.type.startsWith('video/') ? 'video' : 'image'; const cap = kind === 'video' ? 30 * 1024 * 1024 : 5 * 1024 * 1024; if (!ext || file.size > cap) { setPostError(kind === 'video' ? 'Video maksimal 30MB dengan format MP4/WebM.' : 'Gambar maksimal 5MB dengan format yang didukung.'); event.target.value = ''; return; } setPostFile(file); setPostPreview(URL.createObjectURL(file)); setPostError(''); } }} /></label>
                    <span>{postText.length}/1000</span>
                    <button className="btn btn-primary" type="submit" disabled={posting}>{posting ? 'Menerbitkan…' : 'Terbitkan'}</button>
                  </div>
                  {postError && <p className="creator-social-error" role="alert">{postError}</p>}
                </form>
              )}
              {loading ? <p className="profile-empty-gallery">Memuat postingan…</p> : visiblePosts.length === 0 ? <p className="profile-empty-gallery">{tab === 'reels' ? 'Belum ada video/Reels dari kreator ini.' : tab === 'foto' ? 'Belum ada foto di postingan. Foto album tampil di tab Foto & Album.' : 'Belum ada postingan. Karya terbaru akan muncul di sini setelah kreator menerbitkannya.'}</p> : (
                <div className="creator-post-list">
                  {visiblePosts.map((post) => (
                    <article className="creator-post-card" key={post.id}>
                      <header className="creator-post-author">
                        {profile.avatar_url ? <img src={profile.avatar_url} alt="" /> : <span>{(profile.display_name || profile.username).charAt(0).toUpperCase()}</span>}
                        <div><strong>{profile.display_name || profile.username}</strong><small>@{profile.username} · {formatDate(post.created_at)}</small></div>
                        {ownProfile && <button type="button" className="creator-post-delete" onClick={() => void deletePost(post)} aria-label="Hapus postingan">•••</button>}
                      </header>
                      <p className="creator-post-content">{post.content}</p>
                      {post.media_url && post.media_kind === 'image' && <img className="creator-post-media" src={post.media_url} alt="Media postingan" loading="lazy" />}
                      {post.media_url && post.media_kind === 'video' && <video className="creator-post-media" src={post.media_url} controls playsInline preload="metadata" />}
                      <div className="creator-post-counts"><span>♥ {formatCount(post.likes_count)} suka</span><button type="button" onClick={() => void toggleComments(post.id)}>{formatCount(post.comments_count)} komentar</button></div>
                      <div className="creator-post-actions">
                        <button type="button" className={post.liked_by_me ? 'is-liked' : ''} onClick={() => void toggleLike(post)} aria-pressed={post.liked_by_me}>♡ {post.liked_by_me ? 'Disukai' : 'Suka'}</button>
                        <button type="button" onClick={() => void toggleComments(post.id)}>▢ Komentar</button>
                        <button type="button" onClick={() => void shareProfile()}>↗ Bagikan profil</button>
                      </div>
                      {expandedComments === post.id && (
                        <div className="creator-comments">
                          {(comments[post.id] || []).map((comment) => <article className="creator-comment" key={comment.id}>{comment.avatar_url ? <img src={comment.avatar_url} alt="" /> : <span className="creator-comment-avatar">{(comment.display_name || 'K').charAt(0).toUpperCase()}</span>}<div><strong>{comment.display_name}</strong><p>{comment.content}</p><small>{formatDate(comment.created_at)}</small></div></article>)}
                          {(comments[post.id] || []).length === 0 && <p className="creator-social-muted">Belum ada komentar.</p>}
                          <form className="creator-comment-form" onSubmit={(event) => { event.preventDefault(); void submitComment(post.id); }}>
                            <input value={commentDrafts[post.id] || ''} onChange={(event) => setCommentDrafts((current) => ({ ...current, [post.id]: event.target.value }))} maxLength={500} placeholder={viewerId ? 'Tulis komentar…' : 'Masuk untuk berkomentar'} aria-label="Komentar" />
                            <button type="submit" disabled={commentBusy === post.id || !(commentDrafts[post.id] || '').trim()}>{commentBusy === post.id ? '…' : 'Kirim'}</button>
                          </form>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}
          {tab === 'foto' && (
            <section className="profile-gallery-panel creator-album-panel" role="tabpanel">
              <h3>Album foto</h3>
              {albumUrls.length ? <div className="profile-gallery-grid">{albumUrls.map((url, index) => <a href={url} target="_blank" rel="noopener noreferrer" key={url} aria-label={'Buka foto album ' + (index + 1)}><img src={url} alt={'Foto album ' + (index + 1)} loading="lazy" /></a>)}</div> : <p className="profile-empty-gallery">Kreator belum menambahkan foto album.</p>}
            </section>
          )}
          {tab === 'tautan' && (
            <section className="profile-gallery-panel" role="tabpanel">
              <h3>Tautan sosial</h3>
              {Object.entries(profile.social_links || {}).filter(([, value]) => typeof value === 'string' && value.trim()).map(([key, value]) => {
                const href = validExternalUrl(value);
                return href ? <a className="creator-social-link" href={href} target="_blank" rel="noopener noreferrer" key={key}><span>{key.charAt(0).toUpperCase() + key.slice(1)}</span><strong>Buka tautan ↗</strong></a> : null;
              })}
              {!Object.values(profile.social_links || {}).some((value) => typeof value === 'string' && Boolean(value.trim() && validExternalUrl(value))) && <p className="profile-empty-gallery">Kreator belum menambahkan tautan sosial.</p>}
            </section>
          )}
          {tab === 'dukung' && <section className="profile-support-panel" role="tabpanel"><DonationForm creatorId={profile.id} creatorName={profile.display_name || profile.username} /></section>}
        </div>
        <div className="profile-view-footer"><span>Profil kreator · Dqua Donate</span><button className="btn btn-ghost" type="button" onClick={onClose}>Tutup profil</button></div>
        {connectionType && <div className="creator-connection-backdrop" role="dialog" aria-modal="true" aria-label={connectionType === 'followers' ? 'Daftar pengikut' : 'Daftar mengikuti'} onClick={() => setConnectionType(null)}><section className="creator-connection-dialog" onClick={(event) => event.stopPropagation()}><header><h3>{connectionType === 'followers' ? 'Pengikut' : 'Mengikuti'}</h3><button type="button" onClick={() => setConnectionType(null)} aria-label="Tutup daftar">×</button></header>{connectionLoading ? <p>Memuat daftar…</p> : connectionError ? <p className="creator-social-error">{connectionError}</p> : connections.length ? connections.map((item) => <div className="creator-connection-row" key={item.id}>{item.avatar_url ? <img src={item.avatar_url} alt="" /> : <span>{(item.display_name || item.username).charAt(0).toUpperCase()}</span>}<div><strong>{item.display_name || item.username}</strong><small>@{item.username}</small></div></div>) : <p>Belum ada akun di daftar ini.</p>}</section></div>}
        {activeStory && <div className="creator-story-lightbox" role="dialog" aria-modal="true" aria-label="Cerita kreator" onClick={() => setActiveStory(null)}><button type="button" className="creator-story-close" onClick={() => setActiveStory(null)} aria-label="Tutup cerita">×</button>{activeStory.media_kind === 'video' ? <video src={activeStory.media_url} controls autoPlay playsInline onClick={(event) => event.stopPropagation()} /> : <img src={activeStory.media_url} alt="Cerita kreator" onClick={(event) => event.stopPropagation()} />}<p>Cerita ini akan hilang setelah 24 jam.</p></div>}
      </div>
    </div>
  );
}
