'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Plus } from 'lucide-react';

export default function AdminRoles() {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">Role Definitions</h3>
                    <p className="text-sm text-muted-foreground">Configure RBAC policies and permissions.</p>
                </div>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create Role
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Shield className="h-5 w-5 text-indigo-400" />
                                Global Admin
                            </div>
                            <Badge variant="outline" className="border-indigo-500/50 text-indigo-500 bg-indigo-500/10">System</Badge>
                        </CardTitle>
                        <CardDescription>Full access to all system resources.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm font-medium mb-2">Permissions:</div>
                        <div className="flex flex-wrap gap-2">
                            {['read:all', 'write:all', 'delete:all', 'admin:access'].map(p => (
                                <Badge key={p} variant="secondary">{p}</Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Shield className="h-5 w-5 text-emerald-500" />
                                Form Editor
                            </div>
                            <Badge variant="outline">Custom</Badge>
                        </CardTitle>
                        <CardDescription>Can create and manage forms.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm font-medium mb-2">Permissions:</div>
                        <div className="flex flex-wrap gap-2">
                            {['read:forms', 'write:forms', 'read:submissions'].map(p => (
                                <Badge key={p} variant="secondary">{p}</Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Shield className="h-5 w-5 text-blue-500" />
                                Viewer
                            </div>
                            <Badge variant="outline">Custom</Badge>
                        </CardTitle>
                        <CardDescription>Read-only access to published forms.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm font-medium mb-2">Permissions:</div>
                        <div className="flex flex-wrap gap-2">
                            {['read:forms', 'submit:forms'].map(p => (
                                <Badge key={p} variant="secondary">{p}</Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
