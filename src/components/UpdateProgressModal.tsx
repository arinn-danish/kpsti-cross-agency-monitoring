import React, { useState } from 'react';
import { Project, ProjectStatus, ProgressUpdate } from '../types';
import { getTodayString, formatDate } from '../utils/dateUtils';
import { X, Edit3, AlertCircle, AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react';

interface UpdateProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onProgressUpdated: (updatedProject: Project) => void;
}

export const UpdateProgressModal: React.FC<UpdateProgressModalProps> = ({
  isOpen,
  onClose,
  project,
  onProgressUpdated,
}) => {
  const today = getTodayString();

  const [progressPercentage, setProgressPercentage] = useState<number>(project.progressPercentage || 0);
  const [status, setStatus] = useState<ProjectStatus>(project.status || 'In Progress');
  const [progressUpdate, setProgressUpdate] = useState<string>('');
  const [currentIssueBlocker, setCurrentIssueBlocker] = useState<string>(project.currentIssueBlocker || '');
  const [nextAction, setNextAction] = useState<string>(project.nextAction || '');

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  if (!isOpen) return null;

  const validate = (): boolean => {
    const errs: { [key: string]: string } = {};

    if (isNaN(progressPercentage) || progressPercentage < 0 || progressPercentage > 100) {
      errs.progressPercentage = 'Progress percentage must be between 0 and 100.';
    }

    if (!progressUpdate.trim()) {
      errs.progressUpdate = 'Please describe the latest progress achievements or update details.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const newHistoryEntry: ProgressUpdate = {
      id: `upd-${Date.now()}`,
      date: today,
      progressPercentage: Number(progressPercentage),
      status,
      progressUpdate: progressUpdate.trim(),
      issueBlocker: currentIssueBlocker.trim(),
      nextAction: nextAction.trim(),
      recordedBy: project.projectLead || 'Project Officer'
    };

    // If status is set to Completed and progress is not 100, we can recommend 100 or keep as is
    const updatedPercentage = status === 'Completed' && progressPercentage < 100 ? 100 : Number(progressPercentage);

    const updatedProject: Project = {
      ...project,
      progressPercentage: updatedPercentage,
      status,
      latestProgressUpdate: progressUpdate.trim(),
      currentIssueBlocker: currentIssueBlocker.trim(),
      nextAction: nextAction.trim(),
      lastUpdatedDate: today,
      history: [
        ...(project.history || []),
        newHistoryEntry
      ]
    };

    onProgressUpdated(updatedProject);
    onClose();
  };

  return (
    <div
      id="modal-update-progress-backdrop"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
    >
      <div
        id="modal-update-progress-container"
        className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-6 max-h-[90vh] flex flex-col"
      >
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-600 text-white">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Record Project Progress Update</h3>
              <p className="text-xs text-slate-400">
                {project.id}: {project.title}
              </p>
            </div>
          </div>
          <button
            id="btn-close-update-modal"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-5">
          
          {Object.keys(errors).length > 0 && (
            <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block mb-0.5">Please address the following:</strong>
                <ul className="list-disc pl-4 space-y-0.5">
                  {Object.values(errors).map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Quick info banner */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700 flex items-center justify-between">
            <div>
              <span className="text-slate-500">Lead Agency:</span>{' '}
              <strong className="text-slate-900">{project.leadAgency}</strong>
            </div>
            <div>
              <span className="text-slate-500">Update Date:</span>{' '}
              <strong className="text-slate-900">{formatDate(today)}</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Progress Percentage */}
            <div>
              <label htmlFor="update-progress-pct" className="block text-xs font-bold text-slate-800 mb-1">
                Current Progress Percentage (0 - 100) <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="update-progress-pct"
                  type="number"
                  min="0"
                  max="100"
                  value={progressPercentage}
                  onChange={(e) => setProgressPercentage(parseInt(e.target.value, 10))}
                  className={`w-full text-sm bg-slate-50 border rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    errors.progressPercentage ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                  }`}
                />
                <span className="text-sm font-bold text-slate-700">%</span>
              </div>
              {errors.progressPercentage && (
                <p className="text-xs text-rose-600 mt-1">{errors.progressPercentage}</p>
              )}
            </div>

            {/* Project Status */}
            <div>
              <label htmlFor="update-project-status" className="block text-xs font-bold text-slate-800 mb-1">
                Project Status <span className="text-rose-500">*</span>
              </label>
              <select
                id="update-project-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
              >
                <option value="In Progress">In Progress</option>
                <option value="Planning">Planning</option>
                <option value="On Hold">On Hold</option>
                <option value="Delayed">Delayed</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

          </div>

          {/* Progress Narrative */}
          <div>
            <label htmlFor="update-progress-desc" className="block text-xs font-bold text-slate-800 mb-1">
              Latest Progress Update & Key Milestones <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="update-progress-desc"
              rows={3}
              placeholder="Describe recent milestones completed, inter-agency agreements reached, or delivery metrics..."
              value={progressUpdate}
              onChange={(e) => setProgressUpdate(e.target.value)}
              className={`w-full text-sm bg-slate-50 border rounded-lg px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                errors.progressUpdate ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
              }`}
            />
            {errors.progressUpdate && (
              <p className="text-xs text-rose-600 mt-1">{errors.progressUpdate}</p>
            )}
          </div>

          {/* Issue / Blocker */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="update-issue-blocker" className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Current Issue / Blocker</span>
              </label>
              <span className="text-[11px] text-slate-400">Leave blank to clear resolved blockers</span>
            </div>
            <textarea
              id="update-issue-blocker"
              rows={2}
              placeholder="Detail any active procurement delays, inter-agency dependencies, or regulatory hurdles (leave empty if resolved)..."
              value={currentIssueBlocker}
              onChange={(e) => setCurrentIssueBlocker(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Next Action */}
          <div>
            <label htmlFor="update-next-action" className="block text-xs font-bold text-slate-800 mb-1">
              Next Action & Upcoming Steps
            </label>
            <textarea
              id="update-next-action"
              rows={2}
              placeholder="Specify the next immediate milestone, target deadline, or committee meeting..."
              value={nextAction}
              onChange={(e) => setNextAction(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-200 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5">
            <button
              id="btn-cancel-update-progress"
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              id="btn-submit-update-progress"
              type="submit"
              className="px-5 py-2 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-sm transition-colors flex items-center justify-center gap-1.5"
            >
              <TrendingUp className="w-4 h-4" />
              <span>Record & Save Update</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
