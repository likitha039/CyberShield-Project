import React from 'react';
import { Database, Server, ShieldCheck, Layers } from 'lucide-react';
import { getApiBaseUrl } from '../services/apiClient';

const MYSQL_TABLES = [
  {
    name: 'roles',
    columns: 'id (PK), name (UNIQUE), description',
    purpose: 'Stores ROLE_ADMIN, ROLE_ANALYST, and ROLE_EMPLOYEE definitions.',
  },
  {
    name: 'users',
    columns:
      'id (PK), full_name, email (UNIQUE), password_hash, department, job_title, active, role_id (FK -> roles.id), created_at, updated_at',
    purpose: 'Stores BCrypt-hashed accounts and active/deactivated status.',
  },
  {
    name: 'incidents',
    columns:
      'id (PK), incident_code (UNIQUE), title, description, category, severity, status, affected_system, occurred_at, reporter_id (FK -> users.id), reporter_contact, created_at, updated_at',
    purpose: 'Core cybersecurity incident records with indexed status/severity.',
  },
  {
    name: 'incident_assignments',
    columns:
      'id (PK), incident_id (FK), analyst_id (FK), assigned_by_id (FK), assigned_at, active, assignment_notes',
    purpose: 'Tracks analyst assignments and reassignment history.',
  },
  {
    name: 'investigation_notes',
    columns: 'id (PK), incident_id (FK), author_id (FK), note_text, action_taken, created_at',
    purpose: 'Forensic analyst notes and containment actions taken.',
  },
  {
    name: 'incident_history',
    columns:
      'id (PK), incident_id (FK), changed_by_id (FK), action_type, field_name, old_value, new_value, details, changed_at',
    purpose: 'Immutable chronological audit log of every incident mutation.',
  },
];

const API_ENDPOINTS = [
  { method: 'POST', path: '/api/auth/login', access: 'Public', desc: 'Authenticate with email & password, returns JWT + UserDto' },
  { method: 'POST', path: '/api/auth/register', access: 'Public', desc: 'Self-register new Employee account with BCrypt hashing' },
  { method: 'GET', path: '/api/auth/me', access: 'Authenticated', desc: 'Retrieve current authenticated user profile' },
  { method: 'GET', path: '/api/dashboard/stats', access: 'Authenticated', desc: 'Role-scoped KPI counts, severity/status breakdowns, monthly trend' },
  { method: 'GET', path: '/api/incidents', access: 'Authenticated', desc: 'Search & filter incidents (Employees scoped to own reports)' },
  { method: 'POST', path: '/api/incidents', access: 'Authenticated', desc: 'Submit new cybersecurity incident & create initial audit entry' },
  { method: 'GET', path: '/api/incidents/{id}', access: 'Authenticated', desc: 'Retrieve full incident details (RBAC verified)' },
  { method: 'POST', path: '/api/incidents/{id}/assign', access: 'ROLE_ADMIN', desc: 'Assign or reassign an active Security Analyst' },
  { method: 'PATCH', path: '/api/incidents/{id}/status', access: 'ADMIN, ANALYST', desc: 'Transition status (REPORTED -> CLOSED) with audit entry' },
  { method: 'PATCH', path: '/api/incidents/{id}/severity', access: 'ADMIN, ANALYST', desc: 'Adjust severity level with audit entry' },
  { method: 'GET/POST', path: '/api/incidents/{id}/notes', access: 'ADMIN, ANALYST (POST)', desc: 'Read or append investigation notes and actions taken' },
  { method: 'GET', path: '/api/incidents/{id}/history', access: 'Authenticated', desc: 'Fetch chronological audit log for incident' },
  { method: 'GET/POST/PUT', path: '/api/users', access: 'ROLE_ADMIN', desc: 'List, create, edit users, assign roles, toggle active status' },
  { method: 'GET', path: '/api/reports/summary', access: 'ADMIN, ANALYST', desc: 'Aggregate severity, status, category, and monthly statistics' },
];

