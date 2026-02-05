import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: number; // pixel size, default 24
  centered?: boolean;
  className?: string;
}

export function LoadingSpinner({
  size = 24,
  centered = false,
  className,
}: LoadingSpinnerProps) {
  const spinner = (
    <div className={cn("relative", className)} style={{ height: size, width: size }}>
      <Loader2 className="animate-spin text-primary h-full w-full" />
      <span className="sr-only">Loading...</span>
    </div>
  );

  if (centered) {
    return (
      <div className="flex h-full w-full items-center justify-center p-4">
        {spinner}
      </div>
    );
  }

  return spinner;
}
