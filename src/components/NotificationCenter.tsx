import React, { useState, useEffect } from 'react';
import { dataStore, type NotificationItem } from '../services/dataStore';
import { MASCOT_ASSETS } from '../assets/mascot';
import { Bell, CheckCheck, MessageSquare, Heart, DollarSign, UserPlus, Shield } from 'lucide-react';

interface NotificationCenterProps {
  onOpenCreator?: (username: string) => void;
  onOpenChat?: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ onOpenCreator, onOpenChat }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'donation' | 'social'>('all');

  useEffect(() => {
    setNotifications(dataStore.getNotifications());
    const unsub = dataStore.subscribe(() => {
      setNotifications(dataStore.getNotifications());
    });
    return unsub;
  }, []);

  const handleMarkAllRead = () => {
    dataStore.markAllNotificationsAsRead();
  };

  const handleItemClick = (item: NotificationItem) => {
    dataStore.markNotificationAsRead(item.id);
    if (item.type === 'message' && onOpenChat) {
      onOpenChat();
    } else if (item.actor_name && onOpenCreator) {
      onOpenCreator(item.actor_name);
    }
  };

  const filteredNotifs = notifications.filter((n) => {
    if (filter === 'donation') return n.type === 'donation';
    if (filter === 'social') return ['comment', 'like', 'follow', 'message'].includes(n.type);
    return true;
  });

  const newNotifs = filteredNotifs.filter((n) => !n.is_read);
  const earlierNotifs = filteredNotifs.filter((n) => n.is_read);

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'donation':
        return <DollarSign size={14} className="text-emerald-400" />;
      case 'comment':
        return <MessageSquare size={14} className="text-blue-400" />;
      case 'like':
        return <Heart size={14} className="text-pink-400 fill-pink-400" />;
      case 'follow':
        return <UserPlus size={14} className="text-violet-400" />;
      case 'message':
        return <Shield size={14} className="text-cyan-400" />;
      default:
        return <Bell size={14} className="text-gray-400" />;
    }
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto pb-12">
      {/* Header (Ref: Screenshot 1) */}
      <div className="bg-[#0E1322] border border-white/5 rounded-2xl p-4 sm:p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-white">Notifikasi</h2>
            {newNotifs.length > 0 && (
              <span className="bg-violet-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {newNotifs.length} baru
              </span>
            )}
          </div>
          <button
            onClick={handleMarkAllRead}
            className="text-xs text-gray-400 hover:text-violet-400 flex items-center gap-1 transition"
          >
            <CheckCheck size={14} />
            <span>Tandai semua dibaca</span>
          </button>
        </div>

        {/* Filter segmented buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              filter === 'all'
                ? 'bg-violet-600 text-white shadow-md'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setFilter('donation')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              filter === 'donation'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            Donasi Masuk
          </button>
          <button
            onClick={() => setFilter('social')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              filter === 'social'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            Interaksi Sosial
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-[#0E1322] border border-white/5 rounded-2xl p-2 sm:p-4 shadow-xl divide-y divide-white/5">
        {filteredNotifs.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-3">
            <img src={MASCOT_ASSETS.emptyState} alt="Kosong" className="w-24 h-24 mx-auto object-cover rounded-2xl" />
            <h4 className="text-white font-bold text-sm">Belum ada notifikasi baru</h4>
            <p className="text-xs text-gray-400 max-w-xs mx-auto">
              Notifikasi donasi terverifikasi, komentar, dan pesan privat akan muncul di sini secara realtime.
            </p>
          </div>
        ) : (
          <>
            {newNotifs.length > 0 && (
              <div className="pb-3">
                <h3 className="text-xs font-black text-gray-400 px-3 py-2 uppercase tracking-wider">Baru</h3>
                <div className="space-y-1">
                  {newNotifs.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      className="p-3 rounded-xl bg-violet-950/20 hover:bg-violet-950/40 border border-violet-500/20 flex items-start gap-3 transition cursor-pointer"
                    >
                      <div className="relative flex-shrink-0 mt-0.5">
                        <img
                          src={item.actor_avatar || MASCOT_ASSETS.portraitAvatar}
                          alt="Aktor"
                          className="w-10 h-10 rounded-full object-cover bg-gray-800"
                        />
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#0E1322] flex items-center justify-center border border-white/10">
                          {getIcon(item.type)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-200 leading-snug">
                          {item.description}
                        </p>
                        <span className="text-[11px] text-violet-400 font-medium mt-1 inline-block">
                          {item.time_ago}
                        </span>
                      </div>
                      <div className="w-2.5 h-2.5 rounded-full bg-violet-500 flex-shrink-0 mt-2 shadow-[0_0_8px_rgba(139,92,246,0.8)]" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {earlierNotifs.length > 0 && (
              <div className="pt-3">
                <h3 className="text-xs font-black text-gray-400 px-3 py-2 uppercase tracking-wider">Sebelumnya</h3>
                <div className="space-y-1">
                  {earlierNotifs.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      className="p-3 rounded-xl hover:bg-white/5 flex items-start gap-3 transition cursor-pointer"
                    >
                      <div className="relative flex-shrink-0 mt-0.5">
                        <img
                          src={item.actor_avatar || MASCOT_ASSETS.portraitAvatar}
                          alt="Aktor"
                          className="w-10 h-10 rounded-full object-cover bg-gray-800 opacity-80"
                        />
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#0E1322] flex items-center justify-center border border-white/10">
                          {getIcon(item.type)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-400 leading-snug">
                          {item.description}
                        </p>
                        <span className="text-[11px] text-gray-500 font-medium mt-1 inline-block">
                          {item.time_ago}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
