'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { PropertiesTab } from './tabs/PropertiesTab'
import { LogicTab } from './tabs/LogicTab'
import { ValidationTab } from './tabs/ValidationTab'
import { AdvancedTab } from './tabs/AdvancedTab'
import { useFormBuilderStore } from '@/features/forms/stores/form-builder-store'
import { X, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

interface PropertiesPanelProps {
  groupId: number
  formId?: number
  isSIGRequestForm?: boolean  // When true, default fields are locked
}

export function PropertiesPanel({ groupId, formId, isSIGRequestForm = false }: PropertiesPanelProps) {
  const { selectField, getSelectedField } = useFormBuilderStore()
  const selectedField = getSelectedField()

  // Track active tab for runtime-conditional styling (avoids data-[state=active]: Tailwind
  // variants which trigger a Turbopack CSS parser bug on button elements)
  const [activePropertiesTab, setActivePropertiesTab] = useState('properties')

  if (!selectedField) return null

  // Determine if this field is locked (only in SIG request forms)
  const isLockedField = isSIGRequestForm && selectedField.isDefaultField === true

  // For locked fields, show a simple read-only view
  if (isLockedField) {
    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold">Field Properties</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => selectField(null)}
            aria-label="Close properties"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Locked Field Info */}
        <div className="p-4 space-y-4">
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertTitle>Locked Field</AlertTitle>
            <AlertDescription>
              This is a required default field and cannot be edited. You can add additional custom fields to the form.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Field Type</label>
              <p className="text-sm">{selectedField.type}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Label</label>
              <p className="text-sm">{selectedField.label}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Name</label>
              <p className="text-sm font-mono text-xs">{selectedField.name}</p>
            </div>
            {selectedField.required && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Required</label>
                <p className="text-sm">Yes</p>
              </div>
            )}
            {selectedField.helpText && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Help Text</label>
                <p className="text-sm">{selectedField.helpText}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold">Field Properties</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => selectField(null)}
          aria-label="Close properties"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="properties" onValueChange={setActivePropertiesTab} className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start border-b rounded-none h-auto p-0">
          <TabsTrigger
            value="properties"
            className={cn("rounded-none border-b-2 shadow-none", activePropertiesTab === 'properties' ? "border-primary" : "border-transparent")}
          >
            Properties
          </TabsTrigger>
          <TabsTrigger
            value="logic"
            className={cn("rounded-none border-b-2 shadow-none", activePropertiesTab === 'logic' ? "border-primary" : "border-transparent")}
          >
            Logic
          </TabsTrigger>
          <TabsTrigger
            value="validation"
            className={cn("rounded-none border-b-2 shadow-none", activePropertiesTab === 'validation' ? "border-primary" : "border-transparent")}
          >
            Validation
          </TabsTrigger>
          <TabsTrigger
            value="advanced"
            className={cn("rounded-none border-b-2 shadow-none", activePropertiesTab === 'advanced' ? "border-primary" : "border-transparent")}
          >
            Advanced
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          <TabsContent value="properties" className="p-4 m-0">
            <PropertiesTab field={selectedField} groupId={groupId} formId={formId} />
          </TabsContent>

          <TabsContent value="logic" className="p-4 m-0">
            <LogicTab field={selectedField} />
          </TabsContent>

          <TabsContent value="validation" className="p-4 m-0">
            <ValidationTab field={selectedField} />
          </TabsContent>

          <TabsContent value="advanced" className="p-4 m-0">
            <AdvancedTab field={selectedField} />
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  )
}