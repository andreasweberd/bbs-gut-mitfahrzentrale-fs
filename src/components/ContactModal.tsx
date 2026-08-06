import React, { useEffect, useState } from 'react';
import { X, Mail, UserCheck, Copy, Check, ExternalLink, AlertCircle, Loader2 } from 'lucide-react';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  entryId: number | null;
  entryTitle: string;
  token: string;
}

export const ContactModal: React.FC<ContactModalProps> = ({
  isOpen,
  onClose,
  entryId,
  entryTitle,
  token,
}) => {
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [contactData, setContactData] = useState<{ nachname: string; email: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen || !entryId || !token) return;

    setLoading(true);
    setErrorMsg('');
    setContactData(null);

    fetch(`/api/v1/eintraege/${entryId}/kontakt`, {
      method: 'GET',
      headers: { 'X-Auth-Token': token },
    })
      .then(async (res) => {
        if (res.status === 401) {
          throw new Error('Nicht autorisiert. Bitte melde dich erneut an.');
        }
        if (res.status === 404) {
          throw new Error('Eintrag oder Verfasser nicht gefunden.');
        }
        return res.json();
      })
      .then((data) => {
        if (data.fehler) throw new Error(data.fehler);
        setContactData(data);
      })
      .catch((err) => {
        setErrorMsg(err.message || 'Fehler beim Laden der Kontaktdaten.');
      })
      .finally(() => setLoading(false));
  }, [isOpen, entryId, token]);

  if (!isOpen) return null;

  const handleCopyEmail = () => {
    if (!contactData) return;
    navigator.clipboard.writeText(contactData.email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const mailSubject = `Anfrage: ${entryTitle}`;
  const mailBody = `Hallo ${contactData?.nachname || ''},\n\nich habe deinen Eintrag auf dem Schwarzen Brett der BBS GuT gesehen ("${entryTitle}") und hätte Interesse an einer Abstimmung zur Mitfahrt.\n\nViele Grüße!`;
  const mailtoUrl = contactData
    ? `mailto:${encodeURIComponent(contactData.email)}?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(mailBody)}`
    : '#';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#151E2D] p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-[#1C7C72] text-white">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif italic text-xl font-bold">Kontaktdaten</h3>
              <p className="text-xs text-slate-300 truncate max-w-[220px]">Eintrag #{entryId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white bg-white/10 p-1.5 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="py-8 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#1C7C72]" />
              <span className="text-xs font-medium">Lade Kontaktdaten...</span>
            </div>
          ) : errorMsg ? (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-4 flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold mb-1">Zugriffsfehler</p>
                <p>{errorMsg}</p>
              </div>
            </div>
          ) : contactData ? (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-[#1C7C72]" />
                    Verfasser
                  </span>
                  <span className="font-bold text-slate-800 text-sm font-sans">{contactData.nachname}</span>
                </div>

                <div className="flex items-center justify-between pt-0.5">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#D4922A]" />
                    E-Mail Adresse
                  </span>
                  <span className="font-mono text-xs font-semibold text-slate-800 bg-white px-2 py-1 rounded border border-slate-200">
                    {contactData.email}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={handleCopyEmail}
                  className="w-full py-2.5 px-3 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-all flex items-center justify-center gap-1.5"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700">Kopiert!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-500" />
                      <span>E-Mail Kopieren</span>
                    </>
                  )}
                </button>

                <a
                  href={mailtoUrl}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#1C7C72] hover:bg-[#156159] text-white font-bold text-xs transition-all shadow flex items-center justify-center gap-1.5 text-center"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Mail Senden</span>
                </a>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
