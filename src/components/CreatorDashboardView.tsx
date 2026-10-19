import React, { useState, useEffect } from 'react';
import { dataStore, type CreatorProfile } from '../services/dataStore';
import { MASCOT_ASSETS } from '../assets/mascot';
import { AlertTriangle, Sparkles, TrendingUp, DollarSign, PlusCircle, ArrowUpRight, ShieldCheck } from 'lucide-react';
import { showToast } from '../services/toast';

interface CreatorDashboardViewProps {
  creatorId?: string;
  onOpenComposer?: () => void;
}

export const CreatorDashboardView: React.FC<CreatorDashboardViewProps> = ({
  creatorId = 'creator-david',
  onOpenComposer,
}) => {
  const [creator, setCreator] = useState<CreatorProfile | undefined>();
  const [activeTab, setActiveTab] = useState<'analytics' | 'konten' | 'komunitas' | 'monetisasi'>('analytics');
  const [timeRange, setTimeRange] = useState<'28' | '14' | '7'>('28');
  const [payoutConfigured, setPayoutConfigured] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [bankName, setBankName] = useState('BCA');
  const [bankAccount, setBankAccount] = useState('');
  const [accountHolder, setAccountHolder] = useState('David Simanjuntak');

  useEffect(() => {
    setCreator(dataStore.getCreatorById(creatorId) || dataStore.getCreators()[0]);
    const unsub = dataStore.subscribe(() => {
      setCreator(dataStore.getCreatorById(creatorId) || dataStore.getCreators()[0]);
    });
    return unsub;
  }, [creatorId]);

  if (!creator) return null;

  const currentEarnings = creator.total_donations_idr;
  const minPayoutThreshold = 100000;
  const payoutProgress = Math.min(100, Math.round((currentEarnings / minPayoutThreshold) * 100));

  return (
    <div className="space-y-4 max-w-3xl mx-auto pb-16">
      {/* Dasbor Header (Ref: Screenshot 2) */}
      <div className="bg-[#0E1322] border border-white/5 rounded-2xl p-4 sm:p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <img 
              src={creator.avatar_url} 
              alt={creator.display_name} 
              className="w-12 h-12 rounded-full object-cover border-2 border-violet-500/40"
            />
            <div>
              <h1 className="text-xl font-black text-white flex items-center gap-2">
                Dasbor Kreator
                <span className="text-xs bg-emerald-500/20 text-emerald-400 font-mono px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Aktif ✦
                </span>
              </h1>
              <p className="text-xs text-gray-400">{creator.display_name} (@{creator.username})</p>
            </div>
          </div>
          {onOpenComposer && (
            <button
              onClick={onOpenComposer}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white text-xs font-bold shadow-lg hover:brightness-110 transition flex items-center gap-1.5"
            >
              <PlusCircle size={15} />
              <span className="hidden sm:inline">Buat Postingan</span>
              <span className="sm:hidden">Posting</span>
            </button>
          )}
        </div>

        {/* Top category tabs (Ref: Screenshot 2) */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {(['analytics', 'konten', 'komunitas', 'monetisasi'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold capitalize transition whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Payout Alert Warning (Ref: Screenshot 2) */}
      {!payoutConfigured && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3.5">
          <AlertTriangle className="text-amber-400 flex-shrink-0 mt-0.5" size={20} />
          <div className="flex-1 text-xs sm:text-sm text-amber-200/90 leading-relaxed">
            <strong className="text-white block font-bold mb-0.5">Metode pencairan belum disiapkan</strong>
            Hubungkan rekening bank atau e-wallet Anda agar donasi dari pendukung dapat langsung dicairkan otomatis setiap minggu.
            <div className="mt-2.5">
              <button
                onClick={() => setShowPayoutModal(true)}
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition"
              >
                Siapkan Rekening Bank Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Creator Assistant Banner (Ref: Screenshot 2) */}
      <div className="bg-gradient-to-r from-violet-950/40 via-purple-950/30 to-[#0E1322] border border-violet-500/20 rounded-2xl p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-600/30 border border-violet-500/40 flex items-center justify-center text-violet-300">
            <Sparkles size={20} />
          </div>
          <div>
            <h4 className="text-white font-bold text-sm">Asisten Kreator Dqua</h4>
            <p className="text-xs text-gray-400">Dapatkan tips pertumbuhan audiens dan monetisasi eksklusif.</p>
          </div>
        </div>
        <img src={MASCOT_ASSETS.chibiSticker} alt="Asisten" className="w-12 h-12 object-cover rounded-xl hidden sm:block" />
      </div>

      {/* TAB: ANALYTICS (Ref: Screenshot 2) */}
      {activeTab === 'analytics' && (
        <div className="space-y-4">
          <div className="bg-[#0E1322] border border-white/5 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                <TrendingUp size={16} className="text-violet-400" />
                <span>Ringkasan Performa</span>
              </h3>
              {/* 28 / 14 / 7 days pills */}
              <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl">
                {(['28', '14', '7'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setTimeRange(r)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                      timeRange === r ? 'bg-violet-600 text-white shadow' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {r} hari
                  </button>
                ))}
              </div>
            </div>

            {/* 4 Analytics KPI Cards (Ref: Screenshot 2) */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-white/5 border border-white/5 rounded-xl p-3.5">
                <span className="text-xs text-gray-400 block mb-1">Tayangan Profil & Karya</span>
                <div className="text-xl sm:text-2xl font-black text-white font-mono">
                  {timeRange === '28' ? '4,120' : timeRange === '14' ? '2,310' : '840'}
                  <span className="text-xs font-normal text-emerald-400 ml-1.5">↑ 14%</span>
                </div>
              </div>

              <div className="bg-white/5 border border-white/5 rounded-xl p-3.5">
                <span className="text-xs text-gray-400 block mb-1">Pendapatan Bersih (Net)</span>
                <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
                  Rp {currentEarnings.toLocaleString('id-ID')}
                </div>
                <span className="text-[10px] text-gray-500 block mt-0.5">Biaya platform 5% dipotong</span>
              </div>

              <div className="bg-white/5 border border-white/5 rounded-xl p-3.5">
                <span className="text-xs text-gray-400 block mb-1">Total Interaksi & Like</span>
                <div className="text-xl sm:text-2xl font-black text-white font-mono">
                  {timeRange === '28' ? '850' : timeRange === '14' ? '410' : '185'}
                </div>
              </div>

              <div className="bg-white/5 border border-white/5 rounded-xl p-3.5">
                <span className="text-xs text-gray-400 block mb-1">Pengikut Komunitas</span>
                <div className="text-xl sm:text-2xl font-black text-white font-mono">
                  {creator.followers_count.toLocaleString('id-ID')}
                  <span className="text-xs font-normal text-violet-400 ml-1.5">+32</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Creator Inquiries (Ref: Screenshot 2) */}
          <div className="bg-[#0E1322] border border-white/5 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3">
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider">
              Panduan Cepat & Bantuan
            </h4>
            <div className="space-y-1.5">
              {[
                'Apakah saya memenuhi syarat untuk pencairan donasi?',
                'Bagaimana cara mengembangkan audiens di Dqua?',
                'Ide konten eksklusif untuk pendukung setia',
                'Bagaimana cara mengaktifkan overlay live streaming OBS?',
              ].map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => showToast(`Panduan: "${q}" — Silakan buka panduan kreator untuk detail lengkap.`, 'info')}
                  className="w-full text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs sm:text-sm text-gray-300 flex items-center justify-between transition group"
                >
                  <span>{q}</span>
                  <ArrowUpRight size={14} className="text-gray-500 group-hover:text-violet-400 transition" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB: KONTEN */}
      {activeTab === 'konten' && (
        <div className="bg-[#0E1322] border border-white/5 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Postingan & Karya Terbaru</h3>
            {onOpenComposer && (
              <button
                onClick={onOpenComposer}
                className="text-xs text-violet-400 hover:underline font-bold"
              >
                + Tulis postingan
              </button>
            )}
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center gap-3">
            <img src={MASCOT_ASSETS.heroDesktop} alt="Thumbnail" className="w-16 h-12 rounded-lg object-cover" />
            <div className="flex-1 min-w-0">
              <h5 className="font-bold text-sm text-white truncate">Selamat datang di era baru Dqua Donate!</h5>
              <p className="text-xs text-gray-400">148 suka · 16 komentar · 24 bagikan</p>
            </div>
            <span className="text-xs font-mono text-emerald-400 font-bold">Publik</span>
          </div>
        </div>
      )}

      {/* TAB: KOMUNITAS */}
      {activeTab === 'komunitas' && (
        <div className="bg-[#0E1322] border border-white/5 rounded-2xl p-5 shadow-xl space-y-4">
          <h3 className="text-base font-bold text-white">Komentar Belum Dibalas</h3>
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-white">Melati Yeoja</span>
              <span className="text-[10px] text-gray-500">1 jam lalu</span>
            </div>
            <p className="text-xs text-gray-300">"Keren banget platformnya bang David! Desain neon cyberpunk-nya juara!"</p>
            <div className="flex gap-2 pt-1">
              <button 
                onClick={() => showToast('Balasan dikirim ke Melati Yeoja', 'success')}
                className="text-xs bg-violet-600 hover:bg-violet-700 text-white px-3 py-1 rounded-lg font-semibold transition"
              >
                Balas Komentar
              </button>
              <button 
                onClick={() => showToast('Komentar berhasil disematkan di profil!', 'success')}
                className="text-xs bg-white/5 hover:bg-white/10 text-gray-300 px-3 py-1 rounded-lg transition"
              >
                Sematkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB: MONETISASI (Ref: Screenshot 2) */}
      {activeTab === 'monetisasi' && (
        <div className="bg-[#0E1322] border border-white/5 rounded-2xl p-5 shadow-xl space-y-5">
          <div>
            <h3 className="text-base font-bold text-white mb-1">Status Saldo & Penarikan Dana</h3>
            <p className="text-xs text-gray-400">Minimum penarikan dana adalah Rp 100.000 ke rekening bank lokal.</p>
          </div>

          <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-3">
            <div className="flex justify-between items-end">
              <div>
                <span className="text-xs text-gray-400 block">Saldo Siap Tarik</span>
                <span className="text-2xl font-black text-emerald-400 font-mono">
                  Rp {currentEarnings.toLocaleString('id-ID')}
                </span>
              </div>
              <span className="text-xs text-gray-400 font-mono">
                Rp {minPayoutThreshold.toLocaleString('id-ID')} minimum
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-500 to-violet-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${payoutProgress}%` }}
              />
            </div>

            <div className="flex justify-between text-[11px] text-gray-400">
              <span>{payoutProgress}% tercapai</span>
              <span className="text-violet-400 font-medium">Potongan platform tetap 5% transparan</span>
            </div>
          </div>

          <button
            disabled={currentEarnings < minPayoutThreshold}
            onClick={() => showToast(`Pengajuan penarikan dana Rp ${currentEarnings.toLocaleString('id-ID')} berhasil diproses ke rekening ${bankName} (${bankAccount || '8277...'}).`, 'success')}
            className={`w-full py-3 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 ${
              currentEarnings >= minPayoutThreshold
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:brightness-110 shadow-lg'
                : 'bg-white/10 text-gray-500 cursor-not-allowed'
            }`}
          >
            <DollarSign size={16} />
            Tarik Dana Donasi ke Rekening Bank
          </button>
        </div>
      )}

      {/* Payout Settings Modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0E1322] border border-white/10 rounded-2xl p-5 max-w-md w-full space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="text-violet-400" size={18} />
              Pengaturan Rekening Penarikan
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-gray-300 block mb-1 font-semibold">Bank Tujuan</label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                >
                  <option value="BCA">Bank Central Asia (BCA)</option>
                  <option value="Mandiri">Bank Mandiri</option>
                  <option value="BRI">Bank Rakyat Indonesia (BRI)</option>
                  <option value="BNI">Bank Negara Indonesia (BNI)</option>
                  <option value="GoPay">GoPay (Dompet Digital)</option>
                  <option value="DANA">DANA (Dompet Digital)</option>
                </select>
              </div>

              <div>
                <label className="text-gray-300 block mb-1 font-semibold">Nomor Rekening / Nomor HP</label>
                <input
                  type="text"
                  placeholder="Contoh: 8277019283"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white placeholder-gray-500"
                />
              </div>

              <div>
                <label className="text-gray-300 block mb-1 font-semibold">Nama Pemilik Rekening</label>
                <input
                  type="text"
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowPayoutModal(false)}
                className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  setPayoutConfigured(true);
                  setShowPayoutModal(false);
                }}
                className="flex-1 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold"
              >
                Simpan Rekening
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
