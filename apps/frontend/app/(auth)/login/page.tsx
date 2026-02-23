import React from 'react';
import { Metadata } from 'next';
import { LoginForm } from '@/features/users/components/login-form';

export const metadata: Metadata = {
  title: 'Login - Worktree',
  description: 'Login to your account',
};

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="space-y-4 w-full max-w-sm px-4">
            <div className="h-8 bg-muted animate-pulse rounded w-3/4 mx-auto" />
            <div className="h-10 bg-muted animate-pulse rounded" />
            <div className="h-10 bg-muted animate-pulse rounded" />
            <div className="h-10 bg-muted animate-pulse rounded" />
          </div>
        </div>
      }
    >
      <LoginForm />
    </React.Suspense>
  );
}