export const ArchitectureDocsView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">
          Spring Boot Backend, MySQL Schema &amp; API Reference
        </h2>
        <p className="text-sm text-slate-400 mt-0.5">
          Full architectural specification for the{' '}
          <code className="font-mono text-blue-300">backend/</code> Maven
          application and{' '}
          <code className="font-mono text-blue-300">cybershield_db</code>{' '}
          MySQL database.
        </p>
      </div>

      {/* Environment Transparency Box */}
      <div className="p-5 rounded-xl bg-[#111B2E] border border-blue-500/30 space-y-2.5">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Server className="w-4 h-4 text-blue-400" />
          <span>Runtime Environment &amp; Local Execution Guide</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          This web preview sandbox runs Node.js without a local JDK, Maven, or
          MySQL daemon. All real Java Spring Boot source files are generated in{' '}
          <code className="font-mono text-blue-300">backend/</code> (with{' '}
          <code className="font-mono text-blue-300">pom.xml</code>, JPA
          entities, Spring Security JWT, and{' '}
          <code className="font-mono text-blue-300">schema.sql</code>). To run
          the live MySQL-backed stack locally for your placement demo:
        </p>
        <div className="p-3.5 rounded-lg bg-[#080E1A] border border-slate-800 font-mono text-xs text-slate-300 space-y-1 overflow-x-auto">
          <div>1. mysql -u root -p &lt; backend/src/main/resources/sql/schema.sql</div>
          <div>2. cd backend &amp;&amp; mvn spring-boot:run</div>
          <div>3. cd frontend &amp;&amp; npm install &amp;&amp; npm run dev</div>
          <div className="text-slate-400 pt-1">
            Frontend API target: {getApiBaseUrl()} · Swagger UI: http://localhost:8080/swagger-ui.html
          </div>
        </div>
      </div>

      {/* Architecture Layers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-[#111B2E] border border-slate-800/90 space-y-1.5">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Layers className="w-4 h-4 text-blue-400" />
            <span>Layered Spring Architecture</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Organized into <code className="font-mono text-slate-200">entity</code>,{' '}
            <code className="font-mono text-slate-200">repository</code>,{' '}
            <code className="font-mono text-slate-200">dto</code>,{' '}
            <code className="font-mono text-slate-200">service</code>,{' '}
            <code className="font-mono text-slate-200">controller</code>,{' '}
            <code className="font-mono text-slate-200">security</code>, and{' '}
            <code className="font-mono text-slate-200">exception</code> packages.
          </p>
        </div>
        <div className="p-5 rounded-xl bg-[#111B2E] border border-slate-800/90 space-y-1.5">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Spring Security + JWT</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Stateless <code className="font-mono text-slate-200">OncePerRequestFilter</code>{' '}
            with HMAC-SHA JWT tokens, BCrypt strength-12 password hashing, and{' '}
            <code className="font-mono text-slate-200">@PreAuthorize</code> RBAC.
          </p>
        </div>
        <div className="p-5 rounded-xl bg-[#111B2E] border border-slate-800/90 space-y-1.5">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Database className="w-4 h-4 text-sky-400" />
            <span>Hibernate &amp; MySQL 8</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            6 relational tables with foreign keys, unique constraints, JPQL
            filtering, and transactional audit-trail recording via{' '}
            <code className="font-mono text-slate-200">@Transactional</code>.
          </p>
        </div>
      </div>

      {/* MySQL 6-Table Schema */}
      <div className="rounded-xl bg-[#111B2E] border border-slate-800/90 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800/80">
          <h3 className="text-base font-semibold text-white">
            MySQL Relational Schema (6 Tables)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 text-xs text-slate-400 bg-[#0D1627]">
                <th className="py-3 px-4">Table Name</th>
                <th className="py-3 px-4">Columns &amp; Keys</th>
                <th className="py-3 px-4">Responsibility</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-xs">
              {MYSQL_TABLES.map((t) => (
                <tr key={t.name}>
                  <td className="py-3 px-4 font-mono text-blue-300 font-medium whitespace-nowrap">
                    {t.name}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-300">
                    {t.columns}
                  </td>
                  <td className="py-3 px-4 text-slate-400">{t.purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* REST API Endpoints */}
      <div className="rounded-xl bg-[#111B2E] border border-slate-800/90 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800/80">
          <h3 className="text-base font-semibold text-white">
            Spring Boot REST API Endpoints
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 text-xs text-slate-400 bg-[#0D1627]">
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">Endpoint</th>
                <th className="py-3 px-4">RBAC Access</th>
                <th className="py-3 px-4">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-xs">
              {API_ENDPOINTS.map((ep) => (
                <tr key={`${ep.method}-${ep.path}`}>
                  <td className="py-3 px-4 font-mono text-sky-300 whitespace-nowrap">
                    {ep.method}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-200 whitespace-nowrap">
                    {ep.path}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-300 whitespace-nowrap">
                    {ep.access}
                  </td>
                  <td className="py-3 px-4 text-slate-400">{ep.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
