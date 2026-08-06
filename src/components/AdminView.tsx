import React, { useState, useEffect } from 'react';
import { Schueler, Eintrag, SystemStats } from '../types';
import {
  Users,
  FileText,
  BarChart3,
  UserPlus,
  Trash2,
  Power,
  Eye,
  AlertCircle,
  CheckCircle2,
  Search,
  Armchair,
  Car,
  UserCheck,
} from 'lucide-react';

interface AdminViewProps {
  adminToken: string;
  onRefreshAll: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ adminToken, onRefreshAll }) => {
  const [adminTab, setAdminTab] = useState<'nutzer' | 'eintraege' | 'stats'>('nutzer');

  // Users State
  const [users, setUsers] = useState<Schueler[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // New User Form State
  const [newNachname, setNewNachname] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newToken, setNewToken] = useState('');
  const [newStatus, setNewStatus] = useState<'aktiv' | 'inaktiv'>('aktiv');
  const [userErrorMsg, setUserErrorMsg] = useState('');
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  // Admin Entries State
  const [adminEntries, setAdminEntries] = useState<Eintrag[]>([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState(false);
  const [selectedEntryDetails, setSelectedEntryDetails] = useState<Eintrag | null>(null);

  // System Stats
  const [stats, setStats] = useState<SystemStats | null>(null);

  // Fetch Users
  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const res = await fetch('/api/v1/admin/nutzer', {
        headers: { 'X-Auth-Token': adminToken },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Fetch Admin Entries
  const fetchAdminEntries = async () => {
    setIsLoadingEntries(true);
    try {
      const res = await fetch('/api/v1/admin/eintraege', {
        headers: { 'X-Auth-Token': adminToken },
      });
      if (res.ok) {
        const data = await res.json();
        setAdminEntries(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingEntries(false);
    }
  };

  // Fetch Stats
  const fetchStats = async () => {
    try {
      const res = await fetch('/api/v1/admin/stats', {
        headers: { 'X-Auth-Token': adminToken },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchAdminEntries();
    fetchStats();
  }, [adminToken]);

  // Create User Handler
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserErrorMsg('');

    if (!newNachname.trim() || !newEmail.trim() || !newToken.trim()) {
      setUserErrorMsg('Bitte fülle Nachname, E-Mail und Token aus.');
      return;
    }

    setIsCreatingUser(true);

    try {
      const res = await fetch('/api/v1/admin/nutzer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': adminToken,
        },
        body: JSON.stringify({
          nachname: newNachname.trim(),
          email: newEmail.trim(),
          token: newToken.trim(),
          status: newStatus,
        }),
      });

      const data = await res.json();

      if (res.status === 201 && data.erfolg) {
        setNewNachname('');
        setNewEmail('');
        setNewToken('');
        fetchUsers();
        fetchStats();
      } else {
        setUserErrorMsg(data.fehler || 'Fehler beim Erstellen des Nutzers.');
      }
    } catch (err) {
      setUserErrorMsg('Serververbindung fehlgeschlagen.');
    } finally {
      setIsCreatingUser(false);
    }
  };

  // Toggle User Status
  const handleToggleStatus = async (id: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'aktiv' ? 'inaktiv' : 'aktiv';
    try {
      const res = await fetch(`/api/v1/admin/nutzer/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': adminToken,
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (res.ok) {
        fetchUsers();
        fetchStats();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete User
  const handleDeleteUser = async (id: number, name: string) => {
    if (!confirm(`Möchtest du den Nutzer "${name}" und alle seine Einträge wirklich löschen?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/v1/admin/nutzer/${id}`, {
        method: 'DELETE',
        headers: { 'X-Auth-Token': adminToken },
      });

      if (res.ok) {
        fetchUsers();
        fetchAdminEntries();
        fetchStats();
        onRefreshAll();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Entry
  const handleDeleteEntry = async (id: number, title: string) => {
    if (!confirm(`Möchtest du den Eintrag "${title}" wirklich löschen?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/v1/admin/eintraege/${id}`, {
        method: 'DELETE',
        headers: { 'X-Auth-Token': adminToken },
      });

      if (res.ok) {
        fetchAdminEntries();
        fetchStats();
        onRefreshAll();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Admin Title Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#1C7C72] bg-[#1C7C72]/10 px-2.5 py-1 rounded-full">
            Verwaltungsbereich
          </span>
          <h1 className="font-serif italic text-2xl font-bold text-slate-900 mt-1">
            System Administration
          </h1>
          <p className="text-xs text-slate-500">
            Verwalte Schülerkonten, überwache Schwarze-Brett-Einträge und überprüfe Auslastungskennzahlen.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setAdminTab('nutzer')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              adminTab === 'nutzer'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Nutzer ({users.length})</span>
          </button>

          <button
            onClick={() => setAdminTab('eintraege')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              adminTab === 'eintraege'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Einträge ({adminEntries.length})</span>
          </button>

          <button
            onClick={() => setAdminTab('stats')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              adminTab === 'stats'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-[#D4922A]" />
            <span>Statistik</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Nutzerverwaltung */}
      {adminTab === 'nutzer' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* New User Form */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <UserPlus className="w-5 h-5 text-[#1C7C72]" />
              <h3 className="font-serif italic font-bold text-lg text-slate-900">
                Neuen Schüler Anlegen
              </h3>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3">
              {userErrorMsg && (
                <div className="bg-red-50 text-red-700 text-xs rounded-xl p-2.5 border border-red-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{userErrorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Nachname
                </label>
                <input
                  type="text"
                  value={newNachname}
                  onChange={(e) => setNewNachname(e.target.value)}
                  placeholder="Mustermann"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  E-Mail Adresse
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="m.mustermann@bbs-gut.de"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Schüler-Token
                </label>
                <input
                  type="text"
                  value={newToken}
                  onChange={(e) => setNewToken(e.target.value)}
                  placeholder="TOKEN-2026-042"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as 'aktiv' | 'inaktiv')}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
                >
                  <option value="aktiv">aktiv</option>
                  <option value="inaktiv">inaktiv</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isCreatingUser}
                className="w-full bg-[#151E2D] hover:bg-[#243044] text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <span>{isCreatingUser ? 'Erstelle...' : 'Schüler Anlegen →'}</span>
              </button>
            </form>
          </div>

          {/* Users Table */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-serif italic font-bold text-base text-slate-900">
                Registrierte Schülerkonten ({users.length})
              </h3>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3">ID</th>
                    <th className="p-3">Name</th>
                    <th className="p-3">E-Mail</th>
                    <th className="p-3">Token</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Aktionen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-mono text-slate-400">#{u.id}</td>
                      <td className="p-3 font-bold text-slate-900">{u.nachname}</td>
                      <td className="p-3 text-slate-600 font-mono text-[11px]">{u.email}</td>
                      <td className="p-3 font-mono text-[10px] text-slate-400">{u.token}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            u.status === 'aktiv'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-1">
                        <button
                          onClick={() => handleToggleStatus(u.id, u.status)}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            u.status === 'aktiv'
                              ? 'border-slate-200 text-slate-600 hover:bg-slate-100'
                              : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                          title={u.status === 'aktiv' ? 'Deaktivieren' : 'Aktivieren'}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteUser(u.id, u.nachname)}
                          className="p-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                          title="Löschen"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Eintragsverwaltung */}
      {adminTab === 'eintraege' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-serif italic font-bold text-base text-slate-900">
              Schwarze-Brett Einträge Verwaltung ({adminEntries.length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">Typ</th>
                  <th className="p-3">Titel</th>
                  <th className="p-3">Verfasser</th>
                  <th className="p-3">Erstellt</th>
                  <th className="p-3 text-right">Aktionen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {adminEntries.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-mono text-slate-400">#{e.id}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          e.typ === 'Angebot'
                            ? 'bg-[#1C7C72]/15 text-[#1C7C72]'
                            : 'bg-[#D4922A]/15 text-[#D4922A]'
                        }`}
                      >
                        {e.typ}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-slate-900 max-w-xs truncate">{e.titel}</td>
                    <td className="p-3">
                      <div className="font-bold text-slate-800">{e.nachname}</div>
                      <div className="text-[10px] font-mono text-slate-400">{e.email}</div>
                    </td>
                    <td className="p-3 text-slate-500 font-mono text-[11px]">
                      {new Date(e.erstellungsdatum).toLocaleDateString('de-DE')}
                    </td>
                    <td className="p-3 text-right space-x-1">
                      <button
                        onClick={() => setSelectedEntryDetails(e)}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
                        title="Details anzeigen"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteEntry(e.id, e.titel)}
                        className="p-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                        title="Eintrag Löschen"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: System-Statistik */}
      {adminTab === 'stats' && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-serif italic font-bold text-lg text-slate-900">
              System-Kennzahlen
            </h3>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <div className="text-3xl font-black text-[#151E2D] font-mono">{stats.totalUsers}</div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">
                  Schüler Registriert
                </div>
              </div>

              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200/80">
                <div className="text-3xl font-black text-emerald-700 font-mono">{stats.activeUsers}</div>
                <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider mt-1">
                  Aktive Schüler
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <div className="text-3xl font-black text-slate-800 font-mono">{stats.totalEntries}</div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">
                  Gesamt Einträge
                </div>
              </div>

              <div className="bg-amber-50 p-4 rounded-xl border border-amber-200/80">
                <div className="text-3xl font-black text-[#D4922A] font-mono">{stats.totalSeatsOffered}</div>
                <div className="text-xs font-bold text-amber-800 uppercase tracking-wider mt-1">
                  Freie Plätze Geboten
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-serif italic font-bold text-lg text-slate-900">
              Angebote vs. Gesuche
            </h3>

            <div className="space-y-4 pt-2">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-[#1C7C72] flex items-center gap-1">
                    <Car className="w-3.5 h-3.5" /> Angebote ({stats.angeboteCount})
                  </span>
                  <span className="font-mono">
                    {stats.totalEntries > 0
                      ? Math.round((stats.angeboteCount / stats.totalEntries) * 100)
                      : 0}
                    %
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-[#1C7C72] h-full transition-all"
                    style={{
                      width: `${
                        stats.totalEntries > 0
                          ? (stats.angeboteCount / stats.totalEntries) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-[#D4922A] flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5" /> Gesuche ({stats.gesucheCount})
                  </span>
                  <span className="font-mono">
                    {stats.totalEntries > 0
                      ? Math.round((stats.gesucheCount / stats.totalEntries) * 100)
                      : 0}
                    %
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-[#D4922A] h-full transition-all"
                    style={{
                      width: `${
                        stats.totalEntries > 0
                          ? (stats.gesucheCount / stats.totalEntries) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Entry Details Modal */}
      {selectedEntryDetails && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-serif italic font-bold text-lg text-slate-900">
                Eintrag #{selectedEntryDetails.id}
              </h3>
              <button
                onClick={() => setSelectedEntryDetails(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                  Titel
                </span>
                <span className="font-bold text-slate-900 text-sm">{selectedEntryDetails.titel}</span>
              </div>

              <div>
                <span className="font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                  Beschreibung
                </span>
                <p className="text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed whitespace-pre-wrap">
                  {selectedEntryDetails.nachricht}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                <div>
                  <span className="font-bold text-slate-400 uppercase tracking-wider block">Verfasser</span>
                  <span className="font-bold text-slate-800">{selectedEntryDetails.nachname}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-400 uppercase tracking-wider block">E-Mail</span>
                  <span className="font-mono text-slate-600">{selectedEntryDetails.email}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedEntryDetails(null)}
              className="w-full bg-[#151E2D] text-white font-bold py-2 rounded-xl text-xs"
            >
              Schließen
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
