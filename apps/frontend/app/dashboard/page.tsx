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

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token) {
      router.push('/login');
      return;
    }

    if (userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">📋 Worktree Forms</h1>
            <div className="flex items-center gap-6">
              <div className="text-sm">
                <p className="font-medium text-gray-900">{user?.name}</p>
                <p className="text-gray-600 text-xs">{user?.role.toUpperCase()}</p>
              </div>
              <Button variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome, {user?.name}!</h2>
          <p className="text-gray-600">Manage your forms and submissions from here.</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Link href="/forms/new">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer border-l-4 border-primary-500">
              <div className="text-3xl mb-2">➕</div>
              <h3 className="font-bold text-gray-900 mb-1">Create Form</h3>
              <p className="text-sm text-gray-600">Build a new form with our visual builder</p>
            </div>
          </Link>

          <Link href="/forms">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer border-l-4 border-blue-500">
              <div className="text-3xl mb-2">📝</div>
              <h3 className="font-bold text-gray-900 mb-1">My Forms</h3>
              <p className="text-sm text-gray-600">View and manage all your forms</p>
            </div>
          </Link>

          {user?.role === 'admin' && (
            <Link href="/admin">
              <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer border-l-4 border-accent-default">
                <div className="text-3xl mb-2">⚙️</div>
                <h3 className="font-bold text-gray-900 mb-1">Admin Panel</h3>
                <p className="text-sm text-gray-600">Manage users, roles, and settings</p>
              </div>
            </Link>
          )}
        </div>

        {/* Demo Content */}
        <div className="bg-white rounded-lg shadow p-8">
          <h3 className="text-xl font-bold mb-4 text-gray-900">🚀 Getting Started</h3>
          <div className="space-y-4 text-gray-600">
            <p>
              Welcome to Worktree Forms! This is a production-ready form management system with:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>Visual form builder with drag-and-drop interface</li>
              <li>Dynamic form rendering and submission capture</li>
              <li>Role-based access control (Admin, Editor, Viewer)</li>
              <li>Comprehensive audit logging</li>
              <li>Light & dark mode support</li>
              <li>Responsive design for all devices</li>
            </ul>
            <p className="pt-4">
              Start by creating a new form or exploring the admin panel to manage users and roles.
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        {user?.role === 'admin' && (
          <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6 border-t-4 border-primary-500">
              <p className="text-sm text-gray-600 mb-1">Total Users</p>
              <p className="text-3xl font-bold text-gray-900">5</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6 border-t-4 border-blue-500">
              <p className="text-sm text-gray-600 mb-1">Active Forms</p>
              <p className="text-3xl font-bold text-gray-900">12</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6 border-t-4 border-green-500">
              <p className="text-sm text-gray-600 mb-1">Total Submissions</p>
              <p className="text-3xl font-bold text-gray-900">234</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6 border-t-4 border-purple-500">
              <p className="text-sm text-gray-600 mb-1">Audit Logs</p>
              <p className="text-3xl font-bold text-gray-900">1.2K</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
