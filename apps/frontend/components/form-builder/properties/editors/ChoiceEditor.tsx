'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2, GripVertical } from 'lucide-react'
import { ChoiceOption } from '@/types/group-forms'
import { nanoid } from 'nanoid'

interface ChoiceEditorProps {
  choices: ChoiceOption[]
  onChange: (choices: ChoiceOption[]) => void
}

export function ChoiceEditor({ choices, onChange }: ChoiceEditorProps) {
  const handleAddChoice = () => {
    const newChoices = [
      ...choices,
      { value: `option_${nanoid(6)}`, text: `Option ${choices.length + 1}` }
    ]
    onChange(newChoices)
  }

  const handleRemoveChoice = (index: number) => {
    const newChoices = choices.filter((_, i) => i !== index)
    onChange(newChoices)
  }

  const handleUpdateChoice = (index: number, text: string) => {
    const newChoices = [...choices]
    newChoices[index] = { ...newChoices[index], text }
    onChange(newChoices)
  }

  return (
    <div className="space-y-2">
      {choices.map((choice, index) => (
        <div key={choice.value} className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
          <Input
            value={choice.text}
            onChange={(e) => handleUpdateChoice(index, e.target.value)}
            placeholder={`Option ${index + 1}`}
            className="flex-1"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleRemoveChoice(index)}
            disabled={choices.length <= 2}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleAddChoice}
        className="w-full gap-2"
      >
        <Plus className="h-4 w-4" />
        Add Choice
      </Button>
    </div>
  )
}