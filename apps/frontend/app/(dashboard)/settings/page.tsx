'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileForm } from "@/features/users/components/profile-form";
import { Users, User, Shield } from "lucide-react";

export default function SettingsPage() {
    return (
        <div className="flex flex-col gap-6 p-10 pb-16 max-w-5xl mx-auto">
            <div className="space-y-0.5">
                <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
                <p className="text-muted-foreground">
                    Manage your account settings and global preferences.
                </p>
            </div>

            <Tabs defaultValue="profile" className="w-full space-y-6">
                <TabsList>
                    <TabsTrigger value="profile">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                    </TabsTrigger>
                    <TabsTrigger value="users">
                        <Users className="mr-2 h-4 w-4" />
                        Users
                    </TabsTrigger>
                    <TabsTrigger value="security">
                        <Shield className="mr-2 h-4 w-4" />
                        Security
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="profile">
                    <Card>
                        <CardHeader>
                            <CardTitle>Profile</CardTitle>
                            <CardDescription>Manage your public profile information.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <ProfileForm />
                        </CardContent>
                    </Card>
                </TabsContent>
                
                <TabsContent value="users">
                    <Card>
                        <CardHeader>
                            <CardTitle>User Management</CardTitle>
                            <CardDescription>Manage platform users and permissions.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col items-center justify-center min-h-[300px] border border-dashed rounded-lg bg-muted/10">
                                <Users className="h-10 w-10 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-medium">User Management</h3>
                                <p className="text-muted-foreground text-center max-w-sm mt-2">
                                    Global user management features are currently under development. 
                                    Please use Project Settings to manage members for specific projects.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="security">
                    <Card>
                        <CardHeader>
                            <CardTitle>Security</CardTitle>
                            <CardDescription>Manage your password and sessions.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm text-muted-foreground">Security settings coming soon.</div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
