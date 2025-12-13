import { Sidebar } from "@/components/layout/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex w-full h-screen bg-sidebar overflow-hidden">
      <Sidebar className="shrink-0" />
      <main className="flex-1 flex flex-col m-2 ml-0 bg-background rounded-xl shadow-2xl overflow-hidden relative z-10 border border-border/50">
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
            {children}
        </div>
      </main>
    </div>
  );
}
