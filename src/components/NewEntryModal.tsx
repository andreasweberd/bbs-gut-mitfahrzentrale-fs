import React, { useState } from 'react';
import { X, Car, User, AlertCircle, CheckCircle2 } from 'lucide-react';
import { EintragTyp } from '../types';

interface NewEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  onEntryCreated: () => void;
}

export const NewEntryModal: React.FC<NewEntryModalProps> = ({
  isOpen,
  onClose,
  token,
  onEntryCreated,
}) => {
  const [typ, setTyp] = useState<EintragTyp>('Angebot');
  const [titel, setTitel] = useState('');
  const [nachricht, setNachricht] = useState('');
  const [sitzplaetze, setSitzplaetze] = useState<number | ''>(3);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanTitel = titel.trim();
    const cleanNachricht = nachricht.trim();

    if (!cleanTitel || !cleanNachricht) {
      setErrorMsg('Bitte gebe sowohl einen Titel als auch eine Beschreibung an.');
      return;
    }

    if (typ === 'Angebot') {
      const seats = Number(sitzplaetze);
      if (isNaN(seats) || seats <= 0) {
        setErrorMsg('Bei einem Angebot müssen freie Sitzplätze (> 0) angegeben werden.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/v1/eintraege', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          typ,
          titel: cleanTitel,
          nachricht: cleanNachricht,
          sitzplaetze: typ === 'Angebot' ? Number(sitzplaetze) : null,
        }),
      });

      const data = await res.json();

      if (res.status === 201 && data.erfolg) {
        onEntryCreated();
        onClose();
        // Reset form
        setTitel('');
        setNachricht('');
        setSitzplaetze(3);
        setTyp('Angebot');
      } else {
        setErrorMsg(data.fehler || 'Fehler beim Erstellen des Eintrags.');
      }
    } catch (err) {
      setErrorMsg('Serververbindung fehlgeschlagen. Bitte erneut versuchen.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#151E2D] p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-[#D4922A] text-[#151E2D]">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif italic text-xl font-bold">Neuer Eintrag</h3>
              <p className="text-xs text-slate-300">Schwarzes Brett BBS GuT</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white bg-white/10 p-1.5 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Eintrags-Typ
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTyp('Angebot')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  typ === 'Angebot'
                    ? 'bg-[#1C7C72]/10 border-[#1C7C72] text-[#1C7C72]'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Car className="w-4 h-4" />
                <span>🚗 Angebot (Biete Fahrt)</span>
              </button>

              <button
                type="button"
                onClick={() => setTyp('Gesuch')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  typ === 'Gesuch'
                    ? 'bg-[#D4922A]/10 border-[#D4922A] text-[#D4922A]'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <User className="w-4 h-4" />
                <span>🙋 Gesuch (Suche Fahrt)</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Titel
            </label>
            <input
              type="text"
              value={titel}
              onChange={(e) => setTitel(e.target.value)}
              placeholder="z. B. Biete Mitfahrt ab Hauptbahnhof Trier / Konz"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#151E2D]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Beschreibung & Route
            </label>
            <textarea
              value={nachricht}
              onChange={(e) => setNachricht(e.target.value)}
              placeholder="Beschreibe Abfahrtszeiten, Treffpunkt, Wochentage und Konditionen..."
              rows={4}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#151E2D]"
              required
            />
          </div>

          {typ === 'Angebot' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Freie Sitzplätze
              </label>
              <input
                type="number"
                min={1}
                max={9}
                value={sitzplaetze}
                onChange={(e) => setSitzplaetze(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#151E2D]"
                required
              />
            </div>
          )}

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-[#151E2D] hover:bg-[#243044] text-white text-xs font-bold transition-all shadow flex items-center gap-2 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4 text-[#D4922A]" />
              <span>{isSubmitting ? 'Veröffentliche...' : 'Veröffentlichen'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
