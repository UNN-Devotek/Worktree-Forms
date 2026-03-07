import * as React from "react"
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { DashboardService } from "@/services/dashboard.service" // Expanding service usage
import { Button } from "@/components/ui/button"
import { FileDown, Upload } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { ImportWizardModal } from "./ImportWizardModal"
import { useUIPreferencesStore } from "@/lib/stores/ui-preferences-store"
// import { useToast } from "@/components/ui/use-toast"

interface SubmissionGridProps {
  projectId: string
  // In real app, we might pass initial data or fetch query
}

// Define specific type for grid rows to avoid `any`
interface GridRow {
  id: string
  formTitle: string
  status: string
  submittedAt: string
  dataSummary: string // Stringified generic data for display
  [key: string]: unknown // Allow dynamic columns
}

export function SubmissionGrid({ projectId }: SubmissionGridProps) {
  const [data, setData] = React.useState<GridRow[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const gridPrefs = useUIPreferencesStore((s) => s.getGridPrefs(projectId))
  const setGridCompactMode = useUIPreferencesStore((s) => s.setGridCompactMode)
  const setGridShowFailedOnly = useUIPreferencesStore((s) => s.setGridShowFailedOnly)
  const showFailedOnly = gridPrefs.showFailedOnly
  const compactMode = gridPrefs.compactMode
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
        const submissionId = row.getValue("id") as string;
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open(`/api/forms/submissions/${submissionId}/zip`, '_blank')}
            title="Download Submission Files"
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
          id: a.id,
          formTitle: a.target,
          status: 'completed', // Mock status as activity feed doesn't have it yet
          submittedAt: a.timestamp,
          dataSummary: `${a.user} ${a.action}`
        }))

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

  // Persistence is handled by Zustand persist middleware in useUIPreferencesStore


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
                    onCheckedChange={(c) => setGridShowFailedOnly(projectId, !!c)} 
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
                onClick={() => setGridCompactMode(projectId, !compactMode)}
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
