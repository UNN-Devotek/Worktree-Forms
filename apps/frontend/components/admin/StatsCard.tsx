import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string;
  trend: string;
  trendDirection: 'up' | 'down' | 'neutral';
  subtext?: string;
  subtext2?: string;
}

export function StatsCard({ title, value, trend, trendDirection, subtext, subtext2 }: StatsCardProps) {
  return (
    <Card className="bg-zinc-900 border-zinc-800 text-white">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-zinc-400">{title}</CardTitle>
        <div className={`flex items-center text-xs font-medium ${
            trendDirection === 'up' ? 'text-green-500' : 
            trendDirection === 'down' ? 'text-red-500' : 'text-zinc-500'
        }`}>
            {trendDirection === 'up' && <ArrowUpRight className="h-3 w-3 mr-1" />}
            {trendDirection === 'down' && <ArrowDownRight className="h-3 w-3 mr-1" />}
            {trendDirection === 'neutral' && <Minus className="h-3 w-3 mr-1" />}
            {trend}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {(subtext || subtext2) && (
            <div className="mt-2 space-y-1">
                {subtext && (
                    <p className="text-xs text-zinc-500 flex items-center justify-between">
                        <span>{subtext.split('  ')[0]}</span>
                        {subtext.includes('  ') && <ArrowUpRight className="h-3 w-3" />}
                    </p>
                )}
                 {subtext2 && (
                    <p className="text-xs text-zinc-500 flex items-center justify-between">
                        <span>{subtext2.split('  ')[0]}</span>
                         {subtext2.includes('  ') && <ArrowUpRight className="h-3 w-3" />}
                    </p>
                )}
            </div>
        )}
      </CardContent>
    </Card>
  );
}
