'use client'

import { LiveTable } from './LiveTable'
import { SheetProvider } from '../providers/SheetProvider'

interface SheetEmbedProps {
  sheetId: string
  token: string
  user: { name: string; color: string }
}

/**
 * Wraps SheetProvider + LiveTable for embedding a live sheet
 * outside the main sheets page (e.g. inside a form's Review tab).
 */
export function SheetEmbed({ sheetId, token, user }: SheetEmbedProps) {
  return (
    <div className="h-full w-full overflow-hidden">
      <SheetProvider sheetId={sheetId} token={token} user={user}>
        <LiveTable />
      </SheetProvider>
    </div>
  )
}
