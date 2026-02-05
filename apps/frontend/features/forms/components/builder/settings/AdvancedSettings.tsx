'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface AdvancedSettingsProps {
  settings: any
  onChange: (settings: any) => void
}

export function AdvancedSettings({ settings, onChange }: AdvancedSettingsProps) {
  const handleUpdate = (key: string, value: any) => {
    onChange({
      ...settings,
      [key]: value
    })
  }

  return (
    <div className="space-y-6">
      {/* Submission Limits */}
      <Card>
        <CardHeader>
          <CardTitle>Submission Limits</CardTitle>
          <CardDescription>Control how many responses can be submitted</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Submission Limit</Label>
              <p className="text-sm text-muted-foreground">
                Set a maximum number of submissions
              </p>
            </div>
            <Switch
              checked={settings.enableSubmissionLimit ?? false}
              onCheckedChange={(checked) => handleUpdate('enableSubmissionLimit', checked)}
            />
          </div>

          {settings.enableSubmissionLimit && (
            <div className="space-y-2">
              <Label htmlFor="maxSubmissions">Maximum Submissions</Label>
              <Input
                id="maxSubmissions"
                type="number"
                min="1"
                value={settings.maxSubmissions || ''}
                onChange={(e) => handleUpdate('maxSubmissions', parseInt(e.target.value) || 0)}
                placeholder="100"
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>One Response per User</Label>
              <p className="text-sm text-muted-foreground">
                Users can only submit once
              </p>
            </div>
            <Switch
              checked={settings.oneResponsePerUser ?? false}
              onCheckedChange={(checked) => handleUpdate('oneResponsePerUser', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Scheduling */}
      <Card>
        <CardHeader>
          <CardTitle>Form Scheduling</CardTitle>
          <CardDescription>Set when the form is available</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Schedule Form Availability</Label>
              <p className="text-sm text-muted-foreground">
                Set start and end dates for the form
              </p>
            </div>
            <Switch
              checked={settings.enableScheduling ?? false}
              onCheckedChange={(checked) => handleUpdate('enableScheduling', checked)}
            />
          </div>

          {settings.enableScheduling && (
            <>
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  value={settings.startDate || ''}
                  onChange={(e) => handleUpdate('startDate', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="datetime-local"
                  value={settings.endDate || ''}
                  onChange={(e) => handleUpdate('endDate', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="closedMessage">Closed Message</Label>
                <Textarea
                  id="closedMessage"
                  value={settings.closedMessage || ''}
                  onChange={(e) => handleUpdate('closedMessage', e.target.value)}
                  placeholder="This form is currently not accepting responses."
                  rows={3}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle>Security Options</CardTitle>
          <CardDescription>Additional security measures</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable CAPTCHA</Label>
              <p className="text-sm text-muted-foreground">
                Prevent spam with CAPTCHA verification
              </p>
            </div>
            <Switch
              checked={settings.enableCaptcha ?? false}
              onCheckedChange={(checked) => handleUpdate('enableCaptcha', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Require Login</Label>
              <p className="text-sm text-muted-foreground">
                Only logged-in users can submit
              </p>
            </div>
            <Switch
              checked={settings.requireLogin ?? false}
              onCheckedChange={(checked) => handleUpdate('requireLogin', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Webhooks */}
      <Card>
        <CardHeader>
          <CardTitle>Webhooks</CardTitle>
          <CardDescription>Send form data to external services</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Webhook</Label>
              <p className="text-sm text-muted-foreground">
                POST form data to a webhook URL
              </p>
            </div>
            <Switch
              checked={settings.enableWebhook ?? false}
              onCheckedChange={(checked) => handleUpdate('enableWebhook', checked)}
            />
          </div>

          {settings.enableWebhook && (
            <div className="space-y-2">
              <Label htmlFor="webhookUrl">Webhook URL</Label>
              <Input
                id="webhookUrl"
                type="url"
                value={settings.webhookUrl || ''}
                onChange={(e) => handleUpdate('webhookUrl', e.target.value)}
                placeholder="https://example.com/webhook"
              />
              <p className="text-xs text-muted-foreground">
                Form submissions will be sent as POST requests to this URL
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
