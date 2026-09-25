import { Project } from '../types';
import { isProjectOverdue, hasActiveBlocker, getTodayString } from './dateUtils';

/**
 * Escapes a cell value for standard CSV formatting.
 * Encapsulates values in quotes, escapes internal quotes with double quotes,
 * and handles newlines, numbers, arrays, and nullish values cleanly.
 */
export function escapeCSVCell(value: any): string {
  if (value === null || value === undefined) {
    return '""';
  }

  if (Array.isArray(value)) {
    const joined = value.join(', ');
    return `"${joined.replace(/"/g, '""')}"`;
  }

  if (typeof value === 'boolean') {
    return value ? '"Ya"' : '"Tidak"';
  }

  if (typeof value === 'number') {
    return String(value);
  }

  const str = String(value);
  // Replace internal double quotes with two double quotes
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

/**
 * Triggers a browser file download for CSV content with UTF-8 BOM encoding.
 * The BOM (\uFEFF) ensures Microsoft Excel and macOS Numbers properly recognize
 * UTF-8 characters without mangling accents or special symbols.
 */
export function downloadCSV(csvContent: string, filename: string): void {
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates an Executive Progress & Milestone Summary CSV.
 * One row per project containing high-level milestone progress, target dates,
 * blockers, next actions, and chronological milestone update summaries.
 */
export function generateProjectsSummaryCSV(projects: Project[]): string {
  const headers = [
    'Project ID',
    'Project Title',
    'Lead Agency',
    'Participating Agencies',
    'Unit / Section',
    'Project Lead / Officer',
    'Assigned Team',
    'Status',
    'Progress (%)',
    'Start Date',
    'Target Completion Date',
    'Overdue Status',
    'Active Blocker',
    'Current Blocker / Issue Details',
    'Immediate Next Action',
    'Latest Milestone / Progress Update',
    'Last Updated Date',
    'Total Milestones Recorded',
    'Milestones History Summary'
  ];

  const rows: string[] = [];
  rows.push(headers.map(escapeCSVCell).join(','));

  const today = getTodayString();

  projects.forEach((p) => {
    const overdue = isProjectOverdue(p, today);
    const blocked = hasActiveBlocker(p);
    
    // Format chronological milestone history into a compact, executive-readable string
    const historySummary = (p.history || [])
      .map((h) => `[${h.date} | ${h.progressPercentage}% | ${h.status}]: ${h.progressUpdate || 'Tiada nota'}${h.issueBlocker ? ` (Isu: ${h.issueBlocker})` : ''}`)
      .join(' ; ');

    const row = [
      p.id,
      p.title,
      p.leadAgency,
      p.participatingAgencies || [],
      p.unitSection || '—',
      p.projectLead || 'Unassigned',
      p.assignedTeam || '—',
      p.status,
      p.progressPercentage ?? 0,
      p.startDate || '—',
      p.targetCompletionDate || '—',
      overdue ? 'Overdue (Lewat)' : 'On Schedule (Mengikut Jadual)',
      blocked ? 'Active Blocker (Ada Halangan)' : 'None (Tiada)',
      p.currentIssueBlocker || 'Tiada halangan aktif',
      p.nextAction || 'Penyelarasan berterusan',
      p.latestProgressUpdate || 'Tiada kemas kini terkini',
      p.lastUpdatedDate || '—',
      p.history ? p.history.length : 0,
      historySummary || 'Tiada sejarah rekod kemajuan'
    ];

    rows.push(row.map(escapeCSVCell).join(','));
  });

  return rows.join('\r\n');
}

/**
 * Generates a Detailed Milestones Audit CSV.
 * Outputs individual rows for each milestone and progress update recorded in the
 * project's history log, perfect for in-depth executive oversight.
 */
export function generateMilestonesDetailedCSV(projects: Project[]): string {
  const headers = [
    'Project ID',
    'Project Title',
    'Lead Agency',
    'Unit / Section',
    'Project Status (Overall)',
    'Overall Progress (%)',
    'Milestone Record Date',
    'Progress at Milestone (%)',
    'Status at Milestone',
    'Milestone / Progress Description',
    'Reported Blocker / Issue',
    'Next Planned Action',
    'Recorded By Officer',
    'Target Completion Date'
  ];

  const rows: string[] = [];
  rows.push(headers.map(escapeCSVCell).join(','));

  projects.forEach((p) => {
    if (!p.history || p.history.length === 0) {
      // If no historical updates yet, output the initial milestone status as 1 baseline row
      const baselineRow = [
        p.id,
        p.title,
        p.leadAgency,
        p.unitSection || '—',
        p.status,
        p.progressPercentage ?? 0,
        p.startDate || p.lastUpdatedDate || '—',
        p.progressPercentage ?? 0,
        p.status,
        p.latestProgressUpdate || p.description || 'Pendaftaran inisiatif projek',
        p.currentIssueBlocker || 'Tiada halangan',
        p.nextAction || 'Pelaksanaan fasa awal',
        p.projectLead || 'Sistem',
        p.targetCompletionDate || '—'
      ];
      rows.push(baselineRow.map(escapeCSVCell).join(','));
    } else {
      // Sort updates chronologically (newest first or oldest first)
      const sortedHistory = [...p.history].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      sortedHistory.forEach((h) => {
        const row = [
          p.id,
          p.title,
          p.leadAgency,
          p.unitSection || '—',
          p.status,
          p.progressPercentage ?? 0,
          h.date || '—',
          h.progressPercentage ?? 0,
          h.status || p.status,
          h.progressUpdate || '—',
          h.issueBlocker || 'Tiada',
          h.nextAction || '—',
          h.recordedBy || p.projectLead || 'Pegawai Bertanggungjawab',
          p.targetCompletionDate || '—'
        ];
        rows.push(row.map(escapeCSVCell).join(','));
      });
    }
  });

  return rows.join('\r\n');
}

/**
 * High-level export helper for executive summary
 */
export function exportProjectsToCSV(
  projects: Project[], 
  options: { isDetailed?: boolean; isFiltered?: boolean } = {}
): { filename: string; count: number } {
  const today = getTodayString();
  const suffix = options.isFiltered ? 'Ditapis' : 'Semua';

  if (options.isDetailed) {
    const filename = `KPSTI_Milestones_Terperinci_${suffix}_${today}.csv`;
    const csvData = generateMilestonesDetailedCSV(projects);
    downloadCSV(csvData, filename);
    return { filename, count: projects.length };
  } else {
    const filename = `KPSTI_Ringkasan_Kemajuan_Projek_${suffix}_${today}.csv`;
    const csvData = generateProjectsSummaryCSV(projects);
    downloadCSV(csvData, filename);
    return { filename, count: projects.length };
  }
}
