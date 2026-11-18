import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  ShieldAlert,
  FilePlus2,
  ClipboardCheck,
  Users,
  BarChart3,
  BookOpen,
  LogOut,
  Menu,
  X,
  Shield,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import type { DataSourceMode, Incident, User } from './types';
import {
  apiClient,
  clearSessionStorage,
  getStoredMode,
  getStoredToken,
  setStoredMode,
} from './services/apiClient';
import { AuthView } from './components/AuthView';
import { DashboardView } from './components/DashboardView';
import { IncidentsView } from './components/IncidentsView';
import { ReportIncidentView } from './components/ReportIncidentView';
import { IncidentDetailDrawer } from './components/IncidentDetailDrawer';
import { UsersView } from './components/UsersView';
import { ReportsView } from './components/ReportsView';
import { ArchitectureDocsView } from './components/ArchitectureDocsView';
import { formatRoleLabel } from './components/SeverityAndStatus';

type NavTab =
  | 'dashboard'
  | 'incidents'
  | 'report'
  | 'investigations'
  | 'users'
  | 'reports'
  | 'docs';

interface ToastMessage {
  id: number;
  text: string;
  type: 'success' | 'error';
}

export default function App() {
  const [mode, setMode] = useState<DataSourceMode>(() => getStoredMode());
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const notify = (text: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, text, type }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  };

  useEffect(() => {
    const restoreSession = async () => {
      if (mode === 'SPRING_BOOT' && getStoredToken()) {
        try {
          const user = await apiClient.getCurrentUser('SPRING_BOOT');
          setCurrentUser(user);
        } catch {
          clearSessionStorage();
        }
      }
      setInitializing(false);
    };
    restoreSession();
  }, []);

  const handleModeChange = (nextMode: DataSourceMode) => {
    setStoredMode(nextMode);
    setMode(nextMode);
    clearSessionStorage();
    setCurrentUser(null);
    setSelectedIncident(null);
  };

  const handleAuthenticated = (user: User) => {
    setCurrentUser(user);
    setActiveTab('dashboard');
    notify(`Signed in as ${user.fullName} (${formatRoleLabel(user.role)})`);
  };

  const handleLogout = () => {
    clearSessionStorage();
    setCurrentUser(null);
    setSelectedIncident(null);
    setActiveTab('dashboard');
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-[#080E1A] flex items-center justify-center text-sm text-slate-400">
        Loading CyberShield workspace...
      </div>
    );
  }

  if (!currentUser) {
    return (
      <AuthView
        mode={mode}
        onModeChange={handleModeChange}
        onAuthenticated={handleAuthenticated}
      />
    );
  }

  const isAdmin = currentUser.role === 'ROLE_ADMIN';
  const isAnalyst = currentUser.role === 'ROLE_ANALYST';
  const isEmployee = currentUser.role === 'ROLE_EMPLOYEE';

  const navItems: {
    id: NavTab;
    label: string;
    icon: React.ReactNode;
    visible: boolean;
  }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-4 h-4 shrink-0" />,
      visible: true,
    },
    {
      id: 'incidents',
      label: isEmployee ? 'My Reports' : 'All Incidents',
      icon: <ShieldAlert className="w-4 h-4 shrink-0" />,
      visible: true,
    },
    {
      id: 'report',
      label: 'Report Incident',
      icon: <FilePlus2 className="w-4 h-4 shrink-0" />,
      visible: true,
    },
    {
      id: 'investigations',
      label: 'Investigations',
      icon: <ClipboardCheck className="w-4 h-4 shrink-0" />,
      visible: isAdmin || isAnalyst,
    },
    {
      id: 'users',
      label: 'User Management',
      icon: <Users className="w-4 h-4 shrink-0" />,
      visible: isAdmin,
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: <BarChart3 className="w-4 h-4 shrink-0" />,
      visible: isAdmin || isAnalyst,
    },
    {
      id: 'docs',
      label: 'Backend & API Docs',
      icon: <BookOpen className="w-4 h-4 shrink-0" />,
      visible: true,
    },
  ];

  const visibleNav = navItems.filter((n) => n.visible);

  const tabTitles: Record<NavTab, string> = {
    dashboard: 'Dashboard',
    incidents: isEmployee ? 'My Submitted Incidents' : 'Incident Management',
    report: 'Report Incident',
    investigations: 'Active Investigations',
    users: 'User Management',
    reports: 'Reports & Analytics',
    docs: 'Backend & API Documentation',
  };

  const navigateTo = (tab: NavTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#080E1A] text-slate-100 flex">
      {/* Desktop Sidebar (260px) */}
      <aside className="hidden lg:flex lg:w-[260px] lg:flex-col lg:fixed lg:inset-y-0 bg-[#0B1221] border-r border-slate-800/80">
        <div className="h-16 px-6 flex items-center gap-2.5 border-b border-slate-800/80">
          <div className="w-8 h-8 rounded-lg bg-blue-600/15 border border-blue-500/30 flex items-center justify-center">
            <Shield className="w-4 h-4 text-blue-400" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-white">
            CyberShield
          </span>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          {visibleNav.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigateTo(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-[#111B2E]'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Honest Data-Source Banner */}
        <div className="mx-3 mb-3 p-3 rounded-lg bg-[#111B2E] border border-slate-800/90 text-xs space-y-1">
          <p className="font-medium text-slate-300">
            {mode === 'SPRING_BOOT'
              ? 'Spring Boot + MySQL API'
              : 'Demonstration Mode'}
          </p>
          <p className="text-[11px] text-slate-400 leading-snug">
            {mode === 'SPRING_BOOT'
              ? 'Connected to Java REST backend.'
              : 'Using client-side sample data (not persisted to MySQL).'}
          </p>
        </div>

        {/* User Footer */}
        <div className="p-4 border-t border-slate-800/80 space-y-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-100 truncate">
              {currentUser.fullName}
            </p>
            <p className="text-xs text-slate-400 truncate">
              {formatRoleLabel(currentUser.role)} ·{' '}
              {currentUser.department || 'Security'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-slate-800 hover:bg-[#111B2E] text-xs font-medium text-slate-300 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/70"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative w-72 max-w-[85vw] bg-[#0B1221] border-r border-slate-800 flex flex-col h-full z-10">
            <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <Shield className="w-5 h-5 text-blue-400" />
                <span className="text-lg font-semibold text-white">
                  CyberShield
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1">
              {visibleNav.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigateTo(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer ${
                    activeTab === item.id
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-[#111B2E]'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
            <div className="p-4 border-t border-slate-800">
              <p className="text-sm font-medium text-white">
                {currentUser.fullName}
              </p>
              <p className="text-xs text-slate-400 mb-3">
                {formatRoleLabel(currentUser.role)}
              </p>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full py-2 rounded-lg border border-slate-700 text-xs text-slate-200 cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-[260px] flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-16 px-4 sm:px-8 border-b border-slate-800/80 bg-[#080E1A]/95 backdrop-blur-sm sticky top-0 z-30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 rounded-lg border border-slate-800 text-slate-300 hover:bg-[#111B2E] cursor-pointer"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 text-sm truncate">
              <span className="text-slate-500 hidden sm:inline">CyberShield</span>
              <span className="text-slate-600 hidden sm:inline">/</span>
              <h1 className="font-semibold text-white truncate">
                {tabTitles[activeTab]}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <span className="hidden md:inline text-xs text-slate-400">
              {mode === 'DEMO'
                ? 'Sample Demonstration Data'
                : 'Spring Boot + MySQL'}
            </span>
            <button
              type="button"
              onClick={() => navigateTo('report')}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Report Incident
            </button>
          </div>
        </header>

        {/* Viewport */}
        <main className="flex-1 p-4 sm:p-8 max-w-[1360px] w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              currentUser={currentUser}
              mode={mode}
              refreshKey={refreshKey}
              onSelectIncident={setSelectedIncident}
              onNavigateToReport={() => navigateTo('report')}
              onNavigateToIncidents={() => navigateTo('incidents')}
            />
          )}

          {activeTab === 'incidents' && (
            <IncidentsView
              currentUser={currentUser}
              mode={mode}
              refreshKey={refreshKey}
              initialAssignedOnly={false}
              heading={
                isEmployee ? 'My Reported Incidents' : 'Incident Management'
              }
              subheading={
                isEmployee
                  ? 'Track the investigation status and audit updates of incidents you submitted.'
                  : 'Search, filter, assign analysts, and manage incident lifecycle states.'
              }
              onSelectIncident={setSelectedIncident}
              onNavigateToReport={() => navigateTo('report')}
            />
          )}

          {activeTab === 'investigations' && (isAdmin || isAnalyst) && (
            <IncidentsView
              currentUser={currentUser}
              mode={mode}
              refreshKey={refreshKey}
              initialAssignedOnly={isAnalyst}
              heading="Investigation Workbench"
              subheading={
                isAnalyst
                  ? 'Review incidents assigned to your queue, record forensic notes, and update status.'
                  : 'Oversee active security investigations, assignments, and remediation notes.'
              }
              onSelectIncident={setSelectedIncident}
              onNavigateToReport={() => navigateTo('report')}
            />
          )}

          {activeTab === 'report' && (
            <ReportIncidentView
              currentUser={currentUser}
              mode={mode}
              onSuccess={(created) => {
                setRefreshKey((k) => k + 1);
                notify(`Submitted incident ${created.incidentCode}`);
                setActiveTab('incidents');
                setSelectedIncident(created);
              }}
              onCancel={() => navigateTo('dashboard')}
            />
          )}

          {activeTab === 'users' && isAdmin && (
            <UsersView
              currentUser={currentUser}
              mode={mode}
              onNotify={notify}
            />
          )}

          {activeTab === 'reports' && (isAdmin || isAnalyst) && (
            <ReportsView mode={mode} refreshKey={refreshKey} />
          )}

          {activeTab === 'docs' && <ArchitectureDocsView />}
        </main>
      </div>

      {/* Incident Detail & Investigation Drawer */}
      {selectedIncident && (
        <IncidentDetailDrawer
          incident={selectedIncident}
          currentUser={currentUser}
          mode={mode}
          onClose={() => setSelectedIncident(null)}
          onUpdated={(updated, message) => {
            setSelectedIncident(updated);
            setRefreshKey((k) => k + 1);
            notify(message);
          }}
        />
      )}

      {/* Toast Notifications */}
      {toasts.length > 0 && (
        <div className="fixed bottom-5 right-5 z-50 space-y-2 max-w-sm">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`px-4 py-3 rounded-lg border text-xs font-medium flex items-center gap-2.5 shadow-lg ${
                t.type === 'error'
                  ? 'bg-[#1F1218] border-red-500/40 text-red-200'
                  : 'bg-[#0F1E2E] border-blue-500/40 text-slate-100'
              }`}
            >
              {t.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              <span>{t.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
