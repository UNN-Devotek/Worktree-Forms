
import React, { useState, useEffect } from 'react';
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
    const DEFAULT_PREFS = {
        emailMentions: true,
        pushAssignments: true,
        dailyDigest: false,
    };

    const [preferences, setPreferences] = useState(DEFAULT_PREFS);

    // Finding #12 (R9): merge parsed localStorage with defaults for schema safety.
    // Older saved data may be missing keys added in future versions.
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const stored = localStorage.getItem('user_notification_prefs');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                setPreferences({ ...DEFAULT_PREFS, ...parsed });
            } catch (e) {
                console.error("Failed to parse notification prefs", e);
            }
        }
    }, []);

    const handleSave = () => {
        localStorage.setItem('user_notification_prefs', JSON.stringify(preferences));
        onClose();
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
                    <Button onClick={handleSave}>
                        {t('notifications.save', 'Save Preferences')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
