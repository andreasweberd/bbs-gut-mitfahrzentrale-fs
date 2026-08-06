import React from 'react';
import { Car, Settings, Plus, LogOut, User } from 'lucide-react';

interface NavbarProps {
  activeTab: 'eintraege' | 'admin';
  setActiveTab: (tab: 'eintraege' | 'admin') => void;
  isLoggedIn: boolean;
  isAdmin: boolean;
  onOpenNewEntry: () => void;
  onOpenLogin: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isLoggedIn,
  isAdmin,
  onOpenNewEntry,
  onOpenLogin,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#151E2D] border-b border-white/10 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('eintraege')}>
          <div className="bg-[#D4922A] text-[#151E2D] text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full font-sans">
            BBS GuT
          </div>
          <span className="font-serif italic font-bold text-lg text-white tracking-tight flex items-center gap-2">
            <Car className="w-5 h-5 text-[#D4922A]" />
            Mitfahrzentrale
          </span>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setActiveTab('eintraege')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'eintraege'
                ? 'bg-white/15 text-white shadow-sm'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <Car className="w-4 h-4" />
            <span>Schwarzes Brett</span>
          </button>

          {isAdmin && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'admin'
                  ? 'bg-white/15 text-white shadow-sm'
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
                <span>+ Eintrag</span>
              </button>

              <div className="hidden sm:flex items-center gap-2 border-l border-white/15 pl-3">
                <span className="bg-white/10 text-white/80 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1">
                  <User className="w-3 h-3 text-[#1C7C72]" />
                  {isAdmin ? 'Admin' : 'Nutzer'}
                </span>
                <button
                  onClick={onLogout}
                  className="text-white/60 hover:text-red-400 text-xs px-2 py-1 rounded border border-white/10 hover:border-red-400/40 transition-all flex items-center gap-1"
                  title="Abmelden"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={onOpenLogin}
              className="bg-white/10 hover:bg-white/20 text-white font-medium text-xs sm:text-sm px-3.5 py-1.5 rounded-lg border border-white/15 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <User className="w-4 h-4 text-[#D4922A]" />
              <span>Anmelden</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
