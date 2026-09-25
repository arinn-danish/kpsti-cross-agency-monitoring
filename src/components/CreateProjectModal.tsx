import React, { useState } from 'react';
import { Agency, Project, ProjectStatus } from '../types';
import { getTodayString } from '../utils/dateUtils';
import { X, Building2, Layers, AlertCircle, Plus, Calendar, CheckSquare, Square } from 'lucide-react';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  agencies: Agency[];
  onProjectCreated: (newProject: Project) => void;
  existingProjectCount: number;
  onOpenManageAgencies?: () => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  agencies,
  onProjectCreated,
  existingProjectCount,
  onOpenManageAgencies,
}) => {
  const today = getTodayString();

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [leadAgency, setLeadAgency] = useState(agencies[0]?.name || '');
  const [participatingAgencies, setParticipatingAgencies] = useState<string[]>([]);
  const [unitSection, setUnitSection] = useState('');
  const [projectLead, setProjectLead] = useState('');
  const [assignedTeam, setAssignedTeam] = useState('');
  const [startDate, setStartDate] = useState(today);
  const [targetCompletionDate, setTargetCompletionDate] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('In Progress');
  const [progressPercentage, setProgressPercentage] = useState<number>(0);
  const [initialProgressUpdate, setInitialProgressUpdate] = useState('');
  const [currentIssueBlocker, setCurrentIssueBlocker] = useState('');
  const [nextAction, setNextAction] = useState('');

  // Validation errors
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  if (!isOpen) return null;

  const toggleParticipatingAgency = (agencyName: string) => {
    if (participatingAgencies.includes(agencyName)) {
      setParticipatingAgencies(participatingAgencies.filter((a) => a !== agencyName));
    } else {
      setParticipatingAgencies([...participatingAgencies, agencyName]);
    }
  };

  const handleLeadAgencyChange = (newLead: string) => {
    setLeadAgency(newLead);
    // Remove from participating agencies if selected as lead
    setParticipatingAgencies(participatingAgencies.filter((a) => a !== newLead));
  };

  const validate = (): boolean => {
    const errs: { [key: string]: string } = {};

    if (!title.trim()) {
      errs.title = 'Project title is required.';
    }

    if (!description.trim()) {
      errs.description = 'Project objective or description is required.';
    }

    if (!leadAgency.trim()) {
      errs.leadAgency = 'Lead Agency/Department must be selected.';
    }

    if (!startDate) {
      errs.startDate = 'Start date is required.';
    }

    if (!targetCompletionDate) {
      errs.targetCompletionDate = 'Target completion date is required.';
    } else if (startDate && targetCompletionDate < startDate) {
      errs.targetCompletionDate = 'Target completion date cannot be earlier than start date.';
    }

    if (isNaN(progressPercentage) || progressPercentage < 0 || progressPercentage > 100) {
      errs.progressPercentage = 'Progress percentage must be a number between 0 and 100.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // Generate unique Project ID
    const year = new Date().getFullYear();
    const nextNum = String(existingProjectCount + 1).padStart(3, '0');
    const newId = `PRJ-${year}-${nextNum}`;

    const newProject: Project = {
      id: newId,
      title: title.trim(),
      description: description.trim(),
      leadAgency: leadAgency.trim(),
      participatingAgencies,
      unitSection: unitSection.trim(),
      projectLead: projectLead.trim(),
      assignedTeam: assignedTeam.trim(),
      startDate,
      targetCompletionDate,
      status,
      progressPercentage: Number(progressPercentage),
      latestProgressUpdate: initialProgressUpdate.trim() || 'Project registered in monitoring system.',
      currentIssueBlocker: currentIssueBlocker.trim(),
      nextAction: nextAction.trim(),
      lastUpdatedDate: today,
      history: [
        {
          id: `upd-${Date.now()}`,
          date: today,
          progressPercentage: Number(progressPercentage),
          status,
          progressUpdate: initialProgressUpdate.trim() || 'Initial project registration and baseline set.',
          issueBlocker: currentIssueBlocker.trim(),
          nextAction: nextAction.trim(),
          recordedBy: projectLead.trim() || 'System Registration'
        }
      ]
    };

    onProjectCreated(newProject);
    onClose();
  };

  return (
    <div
      id="modal-create-project-backdrop"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
    >
      <div
        id="modal-create-project-container"
        className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-6 max-h-[90vh] flex flex-col"
      >
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-600 text-white">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Register New Government Project</h3>
              <p className="text-xs text-slate-400">Record baseline governance, participating agencies, and milestones</p>
            </div>
          </div>
          <button
            id="btn-close-create-modal"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* General Validation Banner */}
          {Object.keys(errors).length > 0 && (
            <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block mb-1">Please correct the highlighted fields:</strong>
                <ul className="list-disc pl-4 space-y-0.5">
                  {Object.values(errors).map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Section: Project Identity */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1.5">
              1. Project Title & Objectives
            </h4>

            <div>
              <label htmlFor="create-project-title" className="block text-xs font-bold text-slate-800 mb-1">
                Project Title <span className="text-rose-500">*</span>
              </label>
              <input
                id="create-project-title"
                type="text"
                placeholder="e.g. Integrated National Citizen Digital Identity Portal"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`w-full text-sm bg-slate-50 border rounded-lg px-3.5 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  errors.title ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                }`}
              />
              {errors.title && <p className="text-xs text-rose-600 mt-1">{errors.title}</p>}
            </div>

            <div>
              <label htmlFor="create-project-desc" className="block text-xs font-bold text-slate-800 mb-1">
                Project Objective & Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="create-project-desc"
                rows={2}
                placeholder="State the core objective, scope, and target outcomes of the project..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={`w-full text-sm bg-slate-50 border rounded-lg px-3.5 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  errors.description ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                }`}
              />
              {errors.description && <p className="text-xs text-rose-600 mt-1">{errors.description}</p>}
            </div>
          </div>

          {/* Section: Governance & Cross-Agency Participation */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1.5">
              2. Agency Governance & Team
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Lead Agency */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="create-project-lead-agency" className="text-xs font-bold text-slate-800">
                    Lead Agency/Department <span className="text-rose-500">*</span>
                  </label>
                  {onOpenManageAgencies && (
                    <button
                      type="button"
                      onClick={onOpenManageAgencies}
                      className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 hover:underline"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Urus / Tambah Agensi</span>
                    </button>
                  )}
                </div>
                <select
                  id="create-project-lead-agency"
                  value={leadAgency}
                  onChange={(e) => handleLeadAgencyChange(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {agencies.map((agency) => (
                    <option key={agency.id} value={agency.name}>
                      {agency.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Unit / Section */}
              <div>
                <label htmlFor="create-project-unit" className="block text-xs font-bold text-slate-800 mb-1">
                  Unit / Section <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  id="create-project-unit"
                  type="text"
                  placeholder="e.g. Digital Identity Directorate"
                  value={unitSection}
                  onChange={(e) => setUnitSection(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Project Lead */}
              <div>
                <label htmlFor="create-project-lead-person" className="block text-xs font-bold text-slate-800 mb-1">
                  Project Lead Officer <span className="text-slate-400 font-normal">(Optional — leaves Unassigned if empty)</span>
                </label>
                <input
                  id="create-project-lead-person"
                  type="text"
                  placeholder="e.g. Director Eleanor Vance"
                  value={projectLead}
                  onChange={(e) => setProjectLead(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Assigned Team */}
              <div>
                <label htmlFor="create-project-team" className="block text-xs font-bold text-slate-800 mb-1">
                  Assigned Team / Members <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  id="create-project-team"
                  type="text"
                  placeholder="e.g. Core Engineering Taskforce, Data Office"
                  value={assignedTeam}
                  onChange={(e) => setAssignedTeam(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

            </div>

            {/* Participating Agencies Multi-Select */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-800">
                  Participating Agencies / Departments <span className="text-slate-400 font-normal">(Optional, select all that apply)</span>
                </label>
                <span className="text-[11px] text-slate-500">
                  {participatingAgencies.length} selected
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200 max-h-40 overflow-y-auto">
                {agencies
                  .filter((a) => a.name !== leadAgency)
                  .map((agency) => {
                    const isSelected = participatingAgencies.includes(agency.name);
                    return (
                      <button
                        key={`modal-partner-${agency.id}`}
                        type="button"
                        onClick={() => toggleParticipatingAgency(agency.name)}
                        className={`flex items-center gap-2 p-2 rounded text-left text-xs transition-colors border ${
                          isSelected
                            ? 'bg-emerald-50 text-emerald-950 border-emerald-300 font-semibold'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-700 font-bold shrink-0">
                          {agency.code}
                        </span>
                        <span className="truncate">{agency.name}</span>
                      </button>
                    );
                  })}
              </div>
            </div>

          </div>

          {/* Section: Timeline & Initial Status */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1.5">
              3. Timeline, Status & Progress
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Start Date */}
              <div>
                <label htmlFor="create-project-start-date" className="block text-xs font-bold text-slate-800 mb-1">
                  Start Date <span className="text-rose-500">*</span>
                </label>
                <input
                  id="create-project-start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={`w-full text-xs bg-slate-50 border rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    errors.startDate ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                  }`}
                />
                {errors.startDate && <p className="text-xs text-rose-600 mt-1">{errors.startDate}</p>}
              </div>

              {/* Target Completion Date */}
              <div>
                <label htmlFor="create-project-target-date" className="block text-xs font-bold text-slate-800 mb-1">
                  Target Completion Date <span className="text-rose-500">*</span>
                </label>
                <input
                  id="create-project-target-date"
                  type="date"
                  value={targetCompletionDate}
                  onChange={(e) => setTargetCompletionDate(e.target.value)}
                  className={`w-full text-xs bg-slate-50 border rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    errors.targetCompletionDate ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                  }`}
                />
                {errors.targetCompletionDate && (
                  <p className="text-xs text-rose-600 mt-1">{errors.targetCompletionDate}</p>
                )}
              </div>

              {/* Project Status */}
              <div>
                <label htmlFor="create-project-status" className="block text-xs font-bold text-slate-800 mb-1">
                  Project Status <span className="text-rose-500">*</span>
                </label>
                <select
                  id="create-project-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="Planning">Planning</option>
                  <option value="In Progress">In Progress</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Delayed">Delayed</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              {/* Progress Percentage */}
              <div>
                <label htmlFor="create-project-progress" className="block text-xs font-bold text-slate-800 mb-1">
                  Initial Progress Percentage (0 - 100) <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="create-project-progress"
                    type="number"
                    min="0"
                    max="100"
                    value={progressPercentage}
                    onChange={(e) => setProgressPercentage(parseInt(e.target.value, 10))}
                    className={`w-full text-xs bg-slate-50 border rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      errors.progressPercentage ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                    }`}
                  />
                  <span className="text-sm font-bold text-slate-700">%</span>
                </div>
                {errors.progressPercentage && (
                  <p className="text-xs text-rose-600 mt-1">{errors.progressPercentage}</p>
                )}
              </div>

            </div>

            {/* Optional Blockers & Next Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label htmlFor="create-project-blocker" className="block text-xs font-bold text-slate-800 mb-1">
                  Current Issue / Blocker <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  id="create-project-blocker"
                  rows={2}
                  placeholder="Record any active inter-agency blockers or regulatory delays..."
                  value={currentIssueBlocker}
                  onChange={(e) => setCurrentIssueBlocker(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="create-project-next-action" className="block text-xs font-bold text-slate-800 mb-1">
                  Immediate Next Action <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  id="create-project-next-action"
                  rows={2}
                  placeholder="Next scheduled milestone, steering session, or deployment..."
                  value={nextAction}
                  onChange={(e) => setNextAction(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

          </div>

          {/* Modal Footer Buttons */}
          <div className="pt-4 border-t border-slate-200 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5">
            <button
              id="btn-cancel-create-project"
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              id="btn-submit-create-project"
              type="submit"
              className="px-5 py-2 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-sm transition-colors flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Submit & Register Project</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
