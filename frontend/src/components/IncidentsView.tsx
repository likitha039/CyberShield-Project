import React, { useEffect, useState } from 'react';
import { Plus, Search, Filter, RotateCcw } from 'lucide-react';
import type {
  DataSourceMode,
  Incident,
  IncidentCategory,
  IncidentSeverity,
  IncidentStatus,
  User,
} from '../types';
import { apiClient } from '../services/apiClient';
import {
  SeverityLabel,
  StatusLabel,
  formatCategoryLabel,
  formatDateTime,
} from './SeverityAndStatus';

interface IncidentsViewProps {
  currentUser: User;
  mode: DataSourceMode;
  refreshKey: number;
  initialAssignedOnly?: boolean;
  heading: string;
  subheading: string;
  onSelectIncident: (incident: Incident) => void;
  onNavigateToReport: () => void;
}

export const IncidentsView: React.FC<IncidentsViewProps> = ({
  currentUser,
  mode,
  refreshKey,
  initialAssignedOnly = false,
  heading,
  subheading,
  onSelectIncident,
  onNavigateToReport,
}) => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<IncidentStatus | ''>('');
  const [severityFilter, setSeverityFilter] = useState<IncidentSeverity | ''>('');
  const [categoryFilter, setCategoryFilter] = useState<IncidentCategory | ''>('');
  const [assignedToMe, setAssignedToMe] = useState(initialAssignedOnly);

  useEffect(() => {
    setAssignedToMe(initialAssignedOnly);
  }, [initialAssignedOnly]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    apiClient
      .getIncidents(
        {
          status: statusFilter,
          severity: severityFilter,
          category: categoryFilter,
          search,
          assignedToMe,
        },
        mode
      )
      .then((data) => {
        if (active) setIncidents(data);
      })
      .catch((err) => {
        if (active)
          setError(
            err instanceof Error ? err.message : 'Unable to fetch incidents.'
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [
    mode,
    refreshKey,
    statusFilter,
    severityFilter,
    categoryFilter,
    search,
    assignedToMe,
  ]);

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('');
    setSeverityFilter('');
    setCategoryFilter('');
    setAssignedToMe(initialAssignedOnly);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-white">{heading}</h2>
          <p className="text-sm text-slate-400 mt-0.5">{subheading}</p>
        </div>
        <button
          type="button"
          onClick={onNavigateToReport}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Report Incident</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-xl bg-[#111B2E] border border-slate-800/90 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
          <div className="xl:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search code, title, or affected system..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-[#080E1A] border border-slate-700/80 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <select
            aria-label="Filter by Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as IncidentStatus | '')}
            className="px-3 py-2 text-sm rounded-lg bg-[#080E1A] border border-slate-700/80 text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="REPORTED">Reported</option>
            <option value="UNDER_INVESTIGATION">Under Investigation</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>

          <select
            aria-label="Filter by Severity"
            value={severityFilter}
            onChange={(e) =>
              setSeverityFilter(e.target.value as IncidentSeverity | '')
            }
            className="px-3 py-2 text-sm rounded-lg bg-[#080E1A] border border-slate-700/80 text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <select
            aria-label="Filter by Category"
            value={categoryFilter}
            onChange={(e) =>
              setCategoryFilter(e.target.value as IncidentCategory | '')
            }
            className="px-3 py-2 text-sm rounded-lg bg-[#080E1A] border border-slate-700/80 text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Categories</option>
            <option value="PHISHING">Phishing</option>
            <option value="MALWARE">Malware</option>
            <option value="UNAUTHORIZED_ACCESS">Unauthorized Access</option>
            <option value="DATA_BREACH">Data Breach</option>
            <option value="DDOS_NETWORK">DDoS / Network</option>
            <option value="INSIDER_THREAT">Insider Threat</option>
            <option value="VULNERABILITY">Vulnerability</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-mono tabular-nums text-slate-200">
                {incidents.length}
              </span>{' '}
              matching incident{incidents.length === 1 ? '' : 's'}
            </span>

            {currentUser.role === 'ROLE_ANALYST' && (
              <label className="inline-flex items-center gap-2 cursor-pointer text-slate-300 select-none">
                <input
                  type="checkbox"
                  checked={assignedToMe}
                  onChange={(e) => setAssignedToMe(e.target.checked)}
                  className="rounded border-slate-600 bg-[#080E1A] text-blue-600 focus:ring-blue-500"
                />
                <span>Assigned to me only</span>
              </label>
            )}
          </div>

          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        </div>
      </div>

      {/* Incidents Table */}
      <div className="rounded-xl bg-[#111B2E] border border-slate-800/90 overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3, 4].map((row) => (
              <div
                key={row}
                className="h-11 rounded bg-slate-800/50 animate-pulse"
              />
            ))}
          </div>
        ) : error ? (
          <div className="p-6 text-sm text-red-300">{error}</div>
        ) : incidents.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-sm text-slate-300 font-medium">
              No incidents match your current filters
            </p>
            <p className="text-xs text-slate-500">
              Try clearing active search or filter criteria, or submit a new
              incident report.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/80 text-xs font-medium text-slate-400 bg-[#0D1627]">
                  <th className="py-3 px-4">Incident ID</th>
                  <th className="py-3 px-4">Title &amp; Affected System</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Reporter</th>
                  <th className="py-3 px-4">Analyst</th>
                  <th className="py-3 px-4 text-right">Occurred</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-sm">
                {incidents.map((inc) => (
                  <tr
                    key={inc.id}
                    onClick={() => onSelectIncident(inc)}
                    className="hover:bg-[#162238] transition-colors cursor-pointer"
                  >
                    <td className="py-3.5 px-4 font-mono text-xs text-blue-300 whitespace-nowrap">
                      {inc.incidentCode}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="text-slate-100 font-medium truncate">
                        {inc.title}
                      </p>
                      <p className="text-xs font-mono text-slate-400 truncate mt-0.5">
                        {inc.affectedSystem}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-300 whitespace-nowrap">
                      {formatCategoryLabel(inc.category)}
                    </td>
                    <td className="py-3.5 px-4">
                      <SeverityLabel severity={inc.severity} />
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusLabel status={inc.status} />
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-300 whitespace-nowrap">
                      {inc.reporterName}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-300 whitespace-nowrap">
                      {inc.assignedAnalystName || (
                        <span className="text-slate-500">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono text-slate-400 text-right whitespace-nowrap">
                      {formatDateTime(inc.occurredAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
