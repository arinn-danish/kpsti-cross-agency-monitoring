import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Project, Agency } from '../types';
import { formatDate, isProjectOverdue, hasActiveBlocker, doesProjectNeedAttention } from '../utils/dateUtils';
import { StatusBadge, NeedsAttentionBadge, CrossAgencyBadge } from './StatusBadge';
import { ProgressBar } from './ProgressBar';
import {
  exportProjectsToCSV,
  generateProjectsSummaryCSV,
  generateMilestonesDetailedCSV,
  downloadCSV
} from '../utils/csvExport';
import { logSubmission } from '../lib/firebase';
import {
  Search,
  Filter,
  Plus,
  Building,
  UserX,
  UserCheck,
  Calendar,
  Layers,
  ArrowRight,
  AlertCircle,
  RotateCcw,
  Sparkles,
  Download,
  FileSpreadsheet,
  ChevronDown,
  CheckCircle2,
  Table,
  History,
  X
} from 'lucide-react';

interface ProjectsViewProps {
  projects: Project[];
  agencies: Agency[];
  onSelectProject: (project: Project) => void;
  onOpenCreateModal: () => void;
  onOpenManageAgencies?: () => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  agencies,
  onSelectProject,
  onOpenCreateModal,
  onOpenManageAgencies,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLeadAgency, setSelectedLeadAgency] = useState<string>('ALL');
  const [selectedPartnerAgency, setSelectedPartnerAgency] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // CSV Export state
  const [showExportMenu, setShowExportMenu] = useState<boolean>(false);
  const [exportScope, setExportScope] = useState<'filtered' | 'all'>('filtered');
  const [exportNotification, setExportNotification] = useState<{ filename: string; count: number } | null>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };
    if (showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportMenu]);

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      // Search query (title, description, id, lead agency, project lead, unit)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = p.title.toLowerCase().includes(q);
        const matchesDesc = p.description.toLowerCase().includes(q);
        const matchesId = p.id.toLowerCase().includes(q);
        const matchesLeadAgency = p.leadAgency.toLowerCase().includes(q);
        const matchesLeadPerson = p.projectLead?.toLowerCase().includes(q);
        const matchesUnit = p.unitSection?.toLowerCase().includes(q);
        const matchesPartner = p.participatingAgencies?.some((agency) => agency.toLowerCase().includes(q));

        if (!matchesTitle && !matchesDesc && !matchesId && !matchesLeadAgency && !matchesLeadPerson && !matchesUnit && !matchesPartner) {
          return false;
        }
      }

      // Filter by Lead Agency
      if (selectedLeadAgency !== 'ALL' && p.leadAgency !== selectedLeadAgency) {
        return false;
      }

      // Filter by Participating Agency
      if (selectedPartnerAgency !== 'ALL') {
        if (!p.participatingAgencies || !p.participatingAgencies.includes(selectedPartnerAgency)) {
          return false;
        }
      }

      // Filter by Status
      if (selectedStatus !== 'ALL' && p.status !== selectedStatus) {
        return false;
      }

      return true;
    });
  }, [projects, searchQuery, selectedLeadAgency, selectedPartnerAgency, selectedStatus]);

  const hasActiveFilters = searchQuery.trim() !== '' || selectedLeadAgency !== 'ALL' || selectedPartnerAgency !== 'ALL' || selectedStatus !== 'ALL';

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedLeadAgency('ALL');
    setSelectedPartnerAgency('ALL');
    setSelectedStatus('ALL');
  };

  // Handle Export to CSV
  const handleExportCSV = (isDetailed: boolean = false, overrideScope?: 'filtered' | 'all') => {
    const targetScope = overrideScope || exportScope;
    const targetProjects = targetScope === 'filtered' ? filteredProjects : projects;

    if (targetProjects.length === 0) {
      alert('Tiada data projek untuk dieksport dengan tetapan semasa.');
      return;
    }

    const res = exportProjectsToCSV(targetProjects, {
      isDetailed,
      isFiltered: targetScope === 'filtered' && hasActiveFilters
    });

    // Log export event to Firestore audit trail for executive governance
    logSubmission({
      type: 'EXPORT_CSV',
      projectTitle: `Eksport CSV: ${targetProjects.length} Projek (${isDetailed ? 'Milestones Terperinci' : 'Ringkasan Kemajuan'})`,
      details: {
        filename: res.filename,
        count: res.count,
        isDetailed,
        scope: targetScope,
        timestamp: new Date().toISOString()
      }
    }).catch((err) => console.error('Gagal merekod log eksport CSV:', err));

    setShowExportMenu(false);
    setExportNotification({ filename: res.filename, count: res.count });
    setTimeout(() => {
      setExportNotification(null);
    }, 5000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Government Projects Directory</h1>
          <p className="text-sm text-slate-600 mt-1">
            Browse, search, and monitor single-agency and multi-agency government initiatives
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onOpenManageAgencies && (
            <button
              id="btn-projects-manage-agencies"
              onClick={onOpenManageAgencies}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-colors shadow-xs"
              title="Urus dan sesuaikan senarai agensi / jabatan"
            >
              <Building className="w-4 h-4 text-emerald-600" />
              <span>Agensi & Jabatan ({agencies.length})</span>
            </button>
          )}
          <button
            id="btn-projects-create"
            onClick={onOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create Project</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Controls Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="input-projects-search"
            type="text"
            placeholder="Search by project title, keyword, ID, unit, or officer name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          
          {/* Filter: Lead Agency */}
          <div>
            <label htmlFor="filter-projects-lead-agency" className="block text-xs font-semibold text-slate-700 mb-1">
              Lead Agency/Department
            </label>
            <select
              id="filter-projects-lead-agency"
              value={selectedLeadAgency}
              onChange={(e) => setSelectedLeadAgency(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="ALL">All Lead Agencies</option>
              {agencies.map((agency) => (
                <option key={agency.id} value={agency.name}>
                  {agency.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter: Participating Agency */}
          <div>
            <label htmlFor="filter-projects-partner-agency" className="block text-xs font-semibold text-slate-700 mb-1">
              Participating Agency/Department
            </label>
            <select
              id="filter-projects-partner-agency"
              value={selectedPartnerAgency}
              onChange={(e) => setSelectedPartnerAgency(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="ALL">All Participating Agencies</option>
              {agencies.map((agency) => (
                <option key={`partner-${agency.id}`} value={agency.name}>
                  {agency.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter: Status */}
          <div>
            <label htmlFor="filter-projects-status" className="block text-xs font-semibold text-slate-700 mb-1">
              Project Status
            </label>
            <select
              id="filter-projects-status"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="In Progress">In Progress</option>
              <option value="Planning">Planning</option>
              <option value="On Hold">On Hold</option>
              <option value="Delayed">Delayed</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          {/* Filter Actions */}
          <div className="flex items-end">
            {hasActiveFilters ? (
              <button
                id="btn-clear-all-project-filters"
                onClick={handleResetFilters}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            ) : (
              <div className="text-xs text-slate-500 flex items-center gap-1.5 px-2 py-2">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span>Showing {filteredProjects.length} of {projects.length}</span>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Projects Grid / List */}
      {filteredProjects.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
          <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 mb-1">No projects found</h3>
          <p className="text-xs text-slate-500 mb-4 max-w-sm mx-auto">
            No project records match the current search keywords or agency filters.
          </p>
          {hasActiveFilters ? (
            <button
              id="btn-no-results-reset-filters"
              onClick={handleResetFilters}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors inline-flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear Filter Criteria</span>
            </button>
          ) : (
            <button
              id="btn-no-results-create-project"
              onClick={onOpenCreateModal}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors"
            >
              + Create New Project
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProjects.map((project) => {
            const overdue = isProjectOverdue(project);
            const blocked = hasActiveBlocker(project);
            const needsAttention = overdue || blocked;
            const hasLead = project.projectLead && project.projectLead.trim() !== '' && project.projectLead !== 'Unassigned';

            return (
              <div
                key={project.id}
                id={`project-card-${project.id}`}
                onClick={() => onSelectProject(project)}
                className={`bg-white rounded-xl border p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between group ${
                  needsAttention ? 'border-amber-200 bg-gradient-to-b from-amber-50/15 to-white' : 'border-slate-200'
                }`}
              >
                <div>
                  
                  {/* Top Metadata Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-mono font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {project.id}
                      </span>
                      <StatusBadge status={project.status} size="sm" />
                    </div>

                    {needsAttention && (
                      <NeedsAttentionBadge hasBlocker={blocked} isOverdue={overdue} size="sm" />
                    )}
                  </div>

                  {/* Project Title */}
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-2 mb-2">
                    {project.title}
                  </h3>

                  {/* Objective Description */}
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
                    {project.description}
                  </p>

                  {/* Agency & Leadership Section */}
                  <div className="space-y-2 bg-slate-50 rounded-lg p-3 border border-slate-100 text-xs mb-4">
                    
                    {/* Lead Agency */}
                    <div className="flex items-start gap-2">
                      <Building className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-slate-500 font-medium">Lead Agency: </span>
                        <span className="font-semibold text-slate-900">{project.leadAgency}</span>
                        {project.unitSection && (
                          <span className="text-slate-500 text-[11px] block">{project.unitSection}</span>
                        )}
                      </div>
                    </div>

                    {/* Participating Agencies */}
                    <div className="flex items-start gap-2">
                      <Layers className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="text-slate-500 font-medium">Participating: </span>
                        {project.participatingAgencies && project.participatingAgencies.length > 0 ? (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {project.participatingAgencies.map((agency, i) => (
                              <span
                                key={i}
                                className="inline-block px-1.5 py-0.5 rounded bg-white text-slate-700 border border-slate-200 text-[11px]"
                              >
                                {agency}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">None (Single Agency)</span>
                        )}
                      </div>
                    </div>

                    {/* Project Lead */}
                    <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60">
                      {hasLead ? (
                        <>
                          <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="text-slate-500 font-medium">Lead Officer:</span>
                          <span className="font-medium text-slate-800 truncate">{project.projectLead}</span>
                        </>
                      ) : (
                        <>
                          <UserX className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="text-slate-500 font-medium">Lead Officer:</span>
                          <span className="italic font-medium text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                            Unassigned
                          </span>
                        </>
                      )}
                    </div>

                  </div>

                </div>

                {/* Bottom Footer: Progress & Deadline */}
                <div className="pt-3 border-t border-slate-100 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-600">Completion</span>
                    <span className="font-bold text-slate-900">{project.progressPercentage}%</span>
                  </div>

                  <ProgressBar
                    progress={project.progressPercentage}
                    showText={false}
                    size="md"
                    isOverdue={overdue}
                    hasBlocker={blocked}
                  />

                  <div className="flex items-center justify-between text-xs pt-1">
                    <div className="flex items-center gap-1 text-slate-500">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Target:</span>
                      <span className={`font-semibold ${overdue ? 'text-rose-700' : 'text-slate-700'}`}>
                        {formatDate(project.targetCompletionDate)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-emerald-700 font-semibold text-xs group-hover:translate-x-0.5 transition-transform">
                      <span>Inspect</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
