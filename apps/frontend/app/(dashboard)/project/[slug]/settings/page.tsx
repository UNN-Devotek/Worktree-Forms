'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { use, useState } from "react";
import { toast } from "sonner";

export default function ProjectSettingsPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params);
    return (
        <div className="flex flex-col gap-6 p-8 max-w-5xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Project Settings</h1>
                <p className="text-muted-foreground">Manage your project configuration and preferences.</p>
            </div>

            <Tabs defaultValue="general" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="integrations">Integrations</TabsTrigger>
                    <TabsTrigger value="notifications">Notifications</TabsTrigger>
                    <TabsTrigger value="danger">Danger Zone</TabsTrigger>
                </TabsList>

                <TabsContent value="general">
                    <GeneralSettings slug={slug} />
                </TabsContent>
                
                <TabsContent value="integrations">
                    <IntegrationSettings />
                </TabsContent>

                <TabsContent value="notifications">
                    <NotificationSettings />
                </TabsContent>

                <TabsContent value="danger">
                    <DangerZone slug={slug} />
                </TabsContent>
            </Tabs>
        </div>
    );
}

function GeneralSettings({ slug }: { slug: string }) {
    const [isLoading, setIsLoading] = useState(false);

    const onSave = () => {
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            toast.success("Project settings saved");
        }, 1000);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>General Information</CardTitle>
                <CardDescription>Update your project name and details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-2">
                    <Label htmlFor="name">Project Name</Label>
                    <Input id="name" defaultValue="Demo Project" />
                </div>
                <div className="grid gap-2">
                     <Label htmlFor="slug">Project URL Slug</Label>
                     <Input id="slug" value={slug} disabled className="bg-muted" />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="desc">Description</Label>
                    <Input id="desc" defaultValue="A demo project for Worktree verification." />
                </div>
                
                <div className="flex justify-end mt-4">
                    <Button onClick={onSave} disabled={isLoading}>
                        {isLoading ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

function IntegrationSettings() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Integrations</CardTitle>
                <CardDescription>Connect with third-party services.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <div className="font-medium">Google Drive</div>
                        <div className="text-sm text-muted-foreground">Sync files to Google Drive</div>
                    </div>
                    <Button variant="outline">Connect</Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <div className="font-medium">Slack Webhook</div>
                        <div className="text-sm text-muted-foreground">Send notifications to a Slack channel</div>
                    </div>
                    <Button variant="outline">Configure</Button>
                </div>
            </CardContent>
        </Card>
    );
}

function NotificationSettings() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Configure how you receive alerts.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="flex items-center space-x-2">
                    <input type="checkbox" id="email" className="rounded border-gray-300" defaultChecked />
                    <Label htmlFor="email">Email Notifications</Label>
                 </div>
                 <div className="flex items-center space-x-2">
                    <input type="checkbox" id="push" className="rounded border-gray-300" defaultChecked />
                    <Label htmlFor="push">Push Notifications (Mobile)</Label>
                 </div>
                 <div className="flex items-center space-x-2">
                    <input type="checkbox" id="digest" className="rounded border-gray-300" />
                    <Label htmlFor="digest">Weekly Digest</Label>
                 </div>
            </CardContent>
        </Card>
    );
}

function DangerZone({ slug: _slug }: { slug: string }) {
    return (
        <Card className="border-red-500/50 bg-red-50/50 dark:bg-red-950/10">
            <CardHeader>
                <CardTitle className="text-red-600 dark:text-red-400">Danger Zone</CardTitle>
                <CardDescription>Irreversible actions.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between">
                    <div>
                        <div className="font-medium">Archive Project</div>
                        <div className="text-sm text-muted-foreground">Make this project read-only.</div>
                    </div>
                    <Button variant="outline" className="text-red-600 hover:bg-red-100 border-red-200">Archive</Button>
                </div>
                <Separator className="my-4" />
                <div className="flex items-center justify-between">
                    <div>
                        <div className="font-medium">Delete Project</div>
                        <div className="text-sm text-muted-foreground">Permanently delete this project and all its data.</div>
                    </div>
                    <Button variant="destructive">Delete Project</Button>
                </div>
            </CardContent>
        </Card>
    );
}
