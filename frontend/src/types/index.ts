export type RoleName = 'ROLE_ADMIN' | 'ROLE_ANALYST' | 'ROLE_EMPLOYEE';

export type IncidentCategory =
  | 'PHISHING'
  | 'MALWARE'
  | 'UNAUTHORIZED_ACCESS'
  | 'DATA_BREACH'
  | 'DDOS_NETWORK'
  | 'INSIDER_THREAT'
  | 'VULNERABILITY'
  | 'OTHER';

export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type IncidentStatus =
  | 'REPORTED'
  | 'UNDER_INVESTIGATION'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'CLOSED';

export interface User {
  id: number;
  fullName: string;
  email: string;
  department: string;
  jobTitle: string;
  active: boolean;
  role: RoleName;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  user: User;
}

export interface Incident {
  id: number;
  incidentCode: string;
  title: string;
  description: string;
  category: IncidentCategory;
  severity: IncidentSeverity;
  status: IncidentStatus;
  affectedSystem: string;
  occurredAt: string;
  reporterId: number;
  reporterName: string;
  reporterEmail: string;
  reporterDepartment: string;
  reporterContact: string;
  assignedAnalystId?: number | null;
  assignedAnalystName?: string | null;
  assignedAnalystEmail?: string | null;
  assignedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InvestigationNote {
  id: number;
  incidentId: number;
  authorId: number;
  authorName: string;
  authorRole: RoleName;
  noteText: string;
  actionTaken?: string | null;
  createdAt: string;
}

export interface IncidentHistory {
  id: number;
  incidentId: number;
  changedById: number;
  changedByName: string;
  changedByRole: RoleName;
  actionType: string;
  fieldName?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  details: string;
  changedAt: string;
}

export interface MonthlyCount {
  month: string;
  count: number;
  criticalCount: number;
}

export interface DashboardStats {
  totalIncidents: number;
  openIncidents: number;
  criticalIncidents: number;
  resolvedIncidents: number;
  severityCounts: Record<IncidentSeverity, number>;
  statusCounts: Record<IncidentStatus, number>;
  categoryCounts: Record<string, number>;
  monthlyTrend: MonthlyCount[];
  recentIncidents: Incident[];
}

export interface ReportSummary {
  generatedAt: string;
  totalIncidents: number;
  openIncidents: number;
  resolvedOrClosedIncidents: number;
  resolutionRatePercent: number;
  bySeverity: Record<string, number>;
  byStatus: Record<string, number>;
  byCategory: Record<string, number>;
  monthlyStatistics: MonthlyCount[];
}

export type DataSourceMode = 'DEMO' | 'SPRING_BOOT';

export interface CreateIncidentPayload {
  title: string;
  description: string;
  category: IncidentCategory;
  severity: IncidentSeverity;
  affectedSystem: string;
  occurredAt: string;
  reporterContact: string;
}

export interface CreateUserPayload {
  fullName: string;
  email: string;
  password: string;
  department: string;
  jobTitle: string;
  role: RoleName;
}

export interface UpdateUserPayload {
  fullName: string;
  email: string;
  department: string;
  jobTitle: string;
  role: RoleName;
  active: boolean;
}
