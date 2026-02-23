"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { DashboardLayout } from "@/features/projects/components/dashboard-layout";
import { ErrorBoundary } from "@/components/error-boundary";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const tabs = [
    { name: "Overview", href: "/admin" },
    { name: "Users", href: "/admin/users" },
    { name: "Roles", href: "/admin/roles" },
    { name: "Settings", href: "/admin/settings" },
  ];

  return (
    <DashboardLayout>
        <div className="flex flex-col space-y-8 h-full">
            <div className="flex items-center justify-between shrink-0">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Admin Console</h1>
                    <p className="text-muted-foreground mt-1">Manage your application settings and users.</p>
                </div>
            </div>

            {/* Styled Tabs Navigation */}
            <div className="flex items-center space-x-2 bg-muted p-1.5 rounded-full w-fit border border-border shrink-0">
                {tabs.map((tab) => {
                    const isActive = pathname === tab.href;
                    return (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            className={cn(
                                "px-4 py-1.5 text-sm font-medium transition-all rounded-full",
                                isActive 
                                    ? "bg-background text-foreground shadow-sm" 
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                            )}
                        >
                            {tab.name}
                        </Link>
                    )
                })}
            </div>

            <div className="flex-1 overflow-auto">
                <ErrorBoundary>
                    {children}
                </ErrorBoundary>
            </div>
        </div>
    </DashboardLayout>
  );
}
