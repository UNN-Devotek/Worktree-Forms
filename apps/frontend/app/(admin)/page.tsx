'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!token) {
      router.push('/login');
      return;
    }

    if (userData) {
      const parsed = JSON.parse(userData);
      if (parsed.role !== 'admin') {
        router.push('/dashboard');
        return;
      }
      setUser(parsed);
    }
    setLoading(false);
  }, [router]);

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  if (!user || user.role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-full px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-primary-700">⚙️ Admin Panel</h1>
              <div className="text-sm text-gray-600">Worktree Forms Management</div>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="outline">Back to Dashboard</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Admin Content */}
      <main className="max-w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="mb-8 border-b border-gray-200">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`pb-4 px-2 border-b-2 transition ${
                activeTab === 'dashboard'
                  ? 'border-primary-500 text-primary-700 font-medium'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`pb-4 px-2 border-b-2 transition ${
                activeTab === 'users'
                  ? 'border-primary-500 text-primary-700 font-medium'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Users
            </button>
            <button
              onClick={() => setActiveTab('roles')}
              className={`pb-4 px-2 border-b-2 transition ${
                activeTab === 'roles'
                  ? 'border-primary-500 text-primary-700 font-medium'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Roles
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`pb-4 px-2 border-b-2 transition ${
                activeTab === 'audit'
                  ? 'border-primary-500 text-primary-700 font-medium'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Audit Logs
            </button>
          </div>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-6 text-gray-900">System Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow p-6 border-t-4 border-primary-500">
                  <p className="text-sm text-gray-600 mb-2">Total Users</p>
                  <p className="text-4xl font-bold text-gray-900">5</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6 border-t-4 border-blue-500">
                  <p className="text-sm text-gray-600 mb-2">Active Forms</p>
                  <p className="text-4xl font-bold text-gray-900">12</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6 border-t-4 border-green-500">
                  <p className="text-sm text-gray-600 mb-2">Total Submissions</p>
                  <p className="text-4xl font-bold text-gray-900">234</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6 border-t-4 border-purple-500">
                  <p className="text-sm text-gray-600 mb-2">Audit Logs</p>
                  <p className="text-4xl font-bold text-gray-900">1.2K</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
              <Button className="bg-primary-500 hover:bg-primary-700">Add User</Button>
            </div>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Role</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900">admin@worktreeforms.com</td>
                    <td className="px-6 py-4 text-sm text-gray-900">Admin User</td>
                    <td className="px-6 py-4 text-sm"><span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-medium">Admin</span></td>
                    <td className="px-6 py-4 text-sm"><span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">Active</span></td>
                    <td className="px-6 py-4 text-sm"><button className="text-primary-500 hover:text-primary-700 font-medium">Edit</button></td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900">editor@worktreeforms.com</td>
                    <td className="px-6 py-4 text-sm text-gray-900">Editor User</td>
                    <td className="px-6 py-4 text-sm"><span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">Editor</span></td>
                    <td className="px-6 py-4 text-sm"><span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">Active</span></td>
                    <td className="px-6 py-4 text-sm"><button className="text-primary-500 hover:text-primary-700 font-medium">Edit</button></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Roles Tab */}
        {activeTab === 'roles' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Role Management</h2>
              <Button className="bg-primary-500 hover:bg-primary-700">Create Role</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Admin</h3>
                <p className="text-sm text-gray-600 mb-4">Full system access</p>
                <div className="text-xs text-gray-500">Users: 1</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Editor</h3>
                <p className="text-sm text-gray-600 mb-4">Can create and edit forms</p>
                <div className="text-xs text-gray-500">Users: 2</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Viewer</h3>
                <p className="text-sm text-gray-600 mb-4">Can only view and submit</p>
                <div className="text-xs text-gray-500">Users: 2</div>
              </div>
            </div>
          </div>
        )}

        {/* Audit Logs Tab */}
        {activeTab === 'audit' && (
          <div>
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Audit Logs</h2>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">User</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Action</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Resource</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900">Admin User</td>
                    <td className="px-6 py-4 text-sm"><span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">LOGIN</span></td>
                    <td className="px-6 py-4 text-sm text-gray-600">auth</td>
                    <td className="px-6 py-4 text-sm text-gray-600">Just now</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900">Admin User</td>
                    <td className="px-6 py-4 text-sm"><span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">CREATE</span></td>
                    <td className="px-6 py-4 text-sm text-gray-600">form</td>
                    <td className="px-6 py-4 text-sm text-gray-600">5 min ago</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
