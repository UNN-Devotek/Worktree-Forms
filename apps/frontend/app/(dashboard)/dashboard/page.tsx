import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { BentoDashboard } from '@/features/dashboard/components/BentoDashboard';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  return <BentoDashboard userName={session.user.name || 'User'} />;
}
