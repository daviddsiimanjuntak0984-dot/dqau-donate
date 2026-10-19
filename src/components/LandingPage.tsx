import React, { useState } from 'react';
import { MASCOT_ASSETS } from '../assets/mascot';
import { dataStore, type CreatorProfile } from '../services/dataStore';
import { DonationModal } from './DonationModal';
import { ImageWithFallback } from './ImageWithFallback';
import { Heart, ShieldCheck, Zap, Users, Sparkles, ChevronRight, Lock, ArrowRight, HelpCircle } from 'lucide-react';

interface LandingPageProps {
  onLogin: () => void;
  onExplore: () => void;
  onSelectCreator: (creator: CreatorProfile) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onExplore, onSelectCreator }) => {
  const [selectedCreatorForDonation, setSelectedCreatorForDonation] = useState<CreatorProfile | null>(null);
  const creators = dataStore.getCreators();

  const handleOpenDonate = (creator: CreatorProfile, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCreatorForDonation(creator);
  };

  return (
    <div className="min-h-screen bg-[#08070D] text-white flex flex-col selection:bg-violet-600 selection:text-white">
      {/* 3-ZONE HEADER CONTRACT */}
      <header className="sticky top-0 z-40 bg-[#08070D]/85 backdrop-blur-md border-b border-white/5 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
          {/* Zone 1: Brand wordmark with single line */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-violet-600 flex items-center justify-center font-black text-lg text-white shadow-lg shadow-violet-600/30">
              D
            </div>
            {/* Maskot Anime Dqua Beranimasi di Samping Huruf D */}
            <div className="relative shrink-0" title="Maskot Anime Dqua">
              <div className="w-8 h-8 rounded-full p-[1.5px] bg-gradient-to-tr from-cyan-400 via-blue-500 to-violet-500 animate-mascot-float">
                <ImageWithFallback
                  src={MASCOT_ASSETS.chibiSticker}
                  fallbackSrc={MASCOT_ASSETS.portraitAvatar}
                  alt="Maskot Dqua"
                  className="w-full h-full object-cover rounded-full bg-[#0E1322]"
                />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-cyan-400 border border-[#08070D] rounded-full animate-pulse" />
            </div>
            <span className="text-lg font-black tracking-tight text-white whitespace-nowrap">
              Dqua <span className="text-violet-400">Donate</span>
            </span>
          </div>

          {/* Zone 2: 4-5 Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-gray-300">
            <a href="#hero" className="hover:text-white transition whitespace-nowrap">Beranda</a>
            <a href="#kenapa" className="hover:text-white transition whitespace-nowrap">Fitur</a>
            <a href="#kreator" className="hover:text-white transition whitespace-nowrap">Jelajahi Kreator</a>
            <a href="#faq" className="hover:text-white transition whitespace-nowrap">FAQ</a>
          </nav>

          {/* Zone 3: Primary CTA */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onLogin}
              className="px-5 py-2 rounded-full font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-blue-600 to-violet-600 hover:brightness-110 shadow-lg shadow-violet-600/30 transition whitespace-nowrap cursor-pointer"
            >
              Masuk / Daftar
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION (Ref: Screenshot landing page) */}
      <section id="hero" className="relative pt-6 sm:pt-10 pb-16 px-4 sm:px-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-gradient-to-br from-[#120F24]/90 via-[#0B0914]/95 to-[#08070D] border border-violet-500/20 rounded-3xl p-6 sm:p-10 shadow-2xl overflow-hidden relative">
          {/* Ambient Glow */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />

          {/* Left Column: Headline & Action */}
          <div className="lg:col-span-7 space-y-6 z-10 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-600/20 border border-violet-500/30 text-violet-300 text-xs font-semibold">
              <Sparkles size={13} className="text-cyan-400" />
              <span>Dukung Kreator, Wujudkan Karya</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight">
              Dukung Kreator <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400">
                Favoritmu!
              </span>
            </h1>

            <p className="text-gray-300 text-sm sm:text-base max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Dqua Donate adalah platform apresiasi karya dan jejaring sosial terpadu bagi kreator Indonesia. Dukung langsung via QRIS, nikmati konten eksklusif, dan berkomunikasi privat dengan perlindungan enkripsi end-to-end.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
              <a
                href="#kreator"
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-blue-600 to-violet-600 hover:brightness-110 shadow-lg shadow-violet-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Heart size={16} className="fill-white" />
                <span>Jelajahi Kreator</span>
              </a>

              <button
                onClick={onLogin}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-bold text-sm text-gray-200 bg-white/5 hover:bg-white/10 border border-white/10 transition flex items-center justify-center gap-2"
              >
                <span>Masuk ke Feed Sosial</span>
                <ArrowRight size={15} />
              </button>
            </div>

            {/* 4 Trust Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-white/5 text-xs text-gray-300">
              <div className="flex items-center gap-1.5 justify-center lg:justify-start">
                <ShieldCheck size={16} className="text-emerald-400 flex-shrink-0" />
                <span>Aman & Terpercaya</span>
              </div>
              <div className="flex items-center gap-1.5 justify-center lg:justify-start">
                <Zap size={16} className="text-amber-400 flex-shrink-0" />
                <span>Proses Cepat (QRIS)</span>
              </div>
              <div className="flex items-center gap-1.5 justify-center lg:justify-start">
                <Users size={16} className="text-blue-400 flex-shrink-0" />
                <span>Dukungan Langsung</span>
              </div>
              <div className="flex items-center gap-1.5 justify-center lg:justify-start">
                <Lock size={16} className="text-violet-400 flex-shrink-0" />
                <span>Biaya Tetap 5%</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Mascot Asset */}
          <div className="lg:col-span-5 relative z-10 flex justify-center">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-tr from-violet-600/30 to-blue-500/30 rounded-3xl blur-2xl transform group-hover:scale-105 transition duration-500" />
              <img
                src={MASCOT_ASSETS.heroDesktop}
                alt="Maskot Anime Dqua Donate"
                className="relative rounded-2xl border-2 border-violet-500/30 shadow-2xl object-cover max-h-[420px] w-full"
              />
              <div className="absolute bottom-3 left-3 right-3 p-3 bg-[#0E1322]/90 backdrop-blur-md rounded-xl border border-white/10 text-xs text-gray-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white block">Maskot Resmi Dqua</span>
                  <span className="text-[11px] text-violet-300">"Bersama Kita Bisa Dukung Kreator!"</span>
                </div>
                <span className="text-cyan-400 font-mono text-xs font-bold">100% Original</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHY DQUA DONATE SECTION (Ref: Screenshot) */}
      <section id="kenapa" className="py-12 px-4 sm:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <span className="text-xs font-black text-violet-400 tracking-wider uppercase">Fitur Utama</span>
          <h2 className="text-2xl sm:text-4xl font-black text-white">Kenapa Dqua Donate?</h2>
          <p className="text-sm text-gray-400">
            Kami hadir untuk memudahkan kamu mendukung kreator secara langsung dengan fitur yang lengkap, aman, dan modern.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-[#0E1322] border border-white/5 hover:border-violet-500/40 transition group space-y-3">
            <div className="w-12 h-12 rounded-xl bg-violet-600/20 text-violet-400 flex items-center justify-center font-bold">
              <Heart size={22} className="group-hover:scale-110 transition" />
            </div>
            <h3 className="text-base font-bold text-white">Donasi Mudah & Lengkap</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Berdonasi cepat dan praktis mulai dari Rp 5.000 dengan QRIS otomatis, GoPay, OVO, DANA, dan Virtual Account Multi-Bank.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#0E1322] border border-white/5 hover:border-violet-500/40 transition group space-y-3">
            <div className="w-12 h-12 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">
              <ShieldCheck size={22} className="group-hover:scale-110 transition" />
            </div>
            <h3 className="text-base font-bold text-white">Aman & Terpercaya</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Seluruh transaksi tercatat otomatis dan dilindungi verifikasi server, mencegah klaim palsu dan menjamin dana sampai ke kreator.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#0E1322] border border-white/5 hover:border-violet-500/40 transition group space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold">
              <Lock size={22} className="group-hover:scale-110 transition" />
            </div>
            <h3 className="text-base font-bold text-white">Pesan Privat E2EE</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Komunikasi privat antara kreator dan supporter terlindungi kriptografi end-to-end Web Crypto API langsung dari browser Anda.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#0E1322] border border-white/5 hover:border-violet-500/40 transition group space-y-3">
            <div className="w-12 h-12 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center font-bold">
              <Sparkles size={22} className="group-hover:scale-110 transition" />
            </div>
            <h3 className="text-base font-bold text-white">Potongan Flat 5%</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Kreator menerima 95% penghasilan bersih tanpa biaya tersembunyi. Transparansi pembagian langsung ditampilkan sebelum bayar.
            </p>
          </div>
        </div>
      </section>

      {/* FEATURED CREATORS SECTION (Ref: Screenshot) */}
      <section id="kreator" className="py-12 px-4 sm:px-8 max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="text-xs font-black text-violet-400 tracking-wider uppercase">Creator Populer</span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">Jelajahi Kreator Favoritmu</h2>
          </div>
          <button
            onClick={onExplore}
            className="text-xs sm:text-sm font-bold text-violet-400 hover:text-violet-300 flex items-center gap-1"
          >
            Lihat Semua <ChevronRight size={16} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {creators.map((c) => (
            <div
              key={c.id}
              onClick={() => onSelectCreator(c)}
              className="bg-[#0E1322] border border-white/5 rounded-2xl p-5 hover:border-violet-500/40 transition cursor-pointer flex flex-col justify-between group shadow-xl"
            >
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src={c.avatar_url}
                    alt={c.display_name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-violet-500/30 group-hover:scale-105 transition"
                  />
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-white truncate flex items-center gap-1">
                      {c.display_name}
                      <span className="text-cyan-400 text-xs">✦</span>
                    </h4>
                    <p className="text-xs text-gray-400">{c.category}</p>
                  </div>
                </div>

                <p className="text-xs text-gray-300 line-clamp-2 mb-4 leading-relaxed">
                  {c.bio}
                </p>

                <div className="grid grid-cols-2 gap-2 p-2.5 bg-black/40 rounded-xl mb-4 text-xs font-mono">
                  <div>
                    <span className="text-gray-500 text-[10px] block">Pengikut</span>
                    <strong className="text-white">{c.followers_count.toLocaleString('id-ID')}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 text-[10px] block">Total Dukungan</span>
                    <strong className="text-emerald-400">Rp {(c.total_donations_idr / 1000).toFixed(0)}k</strong>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => handleOpenDonate(c, e)}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-violet-600 hover:brightness-110 shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Heart size={13} className="fill-white" />
                <span>Dukung</span>
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="py-12 px-4 sm:px-8 max-w-4xl mx-auto w-full">
        <div className="text-center mb-8">
          <HelpCircle size={24} className="text-violet-400 mx-auto mb-2" />
          <h2 className="text-2xl font-black text-white">Pertanyaan yang Sering Diajukan</h2>
        </div>

        <div className="space-y-3">
          {[
            {
              q: 'Bagaimana cara berdonasi ke kreator di Dqua Donate?',
              a: 'Pilih kreator favoritmu, tentukan nominal donasi, dan bayar secara instan menggunakan QRIS (semua bank & e-wallet), GoPay, OVO, DANA, atau Virtual Account Bank.',
            },
            {
              q: 'Berapa potongan biaya platform?',
              a: 'Dqua Donate menerapkan komisi platform flat sebesar 5%. Sebanyak 95% dana bersih langsung menjadi hak kreator tanpa potongan tersembunyi.',
            },
            {
              q: 'Bagaimana keamanan pesan pribadi E2EE bekerja?',
              a: 'Pesan pribadi dienkripsi langsung di browser pengirim menggunakan Web Crypto API (AES-GCM 256-bit) sebelum dikirim. Hanya perangkat penerima yang memiliki kunci privat untuk mendekripsinya.',
            },
            {
              q: 'Kapan donasi dapat dicairkan oleh kreator?',
              a: 'Kreator dapat mengajukan pencairan dana ke rekening bank lokal atau dompet digital setelah mencapai batas minimum penarikan Rp 100.000.',
            },
          ].map((faq, i) => (
            <div key={i} className="p-4 bg-[#0E1322] border border-white/5 rounded-2xl">
              <h3 className="font-bold text-sm text-white mb-1.5">{faq.q}</h3>
              <p className="text-xs text-gray-400 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-auto border-t border-white/5 bg-[#050408] py-8 px-4 text-center text-xs text-gray-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-black text-sm text-white">Dqua Donate</span>
            <span>· Dukung Kreator, Wujudkan Karya</span>
          </div>
          <div className="flex gap-4 text-gray-400">
            <a href="#" className="hover:text-white">Ketentuan Layanan</a>
            <a href="#" className="hover:text-white">Kebijakan Privasi</a>
            <a href="#" className="hover:text-white">Bantuan</a>
          </div>
          <div>© 2026 Dqua Donate Indonesia. Hak Cipta Dilindungi.</div>
        </div>
      </footer>

      {/* Donation Modal when triggered from landing page */}
      {selectedCreatorForDonation && (
        <DonationModal
          creator={selectedCreatorForDonation}
          isOpen={Boolean(selectedCreatorForDonation)}
          onClose={() => setSelectedCreatorForDonation(null)}
        />
      )}
    </div>
  );
};
