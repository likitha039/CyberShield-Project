import React, { useEffect, useState } from 'react';
import {
  UserPlus,
  Search,
  Edit3,
  Power,
  X,
  AlertCircle,
} from 'lucide-react';
import type { DataSourceMode, RoleName, User } from '../types';
import { apiClient } from '../services/apiClient';
import { formatDateTime, formatRoleLabel } from './SeverityAndStatus';

interface UsersViewProps {
  currentUser: User;
  mode: DataSourceMode;
  onNotify: (message: string, type?: 'success' | 'error') => void;
}

export const UsersView: React.FC<UsersViewProps> = ({
  currentUser,
  mode,
  onNotify,
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleName | ''>('');

  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [role, setRole] = useState<RoleName>('ROLE_EMPLOYEE');
  const [activeState, setActiveState] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const list = await apiClient.getUsers(mode);
      setUsers(list);
    } catch (err) {
      onNotify(
        err instanceof Error ? err.message : 'Failed to load users.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [mode]);

  const openAddModal = () => {
    setModalMode('add');
    setEditingUser(null);
    setFullName('');
    setEmail('');
    setPassword('');
    setDepartment('');
    setJobTitle('');
    setRole('ROLE_ANALYST');
    setActiveState(true);
    setFormError(null);
  };

  const openEditModal = (u: User) => {
    setModalMode('edit');
    setEditingUser(u);
    setFullName(u.fullName);
    setEmail(u.email);
    setPassword('');
    setDepartment(u.department || '');
    setJobTitle(u.jobTitle || '');
    setRole(u.role);
    setActiveState(u.active);
    setFormError(null);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (fullName.trim().length < 2) {
      setFormError('Full name must be at least 2 characters.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFormError('Please provide a valid email address.');
      return;
    }
    if (modalMode === 'add' && password.length < 8) {
      setFormError('Initial password must be at least 8 characters.');
      return;
    }

    setSaving(true);
    try {
      if (modalMode === 'add') {
        await apiClient.createUser(
          { fullName, email, password, department, jobTitle, role },
          mode
        );
        onNotify(`Created user account for ${fullName.trim()}`);
      } else if (modalMode === 'edit' && editingUser) {
        await apiClient.updateUser(
          editingUser.id,
          {
            fullName,
            email,
            department,
            jobTitle,
            role,
            active: activeState,
          },
          mode
        );
        onNotify(`Updated user profile for ${fullName.trim()}`);
      }
      setModalMode(null);
      await loadUsers();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to save user.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (target: User) => {
    try {
      const updated = await apiClient.toggleUserStatus(
        target.id,
        !target.active,
        mode
      );
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      onNotify(
        `${updated.fullName} account ${updated.active ? 'activated' : 'deactivated'}`
      );
    } catch (err) {
      onNotify(
        err instanceof Error ? err.message : 'Status update failed.',
        'error'
      );
    }
  };

  const filtered = users.filter((u) => {
    if (roleFilter && u.role !== roleFilter) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      return (
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.department || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-white">User Management</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Administer user accounts, role assignments, and access status.
          </p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add User</span>
        </button>
      </div>

      {/* Filters */}
      <div className="p-4 rounded-xl bg-[#111B2E] border border-slate-800/90 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or department..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-[#080E1A] border border-slate-700/80 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        <select
          aria-label="Filter by role"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as RoleName | '')}
          className="px-3 py-2 text-sm rounded-lg bg-[#080E1A] border border-slate-700/80 text-slate-200 focus:outline-none focus:border-blue-500"
        >
          <option value="">All Roles</option>
          <option value="ROLE_ADMIN">Administrator</option>
          <option value="ROLE_ANALYST">Security Analyst</option>
          <option value="ROLE_EMPLOYEE">Employee</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="rounded-xl bg-[#111B2E] border border-slate-800/90 overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3].map((r) => (
              <div key={r} className="h-11 rounded bg-slate-800/50 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-400">
            No user accounts match your filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/80 text-xs font-medium text-slate-400 bg-[#0D1627]">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Department &amp; Title</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4">Created</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-sm">
                {filtered.map((u) => {
                  const isSelf = u.id === currentUser.id;
                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-[#162238]/60 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <p className="font-medium text-slate-100">
                          {u.fullName}{' '}
                          {isSelf && (
                            <span className="text-xs text-blue-400 font-normal">
                              (You)
                            </span>
                          )}
                        </p>
                        <p className="text-xs font-mono text-slate-400">
                          {u.email}
                        </p>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="text-xs text-slate-200">
                          {u.department || '—'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {u.jobTitle || '—'}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-medium text-slate-200 whitespace-nowrap">
                        {formatRoleLabel(u.role)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded border ${
                            u.active
                              ? 'bg-emerald-500/12 border-emerald-500/30 text-emerald-300'
                              : 'bg-red-500/12 border-red-500/30 text-red-300'
                          }`}
                        >
                          {u.active ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-mono text-slate-400 whitespace-nowrap">
                        {formatDateTime(u.createdAt)}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(u)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-slate-700 hover:bg-slate-800 text-xs text-slate-200 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            disabled={isSelf && u.active}
                            onClick={() => handleToggleActive(u)}
                            title={
                              isSelf
                                ? 'Cannot deactivate your own active session'
                                : u.active
                                  ? 'Deactivate account'
                                  : 'Activate account'
                            }
                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded border text-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                              u.active
                                ? 'border-red-500/30 text-red-300 hover:bg-red-500/10'
                                : 'border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10'
                            }`}
                          >
                            <Power className="w-3.5 h-3.5" />
                            <span>{u.active ? 'Deactivate' : 'Activate'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit User Modal */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-[2px]">
          <div className="w-full max-w-lg rounded-xl bg-[#111B2E] border border-slate-800 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">
                {modalMode === 'add' ? 'Add New User' : 'Edit User Account'}
              </h3>
              <button
                type="button"
                onClick={() => setModalMode(null)}
                className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2 text-xs text-red-200">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveUser} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-[#080E1A] border border-slate-700 text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Work Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-[#080E1A] border border-slate-700 text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              {modalMode === 'add' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Temporary Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full px-3 py-2 text-sm rounded-lg bg-[#080E1A] border border-slate-700 text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg bg-[#080E1A] border border-slate-700 text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Job Title
                  </label>
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg bg-[#080E1A] border border-slate-700 text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Assigned Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as RoleName)}
                    className="w-full px-3 py-2 text-sm rounded-lg bg-[#080E1A] border border-slate-700 text-slate-100 focus:outline-none focus:border-blue-500"
                  >
                    <option value="ROLE_ADMIN">Administrator</option>
                    <option value="ROLE_ANALYST">Security Analyst</option>
                    <option value="ROLE_EMPLOYEE">Employee</option>
                  </select>
                </div>
                {modalMode === 'edit' && (
                  <div className="flex items-end pb-2">
                    <label className="inline-flex items-center gap-2 text-sm text-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={activeState}
                        disabled={editingUser?.id === currentUser.id}
                        onChange={(e) => setActiveState(e.target.checked)}
                        className="rounded border-slate-600 bg-[#080E1A]"
                      />
                      <span>Account Active</span>
                    </label>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-4 py-2 rounded-lg border border-slate-700 text-xs font-medium text-slate-300 hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-xs font-medium text-white cursor-pointer"
                >
                  {saving ? 'Saving...' : modalMode === 'add' ? 'Create User' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
