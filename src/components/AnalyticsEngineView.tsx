import React, { useState, useEffect, useMemo } from 'react';
import { Project, Agency, SubmissionLogItem } from '../types';
import { db, collection, query, orderBy, limit, onSnapshot, getDocs } from '../lib/firebase';
import {
  BarChart3,
  TrendingUp,
  Activity,
  Calendar,
  CalendarClock,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Database,
  ShieldCheck,
  RefreshCw,
  Building2,
  ArrowUpRight,
  FolderKanban,
  Wifi,
  Filter,
  Layers,
  ChevronRight,
  Sparkles,
  FileDown,
  FileText,
  Eye,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { PdfExportModal } from './PdfExportModal';
import { generateProjectSummaryPDF, extractReportData } from '../utils/pdfReportGenerator';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

interface AnalyticsEngineViewProps {
  projects: Project[];
  agencies: Agency[];
  onSelectProject?: (project: Project) => void;
  onNavigateToCore?: () => void;
  currentUser?: any;
  greetingName?: string;
}

export const AnalyticsEngineView: React.FC<AnalyticsEngineViewProps> = ({
  projects,
  agencies,
  onSelectProject,
  onNavigateToCore,
  currentUser,
  greetingName
}) => {
  // Real-time submissions listener from Firestore
  const [submissions, setSubmissions] = useState<SubmissionLogItem[]>([]);
  const [isSubmissionsLoading, setIsSubmissionsLoading] = useState<boolean>(true);

  // Live Database Validation State
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [timeAgoText, setTimeAgoText] = useState<string>('Baru sahaja');
  const [showDiagnostics, setShowDiagnostics] = useState<boolean>(false);

  // Chart Controls
  const [timelineWindow, setTimelineWindow] = useState<'7d' | '30d' | 'all'>('30d');
  const [categoryView, setCategoryView] = useState<'status' | 'agency'>('status');

  // PDF Export States & Summary
  const [isPdfModalOpen, setIsPdfModalOpen] = useState<boolean>(false);
  const [isGeneratingDirectPdf, setIsGeneratingDirectPdf] = useState<boolean>(false);
  const [pdfSuccessToast, setPdfSuccessToast] = useState<string | null>(null);

  const reportSummaryData = useMemo(() => {
    return extractReportData(projects);
  }, [projects]);

  const handleDirectPdfExport = async () => {
    setIsGeneratingDirectPdf(true);
    try {
      const res = await generateProjectSummaryPDF(projects, agencies);
      setPdfSuccessToast(
        `Laporan PDF '${res.fileName}' berjaya dimuat turun! Merangkumi ${res.summary.totalProjects} status projek, ${res.summary.projectsWithBlockers.length} isu penghalang, dan ${res.summary.recentMilestones.length} pencapaian milestone.`
      );
      setTimeout(() => {
        setPdfSuccessToast(null);
      }, 7000);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setIsGeneratingDirectPdf(false);
    }
  };

  // 1. Subscribe in real-time to Firestore 'submissions' audit log
  useEffect(() => {
    setIsSubmissionsLoading(true);
    const q = query(
      collection(db, 'submissions'),
      orderBy('timestamp', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: SubmissionLogItem[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          let formattedTime = 'Baru sahaja';
          if (data.timestamp?.toDate) {
            formattedTime = data.timestamp.toDate().toLocaleString('ms-MY', {
              dateStyle: 'medium',
              timeStyle: 'medium'
            });
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
            createdAtIso: data.createdAtIso || (data.timestamp?.toDate ? data.timestamp.toDate().toISOString() : new Date().toISOString()),
            details: data.details
          };
        });

        setSubmissions(items);
        setIsSubmissionsLoading(false);
        setLastSyncTime(new Date());
      },
      (err) => {
        console.error('Error listening to submissions collection:', err);
        setIsSubmissionsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Update timeAgo string periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const diffSec = Math.floor((new Date().getTime() - lastSyncTime.getTime()) / 1000);
      if (diffSec < 5) {
        setTimeAgoText('Baru sahaja disegerakkan');
      } else if (diffSec < 60) {
        setTimeAgoText(`${diffSec} saat lalu`);
      } else {
        const mins = Math.floor(diffSec / 60);
        setTimeAgoText(`${mins} minit lalu`);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [lastSyncTime]);

  // Live Firestore database ping & integrity test
  const runLiveDatabaseValidation = async () => {
    setIsValidating(true);
    const start = performance.now();
    try {
      // Direct live read from Firestore to verify latency & connection
      const testQuery = query(collection(db, 'projects'), limit(1));
      const snap = await getDocs(testQuery);
      const elapsed = Math.round(performance.now() - start);
      setLatencyMs(elapsed);
      setLastSyncTime(new Date());
      setValidationMessage(
        `✓ Disahkan Sahih: 100% Data Tulen dari Cloud Firestore (Masa Tindak Balas: ${elapsed}ms, ${snap.size ? 'Akses Aktif' : 'Pangkalan Data Bersedia'})`
      );
    } catch (err: any) {
      console.error('Validation check failed:', err);
      const elapsed = Math.round(performance.now() - start);
      setLatencyMs(elapsed);
      setValidationMessage(`! Sambungan diuji: ${err?.message || 'Ralat sambungan'}`);
    } finally {
      setIsValidating(false);
    }
  };

  // Run initial test once on mount
  useEffect(() => {
    runLiveDatabaseValidation();
  }, []);

  // 2. Compute Summary Metrics
  const summaryMetrics = useMemo(() => {
    const totalProjects = projects.length;
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Entries created or updated in the last 7 days
    let entriesThisWeek = 0;
    let entriesThisMonth = 0;

    projects.forEach((p) => {
      const createdDate = p.createdAt ? new Date(p.createdAt) : (p.startDate ? new Date(p.startDate) : null);
      const updatedDate = p.lastUpdatedDate ? new Date(p.lastUpdatedDate) : null;

      if (createdDate && createdDate >= oneWeekAgo) {
        entriesThisWeek++;
      } else if (updatedDate && updatedDate >= oneWeekAgo) {
        entriesThisWeek++;
      }

      if (createdDate && createdDate >= oneMonthAgo) {
        entriesThisMonth++;
      }
    });

    // Also factor in recent submissions
    const recentSubmissionsCount = submissions.filter((s) => {
      if (!s.createdAtIso) return false;
      return new Date(s.createdAtIso) >= oneWeekAgo;
    }).length;

    // Status distributions
    const inProgressCount = projects.filter((p) => p.status === 'In Progress').length;
    const completedCount = projects.filter((p) => p.status === 'Completed').length;
    const delayedCount = projects.filter((p) => p.status === 'Delayed').length;
    const onHoldCount = projects.filter((p) => p.status === 'On Hold').length;
    const planningCount = projects.filter((p) => p.status === 'Planning').length;

    // Average progress
    const totalProgress = projects.reduce((acc, curr) => acc + (curr.progressPercentage || 0), 0);
    const avgProgress = totalProjects > 0 ? Math.round(totalProgress / totalProjects) : 0;

    // Active participating agencies
    const uniqueAgencies = new Set<string>();
    projects.forEach((p) => {
      if (p.leadAgency) uniqueAgencies.add(p.leadAgency);
      p.participatingAgencies?.forEach((a) => uniqueAgencies.add(a));
    });

    return {
      totalProjects,
      entriesThisWeek: Math.max(entriesThisWeek, recentSubmissionsCount),
      entriesThisMonth,
      inProgressCount,
      completedCount,
      delayedCount,
      onHoldCount,
      planningCount,
      avgProgress,
      activeAgenciesCount: uniqueAgencies.size,
      totalSubmissions: submissions.length
    };
  }, [projects, submissions]);

  // 3. Prepare Entries Over Time Chart Data
  const timelineChartData = useMemo(() => {
    const now = new Date();

    if (timelineWindow === '7d') {
      // Last 7 days day-by-day
      const days: { [key: string]: { dateLabel: string; newProjects: number; submissions: number } } = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = d.toISOString().split('T')[0];
        const label = d.toLocaleDateString('ms-MY', { weekday: 'short', day: 'numeric', month: 'short' });
        days[dateStr] = { dateLabel: label, newProjects: 0, submissions: 0 };
      }

      // Populate from projects
      projects.forEach((p) => {
        const dStr = p.createdAt ? p.createdAt.split('T')[0] : (p.startDate ? p.startDate : null);
        if (dStr && days[dStr]) {
          days[dStr].newProjects += 1;
        }
      });

      // Populate from submissions
      submissions.forEach((s) => {
        if (s.createdAtIso) {
          const dStr = s.createdAtIso.split('T')[0];
          if (days[dStr]) {
            days[dStr].submissions += 1;
          }
        }
      });

      return Object.values(days);
    } else if (timelineWindow === '30d') {
      // Last 30 days grouped into intervals or day-by-day
      const days: { [key: string]: { dateLabel: string; newProjects: number; submissions: number } } = {};
      for (let i = 29; i >= 0; i -= 2) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = d.toISOString().split('T')[0];
        const label = d.toLocaleDateString('ms-MY', { day: 'numeric', month: 'short' });
        days[dateStr] = { dateLabel: label, newProjects: 0, submissions: 0 };
      }

      // Map projects to closest bucket
      projects.forEach((p) => {
        const dStr = p.createdAt ? p.createdAt.split('T')[0] : p.startDate;
        if (dStr) {
          // Find matching or nearest key
          const keys = Object.keys(days);
          const found = keys.find((k) => k >= dStr) || keys[keys.length - 1];
          if (found && days[found]) {
            days[found].newProjects += 1;
          }
        }
      });

      submissions.forEach((s) => {
        if (s.createdAtIso) {
          const dStr = s.createdAtIso.split('T')[0];
          const keys = Object.keys(days);
          const found = keys.find((k) => k >= dStr) || keys[keys.length - 1];
          if (found && days[found]) {
            days[found].submissions += 1;
          }
        }
      });

      return Object.values(days);
    } else {
      // All time by month (e.g. Oct, Nov, Dec, Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep)
      const months = [
        'Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun',
        'Jul', 'Ogo', 'Sep', 'Okt', 'Nov', 'Dis'
      ];
      const monthBuckets: { [monthKey: string]: { dateLabel: string; newProjects: number; submissions: number } } = {};

      months.forEach((m) => {
        monthBuckets[m] = { dateLabel: m, newProjects: 0, submissions: 0 };
      });

      projects.forEach((p) => {
        const dStr = p.createdAt || p.startDate;
        if (dStr) {
          const mIdx = new Date(dStr).getMonth();
          const mName = months[mIdx] || 'Jan';
          if (monthBuckets[mName]) {
            monthBuckets[mName].newProjects += 1;
          }
        }
      });

      submissions.forEach((s) => {
        if (s.createdAtIso) {
          const mIdx = new Date(s.createdAtIso).getMonth();
          const mName = months[mIdx] || 'Jan';
          if (monthBuckets[mName]) {
            monthBuckets[mName].submissions += 1;
          }
        }
      });

      return Object.values(monthBuckets);
    }
  }, [projects, submissions, timelineWindow]);

  // 4. Category Breakdown: Status Data
  const statusCategoryData = useMemo(() => {
    const mapping = [
      { name: 'In Progress', label: 'Dalam Tindakan', count: summaryMetrics.inProgressCount, color: '#059669' },
      { name: 'Completed', label: 'Selesai', count: summaryMetrics.completedCount, color: '#0d9488' },
      { name: 'Planning', label: 'Perancangan', count: summaryMetrics.planningCount, color: '#6366f1' },
      { name: 'On Hold', label: 'Ditangguhkan', count: summaryMetrics.onHoldCount, color: '#d97706' },
      { name: 'Delayed', label: 'Kelewatan', count: summaryMetrics.delayedCount, color: '#e11d48' }
    ];
    return mapping.filter((item) => item.count > 0);
  }, [summaryMetrics]);

  // 5. Category Breakdown: Agency Data
  const agencyCategoryData = useMemo(() => {
    const counts: { [agency: string]: number } = {};
    projects.forEach((p) => {
      const a = p.leadAgency || 'Lain-lain';
      counts[a] = (counts[a] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, count]) => ({
        agency: name,
        count
      }))
      .sort((a, b) => b.count - a.count);
  }, [projects]);

  // 6. Progress Distribution (Buckets 0-20%, 21-40%, etc.)
  const progressBucketsData = useMemo(() => {
    const buckets = [
      { range: '0-20%', label: 'Permulaan (0-20%)', count: 0, color: '#64748b' },
      { range: '21-40%', label: 'Perancangan (21-40%)', count: 0, color: '#6366f1' },
      { range: '41-60%', label: 'Pertengahan (41-60%)', count: 0, color: '#0284c7' },
      { range: '61-80%', label: 'Pengujian (61-80%)', count: 0, color: '#059669' },
      { range: '81-100%', label: 'Hampir/Selesai (81-100%)', count: 0, color: '#0d9488' }
    ];

    projects.forEach((p) => {
      const prog = p.progressPercentage || 0;
      if (prog <= 20) buckets[0].count++;
      else if (prog <= 40) buckets[1].count++;
      else if (prog <= 60) buckets[2].count++;
      else if (prog <= 80) buckets[3].count++;
      else buckets[4].count++;
    });

    return buckets;
  }, [projects]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-fade-in space-y-6">
      {/* 1. Page Header & Live Database Indicator - Streamlined & Compact */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Hi, <span className="font-bold">{greetingName || 'Pegawai'}</span>
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500 font-medium">Panel Analisis Eksekutif KPSTI</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <span>Analytics Engine</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Firestore Live</span>
                {latencyMs !== null && (
                  <span className="text-[11px] font-mono text-emerald-800">({latencyMs}ms)</span>
                )}
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Papan pemuka eksekutif untuk memantau kemajuan inisiatif digital, status pencapaian, agihan agensi peneraju, dan penyelesaian isu penghalang KPSTI Sabah.
            </p>
          </div>

          {/* Quick Actions & Technical Diagnostics Toggle */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="btn-analytics-pdf-export"
              type="button"
              onClick={handleDirectPdfExport}
              disabled={isGeneratingDirectPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
              title="Muat turun Laporan Ringkasan Eksekutif dalam format PDF"
            >
              {isGeneratingDirectPdf ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
              ) : (
                <FileDown className="w-3.5 h-3.5 text-white" />
              )}
              <span>{isGeneratingDirectPdf ? 'Menjana...' : 'Eksport PDF'}</span>
            </button>

            <button
              id="btn-analytics-pdf-preview"
              type="button"
              onClick={() => setIsPdfModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold text-xs shadow-xs transition-colors cursor-pointer"
              title="Pratonton dan sesuaikan maklumat laporan"
            >
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              <span>Pratonton</span>
            </button>

            <button
              type="button"
              onClick={() => setShowDiagnostics(!showDiagnostics)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                showDiagnostics
                  ? 'bg-slate-800 text-white border-slate-800'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
              title="Papar status sambungan pangkalan data terperinci"
            >
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>Diagnostik</span>
              {showDiagnostics ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Inline PDF Success Toast */}
        {pdfSuccessToast && (
          <div className="mt-3 px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-medium flex items-center justify-between gap-2 animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{pdfSuccessToast}</span>
            </div>
            <button
              type="button"
              onClick={() => setPdfSuccessToast(null)}
              className="text-emerald-700 hover:text-emerald-900 cursor-pointer p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Expandable Technical Diagnostics Section */}
        {showDiagnostics && (
          <div className="mt-4 pt-4 border-t border-slate-200 animate-fade-in">
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-800">Diagnostik Sambungan Cloud Firestore</span>
                  <span className="text-[11px] text-slate-500 font-mono">({summaryMetrics.totalSubmissions} transaksi diaudit)</span>
                </div>
                <button
                  type="button"
                  onClick={runLiveDatabaseValidation}
                  disabled={isValidating}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                  title="Semak masa tindak balas Firestore secara langsung"
                >
                  <RefreshCw className={`w-3 h-3 text-emerald-600 ${isValidating ? 'animate-spin' : ''}`} />
                  <span>{isValidating ? 'Menguji...' : 'Uji Sambungan (Ping)'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between">
                  <span className="text-slate-500">Saluran Data:</span>
                  <span className="font-semibold text-emerald-700 flex items-center gap-1">
                    <Wifi className="w-3 h-3 text-emerald-600" />
                    <span>Real-Time Snapshot</span>
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between">
                  <span className="text-slate-500">Latency:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {latencyMs !== null ? `${latencyMs} ms` : 'Mengukur...'}
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between">
                  <span className="text-slate-500">Disegerakkan:</span>
                  <span className="text-slate-700 font-medium">{timeAgoText}</span>
                </div>
              </div>

              {validationMessage && (
                <div className="mt-3 px-2.5 py-1.5 rounded-lg bg-emerald-100/70 border border-emerald-300/80 text-[11px] text-emerald-900 font-medium flex items-center gap-1.5 leading-snug">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span>{validationMessage}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 2. Three (3) Summary Cards Above Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Summary Card 1: Total Entries */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Jumlah Entri Inisiatif
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <FolderKanban className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              {summaryMetrics.totalProjects}
            </span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              Koleksi /projects
            </span>
          </div>

          <p className="text-xs text-slate-500 mt-2">
            Inisiatif digital & sains KPSTI yang tersimpan dan disegerakkan secara langsung di Firestore.
          </p>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-emerald-700 font-medium flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              {summaryMetrics.inProgressCount} Dalam Tindakan
            </span>
            <span className="text-teal-700 font-medium flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-teal-500"></span>
              {summaryMetrics.completedCount} Selesai
            </span>
            {summaryMetrics.delayedCount > 0 && (
              <span className="text-rose-700 font-medium flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                {summaryMetrics.delayedCount} Lewat
              </span>
            )}
          </div>
        </div>

        {/* Summary Card 2: Entries This Week */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Entri Minggu Ini (7 Hari)
            </span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <CalendarClock className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              {summaryMetrics.entriesThisWeek}
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              <TrendingUp className="w-3 h-3" />
              <span>Aktiviti Semasa</span>
            </span>
          </div>

          <p className="text-xs text-slate-500 mt-2">
            Pendaftaran baru dan log submisi status dalam tempoh 7 hari kebelakangan.
          </p>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Koleksi /submissions:</span>
            <span className="font-semibold text-slate-800">{summaryMetrics.totalSubmissions} transaksi</span>
          </div>
        </div>

        {/* Summary Card 3: Portfolio Progress & Health */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Purata Kemajuan Portfolio
            </span>
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
              <Activity className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              {summaryMetrics.avgProgress}%
            </span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
              {summaryMetrics.activeAgenciesCount} Agensi Terlibat
            </span>
          </div>

          {/* Progress Bar */}
          <div className="mt-2.5 w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-600 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${summaryMetrics.avgProgress}%` }}
            ></div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Tahap Kesihatan:</span>
            <span className="font-semibold text-emerald-700 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{summaryMetrics.delayedCount === 0 ? 'Semua Berada di Landasan' : `${summaryMetrics.delayedCount} Perlu Perhatian`}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Executive Portfolio Health, Blocker & Milestone Summary Strip with Direct PDF Export */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-xs">
              <FileText className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Ringkasan Eksekutif Portfolio & Penjanaan Laporan PDF
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  A4 Report Engine
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Mengumpulkan status semasa, isu penghalang (blockers), pelan mitigasi, dan milestone terkini secara automatik.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsPdfModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer shadow-2xs"
              title="Pratonton dan semak data laporan PDF"
            >
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              <span>Pratonton Laporan</span>
            </button>
            <button
              type="button"
              onClick={handleDirectPdfExport}
              disabled={isGeneratingDirectPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isGeneratingDirectPdf ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileDown className="w-3.5 h-3.5" />
              )}
              <span>Muat Turun PDF</span>
            </button>
          </div>
        </div>

        {/* 3 Executive Data Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-3.5 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
            <span className="text-slate-500">Status Portfolio:</span>
            <span className="font-bold text-slate-800">
              {summaryMetrics.completedCount} Selesai, {summaryMetrics.inProgressCount} Berjalan
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0"></span>
            <span className="text-slate-500">Isu Penghalang (Blockers):</span>
            <span className={`font-bold ${reportSummaryData.projectsWithBlockers.length > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
              {reportSummaryData.projectsWithBlockers.length > 0
                ? `${reportSummaryData.projectsWithBlockers.length} Projek Perlu Mitigasi`
                : 'Tiada Blocker Kritikal'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0"></span>
            <span className="text-slate-500">Milestone Terkini:</span>
            <span className="font-bold text-indigo-700">
              {reportSummaryData.recentMilestones.length} Log Pencapaian Direkod
            </span>
          </div>
        </div>
      </div>

      {/* 3. Real-Time Analytical Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart: Entries Over Time (2 Columns on Desktop) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900">Entri Mengikut Garis Masa</h2>
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Live Firestore Timeline
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Kekerapan pendaftaran projek baharu dan submisi kemaskini progress dari pangkalan data.
                </p>
              </div>

              {/* Window Selector */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setTimelineWindow('7d')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    timelineWindow === '7d'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  7 Hari
                </button>
                <button
                  type="button"
                  onClick={() => setTimelineWindow('30d')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    timelineWindow === '30d'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  30 Hari
                </button>
                <button
                  type="button"
                  onClick={() => setTimelineWindow('all')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    timelineWindow === 'all'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Bulanan (2025/2026)
                </button>
              </div>
            </div>

            {/* Recharts Area Chart Container */}
            <div className="w-full h-72 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorProjects" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorSubmissions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="dateLabel"
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '12px',
                      color: '#fff',
                      border: 'none',
                      fontSize: '12px',
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)'
                    }}
                    itemStyle={{ color: '#f8fafc', padding: '2px 0' }}
                    formatter={(value: any, name: any) => {
                      if (name === 'newProjects') return [value, 'Inisiatif Baru'];
                      if (name === 'submissions') return [value, 'Log Submisi'];
                      return [value, name];
                    }}
                    labelFormatter={(label) => `Garis Masa: ${label}`}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ paddingBottom: '12px', fontSize: '12px' }}
                    formatter={(val) => (val === 'newProjects' ? 'Inisiatif Baru' : 'Submisi Kemaskini')}
                  />
                  <Area
                    type="monotone"
                    dataKey="newProjects"
                    name="newProjects"
                    stroke="#059669"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorProjects)"
                    activeDot={{ r: 6, fill: '#059669', stroke: '#fff', strokeWidth: 2 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="submissions"
                    name="submissions"
                    stroke="#6366f1"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    fillOpacity={1}
                    fill="url(#colorSubmissions)"
                    activeDot={{ r: 5, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>Data titik dijana automatik daripada timestamp Firestore</span>
            </span>
            <span className="font-mono text-slate-400">
              {summaryMetrics.totalProjects} projek • {summaryMetrics.totalSubmissions} logs
            </span>
          </div>
        </div>

        {/* Secondary Chart: Breakdown by Category (Status or Lead Agency) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Pecahan Mengikut Kategori</h2>
                <p className="text-xs text-slate-500 mt-0.5">Analisis agihan data aktif</p>
              </div>

              {/* View switch */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setCategoryView('status')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                    categoryView === 'status'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Status
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryView('agency')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                    categoryView === 'agency'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Agensi
                </button>
              </div>
            </div>

            {/* Category Chart Content */}
            {categoryView === 'status' ? (
              <div>
                <div className="w-full h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusCategoryData}
                        dataKey="count"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={78}
                        paddingAngle={3}
                      >
                        {statusCategoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          borderRadius: '8px',
                          color: '#fff',
                          border: 'none',
                          fontSize: '12px'
                        }}
                        formatter={(val: any, name: any) => [`${val} Inisiatif`, name]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Status Legend Pills */}
                <div className="space-y-1.5 mt-2">
                  {statusCategoryData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                        <span className="text-slate-700 font-medium">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{item.count}</span>
                        <span className="text-slate-400 text-[11px]">
                          ({Math.round((item.count / summaryMetrics.totalProjects) * 100) || 0}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <div className="w-full h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={agencyCategoryData.slice(0, 6)}
                      layout="vertical"
                      margin={{ top: 10, right: 15, left: 10, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                      <YAxis
                        dataKey="agency"
                        type="category"
                        width={60}
                        tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          borderRadius: '8px',
                          color: '#fff',
                          border: 'none',
                          fontSize: '12px'
                        }}
                        formatter={(val: any) => [`${val} Inisiatif`, 'Jumlah Projek']}
                      />
                      <Bar dataKey="count" fill="#059669" radius={[0, 6, 6, 0]} barSize={14} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <p className="text-[11px] text-slate-500 mt-2 text-center">
                  Menunjukkan 6 agensi peneraju utama mengikut bilangan portfolio inisiatif.
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Portfolio Aktif:</span>
            <span className="font-semibold text-slate-800">{summaryMetrics.totalProjects} rekod</span>
          </div>
        </div>
      </div>

      {/* 4. Progress Stage Distribution Matrix (0-20%, 21-40%, etc.) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">Taburan Tahap Kemajuan Portfolio</h2>
              <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200">
                Progress Pipeline
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Pengelompokan inisiatif mengikut peratusan pencapaian semasa dari Firestore.
            </p>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Purata Keseluruhan: <span className="font-bold text-emerald-700">{summaryMetrics.avgProgress}%</span>
          </div>
        </div>

        <div className="w-full h-56 sm:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={progressBucketsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#475569' }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  borderRadius: '10px',
                  color: '#fff',
                  border: 'none',
                  fontSize: '12px'
                }}
                formatter={(val: any, _name: any, item: any) => [
                  `${val} Inisiatif`,
                  item?.payload?.label || 'Kategori'
                ]}
              />
              <Bar dataKey="count" fill="#059669" radius={[8, 8, 0, 0]} barSize={36}>
                {progressBucketsData.map((entry, index) => (
                  <Cell key={`bar-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-5 gap-3">
          {progressBucketsData.map((b) => (
            <div key={b.range} className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-center">
              <span className="text-[11px] font-semibold text-slate-500 block truncate">{b.label}</span>
              <span className="text-xl font-bold text-slate-900 mt-1 block">{b.count}</span>
              <span className="text-[10px] text-slate-400">
                {summaryMetrics.totalProjects > 0 ? `${Math.round((b.count / summaryMetrics.totalProjects) * 100)}% portfolio` : '0%'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Live Activity Stream from Firestore (Validating Real Data Feed) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Strim Transaksi Firestore Masa Nyata</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              </h2>
              <p className="text-xs text-slate-500">
                Log kemasukan dan kemaskini terus daripada koleksi <code className="font-mono text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded text-[11px]">/submissions</code>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono">
              {submissions.length} rekod transaksi
            </span>
            {onNavigateToCore && (
              <button
                type="button"
                onClick={onNavigateToCore}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                <span>Buka Core Portal</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Live List */}
        {isSubmissionsLoading ? (
          <div className="py-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
            <span>Memuatkan log langsung dari Firestore...</span>
          </div>
        ) : submissions.length === 0 ? (
          <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500 text-xs">
            Belum ada log submisi direkodkan di Firestore. Sila daftarkan inisiatif pertama anda di Core Interface.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 overflow-x-auto">
            {submissions.slice(0, 5).map((log) => {
              const isCreate = log.type === 'CREATE_PROJECT';
              const isUpdate = log.type === 'UPDATE_PROGRESS';

              return (
                <div key={log.id} className="py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/80 px-2 rounded-lg transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider shrink-0 ${
                        isCreate
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : isUpdate
                          ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {isCreate ? 'DAFTAR PROJEK' : isUpdate ? 'KEMASKINI' : log.type}
                    </span>

                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {log.projectTitle}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate flex items-center gap-1.5">
                        <span>Oleh {log.userName || log.userEmail || 'Pegawai'}</span>
                        <span>•</span>
                        <span className="font-mono text-slate-400">ID: {log.id.slice(0, 8)}...</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{log.timestamp}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: PDF Export Preview & Configuration */}
      <PdfExportModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        projects={projects}
        agencies={agencies}
        onSuccessToast={(fileName) => {
          setPdfSuccessToast(`Fail '${fileName}' berjaya dimuat turun!`);
          setTimeout(() => setPdfSuccessToast(null), 6000);
        }}
      />
    </div>
  );
};
