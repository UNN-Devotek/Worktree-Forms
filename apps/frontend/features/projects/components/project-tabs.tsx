"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  Map,
  FileText,
  ClipboardList,
  Settings,
  Calendar,
  MapPin,
  Table2,
  MessageCircle,
  FileStack,
  MoreHorizontal,
  ChevronDown,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TAB_ITEMS = [
  { value: "overview",    label: "Overview",   icon: LayoutDashboard },
  { value: "sheets",      label: "Tables",     icon: Table2 },
  { value: "route",       label: "Routes",     icon: MapPin },
  { value: "tasks",       label: "Tasks",      icon: ClipboardList },
  { value: "forms",       label: "Forms",      icon: FileStack },
  { value: "specs",       label: "Specs",      icon: FileText },
  { value: "blueprints",  label: "Blueprints", icon: Map },
  { value: "schedule",    label: "Schedule",   icon: Calendar },
  { value: "chat",        label: "Team Chat",  icon: MessageCircle },
  { value: "settings",    label: "Settings",   icon: Settings },
] as const;

type TabValue = (typeof TAB_ITEMS)[number]["value"];

// Width reserved for the "…" button when overflow is active
const OVERFLOW_BTN_WIDTH = 52;
// Gap between TabsList padding + individual items
const TABSLIST_PADDING = 8; // 4px each side from p-1

interface ProjectTabsProps {
  slug: string;
}

export function ProjectTabs({ slug }: ProjectTabsProps) {
  const router   = useRouter();
  const pathname = usePathname();

  const getActiveTab = (): TabValue => {
    if (pathname?.endsWith("/sheets") || pathname?.includes("/sheets/")) return "sheets";
    if (pathname?.endsWith("/chat"))        return "chat";
    if (pathname?.endsWith("/route"))       return "route";
    if (pathname?.endsWith("/tasks"))       return "tasks";
    if (pathname?.endsWith("/forms") || pathname?.includes("/forms/")) return "forms";
    if (pathname?.endsWith("/specs"))       return "specs";
    if (pathname?.endsWith("/blueprints"))  return "blueprints";
    if (pathname?.endsWith("/schedule"))    return "schedule";
    if (pathname?.endsWith("/settings"))    return "settings";
    return "overview";
  };

  const currentTab = getActiveTab();

  const handleTabChange = (value: string) => {
    const basePath = `/project/${slug}`;
    router.push(value === "overview" ? basePath : `${basePath}/${value}`);
  };

  // How many tabs (from index 0) are visible. TAB_ITEMS.length = all fit.
  const [visibleCount, setVisibleCount] = useState<number>(TAB_ITEMS.length);

  // Ref to the outer responsive container (desktop only)
  const containerRef = useRef<HTMLDivElement>(null);
  // Refs to hidden measurement spans — render at natural (unconstrained) width
  const measureRefs = useRef<(HTMLSpanElement | null)[]>([]);

  const recalculate = useCallback(() => {
    if (!containerRef.current) return;

    // Natural widths come from the invisible measurement layer
    const naturalWidths = measureRefs.current.map(
      (el) => (el ? el.getBoundingClientRect().width : 80)
    );

    // Available width = container minus overflow button (subtract only if we'll need it)
    const containerWidth = containerRef.current.clientWidth;
    const totalNatural   = naturalWidths.reduce((s, w) => s + w, 0) + TABSLIST_PADDING;

    if (totalNatural <= containerWidth) {
      setVisibleCount(TAB_ITEMS.length);
      return;
    }

    // Need the overflow button — shrink budget
    const budget = containerWidth - OVERFLOW_BTN_WIDTH - TABSLIST_PADDING;
    let used  = 0;
    let count = 0;
    for (const w of naturalWidths) {
      if (used + w > budget) break;
      used  += w;
      count += 1;
    }

    setVisibleCount(Math.max(count, 1));
  }, []);

  // Measure on mount (RAF so layout is settled)
  useEffect(() => {
    const id = requestAnimationFrame(recalculate);
    return () => cancelAnimationFrame(id);
  }, [recalculate]);

  // Re-measure whenever container resizes
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(() => {
      // Natural widths don't change on resize; only container width does.
      // Re-run recalculate directly (measurement layer still reflects natural widths).
      recalculate();
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [recalculate]);

  // Re-evaluate when active tab changes (active tab must always be visible)
  useEffect(() => {
    recalculate();
  }, [currentTab, recalculate]);

  const activeIdx      = TAB_ITEMS.findIndex((t) => t.value === currentTab);
  const someOverflowed = visibleCount < TAB_ITEMS.length;

  // A tab is hidden if it's beyond visibleCount AND it's not the active tab
  const isHidden = (idx: number) =>
    someOverflowed && idx >= visibleCount && idx !== activeIdx;

  const overflowedTabs = TAB_ITEMS.filter((_, idx) => isHidden(idx));
  const currentTabMeta = TAB_ITEMS.find((t) => t.value === currentTab)!;

  return (
    <div className="w-full">
      {/* ── Hidden measurement layer ──────────────────────────────────────────
          Renders each tab at its natural (unconstrained) width so we can measure
          before deciding which ones to show. Invisible, non-interactive.       */}
      <div
        className="absolute invisible pointer-events-none whitespace-nowrap"
        aria-hidden="true"
        style={{ top: -9999, left: -9999 }}
      >
        {TAB_ITEMS.map((item, idx) => (
          <span
            key={item.value}
            ref={(el) => { measureRefs.current[idx] = el; }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium"
          >
            <item.icon className="h-4 w-4 shrink-0" aria-hidden />
            {item.label}
          </span>
        ))}
      </div>

      {/* ── Mobile: full dropdown (< sm) ─────────────────────────────────── */}
      <div className="sm:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <currentTabMeta.icon className="h-4 w-4" />
                {currentTabMeta.label}
              </span>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[calc(100vw-2rem)]">
            {TAB_ITEMS.map((item) => (
              <DropdownMenuItem
                key={item.value}
                onClick={() => handleTabChange(item.value)}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.label}
                {currentTab === item.value && <Check className="ml-auto h-4 w-4" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* ── Desktop / tablet: overflow tab bar (sm+) ─────────────────────── */}
      <div
        ref={containerRef}
        className="hidden sm:flex items-center gap-1 w-full min-w-0"
      >
        <Tabs
          value={currentTab}
          onValueChange={handleTabChange}
          className="min-w-0"
        >
          <TabsList className="inline-flex h-10 items-center justify-start rounded-md bg-muted p-1 text-muted-foreground">
            {TAB_ITEMS.map((item, idx) => (
              <TabsTrigger
                key={item.value}
                value={item.value}
                className={cn(
                  "flex items-center gap-1.5 shrink-0 whitespace-nowrap",
                  isHidden(idx) && "hidden"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Overflow "…" button — only when some tabs are hidden */}
        {someOverflowed && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={
                  overflowedTabs.some((t) => t.value === currentTab)
                    ? "secondary"
                    : "ghost"
                }
                size="sm"
                className="shrink-0 h-8 w-8 p-0"
                aria-label="More tabs"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {overflowedTabs.map((item) => (
                <DropdownMenuItem
                  key={item.value}
                  onClick={() => handleTabChange(item.value)}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.label}
                  {currentTab === item.value && (
                    <Check className="ml-auto h-4 w-4" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
