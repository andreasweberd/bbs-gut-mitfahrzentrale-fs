import React, { useState } from 'react';
import { Eintrag, EintragTyp } from '../types';
import { Search, RotateCcw, Car, User, Calendar, Armchair, ArrowRight, Plus } from 'lucide-react';

interface ListingsViewProps {
  entries: Eintrag[];
  isLoading: boolean;
  onRefresh: () => void;
  onShowContact: (id: number, title: string) => void;
  isLoggedIn: boolean;
  onOpenLogin: () => void;
  onOpenNewEntry: () => void;
}

export const ListingsView: React.FC<ListingsViewProps> = ({
  entries,
  isLoading,
  onRefresh,
  onShowContact,
  isLoggedIn,
  onOpenLogin,
  onOpenNewEntry,
}) => {
  const [filterTyp, setFilterTyp] = useState<EintragTyp | ''>('');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEntries = entries.filter((e) => {
    if (filterTyp && e.typ !== filterTyp) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchTitle = e.titel.toLowerCase().includes(term);
      const matchText = (e.nachricht || '').toLowerCase().includes(term);
      if (!matchTitle && !matchText) return false;
    }
    return true;
  });

  const formatDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleDateString('de-DE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <section className="bg-[#151E2D] text-white rounded-3xl p-6 sm:p-10 relative overflow-hidden shadow-xl border border-white/10">
        <div className="absolute -right-8 -bottom-10 opacity-5 pointer-events-none select-none font-serif italic font-black text-8xl sm:text-9xl text-white">
          Mitfahrt
        </div>

        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 bg-[#D4922A]/20 border border-[#D4922A]/40 text-[#D4922A] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest font-sans">
            Berufsbildende Schule GuT
          </div>
          <h1 className="font-serif italic text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Schwarzes Brett
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Mitfahrgelegenheiten einfach und unkompliziert organisieren. Biete freie Plätze an oder finde Schulweg-Mitfahrten in der Region.
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            {isLoggedIn ? (
              <button
                onClick={onOpenNewEntry}
                className="bg-[#D4922A] hover:bg-[#b87d22] text-[#151E2D] font-bold text-sm px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Eintrag Erstellen</span>
              </button>
            ) : (
              <button
                onClick={onOpenLogin}
                className="bg-white/15 hover:bg-white/25 border border-white/20 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                <span>Anmelden & Mitfahren</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex flex-1 flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Suche nach Orten, Strecken oder Titeln..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#151E2D] transition-all"
            />
          </div>

          {/* Type Filter */}
          <select
            value={filterTyp}
            onChange={(e) => setFilterTyp(e.target.value as EintragTyp | '')}
            className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#151E2D]"
          >
            <option value="">Alle Eintrags-Typen</option>
            <option value="Angebot">🚗 Nur Angebote (Biete Fahrt)</option>
            <option value="Gesuch">🙋 Nur Gesuche (Suche Fahrt)</option>
          </select>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {(filterTyp || searchTerm) && (
            <button
              onClick={() => {
                setFilterTyp('');
                setSearchTerm('');
              }}
              className="px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Zurücksetzen</span>
            </button>
          )}

          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="px-3.5 py-2 text-xs font-bold text-[#151E2D] bg-amber-100 hover:bg-amber-200 rounded-xl transition-colors flex items-center gap-1.5"
            title="Aktualisieren"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Aktualisieren</span>
          </button>
        </div>
      </div>

      {/* Grid of Listings */}
      {isLoading ? (
        <div className="py-16 text-center text-slate-400 font-medium text-sm flex flex-col items-center gap-3">
          <RotateCcw className="w-8 h-8 animate-spin text-[#1C7C72]" />
          <span>Lade schwarzes Brett Einträge...</span>
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="font-serif italic font-bold text-xl text-slate-800">Keine Einträge gefunden</h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            {searchTerm || filterTyp
              ? 'Für deine aktuellen Suchkriterien wurden keine Ergebnisse gefunden. Versuche den Filter zurückzusetzen.'
              : 'Aktuell sind keine Einträge auf dem Schwarzen Brett vorhanden. Sei der Erste und erstelle ein Angebot!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEntries.map((entry) => {
            const isAngebot = entry.typ === 'Angebot';
            return (
              <div
                key={entry.id}
                className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group hover:-translate-y-0.5"
              >
                <div className="space-y-3">
                  {/* Top Bar */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
                        isAngebot
                          ? 'bg-[#1C7C72]/15 text-[#1C7C72] border border-[#1C7C72]/30'
                          : 'bg-[#D4922A]/15 text-[#D4922A] border border-[#D4922A]/30'
                      }`}
                    >
                      {isAngebot ? (
                        <>
                          <Car className="w-3.5 h-3.5" />
                          <span>Angebot</span>
                        </>
                      ) : (
                        <>
                          <User className="w-3.5 h-3.5" />
                          <span>Gesuch</span>
                        </>
                      )}
                    </span>
                    <span className="font-mono text-[11px] font-semibold text-slate-400">
                      #{entry.id}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-serif font-bold text-lg text-slate-900 group-hover:text-[#1C7C72] transition-colors leading-snug">
                    {entry.titel}
                  </h3>

                  {/* Description */}
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed line-clamp-3">
                    {entry.nachricht}
                  </p>
                </div>

                {/* Footer Meta & Action */}
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {formatDate(entry.erstellungsdatum)}
                    </span>

                    {entry.sitzplaetze != null && (
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono text-[11px] font-bold flex items-center gap-1">
                        <Armchair className="w-3 h-3 text-[#1C7C72]" />
                        {entry.sitzplaetze} {entry.sitzplaetze === 1 ? 'Platz' : 'Plätze'}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      if (!isLoggedIn) {
                        onOpenLogin();
                      } else {
                        onShowContact(entry.id, entry.titel);
                      }
                    }}
                    className="bg-[#151E2D] hover:bg-[#1C7C72] text-white font-bold text-xs px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1 shadow-sm cursor-pointer"
                  >
                    <span>Kontakt</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
