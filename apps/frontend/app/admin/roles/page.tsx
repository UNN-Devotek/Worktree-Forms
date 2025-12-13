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
          <h2 className="text-2xl font-bold tracking-tight text-zinc-100">Role Definitions</h2>
          <p className="text-zinc-400">Configure RBAC policies and permissions.</p>
        </div>
        <Button className="bg-zinc-100 text-zinc-900 hover:bg-white">
            <Plus className="mr-2 h-4 w-4" />
            Create Role
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-zinc-900 border-zinc-800 text-white">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-indigo-400" />
                  Global Admin
              </div>
              <Badge variant="outline" className="border-indigo-500/50 text-indigo-400 bg-indigo-500/10">System</Badge>
            </CardTitle>
            <CardDescription className="text-zinc-400">Full access to all system resources.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium text-zinc-300">Permissions:</div>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="secondary" className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700">read:all</Badge>
              <Badge variant="secondary" className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700">write:all</Badge>
              <Badge variant="secondary" className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700">delete:all</Badge>
              <Badge variant="secondary" className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700">admin:access</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 text-white">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
                 <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-emerald-400" />
                  Form Editor
              </div>
              <Badge variant="outline" className="border-zinc-700 text-zinc-400 bg-zinc-800/50">Custom</Badge>
            </CardTitle>
            <CardDescription className="text-zinc-400">Can create and manage forms.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium text-zinc-300">Permissions:</div>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="secondary" className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700">read:forms</Badge>
              <Badge variant="secondary" className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700">write:forms</Badge>
              <Badge variant="secondary" className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700">read:submissions</Badge>
            </div>
          </CardContent>
        </Card>

         <Card className="bg-zinc-900 border-zinc-800 text-white">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
                 <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-400" />
                  Viewer
              </div>
              <Badge variant="outline" className="border-zinc-700 text-zinc-400 bg-zinc-800/50">Custom</Badge>
            </CardTitle>
            <CardDescription className="text-zinc-400">Read-only access to published forms.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium text-zinc-300">Permissions:</div>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="secondary" className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700">read:forms</Badge>
              <Badge variant="secondary" className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700">submit:forms</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
