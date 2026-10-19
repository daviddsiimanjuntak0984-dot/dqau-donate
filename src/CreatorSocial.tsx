import { useState, useMemo, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from './supabase';
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

interface CreatorSocialProps {
  initialProfile?: SocialProfile | null;
  onClose?: () => void;
  viewerId?: string | null;
  onNeedLogin?: () => void;
}

/**
 * 1. Facebook Style Creator Profile Component
 * Features:
 * - Cover Photo with banner
 * - Overlapping Avatar with floatCute bouncy animation
 * - Quick stats (followers, following)
 * - Navigation Tabs (Semua, Karya, Galeri, Dukungan, Lainnya)
 * - Left column: Detail Pribadi (location, bio, category)
 * - Right column: Status Composer & Feed / Donation / Gallery content
 */
export default function CreatorSocial({
  initialProfile,
  onClose,
  viewerId,
  onNeedLogin,
}: CreatorSocialProps = {}) {
  const [activeTab, setActiveTab] = useState('Semua');
  const [copied, setCopied] = useState(false);
  const [followersCount, setFollowersCount] = useState(3300);
  const [followingCount, setFollowingCount] = useState(60);
  const [isFollowing, setIsFollowing] = useState(false);

  // Fallback / default data matching user prompt
  const name = initialProfile?.display_name || 'David Simanjuntak';
  const username = initialProfile?.username || 'daviddsiimanjuntak';
  const coverUrl = initialProfile?.cover_url || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=2070';
  const avatarUrl = initialProfile?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix';
  const location = initialProfile?.location || 'Medan, Indonesia';
  const category = initialProfile?.category || 'Gamer & Kreator';
  const bio = initialProfile?.bio || 'Di sana, Di sini, Dan Di situ';
  const albumUrls = useMemo(() => initialProfile?.album_urls || [], [initialProfile?.album_urls]);

  useEffect(() => {
    if (!initialProfile?.id || !isSupabaseConfigured) return;
    const fetchStats = async () => {
      try {
        const [fRes, ingRes] = await Promise.all([
          supabase.from('creator_follows').select('follower_id', { count: 'exact', head: true }).eq('following_id', initialProfile.id),
          supabase.from('creator_follows').select('following_id', { count: 'exact', head: true }).eq('follower_id', initialProfile.id),
        ]);
        if (fRes.count !== null && fRes.count !== undefined) setFollowersCount(fRes.count);
        if (ingRes.count !== null && ingRes.count !== undefined) setFollowingCount(ingRes.count);

        if (viewerId && viewerId !== initialProfile.id) {
          const check = await supabase.from('creator_follows').select('follower_id').eq('follower_id', viewerId).eq('following_id', initialProfile.id).maybeSingle();
          if (check.data) setIsFollowing(true);
        }
      } catch {
        // use default stats
      }
    };
    void fetchStats();
  }, [initialProfile?.id, viewerId]);

  const tabs = ['Semua', 'Karya', 'Galeri', 'Dukungan', 'Lainnya'];

  const handleShare = async () => {
    const url = window.location.origin + '/?creator=' + encodeURIComponent(username);
    try {
      if (navigator.share) {
        await navigator.share({ title: name, text: `Kunjungi profil ${name} di Dqau Donate`, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        window.prompt('Salin link profil ini:', url);
      }
    }
  };

  const handleToggleFollow = async () => {
    if (!viewerId) {
      if (onNeedLogin) onNeedLogin();
      return;
    }
    if (!initialProfile?.id || viewerId === initialProfile.id) return;

    if (isFollowing) {
      setIsFollowing(false);
      setFollowersCount((prev) => Math.max(0, prev - 1));
      await supabase.from('creator_follows').delete().eq('follower_id', viewerId).eq('following_id', initialProfile.id);
    } else {
      setIsFollowing(true);
      setFollowersCount((prev) => prev + 1);
      await supabase.from('creator_follows').insert({ follower_id: viewerId, following_id: initialProfile.id });
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-gray-50 min-h-screen pb-20 animate-pop-in relative rounded-2xl overflow-hidden shadow-2xl text-gray-900 my-4 border border-gray-200">
      
      {/* Tombol Tutup jika dibuka dalam mode modal */}
      {onClose && (
        <button
          onClick={onClose}
          aria-label="Tutup profil"
          className="absolute top-4 right-4 z-20 bg-black/60 hover:bg-black/80 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-xl btn-cute cursor-pointer shadow-lg"
        >
          ×
        </button>
      )}

      {/* 1. BAGIAN COVER & AVATAR (Gaya Facebook) */}
      <div className="bg-white shadow-sm pb-4">
        {/* Cover Photo */}
        <div className="h-48 md:h-64 w-full bg-indigo-200 relative overflow-hidden">
          <img 
            src={coverUrl} 
            alt="Cover" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
        </div>
        
        {/* Avatar & Header Info */}
        <div className="px-4 relative">
          <div className="flex justify-between items-end">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white bg-white -mt-12 md:-mt-16 relative z-10 overflow-hidden shadow-md animate-float-cute">
              <img 
                src={avatarUrl} 
                alt="Profile" 
                className="w-full h-full object-cover bg-gray-100"
              />
            </div>
            {viewerId && initialProfile && viewerId !== initialProfile.id && (
              <button
                onClick={handleToggleFollow}
                className={`py-2 px-5 rounded-lg font-semibold text-sm btn-cute shadow-sm ${
                  isFollowing ? 'bg-gray-200 text-gray-800 hover:bg-gray-300' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {isFollowing ? '✓ Mengikuti' : '+ Ikuti'}
              </button>
            )}
          </div>
          
          <div className="mt-3">
            <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
            <p className="text-gray-500 font-medium text-sm">
              {followersCount >= 1000 ? (followersCount / 1000).toFixed(1).replace('.', ',') + ' rb' : followersCount} pengikut • {followingCount} mengikuti
            </p>
            <p className="mt-2 text-sm text-gray-700">
              🎮 {category} 📍 {location} 🏢 {bio}
            </p>
          </div>

          {/* Tombol Aksi */}
          <div className="flex gap-2 mt-4">
            <button 
              onClick={() => setActiveTab('Dukungan')}
              className="flex-1 bg-blue-600 text-white font-semibold py-2.5 rounded-lg btn-cute cursor-pointer shadow-md hover:bg-blue-700 text-center"
            >
              + Dukung Kreator
            </button>
            <button 
              onClick={handleShare}
              className="flex-1 bg-gray-200 text-gray-800 font-semibold py-2.5 rounded-lg btn-cute cursor-pointer hover:bg-gray-300 text-center"
            >
              {copied ? 'Tautan Disalin ✓' : 'Bagikan Profil'}
            </button>
          </div>
        </div>

        {/* 2. TABS NAVIGASI */}
        <div className="flex overflow-x-auto gap-2 px-4 mt-6 border-b border-gray-100 pb-2 scrollbar-hide">
          {tabs.map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-full font-semibold text-sm whitespace-nowrap btn-cute transition-colors cursor-pointer ${
                activeTab === tab ? 'bg-blue-100 text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* 3. KONTEN BAWAH (Detail Pribadi & Feed) */}
      <div className="flex flex-col md:flex-row gap-4 p-4">
        
        {/* Kolom Kiri: Detail Pribadi */}
        <div className="w-full md:w-1/3 space-y-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 animate-bouncy-slide" style={{animationDelay: '0.1s'}}>
            <h2 className="font-bold text-lg mb-3 text-gray-800">Detail Pribadi</h2>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex items-center gap-2">📍 <span>Tinggal di <strong>{location}</strong></span></li>
              <li className="flex items-center gap-2">🏢 <span>Bekerja di <strong>{bio.slice(0, 30) || 'Kreator Digital'}</strong></span></li>
              <li className="flex items-center gap-2">🎂 <span>Kategori <strong>{category}</strong></span></li>
              <li className="flex items-center gap-2">🔗 <span>Akun <strong>@{username}</strong></span></li>
            </ul>
          </div>

          {/* Album Showcase di sidebar jika ada */}
          {albumUrls.length > 0 && (
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 animate-bouncy-slide" style={{animationDelay: '0.2s'}}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm text-gray-800">Foto & Galeri ({albumUrls.length})</h3>
                <button onClick={() => setActiveTab('Galeri')} className="text-xs text-blue-600 hover:underline font-semibold cursor-pointer">Lihat semua</button>
              </div>
              <div className="grid grid-cols-3 gap-1.5 rounded-lg overflow-hidden">
                {albumUrls.slice(0, 6).map((imgUrl, i) => (
                  <a href={imgUrl} target="_blank" rel="noopener noreferrer" key={i} className="aspect-square bg-gray-100 block overflow-hidden hover:opacity-90 transition">
                    <img src={imgUrl} alt="Album" className="w-full h-full object-cover" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Kolom Kanan: Area Feed / Konten */}
        <div className="w-full md:w-2/3">
          
          {/* Tab Dukungan: Tampilkan formulir donasi Midtrans */}
          {activeTab === 'Dukungan' && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-bouncy-slide">
              <DonationForm creatorId={initialProfile?.id || 'demo-creator'} creatorName={name} />
            </div>
          )}

          {/* Tab Galeri: Tampilkan foto-foto album */}
          {activeTab === 'Galeri' && (
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 animate-bouncy-slide">
              <h2 className="font-bold text-lg text-gray-800 mb-4">Galeri Foto {name}</h2>
              {albumUrls.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {albumUrls.map((url, i) => (
                    <a href={url} target="_blank" rel="noopener noreferrer" key={i} className="rounded-xl overflow-hidden shadow-sm aspect-square block bg-gray-100 hover:scale-[1.02] transition">
                      <img src={url} alt={`Galeri ${i+1}`} className="w-full h-full object-cover" />
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-center py-10 text-gray-400">Belum ada foto yang diunggah ke album.</p>
              )}
            </div>
          )}

          {/* Tab Karya / Semua / Lainnya */}
          {activeTab !== 'Dukungan' && activeTab !== 'Galeri' && (
            <>
              {/* Status Composer */}
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-4 animate-bouncy-slide" style={{animationDelay: '0.2s'}}>
                <div className="flex gap-3 items-center">
                  <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                    <img src={avatarUrl} alt="User" className="w-full h-full object-cover" />
                  </div>
                  <div 
                    onClick={() => setActiveTab('Dukungan')}
                    className="bg-gray-100 rounded-full py-2.5 px-4 flex-1 text-gray-500 text-sm cursor-pointer hover:bg-gray-200 transition"
                  >
                    Tulis sesuatu untuk pendukungmu...
                  </div>
                </div>
              </div>

              {/* Tempat di mana komponen PublicFeed kamu akan ditaruh */}
              <div className="text-center p-8 bg-white rounded-xl shadow-sm border border-gray-100 animate-bouncy-slide mb-4" style={{animationDelay: '0.3s'}}>
                <span className="text-3xl block mb-2">✦</span>
                <h3 className="font-bold text-gray-800 text-base mb-1">Menampilkan tab: <strong>{activeTab}</strong></h3>
                <p className="text-gray-500 text-sm max-w-md mx-auto">
                  Semua kiriman apresiasi, video siaran, dan karya kreator akan tampil di feed ini.
                </p>
                <button
                  onClick={() => setActiveTab('Dukungan')}
                  className="mt-4 inline-block bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg btn-cute cursor-pointer shadow-md text-sm"
                >
                  Kirim Donasi & Pesan ke {name}
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

/**
 * Compatibility wrapper for modal dialog in App.tsx
 */
export function CreatorSocialProfile({
  profile,
  viewerId,
  onClose,
  onNeedLogin,
}: {
  profile: SocialProfile;
  viewerId: string | null;
  viewerHasProfile?: boolean;
  onClose: () => void;
  onNeedLogin: () => void;
}) {
  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-start justify-center p-2 sm:p-4"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-3xl my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <CreatorSocial
          initialProfile={profile}
          onClose={onClose}
          viewerId={viewerId}
          onNeedLogin={onNeedLogin}
        />
      </div>
    </div>
  );
}

/**
 * Creator Dashboard component exported for App.tsx
 */
export function CreatorDashboard({
  profile,
  onOpenProfile,
}: {
  profileId: string;
  profile: SocialProfile | null;
  onOpenProfile: () => void;
}) {
  return (
    <section className="creator-dashboard animate-slide-up" aria-label="Dasbor kreator">
      <div className="creator-dashboard-heading">
        <div>
          <span className="creator-dashboard-eyebrow">DASBOR KREATOR</span>
          <h3>Profil & Ruang Komunitas</h3>
          <p>Kelola profil publik, lihat statistik pendukung, dan hubungkan overlay streaming.</p>
        </div>
        <div className="creator-dashboard-mark" aria-hidden="true">✦</div>
      </div>
      <div className="creator-dashboard-stats">
        <div className="creator-dashboard-stat">
          <span>Kreator</span>
          <strong>{profile?.display_name || 'Kreator Baru'}</strong>
        </div>
        <div className="creator-dashboard-stat">
          <span>Username</span>
          <strong>@{profile?.username || 'kreator'}</strong>
        </div>
        <div className="creator-dashboard-stat">
          <span>Kategori</span>
          <strong>{profile?.category || 'Umum'}</strong>
        </div>
        <div className="creator-dashboard-stat">
          <span>Status Profil</span>
          <strong>Aktif ✓</strong>
        </div>
      </div>
      <div className="creator-dashboard-actions">
        <button className="btn btn-primary btn-cute" type="button" onClick={onOpenProfile}>
          Lihat Profil Facebook-Style
        </button>
        <a className="creator-dashboard-link btn-cute" href="#kreator">
          Jelajahi Kreator Lain ↗
        </a>
      </div>
    </section>
  );
}
