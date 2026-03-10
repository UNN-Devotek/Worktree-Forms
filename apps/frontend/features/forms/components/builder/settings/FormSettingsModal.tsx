'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table2, ExternalLink } from 'lucide-react'
import { GeneralSettings } from './GeneralSettings'
import { AppearanceSettings } from './AppearanceSettings'
import { NotificationSettings } from './NotificationSettings'
import { AdvancedSettings } from './AdvancedSettings'
import { useFormBuilderStore } from '@/features/forms/stores/form-builder-store'
import { FormSettings } from '@/types/group-forms'
import { getSheets, getFormProjectSlug } from '@/features/sheets/server/sheet-actions'

interface FormSettingsModalProps {
  open: boolean
  onClose: () => void
  groupId: number | string | null
  groupSlug?: string
  formId?: string | number
  targetSheetId?: string | null
  projectId?: string
}

function LinkedSheetRow({ sheetId, projectSlug, sheets }: { sheetId: string; projectSlug: string; sheets: any[] }) {
  const sheet = sheets.find((s) => s.id === sheetId)
  return (
    <div className="pt-4 border-t mt-2">
      <a
        href={`/project/${projectSlug}/sheets/${sheetId}`}
        className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30 hover:bg-muted/60 transition-colors group"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
          <Table2 className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-none">Output Table</p>
          <p className="text-xs text-muted-foreground mt-1 truncate">{sheet?.title ?? 'Linked live table'}</p>
        </div>
        <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
      </a>
    </div>
  )
}

export function FormSettingsModal({ open, onClose, groupId, groupSlug, formId, targetSheetId, projectId }: FormSettingsModalProps) {
  const { formSchema, updateFormSettings, updateFormTheme } = useFormBuilderStore()
  const [activeTab, setActiveTab] = useState('general')
  const [sheets, setSheets] = useState<any[]>([])

  useEffect(() => {
    if (!open) return
    const fetchSheets = async () => {
      let slug = groupSlug
      if (!slug && formId) slug = await getFormProjectSlug(String(formId)) || undefined
      if (slug) {
        try { setSheets(await getSheets(slug)) } catch {}
      }
    }
    fetchSheets()
  }, [open, groupSlug, formId])

  const settings = formSchema?.settings || {}
  const theme = formSchema?.theme || {}

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle>Form Settings</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 min-h-0">
          <div className="px-6 pt-4 shrink-0">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5">
            <TabsContent value="general" className="mt-0">
              <GeneralSettings
                settings={settings}
                onChange={updateFormSettings}
                sheets={sheets}
              />
            </TabsContent>

            <TabsContent value="appearance" className="mt-0">
              <AppearanceSettings
                theme={theme}
                settings={settings as FormSettings}
                onThemeChange={updateFormTheme}
                onSettingsChange={updateFormSettings}
                projectId={projectId ?? (groupId ? String(groupId) : undefined)}
              />
            </TabsContent>

            <TabsContent value="notifications" className="mt-0">
              <NotificationSettings
                settings={settings}
                onChange={updateFormSettings}
              />
            </TabsContent>

            <TabsContent value="advanced" className="mt-0">
              <AdvancedSettings
                settings={settings}
                onChange={updateFormSettings}
              />
            </TabsContent>
          </div>
        </Tabs>

        {targetSheetId && groupSlug && (
          <div className="px-6 pb-6 shrink-0">
            <LinkedSheetRow sheetId={targetSheetId} projectSlug={groupSlug} sheets={sheets} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
