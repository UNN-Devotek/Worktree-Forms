"use client";

import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface UserChipProps {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  /** When true, show avatar only (no name/email text). */
  collapsed?: boolean;
  className?: string;
}

function getInitials(name?: string | null, email?: string | null): string {
  if (name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }
  if (email) return email[0].toUpperCase();
  return "?";
}

export function UserChip({ name, email, image, collapsed = false, className }: UserChipProps) {
  const router = useRouter();
  const initials = getInitials(name, email);
  const displayName = name ?? email ?? "User";

  const handleClick = () => router.push("/settings");

  const avatar = (
    <Avatar className="h-8 w-8 shrink-0">
      {image && <AvatarImage src={image} alt={displayName} />}
      <AvatarFallback className="text-xs font-semibold">{initials}</AvatarFallback>
    </Avatar>
  );

  if (collapsed) {
    return (
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleClick}
              className={cn(
                "flex items-center justify-center rounded-full cursor-pointer",
                "ring-2 ring-transparent hover:ring-primary/40 transition-all",
                className
              )}
              aria-label="Go to profile settings"
            >
              {avatar}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p className="font-medium">{displayName}</p>
            <p className="text-xs text-muted-foreground">Profile &amp; settings</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        "flex items-center gap-3 w-full rounded-md px-2 py-2 cursor-pointer",
        "hover:bg-accent hover:text-accent-foreground transition-colors text-left",
        className
      )}
      aria-label="Go to profile settings"
    >
      {avatar}
      <div className="flex flex-col min-w-0">
        <span className="text-sm font-medium leading-tight truncate">{name ?? "User"}</span>
        {email && (
          <span className="text-xs text-muted-foreground truncate">{email}</span>
        )}
      </div>
    </button>
  );
}
