
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Plus, Check } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

interface PublicShareModalProps {
  resourceType: 'FORM' | 'SPEC' | 'BLUEPRINT';
  resourceId: string;
  trigger?: React.ReactNode;
}

export function PublicShareModal({ resourceType, resourceId, trigger }: PublicShareModalProps) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/share-proxy', { // We'll need a proxy route or use direct if CORS allowed (Proxy is safer/easier with auth)
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            // 'x-user-id': session?.user?.id || '' // Proxy will handle this
        },
        body: JSON.stringify({
            resourceType,
            resourceId,
            expiresInDays: 30 // Default 30 days
        })
      });

      if (!res.ok) throw new Error("Failed to generate link");
      
      const json = await res.json();
      if (json.success) {
          setGeneratedLink(json.data.link);
          toast.success("Public link created!");
      } else {
            throw new Error(json.error);
      }
    } catch (error) {
       toast.error("Error generating link");
       console.error(error);
    } finally {
        setLoading(false);
    }
  };

  const handleCopy = () => {
      if (generatedLink) {
          navigator.clipboard.writeText(generatedLink);
          setCopied(true);
          toast.success("Copied to clipboard");
          setTimeout(() => setCopied(false), 2000);
      }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline" size="sm"><Plus className="mr-2 h-4 w-4"/> Share</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Public Link</DialogTitle>
          <DialogDescription>
            Anyone with this link will be able to view this {resourceType.toLowerCase()}.
          </DialogDescription>
        </DialogHeader>

        {!generatedLink ? (
             <div className="flex flex-col gap-4 py-4">
                 <p className="text-sm text-muted-foreground">
                    This will create a unique, secure link for valid for 30 days.
                 </p>
             </div>
        ) : (
             <div className="flex items-center space-x-2">
                <div className="grid flex-1 gap-2">
                    <Label htmlFor="link" className="sr-only">
                    Link
                    </Label>
                    <Input
                    id="link"
                    defaultValue={generatedLink}
                    readOnly
                    />
                </div>
                <Button type="button" size="sm" className="px-3" onClick={handleCopy}>
                    <span className="sr-only">Copy</span>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
            </div>
        )}

        <DialogFooter className="sm:justify-start">
          {!generatedLink ? (
               <Button type="button" onClick={handleGenerate} disabled={loading}>
                 {loading ? "Generating..." : "Generate Link"}
               </Button>
          ) : (
                <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                  Done
                </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
