import * as React from "react"
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { DashboardService } from "@/services/dashboard.service" // Expanding service usage
import { Button } from "@/components/ui/button"
import { FileDown, Upload } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { ImportWizardModal } from "./ImportWizardModal"
// import { useToast } from "@/components/ui/use-toast"

interface SubmissionGridProps {
  projectId: string
  // In real app, we might pass initial data or fetch query
}

// Define specific type for grid rows to avoid `any`
interface GridRow {
  id: number
  formTitle: string
  status: string
  submittedAt: string
  dataSummary: string // Stringified generic data for display
  [key: string]: any // Allow dynamic columns
}

export function SubmissionGrid({ projectId }: SubmissionGridProps) {
  const [data, setData] = React.useState<GridRow[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [showFailedOnly, setShowFailedOnly] = React.useState(false)
  const [compactMode, setCompactMode] = React.useState(false)
  const [refreshKey, setRefreshKey] = React.useState(0)
  // const { toast } = useToast()

  // Columns definition
  const columns = React.useMemo<ColumnDef<GridRow>[]>(() => [
    {
      accessorKey: "id",
      header: "ID",
      cell: (info) => <div className={compactMode ? "py-1" : "py-4"}>#{info.getValue() as string}</div>,
      enableHiding: false, 
    },
    {
      accessorKey: "formTitle",
      header: "Form",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
            status === 'failed' ? 'bg-red-100 text-red-800' : 
            status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {status.toUpperCase()}
          </span>
        )
      }
    },
    {
      accessorKey: "submittedAt",
      header: "Date",
      cell: ({ getValue }) => format(new Date(getValue() as string), "PP p"),
    },
    {
      accessorKey: "dataSummary",
      header: "Summary",
      cell: ({ getValue }) => <span className="text-gray-500 truncate block max-w-[200px]">{getValue() as string}</span>
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const id = row.getValue("id");
        return (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => window.open(`/api/submissions/${id}/export/pdf`, '_blank')}
            title="Export Flattened PDF"
          >
            <FileDown className="h-4 w-4" />
          </Button>
        )
      }
    }
  ], [compactMode])

  // Fetch Data
  React.useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      try {
        // Fetch activity feed as proxy for submissions for now
        // leveraging existing service
        const activities = await DashboardService.getActivityFeed(projectId)
        
        // Transform Activity -> GridRow
        const rows: GridRow[] = activities.map(a => ({
          id: Number(a.id), // Handle both string/number IDs
          formTitle: a.target,
          status: 'completed', // Mock status as activity feed doesn't have it yet
          submittedAt: a.timestamp,
          dataSummary: `${a.user} ${a.action}`
        }))

        // Mock some failed items for demo
        if (rows.length > 0) {
            rows[0].status = 'failed'
            rows[1].status = 'pending'
        }

        setData(rows)
      } catch (e) {
        console.error("Failed to load grid data", e)
        // toast({ title: "Error", description: "Failed to load submissions", variant: "destructive" })
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [projectId, refreshKey]) // Trigger reload when refreshKey changes

  // Persistence (Load)
  React.useEffect(() => {
      // Mock loading preferences
      const savedCompact = localStorage.getItem(`grid-compact-${projectId}`)
      if (savedCompact) setCompactMode(JSON.parse(savedCompact))
      
      const savedFailed = localStorage.getItem(`grid-failed-${projectId}`)
      if (savedFailed) setShowFailedOnly(JSON.parse(savedFailed))
  }, [projectId])

  // Persistence (Save - Auto)
  React.useEffect(() => {
     localStorage.setItem(`grid-compact-${projectId}`, JSON.stringify(compactMode))
  }, [compactMode, projectId])

  React.useEffect(() => {
     localStorage.setItem(`grid-failed-${projectId}`, JSON.stringify(showFailedOnly))
  }, [showFailedOnly, projectId])


  const filteredData = React.useMemo(() => {
      if (!showFailedOnly) return data
      return data.filter(r => r.status === 'failed')
  }, [data, showFailedOnly])

  if (isLoading) return <div>Loading grid...</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Submissions</h2>
        <div className="flex items-center gap-4">
             <div className="flex items-center space-x-2">
                <Checkbox 
                    id="failed-filter" 
                    checked={showFailedOnly} 
                    onCheckedChange={(c) => setShowFailedOnly(!!c)} 
                />
                <label 
                    htmlFor="failed-filter" 
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                    Show Failed Only
                </label>
            </div>
            
            <ImportButton projectId={projectId} onImportComplete={() => setRefreshKey(k => k + 1)} />

            <Button 
                variant="outline" 
                size="sm"
                onClick={() => setCompactMode(!compactMode)}
            >
                {compactMode ? "Normal View" : "Compact Mode"}
            </Button>
        </div>
      </div>
      
      <DataTable 
        columns={columns} 
        data={filteredData} 
      />
    </div>
  )
}

function ImportButton({ projectId, onImportComplete }: { projectId: string, onImportComplete: () => void }) {
    const [open, setOpen] = React.useState(false);
    return (
        <>
            <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-2">
                <Upload className="h-4 w-4" />
                Import
            </Button>
            <ImportWizardModal 
                open={open} 
                onClose={() => setOpen(false)} 
                projectId={projectId} 
                onImportComplete={onImportComplete}
            />
        </>
    )
}
