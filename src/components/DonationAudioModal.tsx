import React, { useState } from 'react';
import { X, Music, Video, Sparkles, Check } from 'lucide-react';

interface DonationAudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  creatorName?: string;
}

export const DonationAudioModal: React.FC<DonationAudioModalProps> = ({
  isOpen,
  onClose,
  creatorName = 'David Simanjuntak',
}) => {
  const [mediaType, setMediaType] = useState<'default' | 'youtube'>('default');
  const [ytUrl, setYtUrl] = useState('');
  const [selectedTrack, setSelectedTrack] = useState('Cyberpunk Neon Beats');
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSimulate = () => {
    if (mediaType === 'youtube' && !ytUrl.includes('youtu')) {
      setFeedback('Tautan YouTube tidak valid! Masukkan tautan YouTube yang benar.');
      return;
    }
    const durationLimit = mediaType === 'youtube' ? 'Maksimal 30 Detik (Dipotong otomatis untuk overlay)' : '30 Detik - 3 Menit (Lagu penuh audio)';
    setFeedback(`Media ${mediaType.toUpperCase()} siap diputar di OBS overlay ${creatorName} (${durationLimit}).`);
    setTimeout(() => {
      onClose();
    }, 2200);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-sm bg-[#0E1322] border border-white/10 rounded-2xl p-5 shadow-2xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center pb-2 border-b border-white/5">
          <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
            <Music size={18} className="text-violet-400" />
            <span>Pilih Media Donasi Live Stream</span>
          </h3>
          <button 
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400"
          >
            <X size={15} />
          </button>
        </div>

        <p className="text-xs text-gray-300">
          Media ini akan diputar langsung pada layar live streaming OBS ketika donasi Anda masuk.
        </p>

        {/* 2-Option selector */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setMediaType('default')}
            className={`p-3 rounded-xl text-left border transition flex flex-col gap-1 ${
              mediaType === 'default'
                ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-white">Audio MP3</span>
              <Music size={13} className="text-blue-400" />
            </div>
            <span className="text-[10px] text-gray-400">30s - 3 menit penuh</span>
          </button>

          <button
            type="button"
            onClick={() => setMediaType('youtube')}
            className={`p-3 rounded-xl text-left border transition flex flex-col gap-1 ${
              mediaType === 'youtube'
                ? 'bg-red-600/20 border-red-500 text-red-300'
                : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-white">YouTube URL</span>
              <Video size={13} className="text-red-400" />
            </div>
            <span className="text-[10px] text-gray-400">Maksimal 30 detik</span>
          </button>
        </div>

        {mediaType === 'default' ? (
          <div className="space-y-1.5 text-xs">
            <label className="text-gray-400 block font-semibold">Pilih Soundtrack Bawaan:</label>
            {[
              'Cyberpunk Neon Beats (Default)',
              'Lo-Fi Acoustic Melody',
              'Victory Fanfare 8-Bit',
              'Epic Anime Theme',
            ].map((track, i) => (
              <label 
                key={i} 
                className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition ${
                  selectedTrack === track ? 'bg-violet-600/20 border-violet-500 text-white' : 'bg-white/5 border-white/5 text-gray-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="track"
                    value={track}
                    checked={selectedTrack === track}
                    onChange={() => setSelectedTrack(track)}
                    className="accent-violet-500"
                  />
                  <span>{track}</span>
                </div>
                {selectedTrack === track && <Check size={12} className="text-violet-400" />}
              </label>
            ))}
          </div>
        ) : (
          <div className="space-y-2 text-xs">
            <label className="text-gray-400 block font-semibold">Tautan Video YouTube:</label>
            <input
              type="url"
              placeholder="https://youtube.com/watch?v=..."
              value={ytUrl}
              onChange={(e) => setYtUrl(e.target.value)}
              className="w-full bg-black/40 border border-red-500/40 rounded-xl p-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
            />
            <p className="text-[11px] text-amber-300/80">
              * Video akan diputar otomatis pada detektor overlay selama 30 detik untuk kenyamanan penonton streaming.
            </p>
          </div>
        )}

        {feedback && (
          <div className="p-2.5 rounded-xl bg-violet-600/20 border border-violet-500/40 text-violet-200 text-xs flex items-center gap-2">
            <Sparkles size={14} className="text-violet-400 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        <button
          type="button"
          onClick={handleSimulate}
          className="w-full py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-blue-600 to-violet-600 hover:brightness-110 shadow-lg shadow-violet-600/30 transition flex items-center justify-center gap-1.5"
        >
          <Sparkles size={14} />
          <span>Simulasikan Logika Media Donasi</span>
        </button>
      </div>
    </div>
  );
};
