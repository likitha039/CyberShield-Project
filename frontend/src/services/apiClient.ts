import {
  DEMO_HISTORY,
  DEMO_INCIDENTS,
  DEMO_NOTES,
  DEMO_USERS,
  type DemoUserRecord,
} from '../data/demoData';
import type {
  AuthResponse,
  CreateIncidentPayload,
  CreateUserPayload,
  DashboardStats,
  DataSourceMode,
  Incident,
  IncidentCategory,
  IncidentHistory,
  IncidentSeverity,
  IncidentStatus,
  InvestigationNote,
  MonthlyCount,
  ReportSummary,
  UpdateUserPayload,
  User,
} from '../types';

const DEFAULT_API_BASE =
  (typeof import.meta !== 'undefined' &&
    (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_API_BASE_URL) ||
  'http://localhost:8080/api';

const TOKEN_STORAGE_KEY = 'cybershield_jwt_token';
const MODE_STORAGE_KEY = 'cybershield_data_mode';

// In-memory demonstration store (only used when DataSourceMode === 'DEMO')
let demoUsers: DemoUserRecord[] = DEMO_USERS.map((u) => ({ ...u }));
let demoIncidents: Incident[] = DEMO_INCIDENTS.map((i) => ({ ...i }));
let demoNotes: InvestigationNote[] = DEMO_NOTES.map((n) => ({ ...n }));
let demoHistory: IncidentHistory[] = DEMO_HISTORY.map((h) => ({ ...h }));
let demoCurrentUser: User | null = null;

export function getStoredMode(): DataSourceMode {
  const saved = localStorage.getItem(MODE_STORAGE_KEY);
  return saved === 'SPRING_BOOT' ? 'SPRING_BOOT' : 'DEMO';
}

export function setStoredMode(mode: DataSourceMode): void {
  localStorage.setItem(MODE_STORAGE_KEY, mode);
}

export function getApiBaseUrl(): string {
  return DEFAULT_API_BASE;
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function clearSessionStorage(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  demoCurrentUser = null;
}

async function springFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${DEFAULT_API_BASE}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error(
      `Cannot reach Spring Boot backend at ${DEFAULT_API_BASE}. Ensure MySQL & Maven backend are running locally, or switch to Demonstration Mode.`
    );
  }

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const body = await response.json();
      if (body?.validationErrors) {
        const details = Object.entries(body.validationErrors)
          .map(([k, v]) => `${k}: ${v}`)
          .join('; ');
        errorMessage = details || body.message || errorMessage;
      } else if (body?.message) {
        errorMessage = body.message;
      }
    } catch {
      // Fallback to status message
    }
    throw new Error(errorMessage);
  }

  return (await response.json()) as T;
}

function stripPassword(record: DemoUserRecord): User {
  const { demoPassword: _ignored, ...user } = record;
  return user;
}

function requireDemoUser(): User {
  if (!demoCurrentUser) {
    throw new Error('Authentication required in Demonstration Mode.');
  }
  return demoCurrentUser;
}

