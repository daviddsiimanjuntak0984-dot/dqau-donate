import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from './supabase';
import type { User } from '@supabase/supabase-js';
import { OverlayView } from './overlay';
import { LandingPage } from './components/LandingPage';
import { SocialApp } from './components/SocialApp';
import { ToastContainer } from './components/ToastContainer';
import { type CreatorProfile } from './services/dataStore';
import { MASCOT_ASSETS } from './assets/mascot';
import { X, Lock, Mail, Sparkles } from 'lucide-react';

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isDemoLoggedIn, setIsDemoLoggedIn] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [selectedCreatorForProfile, setSelectedCreatorForProfile] = useState<CreatorProfile | null>(null);

  // Check URL overlay route first
  const overlayMode =
    typeof window !== 'undefined' &&
    (new URLSearchParams(window.location.search).get('overlay') === '1' ||
      window.location.pathname.startsWith('/overlay'));

  useEffect(() => {
    // Check local storage for demo session persistence
    const savedDemo = localStorage.getItem('dqau_demo_session');
    if (savedDemo === 'true') {
      setIsDemoLoggedIn(true);
    }

    if (isSupabaseConfigured) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setUser(session.user);
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user || null);
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  if (overlayMode) {
    return <OverlayView />;
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');

    if (isSupabaseConfigured) {
      if (authMode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setAuthError(error.message);
          setAuthLoading(false);
          return;
        }
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) {
          setAuthError(error.message);
          setAuthLoading(false);
          return;
        }
      }
    }

    // Authenticated successfully or demo session activated
    setIsDemoLoggedIn(true);
    localStorage.setItem('dqau_demo_session', 'true');
    setAuthLoading(false);
    setAuthModalOpen(false);
  };

  const handleQuickDemoLogin = () => {
    setIsDemoLoggedIn(true);
    localStorage.setItem('dqau_demo_session', 'true');
    setAuthModalOpen(false);
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured && user) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setIsDemoLoggedIn(false);
    localStorage.removeItem('dqau_demo_session');
  };

  const isAuthenticated = Boolean(user || isDemoLoggedIn);

  return (
    <>
      <ToastContainer />
      {isAuthenticated ? (
        <SocialApp
          onLogout={handleLogout}
          targetCreator={selectedCreatorForProfile}
        />
      ) : (
        <LandingPage
          onLogin={() => setAuthModalOpen(true)}
          onExplore={() => {
            const el = document.getElementById('kreator');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
          onSelectCreator={(creator) => {
            setSelectedCreatorForProfile(creator);
            setIsDemoLoggedIn(true);
          }}
        />
      )}

      {/* Auth Modal (Login / Sign Up / Demo) */}
      {authModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div 
            className="w-full max-w-md bg-[#0E1322] border border-white/10 rounded-2xl shadow-2xl p-6 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-violet-600 flex items-center justify-center font-bold text-white text-sm">
                  D
                </div>
                <h3 className="text-white font-black text-base">
                  {authMode === 'login' ? 'Masuk ke Dqua' : 'Daftar Akun Baru'}
                </h3>
              </div>
              <button 
                onClick={() => setAuthModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {/* Mascot welcoming teaser */}
            <div className="p-3 bg-violet-950/20 border border-violet-500/20 rounded-xl mb-4 flex items-center gap-3">
              <img src={MASCOT_ASSETS.chibiSticker} alt="Maskot Dqua" className="w-12 h-12 rounded-xl object-cover" />
              <div className="text-xs text-gray-300">
                <strong className="text-white block font-bold">Selamat Datang di Dqua!</strong>
                Akses feed sosial, dasbor pendapatan kreator, dan pesan terenkripsi E2EE.
              </div>
            </div>

            {authError && (
              <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-200 text-xs mb-4">
                {authError}
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 text-gray-500" size={15} />
                  <input
                    type="email"
                    required
                    placeholder="nama@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Kata Sandi</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 text-gray-500" size={15} />
                  <input
                    type="password"
                    required
                    placeholder="Minimal 6 karakter"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-blue-600 to-violet-600 hover:brightness-110 shadow-lg shadow-violet-600/30 transition flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {authLoading ? 'Memproses...' : authMode === 'login' ? 'Masuk Sekarang' : 'Daftar Akun'}
              </button>
            </form>

            {/* Quick Demo Access Button */}
            <div className="pt-4 mt-4 border-t border-white/5 space-y-2">
              <button
                type="button"
                onClick={handleQuickDemoLogin}
                className="w-full py-2.5 rounded-xl font-bold text-xs text-violet-300 bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 transition flex items-center justify-center gap-2"
              >
                <Sparkles size={14} className="text-cyan-400" />
                <span>Masuk Cepat Sebagai Kreator (Demo Sesi)</span>
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  {authMode === 'login' ? 'Belum punya akun? Daftar gratis' : 'Sudah punya akun? Masuk'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
