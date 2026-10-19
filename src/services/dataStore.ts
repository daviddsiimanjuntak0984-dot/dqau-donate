import { MASCOT_ASSETS } from '../assets/mascot';

export interface CreatorProfile {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  cover_url: string;
  category: string;
  location: string;
  is_verified: boolean;
  followers_count: number;
  following_count: number;
  total_donations_idr: number;
  monthly_views: number;
  monthly_interactions: number;
}

export interface SocialPost {
  id: string;
  author: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string;
    is_creator: boolean;
    is_verified: boolean;
  };
  content: string;
  media_urls?: string[];
  media_type?: 'image' | 'video' | 'album' | 'audio';
  music_tag?: string;
  location_tag?: string;
  collab_tag?: string;
  is_exclusive?: boolean;
  visibility: 'public' | 'supporters' | 'private';
  likes_count: number;
  comments_count: number;
  shares_count: number;
  liked_by_me: boolean;
  bookmarked_by_me: boolean;
  created_at: string;
  comments: PostComment[];
}

export interface PostComment {
  id: string;
  author_name: string;
  author_username: string;
  author_avatar: string;
  content: string;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  type: 'comment' | 'donation' | 'follow' | 'like' | 'system' | 'message';
  title: string;
  description: string;
  actor_name?: string;
  actor_avatar?: string;
  amount_idr?: number;
  target_id?: string;
  time_ago: string;
  is_read: boolean;
  created_at: string;
}

export interface E2EEMessageItem {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  ciphertext: string;
  nonce: string;
  plaintext?: string;
  time: string;
  status: 'sent' | 'delivered' | 'read';
  is_me: boolean;
}

export interface E2EEConversationItem {
  id: string;
  partner_id: string;
  partner_name: string;
  partner_username: string;
  partner_avatar: string;
  partner_verified: boolean;
  is_online: boolean;
  last_message_preview: string;
  last_message_time: string;
  unread_count: number;
  safety_number: string;
  messages: E2EEMessageItem[];
}

export interface DonationRecord {
  id: string;
  creator_id: string;
  creator_name: string;
  donor_name: string;
  donor_email: string;
  amount_gross: number;
  platform_fee_percent: number; // 5%
  platform_fee_amount: number;
  amount_net: number;
  payment_method: 'qris' | 'gopay' | 'ovo' | 'dana' | 'bca_va' | 'mandiri_va' | 'bri_va';
  payment_reference: string;
  status: 'pending' | 'settled' | 'expired' | 'failed';
  message: string;
  created_at: string;
}

// Initial Creators
export const INITIAL_CREATORS: CreatorProfile[] = [
  {
    id: 'creator-david',
    username: 'daviddsiimanjuntak',
    display_name: 'David Simanjuntak',
    bio: 'Kreator konten gaming, live streaming cyberpunk, dan pengembang Dqua Donate. Mari bangun komunitas karya positif!',
    avatar_url: MASCOT_ASSETS.portraitAvatar,
    cover_url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=2070',
    category: 'Gaming & Tech',
    location: 'Medan, Indonesia',
    is_verified: true,
    followers_count: 3490,
    following_count: 120,
    total_donations_idr: 1250000,
    monthly_views: 4120,
    monthly_interactions: 850,
  },
  {
    id: 'creator-rizky',
    username: 'RizkyGaming',
    display_name: 'Rizky Pratama',
    bio: 'FPS Pro Player & Content Creator. Live setiap hari jam 20:00 WIB. Terima kasih dukungannya!',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rizky',
    cover_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800',
    category: 'Gaming & Esports',
    location: 'Jakarta, Indonesia',
    is_verified: true,
    followers_count: 12400,
    following_count: 45,
    total_donations_idr: 8500000,
    monthly_views: 18400,
    monthly_interactions: 2300,
  },
  {
    id: 'creator-luna',
    username: 'LunaArt',
    display_name: 'Luna Clarissa',
    bio: 'Digital Illustrator anime & concept artist. Komisi gambar & konten eksklusif di Dqua!',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna',
    cover_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800',
    category: 'Seni & Desain',
    location: 'Bandung, Indonesia',
    is_verified: true,
    followers_count: 8700,
    following_count: 210,
    total_donations_idr: 5200000,
    monthly_views: 11200,
    monthly_interactions: 1650,
  },
  {
    id: 'creator-kopi',
    username: 'KopiSasicy',
    display_name: 'Sasicy Acoustic',
    bio: 'Indie Musician & Lo-Fi Beatmaker. Dengarkan rilisan terbaruku di feed Dqua.',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kopi',
    cover_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800',
    category: 'Musik & Podcast',
    location: 'Yogyakarta, Indonesia',
    is_verified: true,
    followers_count: 15300,
    following_count: 98,
    total_donations_idr: 12700000,
    monthly_views: 24500,
    monthly_interactions: 4100,
  },
  {
    id: 'creator-dika',
    username: 'DikaVlog',
    display_name: 'Dika Ramadhan',
    bio: 'Traveling & Urban Exploration vlogger Indonesia. Berkeliling nusantara mencari kuliner tersembunyi.',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dika',
    cover_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800',
    category: 'Vlog & Traveling',
    location: 'Surabaya, Indonesia',
    is_verified: true,
    followers_count: 11200,
    following_count: 88,
    total_donations_idr: 7900000,
    monthly_views: 14200,
    monthly_interactions: 1950,
  },
];

