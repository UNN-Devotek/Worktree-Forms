'use client'

import { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { REGEX_PATTERNS, isValidRegex } from '@/lib/validation/regex-patterns'
import { Check, X } from 'lucide-react'

interface RegexPatternSelectorProps {
  value: string
  onChange: (pattern: string) => void
}

export function RegexPatternSelector({ value, onChange }: RegexPatternSelectorProps) {
  const [customMode, setCustomMode] = useState(!REGEX_PATTERNS.some(p => p.pattern === value))
  const [testValue, setTestValue] = useState('')

  const handlePresetSelect = (patternName: string) => {
    const pattern = REGEX_PATTERNS.find(p => p.name === patternName)
    if (pattern) {
      onChange(pattern.pattern)
      setCustomMode(false)
    }
  }

  const testPattern = (): boolean => {
    if (!testValue || !value) return false
    return isValidRegex(value) && new RegExp(value).test(testValue)
  }

  const selectedPattern = REGEX_PATTERNS.find(p => p.pattern === value)

  return (
    <div className="space-y-4">
      {/* Preset or Custom Toggle */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant={!customMode ? 'default' : 'outline'}
          size="sm"
          onClick={() => setCustomMode(false)}
        >
          Use Preset
        </Button>
        <Button
          type="button"
          variant={customMode ? 'default' : 'outline'}
          size="sm"
          onClick={() => setCustomMode(true)}
        >
          Custom Pattern
        </Button>
      </div>

      {/* Preset Selector */}
      {!customMode && (
        <div className="space-y-2">
          <Select
            value={selectedPattern?.name || ''}
            onValueChange={handlePresetSelect}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a pattern" />
            </SelectTrigger>
            <SelectContent>
              {REGEX_PATTERNS.map(pattern => (
                <SelectItem key={pattern.name} value={pattern.name}>
                  <div>
                    <div className="font-medium">{pattern.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {pattern.description}
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedPattern && (
            <div className="p-3 bg-muted rounded-lg text-xs">
              <p className="font-medium mb-1">Example:</p>
              <p className="text-muted-foreground">{selectedPattern.example}</p>
            </div>
          )}
        </div>
      )}

      {/* Custom Pattern Input */}
      {customMode && (
        <div className="space-y-2">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Enter regex pattern"
            className={!isValidRegex(value) && value ? 'border-destructive' : ''}
          />
          {!isValidRegex(value) && value && (
            <p className="text-xs text-destructive">Invalid regex pattern</p>
          )}
        </div>
      )}

      {/* Pattern Tester */}
      {value && isValidRegex(value) && (
        <div className="space-y-2 p-3 border rounded-lg">
          <Label className="text-xs">Test Pattern</Label>
          <div className="flex gap-2">
            <Input
              value={testValue}
              onChange={(e) => setTestValue(e.target.value)}
              placeholder="Enter test value"
              className="flex-1"
            />
            {testValue && (
              <div className="flex items-center">
                {testPattern() ? (
                  <Check className="h-5 w-5 text-primary" />
                ) : (
                  <X className="h-5 w-5 text-destructive" />
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
