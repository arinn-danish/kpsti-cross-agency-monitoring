import React, { useState, useEffect, useMemo } from 'react';
import { Project, SubmissionLogItem } from '../types';
import { db, collection, query, orderBy, limit, onSnapshot } from '../lib/firebase';
import {
  History,
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
  Eye,
  X,
  Copy,
  Check,
  Code2,
  Filter,
  ArrowRight,
  Database,
  Terminal,
  Activity,
  Calendar,
  AlertCircle,
  FileCode,
  Download,
  Bot,
  Sparkles,
  FileSpreadsheet
} from 'lucide-react';

interface AuditTrailViewProps {
  projects?: Project[];
  onSelectProject?: (project: Project) => void;
  onNavigateToCore?: () => void;
}

export const AuditTrailView: React.FC<AuditTrailViewProps> = ({
  projects = [],
  onSelectProject,
  onNavigateToCore
}) => {
  const [logs, setLogs] = useState<SubmissionLogItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedRecord, setSelectedRecord] = useState<SubmissionLogItem | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [copiedId, setCopiedId] = useState<boolean>(false);
  const [copiedJson, setCopiedJson] = useState<boolean>(false);

  // 1. Subscribe to Firestore /submissions collection, sorted newest first
  useEffect(() => {
    setIsLoading(true);
    const q = query(
      collection(db, 'submissions'),
      orderBy('timestamp', 'desc'),
      limit(150)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: SubmissionLogItem[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();

          // Format readable timestamp
          let formattedTime = 'Baru sahaja';
          let isoDate = data.createdAtIso;

          if (data.timestamp?.toDate) {
            const d = data.timestamp.toDate();
            formattedTime = d.toLocaleString('ms-MY', {
              dateStyle: 'medium',
              timeStyle: 'medium'
            });
            if (!isoDate) isoDate = d.toISOString();
          } else if (data.createdAtIso) {
            formattedTime = new Date(data.createdAtIso).toLocaleString('ms-MY', {
              dateStyle: 'medium',
              timeStyle: 'medium'
            });
          }

          return {
            id: docSnap.id,
            type: data.type || 'CREATE_PROJECT',
            projectId: data.projectId,
            projectTitle: data.projectTitle || 'Inisiatif Tanpa Nama',
            userId: data.userId || 'system',
            userEmail: data.userEmail || null,
            userName: data.userName || 'Pegawai',
            timestamp: formattedTime,
            createdAtIso: isoDate || new Date().toISOString(),
            details: data.details,
            rawDoc: {
              _firestoreId: docSnap.id,
              _collection: 'submissions',
              ...data,
              formattedTimestamp: formattedTime
            }
          };
        });

        // Ensure strictly sorted newest first
        items.sort((a, b) => {
          const timeA = a.createdAtIso ? new Date(a.createdAtIso).getTime() : 0;
          const timeB = b.createdAtIso ? new Date(b.createdAtIso).getTime() : 0;
          return timeB - timeA;
        });

        setLogs(items);
        setIsLoading(false);
      },
      (error) => {
        console.error('Firestore audit subscription error:', error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Filter logs by search and type
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (filterType !== 'ALL' && log.type !== filterType) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = log.projectTitle?.toLowerCase().includes(q);
        const matchId = log.projectId?.toLowerCase().includes(q) || log.id.toLowerCase().includes(q);
        const matchUser =
          log.userName?.toLowerCase().includes(q) || log.userEmail?.toLowerCase().includes(q);
        const matchAgency = log.details?.leadAgency?.toLowerCase().includes(q);
        return Boolean(matchTitle || matchId || matchUser || matchAgency);
      }
      return true;
    });
  }, [logs, filterType, searchQuery]);

  // Generate short summary of input-output cycle
  const generateSummary = (log: SubmissionLogItem): string => {
    switch (log.type) {
      case 'CREATE_PROJECT': {
        const agency = log.details?.leadAgency ? ` di bawah ${log.details.leadAgency}` : '';
        const progress = log.details?.progressPercentage !== undefined ? ` pada tahap ${log.details.progressPercentage}%` : '';
        const status = log.details?.status ? ` [${log.details.status}]` : '';
        return `Kitaran input baharu: Pendaftaran inisiatif "${log.projectTitle}" (${log.projectId || 'ID Baru'})${agency}${status}${progress}. Data disahkan dan disimpan di Firestore.`;
      }
      case 'UPDATE_PROGRESS': {
        const progress = log.details?.progressPercentage !== undefined ? ` ke ${log.details.progressPercentage}%` : '';
        const status = log.details?.status ? ` [Status: ${log.details.status}]` : '';
        const note = log.details?.latestProgressUpdate ? ` Nota kemajuan: "${log.details.latestProgressUpdate}"` : '';
        return `Kitaran kemaskini output: Pelarasan pencapaian inisiatif "${log.projectTitle}" (${log.projectId})${progress}${status}.${note}`;
      }
      case 'INITIALIZE_SAMPLE_DATA': {
        const count = log.details?.count ? `${log.details.count} projek` : 'set data asas';
        return `Kitaran pemuatan sistem: Memulakan penyegerakan ${count} data inisiatif kerajaan ke dalam Firestore.`;
      }
      case 'MANAGE_AGENCY': {
        return `Kitaran pentadbiran: Pengemaskinian senarai kod agensi kerajaan dalam direktori sistem.`;
      }
      case 'DELETE_PROJECT': {
        return `Kitaran pemadaman rekod: Penghapusan data projek daripada pangkalan data Firestore.`;
      }
      case 'GEMINI_ASSISTANT_QUERY': {
        const q = log.details?.question ? ` "${log.details.question.substring(0, 70)}${log.details.question.length > 70 ? '...' : ''}"` : '';
        return `Kitaran interaksi AI: Pertanyaan dihantar ke Gemini Enterprise Agent${q}. Jawapan penstriman berjaya dijana dan diaudit.`;
      }
      default:
        return `Transaksi kitaran ${log.type} berjaya diproses untuk ${log.projectTitle || log.id}.`;
    }
  };

  // Helper for action badges
  const renderActionBadge = (type: string) => {
    switch (type) {
      case 'CHATBOT_QUERY':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-teal-100 text-teal-800 border border-teal-300 shrink-0">
            <Bot className="w-3.5 h-3.5 text-teal-600" />
            <span>AI: CHATBOT KPSTI</span>
          </span>
        );
      case 'EXPORT_CSV':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>OUTPUT: EKSPORT CSV</span>
          </span>
        );
      case 'GEMINI_ASSISTANT_QUERY':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-violet-100 text-violet-800 border border-violet-300 shrink-0">
            <Bot className="w-3.5 h-3.5 text-violet-600" />
            <span>AI: GEMINI ENTERPRISE</span>
          </span>
        );
      case 'CREATE_PROJECT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
            <FolderPlus className="w-3.5 h-3.5" />
            <span>INPUT: DAFTAR PROJEK</span>
          </span>
        );
      case 'UPDATE_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-300 shrink-0">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>OUTPUT: KEMASKINI STATUS</span>
          </span>
        );
      case 'INITIALIZE_SAMPLE_DATA':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300 shrink-0">
            <RotateCw className="w-3.5 h-3.5" />
            <span>SISTEM: DATA SAMPEL</span>
          </span>
        );
      case 'MANAGE_AGENCY':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-300 shrink-0">
            <Building2 className="w-3.5 h-3.5" />
            <span>PENTADBIRAN: AGENSI</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-300 shrink-0">
            <FileText className="w-3.5 h-3.5" />
            <span>{type}</span>
          </span>
        );
    }
  };

  // Copy helper
  const handleCopyText = (text: string, type: 'id' | 'json') => {
    navigator.clipboard.writeText(text);
    if (type === 'id') {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } else {
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    }
  };

  // Export logs to JSON
  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `audit-trail-export-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-fade-in space-y-6">
      
      {/* 1. Header & Live Connection Indicator - Streamlined */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Log Transaksi & Jejak Audit
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500 font-medium">KPSTI Sabah</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <span>Audit Trail</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Firestore Live</span>
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Rekod sejarah setiap kitaran input dan pengemaskinian inisiatif secara kronologi (terkini dahulu) untuk pengauditan dan integriti data.
            </p>
          </div>

          {/* Connection Status Box & Quick Export */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-600 flex items-center gap-2.5">
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-semibold text-slate-700">Koleksi submissions:</span>
              <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 font-bold text-emerald-700">
                {logs.length} entri
              </span>
            </div>

            {logs.length > 0 && (
              <button
                type="button"
                onClick={handleExportJson}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors shadow-2xs cursor-pointer"
                title="Muat turun log jejak audit penuh dalam format JSON"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span>Eksport JSON</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Filter & Search Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari mengikut tajuk, ID projek, ID transaksi, atau pegawai..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
          <button
            type="button"
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1 font-semibold rounded-lg transition-colors cursor-pointer ${
              filterType === 'ALL'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Semua ({logs.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('CREATE_PROJECT')}
            className={`px-3 py-1 font-semibold rounded-lg transition-colors cursor-pointer ${
              filterType === 'CREATE_PROJECT'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pendaftaran (Input)
          </button>
          <button
            type="button"
            onClick={() => setFilterType('UPDATE_PROGRESS')}
            className={`px-3 py-1 font-semibold rounded-lg transition-colors cursor-pointer ${
              filterType === 'UPDATE_PROGRESS'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Kemajuan (Output)
          </button>
          <button
            type="button"
            onClick={() => setFilterType('INITIALIZE_SAMPLE_DATA')}
            className={`px-3 py-1 font-semibold rounded-lg transition-colors cursor-pointer ${
              filterType === 'INITIALIZE_SAMPLE_DATA'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sistem
          </button>
          <button
            type="button"
            onClick={() => setFilterType('GEMINI_ASSISTANT_QUERY')}
            className={`px-3 py-1 font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
              filterType === 'GEMINI_ASSISTANT_QUERY'
                ? 'bg-white text-violet-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bot className="w-3 h-3 text-violet-600" />
            <span>Gemini AI</span>
          </button>
        </div>
      </div>

      {/* 3. Historical Log List / Exact Empty State */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center shadow-xs">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700">Menyegerakkan log audit daripada Cloud Firestore...</p>
          <p className="text-xs text-slate-400 mt-1">Mengambil rekod kitaran input-output terkini.</p>
        </div>
      ) : logs.length === 0 ? (
        /* EXACT REQUIREMENT EMPTY STATE */
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 sm:p-16 text-center shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
            <History className="w-8 h-8 text-emerald-600" />
          </div>
          
          {/* User's Exact Prompt String */}
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">
            No history yet — submit something to see it here.
          </h2>
          
          <p className="text-sm text-slate-500 max-w-md mx-auto mb-6 leading-relaxed">
            Belum ada rekod kitaran transaksi input-output di dalam Firestore. Daftar projek baharu atau kemaskini status inisiatif di Core Interface untuk menjana jejak audit pertama anda.
          </p>

          {onNavigateToCore && (
            <div>
              <button
                type="button"
                onClick={onNavigateToCore}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors shadow-xs cursor-pointer"
              >
                <span>Buka Core Interface & Hantar Inisiatif</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 text-xs shadow-xs">
          Tiada rekod audit yang sepadan dengan carian "{searchQuery}" bagi penapis ini.
          <div className="mt-3">
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setFilterType('ALL');
              }}
              className="text-emerald-700 font-semibold hover:underline cursor-pointer"
            >
              Kosongkan penapis carian
            </button>
          </div>
        </div>
      ) : (
        /* Historical Log of Every Input-Output Cycle (Newest First) */
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>Memaparkan {filteredLogs.length} kitaran input-output (Terkini dahulu)</span>
            <span className="font-mono text-emerald-700 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Integriti Disahkan oleh Firestore Rules</span>
            </span>
          </div>

          {filteredLogs.map((log) => {
            const summaryText = generateSummary(log);

            return (
              <div
                key={log.id}
                className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 p-3.5 sm:p-4 shadow-xs transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                {/* Left Content */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  {/* Top line: Badge, Project ID, Timestamp, Actor, Agency */}
                  <div className="flex flex-wrap items-center gap-2">
                    {renderActionBadge(log.type)}

                    {log.projectId && (
                      <span className="font-mono text-[11px] font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {log.projectId}
                      </span>
                    )}

                    <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{log.timestamp}</span>
                    </div>

                    <span className="text-slate-300 text-xs">•</span>

                    <span className="flex items-center gap-1 text-[11px] text-slate-600">
                      <UserIcon className="w-3 h-3 text-slate-400" />
                      <span>{log.userName || 'Pegawai Sistem'}</span>
                    </span>

                    {log.details?.leadAgency && (
                      <>
                        <span className="text-slate-300 text-xs">•</span>
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200 text-[10px]">
                          {log.details.leadAgency}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Project Title & Short Summary */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate max-w-md">
                      {log.projectTitle}
                    </h3>
                    <span className="hidden sm:inline text-slate-300 text-xs">—</span>
                    <p className="text-xs text-slate-600 truncate max-w-xl">
                      {summaryText}
                    </p>
                  </div>
                </div>

                {/* Right Action: Dedicated "View" Option & Project Link */}
                <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <button
                    type="button"
                    onClick={() => setSelectedRecord(log)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors cursor-pointer"
                    title="Lihat rekod penuh kitaran input-output untuk debugging dan semakan"
                  >
                    <Eye className="w-3.5 h-3.5 text-emerald-400" />
                    <span>View</span>
                  </button>

                  {log.projectId && onSelectProject && (
                    <button
                      type="button"
                      onClick={() => {
                        const targetProj = projects.find((p) => p.id === log.projectId);
                        if (targetProj) onSelectProject(targetProj);
                      }}
                      className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 hover:underline cursor-pointer px-2 py-1.5"
                    >
                      <span>Projek</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Full Record Inspection Modal (Debugging & Review Interface) */}
      {selectedRecord && (
        <div
          id="modal-audit-full-record-backdrop"
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in"
        >
          <div
            id="modal-audit-full-record-container"
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden my-6 max-h-[92vh] flex flex-col"
          >
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-sm">
                  <Terminal className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">
                      Semakan Rekod Penuh Kitaran Input-Output
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-700/60">
                      Audit Debugger
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    ID Transaksi Firestore: <span className="font-mono text-emerald-400">{selectedRecord.id}</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto flex-1 p-6 space-y-6">
              
              {/* Top Overview Card */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {renderActionBadge(selectedRecord.type)}
                    {selectedRecord.projectId && (
                      <span className="font-mono text-xs font-bold text-slate-900 bg-white px-2.5 py-1 rounded border border-slate-200">
                        {selectedRecord.projectId}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{selectedRecord.timestamp}</span>
                  </div>
                </div>

                <h4 className="text-base font-bold text-slate-900">
                  {selectedRecord.projectTitle}
                </h4>

                <div className="text-xs text-slate-600 bg-white rounded-lg p-3 border border-slate-200 leading-relaxed">
                  <strong className="text-slate-800">Ringkasan Audit:</strong> {generateSummary(selectedRecord)}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[11px] text-slate-400 block font-medium">Pengguna / Pegawai</span>
                    <span className="font-bold text-slate-800">{selectedRecord.userName || 'Pegawai'}</span>
                    <span className="font-mono text-[10px] text-slate-500 block truncate">{selectedRecord.userEmail}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[11px] text-slate-400 block font-medium">User ID (Auth UID)</span>
                    <span className="font-mono text-[11px] text-slate-700 truncate block" title={selectedRecord.userId}>
                      {selectedRecord.userId}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[11px] text-slate-400 block font-medium">Lokasi Firestore</span>
                    <span className="font-mono text-[11px] text-emerald-700 font-semibold truncate block">
                      /submissions/{selectedRecord.id}
                    </span>
                  </div>
                </div>
              </div>

              {/* Input-Output Cycle Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Input Parameters */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900 border-b border-slate-100 pb-2">
                    <FileCode className="w-4 h-4 text-emerald-600" />
                    <span>Parameter Input Kitaran (Submitted Fields)</span>
                  </div>

                  {selectedRecord.details ? (
                    <div className="space-y-2 text-xs">
                      {selectedRecord.details.leadAgency && (
                        <div className="flex justify-between py-1 border-b border-slate-50">
                          <span className="text-slate-500">Agensi Peneraju:</span>
                          <span className="font-bold text-slate-800">{selectedRecord.details.leadAgency}</span>
                        </div>
                      )}
                      {selectedRecord.details.participatingAgencies && (
                        <div className="flex justify-between py-1 border-b border-slate-50">
                          <span className="text-slate-500">Agensi Bersama:</span>
                          <span className="font-semibold text-slate-800 text-right max-w-[200px] truncate">
                            {Array.isArray(selectedRecord.details.participatingAgencies)
                              ? selectedRecord.details.participatingAgencies.join(', ')
                              : selectedRecord.details.participatingAgencies}
                          </span>
                        </div>
                      )}
                      {selectedRecord.details.startDate && (
                        <div className="flex justify-between py-1 border-b border-slate-50">
                          <span className="text-slate-500">Tarikh Mula:</span>
                          <span className="font-mono text-slate-800">{selectedRecord.details.startDate}</span>
                        </div>
                      )}
                      {selectedRecord.details.targetCompletionDate && (
                        <div className="flex justify-between py-1 border-b border-slate-50">
                          <span className="text-slate-500">Sasaran Siap:</span>
                          <span className="font-mono text-slate-800">{selectedRecord.details.targetCompletionDate}</span>
                        </div>
                      )}
                      {selectedRecord.details.latestProgressUpdate && (
                        <div className="py-1 border-b border-slate-50">
                          <span className="text-slate-500 block mb-0.5">Catatan Kemajuan Dihantar:</span>
                          <span className="text-slate-800 font-medium block bg-slate-50 p-2 rounded text-[11px]">
                            {selectedRecord.details.latestProgressUpdate}
                          </span>
                        </div>
                      )}
                      {selectedRecord.details.currentIssueBlocker && (
                        <div className="py-1">
                          <span className="text-rose-600 font-medium block mb-0.5">Isu / Halangan Direkodkan:</span>
                          <span className="text-rose-900 block bg-rose-50 p-2 rounded text-[11px] border border-rose-100">
                            {selectedRecord.details.currentIssueBlocker}
                          </span>
                        </div>
                      )}
                      {selectedRecord.details.nextAction && (
                        <div className="py-1">
                          <span className="text-slate-500 block mb-0.5">Tindakan Susulan Dirancang:</span>
                          <span className="text-slate-800 block bg-slate-50 p-2 rounded text-[11px]">
                            {selectedRecord.details.nextAction}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Tiada parameter input tambahan.</p>
                  )}
                </div>

                {/* Output Generated */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900 border-b border-slate-100 pb-2">
                    <Check className="w-4 h-4 text-teal-600" />
                    <span>Hasil Output Kitaran (Generated Result)</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500">Status Terhasil:</span>
                      <span className="font-bold text-slate-800">
                        {selectedRecord.details?.status || 'Active / Saved'}
                      </span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500">Peratusan Kemajuan:</span>
                      <span className="font-bold text-emerald-700">
                        {selectedRecord.details?.progressPercentage !== undefined
                          ? `${selectedRecord.details.progressPercentage}%`
                          : 'Direkodkan'}
                      </span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500">Integriti Pangkalan Data:</span>
                      <span className="font-semibold text-emerald-700 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Tersimpan di Cloud Firestore</span>
                      </span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500">Cap Masa Pelayan (Server):</span>
                      <span className="font-mono text-slate-700">{selectedRecord.timestamp}</span>
                    </div>

                    <div className="pt-2">
                      <span className="text-slate-500 text-[11px] block mb-1">Pautan Projek Aktif:</span>
                      {selectedRecord.projectId ? (
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-800 text-xs">
                            {selectedRecord.projectId}
                          </span>
                          {onSelectProject && (
                            <button
                              type="button"
                              onClick={() => {
                                const p = projects.find((proj) => proj.id === selectedRecord.projectId);
                                if (p) {
                                  setSelectedRecord(null);
                                  onSelectProject(p);
                                }
                              }}
                              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                            >
                              Buka Paparan Perincian Projek →
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Bukan transaksi inisiatif tunggal.</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Technical / Debugging Payload: Full Raw JSON */}
              <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 text-white space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-slate-200">
                      Raw JSON Debugging Payload (Firestore Snapshot)
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopyText(JSON.stringify(selectedRecord.rawDoc || selectedRecord, null, 2), 'json')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
                  >
                    {copiedJson ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>Salin JSON</span>
                      </>
                    )}
                  </button>
                </div>

                <pre className="text-[11px] font-mono text-emerald-300/90 bg-slate-900/90 p-3.5 rounded-lg overflow-x-auto max-h-60 border border-slate-800/80 leading-relaxed">
                  {JSON.stringify(selectedRecord.rawDoc || selectedRecord, null, 2)}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:px-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500 font-mono">
                Document ID: {selectedRecord.id}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyText(selectedRecord.id, 'id')}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  {copiedId ? 'ID Disalin' : 'Salin ID'}
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRecord(null)}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
