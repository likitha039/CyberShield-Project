import React, { useState } from 'react';
import {
  Shield,
  Lock,
  Mail,
  User as UserIcon,
  Building2,
  Briefcase,
  ArrowRight,
  Database,
  AlertCircle,
} from 'lucide-react';
import type { DataSourceMode, User } from '../types';
import { apiClient, getApiBaseUrl } from '../services/apiClient';

interface AuthViewProps {
  mode: DataSourceMode;
  onModeChange: (mode: DataSourceMode) => void;
  onAuthenticated: (user: User) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({
  mode,
  onModeChange,
  onAuthenticated,
}) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('admin@cybershield.io');
  const [password, setPassword] = useState('Admin@1234');
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid work email address.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (tab === 'register' && fullName.trim().length < 2) {
      setError('Please enter your full name (minimum 2 characters).');
      return;
    }

    setSubmitting(true);
    try {
      const response =
        tab === 'login'
          ? await apiClient.login(email, password, mode)
          : await apiClient.register(
              { fullName, email, password, department, jobTitle },
              mode
            );
      onAuthenticated(response.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemoAccount = (demoEmail: string, demoPass: string) => {
    setTab('login');
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#080E1A] text-slate-100 flex flex-col lg:flex-row">
      {/* Left Architectural Brand Panel */}
      <div className="lg:w-[48%] bg-[#0B1426] border-b lg:border-b-0 lg:border-r border-slate-800/80 p-8 lg:p-14 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600/15 border border-blue-500/30 flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-xl font-semibold tracking-tight text-white">
              CyberShield
            </span>
          </div>

          <div className="mt-12 max-w-lg">
            <p className="text-xs font-medium tracking-wider text-blue-400 uppercase mb-3">
              Enterprise Security Operations
            </p>
            <h1 className="text-3xl lg:text-4xl font-semibold text-white tracking-tight leading-tight text-balance">
              Cybersecurity Incident Management &amp; Response Platform
            </h1>
            <p className="mt-4 text-sm lg:text-base text-slate-400 leading-relaxed">
              Structured reporting, analyst triage, investigation notes, and full
              audit trails engineered on React, Java Spring Boot, Spring
              Security, Hibernate/JPA, and MySQL.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl">
            <div className="p-4 rounded-lg bg-[#111B2E] border border-slate-800/90">
              <p className="text-xs text-slate-400">Access Model</p>
              <p className="mt-1 text-sm font-medium text-slate-100">
                Role-Based (RBAC)
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Admin · Analyst · Employee
              </p>
            </div>
            <div className="p-4 rounded-lg bg-[#111B2E] border border-slate-800/90">
              <p className="text-xs text-slate-400">Backend Stack</p>
              <p className="mt-1 text-sm font-medium text-slate-100">
                Spring Boot 3 + JWT
              </p>
              <p className="mt-1 text-xs text-slate-500">
                BCrypt &amp; Method Security
              </p>
            </div>
            <div className="p-4 rounded-lg bg-[#111B2E] border border-slate-800/90">
              <p className="text-xs text-slate-400">Persistence</p>
              <p className="mt-1 text-sm font-medium text-slate-100">
                MySQL 8 + JPA
              </p>
              <p className="mt-1 text-xs text-slate-500">
                6 Normalized Tables
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-800/80 text-xs text-slate-400 space-y-2">
          <div className="flex items-center gap-2 text-slate-300 font-medium">
            <Database className="w-4 h-4 text-blue-400 shrink-0" />
            <span>Environment &amp; Data Source Transparency</span>
          </div>
          <p className="leading-relaxed text-slate-400">
            In this browser preview sandbox, Java/Maven/MySQL are not installed,
            so <strong className="text-slate-200">Demonstration Mode</strong>{' '}
            runs with client-side sample data. When running the{' '}
            <code className="font-mono text-blue-300">backend/</code> Maven
            project locally with MySQL, switch to{' '}
            <strong className="text-slate-200">Spring Boot API</strong> mode.
          </p>
        </div>
      </div>

      {/* Right Authentication Form Panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-14">
        <div className="w-full max-w-md space-y-6">
          {/* Data Source Mode Selector */}
          <div className="p-3.5 rounded-lg bg-[#111B2E] border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-300">Data Source Mode</span>
              <span className="font-mono text-[11px] text-slate-400 truncate max-w-[200px]">
                {mode === 'SPRING_BOOT' ? getApiBaseUrl() : 'Client Sample Data'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-md bg-[#080E1A] border border-slate-800/80">
              <button
                type="button"
                onClick={() => {
                  onModeChange('DEMO');
                  setError(null);
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer ${
                  mode === 'DEMO'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Demonstration Mode
              </button>
              <button
                type="button"
                onClick={() => {
                  onModeChange('SPRING_BOOT');
                  setError(null);
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer ${
                  mode === 'SPRING_BOOT'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Spring Boot API
              </button>
            </div>
          </div>

          <div className="rounded-xl bg-[#111B2E] border border-slate-800 p-6 sm:p-8">
            <div className="flex items-center gap-1 p-1 rounded-lg bg-[#080E1A] border border-slate-800 mb-6">
              <button
                type="button"
                onClick={() => {
                  setTab('login');
                  setError(null);
                }}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                  tab === 'login'
                    ? 'bg-[#162238] text-white border border-slate-700/70'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab('register');
                  setError(null);
                }}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                  tab === 'register'
                    ? 'bg-[#162238] text-white border border-slate-700/70'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Register Account
              </button>
            </div>

            {error && (
              <div
                role="alert"
                className="mb-5 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-200"
              >
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {tab === 'register' && (
                <>
                  <div>
                    <label
                      htmlFor="auth-fullname"
                      className="block text-xs font-medium text-slate-300 mb-1.5"
                    >
                      Full Name
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        id="auth-fullname"
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Jordan Rivera"
                        className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg bg-[#080E1A] border border-slate-700/80 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="auth-dept"
                        className="block text-xs font-medium text-slate-300 mb-1.5"
                      >
                        Department
                      </label>
                      <div className="relative">
                        <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          id="auth-dept"
                          type="text"
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                          placeholder="Engineering"
                          className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg bg-[#080E1A] border border-slate-700/80 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label
                        htmlFor="auth-title"
                        className="block text-xs font-medium text-slate-300 mb-1.5"
                      >
                        Job Title
                      </label>
                      <div className="relative">
                        <Briefcase className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          id="auth-title"
                          type="text"
                          value={jobTitle}
                          onChange={(e) => setJobTitle(e.target.value)}
                          placeholder="Software Engineer"
                          className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg bg-[#080E1A] border border-slate-700/80 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div>
                <label
                  htmlFor="auth-email"
                  className="block text-xs font-medium text-slate-300 mb-1.5"
                >
                  Work Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="auth-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@cybershield.io"
                    className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg bg-[#080E1A] border border-slate-700/80 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="auth-password"
                  className="block text-xs font-medium text-slate-300 mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="auth-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg bg-[#080E1A] border border-slate-700/80 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {tab === 'register' && (
                <p className="text-xs text-slate-400">
                  Self-registered accounts receive the{' '}
                  <span className="text-slate-200 font-medium">Employee</span>{' '}
                  role. Administrators can elevate roles in User Management.
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>
                  {submitting
                    ? 'Authenticating...'
                    : tab === 'login'
                      ? 'Sign In to Workspace'
                      : 'Create Account'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Quick-fill seeded/demo role credentials */}
            <div className="mt-6 pt-5 border-t border-slate-800/80">
              <p className="text-xs font-medium text-slate-400 mb-2.5">
                Quick-Fill Role Accounts (Sample / Seeded Credentials)
              </p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    fillDemoAccount('admin@cybershield.io', 'Admin@1234')
                  }
                  className="px-2.5 py-2 rounded-md bg-[#080E1A] hover:bg-slate-800/80 border border-slate-800 text-xs text-slate-200 transition-colors cursor-pointer"
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() =>
                    fillDemoAccount('analyst@cybershield.io', 'Analyst@1234')
                  }
                  className="px-2.5 py-2 rounded-md bg-[#080E1A] hover:bg-slate-800/80 border border-slate-800 text-xs text-slate-200 transition-colors cursor-pointer"
                >
                  Analyst
                </button>
                <button
                  type="button"
                  onClick={() =>
                    fillDemoAccount('employee@cybershield.io', 'Employee@1234')
                  }
                  className="px-2.5 py-2 rounded-md bg-[#080E1A] hover:bg-slate-800/80 border border-slate-800 text-xs text-slate-200 transition-colors cursor-pointer"
                >
                  Employee
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