// Initial Posts
export const INITIAL_POSTS: SocialPost[] = [
  {
    id: 'post-1',
    author: {
      id: 'creator-david',
      username: 'daviddsiimanjuntak',
      display_name: 'David Simanjuntak',
      avatar_url: MASCOT_ASSETS.portraitAvatar,
      is_creator: true,
      is_verified: true,
    },
    content: 'Halo teman-teman pendukung Dqua Donate! Selamat datang di era baru platform komunitas dan donasi kreator Indonesia. Sekarang kalian bisa ngobrol privat dengan E2EE encryption, berdonasi instan via QRIS 5% fee, dan menikmati update feed eksklusif.',
    media_urls: [MASCOT_ASSETS.heroDesktop],
    media_type: 'image',
    music_tag: 'Dqau Cyberpunk Theme (Lo-Fi Mix)',
    location_tag: 'Medan, Indonesia',
    collab_tag: 'Dqua Community',
    is_exclusive: false,
    visibility: 'public',
    likes_count: 148,
    comments_count: 16,
    shares_count: 24,
    liked_by_me: true,
    bookmarked_by_me: true,
    created_at: '2 jam lalu',
    comments: [
      {
        id: 'c1',
        author_name: 'Melati Yeoja',
        author_username: 'melatiyeoja',
        author_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Melati',
        content: 'Keren banget platformnya bang David! Desain neon cyberpunk-nya juara!',
        created_at: '1 jam lalu',
      },
      {
        id: 'c2',
        author_name: 'Rizky Pratama',
        author_username: 'RizkyGaming',
        author_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rizky',
        content: 'Fitur E2EE dan QRIS-nya smooth banget. Siap live stream bareng!',
        created_at: '30 menit lalu',
      },
    ],
  },
  {
    id: 'post-2',
    author: {
      id: 'creator-luna',
      username: 'LunaArt',
      display_name: 'Luna Clarissa',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna',
      is_creator: true,
      is_verified: true,
    },
    content: 'Preview karakter maskot original Dqua Chibi! Versi stiker siap diunduh untuk semua supporter tingkatan Silver ke atas yaa 💜✨',
    media_urls: [MASCOT_ASSETS.chibiSticker],
    media_type: 'image',
    music_tag: 'Kawaii Chill Beats - Luna',
    location_tag: 'Bandung Creative Space',
    is_exclusive: true,
    visibility: 'supporters',
    likes_count: 94,
    comments_count: 8,
    shares_count: 12,
    liked_by_me: false,
    bookmarked_by_me: false,
    created_at: '4 jam lalu',
    comments: [
      {
        id: 'c3',
        author_name: 'Fujiwara Chika',
        author_username: 'chika_anime',
        author_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Chika',
        content: 'Gemes banget stikernya, langsung donasi buat dapetin resolusi HD-nya!',
        created_at: '2 jam lalu',
      },
    ],
  },
  {
    id: 'post-3',
    author: {
      id: 'creator-kopi',
      username: 'KopiSasicy',
      display_name: 'Sasicy Acoustic',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kopi',
      is_creator: true,
      is_verified: true,
    },
    content: 'Terima kasih banyak atas 15.000 followers di Dqua Donate! Ini dia rekaman sesi latihan gitar akustik kemarin malam di studio kecil.',
    media_urls: ['https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800'],
    media_type: 'image',
    music_tag: 'Acoustic Raindrops (Unreleased)',
    location_tag: 'Yogyakarta Studio',
    is_exclusive: false,
    visibility: 'public',
    likes_count: 230,
    comments_count: 19,
    shares_count: 31,
    liked_by_me: false,
    bookmarked_by_me: false,
    created_at: 'Kemarin',
    comments: [],
  },
];

