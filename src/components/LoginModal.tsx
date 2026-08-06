import React, { useState } from 'react';
import { X, Key, ShieldCheck, UserCheck, AlertCircle, ArrowRight } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (token: string, isAdmin: boolean) => void;
  adminToken: string;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  adminToken,
}) => {
  const [tokenInput, setTokenInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (tokenToUse?: string) => {
    const token = (tokenToUse || tokenInput).trim();
    if (!token) {
      setErrorMsg('Bitte gebe deinen Zugangs-Token ein.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/v1/anmelden', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();

      if (res.ok && data.erfolg) {
        onLoginSuccess(token, data.isAdmin || token === adminToken);
        onClose();
        setTokenInput('');
      } else {
        setErrorMsg(data.fehler || 'Token ungültig oder inaktiv.');
      }
    } catch (err) {
      setErrorMsg('Server nicht erreichbar. Bitte erneut versuchen.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#151E2D] p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/60 hover:text-white bg-white/10 p-1.5 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="text-[11px] font-bold text-[#D4922A] uppercase tracking-widest mb-1 font-sans">
            Berufsbildende Schule GuT
          </div>
          <h2 className="font-serif italic text-2xl font-bold tracking-tight">Anmeldung</h2>
          <p className="text-xs text-slate-300 mt-1">
            Gebe deinen Schüler-Token ein, um Kontakte einzusehen oder Mitfahrten zu veröffentlichen.
          </p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Zugangs-Token
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="z. B. TOKEN-2026-001"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#151E2D] transition-all font-mono"
              />
            </div>
          </div>

          <button
            onClick={() => handleLogin()}
            disabled={isLoading}
            className="w-full bg-[#151E2D] hover:bg-[#243044] text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <span>Prüfe Token...</span>
            ) : (
              <>
                <span>Anmelden</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Preset Buttons for Quick Demo */}
          <div className="pt-3 border-t border-slate-100">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Schnell-Anmeldung (Test-Konten)
            </div>
            <div className="grid grid-cols-1 gap-1.5 text-xs">
              <button
                onClick={() => handleLogin('TOKEN-2026-001')}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <UserCheck className="w-3.5 h-3.5 text-[#1C7C72]" />
                  <span>Senior Weber (Schüler)</span>
                </div>
                <span className="font-mono text-[10px] text-slate-400">TOKEN-2026-001</span>
              </button>

              <button
                onClick={() => handleLogin('TOKEN-2026-002')}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <UserCheck className="w-3.5 h-3.5 text-[#1C7C72]" />
                  <span>M. Müller (Schüler)</span>
                </div>
                <span className="font-mono text-[10px] text-slate-400">TOKEN-2026-002</span>
              </button>

              <button
                onClick={() => handleLogin('Wulli')}
                className="flex items-center justify-between p-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                  <span className="font-bold">Administrator</span>
                </div>
                <span className="font-mono text-[10px] text-amber-600">Wulli</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
