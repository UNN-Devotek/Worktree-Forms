'use client'

import React from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your site settings.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>Configure general site information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="siteName">Site Name</Label>
            <Input type="text" id="siteName" name="siteName" placeholder="Worktree" defaultValue="Worktree" />
          </div>

          <div className="grid w-full max-w-sm items-center gap-1.5">
             <Label htmlFor="logo">Site Logo</Label>
             <div className="flex items-center gap-4">
                 <div className="h-16 w-16 rounded-lg border border-border bg-muted flex items-center justify-center overflow-hidden">
                     {/* Placeholder Fallback */}
                      <span className="text-xs text-muted-foreground">No Logo</span>
                      {/* logic to show img if selected would go here */}
                 </div>
                 <Input type="file" id="logo" accept="image/*" className="max-w-[200px]" />
             </div>
             <p className="text-sm text-muted-foreground">Upload your site logo (PNG, JPG, SVG).</p>
          </div>
        </CardContent>
        <CardFooter>
          <Button>Save Changes</Button>
        </CardFooter>
      </Card>
    </div>
  )
}
