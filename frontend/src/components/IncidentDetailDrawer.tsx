import React, { useEffect, useState } from 'react';
import {
  X,
  UserCheck,
  FileText,
  History,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import type {
  DataSourceMode,
  Incident,
  IncidentHistory,
  IncidentSeverity,
  IncidentStatus,
  InvestigationNote,
  User,
} from '../types';
import { apiClient } from '../services/apiClient';
import {
  SeverityLabel,
  StatusLabel,
  formatCategoryLabel,
  formatDateTime,
  formatRoleLabel,
} from './SeverityAndStatus';

interface IncidentDetailDrawerProps {
  incident: Incident;
  currentUser: User;
  mode: DataSourceMode;
  onClose: () => void;
  onUpdated: (updated: Incident, message: string) => void;
}

export const IncidentDetailDrawer: React.FC<IncidentDetailDrawerProps> = ({
  incident,
  currentUser,
  mode,
  onClose,
  onUpdated,
}) => {
  const [notes, setNotes] = useState<InvestigationNote[]>([]);
  const [history, setHistory] = useState<IncidentHistory[]>([]);
  const [analysts, setAnalysts] = useState<User[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(true);

  const [selectedAnalystId, setSelectedAnalystId] = useState<string>(
    incident.assignedAnalystId ? String(incident.assignedAnalystId) : ''
  );
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [nextStatus, setNextStatus] = useState<IncidentStatus>(incident.status);
  const [statusNote, setStatusNote] = useState('');
  const [nextSeverity, setNextSeverity] = useState<IncidentSeverity>(
    incident.severity
  );
  const [severityReason, setSeverityReason] = useState('');
  const [noteText, setNoteText] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'notes' | 'history'>('notes');

  const isAdmin = currentUser.role === 'ROLE_ADMIN';
  const canInvestigate =
    currentUser.role === 'ROLE_ADMIN' || currentUser.role === 'ROLE_ANALYST';

  useEffect(() => {
    setSelectedAnalystId(
      incident.assignedAnalystId ? String(incident.assignedAnalystId) : ''
    );
    setNextStatus(incident.status);
    setNextSeverity(incident.severity);
  }, [incident]);

  const loadTimeline = async () => {
    setLoadingDetails(true);
    try {
      const [loadedNotes, loadedHistory] = await Promise.all([
        apiClient.getInvestigationNotes(incident.id, mode),
        apiClient.getIncidentHistory(incident.id, mode),
      ]);
      setNotes(loadedNotes);
      setHistory(loadedHistory);

      if (isAdmin) {
        const list = await apiClient.getAnalysts(mode);
        setAnalysts(list);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load investigation timeline.'
      );
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    loadTimeline();
  }, [incident.id, mode]);

  const handleAssignAnalyst = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAnalystId) {
      setError('Please select a Security Analyst to assign.');
      return;
    }
    setError(null);
    setBusyAction('assign');
    try {
      const updated = await apiClient.assignAnalyst(
        incident.id,
        Number(selectedAnalystId),
        assignmentNotes,
        mode
      );
      setAssignmentNotes('');
      await loadTimeline();
      onUpdated(updated, `Assigned ${updated.assignedAnalystName} to ${updated.incidentCode}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Assignment failed.');
    } finally {
      setBusyAction(null);
    }
  };

  const handleUpdateStatus = async () => {
    if (nextStatus === incident.status) return;
    setError(null);
    setBusyAction('status');
    try {
      const updated = await apiClient.updateIncidentStatus(
        incident.id,
        nextStatus,
        statusNote,
        mode
      );
      setStatusNote('');
      await loadTimeline();
      onUpdated(updated, `Status updated to ${updated.status.replace('_', ' ')}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Status update failed.');
    } finally {
      setBusyAction(null);
    }
  };

  const handleUpdateSeverity = async () => {
    if (nextSeverity === incident.severity) return;
    setError(null);
    setBusyAction('severity');
    try {
      const updated = await apiClient.updateIncidentSeverity(
        incident.id,
        nextSeverity,
        severityReason,
        mode
      );
      setSeverityReason('');
      await loadTimeline();
      onUpdated(updated, `Severity changed to ${updated.severity}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Severity update failed.');
    } finally {
      setBusyAction(null);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (noteText.trim().length < 5) {
      setError('Investigation note must be at least 5 characters.');
      return;
    }
    setError(null);
    setBusyAction('note');
    try {
      await apiClient.addInvestigationNote(
        incident.id,
        noteText,
        actionTaken,
        mode
      );
      setNoteText('');
      setActionTaken('');
      await loadTimeline();
      onUpdated(incident, 'Investigation note recorded');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save note.');
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-[2px]">
      <div className="w-full max-w-3xl bg-[#0B1221] border-l border-slate-800 h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-start justify-between gap-4 bg-[#0E172A]">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-400">
              <span className="font-mono text-blue-300 font-medium">
                {incident.incidentCode}
              </span>
              <span aria-hidden="true">·</span>
              <span>{formatCategoryLabel(incident.category)}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">{formatDateTime(incident.createdAt)}</span>
            </div>
            <h3 className="text-lg font-semibold text-white mt-1.5 leading-snug">
              {incident.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close incident details"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div
              role="alert"
              className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-200"
            >
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Summary Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-[#111B2E] border border-slate-800/90">
            <div>
              <p className="text-xs text-slate-400 mb-1.5">Severity</p>
              <SeverityLabel severity={incident.severity} />
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1.5">Status</p>
              <StatusLabel status={incident.status} />
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">Affected System</p>
              <p className="text-xs font-mono text-slate-200 break-all">
                {incident.affectedSystem}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">Observed At</p>
              <p className="text-xs font-mono text-slate-200">
                {formatDateTime(incident.occurredAt)}
              </p>
            </div>
          </div>

          {/* Description & Reporter */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Incident Description
            </h4>
            <p className="text-sm text-slate-200 leading-relaxed bg-[#111B2E] p-4 rounded-xl border border-slate-800/90">
              {incident.description}
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 px-1">
              <span>
                Reported by:{' '}
                <strong className="text-slate-200">{incident.reporterName}</strong>
              </span>
              <span aria-hidden="true">·</span>
              <span>{incident.reporterDepartment || 'General'}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">{incident.reporterContact}</span>
              <span aria-hidden="true">·</span>
              <span>
                Assigned Analyst:{' '}
                <strong className="text-slate-200">
                  {incident.assignedAnalystName || 'Unassigned'}
                </strong>
              </span>
            </div>
          </div>

          {/* Admin & Analyst Triage Controls */}
          {canInvestigate && (
            <div className="p-5 rounded-xl bg-[#111B2E] border border-slate-800/90 space-y-5">
              <h4 className="text-sm font-semibold text-white">
                Triage &amp; Response Controls
              </h4>

              {isAdmin && (
                <form
                  onSubmit={handleAssignAnalyst}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-3 pb-5 border-b border-slate-800/80"
                >
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">
                      Assign Security Analyst
                    </label>
                    <select
                      value={selectedAnalystId}
                      onChange={(e) => setSelectedAnalystId(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg bg-[#080E1A] border border-slate-700/80 text-slate-100 focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Select analyst...</option>
                      {analysts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.fullName} ({a.department})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">
                      Assignment Instructions
                    </label>
                    <input
                      type="text"
                      value={assignmentNotes}
                      onChange={(e) => setAssignmentNotes(e.target.value)}
                      placeholder="Optional triage guidance"
                      className="w-full px-3 py-2 text-xs rounded-lg bg-[#080E1A] border border-slate-700/80 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={busyAction === 'assign'}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-xs font-medium transition-colors cursor-pointer"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>
                        {busyAction === 'assign' ? 'Assigning...' : 'Assign Analyst'}
                      </span>
                    </button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Status Update */}
                <div className="space-y-2.5">
                  <label className="block text-xs font-medium text-slate-300">
                    Update Workflow Status
                  </label>
                  <select
                    value={nextStatus}
                    onChange={(e) =>
                      setNextStatus(e.target.value as IncidentStatus)
                    }
                    className="w-full px-3 py-2 text-xs rounded-lg bg-[#080E1A] border border-slate-700/80 text-slate-100 focus:outline-none focus:border-blue-500"
                  >
                    <option value="REPORTED">Reported</option>
                    <option value="UNDER_INVESTIGATION">Under Investigation</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                  <input
                    type="text"
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    placeholder="Reason for status change (optional)"
                    className="w-full px-3 py-2 text-xs rounded-lg bg-[#080E1A] border border-slate-700/80 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    disabled={
                      nextStatus === incident.status || busyAction === 'status'
                    }
                    onClick={handleUpdateStatus}
                    className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-45 text-slate-100 text-xs font-medium transition-colors cursor-pointer"
                  >
                    {busyAction === 'status' ? 'Saving...' : 'Apply Status'}
                  </button>
                </div>

                {/* Severity Update */}
                <div className="space-y-2.5">
                  <label className="block text-xs font-medium text-slate-300">
                    Adjust Severity Level
                  </label>
                  <select
                    value={nextSeverity}
                    onChange={(e) =>
                      setNextSeverity(e.target.value as IncidentSeverity)
                    }
                    className="w-full px-3 py-2 text-xs rounded-lg bg-[#080E1A] border border-slate-700/80 text-slate-100 focus:outline-none focus:border-blue-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                  <input
                    type="text"
                    value={severityReason}
                    onChange={(e) => setSeverityReason(e.target.value)}
                    placeholder="Justification for escalation/downgrade"
                    className="w-full px-3 py-2 text-xs rounded-lg bg-[#080E1A] border border-slate-700/80 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    disabled={
                      nextSeverity === incident.severity ||
                      busyAction === 'severity'
                    }
                    onClick={handleUpdateSeverity}
                    className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-45 text-slate-100 text-xs font-medium transition-colors cursor-pointer"
                  >
                    {busyAction === 'severity' ? 'Saving...' : 'Apply Severity'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Add Investigation Note (Admin & Analyst) */}
          {canInvestigate && (
            <form
              onSubmit={handleAddNote}
              className="p-5 rounded-xl bg-[#111B2E] border border-slate-800/90 space-y-3"
            >
              <h4 className="text-sm font-semibold text-white">
                Add Investigation Note &amp; Action Taken
              </h4>
              <textarea
                rows={3}
                required
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Document forensic findings, log analysis, IOCs, or root-cause evidence..."
                className="w-full px-3 py-2 text-xs rounded-lg bg-[#080E1A] border border-slate-700/80 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
              />
              <input
                type="text"
                value={actionTaken}
                onChange={(e) => setActionTaken(e.target.value)}
                placeholder="Containment / Remediation Action Taken (e.g., Isolated host on EDR, revoked token)"
                className="w-full px-3 py-2 text-xs rounded-lg bg-[#080E1A] border border-slate-700/80 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={busyAction === 'note'}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-xs font-medium transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>
                    {busyAction === 'note' ? 'Saving Note...' : 'Save Note'}
                  </span>
                </button>
              </div>
            </form>
          )}

          {/* Investigation Notes & History Tabs */}
          <div className="space-y-4">
            <div className="flex items-center gap-1 p-1 rounded-lg bg-[#111B2E] border border-slate-800/90 w-fit">
              <button
                type="button"
                onClick={() => setActiveTab('notes')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  activeTab === 'notes'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Investigation Notes ({notes.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  activeTab === 'history'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Audit History ({history.length})</span>
              </button>
            </div>

            {loadingDetails ? (
              <div className="h-28 rounded-xl bg-[#111B2E] border border-slate-800/80 animate-pulse" />
            ) : activeTab === 'notes' ? (
              notes.length === 0 ? (
                <div className="p-6 rounded-xl bg-[#111B2E] border border-slate-800/80 text-xs text-slate-400 text-center">
                  No investigation notes recorded for this incident yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {notes.map((n) => (
                    <div
                      key={n.id}
                      className="p-4 rounded-xl bg-[#111B2E] border border-slate-800/90 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>
                          <strong className="text-slate-200">{n.authorName}</strong>{' '}
                          · {formatRoleLabel(n.authorRole)}
                        </span>
                        <span className="font-mono">{formatDateTime(n.createdAt)}</span>
                      </div>
                      <p className="text-sm text-slate-200 leading-relaxed">
                        {n.noteText}
                      </p>
                      {n.actionTaken && (
                        <div className="pt-2 border-t border-slate-800/80 text-xs text-emerald-300">
                          <span className="text-slate-400">Action Taken: </span>
                          {n.actionTaken}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )
            ) : history.length === 0 ? (
              <div className="p-6 rounded-xl bg-[#111B2E] border border-slate-800/80 text-xs text-slate-400 text-center">
                No audit history entries found.
              </div>
            ) : (
              <div className="rounded-xl bg-[#111B2E] border border-slate-800/90 divide-y divide-slate-800/80">
                {history.map((h) => (
                  <div key={h.id} className="p-4 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-200">
                        {h.actionType.replace(/_/g, ' ')}
                      </span>
                      <span className="font-mono text-slate-400">
                        {formatDateTime(h.changedAt)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">{h.details}</p>
                    {(h.oldValue || h.newValue) && (
                      <p className="text-[11px] font-mono text-slate-400">
                        {h.oldValue ? `${h.oldValue} → ` : ''}
                        <span className="text-blue-300">{h.newValue}</span>
                      </p>
                    )}
                    <p className="text-[11px] text-slate-500">
                      By {h.changedByName} ({formatRoleLabel(h.changedByRole)})
                    </p>
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
