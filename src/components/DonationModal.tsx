import React, { useState, useEffect } from 'react';
import { dataStore, type CreatorProfile } from '../services/dataStore';
import { MASCOT_ASSETS } from '../assets/mascot';
import { showToast } from '../services/toast';
import { X, CheckCircle, Copy, Clock, ShieldCheck, Heart } from 'lucide-react';

interface DonationModalProps {
  creator: CreatorProfile;
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_AMOUNTS = [10000, 25000, 50000, 100000];

export const DonationModal: React.FC<DonationModalProps> = ({ creator, isOpen, onClose }) => {
  const [step, setStep] = useState<'input' | 'payment' | 'success'>('input');
  const [amount, setAmount] = useState<number>(25000);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [message, setMessage] = useState('');
  const [method, setMethod] = useState<'qris' | 'gopay' | 'ovo' | 'dana' | 'bca_va' | 'mandiri_va' | 'bri_va'>('qris');
  const [createdDonationId, setCreatedDonationId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(900); // 15 mins

  useEffect(() => {
    if (!isOpen) {
      setStep('input');
      setCreatedDonationId(null);
      setSecondsLeft(900);
    }
  }, [isOpen]);

  useEffect(() => {
    if (step === 'payment' && secondsLeft > 0) {
      const timer = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [step, secondsLeft]);

  if (!isOpen) return null;

  const currentAmount = customAmount ? parseInt(customAmount, 10) || 0 : amount;
  const platformFee = Math.round(currentAmount * 0.05);
  const netAmount = Math.max(0, currentAmount - platformFee);

  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentAmount < 5000) {
      showToast('Nominal donasi minimal adalah Rp 5.000', 'warning');
      return;
    }

    const donation = dataStore.createDonation({
      creatorId: creator.id,
      creatorName: creator.display_name,
      donorName: donorName.trim() || 'Pendukung Anonim',
      donorEmail: donorEmail.trim(),
      amount: currentAmount,
      method,
      message: message.trim(),
    });

    setCreatedDonationId(donation.id);
    setStep('payment');
  };

  const handleSimulateSettled = () => {
    if (createdDonationId) {
      dataStore.settleDonation(createdDonationId);
      setStep('success');
    }
  };

  const copyPaymentCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div 
        className="w-full max-w-lg bg-[#0E1322] border border-white/10 rounded-2xl shadow-2xl overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <img 
              src={creator.avatar_url} 
              alt={creator.display_name} 
              className="w-10 h-10 rounded-full object-cover border border-violet-500/30" 
            />
            <div>
              <h3 className="text-white font-bold text-sm sm:text-base leading-tight">
                Dukung {creator.display_name}
              </h3>
              <p className="text-xs text-gray-400">@{creator.username} · {creator.category}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition"
            aria-label="Tutup"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content body */}
        <div className="p-4 sm:p-6 max-h-[80vh] overflow-y-auto">
          {step === 'input' && (
            <form onSubmit={handleProceedToPayment} className="space-y-4">
              {/* Presets */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-2">Pilih Nominal Dukungan</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PRESET_AMOUNTS.map((val) => (
                    <button
                      type="button"
                      key={val}
                      onClick={() => {
                        setAmount(val);
                        setCustomAmount('');
                      }}
                      className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold border transition ${
                        !customAmount && amount === val
                          ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white border-violet-400 shadow-lg shadow-violet-600/30'
                          : 'bg-white/5 border-white/5 text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      Rp {val.toLocaleString('id-ID')}
                    </button>
                  ))}
                </div>
                <div className="mt-2">
                  <input
                    type="number"
                    min="5000"
                    step="1000"
                    placeholder="Atau masukkan nominal lain (Min. Rp 5.000)"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition"
                  />
                </div>
              </div>

              {/* Supporter details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Nama Panggilan</label>
                  <input
                    type="text"
                    placeholder="Nama kamu (atau Anonim)"
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Email (opsional)</label>
                  <input
                    type="email"
                    placeholder="Untuk bukti pembayaran"
                    value={donorEmail}
                    onChange={(e) => setDonorEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Pesan Semangat</label>
                <textarea
                  rows={2}
                  placeholder="Tulis pesan penyemangat untuk kreator..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 resize-none"
                />
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-2">Metode Pembayaran</label>
                <div className="space-y-1.5">
                  <label 
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                      method === 'qris' ? 'bg-violet-950/40 border-violet-500' : 'bg-white/5 border-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input 
                        type="radio" 
                        name="method" 
                        value="qris" 
                        checked={method === 'qris'} 
                        onChange={() => setMethod('qris')} 
                        className="accent-violet-500" 
                      />
                      <div>
                        <div className="text-sm font-bold text-white flex items-center gap-2">
                          QRIS Instan
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-mono">Bebas Biaya Admin</span>
                        </div>
                        <p className="text-xs text-gray-400">BCA, Mandiri, GoPay, OVO, ShopeePay, DANA</p>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-cyan-400 font-bold">QRIS ⚡</span>
                  </label>

                  <label 
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                      ['gopay', 'ovo', 'dana'].includes(method) ? 'bg-violet-950/40 border-violet-500' : 'bg-white/5 border-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input 
                        type="radio" 
                        name="method" 
                        value="gopay" 
                        checked={['gopay', 'ovo', 'dana'].includes(method)} 
                        onChange={() => setMethod('gopay')} 
                        className="accent-violet-500" 
                      />
                      <div>
                        <div className="text-sm font-bold text-white">Dompet Digital (E-Wallet)</div>
                        <p className="text-xs text-gray-400">GoPay, OVO, DANA, ShopeePay</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 font-semibold">Instant Push</span>
                  </label>

                  <label 
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                      method.includes('_va') ? 'bg-violet-950/40 border-violet-500' : 'bg-white/5 border-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input 
                        type="radio" 
                        name="method" 
                        value="bca_va" 
                        checked={method.includes('_va')} 
                        onChange={() => setMethod('bca_va')} 
                        className="accent-violet-500" 
                      />
                      <div>
                        <div className="text-sm font-bold text-white">Virtual Account Bank</div>
                        <p className="text-xs text-gray-400">BCA, Mandiri, BRI, BNI (Otomatis Verifikasi)</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 font-semibold">24 Jam</span>
                  </label>
                </div>
              </div>

              {/* Fee Breakdown Notice (5% Platform Fee Transparency) */}
              <div className="p-3 bg-white/[0.03] border border-white/5 rounded-xl text-xs space-y-1">
                <div className="flex justify-between text-gray-400">
                  <span>Nominal Donasi</span>
                  <span className="font-mono text-white">Rp {currentAmount.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Biaya Platform Dqua (5%)</span>
                  <span className="font-mono text-violet-400">-Rp {platformFee.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between font-bold text-white pt-1 border-t border-white/5">
                  <span className="flex items-center gap-1"><Heart size={12} className="text-pink-500 fill-pink-500" /> Diterima Kreator Bersih</span>
                  <span className="font-mono text-emerald-400">Rp {netAmount.toLocaleString('id-ID')}</span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-blue-600 via-violet-600 to-purple-600 hover:brightness-110 shadow-lg shadow-violet-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                Lanjutkan Pembayaran (Rp {currentAmount.toLocaleString('id-ID')})
              </button>
            </form>
          )}

          {step === 'payment' && (
            <div className="space-y-5 text-center">
              <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-xl text-xs text-amber-300">
                <span className="flex items-center gap-1.5"><Clock size={14} /> Batas Waktu Bayar</span>
                <span className="font-mono font-bold text-sm text-amber-200">{formatTimer(secondsLeft)}</span>
              </div>

              {method === 'qris' && (
                <div className="space-y-3">
                  <div className="p-4 bg-white rounded-2xl inline-block shadow-2xl border-4 border-violet-500/30">
                    {/* SVG QR Code Simulation */}
                    <svg viewBox="0 0 160 160" className="w-48 h-48 mx-auto">
                      <rect width="160" height="160" fill="white" />
                      {/* Corner Position Marks */}
                      <rect x="10" y="10" width="40" height="40" fill="black" />
                      <rect x="18" y="18" width="24" height="24" fill="white" />
                      <rect x="24" y="24" width="12" height="12" fill="black" />
                      
                      <rect x="110" y="10" width="40" height="40" fill="black" />
                      <rect x="118" y="18" width="24" height="24" fill="white" />
                      <rect x="124" y="24" width="12" height="12" fill="black" />
                      
                      <rect x="10" y="110" width="40" height="40" fill="black" />
                      <rect x="18" y="118" width="24" height="24" fill="white" />
                      <rect x="24" y="124" width="12" height="12" fill="black" />
                      
                      {/* Random QR code pixels matrix */}
                      <rect x="60" y="20" width="10" height="20" fill="black" />
                      <rect x="80" y="10" width="15" height="10" fill="black" />
                      <rect x="60" y="60" width="40" height="40" fill="#7C3AED" rx="4" />
                      <text x="80" y="85" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">Dqua</text>
                      <rect x="110" y="60" width="20" height="10" fill="black" />
                      <rect x="20" y="60" width="30" height="10" fill="black" />
                      <rect x="10" y="80" width="15" height="20" fill="black" />
                      <rect x="70" y="110" width="25" height="15" fill="black" />
                      <rect x="110" y="120" width="35" height="25" fill="black" />
                      <rect x="130" y="90" width="20" height="15" fill="black" />
                      <rect x="60" y="140" width="30" height="10" fill="black" />
                    </svg>
                  </div>
                  <div className="text-xs text-gray-400">
                    Pindai QRIS di atas dengan BCA, Mandiri Livin, GoPay, OVO, DANA, atau ShopeePay.
                  </div>
                </div>
              )}

              {['gopay', 'ovo', 'dana'].includes(method) && (
                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3">
                  <div className="text-sm font-bold text-white">Kirim Permintaan Push E-Wallet</div>
                  <p className="text-xs text-gray-400">Konfirmasi pembayaran akan muncul langsung pada notifikasi ponsel Anda.</p>
                  <div className="bg-black/30 p-3 rounded-xl font-mono text-cyan-400 font-bold text-lg">
                    Rp {currentAmount.toLocaleString('id-ID')}
                  </div>
                </div>
              )}

              {method.includes('_va') && (
                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3 text-left">
                  <div className="flex justify-between items-center text-xs text-gray-400">
                    <span>Nomor Virtual Account BCA</span>
                    <span className="text-emerald-400 font-semibold">Otomatis Verifikasi</span>
                  </div>
                  <div className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-white/5">
                    <span className="font-mono text-lg font-black tracking-wider text-white">8277 0812 9942 8109</span>
                    <button 
                      onClick={() => copyPaymentCode('8277081299428109')}
                      className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold flex items-center gap-1 transition"
                    >
                      <Copy size={12} />
                      {copiedCode ? 'Tersalin!' : 'Salin'}
                    </button>
                  </div>
                  <div className="text-xs text-gray-400">
                    Total Bayar: <strong className="text-white font-mono">Rp {currentAmount.toLocaleString('id-ID')}</strong> (tepat tanpa pembulatan)
                  </div>
                </div>
              )}

              {/* Simulation button for demo testing */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSimulateSettled}
                  className="w-full py-3 rounded-xl font-bold text-sm text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 hover:bg-emerald-500/25 transition flex items-center justify-center gap-2"
                >
                  <CheckCircle size={16} />
                  Simulasikan Pembayaran Berhasil (Webhook Realtime)
                </button>
                <p className="text-[11px] text-gray-500 mt-2">
                  Menguji integrasi real-time: status donasi seketika terverifikasi dan saldo kreator langsung bertambah.
                </p>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-6 space-y-4">
              <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <ShieldCheck size={44} />
              </div>
              <div>
                <h3 className="text-xl font-black text-white">Donasi Berhasil Diverifikasi!</h3>
                <p className="text-sm text-gray-300 mt-1">
                  Terima kasih <strong className="text-violet-400">{donorName || 'Pendukung'}</strong>! Apresiasi sebesar <span className="font-mono text-emerald-400 font-bold">Rp {currentAmount.toLocaleString('id-ID')}</span> telah diteruskan ke {creator.display_name}.
                </p>
              </div>

              {/* Chibi mascot sticker */}
              <div className="p-3 bg-white/5 border border-white/5 rounded-2xl max-w-xs mx-auto flex items-center gap-3">
                <img src={MASCOT_ASSETS.chibiSticker} alt="Dqau Chibi" className="w-14 h-14 rounded-xl object-cover" />
                <div className="text-left text-xs text-gray-300">
                  <p className="font-bold text-white">"Terima kasih atas dukungannya! 💜"</p>
                  <p className="text-gray-400 mt-0.5">Karya baru akan segera hadir.</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-blue-600 to-violet-600 hover:brightness-110 shadow-lg shadow-violet-600/30 transition"
              >
                Selesai & Kembali
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
