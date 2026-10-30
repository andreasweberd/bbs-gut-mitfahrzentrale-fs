import React from 'react';
import { Car, Settings, Plus, LogOut, User, UserCheck } from 'lucide-react';

interface NavbarProps {
  activeTab: 'eintraege' | 'admin';
  setActiveTab: (tab: 'eintraege' | 'admin') => void;
  isLoggedIn: boolean;
  isAdmin: boolean;
  userName?: string;
  myEntriesCount?: number;
  onlyMine?: boolean;
  onToggleOnlyMine?: () => void;
  onOpenNewEntry: () => void;
  onOpenLogin: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isLoggedIn,
  isAdmin,
  userName,
  myEntriesCount = 0,
  onlyMine = false,
  onToggleOnlyMine,
  onOpenNewEntry,
  onOpenLogin,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#151E2D] border-b border-white/10 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Official Brand Logo & Title */}
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => {
            setActiveTab('eintraege');
            if (onlyMine && onToggleOnlyMine) onToggleOnlyMine();
          }}
          title="BBS GuT Trier · Mitfahrzentrale Startseite"
        >
          <div className="bg-white rounded-lg px-2.5 py-1 shadow-sm flex items-center justify-center border border-white/40">
            <img
              src="/assets/aistudio/grafik_d216798c.png"
              alt="BBS GuT Trier Logo"
              className="h-7 sm:h-8 w-auto object-contain"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-serif italic font-bold text-base sm:text-lg text-white tracking-tight flex items-center gap-1.5 leading-tight">
              <Car className="w-4 h-4 text-[#D4922A]" />
              Mitfahrzentrale
            </span>
            <span className="text-[10px] text-white/70 font-sans tracking-wide hidden sm:block">
              Gestaltung &amp; Technik Trier
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => {
              setActiveTab('eintraege');
              if (onlyMine && onToggleOnlyMine) onToggleOnlyMine();
            }}
            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'eintraege' && !onlyMine
                ? 'bg-white/15 text-white shadow-sm font-bold'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <Car className="w-4 h-4" />
            <span>Schwarzes Brett</span>
          </button>

          {/* Meine Einträge Tab - ALWAYS visible */}
          <button
            onClick={() => {
              setActiveTab('eintraege');
              if (!isLoggedIn) {
                onOpenLogin();
              } else if (onToggleOnlyMine) {
                if (!onlyMine) onToggleOnlyMine();
              }
            }}
            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'eintraege' && onlyMine
                ? 'bg-amber-400 text-slate-950 shadow-sm font-bold'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
            title="Eigene Angebote und Gesuche anzeigen"
          >
            <UserCheck className="w-4 h-4 text-[#D4922A]" />
            <span>Meine Einträge</span>
            {isLoggedIn && (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                  onlyMine ? 'bg-[#151E2D] text-white' : 'bg-white/20 text-white'
                }`}
              >
                {myEntriesCount}
              </span>
            )}
          </button>

          {isAdmin && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-white/15 text-white shadow-sm font-bold'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <Settings className="w-4 h-4 text-[#1C7C72]" />
              <span>Admin</span>
            </button>
          )}
        </nav>

        {/* User Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {isLoggedIn ? (
            <>
              <button
                onClick={onOpenNewEntry}
                className="bg-[#D4922A] hover:bg-[#b87d22] text-[#151E2D] font-bold text-xs sm:text-sm px-3.5 py-1.5 rounded-lg transition-all shadow flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Neuer Eintrag</span>
                <span className="sm:hidden">+ Eintrag</span>
              </button>

              <div className="flex items-center gap-1.5 sm:gap-2 border-l border-white/15 pl-2 sm:pl-3">
                <span className="bg-emerald-950/70 text-emerald-200 border border-emerald-500/40 text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{isAdmin ? 'Admin' : `Schüler: ${userName || 'Weber'}`}</span>
                </span>
                <button
                  onClick={onLogout}
                  className="text-white/60 hover:text-red-300 text-xs px-2 py-1 rounded border border-white/10 hover:border-red-400/40 transition-all flex items-center gap-1 cursor-pointer"
                  title="Abmelden"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Abmelden</span>
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenLogin}
                className="bg-white/10 hover:bg-white/20 text-white font-medium text-xs sm:text-sm px-3.5 py-1.5 rounded-lg border border-white/15 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <User className="w-4 h-4 text-[#D4922A]" />
                <span>Anmelden</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
