import React, { useState, useRef, useMemo, useEffect } from 'react';
import Markdown from 'react-markdown';
import { Project, Agency, AttachedFile, ProjectStatus } from '../types';
import { StatusBadge } from './StatusBadge';
import { ProgressBar } from './ProgressBar';
import { DashboardView } from './DashboardView';
import { ProjectsView } from './ProjectsView';
import { 
  streamGeminiEnterpriseAgent, 
  DEFAULT_GEMINI_ENTERPRISE_CONFIG,
  buildStreamAssistUrl,
  refreshOAuthAccessToken,
  getEffectiveAccessToken,
  hasOAuthCredentials
} from '../lib/geminiEnterprise';
import { 
  FileText, 
  UploadCloud, 
  X, 
  Plus, 
  Send, 
  RotateCcw, 
  Building2, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  FileCheck, 
  ChevronDown, 
  ChevronUp, 
  Eye, 
  EyeOff,
  LayoutDashboard, 
  FolderKanban,
  FileSpreadsheet,
  FileIcon,
  Sparkles,
  Info,
  Bot,
  Key,
  Copy,
  Check,
  ArrowRight,
  Terminal,
  Settings,
  HelpCircle,
  ExternalLink,
  RefreshCw
} from 'lucide-react';

interface CoreInterfaceViewProps {
  projects: Project[];
  agencies: Agency[];
  onSelectProject: (project: Project) => void;
  onProjectCreated: (newProject: Project) => void;
  onLoadSampleData: () => void;
  onOpenManageAgencies?: () => void;
  onOpenCreateModal: () => void;
  onNavigate?: (view: 'core' | 'analytics' | 'audit') => void;
}

