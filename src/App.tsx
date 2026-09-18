import React, { useState, useEffect } from 'react';
import { Eintrag } from './types';
import { Navbar } from './components/Navbar';
import { ListingsView } from './components/ListingsView';
import { AdminView } from './components/AdminView';
import { LoginModal } from './components/LoginModal';
import { NewEntryModal } from './components/NewEntryModal';
import { ContactModal } from './components/ContactModal';
import { CheckCircle2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'eintraege' | 'admin'>('eintraege');

  // Auth State
  const [token, setToken] = useState<string>(() => localStorage.getItem('bbs_carpool_token') || '');
  const [isAdmin, setIsAdmin] = useState<boolean>(() => localStorage.getItem('bbs_carpool_is_admin') === 'true');

  // Modals
  const [isLoginOpen, setIsLoginOpen] = useState<boolean>(false);
  const [isNewEntryOpen, setIsNewEntryOpen] = useState<boolean>(false);
  const [contactModal, setContactModal] = useState<{ isOpen: boolean; id: number | null; title: string }>({
    isOpen: false,
    id: null,
    title: '',
  });

  // Listings Data
  const [entries, setEntries] = useState<Eintrag[]>([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState<boolean>(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch Listings
  const fetchEntries = async () => {
    setIsLoadingEntries(true);
    try {
      const res = await fetch('/api/v1/eintraege');
      if (res.ok) {
        const data = await res.json();
        setEntries(data);
      }
    } catch (err) {
      console.error('Error fetching entries:', err);
    } finally {
      setIsLoadingEntries(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  // Handle Login Success
  const handleLoginSuccess = (newToken: string, newIsAdmin: boolean) => {
    setToken(newToken);
    setIsAdmin(newIsAdmin);
    localStorage.setItem('bbs_carpool_token', newToken);
    localStorage.setItem('bbs_carpool_is_admin', newIsAdmin ? 'true' : 'false');
    showToast(newIsAdmin ? 'Als Administrator angemeldet!' : 'Erfolgreich angemeldet!');
  };

  // Handle Logout
  const handleLogout = () => {
    setToken('');
    setIsAdmin(false);
    localStorage.removeItem('bbs_carpool_token');
    localStorage.removeItem('bbs_carpool_is_admin');
    if (activeTab === 'admin') setActiveTab('eintraege');
    showToast('Erfolgreich abgemeldet.');
  };

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-[#151E2D] flex flex-col font-sans antialiased selection:bg-[#D4922A] selection:text-white">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isLoggedIn={Boolean(token)}
        isAdmin={isAdmin}
        onOpenNewEntry={() => setIsNewEntryOpen(true)}
        onOpenLogin={() => setIsLoginOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {activeTab === 'eintraege' && (
          <ListingsView
            entries={entries}
            isLoading={isLoadingEntries}
            onRefresh={fetchEntries}
            onShowContact={(id, title) => setContactModal({ isOpen: true, id, title })}
            isLoggedIn={Boolean(token)}
            onOpenLogin={() => setIsLoginOpen(true)}
            onOpenNewEntry={() => setIsNewEntryOpen(true)}
          />
        )}

        {activeTab === 'admin' && isAdmin && (
          <AdminView adminToken={token} onRefreshAll={fetchEntries} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#151E2D] border-t border-white/10 text-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="bg-[#D4922A] text-[#151E2D] font-bold text-[10px] px-2 py-0.5 rounded">
              BBS GuT
            </span>
            <span className="font-serif italic text-white font-bold text-sm">
              Mitfahrzentrale
            </span>
            <span>· Berufsbildende Schule Gestaltung und Technik</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 flex-wrap justify-center sm:justify-end">
            <span className="text-slate-400">Sichere & Direkte Schul-Mitfahrgelegenheiten</span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <span className="text-slate-400 italic">Based on work of Felix Schick</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        adminToken="Wulli"
      />

      <NewEntryModal
        isOpen={isNewEntryOpen}
        onClose={() => setIsNewEntryOpen(false)}
        token={token}
        onEntryCreated={() => {
          fetchEntries();
          showToast('Eintrag erfolgreich veröffentlicht!');
        }}
      />

      <ContactModal
        isOpen={contactModal.isOpen}
        onClose={() => setContactModal({ isOpen: false, id: null, title: '' })}
        entryId={contactModal.id}
        entryTitle={contactModal.title}
        token={token}
      />

      {/* Toast Popup */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#151E2D] text-white text-xs font-bold px-4 py-3 rounded-xl shadow-2xl border border-white/10 flex items-center gap-2 animate-in slide-in-from-bottom-5 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#D4922A]" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
