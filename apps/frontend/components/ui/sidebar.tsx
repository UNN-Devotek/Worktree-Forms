"use client";

import React from "react";
import { Button } from "@/components/ui/button";

// Stub components for AI assistant - TODO: Install Shadcn sidebar or refactor
export function SidebarProvider({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }): React.JSX.Element {
  return <div className={className} style={style}>{children}</div>;
}

export function SidebarInset({ children, className }: { children: React.ReactNode; className?: string }): React.JSX.Element {
  return <div className={className}>{children}</div>;
}

export function Sidebar({ children, className, collapsible: _collapsible }: { children: React.ReactNode; className?: string; collapsible?: string }): React.JSX.Element {
  return <div className={className}>{children}</div>;
}

export function SidebarHeader({ children, className }: { children: React.ReactNode; className?: string }): React.JSX.Element {
  return <div className={className}>{children}</div>;
}

export function SidebarContent({ children, className }: { children: React.ReactNode; className?: string }): React.JSX.Element {
  return <div className={className}>{children}</div>;
}

export function SidebarGroup({ children, className }: { children: React.ReactNode; className?: string }): React.JSX.Element {
  return <div className={className}>{children}</div>;
}

export function SidebarGroupLabel({ children, className }: { children: React.ReactNode; className?: string }): React.JSX.Element {
  return <div className={className}>{children}</div>;
}

export function SidebarGroupContent({ children, className }: { children: React.ReactNode; className?: string }): React.JSX.Element {
  return <div className={className}>{children}</div>;
}

export function SidebarMenu({ children, className }: { children: React.ReactNode; className?: string }): React.JSX.Element {
  return <ul className={className}>{children}</ul>;
}

export function SidebarMenuItem({ children, className }: { children: React.ReactNode; className?: string }): React.JSX.Element {
  return <li className={className}>{children}</li>;
}

export function SidebarMenuButton({ children, isActive: _isActive, onClick, className }: { children: React.ReactNode; isActive?: boolean; onClick?: () => void; className?: string }): React.JSX.Element {
  return <Button variant="ghost" className={className} onClick={onClick}>{children}</Button>;
}

export function SidebarTrigger({ className }: { className?: string }): React.JSX.Element {
  return <button className={className}>☰</button>;
}
