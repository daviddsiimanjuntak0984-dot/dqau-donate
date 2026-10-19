import React, { useState } from 'react';
import { type CreatorProfile } from '../services/dataStore';
import { MASCOT_ASSETS } from '../assets/mascot';
import { ImageWithFallback } from './ImageWithFallback';
import { X, Image as ImageIcon, Sparkles, Link, Check, Camera } from 'lucide-react';

interface ProfileEditSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentProfile: CreatorProfile;
  onSave: (updates: Partial<CreatorProfile>) => void;
  editTarget?: 'avatar' | 'cover' | 'all';
}

export const ProfileEditSheet: React.FC<ProfileEditSheetProps> = ({
  isOpen,
  onClose,
  currentProfile,
  onSave,
  editTarget = 'all',
}) => {
  const [displayName, setDisplayName] = useState(currentProfile.display_name);
  const [bio, setBio] = useState(currentProfile.bio);
  const [avatarUrl, setAvatarUrl] = useState(currentProfile.avatar_url);
  const [coverUrl, setCoverUrl] = useState(currentProfile.cover_url);
  const [showCustomUrlInput, setShowCustomUrlInput] = useState(false);
  const [customInputTarget, setCustomInputTarget] = useState<'avatar' | 'cover'>('avatar');
  const [customUrlValue, setCustomUrlValue] = useState('');

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'avatar' | 'cover') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        if (target === 'avatar') {
          setAvatarUrl(result);
        } else {
          setCoverUrl(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApplyCustomUrl = () => {
    if (!customUrlValue.trim()) return;
    if (customInputTarget === 'avatar') {
      setAvatarUrl(customUrlValue.trim());
    } else {
      setCoverUrl(customUrlValue.trim());
    }
    setShowCustomUrlInput(false);
    setCustomUrlValue('');
  };

  const handleSave = () => {
    onSave({
      display_name: displayName.trim() || currentProfile.display_name,
      bio: bio.trim(),
      avatar_url: avatarUrl,
      cover_url: coverUrl,
    });
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm animate-fade"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-[#0E1322] border-t border-white/10 rounded-t-3xl p-5 shadow-2xl max-h-[88vh] overflow-y-auto no-scrollbar space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-1" />

        {/* Header */}
        <div className="flex justify-between items-center pb-2 border-b border-white/5">
          <h3 className="font-bold text-base text-white flex items-center gap-2">
            <Camera size={18} className="text-violet-400" />
            <span>
              {editTarget === 'avatar' ? 'Ubah Foto Profil' :
               editTarget === 'cover' ? 'Ubah Foto Sampul' : 'Edit Profil Kreator'}
            </span>
          </h3>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400"
          >
            <X size={16} />
          </button>
        </div>

        {/* Live Preview Area */}
        <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/40">
          <div className="h-28 bg-slate-800 relative">
            <ImageWithFallback
              src={coverUrl}
              alt="Cover Preview"
              className="w-full h-full object-cover"
            />
            <label className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-black/70 hover:bg-black text-white text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition">
              <Camera size={11} /> Ganti Sampul
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'cover')} />
            </label>
          </div>

          <div className="p-3 pt-0 relative flex items-center gap-3 -mt-8">
            <div className="relative group">
              <ImageWithFallback
                src={avatarUrl}
                alt="Avatar Preview"
                className="w-16 h-16 rounded-full object-cover border-2 border-[#0E1322] bg-gray-900 shadow-xl"
              />
              <label className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition cursor-pointer">
                <Camera size={14} />
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'avatar')} />
              </label>
            </div>
            <div className="mt-8">
              <span className="font-bold text-sm text-white block">{displayName}</span>
              <span className="text-[11px] text-gray-400">@{currentProfile.username}</span>
            </div>
          </div>
        </div>

        {/* Facebook-style Bottom Sheet Actions (Ref: Screenshot) */}
        <div className="space-y-2 text-xs">
          <label className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl cursor-pointer border border-white/5 transition">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <ImageIcon size={16} />
            </div>
            <div className="flex-1">
              <strong className="text-white block font-bold">Pilih Foto dari Galeri HP</strong>
              <span className="text-gray-400 text-[11px]">Unggah foto langsung dari penyimpanan ponsel</span>
            </div>
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={(e) => handleFileUpload(e, editTarget === 'cover' ? 'cover' : 'avatar')} 
            />
          </label>

          {/* Preset Dqua Anime Mascots */}
          <div className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-2">
            <div className="flex items-center gap-1.5 text-violet-300 font-bold text-xs">
              <Sparkles size={14} className="text-cyan-400" />
              <span>Gunakan Avatar Maskot Anime Dqua</span>
            </div>
            <div className="grid grid-cols-4 gap-2 pt-1">
              {[
                { name: 'Portrait', url: MASCOT_ASSETS.portraitAvatar },
                { name: 'Chibi Love', url: MASCOT_ASSETS.chibiSticker },
                { name: 'Cyber Hero', url: MASCOT_ASSETS.heroDesktop },
                { name: 'Bottts SVG', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=DqauBot' },
              ].map((m, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setAvatarUrl(m.url)}
                  className={`p-1 rounded-xl border transition flex flex-col items-center gap-1 ${
                    avatarUrl === m.url ? 'border-violet-500 bg-violet-600/20' : 'border-white/5 hover:bg-white/5'
                  }`}
                >
                  <img src={m.url} alt={m.name} className="w-10 h-10 rounded-lg object-cover" />
                  <span className="text-[9px] text-gray-300 truncate w-full text-center">{m.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom URL Input Toggle */}
          <button
            type="button"
            onClick={() => {
              setCustomInputTarget(editTarget === 'cover' ? 'cover' : 'avatar');
              setShowCustomUrlInput(!showCustomUrlInput);
            }}
            className="w-full flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl text-left border border-white/5 transition"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Link size={16} />
            </div>
            <div className="flex-1">
              <strong className="text-white block font-bold">Input URL Gambar Kustom</strong>
              <span className="text-gray-400 text-[11px]">Tempel tautan gambar dari web</span>
            </div>
          </button>

          {showCustomUrlInput && (
            <div className="p-3 bg-black/40 border border-white/10 rounded-xl space-y-2">
              <input
                type="url"
                placeholder="https://contoh.com/gambar.jpg"
                value={customUrlValue}
                onChange={(e) => setCustomUrlValue(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
              />
              <button
                type="button"
                onClick={handleApplyCustomUrl}
                className="w-full py-2 rounded-lg bg-violet-600 text-white font-bold text-xs"
              >
                Terapkan URL
              </button>
            </div>
          )}
        </div>

        {/* Text Details Fields */}
        <div className="space-y-3 pt-2 border-t border-white/5 text-xs">
          <div>
            <label className="text-gray-400 block mb-1 font-semibold">Nama Tampilan</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-violet-500"
            />
          </div>
          <div>
            <label className="text-gray-400 block mb-1 font-semibold">Bio Kreator</label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-violet-500 resize-none"
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-semibold text-xs"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white font-bold text-xs shadow-lg shadow-violet-600/30 flex items-center justify-center gap-1.5"
          >
            <Check size={14} />
            <span>Simpan Perubahan</span>
          </button>
        </div>
      </div>
    </div>
  );
};
