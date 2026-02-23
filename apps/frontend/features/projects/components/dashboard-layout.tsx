"use client";

import { Sidebar } from "./sidebar";
import { SidebarErrorBoundary } from "./sidebar-error-boundary";
import { MobileNav } from "./mobile-nav";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Breadcrumbs } from "@/components/breadcrumbs";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const isSheetPage = pathname?.includes('/sheets/');

  return (
    <div className="flex w-full h-screen bg-background overflow-hidden main-dashboard-layout">
      {/* Desktop Sidebar - Hidden on mobile, Flex on MD+ */}
      <SidebarErrorBoundary className="hidden md:flex shrink-0 h-full border-r">
        <Sidebar className="h-full" />
      </SidebarErrorBoundary>
      
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
         {/* Mobile Header / Top Bar */}
        <div className="flex items-center p-4 border-b md:hidden">
            <MobileNav />
            <span className="font-semibold text-lg ml-2">Worktree</span>
        </div>

        {/* Scrollable Page Content — key triggers fade-in on route change */}
        <div
          key={pathname}
          className={cn(
            "flex-1 animate-fade-in",
            isSheetPage ? "p-0 overflow-hidden" : "p-4 md:p-8 overflow-y-auto"
          )}
        >
            {!isSheetPage && <Breadcrumbs />}
            {children}
        </div>
      </main>
    </div>
  );
}