function formatMonthLabel(isoDate: string): string {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return 'Unknown';
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function computeStatsFromList(scoped: Incident[]): DashboardStats {
  const totalIncidents = scoped.length;
  const openIncidents = scoped.filter(
    (i) => i.status !== 'RESOLVED' && i.status !== 'CLOSED'
  ).length;
  const criticalIncidents = scoped.filter(
    (i) => i.severity === 'CRITICAL' && i.status !== 'RESOLVED' && i.status !== 'CLOSED'
  ).length;
  const resolvedIncidents = scoped.filter(
    (i) => i.status === 'RESOLVED' || i.status === 'CLOSED'
  ).length;

  const severityCounts: Record<IncidentSeverity, number> = {
    LOW: 0,
    MEDIUM: 0,
    HIGH: 0,
    CRITICAL: 0,
  };
  const statusCounts: Record<IncidentStatus, number> = {
    REPORTED: 0,
    UNDER_INVESTIGATION: 0,
    IN_PROGRESS: 0,
    RESOLVED: 0,
    CLOSED: 0,
  };
  const categoryCounts: Record<string, number> = {};
  const monthlyMap = new Map<string, { count: number; criticalCount: number }>();

  const sortedChronological = [...scoped].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  for (const inc of sortedChronological) {
    severityCounts[inc.severity]++;
    statusCounts[inc.status]++;
    categoryCounts[inc.category] = (categoryCounts[inc.category] || 0) + 1;

    const monthKey = formatMonthLabel(inc.createdAt);
    const entry = monthlyMap.get(monthKey) || { count: 0, criticalCount: 0 };
    entry.count++;
    if (inc.severity === 'CRITICAL') {
      entry.criticalCount++;
    }
    monthlyMap.set(monthKey, entry);
  }

  const monthlyTrend: MonthlyCount[] = Array.from(monthlyMap.entries()).map(
    ([month, vals]) => ({
      month,
      count: vals.count,
      criticalCount: vals.criticalCount,
    })
  );

  const recentIncidents = [...scoped]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  return {
    totalIncidents,
    openIncidents,
    criticalIncidents,
    resolvedIncidents,
    severityCounts,
    statusCounts,
    categoryCounts,
    monthlyTrend,
    recentIncidents,
  };
}

export const apiClient = {
  async checkSpringBootHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${DEFAULT_API_BASE.replace(/\/api$/, '')}/api-docs`, {
        method: 'GET',
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async login(
    email: string,
    password: string,
    mode: DataSourceMode
  ): Promise<AuthResponse> {
    if (mode === 'SPRING_BOOT') {
      const res = await springFetch<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem(TOKEN_STORAGE_KEY, res.token);
      return res;
    }

    const found = demoUsers.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase()
    );
    if (!found || found.demoPassword !== password) {
      throw new Error('Invalid email or password.');
    }
    if (!found.active) {
      throw new Error('This account has been deactivated by an administrator.');
    }
    const user = stripPassword(found);
    demoCurrentUser = user;
    return {
      token: 'demo-client-session-token',
      tokenType: 'Bearer',
      user,
    };
  },

  async register(
    payload: {
      fullName: string;
      email: string;
      password: string;
      department: string;
      jobTitle: string;
    },
    mode: DataSourceMode
  ): Promise<AuthResponse> {
    if (mode === 'SPRING_BOOT') {
      const res = await springFetch<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      localStorage.setItem(TOKEN_STORAGE_KEY, res.token);
      return res;
    }

    const normalizedEmail = payload.email.trim().toLowerCase();
    if (demoUsers.some((u) => u.email.toLowerCase() === normalizedEmail)) {
      throw new Error('An account with this email already exists.');
    }

    const nextId = Math.max(0, ...demoUsers.map((u) => u.id)) + 1;
    const newRecord: DemoUserRecord = {
      id: nextId,
      fullName: payload.fullName.trim(),
      email: normalizedEmail,
      demoPassword: payload.password,
      department: payload.department.trim() || 'General',
      jobTitle: payload.jobTitle.trim() || 'Staff Member',
      active: true,
      role: 'ROLE_EMPLOYEE',
      createdAt: new Date().toISOString(),
    };
    demoUsers = [newRecord, ...demoUsers];
    const user = stripPassword(newRecord);
    demoCurrentUser = user;
    return {
      token: 'demo-client-session-token',
      tokenType: 'Bearer',
      user,
    };
  },

  async getCurrentUser(mode: DataSourceMode): Promise<User> {
    if (mode === 'SPRING_BOOT') {
      return springFetch<User>('/auth/me');
    }
    return requireDemoUser();
  },

  async getDashboardStats(mode: DataSourceMode): Promise<DashboardStats> {
    if (mode === 'SPRING_BOOT') {
      return springFetch<DashboardStats>('/dashboard/stats');
    }
    const user = requireDemoUser();
    const scoped =
      user.role === 'ROLE_EMPLOYEE'
        ? demoIncidents.filter((i) => i.reporterId === user.id)
        : demoIncidents;
    return computeStatsFromList(scoped);
  },

  async getIncidents(
    params: {
      status?: IncidentStatus | '';
      severity?: IncidentSeverity | '';
      category?: IncidentCategory | '';
      search?: string;
      assignedToMe?: boolean;
    },
    mode: DataSourceMode
  ): Promise<Incident[]> {
    if (mode === 'SPRING_BOOT') {
      const query = new URLSearchParams();
      if (params.status) query.set('status', params.status);
      if (params.severity) query.set('severity', params.severity);
      if (params.category) query.set('category', params.category);
      if (params.search?.trim()) query.set('search', params.search.trim());
      if (params.assignedToMe) query.set('assignedToMe', 'true');
      const qs = query.toString();
      return springFetch<Incident[]>(`/incidents${qs ? `?${qs}` : ''}`);
    }

    const user = requireDemoUser();
    const searchLower = params.search?.trim().toLowerCase() || '';

    return demoIncidents
      .filter((inc) => {
        if (user.role === 'ROLE_EMPLOYEE' && inc.reporterId !== user.id) {
          return false;
        }
        if (
          user.role === 'ROLE_ANALYST' &&
          params.assignedToMe &&
          inc.assignedAnalystId !== user.id
        ) {
          return false;
        }
        if (params.status && inc.status !== params.status) return false;
        if (params.severity && inc.severity !== params.severity) return false;
        if (params.category && inc.category !== params.category) return false;
        if (searchLower) {
          const haystack = `${inc.incidentCode} ${inc.title} ${inc.affectedSystem} ${inc.description}`.toLowerCase();
          if (!haystack.includes(searchLower)) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async createIncident(
    payload: CreateIncidentPayload,
    mode: DataSourceMode
  ): Promise<Incident> {
    if (mode === 'SPRING_BOOT') {
      return springFetch<Incident>('/incidents', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    }

    const user = requireDemoUser();
    const nextId = Math.max(100, ...demoIncidents.map((i) => i.id)) + 1;
    const codeNumber = String(demoIncidents.length + 1).padStart(4, '0');
    const now = new Date().toISOString();

    const newIncident: Incident = {
      id: nextId,
      incidentCode: `INC-${new Date().getFullYear()}-${codeNumber}`,
      title: payload.title.trim(),
      description: payload.description.trim(),
      category: payload.category,
      severity: payload.severity,
      status: 'REPORTED',
      affectedSystem: payload.affectedSystem.trim(),
      occurredAt: payload.occurredAt,
      reporterId: user.id,
      reporterName: user.fullName,
      reporterEmail: user.email,
      reporterDepartment: user.department,
      reporterContact: payload.reporterContact.trim() || user.email,
      assignedAnalystId: null,
      assignedAnalystName: null,
      assignedAnalystEmail: null,
      assignedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    demoIncidents = [newIncident, ...demoIncidents];

    demoHistory = [
      {
        id: Math.max(0, ...demoHistory.map((h) => h.id)) + 1,
        incidentId: newIncident.id,
        changedById: user.id,
        changedByName: user.fullName,
        changedByRole: user.role,
        actionType: 'INCIDENT_CREATED',
        fieldName: 'status',
        oldValue: null,
        newValue: 'REPORTED',
        details: `Incident submitted with severity ${newIncident.severity}`,
        changedAt: now,
      },
      ...demoHistory,
    ];

    return newIncident;
  },

  async assignAnalyst(
    incidentId: number,
    analystId: number,
    assignmentNotes: string,
    mode: DataSourceMode
  ): Promise<Incident> {
    if (mode === 'SPRING_BOOT') {
      return springFetch<Incident>(`/incidents/${incidentId}/assign`, {
        method: 'POST',
        body: JSON.stringify({ analystId, assignmentNotes }),
      });
    }

    const admin = requireDemoUser();
    if (admin.role !== 'ROLE_ADMIN') {
      throw new Error('Only administrators can assign security analysts.');
    }
    const analyst = demoUsers.find((u) => u.id === analystId && u.role === 'ROLE_ANALYST');
    if (!analyst) {
      throw new Error('Selected security analyst was not found.');
    }
    if (!analyst.active) {
      throw new Error('Cannot assign an incident to a deactivated analyst.');
    }

    const target = demoIncidents.find((i) => i.id === incidentId);
    if (!target) throw new Error('Incident not found.');

    const previousAnalyst = target.assignedAnalystName || 'Unassigned';
    const now = new Date().toISOString();
    const oldStatus = target.status;

    target.assignedAnalystId = analyst.id;
    target.assignedAnalystName = analyst.fullName;
    target.assignedAnalystEmail = analyst.email;
    target.assignedAt = now;
    target.updatedAt = now;

    if (target.status === 'REPORTED') {
      target.status = 'UNDER_INVESTIGATION';
      demoHistory = [
        {
          id: Math.max(0, ...demoHistory.map((h) => h.id)) + 1,
          incidentId,
          changedById: admin.id,
          changedByName: admin.fullName,
          changedByRole: admin.role,
          actionType: 'STATUS_CHANGED',
          fieldName: 'status',
          oldValue: oldStatus,
          newValue: 'UNDER_INVESTIGATION',
          details: 'Automatically transitioned upon analyst assignment',
          changedAt: now,
        },
        ...demoHistory,
      ];
    }

    demoHistory = [
      {
        id: Math.max(0, ...demoHistory.map((h) => h.id)) + 1,
        incidentId,
        changedById: admin.id,
        changedByName: admin.fullName,
        changedByRole: admin.role,
        actionType: 'ANALYST_ASSIGNED',
        fieldName: 'assignedAnalyst',
        oldValue: previousAnalyst,
        newValue: analyst.fullName,
        details: assignmentNotes.trim() || `Assigned to ${analyst.fullName}`,
        changedAt: now,
      },
      ...demoHistory,
    ];

    return { ...target };
  },

  async updateIncidentStatus(
    incidentId: number,
    status: IncidentStatus,
    note: string,
    mode: DataSourceMode
  ): Promise<Incident> {
    if (mode === 'SPRING_BOOT') {
      return springFetch<Incident>(`/incidents/${incidentId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, note }),
      });
    }

    const actor = requireDemoUser();
    if (actor.role === 'ROLE_EMPLOYEE') {
      throw new Error('You do not have permission to update incident status.');
    }
    const target = demoIncidents.find((i) => i.id === incidentId);
    if (!target) throw new Error('Incident not found.');

    const oldStatus = target.status;
    if (oldStatus !== status) {
      const now = new Date().toISOString();
      target.status = status;
      target.updatedAt = now;

      demoHistory = [
        {
          id: Math.max(0, ...demoHistory.map((h) => h.id)) + 1,
          incidentId,
          changedById: actor.id,
          changedByName: actor.fullName,
          changedByRole: actor.role,
          actionType: 'STATUS_CHANGED',
          fieldName: 'status',
          oldValue: oldStatus,
          newValue: status,
          details: note.trim() || `Status updated from ${oldStatus} to ${status}`,
          changedAt: now,
        },
        ...demoHistory,
      ];
    }
    return { ...target };
  },

  async updateIncidentSeverity(
    incidentId: number,
    severity: IncidentSeverity,
    reason: string,
    mode: DataSourceMode
  ): Promise<Incident> {
    if (mode === 'SPRING_BOOT') {
      return springFetch<Incident>(`/incidents/${incidentId}/severity`, {
        method: 'PATCH',
        body: JSON.stringify({ severity, reason }),
      });
    }

    const actor = requireDemoUser();
    if (actor.role === 'ROLE_EMPLOYEE') {
      throw new Error('You do not have permission to change incident severity.');
    }
    const target = demoIncidents.find((i) => i.id === incidentId);
    if (!target) throw new Error('Incident not found.');

    const oldSeverity = target.severity;
    if (oldSeverity !== severity) {
      const now = new Date().toISOString();
      target.severity = severity;
      target.updatedAt = now;

      demoHistory = [
        {
          id: Math.max(0, ...demoHistory.map((h) => h.id)) + 1,
          incidentId,
          changedById: actor.id,
          changedByName: actor.fullName,
          changedByRole: actor.role,
          actionType: 'SEVERITY_CHANGED',
          fieldName: 'severity',
          oldValue: oldSeverity,
          newValue: severity,
          details: reason.trim() || `Severity updated from ${oldSeverity} to ${severity}`,
          changedAt: now,
        },
        ...demoHistory,
      ];
    }
    return { ...target };
  },

  async getInvestigationNotes(
    incidentId: number,
    mode: DataSourceMode
  ): Promise<InvestigationNote[]> {
    if (mode === 'SPRING_BOOT') {
      return springFetch<InvestigationNote[]>(`/incidents/${incidentId}/notes`);
    }
    return demoNotes
      .filter((n) => n.incidentId === incidentId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async addInvestigationNote(
    incidentId: number,
    noteText: string,
    actionTaken: string,
    mode: DataSourceMode
  ): Promise<InvestigationNote> {
    if (mode === 'SPRING_BOOT') {
      return springFetch<InvestigationNote>(`/incidents/${incidentId}/notes`, {
        method: 'POST',
        body: JSON.stringify({ noteText, actionTaken }),
      });
    }

    const actor = requireDemoUser();
    if (actor.role === 'ROLE_EMPLOYEE') {
      throw new Error('Only administrators and security analysts can add investigation notes.');
    }
    const now = new Date().toISOString();
    const newNote: InvestigationNote = {
      id: Math.max(0, ...demoNotes.map((n) => n.id)) + 1,
      incidentId,
      authorId: actor.id,
      authorName: actor.fullName,
      authorRole: actor.role,
      noteText: noteText.trim(),
      actionTaken: actionTaken.trim() || null,
      createdAt: now,
    };

    demoNotes = [newNote, ...demoNotes];
    demoHistory = [
      {
        id: Math.max(0, ...demoHistory.map((h) => h.id)) + 1,
        incidentId,
        changedById: actor.id,
        changedByName: actor.fullName,
        changedByRole: actor.role,
        actionType: 'NOTE_ADDED',
        fieldName: 'investigationNotes',
        oldValue: null,
        newValue: `Note #${newNote.id}`,
        details: actionTaken.trim()
          ? `Action recorded: ${actionTaken.trim()}`
          : 'Investigation note added',
        changedAt: now,
      },
      ...demoHistory,
    ];
    return newNote;
  },

  async getIncidentHistory(
    incidentId: number,
    mode: DataSourceMode
  ): Promise<IncidentHistory[]> {
    if (mode === 'SPRING_BOOT') {
      return springFetch<IncidentHistory[]>(`/incidents/${incidentId}/history`);
    }
    return demoHistory
      .filter((h) => h.incidentId === incidentId)
      .sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime());
  },

  async getAnalysts(mode: DataSourceMode): Promise<User[]> {
    if (mode === 'SPRING_BOOT') {
      return springFetch<User[]>('/users/analysts');
    }
    return demoUsers
      .filter((u) => u.role === 'ROLE_ANALYST' && u.active)
      .map(stripPassword);
  },

  async getUsers(mode: DataSourceMode): Promise<User[]> {
    if (mode === 'SPRING_BOOT') {
      return springFetch<User[]>('/users');
    }
    const actor = requireDemoUser();
    if (actor.role !== 'ROLE_ADMIN') {
      throw new Error('Only administrators can manage users.');
    }
    return demoUsers.map(stripPassword);
  },

  async createUser(payload: CreateUserPayload, mode: DataSourceMode): Promise<User> {
    if (mode === 'SPRING_BOOT') {
      return springFetch<User>('/users', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    }

    const actor = requireDemoUser();
    if (actor.role !== 'ROLE_ADMIN') {
      throw new Error('Only administrators can create users.');
    }
    const normalizedEmail = payload.email.trim().toLowerCase();
    if (demoUsers.some((u) => u.email.toLowerCase() === normalizedEmail)) {
      throw new Error(`A user with email ${normalizedEmail} already exists.`);
    }

    const newRecord: DemoUserRecord = {
      id: Math.max(0, ...demoUsers.map((u) => u.id)) + 1,
      fullName: payload.fullName.trim(),
      email: normalizedEmail,
      demoPassword: payload.password,
      department: payload.department.trim(),
      jobTitle: payload.jobTitle.trim(),
      role: payload.role,
      active: true,
      createdAt: new Date().toISOString(),
    };
    demoUsers = [newRecord, ...demoUsers];
    return stripPassword(newRecord);
  },

  async updateUser(
    userId: number,
    payload: UpdateUserPayload,
    mode: DataSourceMode
  ): Promise<User> {
    if (mode === 'SPRING_BOOT') {
      return springFetch<User>(`/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    }

    const actor = requireDemoUser();
    if (actor.role !== 'ROLE_ADMIN') {
      throw new Error('Only administrators can update users.');
    }
    if (userId === actor.id && !payload.active) {
      throw new Error('Administrators cannot deactivate their own active account.');
    }

    const normalizedEmail = payload.email.trim().toLowerCase();
    const conflict = demoUsers.find(
      (u) => u.email.toLowerCase() === normalizedEmail && u.id !== userId
    );
    if (conflict) {
      throw new Error(`Another user already uses email ${normalizedEmail}.`);
    }

    const target = demoUsers.find((u) => u.id === userId);
    if (!target) throw new Error('User not found.');

    target.fullName = payload.fullName.trim();
    target.email = normalizedEmail;
    target.department = payload.department.trim();
    target.jobTitle = payload.jobTitle.trim();
    target.role = payload.role;
    target.active = payload.active;

    return stripPassword(target);
  },

  async toggleUserStatus(
    userId: number,
    active: boolean,
    mode: DataSourceMode
  ): Promise<User> {
    if (mode === 'SPRING_BOOT') {
      return springFetch<User>(`/users/${userId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ active }),
      });
    }

    const actor = requireDemoUser();
    if (actor.role !== 'ROLE_ADMIN') {
      throw new Error('Only administrators can change account status.');
    }
    if (userId === actor.id && !active) {
      throw new Error('Administrators cannot deactivate their own account.');
    }
    const target = demoUsers.find((u) => u.id === userId);
    if (!target) throw new Error('User not found.');
    target.active = active;
    return stripPassword(target);
  },

  async getReportSummary(mode: DataSourceMode): Promise<ReportSummary> {
    if (mode === 'SPRING_BOOT') {
      return springFetch<ReportSummary>('/reports/summary');
    }

    const actor = requireDemoUser();
    if (actor.role === 'ROLE_EMPLOYEE') {
      throw new Error('Reports are restricted to Administrators and Security Analysts.');
    }
    const stats = computeStatsFromList(demoIncidents);
    const rate =
      stats.totalIncidents === 0
        ? 0
        : Math.round((stats.resolvedIncidents / stats.totalIncidents) * 1000) / 10;

    return {
      generatedAt: new Date().toISOString(),
      totalIncidents: stats.totalIncidents,
      openIncidents: stats.openIncidents,
      resolvedOrClosedIncidents: stats.resolvedIncidents,
      resolutionRatePercent: rate,
      bySeverity: stats.severityCounts,
      byStatus: stats.statusCounts,
      byCategory: stats.categoryCounts,
      monthlyStatistics: stats.monthlyTrend,
    };
  },
};
