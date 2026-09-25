import { Project } from '../types';

/**
 * Returns today's date in YYYY-MM-DD string format (using local date parts)
 */
export function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats YYYY-MM-DD into a human-readable date string e.g. "15 Oct 2026"
 */
export function formatDate(dateString: string | undefined): string {
  if (!dateString) return '—';
  const parts = dateString.split('-');
  if (parts.length !== 3) return dateString;
  const [year, month, day] = parts;
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  const mIndex = parseInt(month, 10) - 1;
  if (mIndex >= 0 && mIndex < 12) {
    return `${parseInt(day, 10)} ${monthNames[mIndex]} ${year}`;
  }
  return dateString;
}

/**
 * Checks if a project is overdue:
 * Target completion date is in the past compared to today (or reference date) AND status is not Completed.
 */
export function isProjectOverdue(project: Project, referenceDate: string = getTodayString()): boolean {
  if (project.status === 'Completed') return false;
  if (!project.targetCompletionDate) return false;
  // Lexicographical comparison for YYYY-MM-DD works reliably
  return project.targetCompletionDate < referenceDate;
}

/**
 * Checks if a project has an active unresolved blocker.
 */
export function hasActiveBlocker(project: Project): boolean {
  if (!project.currentIssueBlocker) return false;
  const trimmed = project.currentIssueBlocker.trim().toLowerCase();
  if (!trimmed || trimmed === 'none' || trimmed === 'nil' || trimmed === 'n/a' || trimmed === 'no active blockers') {
    return false;
  }
  return true;
}

/**
 * A project is considered 'Needs Attention' when:
 * 1. It has an unresolved blocker; OR
 * 2. It is overdue and not completed.
 */
export function doesProjectNeedAttention(project: Project, referenceDate: string = getTodayString()): boolean {
  return hasActiveBlocker(project) || isProjectOverdue(project, referenceDate);
}

/**
 * Calculates dashboard statistics dynamically from project dataset.
 */
export function calculateDashboardStats(projects: Project[], referenceDate: string = getTodayString()) {
  const total = projects.length;
  let inProgress = 0;
  let completed = 0;
  let needsAttention = 0;
  let overdue = 0;

  for (const p of projects) {
    if (p.status === 'Completed') {
      completed++;
    } else {
      if (p.status === 'In Progress') {
        inProgress++;
      }
      if (isProjectOverdue(p, referenceDate)) {
        overdue++;
      }
    }

    if (doesProjectNeedAttention(p, referenceDate)) {
      needsAttention++;
    }
  }

  return {
    total,
    inProgress,
    completed,
    needsAttention,
    overdue
  };
}
