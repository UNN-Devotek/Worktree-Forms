import { DashboardLayout } from "@/features/projects/components/dashboard-layout";
import { AiAssistant } from "@/components/ai/AiAssistant";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

interface LayoutProps {
  children: React.ReactNode;
}

export default async function Layout({ children }: LayoutProps) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  // @ts-expect-error — session.user.complianceStatus is a custom field not in NextAuth's default types
  if (session.user?.complianceStatus === 'PENDING') {
     redirect("/onboarding");
  }

  return (
    <DashboardLayout>
      {children}
      <AiAssistant />
    </DashboardLayout>
  );
}
