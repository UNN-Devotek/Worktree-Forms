'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { apiRequest } from '@/lib/api';

interface User {
    id: string;
    email: string;
    name?: string;
    role: string;
    createdAt: string;
}

interface UsersResponse {
    success: boolean;
    data: User[];
    meta?: { total: number };
}

export default function AdminUsers() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        apiRequest<UsersResponse>('/api/users', { signal: controller.signal })
            .then((res) => setUsers(res?.data ?? []))
            .catch((err) => {
                if (err instanceof Error && err.name !== 'AbortError') setError(err.message);
            })
            .finally(() => setLoading(false));
        return () => controller.abort();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-48">
                <Loader2 className="animate-spin h-6 w-6 text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">Site-wide Users</h3>
                    <p className="text-sm text-muted-foreground">Manage platform users and system roles.</p>
                </div>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add User
                </Button>
            </div>

            {error ? (
                <p className="text-sm text-destructive">{error}</p>
            ) : (
                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>No.</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                            No users found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    users.map((user, idx) => (
                                        <TableRow key={user.id}>
                                            <TableCell>{idx + 1}</TableCell>
                                            <TableCell>{user.name ?? '-'}</TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>{user.role}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm">Edit</Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
