'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

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
              className="object-contain transition-all duration-500 ease-in-out h-14 w-auto"
            />
            <span className="font-bold text-2xl tracking-tight text-gray-900 dark:text-white leading-none">
              Worktree
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="secondary" className="gap-2">Log in</Button>
            </Link>
            <Link href="/signup">
              <Button className="gap-2">Sign up</Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container flex-1 flex flex-col items-center justify-center py-20 text-center gap-8">
        {/* Background Gradients */}
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
             <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-primary/10 blur-[100px] opacity-40 animate-pulse" />
             <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-accent/10 blur-[100px] opacity-40" />
        </div>

        <div className="flex flex-col items-center gap-6 max-w-[800px]">
          <h1 className="text-4xl font-bold leading-tight tracking-tighter md:text-6xl lg:leading-[1.1] animate-[slideUp_0.5s_ease-out_0.2s_both]">
            Build complex forms <br className="hidden md:block" />
            <span className="text-primary">without the complexity.</span>
          </h1>
          
          <div className="flex gap-4 animate-[slideUp_0.5s_ease-out_0.4s_both]">
            <Link href="/signup">
              <Button size="lg" className="h-12 px-8 text-lg font-medium shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all hover:-translate-y-0.5">
                Start Building Now <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="w-full border-t border-border/40 py-6">
        <div className="container flex justify-center text-sm text-muted-foreground">
            © 2025 Worktree.
        </div>
      </footer>
    </div>
  );
}
