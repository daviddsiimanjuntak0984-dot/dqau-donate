import React, { useState, useEffect } from 'react';
import { dataStore, type SocialPost, type CreatorProfile } from '../services/dataStore';
import { MASCOT_ASSETS } from '../assets/mascot';
import { PostComposer } from './PostComposer';
import { DonationModal } from './DonationModal';
import { NotificationCenter } from './NotificationCenter';
import { CreatorDashboardView } from './CreatorDashboardView';
import { E2EEChat } from './E2EEChat';
import { MobileDrawerMenu } from './MobileDrawerMenu';
import { ProfileEditSheet } from './ProfileEditSheet';
import { DonationAudioModal } from './DonationAudioModal';
import { ImageWithFallback } from './ImageWithFallback';
import { showToast } from '../services/toast';
import { 
  Home, 
  Compass, 
  Shield, 
  Bell, 
  PieChart, 
  User, 
  Plus, 
  Heart, 
  MessageSquare, 
  Share2, 
  Bookmark, 
  Music, 
  MapPin, 
  Users, 
  Lock, 
  Globe, 
  DollarSign, 
  LogOut, 
  Menu,
  Camera,
  Search
} from 'lucide-react';

interface SocialAppProps {
  onLogout: () => void;
  initialTab?: 'feed' | 'explore' | 'chat' | 'notif' | 'dashboard' | 'profile';
  targetCreator?: CreatorProfile | null;
}

