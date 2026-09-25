import React, { useState, useEffect } from 'react';
import { db, collection, query, orderBy, limit, onSnapshot } from '../lib/firebase';
import { SubmissionLogItem } from '../types';
import { 
  History, 
  X, 
  Clock, 
  User as UserIcon, 
  FolderPlus, 
  TrendingUp, 
  Building2, 
  FileText,
  Search,
  ExternalLink,
  ShieldCheck,
  RotateCw,
  Bot,
  FileSpreadsheet
} from 'lucide-react';

interface SubmissionsAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProject?: (projectId: string) => void;
}

export const SubmissionsAuditModal: React.FC<SubmissionsAuditModalProps> = ({
  isOpen,
  onClose,
  onSelectProject
}) => {
  const [submissions, setSubmissions] = useState<SubmissionLogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);

    try {
      const q = query(
        collection(db, 'submissions'),
        orderBy('timestamp', 'desc'),
        limit(100)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const list: SubmissionLogItem[] = snapshot.docs.map((doc) => {
            const data = doc.data();
            // Format timestamp nicely
            let formattedDate = 'Baru sahaja';
            if (data.timestamp?.toDate) {
              formattedDate = data.timestamp.toDate().toLocaleString('ms-MY', {
                dateStyle: 'medium',
                timeStyle: 'medium'
              });
            } else if (data.createdAtIso) {
              formattedDate = new Date(data.createdAtIso).toLocaleString('ms-MY', {
                dateStyle: 'medium',
                timeStyle: 'medium'
              });
            }

            return {
              id: doc.id,
              type: data.type,
              projectId: data.projectId,
              projectTitle: data.projectTitle,
              userId: data.userId,
              userEmail: data.userEmail,
              userName: data.userName,
              timestamp: formattedDate,
              createdAtIso: data.createdAtIso,
              details: data.details
            };
          });

          setSubmissions(list);
          setLoading(false);
        },
        (error) => {
          console.error('Error fetching submissions stream:', error);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error('Firestore audit query error:', err);
      setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filtered = submissions.filter((item) => {
    if (filterType !== 'ALL' && item.type !== filterType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = item.projectTitle?.toLowerCase().includes(q);
      const matchUser = item.userEmail?.toLowerCase().includes(q) || item.userName?.toLowerCase().includes(q);
      const matchId = item.projectId?.toLowerCase().includes(q);
      return matchTitle || matchUser || matchId;
    }
    return true;
  });

  const getBadgeForType = (type: string) => {
    switch (type) {
      case 'CHATBOT_QUERY':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-teal-100 text-teal-800 border border-teal-300">
            <Bot className="w-3 h-3 text-teal-600" />
            <span>Chatbot AI KPSTI</span>
          </span>
        );
      case 'EXPORT_CSV':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
            <span>Eksport CSV Eksekutif</span>
          </span>
        );
      case 'GEMINI_ASSISTANT_QUERY':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-violet-100 text-violet-800 border border-violet-300">
            <Bot className="w-3 h-3 text-violet-600" />
            <span>Ejen Gemini Enterprise</span>
          </span>
        );
      case 'CREATE_PROJECT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <FolderPlus className="w-3 h-3" />
            <span>Pendaftaran Projek</span>
          </span>
        );
      case 'UPDATE_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-sky-100 text-sky-800 border border-sky-300">
            <TrendingUp className="w-3 h-3" />
            <span>Kemaskini Kemajuan</span>
          </span>
        );
      case 'MANAGE_AGENCY':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-purple-100 text-purple-800 border border-purple-300">
            <Building2 className="w-3 h-3" />
            <span>Pengurusan Agensi</span>
          </span>
        );
      case 'INITIALIZE_SAMPLE_DATA':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            <RotateCw className="w-3 h-3" />
            <span>Muat Data Sampel</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-800 border border-slate-300">
            <FileText className="w-3 h-3" />
            <span>{type}</span>
          </span>
        );
    }
  };

  return (
    <div
      id="modal-submissions-audit-backdrop"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
    >
      <div
        id="modal-submissions-audit-container"
        className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden my-6 max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-600 text-white shadow-sm">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold">Log Submisi & Jejak Audit (Firestore)</h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-700/60 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Cloud Synchronized
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Setiap submisi dan kemaskini projek disimpan di Firestore bersama cap masa rasmi dan maklumat pengguna.
              </p>
            </div>
          </div>
          <button
            id="btn-close-submissions-audit"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar Filter */}
        <div className="p-4 sm:px-6 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari mengikut tajuk projek, ID, atau emel penyumbang..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Type filters */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs shadow-xs">
            <button
              type="button"
              onClick={() => setFilterType('ALL')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filterType === 'ALL'
                  ? 'bg-slate-900 text-white font-medium shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Semua ({submissions.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('CREATE_PROJECT')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filterType === 'CREATE_PROJECT'
                  ? 'bg-slate-900 text-white font-medium shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Pendaftaran
            </button>
            <button
              type="button"
              onClick={() => setFilterType('UPDATE_PROGRESS')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filterType === 'UPDATE_PROGRESS'
                  ? 'bg-slate-900 text-white font-medium shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Kemajuan
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-3">
          {loading ? (
            <div className="py-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
              <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs">Memuatkan rekod submisi Firestore...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              Tiada rekod submisi dijumpai. Sebarang tindakan pendaftaran projek atau kemaskini kemajuan baharu akan terpapar di sini secara automatik.
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors shadow-xs space-y-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {getBadgeForType(item.type)}
                    {item.projectId && (
                      <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {item.projectId}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{item.timestamp}</span>
                  </div>
                </div>

                {item.projectTitle && (
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-bold text-slate-900">
                      {item.projectTitle}
                    </h4>
                    {item.projectId && onSelectProject && (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectProject(item.projectId!);
                          onClose();
                        }}
                        className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 shrink-0 hover:underline"
                      >
                        <span>Lihat Projek</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}

                {item.details && (
                  <div className="text-xs text-slate-600 bg-slate-50 rounded-lg p-2.5 border border-slate-100 space-y-1">
                    {item.details.leadAgency && (
                      <p>
                        <strong className="text-slate-700">Agensi Peneraju:</strong> {item.details.leadAgency}
                      </p>
                    )}
                    {item.details.progressPercentage !== undefined && (
                      <p>
                        <strong className="text-slate-700">Kemajuan:</strong> {item.details.progressPercentage}%
                        {item.details.status && ` • Status: ${item.details.status}`}
                      </p>
                    )}
                    {item.details.latestProgressUpdate && (
                      <p className="line-clamp-2">
                        <strong className="text-slate-700">Nota:</strong> {item.details.latestProgressUpdate}
                      </p>
                    )}
                    {item.details.currentIssueBlocker && (
                      <p className="text-rose-700 line-clamp-1">
                        <strong className="text-rose-800">Isu:</strong> {item.details.currentIssueBlocker}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500 border-t border-slate-100">
                  <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    Disumbangkan oleh: <strong className="text-slate-700">{item.userName || 'Pengguna'}</strong> ({item.userEmail || item.userId})
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:px-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500">
            Menunjukkan {filtered.length} rekod submisi terkini
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
