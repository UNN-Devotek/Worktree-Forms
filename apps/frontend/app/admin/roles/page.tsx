'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Plus } from 'lucide-react';

export default function RolesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Role Definitions</h2>
          <p className="text-muted-foreground">Configure RBAC policies and permissions.</p>
        </div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" />
            Create Role
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-card border-border text-card-foreground">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-indigo-400" />
                  Global Admin
              </div>
              <Badge variant="outline" className="border-indigo-500/50 text-indigo-500 bg-indigo-500/10">System</Badge>
            </CardTitle>
            <CardDescription className="text-muted-foreground">Full access to all system resources.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium text-foreground">Permissions:</div>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="secondary" className="bg-secondary text-secondary-foreground hover:bg-secondary/80">read:all</Badge>
              <Badge variant="secondary" className="bg-secondary text-secondary-foreground hover:bg-secondary/80">write:all</Badge>
              <Badge variant="secondary" className="bg-secondary text-secondary-foreground hover:bg-secondary/80">delete:all</Badge>
              <Badge variant="secondary" className="bg-secondary text-secondary-foreground hover:bg-secondary/80">admin:access</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border text-card-foreground">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
                 <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-emerald-500" />
                  Form Editor
              </div>
              <Badge variant="outline" className="border-border text-muted-foreground bg-muted/50">Custom</Badge>
            </CardTitle>
            <CardDescription className="text-muted-foreground">Can create and manage forms.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium text-foreground">Permissions:</div>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="secondary" className="bg-secondary text-secondary-foreground hover:bg-secondary/80">read:forms</Badge>
              <Badge variant="secondary" className="bg-secondary text-secondary-foreground hover:bg-secondary/80">write:forms</Badge>
              <Badge variant="secondary" className="bg-secondary text-secondary-foreground hover:bg-secondary/80">read:submissions</Badge>
            </div>
          </CardContent>
        </Card>

         <Card className="bg-card border-border text-card-foreground">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
                 <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-500" />
                  Viewer
              </div>
              <Badge variant="outline" className="border-border text-muted-foreground bg-muted/50">Custom</Badge>
            </CardTitle>
            <CardDescription className="text-muted-foreground">Read-only access to published forms.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium text-foreground">Permissions:</div>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="secondary" className="bg-secondary text-secondary-foreground hover:bg-secondary/80">read:forms</Badge>
              <Badge variant="secondary" className="bg-secondary text-secondary-foreground hover:bg-secondary/80">submit:forms</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
