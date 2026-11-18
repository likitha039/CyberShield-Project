import React, { useState } from 'react';
import { AlertCircle, Send } from 'lucide-react';
import type {
  DataSourceMode,
  Incident,
  IncidentCategory,
  IncidentSeverity,
  User,
} from '../types';
import { apiClient } from '../services/apiClient';

interface ReportIncidentViewProps {
  currentUser: User;
  mode: DataSourceMode;
  onSuccess: (created: Incident) => void;
  onCancel: () => void;
}

export const ReportIncidentView: React.FC<ReportIncidentViewProps> = ({
  currentUser,
  mode,
  onSuccess,
  onCancel,
}) => {
  const defaultLocalDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<IncidentCategory>('PHISHING');
  const [severity, setSeverity] = useState<IncidentSeverity>('MEDIUM');
  const [affectedSystem, setAffectedSystem] = useState('');
  const [occurredAt, setOccurredAt] = useState(defaultLocalDateTime);
  const [reporterContact, setReporterContact] = useState(currentUser.email);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (title.trim().length < 5) {
      setError('Incident title must be at least 5 characters.');
      return;
    }
    if (!affectedSystem.trim()) {
      setError('Please specify the affected system, host, or application.');
      return;
    }
    if (description.trim().length < 10) {
      setError('Description must be at least 10 characters with clear observable details.');
      return;
    }

    setSubmitting(true);
    try {
      const normalizedDate =
        occurredAt.length === 16 ? `${occurredAt}:00` : occurredAt;
      const created = await apiClient.createIncident(
        {
          title,
          description,
          category,
          severity,
          affectedSystem,
          occurredAt: normalizedDate,
          reporterContact,
        },
        mode
      );
      onSuccess(created);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to submit incident.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">
          Report Cybersecurity Incident
        </h2>
        <p className="text-sm text-slate-400 mt-0.5">
          Submit suspected security events for immediate SOC triage and
          investigation tracking.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="p-6 sm:p-8 rounded-xl bg-[#111B2E] border border-slate-800/90 space-y-5"
      >
        {error && (
          <div
            role="alert"
            className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-200"
          >
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label
            htmlFor="inc-title"
            className="block text-xs font-medium text-slate-300 mb-1.5"
          >
            Incident Title
          </label>
          <input
            id="inc-title"
            type="text"
            required
            maxLength={200}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Suspicious outbound connection from build-agent-04"
            className="w-full px-3.5 py-2.5 text-sm rounded-lg bg-[#080E1A] border border-slate-700/80 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="inc-category"
              className="block text-xs font-medium text-slate-300 mb-1.5"
            >
              Incident Category
            </label>
            <select
              id="inc-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as IncidentCategory)}
              className="w-full px-3.5 py-2.5 text-sm rounded-lg bg-[#080E1A] border border-slate-700/80 text-slate-100 focus:outline-none focus:border-blue-500"
            >
              <option value="PHISHING">Phishing</option>
              <option value="MALWARE">Malware / Ransomware</option>
              <option value="UNAUTHORIZED_ACCESS">Unauthorized Access</option>
              <option value="DATA_BREACH">Data Exposure / Breach</option>
              <option value="DDOS_NETWORK">DDoS / Network Anomaly</option>
              <option value="INSIDER_THREAT">Insider Threat / Policy</option>
              <option value="VULNERABILITY">Software Vulnerability</option>
              <option value="OTHER">Other Security Event</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="inc-severity"
              className="block text-xs font-medium text-slate-300 mb-1.5"
            >
              Initial Severity Level
            </label>
            <select
              id="inc-severity"
              value={severity}
              onChange={(e) => setSeverity(e.target.value as IncidentSeverity)}
              className="w-full px-3.5 py-2.5 text-sm rounded-lg bg-[#080E1A] border border-slate-700/80 text-slate-100 focus:outline-none focus:border-blue-500"
            >
              <option value="LOW">Low — Minor or localized observation</option>
              <option value="MEDIUM">Medium — Moderate operational impact</option>
              <option value="HIGH">High — Significant security exposure</option>
              <option value="CRITICAL">
                Critical — Active breach or production outage
              </option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="inc-system"
              className="block text-xs font-medium text-slate-300 mb-1.5"
            >
              Affected System / Host / Service
            </label>
            <input
              id="inc-system"
              type="text"
              required
              maxLength={160}
              value={affectedSystem}
              onChange={(e) => setAffectedSystem(e.target.value)}
              placeholder="e.g., prod-auth-gateway-02 / FIN-LT-089"
              className="w-full px-3.5 py-2.5 text-sm rounded-lg bg-[#080E1A] border border-slate-700/80 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          <div>
            <label
              htmlFor="inc-occurred"
              className="block text-xs font-medium text-slate-300 mb-1.5"
            >
              Date &amp; Time Observed
            </label>
            <input
              id="inc-occurred"
              type="datetime-local"
              required
              value={occurredAt}
              onChange={(e) => setOccurredAt(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-lg bg-[#080E1A] border border-slate-700/80 text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>
        </div>

        {/* Reporter Details */}
        <div className="p-4 rounded-lg bg-[#0B1324] border border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-slate-400">Reporter Name</p>
            <p className="text-sm font-medium text-slate-200 mt-0.5">
              {currentUser.fullName}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Department</p>
            <p className="text-sm font-medium text-slate-200 mt-0.5">
              {currentUser.department || 'General'}
            </p>
          </div>
          <div>
            <label
              htmlFor="inc-contact"
              className="block text-xs text-slate-400 mb-1"
            >
              Reporter Contact (Email / Ext)
            </label>
            <input
              id="inc-contact"
              type="text"
              value={reporterContact}
              onChange={(e) => setReporterContact(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded bg-[#080E1A] border border-slate-700/80 text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="inc-desc"
            className="block text-xs font-medium text-slate-300 mb-1.5"
          >
            Incident Description &amp; Indicators
          </label>
          <textarea
            id="inc-desc"
            required
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what occurred, observed alerts, suspicious IPs/URLs, affected user accounts, and any immediate steps already taken..."
            className="w-full px-3.5 py-2.5 text-sm rounded-lg bg-[#080E1A] border border-slate-700/80 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 leading-relaxed"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-medium transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-medium transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>{submitting ? 'Submitting...' : 'Submit Incident'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
