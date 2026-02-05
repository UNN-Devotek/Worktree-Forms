'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

export interface SheetSettings {
  defaultColumnWidth: number;
  rowHeight: 'compact' | 'normal' | 'comfortable';
  autoSaveInterval: '1min' | '5min' | '10min';
  theme: 'system' | 'light' | 'dark';
}

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: SheetSettings;
  onSettingsChange: (settings: SheetSettings) => void;
}

const ROW_HEIGHT_OPTIONS = [
  { value: 'compact', label: 'Compact (24px)', height: 24 },
  { value: 'normal', label: 'Normal (32px)', height: 32 },
  { value: 'comfortable', label: 'Comfortable (40px)', height: 40 },
] as const;

const AUTO_SAVE_OPTIONS = [
  { value: '1min', label: '1 minute' },
  { value: '5min', label: '5 minutes' },
  { value: '10min', label: '10 minutes' },
] as const;

const THEME_OPTIONS = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
] as const;

export function SettingsModal({
  open,
  onOpenChange,
  settings,
  onSettingsChange,
}: SettingsModalProps) {
  const [localSettings, setLocalSettings] = useState<SheetSettings>(settings);

  const handleSave = () => {
    onSettingsChange(localSettings);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setLocalSettings(settings);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Sheet Settings</DialogTitle>
          <DialogDescription>
            Customize your sheet preferences. Changes will apply to the current sheet.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Default Column Width */}
          <div className="space-y-2">
            <Label htmlFor="columnWidth">Default Column Width</Label>
            <div className="flex items-center gap-2">
              <Input
                id="columnWidth"
                type="number"
                min={60}
                max={500}
                value={localSettings.defaultColumnWidth}
                onChange={(e) =>
                  setLocalSettings({
                    ...localSettings,
                    defaultColumnWidth: parseInt(e.target.value) || 120,
                  })
                }
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">pixels</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Width applied to new columns (60-500px)
            </p>
          </div>

          <Separator />

          {/* Row Height */}
          <div className="space-y-2">
            <Label htmlFor="rowHeight">Row Height</Label>
            <Select
              value={localSettings.rowHeight}
              onValueChange={(value: SheetSettings['rowHeight']) =>
                setLocalSettings({ ...localSettings, rowHeight: value })
              }
            >
              <SelectTrigger id="rowHeight">
                <SelectValue placeholder="Select row height" />
              </SelectTrigger>
              <SelectContent>
                {ROW_HEIGHT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Controls the vertical spacing of rows
            </p>
          </div>

          <Separator />

          {/* Auto-save Interval */}
          <div className="space-y-2">
            <Label htmlFor="autoSave">Auto-save Interval</Label>
            <Select
              value={localSettings.autoSaveInterval}
              onValueChange={(value: SheetSettings['autoSaveInterval']) =>
                setLocalSettings({ ...localSettings, autoSaveInterval: value })
              }
            >
              <SelectTrigger id="autoSave">
                <SelectValue placeholder="Select interval" />
              </SelectTrigger>
              <SelectContent>
                {AUTO_SAVE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              How often changes are automatically saved
            </p>
          </div>

          <Separator />

          {/* Theme Preference */}
          <div className="space-y-2">
            <Label htmlFor="theme">Theme Preference</Label>
            <Select
              value={localSettings.theme}
              onValueChange={(value: SheetSettings['theme']) =>
                setLocalSettings({ ...localSettings, theme: value })
              }
            >
              <SelectTrigger id="theme">
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                {THEME_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Choose your preferred color scheme
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
