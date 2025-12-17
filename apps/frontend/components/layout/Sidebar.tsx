"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome,
  faFileAlt,
  faCog,
  faSignOutAlt,
  faBars, // Using Bars as generic toggle, or could use left/right distinct icons
  faMoon,
  faSun,
  faChevronLeft
} from "@fortawesome/free-solid-svg-icons";
import { useSession } from "../session-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const { setTheme, resolvedTheme } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { user, handleLogout } = useSession() || { user: null, handleLogout: () => {} };

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

  const toggleTheme = () => {
      setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: faHome },
    { name: "Forms", href: "/forms", icon: faFileAlt },
    { name: "Admin", href: "/admin", icon: faCog },
  ];

  // Helper functions for user avatar
  const getInitials = (name: string) => {
    if (!name) return "??";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getAvatarColor = (name: string) => {
    // Generate consistent color based on name
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-orange-500",
      "bg-teal-500",
      "bg-cyan-500",
    ];
    const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  if (!mounted) return null;

  return (
    <div
      className={cn(
        "relative flex flex-col items-start bg-transparent text-sidebar-foreground transition-[width] duration-300 ease-in-out h-full",
        isCollapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* Header / Logo Area */}
      <div className={cn(
          "flex w-full mb-4 mt-2 transition-all duration-300 ease-in-out", 
          isCollapsed 
            ? "flex-col items-center justify-center gap-2 pt-4 h-auto" 
            : "flex-row items-center justify-between h-20 px-4"
      )}>
        {/* Logo Container */}
        <div className={cn(
            "flex items-center transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap",
            isCollapsed ? "justify-center w-full" : "justify-start flex-1 gap-3"
        )}>
             <img 
                src="/Worktree Logo.svg" 
                alt="Worktree" 
                className={cn(
                    "object-contain transition-all duration-500 ease-in-out",
                    isCollapsed ? "h-12 w-12" : "h-14 w-auto" // Much bigger
                )}
             />
             <div className={cn(
                 "transition-all duration-300 ease-in-out flex flex-col justify-center",
                 isCollapsed ? "w-0 opacity-0 overflow-hidden" : "w-auto opacity-100"
             )}>
                 <span className="font-bold text-2xl tracking-tight text-gray-900 dark:text-white leading-none">
                     Worktree
                 </span>
             </div>
        </div>

        {/* Toggle Button */}
        <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className={cn(
                "text-sidebar-foreground/70 hover:text-primary hover:bg-primary/10 transition-all duration-300 ease-in-out",
                isCollapsed ? "h-8 w-8 mt-4" : "h-9 w-9"
            )}
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
            <div className={cn("transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]", isCollapsed ? "rotate-180" : "rotate-0")}>
                 <FontAwesomeIcon
                    icon={isCollapsed ? faBars : faChevronLeft}
                    fixedWidth
                    className={cn(
                        "transition-all duration-300 align-middle",
                        isCollapsed ? "h-5 w-5" : "h-4 w-4"
                    )}
                 />
            </div>
        </Button>
      </div>

      {/* Navigation and Footer Container */}
      <div className={cn(
        "flex-1 w-full flex flex-col mt-8 overflow-hidden transition-all duration-300",
        isCollapsed ? "px-0" : "px-3"
      )}>
        {/* Scrollable Navigation Area */}
        <nav className={cn(
          "flex-1 space-y-1 overflow-y-auto overflow-x-hidden scrollbar-none",
          isCollapsed ? "flex items-center flex-col" : ""
        )}>
          {navItems.map((item) => {
              const isActive = pathname?.startsWith(item.href);

              return (
                  <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                          "flex items-center rounded-md text-sm font-medium transition-all duration-200 group relative",
                          "hover:scale-[1.02] hover:shadow-sm active:scale-95",
                           isActive 
                             ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-semibold shadow-sm"
                             : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5",
                           isCollapsed 
                              ? "justify-center px-0 w-10 h-10 mx-auto"
                              : "justify-start px-3 py-2.5 mx-0 w-full" 
                      )}
                      title={isCollapsed ? item.name : undefined}
                  >
                       <div className={cn(
                           "flex items-center justify-center flex-shrink-0",
                           isCollapsed ? "w-full" : "w-5 mr-3"
                       )}>
                          <FontAwesomeIcon
                            icon={item.icon}
                            fixedWidth
                            className={cn("h-4 w-4 align-middle transition-transform duration-300 group-hover:scale-110", isActive ? "text-primary" : "opacity-70")}
                          />
                       </div>
                       
                      <span className={cn(
                          "whitespace-nowrap transition-all duration-300 ease-in-out overflow-hidden",
                          isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                      )}>
                          {item.name}
                      </span>

                      {/* Tooltip for collapsed state */}
                      {isCollapsed && (
                          <div className="absolute left-full ml-2 w-max rounded-md bg-gray-900 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                              {item.name}
                          </div>
                      )}
                  </Link>
              )
          })}
        </nav>

        {/* Footer Items - Always at Bottom */}
        <div className={cn(
          "w-full pb-6 mt-auto space-y-1 flex-shrink-0",
          isCollapsed ? "flex items-center flex-col" : ""
        )}>
           {/* User Profile */}
           {user && (
             <div
               className={cn(
                 "rounded-md text-sm transition-all duration-200 group relative",
                 "text-gray-900 dark:text-white",
                 isCollapsed
                   ? "flex items-center justify-center w-10 h-10 mx-auto mb-2"
                   : "flex items-center gap-3 px-3 py-2.5 w-full mb-2"
               )}
             >
               <Avatar className={cn(isCollapsed ? "h-8 w-8" : "h-9 w-9")}>
                 <AvatarImage src="" alt={user.name} />
                 <AvatarFallback className={cn(getAvatarColor(user.name), "text-white font-semibold text-sm")}>
                   {getInitials(user.name)}
                 </AvatarFallback>
               </Avatar>

               {!isCollapsed && (
                 <div className="flex flex-col min-w-0 flex-1">
                   <span className="font-medium text-sm truncate">{user.name}</span>
                   <span className="text-xs text-gray-500 dark:text-gray-400 capitalize truncate">
                     {user.role}
                   </span>
                 </div>
               )}

               {/* Tooltip for collapsed state */}
               {isCollapsed && (
                 <div className="absolute left-full ml-2 w-max rounded-md bg-gray-900 px-3 py-2 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                   <div className="font-medium">{user.name}</div>
                   <div className="text-gray-300 capitalize">{user.role}</div>
                 </div>
               )}
             </div>
           )}

           {/* Divider */}
           {user && (
             <div className={cn(
               "border-t border-gray-200 dark:border-gray-700",
               isCollapsed ? "w-8 mx-auto mb-2" : "w-full mb-2"
             )} />
           )}

           {/* Theme Toggle */}
           <Button
               variant="ghost"
               onClick={toggleTheme}
               className={cn(
                   "rounded-md text-sm font-medium transition-all duration-200 group relative",
                   "hover:scale-[1.02] hover:shadow-sm active:scale-95",
                   "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5",
                   isCollapsed
                       ? "h-10 w-10 p-0 mx-auto"
                       : "h-auto w-full px-3 py-2.5 justify-start"
               )}
               title={isCollapsed ? (resolvedTheme === "dark" ? "Light Mode" : "Dark Mode") : undefined}
           >
               <FontAwesomeIcon
                   icon={resolvedTheme === "dark" ? faSun : faMoon}
                   fixedWidth
                   className={cn(
                       "transition-transform duration-300 group-hover:scale-110 opacity-70",
                       isCollapsed ? "" : "mr-3"
                   )}
               />

               {!isCollapsed && (
                   <span className="whitespace-nowrap">
                       {resolvedTheme === "dark" ? "Light Mode" : "Dark Mode"}
                   </span>
               )}

               {/* Tooltip for collapsed state */}
               {isCollapsed && (
                   <div className="absolute left-full ml-2 w-max rounded-md bg-gray-900 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                       {resolvedTheme === "dark" ? "Light Mode" : "Dark Mode"}
                   </div>
               )}
           </Button>

           {/* Logout */}
           <Button
               variant="ghost"
               // @ts-ignore - handleLogout exists in context
               onClick={handleLogout}
               className={cn(
                   "rounded-md text-sm font-medium transition-all duration-200 group relative",
                   "hover:scale-[1.02] hover:shadow-sm active:scale-95",
                   "text-gray-600 dark:text-gray-300 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10",
                   isCollapsed
                       ? "h-10 w-10 p-0 mx-auto"
                       : "h-auto w-full px-3 py-2.5 justify-start"
               )}
               title={isCollapsed ? "Logout" : undefined}
           >
               <FontAwesomeIcon
                   icon={faSignOutAlt}
                   fixedWidth
                   className={cn(
                       "transition-transform duration-300 group-hover:scale-110 opacity-70",
                       isCollapsed ? "" : "mr-3"
                   )}
               />

               {!isCollapsed && (
                   <span className="whitespace-nowrap">
                       Logout
                   </span>
               )}

               {/* Tooltip for collapsed state */}
               {isCollapsed && (
                   <div className="absolute left-full ml-2 w-max rounded-md bg-gray-900 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                       Logout
                   </div>
               )}
           </Button>
        </div>
      </div>
    </div>
  );
}
