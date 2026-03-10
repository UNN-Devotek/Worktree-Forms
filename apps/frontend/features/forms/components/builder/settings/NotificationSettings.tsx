'use client'

import { useState, KeyboardEvent } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'

interface NotificationSettingsProps {
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

export function NotificationSettings({ settings, onChange }: NotificationSettingsProps) {
  const [emailInput, setEmailInput] = useState('')
  const set = (key: string, value: any) => onChange({ ...settings, [key]: value })

  const handleAddEmail = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && emailInput.trim()) {
      e.preventDefault()
      const emails = settings.notificationEmails || []
      if (!emails.includes(emailInput.trim())) {
        set('notificationEmails', [...emails, emailInput.trim()])
      }
      setEmailInput('')
    }
  }

  const removeEmail = (email: string) =>
    set('notificationEmails', (settings.notificationEmails || []).filter((e: string) => e !== email))

  return (
    <div className="space-y-6">
      {/* Team notifications */}
      <div className="space-y-3">
        <SectionLabel>Team Notifications</SectionLabel>
        <div className="divide-y divide-border rounded-md border">
          <div className="flex items-center justify-between px-3 py-3">
            <div className="flex-1 pr-6 space-y-0.5">
              <Label htmlFor="sendEmail" className="text-sm font-normal cursor-pointer">Email on Submission</Label>
              <p className="text-[11px] text-muted-foreground">Notify team members when a form is submitted</p>
            </div>
            <Switch id="sendEmail" checked={settings.sendEmail ?? false} onCheckedChange={(v) => set('sendEmail', v)} />
          </div>
        </div>

        {settings.sendEmail && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="notificationEmails">Recipients</Label>
              <Input
                id="notificationEmails"
                type="email"
                placeholder="Add email and press Enter"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={handleAddEmail}
              />
              {(settings.notificationEmails?.length ?? 0) > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {settings.notificationEmails.map((email: string) => (
                    <Badge key={email} variant="secondary" className="gap-1 text-xs pr-1">
                      {email}
                      <button
                        type="button"
                        onClick={() => removeEmail(email)}
                        className="ml-0.5 rounded hover:text-destructive"
                        aria-label={`Remove ${email}`}
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="emailSubject">Subject Line</Label>
              <Input
                id="emailSubject"
                value={settings.emailSubject || ''}
                onChange={(e) => set('emailSubject', e.target.value)}
                placeholder="New Form Submission"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="emailTemplate">Message Template</Label>
              <Textarea
                id="emailTemplate"
                value={settings.emailTemplate || ''}
                onChange={(e) => set('emailTemplate', e.target.value)}
                placeholder="A new form submission has been received…"
                rows={3}
              />
              <p className="text-[11px] text-muted-foreground">Use {'{field_name}'} to insert form values</p>
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* Respondent confirmation */}
      <div className="space-y-3">
        <SectionLabel>Respondent Confirmation</SectionLabel>
        <div className="divide-y divide-border rounded-md border">
          <div className="flex items-center justify-between px-3 py-3">
            <div className="flex-1 pr-6 space-y-0.5">
              <Label htmlFor="sendConfirmation" className="text-sm font-normal cursor-pointer">Confirmation Email</Label>
              <p className="text-[11px] text-muted-foreground">Send a receipt to the person who submitted</p>
            </div>
            <Switch
              id="sendConfirmation"
              checked={settings.sendConfirmation ?? false}
              onCheckedChange={(v) => set('sendConfirmation', v)}
            />
          </div>
        </div>

        {settings.sendConfirmation && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="confirmationSubject">Subject Line</Label>
              <Input
                id="confirmationSubject"
                value={settings.confirmationSubject || ''}
                onChange={(e) => set('confirmationSubject', e.target.value)}
                placeholder="Thank you for your submission"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmationTemplate">Message</Label>
              <Textarea
                id="confirmationTemplate"
                value={settings.confirmationTemplate || ''}
                onChange={(e) => set('confirmationTemplate', e.target.value)}
                placeholder="Thank you for completing the form…"
                rows={3}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
