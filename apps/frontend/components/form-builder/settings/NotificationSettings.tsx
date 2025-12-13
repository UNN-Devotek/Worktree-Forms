'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'
import { useState, KeyboardEvent } from 'react'

interface NotificationSettingsProps {
  settings: any
  onChange: (settings: any) => void
}

export function NotificationSettings({ settings, onChange }: NotificationSettingsProps) {
  const [emailInput, setEmailInput] = useState('')

  const handleUpdate = (key: string, value: any) => {
    onChange({
      ...settings,
      [key]: value
    })
  }

  const handleAddEmail = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && emailInput.trim()) {
      e.preventDefault()
      const emails = settings.notificationEmails || []
      if (!emails.includes(emailInput.trim())) {
        handleUpdate('notificationEmails', [...emails, emailInput.trim()])
      }
      setEmailInput('')
    }
  }

  const handleRemoveEmail = (email: string) => {
    const emails = settings.notificationEmails || []
    handleUpdate('notificationEmails', emails.filter((e: string) => e !== email))
  }

  return (
    <div className="space-y-6">
      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Email Notifications</CardTitle>
          <CardDescription>Configure email notifications for form submissions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Send Email on Submission</Label>
              <p className="text-sm text-muted-foreground">
                Notify recipients when a form is submitted
              </p>
            </div>
            <Switch
              checked={settings.sendEmail ?? false}
              onCheckedChange={(checked) => handleUpdate('sendEmail', checked)}
            />
          </div>

          {settings.sendEmail && (
            <>
              <div className="space-y-2">
                <Label htmlFor="notificationEmails">Notification Recipients</Label>
                <Input
                  id="notificationEmails"
                  type="email"
                  placeholder="Enter email and press Enter"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyDown={handleAddEmail}
                />
                <p className="text-xs text-muted-foreground">
                  Press Enter to add multiple email addresses
                </p>
                {settings.notificationEmails && settings.notificationEmails.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {settings.notificationEmails.map((email: string) => (
                      <Badge key={email} variant="secondary" className="gap-1">
                        {email}
                        <button
                          type="button"
                          onClick={() => handleRemoveEmail(email)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="emailSubject">Email Subject</Label>
                <Input
                  id="emailSubject"
                  value={settings.emailSubject || ''}
                  onChange={(e) => handleUpdate('emailSubject', e.target.value)}
                  placeholder="New Form Submission"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emailTemplate">Email Template</Label>
                <Textarea
                  id="emailTemplate"
                  value={settings.emailTemplate || ''}
                  onChange={(e) => handleUpdate('emailTemplate', e.target.value)}
                  placeholder="A new form submission has been received..."
                  rows={5}
                />
                <p className="text-xs text-muted-foreground">
                  You can use {'{'}field_name{'}'} to insert form field values
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Respondent Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Respondent Notifications</CardTitle>
          <CardDescription>Send confirmation emails to form respondents</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Send Confirmation Email</Label>
              <p className="text-sm text-muted-foreground">
                Send a confirmation to the person who submitted the form
              </p>
            </div>
            <Switch
              checked={settings.sendConfirmation ?? false}
              onCheckedChange={(checked) => handleUpdate('sendConfirmation', checked)}
            />
          </div>

          {settings.sendConfirmation && (
            <>
              <div className="space-y-2">
                <Label htmlFor="confirmationSubject">Confirmation Subject</Label>
                <Input
                  id="confirmationSubject"
                  value={settings.confirmationSubject || ''}
                  onChange={(e) => handleUpdate('confirmationSubject', e.target.value)}
                  placeholder="Thank you for your submission"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmationTemplate">Confirmation Message</Label>
                <Textarea
                  id="confirmationTemplate"
                  value={settings.confirmationTemplate || ''}
                  onChange={(e) => handleUpdate('confirmationTemplate', e.target.value)}
                  placeholder="Thank you for completing the form..."
                  rows={5}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
