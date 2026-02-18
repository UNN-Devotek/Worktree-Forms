'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface GeneralSettingsProps {
  settings: any
  onChange: (settings: any) => void
  sheets?: any[]
}

export function GeneralSettings({ settings, onChange, sheets = [] }: GeneralSettingsProps) {
  const handleUpdate = (key: string, value: any) => {
    onChange({
      ...settings,
      [key]: value
    })
  }

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Form title and description</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="formTitle">Form Title</Label>
            <Input
              id="formTitle"
              value={settings.title || ''}
              onChange={(e) => handleUpdate('title', e.target.value)}
              placeholder="Enter form title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="formDescription">Description</Label>
            <Textarea
              id="formDescription"
              value={settings.description || ''}
              onChange={(e) => handleUpdate('description', e.target.value)}
              placeholder="Enter form description"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Display Options */}
      <Card>
        <CardHeader>
          <CardTitle>Display Options</CardTitle>
          <CardDescription>Control how the form is displayed</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show Progress Bar</Label>
              <p className="text-sm text-muted-foreground">
                Track and display completion of required fields
              </p>
            </div>
            <Switch
              checked={settings.showProgress ?? true}
              onCheckedChange={(checked) => handleUpdate('showProgress', checked)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="progressStyle">Progress Style</Label>
            <Select
              value={settings.progressStyle || 'bar'}
              onValueChange={(value) => handleUpdate('progressStyle', value)}
            >
              <SelectTrigger id="progressStyle">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bar">Progress Bar</SelectItem>
                <SelectItem value="steps">Step Indicators</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Submission Options */}
      <Card>
        <CardHeader>
          <CardTitle>Submission Options</CardTitle>
          <CardDescription>Control form submission behavior</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Allow Anonymous Submissions</Label>
              <p className="text-sm text-muted-foreground">
                Users can submit without logging in
              </p>
            </div>
            <Switch
              checked={settings.allowAnonymous ?? false}
              onCheckedChange={(checked) => handleUpdate('allowAnonymous', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Allow Save as Draft</Label>
              <p className="text-sm text-muted-foreground">
                Users can save progress and return later
              </p>
            </div>
            <Switch
              checked={settings.allowSave ?? false}
              onCheckedChange={(checked) => handleUpdate('allowSave', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Confirm Before Submit</Label>
              <p className="text-sm text-muted-foreground">
                Show confirmation dialog before submission
              </p>
            </div>
            <Switch
              checked={settings.confirmBeforeSubmit ?? false}
              onCheckedChange={(checked) => handleUpdate('confirmBeforeSubmit', checked)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="successMessage">Success Message</Label>
            <Textarea
              id="successMessage"
              value={settings.successMessage || ''}
              onChange={(e) => handleUpdate('successMessage', e.target.value)}
              placeholder="Thank you for your submission!"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="targetSheet">Output to Sheet</Label>
            <p className="text-sm text-muted-foreground">
              Automatically append submissions to a specific sheet
            </p>
            <Select
              value={settings.targetSheetId || ''}
              onValueChange={(value) => handleUpdate('targetSheetId', value)}
            >
              <SelectTrigger id="targetSheet">
                <SelectValue placeholder="Select a sheet..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (Don't sync)</SelectItem>
                {sheets?.map((sheet) => (
                  <SelectItem key={sheet.id} value={sheet.id}>
                    {sheet.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
