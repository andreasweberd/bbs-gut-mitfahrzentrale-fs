import React, { useState } from 'react';
import { Eintrag, EintragTyp } from '../types';
import {
  Search,
  RotateCcw,
  Car,
  User,
  Calendar,
  Armchair,
  ArrowRight,
  Plus,
  Trash2,
  X,
  UserCheck,
  Sparkles,
  Info,
  CheckCircle2,
} from 'lucide-react';

interface ListingsViewProps {
  entries: Eintrag[];
  isLoading: boolean;
  onRefresh: () => void;
  onShowContact: (id: number, title: string) => void;
  isLoggedIn: boolean;
  currentUserId?: number | null;
  currentUserName?: string;
  isAdmin?: boolean;
  onlyMine?: boolean;
  onToggleOnlyMine?: () => void;
  onDeleteEntry?: (id: number) => Promise<void> | void;
  onOpenLogin: () => void;
  onOpenNewEntry: () => void;
}

export const ListingsView: React.FC<ListingsViewProps> = ({
  entries,
  isLoading,
  onRefresh,
  onShowContact,
  isLoggedIn,
  currentUserId,
  currentUserName,
  isAdmin,
  onlyMine: controlledOnlyMine,
  onToggleOnlyMine,
  onDeleteEntry,
  onOpenLogin,
  onOpenNewEntry,
}) => {
  const [filterTyp, setFilterTyp] = useState<EintragTyp | ''>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [localOnlyMine, setLocalOnlyMine] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Eintrag | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Controlled or local onlyMine
  const isOnlyMineActive =
    controlledOnlyMine !== undefined ? controlledOnlyMine : localOnlyMine;
  const toggleOnlyMine = () => {
    if (!isLoggedIn) {
      onOpenLogin();
      return;
    }
    if (onToggleOnlyMine) {
      onToggleOnlyMine();
    } else {
      setLocalOnlyMine(!localOnlyMine);
    }
  };

  // Count how many listings belong to the current user
  const myEntriesCount = currentUserId != null
    ? entries.filter((e) => Number(e.schueler_id) === Number(currentUserId)).length
    : 0;

  const filteredEntries = entries.filter((e) => {
    if (isOnlyMineActive) {
      if (currentUserId == null || Number(e.schueler_id) !== Number(currentUserId)) {
        return false;
      }
    }
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

  const handleConfirmDelete = async () => {
    if (!deleteTarget || !onDeleteEntry) return;
    setIsDeleting(true);
    try {
      await onDeleteEntry(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Student Status Notification Bar */}
      {isLoggedIn ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-emerald-900 text-sm">
                Als Schüler angemeldet: {currentUserName || 'Senior Weber'}
              </div>
              <div className="text-emerald-700">
                Du hast {myEntriesCount} eigene(n) Eintrag auf dem Schwarzen Brett. Eigene Einträge kannst du direkt mit dem roten <strong>«Löschen»</strong>-Button entfernen.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={toggleOnlyMine}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                isOnlyMineActive
                  ? 'bg-emerald-700 text-white border-emerald-800 shadow-sm'
                  : 'bg-white hover:bg-emerald-100 text-emerald-800 border-emerald-300'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>{isOnlyMineActive ? 'Alle Einträge anzeigen' : `Nur meine Einträge (${myEntriesCount})`}</span>
            </button>
            <button
              onClick={onOpenNewEntry}
              className="bg-[#D4922A] hover:bg-[#b87d22] text-[#151E2D] font-bold px-3 py-1.5 rounded-xl transition-all shadow-sm flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Eintrag</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-[#D4922A] flex items-center justify-center shrink-0">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm">
                Schüler-Portal der BBS Gestaltung und Technik Trier
              </div>
              <div className="text-slate-500 text-xs mt-0.5">
                Melde dich mit deinem persönlichen Schüler-Token an, um Mitfahrgelegenheiten einzustellen, Kontaktdaten abzurufen und eigene Angebote zu verwalten.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onOpenLogin}
              className="bg-[#151E2D] hover:bg-[#243044] text-white font-bold px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <User className="w-3.5 h-3.5 text-[#D4922A]" />
              <span>Mit Token anmelden</span>
            </button>
          </div>
        </div>
      )}

      {/* Hero Banner */}
      <section className="bg-[#151E2D] text-white rounded-3xl p-6 sm:p-10 relative overflow-hidden shadow-xl border border-white/10">
        <div className="absolute -right-8 -bottom-10 opacity-5 pointer-events-none select-none font-serif italic font-black text-8xl sm:text-9xl text-white">
          Mitfahrt
        </div>

        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 bg-[#D4922A]/20 border border-[#D4922A]/40 text-[#D4922A] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest font-sans">
            Berufsbildende Schule Gestaltung und Technik
          </div>
          <h1 className="font-serif italic text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Schwarzes Brett
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Mitfahrgelegenheiten einfach und unkompliziert organisieren. Biete freie Plätze an oder finde Schulweg-Mitfahrten in der Region Trier und Umland.
          </p>

          <div className="pt-2 flex flex-wrap gap-3 items-center">
            {isLoggedIn ? (
              <>
                <button
                  onClick={onOpenNewEntry}
                  className="bg-[#D4922A] hover:bg-[#b87d22] text-[#151E2D] font-bold text-sm px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Neuen Eintrag erstellen</span>
                </button>

                <button
                  onClick={toggleOnlyMine}
                  className={`font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer border ${
                    isOnlyMineActive
                      ? 'bg-amber-400 text-slate-950 border-amber-300 font-bold shadow-md'
                      : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                  }`}
                >
                  <UserCheck className="w-4 h-4 text-[#D4922A]" />
                  <span>
                    {isOnlyMineActive ? 'Alle Einträge anzeigen' : `Meine Einträge verwalten (${myEntriesCount})`}
                  </span>
                </button>
              </>
            ) : (
              <button
                onClick={onOpenLogin}
                className="bg-[#D4922A] hover:bg-[#b87d22] text-[#151E2D] font-bold text-sm px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                <User className="w-4 h-4" />
                <span>Mit Token anmelden</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
        {/* Row 1: Search and Type Dropdown */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
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
            {(filterTyp || searchTerm || isOnlyMineActive) && (
              <button
                onClick={() => {
                  setFilterTyp('');
                  setSearchTerm('');
                  if (isOnlyMineActive) toggleOnlyMine();
                }}
                className="px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Zurücksetzen</span>
              </button>
            )}

            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="px-3.5 py-2 text-xs font-bold text-[#151E2D] bg-amber-100 hover:bg-amber-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Aktualisieren"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Aktualisieren</span>
            </button>
          </div>
        </div>

        {/* Row 2: Filter Tabs (Pills) - ALWAYS VISIBLE */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1">
            Filter:
          </span>

          <button
            onClick={() => {
              setFilterTyp('');
              if (isOnlyMineActive) toggleOnlyMine();
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              !filterTyp && !isOnlyMineActive
                ? 'bg-[#151E2D] text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <span>Alle Einträge ({entries.length})</span>
          </button>

          <button
            onClick={() => {
              setFilterTyp('Angebot');
              if (isOnlyMineActive) toggleOnlyMine();
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              filterTyp === 'Angebot' && !isOnlyMineActive
                ? 'bg-[#1C7C72] text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span>🚗 Angebote ({entries.filter((e) => e.typ === 'Angebot').length})</span>
          </button>

          <button
            onClick={() => {
              setFilterTyp('Gesuch');
              if (isOnlyMineActive) toggleOnlyMine();
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              filterTyp === 'Gesuch' && !isOnlyMineActive
                ? 'bg-[#D4922A] text-[#151E2D] shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>🙋 Gesuche ({entries.filter((e) => e.typ === 'Gesuch').length})</span>
          </button>

          {/* "Meine Einträge" Filter Button - ALWAYS SHOWN */}
          <button
            onClick={toggleOnlyMine}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
              isOnlyMineActive
                ? 'bg-[#151E2D] text-white border-[#151E2D] shadow-sm'
                : isLoggedIn
                ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-300'
            }`}
            title={isLoggedIn ? 'Nur eigene Einträge filtern' : 'Als Schüler anmelden, um eigene Einträge zu sehen'}
          >
            <UserCheck className={`w-3.5 h-3.5 ${isOnlyMineActive ? 'text-[#D4922A]' : 'text-slate-500'}`} />
            <span>Meine Einträge</span>
            {isLoggedIn ? (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                  isOnlyMineActive ? 'bg-[#D4922A] text-[#151E2D]' : 'bg-amber-200 text-amber-950'
                }`}
              >
                {myEntriesCount}
              </span>
            ) : (
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700">
                Anmelden
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Active Filter Notice */}
      {isOnlyMineActive && (
        <div className="bg-[#151E2D] text-white p-3.5 rounded-xl flex items-center justify-between gap-3 text-xs shadow">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-[#D4922A] shrink-0" />
            <span>
              Du filterst nach <strong>deinen eigenen Einträgen</strong> ({currentUserName || 'Senior Weber'}). Du kannst jeden deiner Einträge mit dem roten <strong>«Löschen»</strong>-Button entfernen.
            </span>
          </div>
          <button
            onClick={toggleOnlyMine}
            className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            ✕ Filter beenden
          </button>
        </div>
      )}

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
            {isOnlyMineActive
              ? 'Du hast aktuell noch keine eigenen Einträge auf dem Schwarzen Brett. Erstelle jetzt dein erstes Angebot oder Gesuch!'
              : searchTerm || filterTyp
              ? 'Für deine aktuellen Suchkriterien wurden keine Ergebnisse gefunden. Versuche den Filter zurückzusetzen.'
              : 'Aktuell sind keine Einträge auf dem Schwarzen Brett vorhanden.'}
          </p>
          <div className="pt-2 flex justify-center gap-2">
            {isOnlyMineActive && (
              <button
                onClick={toggleOnlyMine}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer"
              >
                Alle Einträge ansehen
              </button>
            )}
            <button
              onClick={onOpenNewEntry}
              className="bg-[#D4922A] hover:bg-[#b87d22] text-[#151E2D] font-bold text-xs px-4 py-2 rounded-xl transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Jetzt Eintrag anlegen</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEntries.map((entry) => {
            const isAngebot = entry.typ === 'Angebot';
            const isOwner = Boolean(
              (currentUserId != null && Number(entry.schueler_id) === Number(currentUserId)) ||
              isAdmin
            );

            return (
              <div
                key={entry.id}
                className={`bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group hover:-translate-y-0.5 relative ${
                  isOwner
                    ? 'border-2 border-emerald-500 ring-2 ring-emerald-500/20 bg-gradient-to-b from-white to-emerald-50/40'
                    : 'border border-slate-200/90'
                }`}
              >
                <div className="space-y-3">
                  {/* Top Bar */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
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

                      {/* Owner Indicator Badge */}
                      {isOwner && (
                        <span className="bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                          <CheckCircle2 className="w-3 h-3 text-white" />
                          <span>Dein Eintrag</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-semibold text-slate-400">
                        #{entry.id}
                      </span>
                    </div>
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

                  <div className="flex items-center gap-2">
                    {/* Delete button for author/admin - PROMINENT AND HIGH VISIBILITY */}
                    {isOwner && onDeleteEntry && (
                      <button
                        onClick={() => setDeleteTarget(entry)}
                        className="bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 border border-red-300 font-bold text-xs px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                        title="Diesen Eintrag sofort löschen"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-600" />
                        <span>Löschen</span>
                      </button>
                    )}

                    {/* Contact Button */}
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
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-red-50 p-5 border-b border-red-100 flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif italic font-bold text-lg text-slate-900">
                    Eintrag löschen?
                  </h3>
                  <p className="text-xs text-slate-500">
                    Eintrag #{deleteTarget.id} ({deleteTarget.typ})
                  </p>
                </div>
              </div>

              <button
                onClick={() => setDeleteTarget(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/50 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-3">
              <p className="text-sm text-slate-700 leading-relaxed">
                Möchtest du deinen Eintrag <strong className="text-slate-900 font-semibold">«{deleteTarget.titel}»</strong> wirklich unwiderruflich vom Schwarzen Brett entfernen?
              </p>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 italic">
                "{deleteTarget.nachricht}"
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 transition-colors cursor-pointer disabled:opacity-50"
              >
                Abbrechen
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <span>Lösche...</span>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Ja, Eintrag löschen</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
