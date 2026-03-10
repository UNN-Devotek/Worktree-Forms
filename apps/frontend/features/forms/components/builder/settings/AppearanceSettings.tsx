'use client'

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Loader2, Trash2, FileText, UploadCloud } from 'lucide-react'
import { FormSettings } from '@/types/group-forms'
import { apiClient } from '@/lib/api'

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </p>
  )
}

interface AppearanceSettingsProps {
  theme: any
  settings: FormSettings
  onThemeChange: (theme: any) => void
  onSettingsChange: (settings: any) => void
  projectId?: string
}

export function AppearanceSettings({ theme, settings, onThemeChange, onSettingsChange, projectId }: AppearanceSettingsProps) {
  const [isUploading, setIsUploading] = useState(false)
  const setTheme = (key: string, value: any) => onThemeChange({ ...theme, [key]: value })
  const backgroundPdfUrl = settings?.backgroundPdfUrl

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const pid = projectId || 'shared'
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await apiClient<{ success: boolean; data: { url: string; objectKey: string } }>(
        `/api/projects/${pid}/upload`,
        { method: 'POST', body: formData, isFormData: true } as any
      )
      if (res.success && (res as any).data?.objectKey) {
        onSettingsChange({ ...settings, backgroundPdfUrl: (res as any).data.objectKey })
      }
    } catch (err) {
      console.error('Upload failed', err)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Colors */}
      <div className="space-y-3">
        <SectionLabel>Colors</SectionLabel>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="primaryColor">Primary</Label>
            <div className="flex gap-2">
              <input
                type="color"
                id="primaryColor"
                value={theme.primaryColor || '#3b82f6'}
                onChange={(e) => setTheme('primaryColor', e.target.value)}
                className="h-9 w-10 shrink-0 cursor-pointer rounded border border-input bg-transparent p-0.5"
              />
              <Input
                value={theme.primaryColor || '#3b82f6'}
                onChange={(e) => setTheme('primaryColor', e.target.value)}
                placeholder="#3b82f6"
                className="font-mono text-sm"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="backgroundColor">Background</Label>
            <div className="flex gap-2">
              <input
                type="color"
                id="backgroundColor"
                value={theme.backgroundColor || '#ffffff'}
                onChange={(e) => setTheme('backgroundColor', e.target.value)}
                className="h-9 w-10 shrink-0 cursor-pointer rounded border border-input bg-transparent p-0.5"
              />
              <Input
                value={theme.backgroundColor || '#ffffff'}
                onChange={(e) => setTheme('backgroundColor', e.target.value)}
                placeholder="#ffffff"
                className="font-mono text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Typography */}
      <div className="space-y-3">
        <SectionLabel>Typography</SectionLabel>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="fontFamily">Font Family</Label>
            <Select value={theme.fontFamily || 'Inter'} onValueChange={(v) => setTheme('fontFamily', v)}>
              <SelectTrigger id="fontFamily"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Inter">Inter</SelectItem>
                <SelectItem value="Roboto">Roboto</SelectItem>
                <SelectItem value="Open Sans">Open Sans</SelectItem>
                <SelectItem value="Lato">Lato</SelectItem>
                <SelectItem value="Montserrat">Montserrat</SelectItem>
                <SelectItem value="Poppins">Poppins</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fontSize">Base Size</Label>
            <Select value={theme.fontSize || '16px'} onValueChange={(v) => setTheme('fontSize', v)}>
              <SelectTrigger id="fontSize"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="14px">Small (14px)</SelectItem>
                <SelectItem value="16px">Medium (16px)</SelectItem>
                <SelectItem value="18px">Large (18px)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Separator />

      {/* Buttons */}
      <div className="space-y-3">
        <SectionLabel>Submit Button</SectionLabel>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="buttonStyle">Shape</Label>
            <Select value={theme.buttonStyle || 'rounded'} onValueChange={(v) => setTheme('buttonStyle', v)}>
              <SelectTrigger id="buttonStyle"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="rounded">Rounded</SelectItem>
                <SelectItem value="square">Square</SelectItem>
                <SelectItem value="pill">Pill</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="buttonSize">Size</Label>
            <Select value={theme.buttonSize || 'md'} onValueChange={(v) => setTheme('buttonSize', v)}>
              <SelectTrigger id="buttonSize"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sm">Small</SelectItem>
                <SelectItem value="md">Medium</SelectItem>
                <SelectItem value="lg">Large</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Separator />

      {/* Background PDF */}
      <div className="space-y-3">
        <SectionLabel>Background PDF</SectionLabel>
        <p className="text-xs text-muted-foreground">Upload a form or blueprint to use as an overlay background.</p>
        {backgroundPdfUrl ? (
          <div className="flex items-center gap-3 rounded-md border p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-red-100 text-red-600">
              <FileText className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Background PDF</p>
              <a
                href={`/api/pdf-proxy?key=${backgroundPdfUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline"
              >
                View file
              </a>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => onSettingsChange({ ...settings, backgroundPdfUrl: undefined })}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-md border-2 border-dashed p-6 text-center hover:bg-muted/40 transition-colors">
            <input
              type="file"
              accept=".pdf"
              className="sr-only"
              onChange={handleUpload}
              disabled={isUploading}
            />
            {isUploading
              ? <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
              : <UploadCloud className="h-7 w-7 text-muted-foreground" />
            }
            <div>
              <p className="text-sm font-medium">Click to upload PDF</p>
              <p className="text-xs text-muted-foreground">PDF files only</p>
            </div>
          </label>
        )}
      </div>
    </div>
  )
}
