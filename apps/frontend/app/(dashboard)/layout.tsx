import { DashboardLayout } from "@/features/projects/components/dashboard-layout";
import { AiAssistant } from "@/components/ai/AiAssistant";

export const dynamic = 'force-dynamic';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <DashboardLayout>
      {children}
      <AiAssistant />
    </DashboardLayout>
  );
}