export const CoreInterfaceView: React.FC<CoreInterfaceViewProps> = ({
  projects,
  agencies,
  onSelectProject,
  onProjectCreated,
  onLoadSampleData,
  onOpenManageAgencies,
  onOpenCreateModal,
  onNavigate
}) => {
  // Input Form State
  const todayStr = new Date().toISOString().split('T')[0];
  const defaultTargetDate = () => {
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    return d.toISOString().split('T')[0];
  };

  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [leadAgency, setLeadAgency] = useState<string>(agencies[0]?.name || 'Kementerian Pendidikan, Sains, Teknologi & Inovasi (KPSTI)');
  const [participatingAgencies, setParticipatingAgencies] = useState<string[]>([]);
  const [unitSection, setUnitSection] = useState<string>('');
  const [projectLead, setProjectLead] = useState<string>('');
  const [assignedTeam, setAssignedTeam] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(todayStr);
  const [targetCompletionDate, setTargetCompletionDate] = useState<string>(defaultTargetDate());
  const [status, setStatus] = useState<ProjectStatus>('Planning');
  const [progressPercentage, setProgressPercentage] = useState<number>(0);
  const [latestProgressUpdate, setLatestProgressUpdate] = useState<string>('');
  const [currentIssueBlocker, setCurrentIssueBlocker] = useState<string>('');
  const [nextAction, setNextAction] = useState<string>('');

  // Attached files state
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // UI state
  const [isFormExpanded, setIsFormExpanded] = useState<boolean>(true);
  const [outputViewMode, setOutputViewMode] = useState<'dashboard' | 'projects' | 'gemini'>('dashboard');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Gemini Enterprise Agent Connection State
  const [accessToken, setAccessToken] = useState<string>(() => {
    const stored = localStorage.getItem('gemini_enterprise_token');
    if (stored && stored.trim().length > 10) {
      return stored;
    }
    return DEFAULT_GEMINI_ENTERPRISE_CONFIG.defaultToken || '';
  });
  const [showToken, setShowToken] = useState<boolean>(false);
  const [showAdvancedConfig, setShowAdvancedConfig] = useState<boolean>(false);
  const [endpointUrl, setEndpointUrl] = useState<string>(DEFAULT_GEMINI_ENTERPRISE_CONFIG.endpointTemplate);
  const [assistantId, setAssistantId] = useState<string>(DEFAULT_GEMINI_ENTERPRISE_CONFIG.assistantId);
  const [agentId, setAgentId] = useState<string>(DEFAULT_GEMINI_ENTERPRISE_CONFIG.agentId);

  // Gemini Enterprise Streaming and Output State
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [streamingStatus, setStreamingStatus] = useState<string>('');
  const [streamedText, setStreamedText] = useState<string>('');
  const [finalAnswer, setFinalAnswer] = useState<string | null>(null);
  const [lastQuestionAsked, setLastQuestionAsked] = useState<string>('');
  const [agentErrorMessage, setAgentErrorMessage] = useState<string | null>(null);
  const [copiedAnswer, setCopiedAnswer] = useState<boolean>(false);
  const [auditSavedSuccess, setAuditSavedSuccess] = useState<boolean>(false);
  const [lastAuditId, setLastAuditId] = useState<string | null>(null);
  const [isRefreshingToken, setIsRefreshingToken] = useState<boolean>(false);

  // Sync token from localStorage across browser tabs or widgets
  useEffect(() => {
    const handleStorage = () => {
      const stored = localStorage.getItem('gemini_enterprise_token');
      if (stored && stored !== accessToken) {
        setAccessToken(stored);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [accessToken]);

  const handleManualRefreshToken = async () => {
    setIsRefreshingToken(true);
    setFormError(null);
    try {
      const newToken = await refreshOAuthAccessToken();
      setAccessToken(newToken);
      setAgentErrorMessage(null);
    } catch (err: any) {
      console.error('Failed to refresh OAuth token:', err);
      setAgentErrorMessage(`Ralat penyegaran token OAuth: ${err.message || 'Sila semak kredensial OAuth dalam Secrets'}`);
    } finally {
      setIsRefreshingToken(false);
    }
  };

  const handleTokenChange = (val: string) => {
    setAccessToken(val);
    localStorage.setItem('gemini_enterprise_token', val.trim());
    if (val.trim()) {
      setAgentErrorMessage(null);
    }
  };

  // Next Project ID calculation
  const nextProjectId = useMemo(() => {
    const count = projects.length + 1;
    return `PRJ-${String(count).padStart(3, '0')}`;
  }, [projects.length]);

  // Duration calculation
  const estimatedDays = useMemo(() => {
    if (!startDate || !targetCompletionDate) return null;
    const start = new Date(startDate);
    const end = new Date(targetCompletionDate);
    const diffTime = end.getTime() - start.getTime();
    if (diffTime < 0) return 0;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [startDate, targetCompletionDate]);

  // Handle participating agency toggle
  const handleToggleAgency = (agencyName: string) => {
    if (agencyName === leadAgency) return;
    setParticipatingAgencies((prev) =>
      prev.includes(agencyName)
        ? prev.filter((a) => a !== agencyName)
        : [...prev, agencyName]
    );
  };

  // Handle file drop & selection
  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newFiles: AttachedFile[] = [];

    Array.from(files).forEach((file) => {
      newFiles.push({
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        uploadedAt: new Date().toISOString()
      });
    });

    setAttachedFiles((prev) => [...prev, ...newFiles]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleRemoveFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Reset Form
  const handleResetForm = () => {
    setTitle('');
    setDescription('');
    setParticipatingAgencies([]);
    setUnitSection('');
    setProjectLead('');
    setAssignedTeam('');
    setStartDate(todayStr);
    setTargetCompletionDate(defaultTargetDate());
    setStatus('Planning');
    setProgressPercentage(0);
    setLatestProgressUpdate('');
    setCurrentIssueBlocker('');
    setNextAction('');
    setAttachedFiles([]);
    setFormError(null);
  };

  // Submit Handler: Wires question form to Gemini Enterprise streamAssist agent
  const handleSubmitProject = async () => {
    const questionText = (description.trim() && title.trim())
      ? `${title.trim()}: ${description.trim()}`
      : (description.trim() || title.trim());

    if (!questionText) {
      setFormError('Sila masukkan soalan atau perincian inisiatif dalam borang sebelum menghantar.');
      return;
    }

    let cleanToken = accessToken.trim();
    if (!cleanToken && hasOAuthCredentials()) {
      try {
        cleanToken = await getEffectiveAccessToken();
        if (cleanToken) {
          setAccessToken(cleanToken);
        }
      } catch (tokenErr: any) {
        console.warn('Auto-token retrieval notice:', tokenErr);
      }
    }

    setFormError(null);
    setAgentErrorMessage(null);
    setIsSubmitting(true);
    setIsStreaming(true);
    setStreamingStatus('Menghubungkan ke Gemini Enterprise Agent (Discovery Engine)...');
    setStreamedText('');
    setFinalAnswer(null);
    setLastQuestionAsked(questionText);
    setAuditSavedSuccess(false);
    setLastAuditId(null);

    // Ensure output portal is visible and scrolled into view
    setTimeout(() => {
      document.getElementById('section-output-portal')?.scrollIntoView({ behavior: 'smooth' });
    }, 50);

    try {
      const result = await streamGeminiEnterpriseAgent({
        endpointUrl,
        assistantId,
        agentId,
        accessToken: cleanToken,
        question: questionText,
        projects,
        leadAgency,
        title,
        onProgress: (prog) => {
          setStreamingStatus(prog.statusText);
          if (prog.accumulatedText) {
            setStreamedText(prog.accumulatedText);
          }
        }
      });

      setFinalAnswer(result.answer);
      setStreamedText(result.answer);
      setAuditSavedSuccess(true);
      if (result.auditSubmissionId) {
        setLastAuditId(result.auditSubmissionId);
      }

      // Sync updated token from storage if refreshed during request
      const updatedToken = localStorage.getItem('gemini_enterprise_token');
      if (updatedToken && updatedToken !== accessToken) {
        setAccessToken(updatedToken);
      }
    } catch (err: any) {
      console.warn('Gemini streaming notice:', err);
      const msg = err.message || '';
      if (
        /unauthenticated|permission_denied|invalid authentication|expired|credentials/i.test(msg)
      ) {
        setAgentErrorMessage("Pengesahan gagal atau sesi telah tamat. Sila semak kredensial OAuth atau masukkan Bearer Token.");
      } else if (msg.includes('No response was generated') || msg.includes('Try rephrasing')) {
        setAgentErrorMessage("No response was generated. Try rephrasing your question.");
      } else {
        setAgentErrorMessage(msg || "No response was generated. Try rephrasing your question.");
      }
    } finally {
      setIsSubmitting(false);
      setIsStreaming(false);
    }
  };

  // Helper to save generated agent answer as a new project in Firestore
  const handleSaveAnswerAsProject = async () => {
    if (!finalAnswer && !streamedText) return;
    try {
      setIsSubmitting(true);
      const answerContent = finalAnswer || streamedText;
      const projectFromAnswer: Project = {
        id: nextProjectId,
        title: title.trim() || `Inisiatif AI: ${lastQuestionAsked.slice(0, 45)}`,
        description: answerContent.slice(0, 500),
        leadAgency: leadAgency,
        participatingAgencies: participatingAgencies,
        unitSection: unitSection.trim() || 'Unit Transformasi Digital AI',
        projectLead: projectLead.trim() || 'Pegawai Penyelaras AI',
        assignedTeam: assignedTeam.trim() || 'Pasukan Inovasi KPSTI',
        startDate: startDate || todayStr,
        targetCompletionDate: targetCompletionDate || defaultTargetDate(),
        status: status,
        progressPercentage: progressPercentage || 25,
        latestProgressUpdate: 'Diserapkan daripada sesi konsultasi Ejen Gemini Enterprise.',
        currentIssueBlocker: currentIssueBlocker.trim() || '',
        nextAction: nextAction.trim() || 'Pelaksanaan cadangan tindakan ejen.',
        lastUpdatedDate: todayStr,
        history: [
          {
            id: `hist-${Date.now()}`,
            date: todayStr,
            progressPercentage: progressPercentage || 25,
            status: status,
            progressUpdate: 'Inisiatif dijana melalui Ejen Gemini Enterprise.',
            recordedBy: 'Ejen Gemini Enterprise'
          }
        ]
      };
      await onProjectCreated(projectFromAnswer);
      alert(`Inisiatif "${projectFromAnswer.title}" berjaya didaftarkan ke Firestore!`);
    } catch (saveErr) {
      console.error('Error saving project from answer:', saveErr);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper check for form readiness
  const isReadyToSubmit = title.trim().length > 0 || description.trim().length > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 animate-fade-in">
      
      {/* 1. Page Header - Streamlined & Compact */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 border border-slate-800 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">Modul Pendaftaran & Pemantauan</span>
              <span className="text-xs text-slate-500">•</span>
              <span className="text-xs text-slate-300">KPSTI Sabah</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <span>Core Interface</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Pendaftaran inisiatif baharu (Input Portal) dan senarai pemantauan kemajuan projek rentas agensi (Output Portal) disegerakkan terus ke Firestore.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              id="btn-toggle-input-form"
              onClick={() => setIsFormExpanded(!isFormExpanded)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold border border-slate-700 transition-colors shadow-xs cursor-pointer"
            >
              {isFormExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4 text-emerald-400" />
                  <span>Tutup Borang</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 text-emerald-400" />
                  <span>Buka Borang Inisiatif</span>
                </>
              )}
            </button>

            {onOpenManageAgencies && (
              <button
                type="button"
                id="btn-core-manage-agencies"
                onClick={onOpenManageAgencies}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer"
                title="Urus Senarai Agensi & Jabatan"
              >
                <Building2 className="w-4 h-4" />
                <span>Urus Agensi ({agencies.length})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. SECTION: INPUT PORTAL (Tidy form fields & file drop zone) */}
      {isFormExpanded && (
        <section id="section-input-portal" className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all">
          <div className="p-4 sm:px-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                IN
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  Input Portal — Pendaftaran Inisiatif & Lampiran
                </h2>
                <p className="text-[11px] text-slate-500">
                  Isi medan inisiatif dan lampirkan fail sokongan jika berkaitan.
                </p>
              </div>
            </div>

            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-slate-200 text-slate-700">
              ID: {nextProjectId}
            </span>
          </div>

          {formError && (
            <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="p-5 sm:p-6 space-y-5">
            
            {/* GEMINI ENTERPRISE COMPACT SUPPORTING COMPONENT */}
            <div className="bg-slate-900 text-slate-200 rounded-xl p-3 sm:px-4 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-violet-600/30 text-violet-300 border border-violet-500/40 flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white truncate">Ejen Gemini Enterprise (streamAssist)</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-violet-950 text-violet-300 border border-violet-700/50 font-mono">
                      sabahnet-ge-ai
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">
                    Bantuan pintar cadangan maklumat inisiatif
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1.5 bg-emerald-950 text-emerald-300 border border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  OAuth Auto-Refresh Aktif
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setTitle('Sistem Pemantauan Transformasi Digital Sabah');
                    setDescription('Platform integrasi bersepadu bagi memantau kemajuan inisiatif digital agensi kerajaan negeri Sabah.');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] border border-slate-700 transition-colors cursor-pointer"
                  title="Isi contoh maklumat inisiatif"
                >
                  <Sparkles className="w-3 h-3 text-violet-400 inline mr-1" />
                  Isi Contoh
                </button>
              </div>
            </div>

            {/* Grid 1: Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              
              {/* Project Title */}
              <div className="lg:col-span-2">
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Tajuk Inisiatif / Projek <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  id="input-project-title"
                  placeholder="cth: Sistem Portal Pembelajaran Digital Negeri Sabah"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-colors"
                />
              </div>

              {/* Lead Agency */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-800">
                    Agensi Peneraju <span className="text-rose-500">*</span>
                  </label>
                  {onOpenManageAgencies && (
                    <button
                      type="button"
                      onClick={onOpenManageAgencies}
                      className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
                    >
                      + Tambah Agensi
                    </button>
                  )}
                </div>
                <select
                  id="input-lead-agency"
                  value={leadAgency}
                  onChange={(e) => setLeadAgency(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-colors"
                >
                  {agencies.map((agency) => (
                    <option key={agency.id} value={agency.name}>
                      [{agency.code}] {agency.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Responsible Unit/Section */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Bahagian / Unit Bertanggungjawab
                </label>
                <input
                  type="text"
                  id="input-unit-section"
                  placeholder="cth: Bahagian Aplikasi Digital & Sains"
                  value={unitSection}
                  onChange={(e) => setUnitSection(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-colors"
                />
              </div>

              {/* Project Lead */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Pegawai Peneraju / Ketua Projek
                </label>
                <input
                  type="text"
                  id="input-project-lead"
                  placeholder="cth: Ts. Faridah Osman (Pengarah Projek)"
                  value={projectLead}
                  onChange={(e) => setProjectLead(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-colors"
                />
              </div>

              {/* Assigned Team */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Pasukan Pelaksana
                </label>
                <input
                  type="text"
                  id="input-assigned-team"
                  placeholder="cth: Pasukan Pembangunan Web & Integrasi"
                  value={assignedTeam}
                  onChange={(e) => setAssignedTeam(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-colors"
                />
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Tarikh Mula Pelaksanaan
                </label>
                <input
                  type="date"
                  id="input-start-date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-colors"
                />
              </div>

              {/* Target Completion Date */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Sasaran Tarikh Siap
                </label>
                <input
                  type="date"
                  id="input-target-date"
                  value={targetCompletionDate}
                  onChange={(e) => setTargetCompletionDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-colors"
                />
              </div>

              {/* Initial Status */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Status Permulaan
                </label>
                <select
                  id="input-project-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-colors"
                >
                  <option value="Planning">Planning (Perancangan)</option>
                  <option value="In Progress">In Progress (Sedang Berjalan)</option>
                  <option value="On Hold">On Hold (Ditangguhkan)</option>
                  <option value="Completed">Completed (Selesai)</option>
                  <option value="Delayed">Delayed (Lewat Jadual)</option>
                </select>
              </div>

            </div>

            {/* Participating Agencies Multi-selector */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Agensi Rakan Kerjasama (Penyelarasan Rentas Agensi)
              </label>
              <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 max-h-36 overflow-y-auto">
                {agencies
                  .filter((a) => a.name !== leadAgency)
                  .map((agency) => {
                    const isSelected = participatingAgencies.includes(agency.name);
                    return (
                      <button
                        type="button"
                        key={agency.id}
                        onClick={() => handleToggleAgency(agency.name)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          isSelected
                            ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                            : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <span className="font-mono text-[10px] opacity-80">{agency.code}</span>
                        <span>{agency.name}</span>
                        {isSelected && <X className="w-3 h-3 ml-0.5" />}
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Initial Progress Range Slider */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-800">
                  Peratusan Kemajuan Awal
                </label>
                <span className="text-sm font-extrabold text-emerald-700 bg-emerald-100 px-3 py-0.5 rounded-md">
                  {progressPercentage}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={progressPercentage}
                onChange={(e) => setProgressPercentage(parseInt(e.target.value, 10))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                <span>0% (Mula)</span>
                <span>25% (Reka Bentuk)</span>
                <span>50% (Pembangunan)</span>
                <span>75% (Pengujian)</span>
                <span>100% (Selesai)</span>
              </div>
            </div>

            {/* Scope & Description */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Keterangan & Skop Projek
              </label>
              <textarea
                rows={2}
                id="input-description"
                placeholder="Terangkan objektif inisiatif, impak kepada rakyat, sasaran pengguna, dan skop teknikal..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-colors"
              />
            </div>

            {/* Progress Notes & Issue Blockers */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Kemaskini / Nota Kemajuan Terkini
                </label>
                <input
                  type="text"
                  id="input-latest-update"
                  placeholder="cth: Kelulusan bajet fasa 1 telah diterima"
                  value={latestProgressUpdate}
                  onChange={(e) => setLatestProgressUpdate(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5 text-rose-700 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Isu Penghalang (Jika Ada)</span>
                </label>
                <input
                  type="text"
                  id="input-blocker"
                  placeholder="cth: Kelewatan integrasi API agensi luar"
                  value={currentIssueBlocker}
                  onChange={(e) => setCurrentIssueBlocker(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-rose-50/50 hover:bg-white focus:bg-white border border-rose-300 rounded-xl text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-rose-500 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Tindakan Seterusnya (Next Action)
                </label>
                <input
                  type="text"
                  id="input-next-action"
                  placeholder="cth: Mesyuarat koordinasi bersama pihak teknikal"
                  value={nextAction}
                  onChange={(e) => setNextAction(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* File Drop Zone (Standardized Upload Area) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <UploadCloud className="w-4 h-4 text-emerald-600" />
                  <span>Zon Muat Naik Dokumen Projek (File Drop Zone)</span>
                </label>
                <span className="text-[11px] text-slate-500">
                  PDF, Word, Excel, PowerPoint, Imej (Maks 25MB)
                </span>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                multiple
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg"
                onChange={(e) => handleFiles(e.target.files)}
              />

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-150 ${
                  isDragging
                    ? 'border-emerald-500 bg-emerald-50/80 scale-[0.99]'
                    : 'border-slate-300 bg-slate-50/70 hover:bg-slate-100/80 hover:border-slate-400'
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 text-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-xs">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <p className="text-xs sm:text-sm font-bold text-slate-800">
                  Tarik & Lepaskan fail di sini, atau <span className="text-emerald-700 underline">klik untuk memilih</span>
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Kertas cadangan, carta gantt, minit mesyuarat, atau laporan status berkala
                </p>
              </div>

              {/* Uploaded Files Preview List */}
              {attachedFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  <span className="text-xs font-semibold text-slate-700">
                    Fail Dilampirkan ({attachedFiles.length}):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {attachedFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div className="truncate">
                            <p className="text-xs font-medium text-slate-800 truncate">{file.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFile(idx);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        </section>
      )}

      {/* 3. SECTION: DYNAMIC SUMMARY AREA (ABOVE THE RESULTS) */}
      {/* "a dynamic summary area above the results that reformats what was entered before it's sent, so the user can confirm it looks right" */}
      <section id="section-dynamic-summary" className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-2xl p-6 sm:p-7 border border-slate-800 shadow-xl relative overflow-hidden">
        {/* Decorative subtle glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>Pratonton Dinamik & Pengesahan Submisi</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-700/60">
                  Pre-Flight Confirmation
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Memformat semula data yang diisi secara langsung untuk disahkan sebelum dihantar ke pangkalan data Firestore.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-reset-draft"
              onClick={handleResetForm}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Kosongkan Draf</span>
            </button>
          </div>
        </div>

        {/* Formatted Dynamic Confirmation Card */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 sm:p-6 space-y-4">
          
          {/* Top row: ID, Status, Progress */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/60">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                {nextProjectId}
              </span>
              <StatusBadge status={status} />
              <span className="text-xs text-slate-400">
                Sasaran: <strong className="text-emerald-400">{progressPercentage}%</strong>
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>
                {startDate} ➔ {targetCompletionDate}
              </span>
              {estimatedDays !== null && (
                <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-mono">
                  ~{estimatedDays} Hari
                </span>
              )}
            </div>
          </div>

          {/* Formatted Title & Description */}
          <div>
            <h4 className="text-base sm:text-lg font-bold text-white tracking-tight">
              {title.trim() ? title : (
                <span className="text-slate-500 italic font-normal">
                  [Tajuk Projek Belum Dimasukkan — Isi medan tajuk di atas]
                </span>
              )}
            </h4>
            <p className="text-xs text-slate-300 mt-1 line-clamp-2">
              {description.trim() ? description : (
                <span className="text-slate-500 italic">
                  [Keterangan skop inisiatif belum disediakan]
                </span>
              )}
            </p>
          </div>

          {/* Formatted Agency Roster */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-950/80 border border-emerald-800/80 text-emerald-200">
              <Building2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Peneraju: <strong>{leadAgency}</strong></span>
            </div>

            {participatingAgencies.length > 0 ? (
              <div className="flex flex-wrap items-center gap-1">
                <span className="text-slate-400 text-[11px]">Rakan:</span>
                {participatingAgencies.map((agency, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded text-[11px] bg-slate-800 border border-slate-700 text-slate-300"
                  >
                    {agency}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-slate-500 text-xs italic">
                (Inisiatif agensi tunggal — tiada agensi rakan dipilih)
              </span>
            )}
          </div>

          {/* Lead Officer & Unit Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-900/60 p-3 rounded-lg border border-slate-800">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Unit Bertanggungjawab</span>
              <span className="font-semibold text-slate-200 truncate block">
                {unitSection.trim() || 'Bahagian Pembangunan Digital'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Pegawai / Ketua Projek</span>
              <span className="font-semibold text-slate-200 truncate block">
                {projectLead.trim() || 'Unassigned'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Pasukan Pelaksana</span>
              <span className="font-semibold text-slate-200 truncate block">
                {assignedTeam.trim() || 'Unassigned'}
              </span>
            </div>
          </div>

          {/* Live Progress Bar */}
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Kemajuan Pelaksanaan Permulaan</span>
              <span className="font-mono text-emerald-400 font-bold">{progressPercentage}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Issues & Next Actions Preview */}
          {(currentIssueBlocker.trim() || nextAction.trim() || latestProgressUpdate.trim()) && (
            <div className="text-xs space-y-1 pt-2 border-t border-slate-800/60">
              {latestProgressUpdate.trim() && (
                <p className="text-slate-300">
                  <strong className="text-slate-400">Nota:</strong> {latestProgressUpdate}
                </p>
              )}
              {currentIssueBlocker.trim() && (
                <p className="text-rose-400 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                  <span><strong>Isu Penghalang:</strong> {currentIssueBlocker}</span>
                </p>
              )}
              {nextAction.trim() && (
                <p className="text-emerald-300">
                  <strong className="text-slate-400">Tindakan Seterusnya:</strong> {nextAction}
                </p>
              )}
            </div>
          )}

          {/* Attached Files chip list */}
          {attachedFiles.length > 0 && (
            <div className="pt-2 border-t border-slate-800/60 flex items-center gap-2 flex-wrap text-xs">
              <span className="text-slate-400 text-[11px]">Lampiran ({attachedFiles.length}):</span>
              {attachedFiles.map((f, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] font-mono flex items-center gap-1"
                >
                  <FileText className="w-3 h-3 text-emerald-400" />
                  <span className="truncate max-w-[150px]">{f.name}</span>
                </span>
              ))}
            </div>
          )}

        </div>

        {/* Submit Action Bar */}
        <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            {!accessToken.trim() && !hasOAuthCredentials() ? (
              <span className="text-amber-400 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                Sila pastikan Kunci Akses (Bearer Token) atau Kredensial OAuth telah dikonfigurasikan sebelum menghantar.
              </span>
            ) : isReadyToSubmit ? (
              <span className="text-emerald-400 flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Borang soalan lengkap. Sedia untuk dihantar ke Ejen Gemini Enterprise (Auto-Refresh OAuth Aktif).
              </span>
            ) : (
              <span className="text-slate-400 flex items-center gap-1.5">
                <Info className="w-4 h-4 shrink-0" />
                Sila masukkan Tajuk atau Keterangan soalan sebelum menghantar.
              </span>
            )}
          </div>

          <button
            type="button"
            id="btn-submit-to-firestore"
            disabled={!isReadyToSubmit || isSubmitting || isStreaming}
            onClick={handleSubmitProject}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-sm font-bold shadow-lg hover:shadow-emerald-600/30 transition-all duration-150 cursor-pointer disabled:cursor-not-allowed"
          >
            {isStreaming ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Menjana respons Ejen Gemini...</span>
              </>
            ) : isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Menghubungi Ejen...</span>
              </>
            ) : (
              <>
                <Bot className="w-4 h-4 text-emerald-200" />
                <span>Hantar Soalan ke Ejen Gemini Enterprise</span>
              </>
            )}
          </button>
        </div>
      </section>

      {/* 4. SECTION: OUTPUT PORTAL (RESULTS & REPOSITORY) */}
      <section id="section-output-portal" className="space-y-6">

        {/* GEMINI ENTERPRISE STREAMING & MARKDOWN RESULTS CARD */}
        {(isStreaming || finalAnswer || streamedText || agentErrorMessage) && (
          <div className="bg-white rounded-2xl border-2 border-emerald-600/30 shadow-lg overflow-hidden transition-all animate-fade-in">
            {/* Card Header */}
            <div className="p-4 sm:p-5 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">
                      Jawapan Ejen Gemini Enterprise
                    </h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                      Discovery Engine Assistant
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Endpoint: <span className="font-mono text-emerald-400">streamAssist</span> • Agent ID: <span className="font-mono text-slate-300">{agentId}</span>
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div>
                {agentErrorMessage ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-950 text-rose-300 border border-rose-800">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Ralat Respons
                  </span>
                ) : isStreaming ? (
                  <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-700/80 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    Menstrim Respons Langsung...
                  </span>
                ) : finalAnswer ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Selesai & Diaudit ke Firestore
                  </span>
                ) : null}
              </div>
            </div>

            {/* Error Display - handles invalid token & no response */}
            {agentErrorMessage && (
              <div className="p-5 bg-rose-50 border-b border-rose-200">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-rose-900">Perhatian: Respons Tidak Berjaya</h4>
                    <p className="text-sm text-rose-800 font-medium">{agentErrorMessage}</p>
                    <div className="pt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={handleManualRefreshToken}
                        disabled={isRefreshingToken}
                        className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingToken ? 'animate-spin' : ''}`} />
                        <span>{isRefreshingToken ? 'Menyegarkan Token...' : 'Segarkan Semula Sesi OAuth'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Question Summary Bar */}
            {lastQuestionAsked && (
              <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-start gap-2 text-xs">
                <span className="font-bold text-slate-500 uppercase shrink-0 pt-0.5">Soalan Anda:</span>
                <span className="text-slate-800 font-medium line-clamp-2">{lastQuestionAsked}</span>
              </div>
            )}

            {/* Streaming Progress Bar & Status (shown while stream is receiving chunks) */}
            {isStreaming && (
              <div className="px-5 py-3 bg-slate-900 text-slate-200 border-b border-slate-800">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="flex items-center gap-2 text-emerald-300 font-medium">
                    <div className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                    {streamingStatus || 'Ejen sedang memproses soalan anda...'}
                  </span>
                  <span className="text-slate-400 font-mono text-[11px]">
                    {streamedText.length} aksara diterima
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 rounded-full animate-pulse w-full" />
                </div>
              </div>
            )}

            {/* Markdown Answer Output Area */}
            {(streamedText || finalAnswer) && (
              <div className="p-6 sm:p-7 space-y-4">
                <div className="markdown-body prose prose-slate max-w-none text-slate-800 leading-relaxed text-sm bg-slate-50/60 p-5 sm:p-6 rounded-xl border border-slate-200/80">
                  <Markdown>{streamedText || finalAnswer || ''}</Markdown>
                  {isStreaming && (
                    <span className="inline-block w-2 h-4 bg-emerald-600 animate-pulse ml-1 align-middle" />
                  )}
                </div>

                {/* Audit Notification Banner */}
                {auditSavedSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        Jawapan ini telah disimpan secara automatik ke <strong>Jejak Audit (Firestore collection: submissions)</strong>.
                      </span>
                    </div>
                    {onNavigate && (
                      <button
                        type="button"
                        onClick={() => onNavigate('audit')}
                        className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:text-emerald-900 hover:underline shrink-0"
                      >
                        <span>Lihat Audit Log</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}

                {/* Actions Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const content = finalAnswer || streamedText;
                        if (content) {
                          navigator.clipboard.writeText(content);
                          setCopiedAnswer(true);
                          setTimeout(() => setCopiedAnswer(false), 2000);
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                    >
                      {copiedAnswer ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Disalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin Jawapan</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveAnswerAsProject}
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold border border-emerald-200 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Daftar sebagai Inisiatif Projek</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setFinalAnswer(null);
                      setStreamedText('');
                      setAgentErrorMessage(null);
                      setAuditSavedSuccess(false);
                      document.getElementById('input-project-title')?.focus();
                      document.getElementById('section-input-portal')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="text-xs text-slate-500 hover:text-slate-800 underline font-medium"
                  >
                    Tanya Soalan Baharu
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Output Header & View Switcher */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              OUT
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Output Portal — Repositori & Hasil Pantauan Projek
              </h2>
              <p className="text-xs text-slate-500">
                Pangkalan data aktif: {projects.length} inisiatif berdaftar • Disegerakkan dengan Google Cloud Firestore
              </p>
            </div>
          </div>

          {/* Switcher tabs */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs shadow-inner">
            <button
              type="button"
              id="btn-output-view-dashboard"
              onClick={() => setOutputViewMode('dashboard')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-semibold transition-all ${
                outputViewMode === 'dashboard'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-emerald-600" />
              <span>Paparan Metrik & Agihan</span>
            </button>

            <button
              type="button"
              id="btn-output-view-projects"
              onClick={() => setOutputViewMode('projects')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-semibold transition-all ${
                outputViewMode === 'projects'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FolderKanban className="w-3.5 h-3.5 text-emerald-600" />
              <span>Direktori Projek ({projects.length})</span>
            </button>
          </div>
        </div>

        {/* Render Output Content based on selected mode */}
        {outputViewMode === 'dashboard' ? (
          <DashboardView
            projects={projects}
            agencies={agencies}
            onSelectProject={onSelectProject}
            onOpenCreateModal={onOpenCreateModal}
            onLoadSampleData={onLoadSampleData}
            onOpenManageAgencies={onOpenManageAgencies}
          />
        ) : (
          <ProjectsView
            projects={projects}
            agencies={agencies}
            onSelectProject={onSelectProject}
            onOpenCreateModal={onOpenCreateModal}
            onOpenManageAgencies={onOpenManageAgencies}
          />
        )}

      </section>

    </div>
  );
};
