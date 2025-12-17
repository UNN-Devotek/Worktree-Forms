"use client";
import { useEffect, useState } from "react";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const data = [
  { name: "Desktop", value: 1125 },
  { name: "Mobile", value: 400 },
  { name: "Tablet", value: 300 },
  { name: "Other", value: 200 },
];

const COLORS = ["#facc15", "#3b82f6", "#ef4444", "#10b981"];

export function UserDistributionChart() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
     return (
        <Card className="bg-card border-border text-card-foreground h-full">
            <CardHeader><div className="h-6 w-32 bg-muted animate-pulse rounded" /></CardHeader>
            <CardContent><div className="h-[250px] bg-muted/20 animate-pulse rounded" /></CardContent>
        </Card>
     )
  }

  return (
    <Card className="bg-card border-border text-card-foreground h-full">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-foreground">Pie Chart - Donut with Text</CardTitle>
        <CardDescription className="text-muted-foreground">January - June 2024</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={0}
                        dataKey="value"
                        stroke="none"
                    >
                        {data.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip 
                         contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--popover-foreground))', borderRadius: 'var(--radius)' }}
                         itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
                    />
                    {/* <Legend 
                        layout="horizontal" 
                        verticalAlign="bottom" 
                        align="center"
                        iconType="circle"
                    /> */}
                </PieChart>
            </ResponsiveContainer>
            {/* Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold">1,125</span>
                <span className="text-xs text-muted-foreground">Visitors</span>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
