export type ProjectStatus = 'Planning' | 'In Progress' | 'On Hold' | 'Completed' | 'Delayed';

export interface Agency {
  id: string;
  name: string;
  code: string;
  category?: string;
  description?: string;
  isCustom?: boolean;
}

export interface AttachedFile {
  name: string;
  size: number;
  type: string;
  uploadedAt?: string;
  dataUrl?: string;
}

export interface ProgressUpdate {
  id: string;
  date: string; // YYYY-MM-DD
  progressPercentage: number;
  status: ProjectStatus;
  progressUpdate: string;
  issueBlocker?: string;
  nextAction?: string;
  recordedBy?: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  leadAgency: string; // Agency name
  participatingAgencies: string[]; // List of Agency names
  unitSection: string;
  projectLead: string; // empty string or 'Unassigned'
  assignedTeam: string; // empty string or 'Unassigned'
  startDate: string; // YYYY-MM-DD
  targetCompletionDate: string; // YYYY-MM-DD
  status: ProjectStatus;
  progressPercentage: number; // 0 - 100
  latestProgressUpdate: string;
  currentIssueBlocker: string;
  nextAction: string;
  lastUpdatedDate: string; // YYYY-MM-DD
  history: ProgressUpdate[];
  attachedFiles?: AttachedFile[];
  // Metadata for cloud persistence
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  creatorEmail?: string;
}

export interface DashboardStats {
  total: number;
  inProgress: number;
  completed: number;
  needsAttention: number;
  overdue: number;
}

export interface SubmissionLogItem {
  id: string;
  type: 'CREATE_PROJECT' | 'UPDATE_PROGRESS' | 'UPDATE_PROJECT' | 'DELETE_PROJECT' | 'MANAGE_AGENCY' | 'INITIALIZE_SAMPLE_DATA' | 'GEMINI_ASSISTANT_QUERY' | 'CHATBOT_QUERY' | 'EXPORT_CSV';
  projectId?: string;
  projectTitle?: string;
  userId: string;
  userEmail: string | null;
  userName: string | null;
  timestamp: string; // ISO string or formatted date
  createdAtIso?: string;
  details?: any;
  rawDoc?: any;
}

export interface ChatInlineChartData {
  type: 'bar' | 'line';
  title: string; // Short one-line summary displayed right above the chart (e.g. "Entries by category, last 30 days.")
  data: Array<{
    label: string;
    value: number;
    color?: string;
    secondaryValue?: number;
    secondaryLabel?: string;
  }>;
  unit?: string;
  layout?: 'horizontal' | 'vertical';
  summaryStats?: Array<{ label: string; value: string | number }>;
}
