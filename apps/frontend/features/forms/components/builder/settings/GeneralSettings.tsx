'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'

interface GeneralSettingsProps {
  settings: any
  onChange: (settings: any) => void
  sheets?: any[]
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

export function GeneralSettings({ settings, onChange, sheets = [] }: GeneralSettingsProps) {
  const set = (key: string, value: any) => onChange({ ...settings, [key]: value })

  return (
    <div className="space-y-6">
      {/* Identity */}
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="formTitle">Title</Label>
          <Input
            id="formTitle"
            value={settings.title || ''}
            onChange={(e) => set('title', e.target.value)}
            placeholder="Enter form title"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="formDescription">Description</Label>
          <Textarea
            id="formDescription"
            value={settings.description || ''}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Optional description shown to respondents"
            rows={2}
          />
        </div>
      </div>

      <Separator />

      {/* Progress */}
      <div className="space-y-3">
        <SectionLabel>Progress</SectionLabel>
        <div className="divide-y divide-border rounded-md border">
          <ToggleRow
            id="showProgress"
            label="Show Progress Indicator"
            description="Display completion progress to respondents"
            checked={settings.showProgress ?? true}
            onCheckedChange={(v) => set('showProgress', v)}
          />
          {(settings.showProgress ?? true) && (
            <div className="px-3 py-3">
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="progressStyle" className="text-sm font-normal shrink-0">Style</Label>
                <Select value={settings.progressStyle || 'bar'} onValueChange={(v) => set('progressStyle', v)}>
                  <SelectTrigger id="progressStyle" className="h-8 w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bar">Progress Bar</SelectItem>
                    <SelectItem value="steps">Step Indicators</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* Submission */}
      <div className="space-y-3">
        <SectionLabel>Submission</SectionLabel>
        <div className="divide-y divide-border rounded-md border">
          <ToggleRow
            id="allowAnonymous"
            label="Allow Anonymous Submissions"
            description="Respondents can submit without signing in"
            checked={settings.allowAnonymous ?? false}
            onCheckedChange={(v) => set('allowAnonymous', v)}
          />
          <ToggleRow
            id="allowSave"
            label="Allow Save as Draft"
            description="Respondents can save progress and return later"
            checked={settings.allowSave ?? false}
            onCheckedChange={(v) => set('allowSave', v)}
          />
          <ToggleRow
            id="confirmBeforeSubmit"
            label="Confirm Before Submit"
            description="Show a confirmation dialog before final submission"
            checked={settings.confirmBeforeSubmit ?? false}
            onCheckedChange={(v) => set('confirmBeforeSubmit', v)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="successMessage">Success Message</Label>
          <Textarea
            id="successMessage"
            value={settings.successMessage || ''}
            onChange={(e) => set('successMessage', e.target.value)}
            placeholder="Thank you for your submission!"
            rows={2}
          />
        </div>
      </div>

      <Separator />

      {/* Output */}
      <div className="space-y-3">
        <SectionLabel>Output Sheet</SectionLabel>
        <div className="space-y-1.5">
          <Label htmlFor="targetSheet">Linked Sheet</Label>
          <Select
            value={settings.targetSheetId || ''}
            onValueChange={(v) => set('targetSheetId', v)}
          >
            <SelectTrigger id="targetSheet">
              <SelectValue placeholder="Select a sheet…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None — don't sync</SelectItem>
              {sheets.map((sheet) => (
                <SelectItem key={sheet.id} value={sheet.id}>
                  {sheet.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[11px] text-muted-foreground">Submissions are appended as new rows to this sheet</p>
        </div>
        {settings.targetSheetId && settings.targetSheetId !== 'none' && (
          <div className="space-y-1.5">
            <Label htmlFor="attachmentMode">File Attachment Mode</Label>
            <Select
              value={settings.attachmentMode || 'embed_cells'}
              onValueChange={(v) => set('attachmentMode', v)}
            >
              <SelectTrigger id="attachmentMode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="embed_cells">Embed photos in cells</SelectItem>
                <SelectItem value="attach_row">Attach files to row</SelectItem>
                <SelectItem value="both">Both — embed + attach</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  )
}
