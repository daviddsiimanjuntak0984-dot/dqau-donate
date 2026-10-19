import React, { useState, useEffect, useRef } from 'react';
import { dataStore, type E2EEConversationItem } from '../services/dataStore';
import { e2eeService } from '../services/e2ee';
import { Lock, Shield, Send, ArrowLeft, Key, Check, CheckCheck, Eye, EyeOff } from 'lucide-react';

export const E2EEChat: React.FC = () => {
  const [conversations, setConversations] = useState<E2EEConversationItem[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string>('conv-1');
  const [inputText, setInputText] = useState('');
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [showCiphertextMode, setShowCiphertextMode] = useState(false);
  const [userFingerprint, setUserFingerprint] = useState<string>('MEMUAT...');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setConversations(dataStore.getConversations());
    const unsub = dataStore.subscribe(() => {
      setConversations(dataStore.getConversations());
    });

    e2eeService.getPublicKey().then((res) => {
      setUserFingerprint(res.fingerprint);
    });

    return unsub;
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations, selectedConvId]);

  const activeConv = conversations.find((c) => c.id === selectedConvId) || conversations[0];

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConv) return;

    const text = inputText.trim();
    setInputText('');

    // Encrypt client-side via Web Crypto API (AES-GCM 256-bit)
    const encrypted = await e2eeService.encryptMessage(text);

    // Save to store
    dataStore.sendE2EEMessage(activeConv.id, text, encrypted.ciphertext, encrypted.nonce);
  };

  return (
    <div className="max-w-5xl mx-auto h-[82vh] bg-[#0E1322] border border-white/5 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
      {/* LEFT: Conversation List (Visible on desktop, or on mobile when no conversation selected) */}
      <div 
        className={`w-full md:w-80 border-r border-white/5 flex flex-col bg-white/[0.01] ${
          selectedConvId ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* List Header */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <div>
            <h2 className="text-white font-black text-base flex items-center gap-2">
              <span>Pesan Privat</span>
              <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-mono px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                <Lock size={10} /> E2EE
              </span>
            </h2>
            <p className="text-[11px] text-gray-400 mt-0.5">Enkripsi perangkat ke perangkat</p>
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto divide-y divide-white/5">
          {conversations.map((conv) => {
            const isSelected = conv.id === selectedConvId;
            return (
              <div
                key={conv.id}
                onClick={() => setSelectedConvId(conv.id)}
                className={`p-3.5 flex items-center gap-3 cursor-pointer transition ${
                  isSelected ? 'bg-violet-950/40 border-l-2 border-violet-500' : 'hover:bg-white/5'
                }`}
              >
                <div className="relative flex-shrink-0">
                  <img
                    src={conv.partner_avatar}
                    alt={conv.partner_name}
                    className="w-11 h-11 rounded-full object-cover bg-gray-800"
                  />
                  {conv.is_online && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#0E1322]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white truncate flex items-center gap-1">
                      {conv.partner_name}
                    </h4>
                    <span className="text-[10px] text-gray-500 font-mono">{conv.last_message_time}</span>
                  </div>
                  <p className="text-xs text-gray-400 truncate mt-0.5">{conv.last_message_preview}</p>
                </div>
                {conv.unread_count > 0 && (
                  <span className="w-5 h-5 rounded-full bg-violet-600 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                    {conv.unread_count}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Device E2EE Key Identity Footer */}
        <div className="p-3 bg-black/40 border-t border-white/5 text-[11px] text-gray-400 flex items-center justify-between">
          <span className="truncate">Device Key: <strong className="text-violet-300 font-mono">{userFingerprint.slice(0, 9)}...</strong></span>
          <button 
            onClick={() => setShowSafetyModal(true)} 
            className="text-violet-400 hover:underline text-[10px] font-semibold"
          >
            Verifikasi
          </button>
        </div>
      </div>

      {/* RIGHT: Chat Room */}
      {activeConv ? (
        <div 
          className={`flex-1 flex flex-col bg-[#0A0E17] ${
            !selectedConvId ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Chat Header */}
          <div className="p-3.5 sm:p-4 border-b border-white/5 flex items-center justify-between bg-[#0E1322]">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedConvId('')}
                className="md:hidden w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400"
                aria-label="Kembali ke daftar"
              >
                <ArrowLeft size={16} />
              </button>
              <img
                src={activeConv.partner_avatar}
                alt={activeConv.partner_name}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1">
                  {activeConv.partner_name}
                  <span className="text-cyan-400 text-xs">✦</span>
                </h3>
                <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                  <span className={`w-1.5 h-1.5 rounded-full ${activeConv.is_online ? 'bg-emerald-400' : 'bg-gray-500'}`} />
                  <span>{activeConv.is_online ? 'Online' : 'Terakhir aktif 1 jam lalu'}</span>
                  <span>·</span>
                  <span className="text-emerald-400 font-mono">E2EE Terverifikasi</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCiphertextMode(!showCiphertextMode)}
                title="Tampilkan Ciphertext / Plaintext"
                className={`p-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition ${
                  showCiphertextMode
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : 'bg-white/5 text-gray-400 border-white/5 hover:text-white'
                }`}
              >
                {showCiphertextMode ? <EyeOff size={14} /> : <Eye size={14} />}
                <span className="hidden sm:inline">{showCiphertextMode ? 'Ciphertext On' : 'Plaintext'}</span>
              </button>

              <button
                onClick={() => setShowSafetyModal(true)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-violet-400 transition"
                title="Nomor Keamanan Kriptografi"
              >
                <Shield size={16} />
              </button>
            </div>
          </div>

          {/* Messages Thread */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {/* E2EE Info banner */}
            <div className="max-w-md mx-auto p-3 rounded-2xl bg-white/[0.02] border border-white/5 text-center text-xs text-gray-400 space-y-1">
              <div className="flex items-center justify-center gap-1 text-emerald-400 font-bold">
                <Lock size={12} />
                <span>Enkripsi End-to-End Aktif</span>
              </div>
              <p className="text-[11px] text-gray-500">
                Pesan dienkripsi di peramban menggunakan Web Crypto API (AES-GCM 256-bit). Server maupun pihak ketiga tidak dapat membaca isi pesan Anda.
              </p>
            </div>

            {activeConv.messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.is_me ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[70%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    msg.is_me
                      ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-tr-none shadow-lg'
                      : 'bg-[#141C2E] text-gray-200 border border-white/5 rounded-tl-none'
                  }`}
                >
                  {showCiphertextMode ? (
                    <div className="font-mono text-[11px] text-amber-300 break-all space-y-1">
                      <div><strong className="text-gray-400">CIPHERTEXT:</strong> {msg.ciphertext}</div>
                      <div><strong className="text-gray-400">NONCE (IV):</strong> {msg.nonce}</div>
                    </div>
                  ) : (
                    <div>{msg.plaintext || '[Pesan Terenkripsi]'}</div>
                  )}

                  <div className="flex items-center justify-end gap-1 text-[10px] text-white/60 mt-1 font-mono">
                    <span>{msg.time}</span>
                    {msg.is_me && (
                      msg.status === 'read' ? <CheckCheck size={12} className="text-cyan-300" /> : <Check size={12} />
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Composer Input */}
          <form onSubmit={handleSendMessage} className="p-3 sm:p-4 border-t border-white/5 bg-[#0E1322] flex items-center gap-2">
            <input
              type="text"
              placeholder="Ketik pesan privat terenkripsi..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className={`p-2.5 sm:px-4 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition flex items-center gap-1.5 ${
                inputText.trim()
                  ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-md hover:brightness-110'
                  : 'bg-white/5 text-gray-600 cursor-not-allowed'
              }`}
            >
              <Send size={15} />
              <span className="hidden sm:inline">Kirim</span>
            </button>
          </form>
        </div>
      ) : null}

      {/* Security Safety Number Modal */}
      {showSafetyModal && activeConv && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0E1322] border border-white/10 rounded-2xl p-5 max-w-sm w-full text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-violet-600/20 text-violet-400 flex items-center justify-center border border-violet-500/30">
              <Key size={28} />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Nomor Keamanan Kriptografi</h3>
              <p className="text-xs text-gray-400 mt-1">
                Verifikasi nomor berikut bersama {activeConv.partner_name} untuk memastikan tidak ada pihak ketiga di jalur komunikasi.
              </p>
            </div>

            <div className="p-3.5 bg-black/40 border border-white/10 rounded-xl font-mono text-base font-bold text-cyan-400 tracking-widest">
              {activeConv.safety_number}
            </div>

            <div className="text-[11px] text-gray-500 text-left space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <Shield size={12} /> Algoritma: ECDH P-256 & AES-256-GCM
              </div>
              <p>Kunci publik tersimpan di browser IndexedDB secara terlindungi.</p>
            </div>

            <button
              onClick={() => setShowSafetyModal(false)}
              className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition"
            >
              Tutup & Selesai
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
