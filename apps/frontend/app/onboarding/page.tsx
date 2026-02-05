
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import VisaWizard from './VisaWizard';

export default function OnboardingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-muted/50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Account Verification (Visa)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Welcome to Worktree. Before you can access project data, we need to verify your insurance and compliance details.
          </p>
          <div className="p-6 border rounded bg-background">
             <VisaWizard />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