// Initial Notifications (Ref screenshot 1)
export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    type: 'comment',
    title: 'Komentar baru',
    description: 'Melati Yeoja mengomentari postingan Anda: "Keren banget platformnya bang David!"',
    actor_name: 'Melati Yeoja',
    actor_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Melati',
    time_ago: '1 jam lalu',
    is_read: false,
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'notif-2',
    type: 'donation',
    title: 'Donasi berhasil masuk!',
    description: 'Budi Santoso berdonasi Rp 50.000 via QRIS: "Semangat ngoding Dqua Donate!"',
    actor_name: 'Budi Santoso',
    actor_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Budi',
    amount_idr: 50000,
    time_ago: '3 jam lalu',
    is_read: false,
    created_at: new Date(Date.now() - 10800000).toISOString(),
  },
  {
    id: 'notif-3',
    type: 'follow',
    title: 'Pengikut baru',
    description: 'Kresna Bayu mulai mengikuti profil kreator Anda.',
    actor_name: 'Kresna Bayu',
    actor_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kresna',
    time_ago: '5 jam lalu',
    is_read: true,
    created_at: new Date(Date.now() - 18000000).toISOString(),
  },
  {
    id: 'notif-4',
    type: 'message',
    title: 'Pesan E2EE Terenkripsi',
    description: 'Nesa Chans mengirimkan pesan privat terenkripsi baru.',
    actor_name: 'Nesa Chans',
    actor_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nesa',
    time_ago: '7 jam lalu',
    is_read: true,
    created_at: new Date(Date.now() - 25200000).toISOString(),
  },
  {
    id: 'notif-5',
    type: 'system',
    title: 'Pembaruan Keamanan Dqua',
    description: 'Enkripsi end-to-end browser aktif. Kunci privat Anda tersimpan aman di IndexedDB perangkat ini.',
    time_ago: '1 hari lalu',
    is_read: true,
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

// Initial E2EE Conversations
export const INITIAL_CONVERSATIONS: E2EEConversationItem[] = [
  {
    id: 'conv-1',
    partner_id: 'user-nesa',
    partner_name: 'Nesa Chans',
    partner_username: 'nesachans',
    partner_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nesa',
    partner_verified: true,
    is_online: true,
    last_message_preview: 'Makasih banget bang tutorial live stream dan donasinya!',
    last_message_time: '10:42',
    unread_count: 1,
    safety_number: '7F3A-89C1-02E4',
    messages: [
      {
        id: 'm1',
        conversation_id: 'conv-1',
        sender_id: 'user-nesa',
        sender_name: 'Nesa Chans',
        ciphertext: 'G8zB9+f2K...[AES-256-GCM Ciphertext]',
        nonce: 'kX4a89...',
        plaintext: 'Halo bang David! Mau tanya rekomendasi settingan overlay OBS Dqua Donate.',
        time: '10:30',
        status: 'read',
        is_me: false,
      },
      {
        id: 'm2',
        conversation_id: 'conv-1',
        sender_id: 'creator-david',
        sender_name: 'David Simanjuntak',
        ciphertext: 'h9T10v...[AES-256-GCM Ciphertext]',
        nonce: 'yB291x...',
        plaintext: 'Halo Nesa! Bisa pakai browser source dengan resolusi 1920x1080 dan aktifkan transparent background ya.',
        time: '10:38',
        status: 'read',
        is_me: true,
      },
      {
        id: 'm3',
        conversation_id: 'conv-1',
        sender_id: 'user-nesa',
        sender_name: 'Nesa Chans',
        ciphertext: 'mP398f...[AES-256-GCM Ciphertext]',
        nonce: 'zQ982c...',
        plaintext: 'Makasih banget bang tutorial live stream dan donasinya!',
        time: '10:42',
        status: 'delivered',
        is_me: false,
      },
    ],
  },
  {
    id: 'conv-2',
    partner_id: 'creator-rizky',
    partner_name: 'Rizky Pratama',
    partner_username: 'RizkyGaming',
    partner_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rizky',
    partner_verified: true,
    is_online: false,
    last_message_preview: 'Siap bro, nanti malam kita tes mabar sekalian promo Dqua.',
    last_message_time: 'Kemarin',
    unread_count: 0,
    safety_number: '9B11-44F2-E9A0',
    messages: [
      {
        id: 'm4',
        conversation_id: 'conv-2',
        sender_id: 'creator-david',
        sender_name: 'David Simanjuntak',
        ciphertext: 'q98aBf...[AES-256-GCM Ciphertext]',
        nonce: 'aB87c1...',
        plaintext: 'Bro Rizky, nanti malam mau tes mabar Valorant jam berapa?',
        time: 'Kemarin 18:20',
        status: 'read',
        is_me: true,
      },
      {
        id: 'm5',
        conversation_id: 'conv-2',
        sender_id: 'creator-rizky',
        sender_name: 'Rizky Pratama',
        ciphertext: 'pA0987...[AES-256-GCM Ciphertext]',
        nonce: 'cX2289...',
        plaintext: 'Siap bro, nanti malam kita tes mabar sekalian promo Dqua.',
        time: 'Kemarin 18:45',
        status: 'read',
        is_me: false,
      },
    ],
  },
];

class ReactiveDataStore {
  private posts: SocialPost[] = INITIAL_POSTS;
  private creators: CreatorProfile[] = INITIAL_CREATORS;
  private notifications: NotificationItem[] = INITIAL_NOTIFICATIONS;
  private conversations: E2EEConversationItem[] = INITIAL_CONVERSATIONS;
  private donations: DonationRecord[] = [];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadFromStorage();
  }

  private notify() {
    this.saveToStorage();
    this.listeners.forEach((l) => l());
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private saveToStorage() {
    try {
      localStorage.setItem('dqau_posts', JSON.stringify(this.posts));
      localStorage.setItem('dqau_creators', JSON.stringify(this.creators));
      localStorage.setItem('dqau_notifications', JSON.stringify(this.notifications));
      localStorage.setItem('dqau_conversations', JSON.stringify(this.conversations));
      localStorage.setItem('dqau_donations', JSON.stringify(this.donations));
    } catch {
      // Storage fallback
    }
  }

  private loadFromStorage() {
    try {
      const p = localStorage.getItem('dqau_posts');
      if (p) this.posts = JSON.parse(p);
      const c = localStorage.getItem('dqau_creators');
      if (c) this.creators = JSON.parse(c);
      const n = localStorage.getItem('dqau_notifications');
      if (n) this.notifications = JSON.parse(n);
      const conv = localStorage.getItem('dqau_conversations');
      if (conv) this.conversations = JSON.parse(conv);
      const d = localStorage.getItem('dqau_donations');
      if (d) this.donations = JSON.parse(d);
    } catch {
      // ignore
    }
  }

  // --- Getters ---
  public getPosts(): SocialPost[] {
    return this.posts;
  }

  public getCreators(): CreatorProfile[] {
    return this.creators;
  }

  public getCreatorById(id: string): CreatorProfile | undefined {
    return this.creators.find((c) => c.id === id || c.username === id);
  }

  public getNotifications(): NotificationItem[] {
    return this.notifications;
  }

  public getUnreadNotificationCount(): number {
    return this.notifications.filter((n) => !n.is_read).length;
  }

  public getConversations(): E2EEConversationItem[] {
    return this.conversations;
  }

  public getConversationById(id: string): E2EEConversationItem | undefined {
    return this.conversations.find((c) => c.id === id);
  }

  public getDonations(): DonationRecord[] {
    return this.donations;
  }

  // --- Actions ---
  public addPost(post: Omit<SocialPost, 'id' | 'created_at' | 'likes_count' | 'comments_count' | 'shares_count' | 'liked_by_me' | 'bookmarked_by_me' | 'comments'>): SocialPost {
    const newPost: SocialPost = {
      ...post,
      id: 'post-' + Date.now(),
      created_at: 'baru saja',
      likes_count: 0,
      comments_count: 0,
      shares_count: 0,
      liked_by_me: false,
      bookmarked_by_me: false,
      comments: [],
    };
    this.posts = [newPost, ...this.posts];
    this.notify();
    return newPost;
  }

  public toggleLikePost(postId: string) {
    this.posts = this.posts.map((post) => {
      if (post.id === postId) {
        const nextLiked = !post.liked_by_me;
        return {
          ...post,
          liked_by_me: nextLiked,
          likes_count: nextLiked ? post.likes_count + 1 : Math.max(0, post.likes_count - 1),
        };
      }
      return post;
    });
    this.notify();
  }

  public toggleBookmarkPost(postId: string) {
    this.posts = this.posts.map((post) => {
      if (post.id === postId) {
        return {
          ...post,
          bookmarked_by_me: !post.bookmarked_by_me,
        };
      }
      return post;
    });
    this.notify();
  }

  public addComment(postId: string, commentText: string, user: { name: string; username: string; avatar: string }) {
    if (!commentText.trim()) return;
    const newComment: PostComment = {
      id: 'c-' + Date.now(),
      author_name: user.name,
      author_username: user.username,
      author_avatar: user.avatar,
      content: commentText.trim(),
      created_at: 'baru saja',
    };

    this.posts = this.posts.map((post) => {
      if (post.id === postId) {
        return {
          ...post,
          comments_count: post.comments_count + 1,
          comments: [...post.comments, newComment],
        };
      }
      return post;
    });
    this.notify();
  }

  public markNotificationAsRead(notifId: string) {
    this.notifications = this.notifications.map((n) =>
      n.id === notifId ? { ...n, is_read: true } : n
    );
    this.notify();
  }

  public markAllNotificationsAsRead() {
    this.notifications = this.notifications.map((n) => ({ ...n, is_read: true }));
    this.notify();
  }

  public sendE2EEMessage(conversationId: string, plaintext: string, ciphertext: string, nonce: string) {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const newMsg: E2EEMessageItem = {
      id: 'msg-' + Date.now(),
      conversation_id: conversationId,
      sender_id: 'creator-david',
      sender_name: 'David Simanjuntak',
      ciphertext,
      nonce,
      plaintext,
      time: timeStr,
      status: 'sent',
      is_me: true,
    };

    this.conversations = this.conversations.map((conv) => {
      if (conv.id === conversationId) {
        return {
          ...conv,
          last_message_preview: plaintext,
          last_message_time: timeStr,
          messages: [...conv.messages, newMsg],
        };
      }
      return conv;
    });
    this.notify();
  }

  public createDonation(params: {
    creatorId: string;
    creatorName: string;
    donorName: string;
    donorEmail: string;
    amount: number;
    method: 'qris' | 'gopay' | 'ovo' | 'dana' | 'bca_va' | 'mandiri_va' | 'bri_va';
    message: string;
  }): DonationRecord {
    const feeAmount = Math.round(params.amount * 0.05); // 5% fee
    const netAmount = params.amount - feeAmount;

    const record: DonationRecord = {
      id: 'dqa-' + Date.now(),
      creator_id: params.creatorId,
      creator_name: params.creatorName,
      donor_name: params.donorName || 'Anonim',
      donor_email: params.donorEmail || '',
      amount_gross: params.amount,
      platform_fee_percent: 5,
      platform_fee_amount: feeAmount,
      amount_net: netAmount,
      payment_method: params.method,
      payment_reference: 'INV-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      status: 'pending',
      message: params.message,
      created_at: new Date().toISOString(),
    };

    this.donations = [record, ...this.donations];
    this.notify();
    return record;
  }

  public settleDonation(donationId: string) {
    const found = this.donations.find((d) => d.id === donationId);
    if (!found) return;

    this.donations = this.donations.map((d) =>
      d.id === donationId ? { ...d, status: 'settled' } : d
    );

    // Increment creator live earnings
    this.creators = this.creators.map((c) => {
      if (c.id === found.creator_id) {
        return {
          ...c,
          total_donations_idr: c.total_donations_idr + found.amount_net,
        };
      }
      return c;
    });

    // Push notification to creator
    const notif: NotificationItem = {
      id: 'notif-' + Date.now(),
      type: 'donation',
      title: 'Donasi Baru Berhasil Masuk!',
      description: `${found.donor_name} berdonasi Rp ${found.amount_gross.toLocaleString('id-ID')} via ${found.payment_method.toUpperCase()}: "${found.message || 'Terima kasih atas karyanya!'}"`,
      actor_name: found.donor_name,
      amount_idr: found.amount_gross,
      time_ago: 'baru saja',
      is_read: false,
      created_at: new Date().toISOString(),
    };
    this.notifications = [notif, ...this.notifications];

    this.notify();
  }

  public updateCreatorProfile(
    creatorId: string,
    updates: Partial<Pick<CreatorProfile, 'display_name' | 'bio' | 'avatar_url' | 'cover_url' | 'location' | 'category'>>
  ) {
    this.creators = this.creators.map((c) => {
      if (c.id === creatorId || c.username === creatorId) {
        return {
          ...c,
          ...updates,
        };
      }
      return c;
    });

    // Also update any posts authored by this creator if avatar or name changed
    if (updates.display_name || updates.avatar_url) {
      this.posts = this.posts.map((p) => {
        if (p.author.id === creatorId || p.author.username === creatorId) {
          return {
            ...p,
            author: {
              ...p.author,
              display_name: updates.display_name || p.author.display_name,
              avatar_url: updates.avatar_url || p.author.avatar_url,
            },
          };
        }
        return p;
      });
    }

    this.notify();
  }
}

export const dataStore = new ReactiveDataStore();
