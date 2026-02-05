'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface VisibilitySettingsProps {
  groupId: number
  settings: {
    sig_ids?: number[]
    [key: string]: any
  }
  onChange: (settings: any) => void
}

export function VisibilitySettings({}: VisibilitySettingsProps) {
  // Simplified for now, removed SIG dependency
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Visibility Settings</CardTitle>
          <CardDescription>
            Configure who can see this form.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Global visibility settings are active.</p>
        </CardContent>
      </Card>
    </div>
  )
}
