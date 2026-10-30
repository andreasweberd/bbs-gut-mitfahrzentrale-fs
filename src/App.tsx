import React, { useState, useEffect } from 'react';
import { Eintrag } from './types';
import { Navbar } from './components/Navbar';
import { ListingsView } from './components/ListingsView';
import { AdminView } from './components/AdminView';
import { LoginModal } from './components/LoginModal';
import { NewEntryModal } from './components/NewEntryModal';
import { ContactModal } from './components/ContactModal';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'eintraege' | 'admin'>('eintraege');

  // Auth State
  const [token, setToken] = useState<string>(() => localStorage.getItem('bbs_carpool_token') || '');
  const [isAdmin, setIsAdmin] = useState<boolean>(() => localStorage.getItem('bbs_carpool_is_admin') === 'true');
  const [currentUserId, setCurrentUserId] = useState<number | null>(() => {
    const saved = localStorage.getItem('bbs_carpool_user_id');
    if (saved !== null && saved !== '') return parseInt(saved, 10);
    // Fallback for known demo student tokens if ID wasn't stored previously
    const savedToken = localStorage.getItem('bbs_carpool_token');
    if (savedToken === 'TOKEN-2026-001') return 1;
    if (savedToken === 'TOKEN-2026-002') return 2;
    if (savedToken === 'TOKEN-2026-003') return 3;
    return null;
  });
  const [currentUserName, setCurrentUserName] = useState<string>(() => {
    const saved = localStorage.getItem('bbs_carpool_user_name');
    if (saved) return saved;
    const savedToken = localStorage.getItem('bbs_carpool_token');
    if (savedToken === 'TOKEN-2026-001') return 'Weber';
    if (savedToken === 'TOKEN-2026-002') return 'Müller';
    if (savedToken === 'TOKEN-2026-003') return 'Schmidt';
    return '';
  });
  const [currentUserEmail, setCurrentUserEmail] = useState<string>(() => {
    const saved = localStorage.getItem('bbs_carpool_user_email');
    if (saved) return saved;
    const savedToken = localStorage.getItem('bbs_carpool_token');
    if (savedToken === 'TOKEN-2026-001') return 'senior.weber@gmail.com';
    return '';
  });

  // Filter state lifted so Navbar or Hero can toggle 'meine Einträge'
  const [onlyMineFilter, setOnlyMineFilter] = useState<boolean>(false);

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
  const [toastMessage, setToastMessage] = useState<{ text: string; type?: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
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

  // Verify Session on Load
  useEffect(() => {
    fetchEntries();

    if (token) {
      fetch('/api/v1/me', {
        headers: { 'X-Auth-Token': token },
      })
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error('Session invalid');
        })
        .then((data) => {
          if (data.erfolg) {
            setIsAdmin(Boolean(data.isAdmin));
            if (data.schuelerId !== undefined) {
              setCurrentUserId(data.schuelerId);
              localStorage.setItem('bbs_carpool_user_id', String(data.schuelerId));
            }
            if (data.nachname) {
              setCurrentUserName(data.nachname);
              localStorage.setItem('bbs_carpool_user_name', data.nachname);
            }
            if (data.email) {
              setCurrentUserEmail(data.email);
              localStorage.setItem('bbs_carpool_user_email', data.email);
            }
          }
        })
        .catch(() => {
          // Token expired or invalid
          setToken('');
          setIsAdmin(false);
          setCurrentUserId(null);
          setCurrentUserName('');
          setCurrentUserEmail('');
          localStorage.removeItem('bbs_carpool_token');
          localStorage.removeItem('bbs_carpool_is_admin');
          localStorage.removeItem('bbs_carpool_user_id');
          localStorage.removeItem('bbs_carpool_user_name');
          localStorage.removeItem('bbs_carpool_user_email');
        });
    }
  }, [token]);

  // Handle Login Success
  const handleLoginSuccess = (
    newToken: string,
    newIsAdmin: boolean,
    user?: { id: number; nachname: string; email?: string }
  ) => {
    setToken(newToken);
    setIsAdmin(newIsAdmin);
    localStorage.setItem('bbs_carpool_token', newToken);
    localStorage.setItem('bbs_carpool_is_admin', newIsAdmin ? 'true' : 'false');

    if (user) {
      setCurrentUserId(user.id);
      setCurrentUserName(user.nachname);
      setCurrentUserEmail(user.email || '');
      localStorage.setItem('bbs_carpool_user_id', String(user.id));
      localStorage.setItem('bbs_carpool_user_name', user.nachname);
      if (user.email) localStorage.setItem('bbs_carpool_user_email', user.email);
    }

    showToast(
      newIsAdmin
        ? 'Als Administrator angemeldet!'
        : `Angemeldet als Schüler (${user?.nachname || 'Schüler'})!`
    );
  };

  // Handle Logout
  const handleLogout = () => {
    setToken('');
    setIsAdmin(false);
    setCurrentUserId(null);
    setCurrentUserName('');
    setCurrentUserEmail('');
    setOnlyMineFilter(false);
    localStorage.removeItem('bbs_carpool_token');
    localStorage.removeItem('bbs_carpool_is_admin');
    localStorage.removeItem('bbs_carpool_user_id');
    localStorage.removeItem('bbs_carpool_user_name');
    localStorage.removeItem('bbs_carpool_user_email');
    if (activeTab === 'admin') setActiveTab('eintraege');
    showToast('Erfolgreich abgemeldet.');
  };

  // Handle Delete Entry
  const handleDeleteEntry = async (id: number) => {
    if (!token) {
      showToast('Bitte melde dich an, um deinen Eintrag zu löschen.', 'error');
      return;
    }

    try {
      const res = await fetch(`/api/v1/eintraege/${id}`, {
        method: 'DELETE',
        headers: {
          'X-Auth-Token': token,
        },
      });

      const data = await res.json();
      if (res.ok && data.erfolg) {
        showToast('Eintrag erfolgreich gelöscht!');
        fetchEntries();
      } else {
        showToast(data.fehler || 'Fehler beim Löschen des Eintrags.', 'error');
      }
    } catch (err) {
      console.error('Delete error:', err);
      showToast('Netzwerkfehler beim Löschen des Eintrags.', 'error');
    }
  };

  const myEntriesCount = currentUserId != null
    ? entries.filter((e) => Number(e.schueler_id) === Number(currentUserId)).length
    : 0;

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-[#151E2D] flex flex-col font-sans antialiased selection:bg-[#D4922A] selection:text-white">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isLoggedIn={Boolean(token)}
        isAdmin={isAdmin}
        userName={currentUserName}
        myEntriesCount={myEntriesCount}
        onlyMine={onlyMineFilter}
        onToggleOnlyMine={() => setOnlyMineFilter(!onlyMineFilter)}
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
            currentUserId={currentUserId}
            currentUserName={currentUserName}
            isAdmin={isAdmin}
            onlyMine={onlyMineFilter}
            onToggleOnlyMine={() => setOnlyMineFilter(!onlyMineFilter)}
            onDeleteEntry={handleDeleteEntry}
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
          <div className="flex items-center gap-3">
            <div className="bg-white rounded px-2 py-0.5 shadow-sm">
              <img
                src="/assets/aistudio/grafik_d216798c.png"
                alt="BBS GuT Trier"
                className="h-5 w-auto object-contain"
              />
            </div>
            <span className="font-serif italic text-white font-bold text-sm">
              Mitfahrzentrale
            </span>
            <span className="hidden md:inline">· Berufsbildende Schule Gestaltung und Technik Trier</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 flex-wrap justify-center sm:justify-end">
            <span className="text-slate-400">Sichere &amp; Direkte Schul-Mitfahrgelegenheiten</span>
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
        <div
          className={`fixed bottom-6 right-6 z-50 text-white text-xs font-bold px-4 py-3 rounded-xl shadow-2xl border flex items-center gap-2 animate-in slide-in-from-bottom-5 duration-200 ${
            toastMessage.type === 'error'
              ? 'bg-red-950/95 border-red-500/40 text-red-200'
              : 'bg-[#151E2D] border-white/10 text-white'
          }`}
        >
          {toastMessage.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-[#D4922A] shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}
    </div>
  );
}
