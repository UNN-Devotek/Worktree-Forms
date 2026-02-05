'use client'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { UndoRedo } from './UndoRedo'
import { SaveButton } from './SaveButton'
import { Eye, PanelLeftClose, PanelRightClose, Settings } from 'lucide-react'
import { useFormBuilderStore } from '@/features/forms/stores/form-builder-store'
import { FormType } from '@/types/group-forms'

interface BuilderToolbarProps {
  formId?: number
  groupId: number
  groupSlug?: string
  formSlug?: string
  groupName?: string
  formTitle?: string
  formType?: FormType
  onTogglePalette: () => void
  onToggleProperties: () => void
  onOpenSettings: () => void
  onOpenPreview: () => void

}

export function BuilderToolbar({
  formId,
  groupId,
  groupSlug,
  formTitle,
  formType = 'general',
  onTogglePalette,
  onToggleProperties,
  onOpenSettings,
  onOpenPreview,

}: BuilderToolbarProps) {
  const { formSchema } = useFormBuilderStore()

  const displayTitle = formSchema?.settings?.title || formTitle || 'Untitled Form'


  return (
    <div className="h-14 border-b bg-card px-4 flex items-center justify-between rounded-tl-lg">
      {/* Left Side - Form Name */}
      <div className="flex items-center gap-2">
        <UndoRedo />
        <h1 className="font-semibold text-foreground">{displayTitle}</h1>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-2">


        <Button
          variant="ghost"
          size="sm"
          onClick={onTogglePalette}
          title="Toggle field palette"
        >
          <PanelLeftClose className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleProperties}
          title="Toggle properties panel"
        >
          <PanelRightClose className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6" />

        <Button
          variant="ghost"
          size="sm"
          onClick={onOpenSettings}
          title="Form settings"
        >
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onOpenPreview}
        >
          <Eye className="h-4 w-4 mr-2" />
          Preview
        </Button>

        <SaveButton formId={formId} groupId={groupId} groupSlug={groupSlug} formType={formType} />
      </div>
    </div>
  )
}