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
    <React.Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </React.Suspense>
  );
}