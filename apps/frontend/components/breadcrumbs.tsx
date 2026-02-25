"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import React from "react"

export function Breadcrumbs() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  if (segments.length === 0) return null

  return (
    <Breadcrumb className="mb-4 hidden md:flex">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/dashboard">Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        {segments.map((segment, index) => {
            const isLast = index === segments.length - 1
            const href = `/${segments.slice(0, index + 1).join('/')}`
            const SEGMENT_LABELS: Record<string, string> = { sheets: 'Tables' }
            const title = SEGMENT_LABELS[segment] ?? (segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '))

            return (
                <React.Fragment key={href}>
                    <BreadcrumbItem>
                        {isLast ? (
                            <BreadcrumbPage>{title}</BreadcrumbPage>
                        ) : (
                            <BreadcrumbLink href={href}>{title}</BreadcrumbLink>
                        )}
                    </BreadcrumbItem>
                    {!isLast && <BreadcrumbSeparator />}
                </React.Fragment>
            )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
