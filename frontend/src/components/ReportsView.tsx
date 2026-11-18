import React, { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import type { DataSourceMode, Incident, ReportSummary } from '../types';
import { apiClient } from '../services/apiClient';
import {
  HorizontalBreakdownChart,
  MonthlyTrendChart,
  buildCategoryChartItems,
  buildSeverityChartItems,
  buildStatusChartItems,
} from './Charts';
import { formatDateTime } from './SeverityAndStatus';

interface ReportsViewProps {
  mode: DataSourceMode;
  refreshKey: number;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  mode,
  refreshKey,
}) => {
  const [report, setReport] = useState<ReportSummary | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    Promise.all([
      apiClient.getReportSummary(mode),
      apiClient.getIncidents({}, mode),
    ])
      .then(([summary, list]) => {
        if (active) {
          setReport(summary);
          setIncidents(list);
        }
      })
      .catch((err) => {
        if (active)
          setError(
            err instanceof Error ? err.message : 'Unable to generate reports.'
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [mode, refreshKey]);

  const handleExportCsv = () => {
    if (incidents.length === 0) return;
    const headers = [
      'Incident Code',
      'Title',
      'Category',
      'Severity',
      'Status',
      'Affected System',
      'Reporter',
      'Assigned Analyst',
      'Occurred At',
      'Created At',
    ];
    const escapeCell = (val: string | null | undefined) => {
      const s = String(val ?? '');
      return `"${s.replace(/"/g, '""')}"`;
    };
    const rows = incidents.map((inc) =>
      [
        inc.incidentCode,
        inc.title,
        inc.category,
        inc.severity,
        inc.status,
        inc.affectedSystem,
        inc.reporterName,
        inc.assignedAnalystName || 'Unassigned',
        inc.occurredAt,
        inc.createdAt,
      ]
        .map(escapeCell)
        .join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cybershield-incident-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-32 rounded-xl bg-[#111B2E] border border-slate-800 animate-pulse" />
        <div className="h-64 rounded-xl bg-[#111B2E] border border-slate-800 animate-pulse" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="p-6 rounded-xl bg-[#111B2E] border border-red-500/30 text-sm text-red-200">
        {error || 'Unable to load reports.'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-white">
            Incident Reports &amp; Analytics
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Severity-wise, status-wise, category, and monthly incident metrics
            generated at{' '}
            <span className="font-mono text-slate-300">
              {formatDateTime(report.generatedAt)}
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={handleExportCsv}
          disabled={incidents.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Executive Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-[#111B2E] border border-slate-800/90">
          <p className="text-xs text-slate-400">Total Logged Incidents</p>
          <p className="text-3xl font-semibold text-white font-mono tabular-nums mt-2">
            {report.totalIncidents}
          </p>
        </div>
        <div className="p-5 rounded-xl bg-[#111B2E] border border-slate-800/90">
          <p className="text-xs text-slate-400">Active / Open Queue</p>
          <p className="text-3xl font-semibold text-sky-300 font-mono tabular-nums mt-2">
            {report.openIncidents}
          </p>
        </div>
        <div className="p-5 rounded-xl bg-[#111B2E] border border-slate-800/90">
          <p className="text-xs text-slate-400">Resolved or Closed</p>
          <p className="text-3xl font-semibold text-emerald-300 font-mono tabular-nums mt-2">
            {report.resolvedOrClosedIncidents}
          </p>
        </div>
        <div className="p-5 rounded-xl bg-[#111B2E] border border-slate-800/90">
          <p className="text-xs text-slate-400">Resolution Rate</p>
          <p className="text-3xl font-semibold text-white font-mono tabular-nums mt-2">
            {report.resolutionRatePercent}%
          </p>
        </div>
      </div>

      {/* Breakdown Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="p-6 rounded-xl bg-[#111B2E] border border-slate-800/90">
          <h3 className="text-base font-semibold text-white mb-1">
            Severity-Wise Report
          </h3>
          <p className="text-xs text-slate-400 mb-5">
            Incident volume grouped by risk classification
          </p>
          <HorizontalBreakdownChart
            items={buildSeverityChartItems(report.bySeverity)}
            total={report.totalIncidents}
          />
        </div>

        <div className="p-6 rounded-xl bg-[#111B2E] border border-slate-800/90">
          <h3 className="text-base font-semibold text-white mb-1">
            Status-Wise Report
          </h3>
          <p className="text-xs text-slate-400 mb-5">
            Distribution across incident lifecycle stages
          </p>
          <HorizontalBreakdownChart
            items={buildStatusChartItems(report.byStatus)}
            total={report.totalIncidents}
          />
        </div>

        <div className="p-6 rounded-xl bg-[#111B2E] border border-slate-800/90">
          <h3 className="text-base font-semibold text-white mb-1">
            Category Breakdown
          </h3>
          <p className="text-xs text-slate-400 mb-5">
            Threat vectors reported across the organization
          </p>
          <HorizontalBreakdownChart
            items={buildCategoryChartItems(report.byCategory)}
            total={report.totalIncidents}
          />
        </div>
      </div>

      {/* Monthly Statistics Chart & Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 p-6 rounded-xl bg-[#111B2E] border border-slate-800/90">
          <h3 className="text-base font-semibold text-white mb-1">
            Monthly Incident Trend
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Month-over-month reporting volume and critical escalations
          </p>
          <MonthlyTrendChart data={report.monthlyStatistics} />
        </div>

        <div className="rounded-xl bg-[#111B2E] border border-slate-800/90 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800/80">
            <h3 className="text-base font-semibold text-white">
              Monthly Tabular Summary
            </h3>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 text-xs text-slate-400 bg-[#0D1627]">
                <th className="py-2.5 px-4">Month</th>
                <th className="py-2.5 px-4 text-right">Total</th>
                <th className="py-2.5 px-4 text-right">Critical</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-xs font-mono tabular-nums">
              {report.monthlyStatistics.map((m) => (
                <tr key={m.month}>
                  <td className="py-2.5 px-4 text-slate-200">{m.month}</td>
                  <td className="py-2.5 px-4 text-right text-slate-100">
                    {m.count}
                  </td>
                  <td className="py-2.5 px-4 text-right text-red-300">
                    {m.criticalCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
