"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/layout/Sidebar";

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
    <div className="flex w-full h-screen bg-sidebar overflow-hidden">
      <Sidebar className="shrink-0" />
      <main className="flex-1 flex flex-col m-2 ml-0 bg-background rounded-xl shadow-2xl overflow-hidden relative z-10 border border-border/50">
        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-background text-foreground">
            <div className="flex flex-col space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Admin Console</h1>
                        <p className="text-muted-foreground mt-1">Manage your application settings and users.</p>
                    </div>
                </div>

                {/* Styled Tabs Navigation - Matching the 'pill' look from the image */}
                <div className="flex items-center space-x-2 bg-muted p-1.5 rounded-full w-fit border border-border">
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

                <div className="flex-1">
                    {children}
                </div>
            </div>
        </div>
      </main>
    </div>
  );
}
