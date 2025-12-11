'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDemoMode = searchParams.get('demo') === 'true';
  
  const [email, setEmail] = useState(isDemoMode ? 'admin@worktreeforms.com' : '');
  const [password, setPassword] = useState(isDemoMode ? 'admin123' : '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Simulate API call - In real app, call backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (email === 'admin@worktreeforms.com' && password === 'admin123') {
        // Simulate successful login
        localStorage.setItem('token', 'demo-jwt-token-' + Date.now());
        localStorage.setItem('user', JSON.stringify({
          id: '1',
          email,
          name: 'Admin User',
          role: 'admin',
        }));
        router.push('/dashboard');
      } else {
        setError('Invalid email or password. Use admin@worktreeforms.com / admin123 for demo.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-blue-50">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-xl p-8 border border-gray-200">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary-700 mb-2">📋 Worktree</h1>
            <p className="text-gray-600">Form Management System</p>
          </div>

          {/* Demo Badge */}
          {isDemoMode && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md mb-6 text-sm">
              ✓ Demo credentials pre-filled
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-accent-default px-4 py-3 rounded-md mb-6 text-sm">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="admin@worktreeforms.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="••••••••"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-500 hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t text-center text-sm text-gray-600">
            <p>
              Don't have an account?{' '}
              <Link href="/signup" className="text-primary-500 hover:text-primary-700 font-medium">
                Sign up
              </Link>
            </p>
            <p className="mt-2">
              <Link href="/forgot-password" className="text-primary-500 hover:text-primary-700 font-medium">
                Forgot password?
              </Link>
            </p>
          </div>

          {/* Demo Info */}
          <div className="mt-6 bg-gray-50 p-4 rounded-md text-xs text-gray-600">
            <p className="font-semibold text-gray-700 mb-2">📝 Demo Account:</p>
            <p>Email: admin@worktreeforms.com</p>
            <p>Password: admin123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
