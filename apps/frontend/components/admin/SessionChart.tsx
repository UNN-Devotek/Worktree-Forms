"use client";
import { useEffect, useState } from "react";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const data = [
  { name: "Chrome", visitors: 400, fill: "#3b82f6" },
  { name: "Safari", visitors: 300, fill: "#10b981" },
  { name: "Firefox", visitors: 200, fill: "#f59e0b" },
  { name: "Edge", visitors: 278, fill: "#8b5cf6" },
  { name: "Other", visitors: 189, fill: "#ec4899" },
];

export function SessionChart() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
     return (
        <Card className="bg-zinc-900 border-zinc-800 text-white h-full">
            <CardHeader><div className="h-6 w-32 bg-zinc-800 animate-pulse rounded" /></CardHeader>
            <CardContent><div className="h-[250px] bg-zinc-800/20 animate-pulse rounded" /></CardContent>
        </Card>
     )
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800 text-white h-full">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-zinc-200">Bar Chart - Mixed</CardTitle>
        <CardDescription className="text-zinc-500">January - June 2024</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    layout="vertical"
                    data={data}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                    {/* <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#27272a" /> */}
                    <XAxis type="number" hide />
                    <YAxis 
                        dataKey="name" 
                        type="category" 
                        axisLine={false}
                        tickLine={false}
                        width={60}
                        tick={{ fill: '#a1a1aa', fontSize: 12 }}
                    />
                    <Tooltip 
                         cursor={{fill: '#27272a'}}
                         contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }}
                         itemStyle={{ color: '#fff' }}
                    />
                    <Bar dataKey="visitors" radius={[0, 4, 4, 0]} barSize={32}>
                        {data.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
