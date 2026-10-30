import React, { useState } from 'react';
import { X, Key, ShieldCheck, UserCheck, AlertCircle, ArrowRight } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (
    token: string,
    isAdmin: boolean,
    user?: { id: number; nachname: string; email?: string }
  ) => void;
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
        onLoginSuccess(token, Boolean(data.isAdmin || token === adminToken), {
          id: data.schuelerId ?? (token === adminToken ? 0 : 1),
          nachname: data.nachname || '',
          email: data.email || '',
        });
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
            className="absolute top-4 right-4 text-white/60 hover:text-white bg-white/10 p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-white rounded-lg px-2.5 py-1 shadow-sm">
              <img
                src="/assets/aistudio/grafik_d216798c.png"
                alt="BBS GuT Trier Logo"
                className="h-7 w-auto object-contain"
              />
            </div>
            <div className="text-[11px] font-bold text-[#D4922A] uppercase tracking-widest font-sans">
              BBS GuT Trier
            </div>
          </div>

          <h2 className="font-serif italic text-2xl font-bold tracking-tight">Anmeldung</h2>
          <p className="text-xs text-slate-300 mt-1">
            Gib deinen persönlichen Schüler-Token ein, um Kontakte einzusehen oder Mitfahrten zu organisieren.
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
                placeholder="Dein Zugangs-Token..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#151E2D] transition-all font-mono"
                autoFocus
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">
              Deinen persönlichen Token erhältst du im Schulsekretariat oder von deiner Klassenleitung.
            </p>
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
        </div>
      </div>
    </div>
  );
};
