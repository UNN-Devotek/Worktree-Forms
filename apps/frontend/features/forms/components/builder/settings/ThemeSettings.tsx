'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface ThemeSettingsProps {
  theme: any
  onChange: (theme: any) => void
}

export function ThemeSettings({ theme, onChange }: ThemeSettingsProps) {
  const handleUpdate = (key: string, value: any) => {
    onChange({
      ...theme,
      [key]: value
    })
  }

  return (
    <div className="space-y-6">
      {/* Color Scheme */}
      <Card>
        <CardHeader>
          <CardTitle>Color Scheme</CardTitle>
          <CardDescription>Customize the form colors</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primaryColor">Primary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="primaryColor"
                  type="color"
                  value={theme.primaryColor || '#3b82f6'}
                  onChange={(e) => handleUpdate('primaryColor', e.target.value)}
                  className="h-10 w-20"
                />
                <Input
                  type="text"
                  value={theme.primaryColor || '#3b82f6'}
                  onChange={(e) => handleUpdate('primaryColor', e.target.value)}
                  placeholder="#3b82f6"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="backgroundColor">Background Color</Label>
              <div className="flex gap-2">
                <Input
                  id="backgroundColor"
                  type="color"
                  value={theme.backgroundColor || '#ffffff'}
                  onChange={(e) => handleUpdate('backgroundColor', e.target.value)}
                  className="h-10 w-20"
                />
                <Input
                  type="text"
                  value={theme.backgroundColor || '#ffffff'}
                  onChange={(e) => handleUpdate('backgroundColor', e.target.value)}
                  placeholder="#ffffff"
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Typography */}
      <Card>
        <CardHeader>
          <CardTitle>Typography</CardTitle>
          <CardDescription>Customize fonts and text styles</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fontFamily">Font Family</Label>
            <Select
              value={theme.fontFamily || 'Inter'}
              onValueChange={(value) => handleUpdate('fontFamily', value)}
            >
              <SelectTrigger id="fontFamily">
                <SelectValue />
              </SelectTrigger>
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

          <div className="space-y-2">
            <Label htmlFor="fontSize">Base Font Size</Label>
            <Select
              value={theme.fontSize || '16px'}
              onValueChange={(value) => handleUpdate('fontSize', value)}
            >
              <SelectTrigger id="fontSize">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="14px">Small (14px)</SelectItem>
                <SelectItem value="16px">Medium (16px)</SelectItem>
                <SelectItem value="18px">Large (18px)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Button Styles */}
      <Card>
        <CardHeader>
          <CardTitle>Button Style</CardTitle>
          <CardDescription>Customize submit button appearance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="buttonStyle">Button Style</Label>
            <Select
              value={theme.buttonStyle || 'rounded'}
              onValueChange={(value) => handleUpdate('buttonStyle', value)}
            >
              <SelectTrigger id="buttonStyle">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rounded">Rounded</SelectItem>
                <SelectItem value="square">Square</SelectItem>
                <SelectItem value="pill">Pill</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="buttonSize">Button Size</Label>
            <Select
              value={theme.buttonSize || 'md'}
              onValueChange={(value) => handleUpdate('buttonSize', value)}
            >
              <SelectTrigger id="buttonSize">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sm">Small</SelectItem>
                <SelectItem value="md">Medium</SelectItem>
                <SelectItem value="lg">Large</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
