import React, { useState } from 'react';
import { dataStore } from '../services/dataStore';
import { MASCOT_ASSETS } from '../assets/mascot';
import { showToast } from '../services/toast';
import { X, Music, Users, MapPin, Smile, Image as ImageIcon, Video, Globe, Lock } from 'lucide-react';

interface PostComposerProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: {
    name: string;
    username: string;
    avatar: string;
  };
}

export const PostComposer: React.FC<PostComposerProps> = ({
  isOpen,
  onClose,
  currentUser = {
    name: 'David Simanjuntak',
    username: 'daviddsiimanjuntak',
    avatar: MASCOT_ASSETS.portraitAvatar,
  },
}) => {
  const [content, setContent] = useState('');
  const [musicTag, setMusicTag] = useState('');
  const [collabTag, setCollabTag] = useState('');
  const [locationTag, setLocationTag] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<'public' | 'supporters'>('public');
  const [isExclusive, setIsExclusive] = useState(false);
  const [threadsSync, setThreadsSync] = useState(true);
  const [instaSync, setInstaSync] = useState(false);

  // Quick chips triggers
  const [showMusicInput, setShowMusicInput] = useState(false);
  const [showCollabInput, setShowCollabInput] = useState(false);
  const [showLocationInput, setShowLocationInput] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !selectedImage) return;

    dataStore.addPost({
      author: {
        id: 'creator-david',
        username: currentUser.username,
        display_name: currentUser.name,
        avatar_url: currentUser.avatar,
        is_creator: true,
        is_verified: true,
      },
      content: content.trim(),
      media_urls: selectedImage ? [selectedImage] : undefined,
      media_type: selectedImage ? 'image' : undefined,
      music_tag: musicTag.trim() || undefined,
      location_tag: locationTag.trim() || undefined,
      collab_tag: collabTag.trim() || undefined,
      visibility,
      is_exclusive: isExclusive,
    });

    setContent('');
    setSelectedImage(null);
    setMusicTag('');
    setCollabTag('');
    setLocationTag('');
    onClose();
  };

  const handleImagePicker = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div 
        className="w-full sm:max-w-lg bg-[#0E1322] border-t sm:border border-white/10 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header (Ref: Screenshot 3) */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition"
            aria-label="Tutup"
          >
            <X size={18} />
          </button>
          <h3 className="text-white font-bold text-base">Postingan baru</h3>
          <button
            onClick={handleSubmit}
            disabled={!content.trim() && !selectedImage}
            className={`px-4 py-1.5 rounded-full font-bold text-xs sm:text-sm transition ${
              content.trim() || selectedImage
                ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-md hover:brightness-110'
                : 'bg-white/10 text-gray-500 cursor-not-allowed'
            }`}
          >
            Posting
          </button>
        </div>

        {/* Body content */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* Author profile row */}
          <div className="flex items-center gap-3">
            <img 
              src={currentUser.avatar} 
              alt={currentUser.name} 
              className="w-12 h-12 rounded-full object-cover border-2 border-violet-500/40" 
            />
            <div>
              <h4 className="font-bold text-white text-sm">{currentUser.name}</h4>
              <div className="flex items-center gap-2 mt-0.5">
                <button 
                  type="button"
                  onClick={() => setVisibility(v => v === 'public' ? 'supporters' : 'public')}
                  className="flex items-center gap-1 text-[11px] font-medium bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded-full text-violet-300 border border-white/5 transition"
                >
                  {visibility === 'public' ? <Globe size={11} /> : <Lock size={11} />}
                  <span>{visibility === 'public' ? 'Publik' : 'Supporter Saja'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsExclusive(e => !e)}
                  className={`text-[11px] font-medium px-2 py-0.5 rounded-full border transition ${
                    isExclusive ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-white/5 text-gray-400 border-white/5'
                  }`}
                >
                  {isExclusive ? '⭐ Eksklusif' : '+ Konten Berbayar'}
                </button>
              </div>
            </div>
          </div>

          {/* Action Chips Row (Ref: Screenshot 3) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button 
              type="button"
              onClick={() => setShowMusicInput(!showMusicInput)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition ${
                musicTag ? 'bg-violet-600/20 text-violet-300 border-violet-500/40' : 'bg-white/5 text-gray-300 border-white/5 hover:bg-white/10'
              }`}
            >
              <Music size={13} className="text-pink-400" />
              <span>{musicTag || 'Musik'}</span>
            </button>

            <button 
              type="button"
              onClick={() => setShowCollabInput(!showCollabInput)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition ${
                collabTag ? 'bg-blue-600/20 text-blue-300 border-blue-500/40' : 'bg-white/5 text-gray-300 border-white/5 hover:bg-white/10'
              }`}
            >
              <Users size={13} className="text-blue-400" />
              <span>{collabTag || 'Tag/kolaborasi'}</span>
            </button>

            <button 
              type="button"
              onClick={() => setShowLocationInput(!showLocationInput)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition ${
                locationTag ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40' : 'bg-white/5 text-gray-300 border-white/5 hover:bg-white/10'
              }`}
            >
              <MapPin size={13} className="text-emerald-400" />
              <span>{locationTag || 'Lokasi'}</span>
            </button>

            <button 
              type="button"
              onClick={() => setContent((c) => c + ' 🎮')}
              className="p-1.5 rounded-full bg-white/5 text-gray-400 hover:text-white border border-white/5"
            >
              <Smile size={14} />
            </button>
          </div>

          {/* Conditional inputs */}
          {showMusicInput && (
            <input 
              type="text" 
              placeholder="Judul musik / audio latar..."
              value={musicTag}
              onChange={(e) => setMusicTag(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
            />
          )}
          {showCollabInput && (
            <input 
              type="text" 
              placeholder="Tag kolaborator (contoh: @LunaArt)..."
              value={collabTag}
              onChange={(e) => setCollabTag(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
            />
          )}
          {showLocationInput && (
            <input 
              type="text" 
              placeholder="Nama lokasi (contoh: Medan, Indonesia)..."
              value={locationTag}
              onChange={(e) => setLocationTag(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
            />
          )}

          {/* Main Textarea */}
          <textarea
            rows={4}
            placeholder="Apa yang Anda pikirkan?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full bg-transparent text-white placeholder-gray-500 resize-none outline-none text-base sm:text-lg"
            autoFocus
          />

          {/* Image preview */}
          {selectedImage && (
            <div className="relative rounded-2xl overflow-hidden border border-white/10 max-h-60 bg-black/40">
              <img src={selectedImage} alt="Pratinjau media" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center transition"
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Footer controls (Ref: Screenshot 3) */}
        <div className="p-3 sm:p-4 border-t border-white/5 bg-white/[0.01] space-y-3">
          {/* Quick upload buttons */}
          <div className="grid grid-cols-3 gap-2">
            <label className="flex items-center justify-center gap-2 py-2.5 px-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-semibold text-gray-300 cursor-pointer border border-white/5 transition">
              <ImageIcon size={15} className="text-emerald-400" />
              <span>Galeri</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImagePicker} />
            </label>

            <button 
              type="button"
              onClick={() => setSelectedImage(MASCOT_ASSETS.chibiSticker)}
              className="flex items-center justify-center gap-2 py-2.5 px-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-semibold text-gray-300 border border-white/5 transition"
            >
              <span className="text-amber-400 font-bold text-xs">GIF</span>
              <span>Stiker Maskot</span>
            </button>

            <button 
              type="button"
              onClick={() => showToast('Fitur Siaran Langsung OBS siap dihubungkan dengan Overlay Dqua Donate!', 'info')}
              className="flex items-center justify-center gap-2 py-2.5 px-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-semibold text-gray-300 border border-white/5 transition"
            >
              <Video size={15} className="text-pink-400" />
              <span>Live</span>
            </button>
          </div>

          {/* Cross-posting toggles (Ref: Screenshot 3) */}
          <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
            <span className="flex items-center gap-1 text-[11px] text-gray-500">
              <Globe size={12} /> Publikasi otomatis
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setInstaSync(!instaSync)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition ${
                  instaSync ? 'bg-pink-500/20 text-pink-300 border-pink-500/30' : 'bg-white/5 text-gray-500 border-white/5'
                }`}
              >
                Instagram {instaSync ? 'Aktif' : 'Nonaktif'}
              </button>
              <button
                type="button"
                onClick={() => setThreadsSync(!threadsSync)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition ${
                  threadsSync ? 'bg-violet-500/20 text-violet-300 border-violet-500/30' : 'bg-white/5 text-gray-500 border-white/5'
                }`}
              >
                Threads {threadsSync ? 'Aktif' : 'Nonaktif'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
