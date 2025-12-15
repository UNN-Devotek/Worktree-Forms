'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, TrendingUp, Users, FileCheck } from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface FormStats {
  totalForms: number;
  totalSubmissions: number;
  activeUsers: number;
  completionRate: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<FormStats>({
    totalForms: 0,
    totalSubmissions: 0,
    activeUsers: 0,
    completionRate: 0,
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token && !userData) {
      // router.push('/login'); 
      // Allow dev access
    }

    if (userData) {
      setUser(JSON.parse(userData));
    } else {
        // Dummy user
        setUser({ id: '1', email: 'demo@user.com', name: 'Demo User', role: 'editor' });
    }

    // Fetch real stats
    const fetchStats = async () => {
        try {
            const { apiClient } = await import('@/lib/api');
            const res = await apiClient<any>('/api/admin/stats');
            
            if (res.success && res.data) {
                    setStats({
                    totalForms: res.data.activeForms || 0,
                    totalSubmissions: res.data.totalSubmissions || 0,
                    activeUsers: res.data.totalUsers || 0,
                    completionRate: 87.5 // api doesn't return this yet
                    });
            }
        } catch (error) {
            console.error("Failed to fetch stats", error);
        } finally {
            setLoading(false);
        }
    };

    fetchStats();
  }, [router]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Main Content */}
      <main className="flex-1">
        <div className="container py-6">
          {/* Page Header */}
          <div className="flex items-center justify-between space-y-2 pb-6">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
              <p className="text-muted-foreground">
                Welcome back, {user?.name || 'User'}. Here's an overview of your forms and activity.
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Forms</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalForms}</div>
                <p className="text-xs text-muted-foreground">Active templates and drafts</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
                <FileCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalSubmissions}</div>
                <p className="text-xs text-muted-foreground">Responses collected</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeUsers}</div>
                <p className="text-xs text-muted-foreground">Team members</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.completionRate}%</div>
                <p className="text-xs text-muted-foreground">Average form completion</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
