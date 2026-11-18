import React, { useEffect, useState } from 'react';
import {
  AlertOctagon,
  ArrowUpRight,
  CheckCircle2,
  FolderOpen,
  Layers,
  Plus,
} from 'lucide-react';
import type { DashboardStats, DataSourceMode, Incident, User } from '../types';
import { apiClient } from '../services/apiClient';
import {
  HorizontalBreakdownChart,
  MonthlyTrendChart,
  buildSeverityChartItems,
  buildStatusChartItems,
} from './Charts';
import {
  SeverityLabel,
  StatusLabel,
  formatCategoryLabel,
  formatDateTime,
} from './SeverityAndStatus';

interface DashboardViewProps {
  currentUser: User;
  mode: DataSourceMode;
  refreshKey: number;
  onSelectIncident: (incident: Incident) => void;
  onNavigateToReport: () => void;
  onNavigateToIncidents: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentUser,
  mode,
  refreshKey,
  onSelectIncident,
  onNavigateToReport,
  onNavigateToIncidents,
}) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    apiClient
      .getDashboardStats(mode)
      .then((data) => {
        if (active) setStats(data);
      })
      .catch((err) => {
        if (active)
          setError(
            err instanceof Error ? err.message : 'Failed to load dashboard metrics.'
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [mode, refreshKey]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((k) => (
            <div
              key={k}
              className="h-28 rounded-xl bg-[#111B2E] border border-slate-800/90 animate-pulse"
            />
          ))}
        </div>
        <div className="h-72 rounded-xl bg-[#111B2E] border border-slate-800/90 animate-pulse" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-6 rounded-xl bg-[#111B2E] border border-red-500/30 text-sm text-red-200">
        {error || 'Unable to load dashboard statistics.'}
      </div>
    );
  }

  const scopeNotice =
    currentUser.role === 'ROLE_EMPLOYEE'
      ? 'Showing statistics for security incidents reported by your account.'
      : 'Organization-wide security incident metrics across all monitored systems.';

  const kpis = [
    {
      label: 'Total Incidents',
      value: stats.totalIncidents,
      sub: 'All recorded submissions',
      icon: <Layers className="w-4 h-4 text-blue-400" />,
    },
    {
      label: 'Open Incidents',
      value: stats.openIncidents,
      sub: 'Reported, investigating, or active',
      icon: <FolderOpen className="w-4 h-4 text-sky-400" />,
    },
    {
      label: 'Critical Incidents',
      value: stats.criticalIncidents,
      sub: 'Unresolved critical severity',
      icon: <AlertOctagon className="w-4 h-4 text-red-400" />,
    },
    {
      label: 'Resolved Incidents',
      value: stats.resolvedIncidents,
      sub: 'Resolved or closed cases',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-white">
            Security Overview
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">{scopeNotice}</p>
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

      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="p-5 rounded-xl bg-[#111B2E] border border-slate-800/90 flex flex-col justify-between gap-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">
                {kpi.label}
              </span>
              {kpi.icon}
            </div>
            <div>
              <p className="text-3xl font-semibold text-white font-mono tabular-nums">
                {kpi.value}
              </p>
              <p className="text-xs text-slate-500 mt-1">{kpi.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 p-6 rounded-xl bg-[#111B2E] border border-slate-800/90">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-white">
                Monthly Incident Volume
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Total submissions versus critical-severity escalations
              </p>
            </div>
          </div>
          <MonthlyTrendChart data={stats.monthlyTrend} />
        </div>

        <div className="p-6 rounded-xl bg-[#111B2E] border border-slate-800/90 space-y-6">
          <div>
            <h3 className="text-base font-semibold text-white">
              Severity Distribution
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 mb-4">
              Breakdown by assigned risk tier
            </p>
            <HorizontalBreakdownChart
              items={buildSeverityChartItems(stats.severityCounts)}
              total={stats.totalIncidents}
            />
          </div>

          <div className="pt-5 border-t border-slate-800/80">
            <h4 className="text-sm font-semibold text-white mb-3">
              Workflow Status
            </h4>
            <HorizontalBreakdownChart
              items={buildStatusChartItems(stats.statusCounts)}
              total={stats.totalIncidents}
            />
          </div>
        </div>
      </div>

      {/* Recent Incidents Table */}
      <div className="rounded-xl bg-[#111B2E] border border-slate-800/90 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-white">
              Recent Incidents
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Click any incident row to inspect investigation notes and history
            </p>
          </div>
          <button
            type="button"
            onClick={onNavigateToIncidents}
            className="inline-flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>View All Incidents</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {stats.recentIncidents.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <p className="text-sm text-slate-400">
              No incidents have been reported yet.
            </p>
            <button
              type="button"
              onClick={onNavigateToReport}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors cursor-pointer"
            >
              Submit First Incident
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/80 text-xs font-medium text-slate-400 bg-[#0D1627]">
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Incident Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Assigned Analyst</th>
                  <th className="py-3 px-4 text-right">Reported</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-sm">
                {stats.recentIncidents.map((inc) => (
                  <tr
                    key={inc.id}
                    onClick={() => onSelectIncident(inc)}
                    className="hover:bg-[#162238] transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4 font-mono text-xs text-blue-300 whitespace-nowrap">
                      {inc.incidentCode}
                    </td>
                    <td className="py-3 px-4 text-slate-100 font-medium max-w-xs truncate">
                      {inc.title}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-400 whitespace-nowrap">
                      {formatCategoryLabel(inc.category)}
                    </td>
                    <td className="py-3 px-4">
                      <SeverityLabel severity={inc.severity} />
                    </td>
                    <td className="py-3 px-4">
                      <StatusLabel status={inc.status} />
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-300 whitespace-nowrap">
                      {inc.assignedAnalystName || (
                        <span className="text-slate-500">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs font-mono text-slate-400 text-right whitespace-nowrap">
                      {formatDateTime(inc.createdAt)}
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
