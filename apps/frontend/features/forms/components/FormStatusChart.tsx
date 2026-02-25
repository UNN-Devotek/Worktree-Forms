'use client';

import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface FormStatusChartProps {
  total: number;
  statusBreakdown: Record<string, number> | null;
}

const COLORS: Record<string, string> = {
  pending: '#f59e0b',
  completed: '#10b981',
  approved: '#3b82f6',
  rejected: '#ef4444',
  unknown: '#6b7280',
};

export function FormStatusChart({ total, statusBreakdown }: FormStatusChartProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || statusBreakdown === null) {
    return (
      <Card className="h-full">
        <CardHeader>
          <div className="h-5 w-32 bg-muted animate-pulse rounded" />
        </CardHeader>
        <CardContent>
          <div className="h-[180px] bg-muted/20 animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  const breakdown = Object.entries(statusBreakdown).map(([name, value]) => ({ name, value }));
  const isEmpty = breakdown.length === 0;
  const displayData = isEmpty ? [{ name: 'none', value: 1 }] : breakdown;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Submission Status</CardTitle>
        <CardDescription>Breakdown by current status</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[180px] w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={displayData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={isEmpty ? 0 : 2}
                dataKey="value"
                stroke="none"
              >
                {displayData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={isEmpty ? 'hsl(var(--muted))' : (COLORS[entry.name] ?? '#6b7280')}
                    opacity={isEmpty ? 0.4 : 1}
                  />
                ))}
              </Pie>
              {!isEmpty && (
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    borderColor: 'hsl(var(--border))',
                    color: 'hsl(var(--popover-foreground))',
                    borderRadius: 'var(--radius)',
                  }}
                  itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
                />
              )}
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-bold">{total}</span>
            <span className="text-xs text-muted-foreground">Total</span>
          </div>
        </div>
        {!isEmpty && (
          <div className="mt-3 flex flex-wrap gap-2">
            {breakdown.map((entry) => (
              <div key={entry.name} className="flex items-center gap-1.5 text-xs">
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ background: COLORS[entry.name] ?? '#6b7280' }}
                />
                <span className="text-muted-foreground capitalize">{entry.name}</span>
                <span className="font-medium">{entry.value}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
