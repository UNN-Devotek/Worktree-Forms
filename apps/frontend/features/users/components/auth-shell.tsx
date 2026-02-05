
import * as React from "react"


interface AuthShellProps {
  children: React.ReactNode
}

export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
        <div className="absolute inset-0 bg-zinc-900" />
        <div className="relative z-20 flex h-full flex-col items-center justify-center">
          <div className="flex items-center gap-4">
            <img src="/Worktree Logo.svg" alt="Worktree Logo" className="h-16 w-16" />
            <span className="text-4xl font-semibold tracking-tight text-white">Worktree</span>
          </div>
        </div>
      </div>
      <div className="p-8 lg:p-12 h-full flex items-center justify-center">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          {children}
        </div>
      </div>
    </div>
  )
}
