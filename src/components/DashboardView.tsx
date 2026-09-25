import React, { useState, useMemo } from 'react';
import { Project, Agency, ProjectStatus } from '../types';
import { calculateDashboardStats, formatDate, isProjectOverdue, hasActiveBlocker, doesProjectNeedAttention } from '../utils/dateUtils';
import { StatusBadge, NeedsAttentionBadge, CrossAgencyBadge } from './StatusBadge';
import { ProgressBar } from './ProgressBar';
import { LeadAgencyDistribution } from './LeadAgencyDistribution';
import {
  FolderKanban,
  PlayCircle,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Filter,
  ArrowRight,
  UserX,
  UserCheck,
  Building,
  Calendar,
  AlertCircle,
  RotateCcw,
  Plus,
  Search
} from 'lucide-react';

interface DashboardViewProps {
  projects: Project[];
  agencies: Agency[];
  onSelectProject: (project: Project) => void;
  onOpenCreateModal: () => void;
  onLoadSampleData: () => void;
  onOpenManageAgencies?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  projects,
  agencies,
  onSelectProject,
  onOpenCreateModal,
  onLoadSampleData,
  onOpenManageAgencies
}) => {
  // Dashboard filter state
  const [selectedLeadAgency, setSelectedLeadAgency] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [filterNeedsAttention, setFilterNeedsAttention] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Dynamic calculations for summary KPI cards
  const stats = useMemo(() => calculateDashboardStats(projects), [projects]);

  // Dynamic filter application
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      // Lead Agency filter
      if (selectedLeadAgency !== 'ALL' && p.leadAgency !== selectedLeadAgency) {
        return false;
      }

      // Status filter
      if (selectedStatus !== 'ALL' && p.status !== selectedStatus) {
        return false;
      }

      // Needs Attention filter
      if (filterNeedsAttention && !doesProjectNeedAttention(p)) {
        return false;
      }

      // Search query filter (title or Lead Agency or ID)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesTitle = p.title.toLowerCase().includes(query);
        const matchesLead = p.leadAgency.toLowerCase().includes(query);
        const matchesId = p.id.toLowerCase().includes(query);
        const matchesLeadPerson = p.projectLead?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesLead && !matchesId && !matchesLeadPerson) {
          return false;
        }
      }

      return true;
    });
  }, [projects, selectedLeadAgency, selectedStatus, filterNeedsAttention, searchQuery]);

  const hasActiveFilters = selectedLeadAgency !== 'ALL' || selectedStatus !== 'ALL' || filterNeedsAttention || searchQuery.trim() !== '';

  const handleResetFilters = () => {
    setSelectedLeadAgency('ALL');
    setSelectedStatus('ALL');
    setFilterNeedsAttention(false);
    setSearchQuery('');
  };

  // Quick filter by card click
  const handleCardFilterClick = (statusType: 'ALL' | 'In Progress' | 'Completed' | 'NEEDS_ATTENTION' | 'OVERDUE') => {
    if (statusType === 'ALL') {
      setSelectedStatus('ALL');
      setFilterNeedsAttention(false);
    } else if (statusType === 'NEEDS_ATTENTION') {
      setFilterNeedsAttention(true);
      setSelectedStatus('ALL');
    } else if (statusType === 'OVERDUE') {
      // Overdue is a subset of attention
      setFilterNeedsAttention(true);
      setSelectedStatus('ALL');
    } else {
      setSelectedStatus(statusType);
      setFilterNeedsAttention(false);
    }
  };

  // If no projects exist in the entire system
  if (projects.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center max-w-2xl mx-auto">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-500">
            <FolderKanban className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">No Projects Currently Monitored</h2>
          <p className="text-sm text-slate-600 mb-8 leading-relaxed">
            The project monitoring repository is currently empty. You can populate the dashboard with realistic cross-agency sample projects or register a new project from scratch.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              id="btn-empty-load-sample"
              onClick={onLoadSampleData}
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-colors shadow-sm"
            >
              Load Sample Data
            </button>
            <button
              id="btn-empty-create-project"
              onClick={onOpenCreateModal}
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm border border-slate-300 transition-colors"
            >
              + Create First Project
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Banner / Executive Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Project Monitoring Dashboard</h1>
          <p className="text-sm text-slate-600 mt-1">
            Central operational overview and executive tracking for cross-agency government initiatives
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            id="btn-dashboard-new-project"
            onClick={onOpenCreateModal}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create Project</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        
        {/* Total Projects */}
        <div
          id="kpi-card-total"
          onClick={() => handleCardFilterClick('ALL')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">Total Projects</span>
            <FolderKanban className="w-4 h-4 text-slate-600" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900">{stats.total}</span>
            <span className="text-xs text-slate-500">Active portfolio</span>
          </div>
        </div>

        {/* In Progress */}
        <div
          id="kpi-card-in-progress"
          onClick={() => handleCardFilterClick('In Progress')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-blue-600 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">In Progress</span>
            <PlayCircle className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-bold text-blue-900">{stats.inProgress}</span>
            <span className="text-xs text-slate-500">
              {stats.total > 0 ? Math.round((stats.inProgress / stats.total) * 100) : 0}% of total
            </span>
          </div>
        </div>

        {/* Completed */}
        <div
          id="kpi-card-completed"
          onClick={() => handleCardFilterClick('Completed')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-emerald-300 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-bold text-emerald-900">{stats.completed}</span>
            <span className="text-xs text-slate-500">Delivered</span>
          </div>
        </div>

        {/* Needs Attention */}
        <div
          id="kpi-card-needs-attention"
          onClick={() => handleCardFilterClick('NEEDS_ATTENTION')}
          className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
            stats.needsAttention > 0
              ? 'bg-amber-50/70 border-amber-300 shadow-sm hover:border-amber-400'
              : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between text-amber-800 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Needs Attention</span>
            <AlertTriangle className="w-4 h-4 text-amber-700" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-bold text-amber-950">{stats.needsAttention}</span>
            <span className="text-xs text-amber-800 font-medium">Blocker / Overdue</span>
          </div>
        </div>

        {/* Overdue */}
        <div
          id="kpi-card-overdue"
          onClick={() => handleCardFilterClick('OVERDUE')}
          className={`col-span-2 sm:col-span-1 p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
            stats.overdue > 0
              ? 'bg-rose-50/70 border-rose-300 shadow-sm hover:border-rose-400'
              : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between text-rose-700 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Overdue</span>
            <Clock className="w-4 h-4 text-rose-600" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-bold text-rose-950">{stats.overdue}</span>
            <span className="text-xs text-rose-800 font-medium">Past target date</span>
          </div>
        </div>

      </div>

      {/* Lead Agency Distribution (Bar Chart / List) */}
      <LeadAgencyDistribution
        projects={projects}
        agencies={agencies}
        selectedLeadAgency={selectedLeadAgency}
        onSelectLeadAgency={(agencyName) => setSelectedLeadAgency(agencyName)}
        onOpenManageAgencies={onOpenManageAgencies}
      />

      {/* Dashboard Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          
          <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
            <Filter className="w-4 h-4 text-slate-500" />
            <span>Dashboard Filters</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:flex items-center gap-3">
            
            {/* Filter: Lead Agency */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5">
              <label htmlFor="filter-lead-agency" className="text-xs font-medium text-slate-600 whitespace-nowrap">
                Lead Agency:
              </label>
              <select
                id="filter-lead-agency"
                value={selectedLeadAgency}
                onChange={(e) => setSelectedLeadAgency(e.target.value)}
                className="w-full sm:w-56 text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="ALL">All Lead Agencies</option>
                {agencies.map((agency) => (
                  <option key={agency.id} value={agency.name}>
                    {agency.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter: Status */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5">
              <label htmlFor="filter-status" className="text-xs font-medium text-slate-600 whitespace-nowrap">
                Status:
              </label>
              <select
                id="filter-status"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full sm:w-36 text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="In Progress">In Progress</option>
                <option value="Planning">Planning</option>
                <option value="On Hold">On Hold</option>
                <option value="Delayed">Delayed</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            {/* Filter: Needs Attention Toggle */}
            <div className="flex items-center">
              <label
                htmlFor="filter-attention-toggle"
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer select-none transition-colors ${
                  filterNeedsAttention
                    ? 'bg-amber-100 border-amber-300 text-amber-900 font-semibold'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <input
                  id="filter-attention-toggle"
                  type="checkbox"
                  checked={filterNeedsAttention}
                  onChange={(e) => setFilterNeedsAttention(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 h-3.5 w-3.5"
                />
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Needs Attention Only</span>
              </label>
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <button
                id="btn-clear-dashboard-filters"
                onClick={handleResetFilters}
                className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                title="Reset all filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}

          </div>
        </div>
      </div>

      {/* Project Monitoring Overview */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">Project Monitoring Overview</h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                {filteredProjects.length} {filteredProjects.length === 1 ? 'Project' : 'Projects'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Select any project to inspect monitoring history, assignees, blockers, and update progress
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="input-dashboard-search"
              type="text"
              placeholder="Search by title, lead..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Project List / Table */}
        {filteredProjects.length === 0 ? (
          <div className="p-12 text-center">
            <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-800 mb-1">No projects found matching filters</h3>
            <p className="text-xs text-slate-500 mb-4">
              Try adjusting or resetting your agency and status filter criteria.
            </p>
            <button
              id="btn-reset-filters-no-results"
              onClick={handleResetFilters}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {filteredProjects.map((project) => {
              const overdue = isProjectOverdue(project);
              const blocked = hasActiveBlocker(project);
              const needsAttention = overdue || blocked;
              const hasLead = project.projectLead && project.projectLead.trim() !== '' && project.projectLead !== 'Unassigned';

              return (
                <div
                  key={project.id}
                  id={`dashboard-project-row-${project.id}`}
                  onClick={() => onSelectProject(project)}
                  className={`p-4 sm:p-5 hover:bg-slate-50/80 transition-colors cursor-pointer group ${
                    needsAttention ? 'bg-amber-50/20' : ''
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    
                    {/* Main Title & Agency Metadata */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="text-xs font-mono font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {project.id}
                        </span>
                        
                        <StatusBadge status={project.status} size="sm" />
                        
                        {needsAttention && (
                          <NeedsAttentionBadge hasBlocker={blocked} isOverdue={overdue} size="sm" />
                        )}

                        <CrossAgencyBadge count={project.participatingAgencies?.length || 0} />
                      </div>

                      <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-2">
                        {project.title}
                      </h3>

                      {/* Agency & Lead Line */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2 text-xs text-slate-600">
                        
                        {/* Lead Agency */}
                        <div className="flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-medium text-slate-800">Lead:</span>
                          <span className="font-semibold text-slate-900">{project.leadAgency}</span>
                        </div>

                        {/* Project Lead Officer */}
                        <div className="flex items-center gap-1.5">
                          {hasLead ? (
                            <>
                              <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>{project.projectLead}</span>
                            </>
                          ) : (
                            <>
                              <UserX className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="italic font-medium text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                                Unassigned
                              </span>
                            </>
                          )}
                        </div>

                        {/* Target Completion Date */}
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="text-slate-500">Target:</span>
                          <span className={`font-medium ${overdue ? 'text-rose-700 font-semibold' : 'text-slate-700'}`}>
                            {formatDate(project.targetCompletionDate)}
                            {overdue && ' (Overdue)'}
                          </span>
                        </div>

                      </div>

                      {/* Participating Agencies list if any */}
                      {project.participatingAgencies && project.participatingAgencies.length > 0 && (
                        <div className="mt-2 flex flex-wrap items-center gap-1 text-[11px]">
                          <span className="text-slate-500 font-medium">Partners:</span>
                          {project.participatingAgencies.map((agencyName, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 truncate max-w-[200px]"
                              title={agencyName}
                            >
                              {agencyName}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Active Blocker Snippet if present */}
                      {blocked && (
                        <div className="mt-2.5 p-2 rounded-md bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                          <span className="font-medium truncate">
                            <strong className="font-semibold">Blocker:</strong> {project.currentIssueBlocker}
                          </span>
                        </div>
                      )}

                    </div>

                    {/* Progress Bar & Detail Action Button */}
                    <div className="w-full lg:w-64 shrink-0 flex flex-col justify-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                      <div className="flex items-center justify-between text-xs text-slate-600">
                        <span className="font-medium">Progress</span>
                        <span className="font-bold text-slate-800">{project.progressPercentage}%</span>
                      </div>
                      <ProgressBar
                        progress={project.progressPercentage}
                        showText={false}
                        size="md"
                        isOverdue={overdue}
                        hasBlocker={blocked}
                      />
                      
                      <div className="flex items-center justify-end mt-1">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 group-hover:text-emerald-800 group-hover:translate-x-0.5 transition-transform">
                          <span>View Details</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

    </div>
  );
};
