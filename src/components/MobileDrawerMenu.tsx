import React from 'react';
import { type CreatorProfile } from '../services/dataStore';
import { ImageWithFallback } from './ImageWithFallback';
import { showToast } from '../services/toast';
import { 
  X, 
  Users, 
  PieChart, 
  Bookmark, 
  Sparkles, 
  Settings, 
  HelpCircle, 
  LogOut, 
  ChevronRight,
  ShieldAlert,
  Flame,
  MessageSquare
} from 'lucide-react';

interface MobileDrawerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: CreatorProfile;
  onNavigate: (tab: 'feed' | 'explore' | 'chat' | 'notif' | 'dashboard' | 'profile') => void;
  onLogout: () => void;
}

export const MobileDrawerMenu: React.FC<MobileDrawerMenuProps> = ({
  isOpen,
  onClose,
  userProfile,
  onNavigate,
  onLogout,
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-fade"
      onClick={onClose}
    >
      <div 
        className="w-4/5 max-w-sm bg-[#0E1322] border-l border-white/10 h-full p-4 overflow-y-auto no-scrollbar flex flex-col justify-between shadow-2xl transition-transform duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-4">
          {/* Drawer Top Header */}
          <div className="flex justify-between items-center pb-3 border-b border-white/5">
            <h2 className="font-black text-lg text-white">Menu</h2>
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition"
              aria-label="Tutup Menu"
            >
              <X size={18} />
            </button>
          </div>

          {/* User Profile Card ala Facebook */}
          <div 
            onClick={() => {
              onNavigate('profile');
              onClose();
            }}
            className="bg-white/5 hover:bg-white/10 rounded-2xl p-3.5 flex items-center gap-3 cursor-pointer border border-white/5 transition group"
          >
            <ImageWithFallback
              src={userProfile.avatar_url}
              alt={userProfile.display_name}
              className="w-12 h-12 rounded-full object-cover border-2 border-violet-500/40 group-hover:scale-105 transition"
            />
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-sm text-white truncate flex items-center gap-1">
                {userProfile.display_name}
                <span className="text-cyan-400 text-xs">✦</span>
              </h4>
              <p className="text-xs text-gray-400">Lihat profil Anda</p>
            </div>
            <ChevronRight size={16} className="text-gray-500 group-hover:text-violet-400 transition" />
          </div>

          {/* 2-Column Grid Shortcut Cards (Ref: Screenshot) */}
          <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
            <button 
              onClick={() => {
                onNavigate('explore');
                onClose();
              }}
              className="bg-white/5 hover:bg-white/10 border border-white/5 p-3 rounded-xl text-left flex flex-col gap-2 transition"
            >
              <Users size={20} className="text-blue-400" />
              <div>
                <span className="text-white block">Teman</span>
                <span className="text-[10px] text-emerald-400 font-mono">3 online</span>
              </div>
            </button>

            <button 
              onClick={() => {
                onNavigate('dashboard');
                onClose();
              }}
              className="bg-white/5 hover:bg-white/10 border border-white/5 p-3 rounded-xl text-left flex flex-col gap-2 transition"
            >
              <PieChart size={20} className="text-violet-400" />
              <div>
                <span className="text-white block">Dasbor Kreator</span>
                <span className="text-[10px] text-gray-400 font-mono">Analitik Live</span>
              </div>
            </button>

            <button 
              onClick={() => {
                onNavigate('chat');
                onClose();
              }}
              className="bg-white/5 hover:bg-white/10 border border-white/5 p-3 rounded-xl text-left flex flex-col gap-2 transition"
            >
              <MessageSquare size={20} className="text-cyan-400" />
              <div>
                <span className="text-white block">Pesan E2EE</span>
                <span className="text-[10px] text-cyan-400 font-mono">Privat</span>
              </div>
            </button>

            <button 
              onClick={() => {
                onNavigate('feed');
                onClose();
              }}
              className="bg-white/5 hover:bg-white/10 border border-white/5 p-3 rounded-xl text-left flex flex-col gap-2 transition"
            >
              <Bookmark size={20} className="text-pink-400" />
              <div>
                <span className="text-white block">Tersimpan</span>
                <span className="text-[10px] text-gray-400">Postingan</span>
              </div>
            </button>

            <button 
              onClick={() => {
                showToast('Asisten Kreator Dqua siap membantu mengoptimalkan konten streaming Anda!', 'info');
                onClose();
              }}
              className="bg-white/5 hover:bg-white/10 border border-white/5 p-3 rounded-xl text-left flex flex-col gap-2 transition"
            >
              <Sparkles size={20} className="text-amber-400" />
              <div>
                <span className="text-white block">Asisten AI</span>
                <span className="text-[10px] text-amber-300">Tips Konten</span>
              </div>
            </button>

            <button 
              onClick={() => {
                onNavigate('explore');
                onClose();
              }}
              className="bg-white/5 hover:bg-white/10 border border-white/5 p-3 rounded-xl text-left flex flex-col gap-2 transition"
            >
              <Flame size={20} className="text-orange-400" />
              <div>
                <span className="text-white block">Trending</span>
                <span className="text-[10px] text-gray-400">Kreator Top</span>
              </div>
            </button>
          </div>

          <hr className="border-white/5 my-2" />

          {/* Help & Settings Section (Ref: Screenshot) */}
          <div className="space-y-1 text-xs">
            <h4 className="text-[11px] font-bold text-gray-400 mb-1 px-1 uppercase tracking-wider">
              Bantuan & Pengaturan
            </h4>
            
            <button 
              onClick={() => {
                showToast('Pengaturan Akun & Privasi: Enkripsi E2EE aktif, mode profil publik.', 'info');
              }}
              className="w-full text-left p-2.5 hover:bg-white/5 rounded-xl flex items-center gap-3 text-gray-300 hover:text-white transition"
            >
              <Settings size={16} className="text-gray-400" />
              <span>Pengaturan & Privasi</span>
            </button>

            <button 
              onClick={() => {
                showToast('Pusat Perlindungan Dqua: Seluruh donasi diproses transparan dengan komisi 5% dan verifikasi server.', 'info');
              }}
              className="w-full text-left p-2.5 hover:bg-white/5 rounded-xl flex items-center gap-3 text-gray-300 hover:text-white transition"
            >
              <ShieldAlert size={16} className="text-gray-400" />
              <span>Pusat Perlindungan Penipuan</span>
            </button>

            <button 
              onClick={() => {
                showToast('Bantuan & Dukungan: Hubungi support@dquadonate.com atau baca FAQ di landing page.', 'info');
              }}
              className="w-full text-left p-2.5 hover:bg-white/5 rounded-xl flex items-center gap-3 text-gray-300 hover:text-white transition"
            >
              <HelpCircle size={16} className="text-gray-400" />
              <span>Bantuan & Dukungan</span>
            </button>
          </div>
        </div>

        {/* Logout button at bottom */}
        <div className="pt-4 border-t border-white/5">
          <button 
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="w-full text-left p-3 hover:bg-red-500/10 rounded-xl flex items-center gap-3 text-sm text-red-400 font-bold transition"
          >
            <LogOut size={16} />
            <span>Keluar dari Akun</span>
          </button>
        </div>
      </div>
    </div>
  );
};
