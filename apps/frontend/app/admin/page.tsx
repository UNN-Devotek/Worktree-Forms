'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { StatsCard } from '@/components/admin/StatsCard';
import { OverviewChart } from '@/components/admin/OverviewChart';
import { UserDistributionChart } from '@/components/admin/UserDistributionChart';
import { SessionChart } from '@/components/admin/SessionChart';
import { DashboardTable } from '@/components/admin/DashboardTable';
import { Settings, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('Outline');

  const tabs = ['Outline', 'Past Performance', 'Key Personnel', 'Focus Documents'];

  return (
    <div className="space-y-6 pb-8">
      
      {/* Top Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard 
            title="Total Revenue" 
            value="$1,250.00" 
            trend="Trending up this month" 
            trendDirection="up"
            subtext="Visitors for the last 6 months"
        />
        <StatsCard 
            title="New Customers" 
            value="1,234" 
            trend="Down 20% this period" 
            trendDirection="down"
            subtext="Acquisition needs attention"
        />
        <StatsCard 
            title="Active Accounts" 
            value="45,678" 
            trend="Strong user retention" 
            trendDirection="up"
            subtext="Engagement exceed targets"
        />
        <StatsCard 
            title="Growth Rate" 
            value="4.5%" 
            trend="Steady performance" 
            trendDirection="neutral"
            subtext="Meets growth projections"
        />
      </div>

      {/* Main Chart */}
      <div className="w-full">
        <OverviewChart />
      </div>

      {/* Tabs and Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-8">
        <div className="bg-muted p-1 rounded-full border border-border flex items-center">
            {tabs.map(tab => (
                <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                        "px-4 py-1.5 rounded-full text-sm font-medium transition-all",
                        activeTab === tab
                            ? "bg-background text-foreground shadow-sm border border-border"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                    )}
                >
                    {tab}
                    {tab === 'Past Performance' && <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-[10px] bg-secondary rounded-full text-secondary-foreground">3</span>}
                    {tab === 'Key Personnel' && <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-[10px] bg-secondary rounded-full text-secondary-foreground">2</span>}
                </button>
            ))}
        </div>
        
        <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="bg-background border-border text-muted-foreground hover:bg-muted hover:text-foreground">
                <Settings className="mr-2 h-4 w-4" />
                Customize Columns
            </Button>
            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" />
                Add Section
            </Button>
        </div>
      </div>

      {/* Data Table */}
      <DashboardTable />

      {/* Bottom Charts */}
      <div className="grid gap-4 md:grid-cols-2 mt-8">
          <UserDistributionChart />
          <SessionChart />
      </div>

    </div>
  );
}
