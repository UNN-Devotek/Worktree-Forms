'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { GeneralSettings } from './GeneralSettings'
import { ThemeSettings } from './ThemeSettings'
import { NotificationSettings } from './NotificationSettings'
import { AdvancedSettings } from './AdvancedSettings'
import { VisibilitySettings } from './VisibilitySettings'
import { BackgroundSettings } from './BackgroundSettings'
import { useFormBuilderStore } from '@/features/forms/stores/form-builder-store'
import { FormSettings } from '@/types/group-forms'

interface FormSettingsModalProps {
  open: boolean
  onClose: () => void
  groupId: number
  groupSlug?: string
  formId?: number
}

import { getSheets, getFormProjectSlug } from '@/features/sheets/server/sheet-actions'

export function FormSettingsModal({ open, onClose, groupId, groupSlug, formId }: FormSettingsModalProps) {
  const { formSchema, updateFormSettings, updateFormTheme } = useFormBuilderStore()
  const [activeTab, setActiveTab] = useState('general')
  const [sheets, setSheets] = useState<any[]>([])

  useEffect(() => {
    const fetchSheets = async () => {
      let slug = groupSlug;
      
      // If no groupSlug (global builder), try to get it from formId
      if (!slug && formId) {
        slug = await getFormProjectSlug(formId) || undefined;
      }

      if (slug) {
        try {
          const sheets = await getSheets(slug);
          setSheets(sheets);
        } catch (error) {
          console.error('Failed to fetch sheets:', error);
        }
      }
    };

    if (open) {
      fetchSheets();
    }
  }, [open, groupSlug, formId])

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Form Settings</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="visibility">Visibility</TabsTrigger>
            <TabsTrigger value="theme">Theme</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="background">Background</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4 mt-4">
            <GeneralSettings
              settings={formSchema?.settings || {}}
              onChange={updateFormSettings}
              sheets={sheets}
            />
          </TabsContent>

          <TabsContent value="visibility" className="space-y-4 mt-4">
            <VisibilitySettings
              groupId={groupId}
              settings={formSchema?.settings || {}}
              onChange={updateFormSettings}
            />
          </TabsContent>

          <TabsContent value="theme" className="space-y-4 mt-4">
            <ThemeSettings
              theme={formSchema?.theme || {}}
              onChange={updateFormTheme}
            />
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4 mt-4">
            <NotificationSettings
              settings={formSchema?.settings || {}}
              onChange={updateFormSettings}
            />
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4 mt-4">
            <AdvancedSettings
              settings={formSchema?.settings || {}}
              onChange={updateFormSettings}
            />
          </TabsContent>

          <TabsContent value="background" className="space-y-4 mt-4">
             <BackgroundSettings
                settings={formSchema?.settings as FormSettings || {}} 
                onChange={updateFormSettings}
                projectId={String(groupId)}
             />
          </TabsContent>

        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
