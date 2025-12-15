"use client";
import { useEffect, useState } from "react";

import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const data = [
  { name: "May 31", total: 100 },
  { name: "Jun 1", total: 300 },
  { name: "Jun 2", total: 150 },
  { name: "Jun 3", total: 450 },
  { name: "Jun 4", total: 200 },
  { name: "Jun 5", total: 350 },
  { name: "Jun 6", total: 250 },
  { name: "Jun 7", total: 400 },
  { name: "Jun 8", total: 500 },
  { name: "Jun 9", total: 150 },
  { name: "Jun 10", total: 450 },
  { name: "Jun 11", total: 300 },
  { name: "Jun 12", total: 100 },
  { name: "Jun 13", total: 400 },
  { name: "Jun 14", total: 250 },
  { name: "Jun 15", total: 350 },
  { name: "Jun 16", total: 550 },
  { name: "Jun 17", total: 200 },
  { name: "Jun 18", total: 300 },
  { name: "Jun 19", total: 450 },
  { name: "Jun 20", total: 250 },
  { name: "Jun 21", total: 400 },
  { name: "Jun 22", total: 500 },
  { name: "Jun 23", total: 250 },
  { name: "Jun 24", total: 450 },
  { name: "Jun 25", total: 350 },
  { name: "Jun 26", total: 400 },
  { name: "Jun 27", total: 200 },
  { name: "Jun 29", total: 500 },
];

export function OverviewChart() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <Card className="bg-zinc-900 border-zinc-800 text-white">
        <CardHeader>
           <div className="h-6 w-32 bg-zinc-800 animate-pulse rounded" />
        </CardHeader>
        <CardContent className="h-[250px] flex items-center justify-center">
             <div className="h-full w-full bg-zinc-800/20 animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800 text-white">
      <CardHeader className="flex flex-row items-center justify-between pb-8">
        <div className="space-y-1">
            <CardTitle className="text-base font-medium text-zinc-200">Total Visitors</CardTitle>
            <CardDescription className="text-zinc-500">Total for the last 3 months</CardDescription>
        </div>
        <div className="flex items-center gap-2 text-xs">
            <span className="px-2 py-1 rounded bg-zinc-800 text-zinc-400">Last 3 months</span>
            <span className="px-2 py-1 rounded bg-blue-600/20 text-blue-400 border border-blue-600/30">Last 30 days</span>
            <span className="px-2 py-1 rounded bg-zinc-800 text-zinc-400">Last 7 days</span>
        </div>
      </CardHeader>
      <CardContent className="pl-2">
        <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
                <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorTotal2" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                </defs>
                {/* <XAxis
                dataKey="name"
                stroke="#52525b"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                interval={2} 
                />
                 */}
                {/* <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}`}
                /> */}
                <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                />
                <Area
                type="monotone"
                dataKey="total"
                stroke="#2563eb"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorTotal)"
                />
                {/* Adding a second fictional layer to match the 'wave' look in the image which has blue and green overlap */}
                <Area
                type="monotone"
                dataKey="total"
                data={data.map(d => ({...d, total: d.total * 0.7 + 50}))} 
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorTotal2)"
                />
            </AreaChart>
            </ResponsiveContainer>
        </div>
        
        {/* X-Axis labels manually placed or custom to match the very clean look in image */}
        <div className="flex justify-between mt-4 text-[10px] text-zinc-500 uppercase tracking-wider px-2">
            {data.filter((_, i) => i % 2 === 0).map((d) => (
                <div key={d.name}>{d.name}</div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
