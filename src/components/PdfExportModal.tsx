import React, { useState } from 'react';
import {
  FileDown,
  X,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Building2,
  Layers,
  ArrowRight,
  ShieldCheck,
  Check,
  Loader2,
  FileText
} from 'lucide-react';
import { Project, Agency } from '../types';
import { extractReportData, generateProjectSummaryPDF, ReportSummaryData } from '../utils/pdfReportGenerator';

interface PdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  agencies: Agency[];
  onSuccessToast?: (fileName: string) => void;
}

export const PdfExportModal: React.FC<PdfExportModalProps> = ({
  isOpen,
  onClose,
  projects,
  agencies,
  onSuccessToast
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'blockers' | 'milestones'>('overview');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [officerName, setOfficerName] = useState<string>('Pegawai Pemantau KPSTI');
  const [departmentName, setDepartmentName] = useState<string>('Bahagian Pemantauan Strategik SMJ');
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const reportData: ReportSummaryData = extractReportData(projects);
  const {
    totalProjects,
    completed,
    inProgress,
    delayed,
    planning,
    onHold,
    avgProgress,
    projectsWithBlockers,
    recentMilestones
  } = reportData;

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const result = await generateProjectSummaryPDF(projects, agencies, {
        generatedBy: officerName.trim() || undefined,
        department: departmentName.trim() || undefined
      });
      setDownloadSuccess(true);
      if (onSuccessToast) {
        onSuccessToast(result.fileName);
      }
      setTimeout(() => {
        setDownloadSuccess(false);
      }, 3500);
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-900/70 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">Eksport Laporan Eksekutif PDF</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  A4 Format
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Ringkasan komprehensif status inisiatif, analisis blocker, dan milestone terkini daripada Cloud Firestore.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body with Scroll */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Jumlah Inisiatif
              </div>
              <div className="text-xl font-bold text-slate-900 mt-0.5">
                {totalProjects} <span className="text-xs font-normal text-slate-400">rekod</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                Purata: <span className="font-semibold text-emerald-600">{avgProgress}%</span>
              </div>
            </div>

            <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3">
              <div className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">
                Status Selesai
              </div>
              <div className="text-xl font-bold text-emerald-700 mt-0.5">
                {completed} <span className="text-xs font-normal text-emerald-600">projek</span>
              </div>
              <div className="text-[10px] text-emerald-700 mt-1">
                {totalProjects > 0 ? `${Math.round((completed / totalProjects) * 100)}% portfolio` : '0%'}
              </div>
            </div>

            <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-3">
              <div className="text-[11px] font-semibold text-rose-800 uppercase tracking-wider">
                Isu & Blockers
              </div>
              <div className="text-xl font-bold text-rose-700 mt-0.5">
                {projectsWithBlockers.length} <span className="text-xs font-normal text-rose-600">projek</span>
              </div>
              <div className="text-[10px] text-rose-700 mt-1">
                {delayed} status tertunggak
              </div>
            </div>

            <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-3">
              <div className="text-[11px] font-semibold text-indigo-800 uppercase tracking-wider">
                Milestone Direkod
              </div>
              <div className="text-xl font-bold text-indigo-700 mt-0.5">
                {recentMilestones.length} <span className="text-xs font-normal text-indigo-600">log</span>
              </div>
              <div className="text-[10px] text-indigo-700 mt-1">
                Aktiviti terkini
              </div>
            </div>
          </div>

          {/* Configuration Inputs */}
          <div className="bg-slate-50/80 rounded-xl border border-slate-200 p-4 space-y-3">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              Maklumat Penjana Laporan
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Nama Pegawai Penyedia:
                </label>
                <input
                  type="text"
                  value={officerName}
                  onChange={(e) => setOfficerName(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="Contoh: Pegawai Pemantau KPSTI"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Bahagian / Unit Bertanggungjawab:
                </label>
                <input
                  type="text"
                  value={departmentName}
                  onChange={(e) => setDepartmentName(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="Contoh: Bahagian Kerajaan Digital (DGD)"
                />
              </div>
            </div>
          </div>

          {/* Interactive Preview Tabs */}
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
              <span className="text-xs font-bold text-slate-800">
                Pratonton Kandungan Yang Dimasukkan Ke Dalam PDF:
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                    activeTab === 'overview'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Status Projek ({totalProjects})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('blockers')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'blockers'
                      ? 'bg-rose-700 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>Blockers</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === 'blockers' ? 'bg-rose-900 text-white' : 'bg-rose-100 text-rose-800'}`}>
                    {projectsWithBlockers.length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('milestones')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'milestones'
                      ? 'bg-emerald-700 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>Milestones</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === 'milestones' ? 'bg-emerald-900 text-white' : 'bg-emerald-100 text-emerald-800'}`}>
                    {recentMilestones.length}
                  </span>
                </button>
              </div>
            </div>

            {/* Tab 1: Status Overview Preview */}
            {activeTab === 'overview' && (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 text-xs">
                  {projects.map((p) => (
                    <div key={p.id} className="p-2.5 flex items-center justify-between gap-3 hover:bg-slate-50">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {p.id}
                          </span>
                          <span className="font-semibold text-slate-800 truncate">
                            {p.title}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 mt-0.5 block truncate">
                          {p.leadAgency}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            p.status === 'Completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : p.status === 'Delayed'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {p.status}
                        </span>
                        <span className="font-bold text-slate-900 w-10 text-right">
                          {p.progressPercentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 2: Blockers Preview */}
            {activeTab === 'blockers' && (
              <div className="border border-rose-200 rounded-xl overflow-hidden bg-rose-50/20">
                {projectsWithBlockers.length === 0 ? (
                  <div className="p-6 text-center text-xs text-emerald-700 font-medium bg-emerald-50/50">
                    Tiada isu penghalang kritikal direkodkan dalam portfolio semasa.
                  </div>
                ) : (
                  <div className="max-h-56 overflow-y-auto divide-y divide-rose-100 text-xs">
                    {projectsWithBlockers.map((p) => (
                      <div key={p.id} className="p-3 hover:bg-rose-50/40 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-rose-900">{p.title}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-100 text-rose-800">
                              {p.leadAgency}
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-200 text-rose-900">
                            {p.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-rose-800 font-medium">
                          ⚠️ <strong>Isu Penghalang:</strong> {p.currentIssueBlocker || 'Kelewatan berbanding jadual asal.'}
                        </p>
                        {p.nextAction && (
                          <p className="text-[11px] text-slate-600">
                            🛡️ <strong>Tindakan Mitigasi:</strong> {p.nextAction}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Milestones Preview */}
            {activeTab === 'milestones' && (
              <div className="border border-emerald-200 rounded-xl overflow-hidden bg-emerald-50/20">
                {recentMilestones.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500 font-medium">
                    Belum ada rekod pencapaian milestone terperinci.
                  </div>
                ) : (
                  <div className="max-h-56 overflow-y-auto divide-y divide-emerald-100 text-xs">
                    {recentMilestones.map((m, idx) => (
                      <div key={idx} className="p-3 hover:bg-emerald-50/40 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{m.projectTitle}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                              {m.agency}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {m.date}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-700">
                          🎯 <strong>Milestone:</strong> {m.milestone}
                        </p>
                        <div className="text-[10px] text-emerald-700 font-semibold">
                          Kemajuan Fasa: {m.progress}% ({m.status})
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            {downloadSuccess ? (
              <span className="text-emerald-700 font-semibold flex items-center gap-1.5 animate-fade-in">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Fail PDF berjaya dijana & dimuat turun!</span>
              </span>
            ) : (
              <span>Dijana mengikut piawaian reka letak A4 rasmi KPSTI</span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={isGenerating}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menjana PDF...</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" />
                  <span>Muat Turun PDF Rasmi</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
