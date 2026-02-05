import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { AlertCircle, HardDrive, FileText } from "lucide-react";

interface ProjectUsageCardProps {
    plan: string;
    storageUsage: number | string; // bytes
    submissionCount: number;
}

const PLAN_LIMITS: Record<string, { storage: number; submissions: number }> = {
    'FREE': { storage: 1 * 1024 * 1024 * 1024, submissions: 100 },
    'PRO': { storage: 10 * 1024 * 1024 * 1024, submissions: 10000 },
    'ENTERPRISE': { storage: 100 * 1024 * 1024 * 1024, submissions: 1000000 }
};

export function ProjectUsageCard({ plan = 'FREE', storageUsage = 0, submissionCount = 0 }: ProjectUsageCardProps) {
    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS['FREE'];
    
    // Calculate Percentages
    const storageUsedBytes = Number(storageUsage);
    const storagePercent = Math.min(100, (storageUsedBytes / limits.storage) * 100);
    
    const submissionPercent = Math.min(100, (submissionCount / limits.submissions) * 100);

    // Helpers
    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const isNearLimit = storagePercent > 80 || submissionPercent > 80;

    return (
        <Card className="shadow-sm">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-base font-medium">Usage & Billing</CardTitle>
                        <CardDescription>{plan} Plan</CardDescription>
                    </div>
                    {isNearLimit && (
                        <AlertCircle className="h-5 w-5 text-yellow-500" />
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                
                {/* Storage Usage */}
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <div className="flex items-center text-muted-foreground">
                            <HardDrive className="mr-2 h-4 w-4" />
                            Storage
                        </div>
                        <span className="font-medium">
                            {formatBytes(storageUsedBytes)} / {formatBytes(limits.storage)}
                        </span>
                    </div>
                    <Progress value={storagePercent} className={storagePercent > 90 ? "bg-red-100 [&>div]:bg-red-500" : ""} />
                </div>

                {/* Submission Usage */}
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <div className="flex items-center text-muted-foreground">
                            <FileText className="mr-2 h-4 w-4" />
                            Submissions
                        </div>
                        <span className="font-medium">
                            {submissionCount.toLocaleString()} / {limits.submissions.toLocaleString()}
                        </span>
                    </div>
                    <Progress value={submissionPercent} className={submissionPercent > 90 ? "bg-red-100 [&>div]:bg-red-500" : ""} />
                </div>

                {isNearLimit && (
                    <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => window.open('https://worktree.pro/pricing', '_blank')}>
                        Upgrade Plan
                    </Button>
                )}

            </CardContent>
        </Card>
    );
}
