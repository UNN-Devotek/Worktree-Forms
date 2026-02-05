'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { ArrowRight, Layout, WifiOff, Users, Zap, ShieldCheck, BarChart3 } from 'lucide-react';
import { FeatureCard } from '@/components/landing/FeatureCard';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-primary/20">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
        <nav className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/Worktree Logo.svg" 
              alt="Worktree" 
              className="object-contain transition-all duration-500 ease-in-out h-10 w-auto"
            />
            <span className="font-bold text-xl tracking-tight text-foreground leading-none">
              Worktree
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="text-base font-medium">Log in</Button>
            </Link>

            <ThemeToggle />
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-10 lg:pt-32 lg:pb-12">
        <div className="container relative z-10 flex flex-col items-center text-center">
            <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-primary/20 blur-[120px] opacity-50" />
            </div>

            <h1 className="max-w-4xl text-5xl font-bold tracking-tight md:text-6xl lg:text-7xl animate-[slideUp_0.5s_ease-out_0.2s_both]">
                The Operating System for <br />
                <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
                    Field Operations
                </span>
            </h1>
            
            <p className="mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl animate-[slideUp_0.5s_ease-out_0.3s_both]">
                Build powerful forms, manage workflows, and sync your field team with the office in real-time. 
            </p>




        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container">
            <div className="mb-12 text-center">
                <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Everything you need to scale</h2>
                <p className="mt-4 text-muted-foreground font-medium">From simple surveys to complex compliance workflows.</p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                <FeatureCard 
                    icon={Layout} 
                    title="Visual Form Builder" 
                    description="Drag and drop inputs, signature fields, and photo uploads. Create complex logic without writing code."
                />
                <FeatureCard 
                    icon={WifiOff} 
                    title="Offline First" 
                    description="Collect data anywhere, even without signal. Submissions sync automatically when connection is restored."
                />
                <FeatureCard 
                    icon={Users} 
                    title="Team Collaboration" 
                    description="Assign forms to specific teams or users. Control access with granular permissions and roles."
                />
                 <FeatureCard 
                    icon={Zap} 
                    title="Smart Logic" 
                    description="Show or hide fields based on answers. Perform calculations and validations in real-time."
                />
                 <FeatureCard 
                    icon={ShieldCheck} 
                    title="Enterprise Security" 
                    description="AES-256 encryption, SSO integration, and full audit logs for compliance-heavy industries."
                />
                 <FeatureCard 
                    icon={BarChart3} 
                    title="Real-time Insights" 
                    description="Visualize data instantly. Export to PDF, CSV, or integrate with your existing BI tools."
                />
            </div>
        </div>
      </section>




    </div>
  );
}
