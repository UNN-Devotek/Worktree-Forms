'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'

interface AdvancedSettingsProps {
  settings: any
  onChange: (settings: any) => void
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </p>
  )
}

function ToggleRow({ id, label, description, checked, onCheckedChange }: {
  id: string
  label: string
  description?: string
  checked: boolean
  onCheckedChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between px-3 py-3">
      <div className="flex-1 pr-6 space-y-0.5">
        <Label htmlFor={id} className="text-sm font-normal cursor-pointer leading-snug">{label}</Label>
        {description && <p className="text-[11px] text-muted-foreground leading-snug">{description}</p>}
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}

export function AdvancedSettings({ settings, onChange }: AdvancedSettingsProps) {
  const set = (key: string, value: any) => onChange({ ...settings, [key]: value })

  return (
    <div className="space-y-6">
      {/* Access */}
      <div className="space-y-3">
        <SectionLabel>Access</SectionLabel>
        <div className="divide-y divide-border rounded-md border">
          <ToggleRow
            id="requireLogin"
            label="Require Sign-in"
            description="Only authenticated users can submit this form"
            checked={settings.requireLogin ?? false}
            onCheckedChange={(v) => set('requireLogin', v)}
          />
          <ToggleRow
            id="enableCaptcha"
            label="Enable CAPTCHA"
            description="Prevent spam and automated bot submissions"
            checked={settings.enableCaptcha ?? false}
            onCheckedChange={(v) => set('enableCaptcha', v)}
          />
        </div>
      </div>

      <Separator />

      {/* Limits */}
      <div className="space-y-3">
        <SectionLabel>Submission Limits</SectionLabel>
        <div className="divide-y divide-border rounded-md border">
          <ToggleRow
            id="enableSubmissionLimit"
            label="Limit Total Responses"
            description="Close the form after a set number of submissions"
            checked={settings.enableSubmissionLimit ?? false}
            onCheckedChange={(v) => set('enableSubmissionLimit', v)}
          />
          <ToggleRow
            id="oneResponsePerUser"
            label="One Response per User"
            description="Each signed-in user can only submit once"
            checked={settings.oneResponsePerUser ?? false}
            onCheckedChange={(v) => set('oneResponsePerUser', v)}
          />
        </div>
        {settings.enableSubmissionLimit && (
          <div className="space-y-1.5">
            <Label htmlFor="maxSubmissions">Maximum Responses</Label>
            <Input
              id="maxSubmissions"
              type="number"
              min="1"
              value={settings.maxSubmissions || ''}
              onChange={(e) => set('maxSubmissions', parseInt(e.target.value) || 0)}
              placeholder="100"
              className="max-w-[160px]"
            />
          </div>
        )}
      </div>

      <Separator />

      {/* Scheduling */}
      <div className="space-y-3">
        <SectionLabel>Scheduling</SectionLabel>
        <div className="divide-y divide-border rounded-md border">
          <ToggleRow
            id="enableScheduling"
            label="Schedule Availability"
            description="Set start and end dates for this form"
            checked={settings.enableScheduling ?? false}
            onCheckedChange={(v) => set('enableScheduling', v)}
          />
        </div>
        {settings.enableScheduling && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="startDate">Opens</Label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  value={settings.startDate || ''}
                  onChange={(e) => set('startDate', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="endDate">Closes</Label>
                <Input
                  id="endDate"
                  type="datetime-local"
                  value={settings.endDate || ''}
                  onChange={(e) => set('endDate', e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="closedMessage">Closed Message</Label>
              <Textarea
                id="closedMessage"
                value={settings.closedMessage || ''}
                onChange={(e) => set('closedMessage', e.target.value)}
                placeholder="This form is not currently accepting responses."
                rows={2}
              />
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* Webhooks */}
      <div className="space-y-3">
        <SectionLabel>Webhooks</SectionLabel>
        <div className="divide-y divide-border rounded-md border">
          <ToggleRow
            id="enableWebhook"
            label="Enable Webhook"
            description="POST submission data to an external URL on each response"
            checked={settings.enableWebhook ?? false}
            onCheckedChange={(v) => set('enableWebhook', v)}
          />
        </div>
        {settings.enableWebhook && (
          <div className="space-y-1.5">
            <Label htmlFor="webhookUrl">Webhook URL</Label>
            <Input
              id="webhookUrl"
              type="url"
              value={settings.webhookUrl || ''}
              onChange={(e) => set('webhookUrl', e.target.value)}
              placeholder="https://example.com/webhook"
            />
            <p className="text-[11px] text-muted-foreground">Submissions are sent as HTTP POST requests to this URL</p>
          </div>
        )}
      </div>
    </div>
  )
}