export const SocialApp: React.FC<SocialAppProps> = ({ 
  onLogout, 
  initialTab = 'feed',
  targetCreator = null 
}) => {
  const [activeTab, setActiveTab] = useState<'feed' | 'explore' | 'chat' | 'notif' | 'dashboard' | 'profile'>(initialTab);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [creators, setCreators] = useState<CreatorProfile[]>([]);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [composerOpen, setComposerOpen] = useState(false);
  const [selectedCreatorForDonation, setSelectedCreatorForDonation] = useState<CreatorProfile | null>(null);
  const [viewingProfile, setViewingProfile] = useState<CreatorProfile | null>(targetCreator);
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  // Facebook-Style Mobile Drawer & Profile Edit Sheets
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editProfileTarget, setEditProfileTarget] = useState<'avatar' | 'cover' | 'all'>('all');
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);

  // Active user profile (David Simanjuntak by default)
  const [myProfile, setMyProfile] = useState<CreatorProfile>(() => {
    return dataStore.getCreatorById('creator-david') || dataStore.getCreators()[0];
  });

  useEffect(() => {
    if (targetCreator) {
      setViewingProfile(targetCreator);
      setActiveTab('profile');
    }
  }, [targetCreator]);

  useEffect(() => {
    setPosts(dataStore.getPosts());
    setCreators(dataStore.getCreators());
    setUnreadNotifs(dataStore.getUnreadNotificationCount());
    const david = dataStore.getCreatorById('creator-david');
    if (david) setMyProfile(david);

    const unsub = dataStore.subscribe(() => {
      setPosts(dataStore.getPosts());
      setCreators(dataStore.getCreators());
      setUnreadNotifs(dataStore.getUnreadNotificationCount());
      const updatedDavid = dataStore.getCreatorById('creator-david');
      if (updatedDavid) setMyProfile(updatedDavid);
      if (viewingProfile) {
        const refreshedViewing = dataStore.getCreatorById(viewingProfile.id);
        if (refreshedViewing) setViewingProfile(refreshedViewing);
      }
    });
    return unsub;
  }, [viewingProfile?.id]);

  const handleToggleLike = (postId: string) => {
    dataStore.toggleLikePost(postId);
  };

  const handleToggleBookmark = (postId: string) => {
    dataStore.toggleBookmarkPost(postId);
  };

  const handleAddComment = (postId: string, e: React.FormEvent) => {
    e.preventDefault();
    const text = commentInputs[postId];
    if (!text?.trim()) return;

    dataStore.addComment(postId, text, {
      name: myProfile.display_name,
      username: myProfile.username,
      avatar: myProfile.avatar_url,
    });

    setCommentInputs({ ...commentInputs, [postId]: '' });
  };

  const handleOpenCreatorProfile = (creator: CreatorProfile) => {
    setViewingProfile(creator);
    setActiveTab('profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveProfileUpdates = (updates: Partial<CreatorProfile>) => {
    dataStore.updateCreatorProfile(myProfile.id, updates);
  };

  return (
    <div className="flex h-screen bg-[#08070D] text-white overflow-hidden selection:bg-violet-600 selection:text-white relative">
      {/* 1. DESKTOP LEFT SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-64 xl:w-72 bg-[#0A0E17] border-r border-white/5 h-full z-20 flex-shrink-0">
        {/* Brand */}
        <div className="p-6 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-violet-600 flex items-center justify-center font-black text-lg text-white shadow-lg shadow-violet-600/30 shrink-0">
              D
            </div>
            {/* Maskot Anime Dqua Beranimasi di Samping Huruf D */}
            <div 
              onClick={() => showToast('Hai! Maskot Dqua siap menemani aktivitas kreator Anda ✦', 'info')}
              className="relative cursor-pointer shrink-0"
              title="Maskot Anime Dqua"
            >
              <div className="w-8 h-8 rounded-full p-[1.5px] bg-gradient-to-tr from-cyan-400 via-blue-500 to-violet-500 animate-mascot-float">
                <ImageWithFallback
                  src={MASCOT_ASSETS.chibiSticker}
                  fallbackSrc={MASCOT_ASSETS.portraitAvatar}
                  alt="Maskot Dqua"
                  className="w-full h-full object-cover rounded-full bg-[#0E1322]"
                />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-cyan-400 border border-[#0A0E17] rounded-full animate-pulse" />
            </div>
            <span className="text-xl font-black tracking-tight text-white">
              Dqua <span className="text-violet-400">Social</span>
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 px-4 py-5 space-y-1.5 overflow-y-auto no-scrollbar">
          <button
            onClick={() => { setActiveTab('feed'); setViewingProfile(null); }}
            className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-bold text-sm transition ${
              activeTab === 'feed' && !viewingProfile
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/25'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Home size={18} />
            <span>Beranda</span>
          </button>

          <button
            onClick={() => { setActiveTab('explore'); setViewingProfile(null); }}
            className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-bold text-sm transition ${
              activeTab === 'explore'
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/25'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Compass size={18} />
            <span>Jelajahi Kreator</span>
          </button>

          <button
            onClick={() => { setActiveTab('chat'); setViewingProfile(null); }}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold text-sm transition ${
              activeTab === 'chat'
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/25'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <Shield size={18} />
              <span>Pesan E2EE</span>
            </div>
            <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-mono px-1.5 py-0.5 rounded">
              Aman
            </span>
          </button>

          <button
            onClick={() => { setActiveTab('notif'); setViewingProfile(null); }}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold text-sm transition ${
              activeTab === 'notif'
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/25'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <Bell size={18} />
              <span>Notifikasi</span>
            </div>
            {unreadNotifs > 0 && (
              <span className="bg-violet-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {unreadNotifs}
              </span>
            )}
          </button>

          <button
            onClick={() => { setActiveTab('dashboard'); setViewingProfile(null); }}
            className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-bold text-sm transition ${
              activeTab === 'dashboard'
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/25'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <PieChart size={18} />
            <span>Dasbor Kreator</span>
          </button>

          <button
            onClick={() => {
              setViewingProfile(myProfile);
              setActiveTab('profile');
            }}
            className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-bold text-sm transition ${
              activeTab === 'profile' && viewingProfile?.id === myProfile.id
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/25'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <User size={18} />
            <span>Profil Saya</span>
          </button>

          {/* Quick Compose Button */}
          <div className="pt-4">
            <button
              onClick={() => setComposerOpen(true)}
              className="w-full py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-blue-600 to-violet-600 hover:brightness-110 shadow-lg shadow-violet-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus size={18} />
              <span>Buat Postingan</span>
            </button>
          </div>
        </div>

        {/* Current User Card & Logout */}
        <div className="p-4 border-t border-white/5 bg-white/[0.01]">
          <div className="flex items-center justify-between">
            <div 
              className="flex items-center gap-2.5 min-w-0 cursor-pointer"
              onClick={() => {
                setViewingProfile(myProfile);
                setActiveTab('profile');
              }}
            >
              <ImageWithFallback
                src={myProfile.avatar_url}
                alt={myProfile.display_name}
                className="w-9 h-9 rounded-full object-cover border border-violet-500/40"
              />
              <div className="min-w-0">
                <span className="font-bold text-xs text-white block truncate">{myProfile.display_name}</span>
                <span className="text-[10px] text-gray-500 block truncate">@{myProfile.username}</span>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="p-2 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition"
              title="Keluar ke Landing Page"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* 2. MAIN CONTENT VIEW */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Mobile Top Header (Facebook-Style dengan Hamburger Drawer Menu) */}
        <header className="lg:hidden sticky top-0 z-30 bg-[#0A0E17]/95 backdrop-blur-md border-b border-white/5 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Logo D */}
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-violet-600 flex items-center justify-center font-black text-sm text-white shadow-md shadow-blue-500/25 shrink-0">
              D
            </div>

            {/* Maskot Anime Dqua Beranimasi di Samping Huruf D */}
            <div 
              onClick={() => showToast('Hai! Maskot Dqua siap menemani aktivitas kamu ✦', 'info')}
              className="relative cursor-pointer shrink-0"
              title="Maskot Anime Dqua"
            >
              <div className="w-8 h-8 rounded-full p-[1.5px] bg-gradient-to-tr from-cyan-400 via-blue-500 to-violet-500 animate-mascot-float">
                <ImageWithFallback
                  src={MASCOT_ASSETS.chibiSticker}
                  fallbackSrc={MASCOT_ASSETS.portraitAvatar}
                  alt="Maskot Dqua"
                  className="w-full h-full object-cover rounded-full bg-[#0E1322]"
                />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-cyan-400 border-2 border-[#0A0E17] rounded-full animate-pulse" />
            </div>

            <span className="font-black text-base text-white tracking-tight ml-1">
              {activeTab === 'feed' ? 'Beranda' :
               activeTab === 'explore' ? 'Jelajahi' :
               activeTab === 'chat' ? 'Pesan E2EE' :
               activeTab === 'notif' ? 'Notifikasi' :
               activeTab === 'dashboard' ? 'Dasbor' : 'Profil'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveTab('explore');
                setViewingProfile(null);
              }}
              className="p-2 rounded-full bg-white/5 text-gray-300 hover:text-white transition"
              aria-label="Cari"
            >
              <Search size={18} />
            </button>

            <button
              onClick={() => setActiveTab('notif')}
              className="relative p-2 rounded-full bg-white/5 text-gray-300 hover:text-white transition"
              aria-label="Notifikasi"
            >
              <Bell size={18} />
              {unreadNotifs > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-violet-500 rounded-full" />
              )}
            </button>

            {/* Hamburger Menu Toggle (Ref: Screenshot FB Drawer) */}
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="p-2 rounded-full bg-white/5 text-gray-300 hover:text-white transition"
              aria-label="Menu Hamburger"
            >
              <Menu size={18} />
            </button>
          </div>
        </header>

        {/* Scrollable View Area */}
        <main className="flex-1 overflow-y-auto no-scrollbar pb-24 lg:pb-8 p-3 sm:p-6">
          <div className="max-w-4xl mx-auto w-full">
            {/* VIEW 1: SOCIAL FEED */}
            {activeTab === 'feed' && (
              <div className="space-y-4 max-w-2xl mx-auto">
                {/* Status Trigger Box (Ref: Screenshot 3) */}
                <div 
                  onClick={() => setComposerOpen(true)}
                  className="bg-[#0E1322] border border-white/5 rounded-2xl p-4 shadow-xl flex items-center gap-3 cursor-pointer hover:border-violet-500/30 transition group"
                >
                  <ImageWithFallback
                    src={myProfile.avatar_url}
                    alt={myProfile.display_name}
                    className="w-10 h-10 rounded-full object-cover border border-violet-500/30"
                  />
                  <div className="flex-1 bg-white/5 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-gray-400 group-hover:text-gray-300 transition">
                    Apa yang Anda pikirkan untuk pendukung Anda?
                  </div>
                  <button className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs transition">
                    Posting
                  </button>
                </div>

                {/* Posts List */}
                <div className="space-y-4">
                  {posts.map((post) => {
                    const isCommentsOpen = expandedComments[post.id] || false;
                    return (
                      <article 
                        key={post.id} 
                        className="bg-[#0E1322] border border-white/5 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3.5"
                      >
                        {/* Post Header */}
                        <div className="flex items-center justify-between">
                          <div 
                            className="flex items-center gap-3 cursor-pointer"
                            onClick={() => {
                              const foundCreator = creators.find(c => c.username === post.author.username);
                              if (foundCreator) handleOpenCreatorProfile(foundCreator);
                            }}
                          >
                            <ImageWithFallback
                              src={post.author.avatar_url}
                              alt={post.author.display_name}
                              className="w-11 h-11 rounded-full object-cover border border-violet-500/30"
                            />
                            <div>
                              <h4 className="font-bold text-sm text-white flex items-center gap-1 hover:underline">
                                {post.author.display_name}
                                {post.author.is_verified && <span className="text-cyan-400 text-xs">✦</span>}
                              </h4>
                              <div className="flex items-center gap-2 text-[11px] text-gray-500">
                                <span>@{post.author.username}</span>
                                <span>·</span>
                                <span>{post.created_at}</span>
                                <span>·</span>
                                <span className="flex items-center gap-1">
                                  {post.visibility === 'public' ? <Globe size={10} /> : <Lock size={10} className="text-amber-400" />}
                                  {post.visibility === 'public' ? 'Publik' : 'Supporter'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Action Dukung button */}
                          <button
                            onClick={() => {
                              const foundCreator = creators.find(c => c.username === post.author.username) || creators[0];
                              setSelectedCreatorForDonation(foundCreator);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-violet-600/20 hover:bg-violet-600 text-violet-300 hover:text-white text-xs font-bold border border-violet-500/30 transition flex items-center gap-1 cursor-pointer"
                          >
                            <DollarSign size={13} />
                            <span>Dukung</span>
                          </button>
                        </div>

                        {/* Optional Meta Tags */}
                        {(post.music_tag || post.collab_tag || post.location_tag) && (
                          <div className="flex items-center gap-2 flex-wrap text-[11px]">
                            {post.music_tag && (
                              <span className="flex items-center gap-1 text-pink-400 bg-pink-500/10 px-2.5 py-0.5 rounded-full border border-pink-500/20 font-medium">
                                <Music size={11} /> {post.music_tag}
                              </span>
                            )}
                            {post.collab_tag && (
                              <span className="flex items-center gap-1 text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20 font-medium">
                                <Users size={11} /> {post.collab_tag}
                              </span>
                            )}
                            {post.location_tag && (
                              <span className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 font-medium">
                                <MapPin size={11} /> {post.location_tag}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Post Content */}
                        <p className="text-xs sm:text-sm text-gray-200 leading-relaxed whitespace-pre-line">
                          {post.content}
                        </p>

                        {/* Attached Media with Anti-Error Fallback */}
                        {post.media_urls && post.media_urls.length > 0 && (
                          <div className="rounded-xl overflow-hidden border border-white/5 bg-black/40">
                            <ImageWithFallback
                              src={post.media_urls[0]}
                              alt="Media karya"
                              fallbackSrc={MASCOT_ASSETS.heroDesktop}
                              className="w-full max-h-[460px] object-cover hover:scale-[1.01] transition duration-300"
                            />
                          </div>
                        )}

                        {/* Interaction Bar */}
                        <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs text-gray-400">
                          <div className="flex items-center gap-4">
                            <button
                              onClick={() => handleToggleLike(post.id)}
                              className={`flex items-center gap-1.5 transition ${
                                post.liked_by_me ? 'text-pink-500 font-bold' : 'hover:text-white'
                              }`}
                            >
                              <Heart size={16} className={post.liked_by_me ? 'fill-pink-500' : ''} />
                              <span>{post.likes_count}</span>
                            </button>

                            <button
                              onClick={() => setExpandedComments({
                                ...expandedComments,
                                [post.id]: !isCommentsOpen,
                              })}
                              className="flex items-center gap-1.5 hover:text-white transition"
                            >
                              <MessageSquare size={16} />
                              <span>{post.comments_count}</span>
                            </button>

                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(`${window.location.origin}/?post=${post.id}`);
                                showToast('Link postingan berhasil disalin!', 'success');
                              }}
                              className="flex items-center gap-1.5 hover:text-white transition"
                              title="Bagikan postingan"
                            >
                              <Share2 size={16} />
                            </button>
                          </div>

                          <button
                            onClick={() => handleToggleBookmark(post.id)}
                            className={`transition ${post.bookmarked_by_me ? 'text-violet-400' : 'hover:text-white'}`}
                          >
                            <Bookmark size={16} className={post.bookmarked_by_me ? 'fill-violet-400' : ''} />
                          </button>
                        </div>

                        {/* Expandable Comments Section */}
                        {isCommentsOpen && (
                          <div className="pt-3 border-t border-white/5 space-y-3">
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                              {post.comments.length === 0 ? (
                                <p className="text-xs text-gray-500 text-center py-2">Belum ada komentar. Jadilah yang pertama berkomentar!</p>
                              ) : (
                                post.comments.map((comment) => (
                                  <div key={comment.id} className="p-2.5 rounded-xl bg-white/5 flex items-start gap-2.5 text-xs">
                                    <ImageWithFallback
                                      src={comment.author_avatar}
                                      alt={comment.author_name}
                                      className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between">
                                        <span className="font-bold text-white">{comment.author_name}</span>
                                        <span className="text-[10px] text-gray-500">{comment.created_at}</span>
                                      </div>
                                      <p className="text-gray-300 mt-0.5">{comment.content}</p>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>

                            <form onSubmit={(e) => handleAddComment(post.id, e)} className="flex items-center gap-2">
                              <input
                                type="text"
                                placeholder="Tulis komentar..."
                                value={commentInputs[post.id] || ''}
                                onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
                              />
                              <button
                                type="submit"
                                disabled={!commentInputs[post.id]?.trim()}
                                className="px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:bg-white/5 text-white disabled:text-gray-600 text-xs font-bold transition"
                              >
                                Kirim
                              </button>
                            </form>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              </div>
            )}

            {/* VIEW 2: EXPLORE CREATORS */}
            {activeTab === 'explore' && (
              <div className="space-y-5 max-w-4xl mx-auto">
                <div className="bg-[#0E1322] border border-white/5 rounded-2xl p-5 shadow-xl">
                  <h2 className="text-xl font-black text-white mb-1">Jelajahi Kreator Indonesia</h2>
                  <p className="text-xs text-gray-400">Temukan kreator gaming, ilustrator anime, musisi, dan vlogger favoritmu.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {creators.map((c) => (
                    <div
                      key={c.id}
                      className="bg-[#0E1322] border border-white/5 rounded-2xl p-5 shadow-xl flex flex-col justify-between hover:border-violet-500/30 transition group"
                    >
                      <div>
                        <div className="flex items-center gap-3 mb-3">
                          <ImageWithFallback
                            src={c.avatar_url}
                            alt={c.display_name}
                            className="w-12 h-12 rounded-full object-cover border border-violet-500/30"
                          />
                          <div className="min-w-0">
                            <h4 
                              onClick={() => handleOpenCreatorProfile(c)}
                              className="font-bold text-sm text-white truncate cursor-pointer hover:underline"
                            >
                              {c.display_name}
                            </h4>
                            <p className="text-xs text-gray-400">@{c.username} · {c.category}</p>
                          </div>
                        </div>

                        <p className="text-xs text-gray-300 line-clamp-3 mb-4 leading-relaxed">
                          {c.bio}
                        </p>

                        <div className="grid grid-cols-2 gap-2 p-2 bg-black/40 rounded-xl mb-4 text-xs font-mono">
                          <div>
                            <span className="text-[10px] text-gray-500 block">Pengikut</span>
                            <span className="text-white font-bold">{c.followers_count.toLocaleString('id-ID')}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-500 block">Total Donasi</span>
                            <span className="text-emerald-400 font-bold">Rp {(c.total_donations_idr / 1000).toFixed(0)}k</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenCreatorProfile(c)}
                          className="flex-1 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-gray-300 transition"
                        >
                          Lihat Profil
                        </button>
                        <button
                          onClick={() => setSelectedCreatorForDonation(c)}
                          className="flex-1 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-violet-600 hover:brightness-110 shadow-md transition"
                        >
                          Dukung
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* VIEW 3: E2EE CHAT */}
            {activeTab === 'chat' && <E2EEChat />}

            {/* VIEW 4: NOTIFICATIONS */}
            {activeTab === 'notif' && (
              <NotificationCenter 
                onOpenCreator={(name) => {
                  const found = creators.find(c => c.display_name.toLowerCase().includes(name.toLowerCase()));
                  if (found) handleOpenCreatorProfile(found);
                }} 
                onOpenChat={() => setActiveTab('chat')} 
              />
            )}

            {/* VIEW 5: CREATOR DASHBOARD */}
            {activeTab === 'dashboard' && (
              <CreatorDashboardView onOpenComposer={() => setComposerOpen(true)} />
            )}

            {/* VIEW 6: CREATOR PROFILE (Dengan Bottom Sheet Edit Foto Profil & Sampul) */}
            {activeTab === 'profile' && viewingProfile && (
              <div className="space-y-4 max-w-3xl mx-auto">
                <div className="bg-[#0E1322] border border-white/5 rounded-2xl overflow-hidden shadow-2xl relative">
                  {/* Cover Photo */}
                  <div className="h-44 sm:h-52 bg-slate-800 relative group">
                    <ImageWithFallback
                      src={viewingProfile.cover_url}
                      alt="Cover"
                      fallbackSrc="https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1000&auto=format&fit=crop"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0E1322] via-transparent to-transparent" />
                    
                    {/* Camera Button on Cover (Only for own profile) */}
                    {viewingProfile.id === myProfile.id && (
                      <button
                        onClick={() => {
                          setEditProfileTarget('cover');
                          setIsEditProfileOpen(true);
                        }}
                        className="absolute top-3 right-3 px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 backdrop-blur-md border border-white/10 transition shadow-lg"
                      >
                        <Camera size={14} />
                        <span>Edit Sampul</span>
                      </button>
                    )}
                  </div>

                  <div className="px-5 pb-5 relative">
                    <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4 -mt-16 sm:-mt-14 mb-4">
                      {/* Avatar with Camera Icon Overlay (Ref: Screenshot FB) */}
                      <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                        <div className="relative group">
                          <ImageWithFallback
                            src={viewingProfile.avatar_url}
                            alt={viewingProfile.display_name}
                            fallbackSrc={MASCOT_ASSETS.portraitAvatar}
                            className="w-28 h-28 rounded-full object-cover border-4 border-[#0E1322] shadow-2xl bg-gray-900"
                          />
                          {viewingProfile.id === myProfile.id && (
                            <button
                              onClick={() => {
                                setEditProfileTarget('avatar');
                                setIsEditProfileOpen(true);
                              }}
                              className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-violet-600 hover:bg-violet-700 text-white flex items-center justify-center border-2 border-[#0E1322] shadow-md transition"
                              title="Ganti Foto Profil"
                              aria-label="Ganti Foto Profil"
                            >
                              <Camera size={14} />
                            </button>
                          )}
                        </div>

                        <div>
                          <h2 className="text-xl font-black text-white flex items-center justify-center sm:justify-start gap-1.5">
                            {viewingProfile.display_name}
                            <span className="text-cyan-400 text-sm">✦</span>
                          </h2>
                          <p className="text-xs text-gray-400">@{viewingProfile.username} · {viewingProfile.category}</p>
                          <p className="text-xs text-gray-500 mt-0.5">📍 {viewingProfile.location}</p>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-end">
                        <button
                          onClick={() => setSelectedCreatorForDonation(viewingProfile)}
                          className="px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-blue-600 to-violet-600 hover:brightness-110 shadow-lg shadow-violet-600/30 transition flex items-center gap-1.5"
                        >
                          <Heart size={14} className="fill-white" />
                          <span>Dukung Kreator</span>
                        </button>
                        
                        {viewingProfile.id === myProfile.id ? (
                          <button
                            onClick={() => {
                              setEditProfileTarget('all');
                              setIsEditProfileOpen(true);
                            }}
                            className="px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm bg-white/10 hover:bg-white/20 text-white border border-white/10 transition"
                          >
                            Edit Profil
                          </button>
                        ) : (
                          <button
                            onClick={() => setActiveTab('chat')}
                            className="px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 transition"
                          >
                            Pesan Privat
                          </button>
                        )}

                        {/* Media Audio Live Stream simulator button */}
                        <button
                          onClick={() => setIsAudioModalOpen(true)}
                          className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-violet-300 border border-white/10 transition"
                          title="Media Donasi Live Stream (YouTube/MP3)"
                        >
                          <Music size={16} />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-gray-200 max-w-2xl leading-relaxed mb-4">
                      {viewingProfile.bio}
                    </p>

                    <div className="flex items-center gap-6 text-xs text-gray-400 pt-3 border-t border-white/5 font-mono">
                      <div><strong className="text-white text-sm">{viewingProfile.followers_count.toLocaleString('id-ID')}</strong> Pengikut</div>
                      <div><strong className="text-white text-sm">{viewingProfile.following_count}</strong> Mengikuti</div>
                      <div><strong className="text-emerald-400 text-sm">Rp {viewingProfile.total_donations_idr.toLocaleString('id-ID')}</strong> Terkumpul</div>
                    </div>
                  </div>
                </div>

                {/* Profile Posts Stream */}
                <div className="space-y-4">
                  <h3 className="font-bold text-sm text-gray-400 uppercase tracking-wider px-1">Karya & Kiriman Kreator</h3>
                  {posts
                    .filter(p => p.author.username === viewingProfile.username)
                    .map(post => (
                      <div key={post.id} className="bg-[#0E1322] border border-white/5 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3">
                        <p className="text-xs sm:text-sm text-gray-200">{post.content}</p>
                        {post.media_urls && post.media_urls[0] && (
                          <ImageWithFallback 
                            src={post.media_urls[0]} 
                            alt="Media" 
                            fallbackSrc={MASCOT_ASSETS.heroDesktop}
                            className="rounded-xl w-full max-h-96 object-cover" 
                          />
                        )}
                        <div className="text-[11px] text-gray-500 font-mono">{post.created_at} · {post.likes_count} suka</div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </main>

        {/* 3. MOBILE BOTTOM NAVIGATION (Ref: Screenshot 1 & 2) */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0A0E17]/95 backdrop-blur-lg border-t border-white/10 px-3 py-2 flex items-center justify-around">
          <button
            onClick={() => { setActiveTab('feed'); setViewingProfile(null); }}
            className={`p-2 flex flex-col items-center gap-1 transition ${
              activeTab === 'feed' && !viewingProfile ? 'text-violet-400' : 'text-gray-500'
            }`}
          >
            <Home size={20} />
            <span className="text-[10px] font-medium">Beranda</span>
          </button>

          <button
            onClick={() => { setActiveTab('explore'); setViewingProfile(null); }}
            className={`p-2 flex flex-col items-center gap-1 transition ${
              activeTab === 'explore' ? 'text-violet-400' : 'text-gray-500'
            }`}
          >
            <Compass size={20} />
            <span className="text-[10px] font-medium">Jelajahi</span>
          </button>

          {/* Central Floating Plus Button */}
          <div className="relative -top-4">
            <button
              onClick={() => setComposerOpen(true)}
              className="w-13 h-13 rounded-full bg-gradient-to-tr from-blue-600 to-violet-600 text-white flex items-center justify-center shadow-lg shadow-violet-600/40 border-4 border-[#08070D] active:scale-95 transition cursor-pointer"
              aria-label="Buat Postingan Baru"
            >
              <Plus size={24} />
            </button>
          </div>

          <button
            onClick={() => { setActiveTab('notif'); setViewingProfile(null); }}
            className={`relative p-2 flex flex-col items-center gap-1 transition ${
              activeTab === 'notif' ? 'text-violet-400' : 'text-gray-500'
            }`}
          >
            <Bell size={20} />
            <span className="text-[10px] font-medium">Notifikasi</span>
            {unreadNotifs > 0 && (
              <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-violet-500" />
            )}
          </button>

          <button
            onClick={() => {
              setViewingProfile(myProfile);
              setActiveTab('profile');
            }}
            className={`p-2 flex flex-col items-center gap-1 transition ${
              activeTab === 'profile' ? 'text-violet-400' : 'text-gray-500'
            }`}
          >
            <User size={20} />
            <span className="text-[10px] font-medium">Profil</span>
          </button>
        </nav>
      </div>

      {/* 5. GLOBAL MODALS & SHEETS */}
      <PostComposer
        isOpen={composerOpen}
        onClose={() => setComposerOpen(false)}
        currentUser={{
          name: myProfile.display_name,
          username: myProfile.username,
          avatar: myProfile.avatar_url,
        }}
      />

      {selectedCreatorForDonation && (
        <DonationModal
          creator={selectedCreatorForDonation}
          isOpen={Boolean(selectedCreatorForDonation)}
          onClose={() => setSelectedCreatorForDonation(null)}
        />
      )}

      {/* Facebook-style Mobile Drawer Menu */}
      <MobileDrawerMenu
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        userProfile={myProfile}
        onNavigate={(tab) => {
          setActiveTab(tab);
          if (tab === 'profile') setViewingProfile(myProfile);
          else setViewingProfile(null);
        }}
        onLogout={onLogout}
      />

      {/* Facebook-style Profile Edit Sheet (Avatar & Cover) */}
      <ProfileEditSheet
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        currentProfile={myProfile}
        editTarget={editProfileTarget}
        onSave={handleSaveProfileUpdates}
      />

      {/* Donation Audio Modal */}
      <DonationAudioModal
        isOpen={isAudioModalOpen}
        onClose={() => setIsAudioModalOpen(false)}
        creatorName={viewingProfile?.display_name || myProfile.display_name}
      />
    </div>
  );
};
