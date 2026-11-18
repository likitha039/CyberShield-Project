import React from 'react';
import type { MonthlyCount } from '../types';
import { formatCategoryLabel, formatStatusLabel } from './SeverityAndStatus';

export const MonthlyTrendChart: React.FC<{ data: MonthlyCount[] }> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-56 flex items-center justify-center text-sm text-slate-400">
        No monthly incident records available yet.
      </div>
    );
  }

  const maxCount = Math.max(1, ...data.map((d) => d.count));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-5 text-xs text-slate-400">
        <span className="inline-flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-xs bg-blue-500 inline-block" />
          Total Incidents
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-xs bg-red-500 inline-block" />
          Critical Severity
        </span>
      </div>

      <div className="h-52 flex items-end gap-3 pt-4 border-b border-slate-800/80 pb-2 px-1">
        {data.map((item) => {
          const totalHeightPct = Math.max(8, Math.round((item.count / maxCount) * 100));
          const critHeightPct =
            item.criticalCount > 0
              ? Math.max(8, Math.round((item.criticalCount / maxCount) * 100))
              : 0;

          return (
            <div
              key={item.month}
              className="flex-1 flex flex-col items-center gap-2 group min-w-0"
            >
              <div className="w-full h-40 flex items-end justify-center gap-1.5">
                <div
                  title={`${item.month}: ${item.count} total incidents`}
                  className="w-full max-w-[26px] bg-blue-500/85 hover:bg-blue-400 transition-colors rounded-t relative flex justify-center"
                  style={{ height: `${totalHeightPct}%` }}
                >
                  <span className=" -top-5 absolute text-[11px] font-mono tabular-nums text-slate-300">
                    {item.count}
                  </span>
                </div>
                {item.criticalCount > 0 && (
                  <div
                    title={`${item.month}: ${item.criticalCount} critical incidents`}
                    className="w-full max-w-[16px] bg-red-500/85 hover:bg-red-400 transition-colors rounded-t relative flex justify-center"
                    style={{ height: `${critHeightPct}%` }}
                  >
                    <span className="-top-5 absolute text-[11px] font-mono tabular-nums text-red-300">
                      {item.criticalCount}
                    </span>
                  </div>
                )}
              </div>
              <span className="text-xs text-slate-400 truncate max-w-full font-mono">
                {item.month}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const HorizontalBreakdownChart: React.FC<{
  items: { key: string; label: string; count: number; colorClass: string }[];
  total: number;
}> = ({ items, total }) => {
  if (total === 0) {
    return (
      <div className="py-10 text-center text-sm text-slate-400">
        No incident metrics to display.
      </div>
    );
  }

  return (
    <div className="space-y-3.5">
      {items.map((item) => {
        const pct = Math.round((item.count / total) * 100);
        return (
          <div key={item.key} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-200 font-medium">{item.label}</span>
              <span className="font-mono tabular-nums text-slate-400">
                {item.count} <span className="text-slate-500">({pct}%)</span>
              </span>
            </div>
            <div className="h-2 w-full bg-slate-800/90 rounded-sm overflow-hidden">
              <div
                className={`h-full rounded-sm transition-all duration-300 ${item.colorClass}`}
                style={{ width: `${Math.max(pct, item.count > 0 ? 3 : 0)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export function buildSeverityChartItems(counts: Record<string, number>) {
  return [
    {
      key: 'CRITICAL',
      label: 'Critical',
      count: counts.CRITICAL || 0,
      colorClass: 'bg-red-500',
    },
    {
      key: 'HIGH',
      label: 'High',
      count: counts.HIGH || 0,
      colorClass: 'bg-orange-500',
    },
    {
      key: 'MEDIUM',
      label: 'Medium',
      count: counts.MEDIUM || 0,
      colorClass: 'bg-amber-500',
    },
    {
      key: 'LOW',
      label: 'Low',
      count: counts.LOW || 0,
      colorClass: 'bg-slate-400',
    },
  ];
}

export function buildStatusChartItems(counts: Record<string, number>) {
  const keys = [
    'REPORTED',
    'UNDER_INVESTIGATION',
    'IN_PROGRESS',
    'RESOLVED',
    'CLOSED',
  ];
  const colors: Record<string, string> = {
    REPORTED: 'bg-slate-400',
    UNDER_INVESTIGATION: 'bg-blue-500',
    IN_PROGRESS: 'bg-sky-400',
    RESOLVED: 'bg-emerald-500',
    CLOSED: 'bg-slate-600',
  };
  return keys.map((k) => ({
    key: k,
    label: formatStatusLabel(k),
    count: counts[k] || 0,
    colorClass: colors[k] || 'bg-blue-500',
  }));
}

export function buildCategoryChartItems(counts: Record<string, number>) {
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([key, count]) => ({
      key,
      label: formatCategoryLabel(key),
      count,
      colorClass: 'bg-blue-500',
    }));
}
