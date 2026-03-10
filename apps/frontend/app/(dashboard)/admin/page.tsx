'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard, Users, Shield, Blocks } from "lucide-react";

// Tab content
import AdminOverview from "./tabs/overview";
import AdminUsers from "./tabs/users";
import AdminRoles from "./tabs/roles";
import ComponentLibraryPage from "@/app/(dashboard)/component-library/page";

export default function AdminDashboardPage() {
    return (
        <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
            <div className="space-y-0.5">
                <h2 className="text-3xl font-bold tracking-tight">Admin</h2>
                <p className="text-muted-foreground">
                    Site-wide management — users, roles, and platform metrics.
                </p>
            </div>

            <Tabs defaultValue="overview" className="w-full space-y-6">
                <TabsList>
                    <TabsTrigger value="overview" className="flex items-center gap-2">
                        <LayoutDashboard className="h-4 w-4" />
                        Overview
                    </TabsTrigger>
                    <TabsTrigger value="users" className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Users
                    </TabsTrigger>
                    <TabsTrigger value="roles" className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Roles
                    </TabsTrigger>
                    <TabsTrigger value="components" className="flex items-center gap-2">
                        <Blocks className="h-4 w-4" />
                        Component Library
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                    <AdminOverview />
                </TabsContent>

                <TabsContent value="users">
                    <AdminUsers />
                </TabsContent>

                <TabsContent value="roles">
                    <AdminRoles />
                </TabsContent>

                <TabsContent value="components">
                    <ComponentLibraryPage />
                </TabsContent>
            </Tabs>
        </div>
    );
}
