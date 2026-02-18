'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Share2, Copy, Check, Link } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { t } from '@/lib/i18n';

interface ShareModalProps {
  children?: React.ReactNode;
}

type Permission = 'view' | 'edit';

export function ShareModal({ children }: ShareModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [permission, setPermission] = useState<Permission>('view');
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  // Finding #8 (R7): store timer in ref so we can clean it on unmount.
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Get the current URL for sharing
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: 'Link copied!',
        description: 'Share link has been copied to clipboard.',
      });

      // Reset copied state after 2 seconds — store ref for cleanup.
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
      copiedTimerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: 'Failed to copy',
        description: 'Could not copy link to clipboard.',
        variant: 'destructive',
      });
    }
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    };
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="ghost" size="sm" className="h-8 px-2 gap-1">
            <Share2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs">Share</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            {t('share.title', 'Share Sheet')}
          </DialogTitle>
          <DialogDescription>
            {t('share.description', 'Anyone with the link can access this sheet based on the permission level.')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Permission Selector */}
          <div className="space-y-2">
            <Label htmlFor="permission">{t('share.permission', 'Permission Level')}</Label>
            <Select value={permission} onValueChange={(value) => setPermission(value as Permission)}>
              <SelectTrigger id="permission">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="view">
                  <div className="flex flex-col items-start">
                    <div className="font-medium">View only</div>
                    <div className="text-xs text-muted-foreground">
                      Can view but not edit
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="edit">
                  <div className="flex flex-col items-start">
                    <div className="font-medium">Can edit</div>
                    <div className="text-xs text-muted-foreground">
                      Can view and make changes
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {t('share.note', 'Note: Permission controls are currently for UI only. Full implementation coming soon.')}
            </p>
          </div>

          {/* Shareable Link */}
          <div className="space-y-2">
            <Label htmlFor="share-link">{t('share.link_label', 'Shareable Link')}</Label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="share-link"
                  value={shareUrl}
                  readOnly
                  className="pl-9 pr-3 text-sm"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="shrink-0"
                onClick={handleCopyLink}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                <span className="sr-only">Copy link</span>
              </Button>
            </div>
          </div>

          {/* Info Box */}
          <div className="rounded-lg border bg-muted/50 p-3">
            <div className="flex gap-2">
              <div className="shrink-0 mt-0.5">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
              </div>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p className="font-medium text-foreground">{t('share.tips_title', 'Sharing Tips')}</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Share this link with your team members</li>
                  <li>Permission level affects what they can do</li>
                  <li>Changes are synced in real-time</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            {t('common.close', 'Close')}
          </Button>
          <Button onClick={handleCopyLink}>
            <Copy className="mr-2 h-4 w-4" />
            {t('share.copy_link', 'Copy Link')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
