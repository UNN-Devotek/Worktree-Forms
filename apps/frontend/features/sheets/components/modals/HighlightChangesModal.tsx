'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Eraser } from 'lucide-react';
import { useSheet } from '../../providers/SheetProvider';
import type { HighlightChangesConfig } from '../../types/cell-styles';

const DEFAULT_HIGHLIGHT_COLOR = '#fef08a';

interface TimePeriodOption {
  label: string;
  value: string;
  timeMs: number;
}

const TIME_PERIOD_OPTIONS: TimePeriodOption[] = [
  { label: '15 Minutes', value: '15min', timeMs: 15 * 60 * 1000 },
  { label: '1 Hour',     value: '1hr',   timeMs: 60 * 60 * 1000 },
  { label: '4 Hours',    value: '4hr',   timeMs: 4 * 60 * 60 * 1000 },
  { label: 'Day',        value: '1day',  timeMs: 24 * 60 * 60 * 1000 },
  { label: 'Week',       value: '1week', timeMs: 7 * 24 * 60 * 60 * 1000 },
  { label: 'All Time',   value: 'all',   timeMs: 0 },
];

function timeMsToOptionValue(timeMs: number): string {
  const match = TIME_PERIOD_OPTIONS.find((opt) => opt.timeMs === timeMs);
  return match ? match.value : '1day';
}

function formatSinceDate(timeMs: number): string {
  if (timeMs === 0) return 'since the beginning';
  const since = new Date(Date.now() - timeMs);
  const month = String(since.getMonth() + 1).padStart(2, '0');
  const day = String(since.getDate()).padStart(2, '0');
  const year = String(since.getFullYear()).slice(-2);
  let hours = since.getHours();
  const minutes = String(since.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) hours = 12;
  return `since ${month}/${day}/${year} ${hours}:${minutes} ${ampm}`;
}

export function HighlightChangesModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { highlightChanges, setHighlightChanges } = useSheet();

  const [draft, setDraft] = useState<HighlightChangesConfig>(highlightChanges);
  const [sinceLabel, setSinceLabel] = useState<string>(
    formatSinceDate(highlightChanges.timeMs)
  );

  // Snapshot context state into draft when modal opens so Cancel can revert.
  useEffect(() => {
    if (open) {
      setDraft(highlightChanges);
      setSinceLabel(formatSinceDate(highlightChanges.timeMs));
    }
  }, [open, highlightChanges]);

  // Recompute "since" label whenever the selected timeMs changes.
  useEffect(() => {
    setSinceLabel(formatSinceDate(draft.timeMs));
  }, [draft.timeMs]);

  const handleTimePeriodChange = useCallback((value: string) => {
    const option = TIME_PERIOD_OPTIONS.find((opt) => opt.value === value);
    if (!option) return;
    setDraft((prev) => ({ ...prev, timeMs: option.timeMs }));
  }, []);

  const handleToggle = useCallback((checked: boolean) => {
    setDraft((prev) => ({ ...prev, enabled: checked }));
  }, []);

  const handleColorChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setDraft((prev) => ({ ...prev, color: e.target.value }));
    },
    []
  );

  const handleColorReset = useCallback(() => {
    setDraft((prev) => ({ ...prev, color: DEFAULT_HIGHLIGHT_COLOR }));
  }, []);

  const handleOk = useCallback(() => {
    setHighlightChanges(draft);
    onOpenChange(false);
  }, [draft, setHighlightChanges, onOpenChange]);

  const handleCancel = useCallback(() => {
    // Revert draft to committed context state — do not call setHighlightChanges.
    setDraft(highlightChanges);
    onOpenChange(false);
  }, [highlightChanges, onOpenChange]);

  const selectedOptionValue = timeMsToOptionValue(draft.timeMs);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Highlight Changes</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Enable / Disable toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="highlight-toggle" className="text-sm font-medium">
              Highlight changes
            </Label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {draft.enabled ? 'ON' : 'OFF'}
              </span>
              <Switch
                id="highlight-toggle"
                checked={draft.enabled}
                onCheckedChange={handleToggle}
              />
            </div>
          </div>

          <Separator />

          {/* Time period selector */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Highlight changes in the last:
            </Label>
            <Select
              value={selectedOptionValue}
              onValueChange={handleTimePeriodChange}
              disabled={!draft.enabled}
            >
              <SelectTrigger className="w-full" id="highlight-time-period">
                <SelectValue placeholder="Select time period" />
              </SelectTrigger>
              <SelectContent>
                {TIME_PERIOD_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{sinceLabel}</p>
          </div>

          <Separator />

          {/* Background color picker */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Background color for changed cells:
            </Label>
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="color"
                  id="highlight-color"
                  value={draft.color}
                  onChange={handleColorChange}
                  disabled={!draft.enabled}
                  className="h-9 w-14 cursor-pointer rounded border border-input bg-transparent p-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Highlight color picker"
                />
              </div>
              <span className="text-sm text-muted-foreground font-mono">
                {draft.color}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleColorReset}
                disabled={!draft.enabled || draft.color === DEFAULT_HIGHLIGHT_COLOR}
                className="ml-auto h-8 px-2 gap-1.5"
                title="Reset to default color"
              >
                <Eraser className="h-3.5 w-3.5" />
                <span className="text-xs">Reset</span>
              </Button>
            </div>
            <div
              className="h-6 w-full rounded border border-border"
              style={{
                backgroundColor: draft.enabled ? draft.color : 'transparent',
                opacity: draft.enabled ? 1 : 0.4,
              }}
              aria-hidden
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleOk}>OK</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
