"use client";

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
  return (
    <Card className="bg-zinc-900 border-zinc-800 text-white h-full">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-zinc-200">Pie Chart - Donut with Text</CardTitle>
        <CardDescription className="text-zinc-500">January - June 2024</CardDescription>
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
                         contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }}
                         itemStyle={{ color: '#fff' }}
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
                <span className="text-xs text-zinc-500">Visitors</span>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
