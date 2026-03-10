'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FieldTypeCard } from './FieldTypeCard'
import { getFieldsByCategory, getFieldsByElement } from '@/lib/field-registry'
import { ScrollArea } from '@/components/ui/scroll-area'

const QUESTION_GROUPS = [
  { label: 'Input', categories: ['input'] as const },
  { label: 'Selection', categories: ['selection'] as const },
  { label: 'Date & Time', categories: ['datetime'] as const },
  { label: 'Advanced', categories: ['advanced', 'structural'] as const },
]

export function QuestionPalette() {
  const elementFields = getFieldsByElement(true)

  return (
    <div className="flex flex-col h-full">
      <Tabs defaultValue="questions" className="flex flex-col h-full">
        {/* Tab Headers */}
        <div className="p-4 border-b">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="questions">Questions</TabsTrigger>
            <TabsTrigger value="elements">Elements</TabsTrigger>
          </TabsList>
        </div>

        {/* Questions Tab */}
        <TabsContent value="questions" className="flex-1 m-0 data-[state=inactive]:hidden">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-5">
              {QUESTION_GROUPS.map(({ label, categories }) => {
                const fields = categories.flatMap(c => getFieldsByCategory(c))
                if (fields.length === 0) return null
                return (
                  <div key={label}>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      {label}
                    </p>
                    <div className="space-y-2">
                      {fields.map((field) => (
                        <FieldTypeCard
                          key={field.type}
                          type={field.type}
                          label={field.label}
                          description={field.description}
                          icon={field.icon}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Elements Tab */}
        <TabsContent value="elements" className="flex-1 m-0 data-[state=inactive]:hidden">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-2">
              <p className="text-xs text-muted-foreground mb-3">
                Static content elements (not form inputs)
              </p>
              {elementFields.map((field) => (
                <FieldTypeCard
                  key={field.type}
                  type={field.type}
                  label={field.label}
                  description={field.description}
                  icon={field.icon}
                />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}
