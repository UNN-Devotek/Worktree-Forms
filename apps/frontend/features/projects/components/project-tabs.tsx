"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Map,
  FileText,
  ClipboardList,
  Settings,
  Calendar,
  MapPin,
  Table,
  MessageCircle,
  FileStack
} from "lucide-react";

interface ProjectTabsProps {
  slug: string;
}

export function ProjectTabs({ slug }: ProjectTabsProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Determine active tab based on current path
  const getActiveTab = () => {
    if (pathname?.endsWith("/sheets") || pathname?.includes("/sheets/")) return "sheets";
    if (pathname?.endsWith("/chat")) return "chat";
    if (pathname?.endsWith("/route")) return "route";
    if (pathname?.endsWith("/tasks")) return "tasks";
    if (pathname?.endsWith("/forms") || pathname?.includes("/forms/")) return "forms";
    if (pathname?.endsWith("/specs")) return "specs";
    if (pathname?.endsWith("/blueprints")) return "blueprints";
    if (pathname?.endsWith("/schedule")) return "schedule";
    if (pathname?.endsWith("/settings")) return "settings";
    return "overview";
  };

  const currentTab = getActiveTab();

  const handleTabChange = (value: string) => {
    const basePath = `/project/${slug}`;
    const path = value === "overview" ? basePath : `${basePath}/${value}`;
    router.push(path);
  };

  return (
    <div className="w-full overflow-x-auto pb-2 scrollbar-hide">
      <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="inline-flex h-10 items-center justify-start rounded-md bg-muted p-1 text-muted-foreground w-auto min-w-full sm:min-w-0">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="sheets" className="flex items-center gap-2">
            <Table className="h-4 w-4" />
            <span>Tables</span>
          </TabsTrigger>
          <TabsTrigger value="route" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span>Routes</span>
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            <span>Tasks</span>
          </TabsTrigger>
          <TabsTrigger value="forms" className="flex items-center gap-2">
            <FileStack className="h-4 w-4" />
            <span>Forms</span>
          </TabsTrigger>
          <TabsTrigger value="specs" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>Specs</span>
          </TabsTrigger>
          <TabsTrigger value="blueprints" className="flex items-center gap-2">
            <Map className="h-4 w-4" />
            <span>Blueprints</span>
          </TabsTrigger>
          <TabsTrigger value="schedule" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>Schedule</span>
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            <span>Team Chat</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2 ml-auto">
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
