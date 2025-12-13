'use client'

import React from 'react'
import { FileBrowser } from '@/components/file-browser/FileBrowser'

export default function FormsPage() {
  return (
    <div className="container mx-auto py-6 h-full">
         <div className="flex flex-col gap-4 h-full">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Forms</h1>
              <p className="text-muted-foreground">Manage your forms and organize them with folders.</p>
            </div>
            
            <FileBrowser />
         </div>
    </div>
  )
}
