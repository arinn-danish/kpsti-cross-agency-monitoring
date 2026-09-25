import React, { useState, useMemo } from 'react';
import { Project, Agency, ProjectStatus } from '../types';
import { doesProjectNeedAttention } from '../utils/dateUtils';
import {
  BarChart3,
  List,
  Building2,
  Filter,
  CheckCircle2,
  AlertTriangle,
  PlayCircle,
  X,
  TrendingUp,
  Layers
} from 'lucide-react';

interface LeadAgencyDistributionProps {
  projects: Project[];
  agencies: Agency[];
  selectedLeadAgency: string;
  onSelectLeadAgency: (agencyName: string) => void;
  onOpenManageAgencies?: () => void;
}

interface AgencyProjectStats {
  agencyName: string;
  agencyCode: string;
  category: string;
  totalProjects: number;
  inProgress: number;
  completed: number;
  delayed: number;
  planning: number;
  onHold: number;
  needsAttention: number;
  averageProgress: number;
  percentageOfPortfolio: number;
}

export const LeadAgencyDistribution: React.FC<LeadAgencyDistributionProps> = ({
  projects,
  agencies,
  selectedLeadAgency,
  onSelectLeadAgency,
  onOpenManageAgencies
}) => {
  const [viewMode, setViewMode] = useState<'chart' | 'list'>('chart');
  const [showAllAgencies, setShowAllAgencies] = useState<boolean>(false);

  // Calculate statistics per agency
  const agencyStats = useMemo(() => {
    const totalSystemProjects = projects.length || 1;

    // Create a map from agency name to agency object
    const agencyMap = new Map<string, Agency>();
    agencies.forEach((a) => agencyMap.set(a.name, a));

    // Also collect all distinct lead agencies present in projects
    const allLeadAgencyNames = new Set<string>();
    agencies.forEach((a) => allLeadAgencyNames.add(a.name));
    projects.forEach((p) => {
      if (p.leadAgency) allLeadAgencyNames.add(p.leadAgency);
    });

    const statsList: AgencyProjectStats[] = [];

    allLeadAgencyNames.forEach((agencyName) => {
      const matchingProjects = projects.filter((p) => p.leadAgency === agencyName);
      const agencyObj = agencyMap.get(agencyName);

      let inProgress = 0;
      let completed = 0;
      let delayed = 0;
      let planning = 0;
      let onHold = 0;
      let needsAttention = 0;
      let totalProgressSum = 0;

      matchingProjects.forEach((p) => {
        totalProgressSum += p.progressPercentage || 0;
        if (p.status === 'In Progress') inProgress++;
        else if (p.status === 'Completed') completed++;
        else if (p.status === 'Delayed') delayed++;
        else if (p.status === 'Planning') planning++;
        else if (p.status === 'On Hold') onHold++;

        if (doesProjectNeedAttention(p)) {
          needsAttention++;
        }
      });

      const totalCount = matchingProjects.length;
      const averageProgress = totalCount > 0 ? Math.round(totalProgressSum / totalCount) : 0;
      const percentageOfPortfolio = totalCount > 0 ? Math.round((totalCount / totalSystemProjects) * 100) : 0;

      // Extract initials if no agency code found
      const fallbackCode = agencyName
        .split(' ')
        .filter((w) => !['of', '&', 'and', 'the', 'for'].includes(w.toLowerCase()))
        .map((w) => w[0])
        .join('')
        .slice(0, 4)
        .toUpperCase();

      statsList.push({
        agencyName,
        agencyCode: agencyObj?.code || fallbackCode,
        category: agencyObj?.category || 'Government',
        totalProjects: totalCount,
        inProgress,
        completed,
        delayed,
        planning,
        onHold,
        needsAttention,
        averageProgress,
        percentageOfPortfolio
      });
    });

    // Sort descending by total projects, then alphabetically
    return statsList.sort((a, b) => {
      if (b.totalProjects !== a.totalProjects) {
        return b.totalProjects - a.totalProjects;
      }
      return a.agencyName.localeCompare(b.agencyName);
    });
  }, [projects, agencies]);

  // Filter based on whether user wants to see agencies with 0 projects
  const displayedStats = useMemo(() => {
    if (showAllAgencies) {
      return agencyStats;
    }
    return agencyStats.filter((item) => item.totalProjects > 0);
  }, [agencyStats, showAllAgencies]);

  // Max count among displayed items for proportional bar sizing
  const maxProjectCount = useMemo(() => {
    if (displayedStats.length === 0) return 1;
    return Math.max(...displayedStats.map((s) => s.totalProjects), 1);
  }, [displayedStats]);

  const activeAgenciesCount = agencyStats.filter((s) => s.totalProjects > 0).length;

  const handleAgencyClick = (agencyName: string) => {
    if (selectedLeadAgency === agencyName) {
      // Toggle off if already selected
      onSelectLeadAgency('ALL');
    } else {
      onSelectLeadAgency(agencyName);
    }
  };

  return (
    <div
      id="lead-agency-distribution-section"
      className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
    >
      {/* Section Header */}
      <div className="p-4 sm:px-6 sm:py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              <Building2 className="w-4 h-4" />
            </div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              Projects by Lead Agency
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold border border-slate-200">
              {activeAgenciesCount} Lead {activeAgenciesCount === 1 ? 'Agency' : 'Agencies'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Distribution of active project stewardship across government departments. Click any agency to filter table below.
          </p>
        </div>

        {/* View Controls & Filter Status */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Active Filter Pill */}
          {selectedLeadAgency !== 'ALL' && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300 animate-in fade-in duration-200">
              <Filter className="w-3 h-3 text-emerald-700" />
              <span className="max-w-[140px] truncate">{selectedLeadAgency}</span>
              <button
                type="button"
                onClick={() => onSelectLeadAgency('ALL')}
                className="hover:bg-emerald-200 rounded-full p-0.5 transition-colors"
                title="Clear agency filter"
                aria-label="Clear lead agency filter"
              >
                <X className="w-3 h-3 text-emerald-800" />
              </button>
            </div>
          )}

          {/* Manage Agencies Button */}
          {onOpenManageAgencies && (
            <button
              type="button"
              id="btn-agency-dist-manage"
              onClick={onOpenManageAgencies}
              className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 bg-white hover:bg-slate-100 transition-colors font-semibold inline-flex items-center gap-1.5 shadow-xs"
              title="Urus dan sesuaikan senarai agensi/jabatan"
            >
              <Building2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Urus Agensi</span>
            </button>
          )}

          {/* Toggle 0 projects */}
          <button
            type="button"
            onClick={() => setShowAllAgencies(!showAllAgencies)}
            className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors font-medium"
          >
            {showAllAgencies ? 'Show Active Only' : 'Show All Agencies'}
          </button>

          {/* View mode toggle */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-xs">
            <button
              type="button"
              id="btn-view-agency-chart"
              onClick={() => setViewMode('chart')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'chart'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title="Bar Chart View"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Bar Chart</span>
            </button>
            <button
              type="button"
              id="btn-view-agency-list"
              onClick={() => setViewMode('list')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title="List View"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">List</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {displayedStats.length === 0 ? (
        <div className="p-8 text-center text-slate-500 text-xs">
          No lead agency project data available.
        </div>
      ) : viewMode === 'chart' ? (
        /* Bar Chart View */
        <div className="p-4 sm:p-6 space-y-3.5">
          {displayedStats.map((item) => {
            const isSelected = selectedLeadAgency === item.agencyName;
            // Width relative to highest agency count (capped at 100%, min 4% if count > 0)
            const barWidthPercent =
              item.totalProjects > 0
                ? Math.max(Math.round((item.totalProjects / maxProjectCount) * 100), 8)
                : 0;

            return (
              <div
                key={item.agencyName}
                id={`agency-bar-${item.agencyCode.toLowerCase()}`}
                onClick={() => handleAgencyClick(item.agencyName)}
                className={`group relative p-2.5 sm:px-3.5 sm:py-2.5 rounded-lg border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-50/70 border-emerald-400 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/70'
                }`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleAgencyClick(item.agencyName);
                  }
                }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-4 mb-1.5">
                  
                  {/* Left: Agency Badge & Name */}
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
                        isSelected
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-700 group-hover:bg-slate-200'
                      }`}
                    >
                      {item.agencyCode}
                    </span>
                    <span
                      className={`text-xs sm:text-sm font-semibold truncate ${
                        isSelected ? 'text-emerald-950 font-bold' : 'text-slate-900'
                      }`}
                      title={item.agencyName}
                    >
                      {item.agencyName}
                    </span>
                    <span className="hidden md:inline-block text-[11px] text-slate-600 shrink-0">
                      • {item.category}
                    </span>
                  </div>

                  {/* Right: Count & Mini Metrics */}
                  <div className="flex items-center gap-3 self-end sm:self-auto shrink-0 text-xs">
                    {item.needsAttention > 0 && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        {item.needsAttention} attention
                      </span>
                    )}

                    <div className="flex items-baseline gap-1.5">
                      <span
                        className={`font-bold text-sm ${
                          isSelected ? 'text-emerald-800' : 'text-slate-900'
                        }`}
                      >
                        {item.totalProjects}
                      </span>
                      <span className="text-[11px] text-slate-600">
                        {item.totalProjects === 1 ? 'project' : 'projects'}
                      </span>
                      <span className="text-[11px] text-slate-600 hidden sm:inline">
                        ({item.percentageOfPortfolio}%)
                      </span>
                    </div>

                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded transition-colors ${
                        isSelected
                          ? 'bg-emerald-700 text-white'
                          : 'bg-slate-100 text-slate-600 group-hover:bg-emerald-600 group-hover:text-white'
                      }`}
                    >
                      {isSelected ? 'Selected' : 'Filter'}
                    </span>
                  </div>
                </div>

                {/* Proportional Bar */}
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden flex items-center">
                  {item.totalProjects > 0 ? (
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isSelected
                          ? 'bg-emerald-600'
                          : 'bg-emerald-500 group-hover:bg-emerald-600'
                      }`}
                      style={{ width: `${barWidthPercent}%` }}
                    />
                  ) : (
                    <div className="h-full w-1 bg-slate-300 rounded-full" />
                  )}
                </div>

                {/* Sub-breakdown: in progress / completed / delayed chips when projects exist */}
                {item.totalProjects > 0 && (
                  <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-600">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      In Progress: {item.inProgress}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Completed: {item.completed}
                    </span>
                    {item.delayed > 0 && (
                      <span className="flex items-center gap-1 text-rose-600 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        Delayed: {item.delayed}
                      </span>
                    )}
                    <span className="ml-auto text-[11px] text-slate-600 hidden sm:inline">
                      Avg. Completion: <strong className="text-slate-800">{item.averageProgress}%</strong>
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="divide-y divide-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <th className="py-2.5 px-4 font-semibold">Lead Agency</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Category</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Projects</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Share</th>
                  <th className="py-2.5 px-3 font-semibold">Status Breakdown</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Avg Progress</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedStats.map((item) => {
                  const isSelected = selectedLeadAgency === item.agencyName;

                  return (
                    <tr
                      key={item.agencyName}
                      onClick={() => handleAgencyClick(item.agencyName)}
                      className={`hover:bg-slate-50/80 cursor-pointer transition-colors ${
                        isSelected ? 'bg-emerald-50/60 font-medium' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              isSelected
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {item.agencyCode}
                          </span>
                          <span className="font-semibold text-slate-900">{item.agencyName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center text-slate-500">{item.category}</td>
                      <td className="py-3 px-3 text-center font-bold text-slate-900">
                        {item.totalProjects}
                      </td>
                      <td className="py-3 px-3 text-center text-slate-600">
                        {item.percentageOfPortfolio}%
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          {item.inProgress > 0 && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                              <PlayCircle className="w-2.5 h-2.5" />
                              {item.inProgress}
                            </span>
                          )}
                          {item.completed > 0 && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              {item.completed}
                            </span>
                          )}
                          {item.needsAttention > 0 && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-300 font-semibold">
                              <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
                              {item.needsAttention}
                            </span>
                          )}
                          {item.totalProjects === 0 && (
                            <span className="text-[11px] text-slate-400">None</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <span className="font-semibold text-slate-800">{item.averageProgress}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAgencyClick(item.agencyName);
                          }}
                          className={`text-xs px-2.5 py-1 rounded font-medium transition-colors ${
                            isSelected
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {isSelected ? 'Selected' : 'Filter'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Footer bar with portfolio overview note */}
      <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-slate-400" />
          <span>
            Showing projects led by individual ministries and departments. Partnering agencies are tracked under project details.
          </span>
        </div>
        {selectedLeadAgency !== 'ALL' && (
          <button
            type="button"
            onClick={() => onSelectLeadAgency('ALL')}
            className="text-emerald-700 hover:text-emerald-800 font-semibold hover:underline cursor-pointer"
          >
            Clear lead agency filter
          </button>
        )}
      </div>
    </div>
  );
};
