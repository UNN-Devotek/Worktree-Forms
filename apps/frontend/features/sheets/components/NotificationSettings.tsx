'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { t } from '@/lib/i18n';
import { toast } from 'sonner';
import { useUIPreferencesStore } from '@/lib/stores/ui-preferences-store';
import { updateNotificationPreferences } from '@/features/users/server/user-actions';

interface NotificationSettingsProps {
    isOpen: boolean;
    onClose: () => void;
}

/**
 * Finding #15 (R4): Replaced custom modal with Radix Dialog (via shadcn/ui).
 * This provides ESC key handling, focus trap, and screen-reader announcements for free.
 * Also localized all strings.
 */
export const NotificationSettings: React.FC<NotificationSettingsProps> = ({ isOpen, onClose }) => {
    const storedPrefs = useUIPreferencesStore((s) => s.notificationPrefs);
    const setNotificationPrefs = useUIPreferencesStore((s) => s.setNotificationPrefs);
    const [preferences, setPreferences] = React.useState(storedPrefs);

    // Sync local state when store changes (e.g. on mount/rehydration)
    React.useEffect(() => {
        setPreferences(storedPrefs);
    }, [storedPrefs]);

    const [isSaving, setIsSaving] = React.useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Persist to Zustand store (local, survives page reload via persist middleware).
            setNotificationPrefs(preferences);
            // Persist to DynamoDB for cross-device consistency.
            const ok = await updateNotificationPreferences(preferences);
            if (ok) {
                toast.success(t('notifications.saved', 'Preferences saved'));
            } else {
                toast.error(t('notifications.save_error', 'Failed to save — stored locally'));
            }
        } catch {
            toast.error(t('notifications.save_error', 'Failed to save preferences'));
        } finally {
            setIsSaving(false);
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        {t('notifications.title', 'Notification Preferences')}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="email-mentions" className="text-sm cursor-pointer">
                            {t('notifications.email_mentions', 'Email me when mentioned (@)')}
                        </Label>
                        <Switch
                            id="email-mentions"
                            checked={preferences.emailMentions}
                            onCheckedChange={(checked) =>
                                setPreferences(p => ({ ...p, emailMentions: checked }))
                            }
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <Label htmlFor="push-assignments" className="text-sm cursor-pointer">
                            {t('notifications.push_assignments', 'Browser Push for Assignments')}
                        </Label>
                        <Switch
                            id="push-assignments"
                            checked={preferences.pushAssignments}
                            onCheckedChange={(checked) =>
                                setPreferences(p => ({ ...p, pushAssignments: checked }))
                            }
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <Label htmlFor="daily-digest" className="text-sm cursor-pointer">
                            {t('notifications.daily_digest', 'Receive Daily Digest')}
                        </Label>
                        <Switch
                            id="daily-digest"
                            checked={preferences.dailyDigest}
                            onCheckedChange={(checked) =>
                                setPreferences(p => ({ ...p, dailyDigest: checked }))
                            }
                        />
                    </div>
                </div>

                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">
                            {t('common.cancel', 'Cancel')}
                        </Button>
                    </DialogClose>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving
                            ? t('common.saving', 'Saving...')
                            : t('notifications.save', 'Save Preferences')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
