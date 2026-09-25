import React from 'react';
import { Project } from '../types';
import { formatDate, isProjectOverdue, hasActiveBlocker } from '../utils/dateUtils';
import { StatusBadge, NeedsAttentionBadge, CrossAgencyBadge } from './StatusBadge';
import { ProgressBar } from './ProgressBar';
import {
  ArrowLeft,
  Edit3,
  Building,
  Layers,
  UserCheck,
  UserX,
  Users,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  History,
  FileText,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

interface ProjectDetailViewProps {
  project: Project;
  onBack: () => void;
  onOpenUpdateModal: () => void;
}

export const ProjectDetailView: React.FC<ProjectDetailViewProps> = ({
  project,
  onBack,
  onOpenUpdateModal,
}) => {
  const overdue = isProjectOverdue(project);
  const blocked = hasActiveBlocker(project);
  const needsAttention = overdue || blocked;
  const hasLead = project.projectLead && project.projectLead.trim() !== '' && project.projectLead !== 'Unassigned';
  const hasTeam = project.assignedTeam && project.assignedTeam.trim() !== '' && project.assignedTeam !== 'Unassigned';

  // Sort history chronologically
  const sortedHistory = [...(project.history || [])].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Navigation & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <button
          id="btn-back-from-details"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Projects Overview</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            id="btn-open-update-progress"
            onClick={onOpenUpdateModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors shadow-sm"
          >
            <Edit3 className="w-4 h-4" />
            <span>Update Progress</span>
          </button>
        </div>
      </div>

      {/* Main Project Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-4">
        
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
              {project.id}
            </span>
            <StatusBadge status={project.status} size="md" />
            {needsAttention && (
              <NeedsAttentionBadge hasBlocker={blocked} isOverdue={overdue} size="md" />
            )}
            <CrossAgencyBadge count={project.participatingAgencies?.length || 0} />
          </div>

          <span className="text-xs text-slate-500 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Last updated: <strong className="text-slate-700">{formatDate(project.lastUpdatedDate)}</strong>
          </span>
        </div>

        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-snug">
            {project.title}
          </h1>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            {project.description}
          </p>
        </div>

        {/* Highlight Banner if Attention is Needed */}
        {needsAttention && (
          <div className="p-4 rounded-lg bg-amber-50/90 border border-amber-300 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                  {blocked && overdue
                    ? 'Critical: Active Blocker & Project Overdue'
                    : blocked
                    ? 'Active Issue / Blocker Identified'
                    : 'Milestone Warning: Project Overdue'}
                </h4>
                <p className="text-xs text-amber-900 mt-0.5">
                  {blocked
                    ? project.currentIssueBlocker
                    : `Project target completion date was ${formatDate(project.targetCompletionDate)} and status is currently ${project.status}.`}
                </p>
              </div>
            </div>
            <button
              onClick={onOpenUpdateModal}
              className="px-3 py-1.5 rounded bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold shrink-0 transition-colors"
            >
              Resolve / Update
            </button>
          </div>
        )}

      </div>

      {/* Grid: Project Information & Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2 cols): Detailed Info & Current Progress */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Section: Current Progress */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>Current Progress & Status</span>
              </h2>
              <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded">
                {project.progressPercentage}% Complete
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5 font-medium">
                <span>Overall Delivery Progress</span>
                <span className="font-bold text-slate-900">{project.progressPercentage} / 100%</span>
              </div>
              <ProgressBar
                progress={project.progressPercentage}
                showText={false}
                size="lg"
                isOverdue={overdue}
                hasBlocker={blocked}
              />
            </div>

            {/* Latest Progress Update Narrative */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Latest Progress Update
              </label>
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-800 leading-relaxed">
                {project.latestProgressUpdate || (
                  <span className="text-slate-400 italic">No progress summary entered yet.</span>
                )}
              </div>
            </div>

            {/* Blocker & Next Action Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              
              {/* Blocker Box */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Current Issue / Blocker</span>
                </label>
                <div
                  className={`p-3 rounded-lg border text-xs leading-relaxed min-h-[5rem] ${
                    blocked
                      ? 'bg-amber-50 border-amber-300 text-amber-950 font-medium'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  {blocked ? (
                    project.currentIssueBlocker
                  ) : (
                    <div className="flex items-center gap-1.5 text-emerald-700 font-medium pt-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>No active blockers recorded</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Next Action Box */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>Next Action</span>
                </label>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 leading-relaxed min-h-[5rem]">
                  {project.nextAction ? (
                    project.nextAction
                  ) : (
                    <span className="text-slate-400 italic">No immediate next action specified.</span>
                  )}
                </div>
              </div>

            </div>

          </div>

          {/* Section: Project Information */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Building className="w-4 h-4 text-slate-600" />
              <span>Project Governance & Inter-Agency Coordination</span>
            </h2>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              
              {/* Lead Agency */}
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100">
                <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                  <Building className="w-3.5 h-3.5 text-slate-600" />
                  <span>Lead Agency / Department</span>
                </dt>
                <dd className="font-bold text-slate-900 text-sm">{project.leadAgency}</dd>
                {project.unitSection && (
                  <p className="text-xs text-slate-500 mt-1">{project.unitSection}</p>
                )}
              </div>

              {/* Project Lead */}
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100">
                <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                  {hasLead ? <UserCheck className="w-3.5 h-3.5 text-emerald-600" /> : <UserX className="w-3.5 h-3.5 text-slate-400" />}
                  <span>Project Lead</span>
                </dt>
                <dd className="text-sm font-semibold text-slate-900">
                  {hasLead ? (
                    project.projectLead
                  ) : (
                    <span className="italic font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-xs">
                      Unassigned
                    </span>
                  )}
                </dd>
              </div>

              {/* Participating Agencies */}
              <div className="sm:col-span-2 p-3.5 rounded-lg bg-slate-50 border border-slate-100">
                <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <Layers className="w-3.5 h-3.5 text-slate-600" />
                  <span>Participating Agencies / Departments</span>
                </dt>
                <dd>
                  {project.participatingAgencies && project.participatingAgencies.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {project.participatingAgencies.map((agency, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-xs font-semibold text-slate-800 shadow-2xs"
                        >
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          <span>{agency}</span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500 italic">
                      Single-agency initiative. No secondary participating agencies registered.
                    </span>
                  )}
                </dd>
              </div>

              {/* Assigned Team / Members */}
              <div className="sm:col-span-2 p-3.5 rounded-lg bg-slate-50 border border-slate-100">
                <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                  <Users className="w-3.5 h-3.5 text-slate-600" />
                  <span>Assigned Team & Key Members</span>
                </dt>
                <dd className="text-xs text-slate-800 font-medium">
                  {hasTeam ? (
                    project.assignedTeam
                  ) : (
                    <span className="italic font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-xs">
                      Unassigned
                    </span>
                  )}
                </dd>
              </div>

            </dl>
          </div>

        </div>

        {/* Right Column (1 col): Timeline & Progress History */}
        <div className="space-y-6">
          
          {/* Section: Timeline */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Calendar className="w-4 h-4 text-slate-600" />
              <span>Project Timeline</span>
            </h2>

            <div className="space-y-3 text-xs">
              
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-500 font-medium">Start Date:</span>
                <span className="font-bold text-slate-800">{formatDate(project.startDate)}</span>
              </div>

              <div className={`flex items-center justify-between p-2.5 rounded-lg border ${
                overdue ? 'bg-rose-50 border-rose-200 text-rose-900' : 'bg-slate-50 border-slate-100'
              }`}>
                <span className={overdue ? 'font-semibold text-rose-800' : 'text-slate-500 font-medium'}>
                  Target Completion:
                </span>
                <span className={`font-bold ${overdue ? 'text-rose-700' : 'text-slate-800'}`}>
                  {formatDate(project.targetCompletionDate)}
                  {overdue && ' (Overdue)'}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-500 font-medium">Last Progress Recorded:</span>
                <span className="font-semibold text-slate-700">{formatDate(project.lastUpdatedDate)}</span>
              </div>

            </div>

            <button
              id="btn-sidebar-update-progress"
              onClick={onOpenUpdateModal}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors shadow-2xs mt-2"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Record Progress Update</span>
            </button>
          </div>

          {/* Section: Progress History */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4 text-slate-600" />
                <span>Progress History</span>
              </h2>
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                {sortedHistory.length} {sortedHistory.length === 1 ? 'Entry' : 'Entries'}
              </span>
            </div>

            {sortedHistory.length === 0 ? (
              <p className="text-xs text-slate-500 italic text-center py-4">
                No previous progress updates recorded in this session.
              </p>
            ) : (
              <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
                {sortedHistory.map((item, index) => (
                  <div
                    key={item.id || index}
                    className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-slate-200/60 pb-1.5">
                      <span className="font-bold text-slate-800">{formatDate(item.date)}</span>
                      <div className="flex items-center gap-1.5">
                        <StatusBadge status={item.status} size="sm" />
                        <span className="font-bold text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                          {item.progressPercentage}%
                        </span>
                      </div>
                    </div>

                    <p className="text-slate-800 text-xs leading-relaxed">
                      {item.progressUpdate}
                    </p>

                    {item.issueBlocker && item.issueBlocker.trim() !== '' && (
                      <div className="p-2 rounded bg-amber-100/70 border border-amber-200 text-amber-950 font-medium">
                        <span className="font-bold text-amber-900">Blocker: </span>
                        {item.issueBlocker}
                      </div>
                    )}

                    {item.nextAction && item.nextAction.trim() !== '' && (
                      <div className="p-2 rounded bg-blue-50 border border-blue-100 text-blue-950">
                        <span className="font-bold text-blue-900">Next Action: </span>
                        {item.nextAction}
                      </div>
                    )}

                    {item.recordedBy && (
                      <div className="text-[11px] text-slate-400 text-right pt-0.5">
                        Recorded by: {item.recordedBy}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
};
