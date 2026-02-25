"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome,
  faCog,
  faSignOutAlt,
  faBars,
  faChevronLeft,
  faBuilding,
  faCubes,
} from "@fortawesome/free-solid-svg-icons";
import { signOut } from "next-auth/react";



interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved) {
        setIsCollapsed(saved === "true");
    }
  }, []);

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("sidebar-collapsed", String(newState));
  };

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: faHome },
    { name: "Projects", href: "/projects", icon: faBuilding },
    { name: "Component Library", href: "/component-library", icon: faCubes },
    { name: "Settings", href: "/settings", icon: faCog },
  ];



  // Helper functions for user avatar


  if (!mounted) return null;

  return (
    <div
      className={cn(
        "relative flex flex-col items-start bg-transparent text-sidebar-foreground transition-[width] duration-300 ease-in-out h-full border-r",
        isCollapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* Logo Header */}
      <div className={cn(
          "flex items-center w-full h-16 border-b px-4 shrink-0 transition-all duration-300 mb-6", 
          isCollapsed ? "justify-center" : "justify-between"
      )}>
           <div className="flex items-center gap-3">
               <img src="/Worktree Logo.svg" alt="Worktree" className="h-8 w-8 object-contain" />
               {!isCollapsed && <span className="font-bold text-lg tracking-tight">Worktree</span>}
           </div>

           {!isCollapsed && (
             <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="h-8 w-8"
            >
                <FontAwesomeIcon icon={faChevronLeft} className="h-4 w-4" />
            </Button>
           )}
      </div>



       {/* Collapse Toggle (Collapsed Mode) */}
       {isCollapsed && (
        <div className="w-full flex justify-center py-4">
             <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="h-8 w-8"
            >
                <FontAwesomeIcon icon={faBars} className="h-4 w-4" />
            </Button>
        </div>
       )}


      {/* Navigation */}
      <div className={cn(
        "flex-1 w-full flex flex-col overflow-hidden transition-all duration-300",
        isCollapsed ? "px-2" : "px-3"
      )}>
        <nav className="flex-1 space-y-1 overflow-y-auto scrollbar-none">
          {navItems.map((item) => {
              const isActive = pathname?.startsWith(item.href);
              return (
                  <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                          "flex items-center rounded-md text-sm font-medium transition-all duration-200 group relative",
                          "hover:bg-accent hover:text-accent-foreground",
                           isActive 
                             ? "bg-accent text-accent-foreground font-semibold"
                             : "text-muted-foreground",
                           isCollapsed 
                              ? "justify-center w-10 h-10 mx-auto"
                              : "justify-start px-3 py-2 w-full" 
                      )}
                  >
                       <FontAwesomeIcon
                         icon={item.icon}
                         fixedWidth
                         className={cn("h-4 w-4", isCollapsed ? "" : "mr-3")}
                       />
                       
                       {!isCollapsed && <span>{item.name}</span>}
                  </Link>
              )
          })}
        </nav>

        {/* Footer actions */}
        <div className="mt-auto space-y-2 pb-4">
            <div className={cn("flex", isCollapsed ? "justify-center" : "justify-start")}>
                <AnimatedThemeToggler className="border-0 shadow-none hover:bg-accent" />
            </div>

            <Button
                variant="ghost"
                onClick={() => signOut()}
                className={cn("w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50", isCollapsed && "justify-center px-0")}
            >
                <FontAwesomeIcon icon={faSignOutAlt} className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
                {!isCollapsed && <span>Logout</span>}
            </Button>
        </div>
      </div>
    </div>
  );
}
