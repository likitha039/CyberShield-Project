import React from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Info,
  Search,
  ShieldAlert,
  Archive,
} from 'lucide-react';
import type {
  IncidentCategory,
  IncidentSeverity,
  IncidentStatus,
  RoleName,
} from '../types';

export function formatRoleLabel(role: RoleName): string {
  switch (role) {
    case 'ROLE_ADMIN':
      return 'Administrator';
    case 'ROLE_ANALYST':
      return 'Security Analyst';
    case 'ROLE_EMPLOYEE':
      return 'Employee';
  }
}

export function formatCategoryLabel(category: IncidentCategory | string): string {
  switch (category) {
    case 'PHISHING':
      return 'Phishing';
    case 'MALWARE':
      return 'Malware';
    case 'UNAUTHORIZED_ACCESS':
      return 'Unauthorized Access';
    case 'DATA_BREACH':
      return 'Data Breach';
    case 'DDOS_NETWORK':
      return 'DDoS / Network';
    case 'INSIDER_THREAT':
      return 'Insider Threat';
    case 'VULNERABILITY':
      return 'Vulnerability';
    default:
      return 'Other';
  }
}

export function formatStatusLabel(status: IncidentStatus | string): string {
  switch (status) {
    case 'REPORTED':
      return 'Reported';
    case 'UNDER_INVESTIGATION':
      return 'Under Investigation';
    case 'IN_PROGRESS':
      return 'In Progress';
    case 'RESOLVED':
      return 'Resolved';
    case 'CLOSED':
      return 'Closed';
    default:
      return status;
  }
}

export function formatDateTime(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const SeverityLabel: React.FC<{ severity: IncidentSeverity }> = ({ severity }) => {
  const styles: Record<
    IncidentSeverity,
    { text: string; bg: string; border: string; icon: React.ReactNode }
  > = {
    CRITICAL: {
      text: 'text-red-300',
      bg: 'bg-red-500/12',
      border: 'border-red-500/30',
      icon: <AlertOctagon className="w-3.5 h-3.5 text-red-400 shrink-0" />,
    },
    HIGH: {
      text: 'text-orange-300',
      bg: 'bg-orange-500/12',
      border: 'border-orange-500/30',
      icon: <AlertTriangle className="w-3.5 h-3.5 text-orange-400 shrink-0" />,
    },
    MEDIUM: {
      text: 'text-amber-300',
      bg: 'bg-amber-500/12',
      border: 'border-amber-500/30',
      icon: <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />,
    },
    LOW: {
      text: 'text-slate-300',
      bg: 'bg-slate-500/15',
      border: 'border-slate-500/30',
      icon: <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />,
    },
  };

  const s = styles[severity];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded border whitespace-nowrap shrink-0 ${s.bg} ${s.border} ${s.text}`}
    >
      {s.icon}
      <span>{severity.charAt(0) + severity.slice(1).toLowerCase()}</span>
    </span>
  );
};

export const StatusLabel: React.FC<{ status: IncidentStatus }> = ({ status }) => {
  const styles: Record<
    IncidentStatus,
    { text: string; bg: string; border: string; icon: React.ReactNode }
  > = {
    REPORTED: {
      text: 'text-slate-200',
      bg: 'bg-slate-700/40',
      border: 'border-slate-600/50',
      icon: <Clock className="w-3.5 h-3.5 text-slate-300 shrink-0" />,
    },
    UNDER_INVESTIGATION: {
      text: 'text-blue-300',
      bg: 'bg-blue-500/12',
      border: 'border-blue-500/30',
      icon: <Search className="w-3.5 h-3.5 text-blue-400 shrink-0" />,
    },
    IN_PROGRESS: {
      text: 'text-sky-300',
      bg: 'bg-sky-500/12',
      border: 'border-sky-500/30',
      icon: <ShieldAlert className="w-3.5 h-3.5 text-sky-400 shrink-0" />,
    },
    RESOLVED: {
      text: 'text-emerald-300',
      bg: 'bg-emerald-500/12',
      border: 'border-emerald-500/30',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />,
    },
    CLOSED: {
      text: 'text-slate-400',
      bg: 'bg-slate-800/70',
      border: 'border-slate-700',
      icon: <Archive className="w-3.5 h-3.5 text-slate-400 shrink-0" />,
    },
  };

  const s = styles[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded border whitespace-nowrap shrink-0 ${s.bg} ${s.border} ${s.text}`}
    >
      {s.icon}
      <span>{formatStatusLabel(status)}</span>
    </span>
  );
};
