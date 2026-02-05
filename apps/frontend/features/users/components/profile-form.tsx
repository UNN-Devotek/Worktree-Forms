"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { updateTheme, uploadAvatar } from "@/actions/user";
import { useTheme } from "next-themes";
import { Loader2, Upload } from "lucide-react";

export function ProfileForm() {
  const { data: session, update } = useSession();
  const { setTheme, theme: currentTheme } = useTheme();
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();

  // Avatar Upload Handler
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    const result = await uploadAvatar(formData);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Avatar updated!");
      // Update session to reflect new image immediately
      await update({ user: { image: result.imageUrl } });
      router.refresh();
    }
    setIsUploading(false);
  };

  // Theme Handler
  const handleThemeChange = async (val: string) => {
    setTheme(val); // Instant client update
    const result = await updateTheme(val); // Persist to DB
    if (!result.success) {
       toast.error("Failed to save theme preference");
    }
  };

  if (!session?.user) return null;

  const initials = session.user.name
    ? session.user.name.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2)
    : "??";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Public Profile</CardTitle>
          <CardDescription>
            Manage how you appear to other project members.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={session.user.image || ""} />
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div className="grid gap-2">
              <Label htmlFor="avatar" className="cursor-pointer">
                <input
                  id="avatar"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  disabled={isUploading}
                />
                <div className="flex items-center gap-2">
                  <Button variant="outline" asChild disabled={isUploading}>
                    <span>
                      {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                      Change Avatar
                    </span>
                  </Button>
                </div>
              </Label>
              <p className="text-xs text-muted-foreground">
                JPG or PNG. Max 5MB.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>
            Customize the interface theme. Preferences are saved to your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            defaultValue={currentTheme}
            onValueChange={handleThemeChange}
            className="grid max-w-md grid-cols-3 gap-8"
          >
            <div>
              <RadioGroupItem value="light" id="light" className="peer sr-only" />
              <Label
                htmlFor="light"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                <div className="mb-3 h-6 w-6 rounded-full border bg-[#ffffff] shadow-sm" />
                Light
              </Label>
            </div>
            <div>
              <RadioGroupItem value="dark" id="dark" className="peer sr-only" />
              <Label
                htmlFor="dark"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                <div className="mb-3 h-6 w-6 rounded-full border bg-[#09090b] shadow-sm" />
                Dark
              </Label>
            </div>
            <div>
              <RadioGroupItem value="system" id="system" className="peer sr-only" />
              <Label
                htmlFor="system"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                <div className="mb-3 flex h-6 w-6 items-center justify-center rounded-full border bg-slate-200">
                  <span className="text-xs">Auto</span>
                </div>
                System
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>
    </div>
  );
}
