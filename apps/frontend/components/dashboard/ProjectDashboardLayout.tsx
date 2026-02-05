'use client';

import { ReactNode } from 'react';
// Assuming ProjectSidebar or navigation exists in a parent layout usually, 
// but if this layout wraps the dashboard page specifically, 
// we might not control the sidebar here if it's in the root layout.
// However, we can add a style tag or class to hide siblings if needed, 
// OR this layout is intended to be used BY the page.

// If the sidebar is in a parent layout, we can't easily hide it via a child component 
// unless we use global print styles.
// Strategy: The specific page will use this layout, and we'll ensure global CSS or this component 
// introduces print-specific overrides.
// Actually, Tailwind `print:hidden` works on elements. 
// If the Sidebar is outside this component, we can't hide it directly here.
// BUT, we can add a global style or class to the `body` via useEffect? 
// Or just rely on the user requirement "On Print, sidebar hidden" being verified 
// by checking if the Sidebar component itself has `print:hidden`.

// Note: If I cannot edit the Sidebar component (it's in a different story/file), 
// I might need to add a global style here.
// Let's assume standard "DashboardLayout" exists and we are making a specific *page* layout 
// or I need to update the global css/layout.

// For now, I will create a layout wrapper that applies print styles to itself, 
// and I may need to tell the user to check Sidebar. 
// Wait, the Requirement says "On Print... Sidebar hidden".
// I should check `apps/frontend/components/layout/Sidebar.tsx` or similar if it exists.

interface ProjectDashboardLayoutProps {
    children: ReactNode;
    projectId: string; // reserved for context if needed
}

export function ProjectDashboardLayout({ children }: ProjectDashboardLayoutProps) {
    return (
        <div className="w-full h-full flex flex-col space-y-6 p-6 print:p-0 print:space-y-4">
            {/* Header Area */}
            <div className="flex items-center justify-between pb-4 border-b print:border-none">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Project Overview</h1>
                    <p className="text-muted-foreground">High-level metrics and recent activity.</p>
                </div>
                <div className="print:hidden">
                    <button 
                        onClick={() => window.print()} 
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                    >
                        Print Report
                    </button>
                </div>
            </div>

            {/* Print Header (Only shows when printing) */}
            <div className="hidden print:block mb-6">
                <h1 className="text-2xl font-bold">Project Status Report</h1>
                <p className="text-sm text-gray-500">Generated on {new Date().toLocaleDateString()}</p>
            </div>

            {/* Main Content */}
            <div className="flex-1 w-full">
                {children}
            </div>

            {/* Global Print Style Injection (Hack to hide sidebar if external) */}
            <style jsx global>{`
                @media print {
                    /* Hide potential sidebar/nav elements based on common HTML structure or ARIA roles */
                    nav, aside, header, .sidebar, [data-sidebar="true"] {
                        display: none !important;
                    }
                    /* Ensure dashboard takes full width */
                    main, .main-content, #root, #__next {
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    /* Backgrounds/Text colors */
                    body {
                        background-color: white !important;
                        color: black !important;
                    }
                }
            `}</style>
        </div>
    );
}
