'use client'

import { useState, useEffect, useRef } from 'react'
import { apiClient } from '@/lib/api'
import { ApiResponse } from '@/types/api'
import { FormSchema, FormFieldBase } from '@/types/group-forms'
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from '@/components/ui/table'
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuLabel, 
    DropdownMenuSeparator, 
    DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Loader2, MoreHorizontal, Eye, Trash, Check, X, FileDown, Image as ImageIcon } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useToast } from '@/hooks/use-toast'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { FormViewer } from './form-viewer'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'

interface SubmissionsTableProps {
    formId: number
    formSchema?: FormSchema // Passed to render details
}

export function SubmissionsTable({ formId, formSchema }: SubmissionsTableProps) {
    const [submissions, setSubmissions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const { toast } = useToast()
    const [viewSubmission, setViewSubmission] = useState<any | null>(null)
    const [isViewOpen, setIsViewOpen] = useState(false)
    
    // Export states
    const [exportingPdfId, setExportingPdfId] = useState<number | null>(null)
    const [exportingPhotosId, setExportingPhotosId] = useState<number | null>(null)
    const pdfContainerRef = useRef<HTMLDivElement>(null)

    const fetchSubmissions = async () => {
        setLoading(true)
        try {
            const res = await apiClient<ApiResponse<{ submissions: any[] }>>(`/api/forms/${formId}/submissions`)
            if (res.success && res.data) {
                setSubmissions(res.data.submissions)
            }
        } catch (error) {
            console.error(error)
            toast({ title: "Error", description: "Failed to load submissions", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchSubmissions()
    }, [formId])

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this submission?')) return
        try {
            const res = await apiClient(`/api/submissions/${id}`, { method: 'DELETE' })
            if (res.success) {
                toast({ title: "Deleted", description: "Submission deleted." })
                fetchSubmissions()
            }
        } catch (error) {
            toast({ title: "Error", variant: "destructive" })
        }
    }

    const handleStatusUpdate = async (id: number, status: string) => {
        try {
            const res = await apiClient(`/api/submissions/${id}`, { 
                method: 'PUT',
                body: JSON.stringify({ status })
            })
            if (res.success) {
                toast({ title: "Updated", description: `Submission marked as ${status}.` })
                fetchSubmissions()
            }
        } catch (error) {
            toast({ title: "Error", variant: "destructive" })
        }
    }
    
    // --- Export Logic ---

    const handleExportPdf = (submissionId: number) => {
        console.log(`Starting PDF export for submission ${submissionId}`)
        setExportingPdfId(submissionId)
        // Effect will trigger capture
    }

    useEffect(() => {
        if (exportingPdfId !== null && pdfContainerRef.current) {
            const generatePdf = async () => {
                console.log("Waiting for PDF render...")
                try {
                    // Wait for render - slightly longer to ensure images load
                    await new Promise(resolve => setTimeout(resolve, 800))
                    
                    const element = pdfContainerRef.current
                    if (!element) {
                        console.error("PDF Container ref is null")
                        throw new Error("Render element not found")
                    }

                    console.log("Capturing canvas...")
                    const canvas = await html2canvas(element, {
                        scale: 1.5, // Slightly lower scale to reduce memory usage/fail rate
                        logging: true,
                        useCORS: true,
                        allowTaint: true,
                        scrollY: -window.scrollY,
                        windowWidth: element.scrollWidth,
                        windowHeight: element.scrollHeight
                    })
                    
                    console.log("Canvas captured, generating PDF...")
                    const imgData = canvas.toDataURL('image/png')
                    const pdf = new jsPDF({
                        orientation: 'portrait',
                        unit: 'mm',
                        format: 'a4'
                    })
                    
                    const imgWidth = 210 // A4 width in mm
                    const imgHeight = (canvas.height * imgWidth) / canvas.width
                    
                    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)
                    pdf.save(`submission-${exportingPdfId}.pdf`)
                    
                    toast({ title: "Success", description: "PDF downloaded successfully." })
                } catch (error) {
                    console.error("PDF generation failed DETAILS:", error)
                    toast({ title: "Error", description: "Failed to generate PDF. Check console.", variant: "destructive" })
                } finally {
                    setExportingPdfId(null)
                }
            }
            
            generatePdf()
        }
    }, [exportingPdfId])

    const handleExportPhotos = async (submissionId: number) => {
        console.log(`Starting Photo export for submission ${submissionId}`)
        
        if (!formSchema) {
            console.warn("No form schema available")
            toast({ title: "Info", description: "No schema to export." })
            return
        }
        
        const submission = submissions.find(s => s.id === submissionId)
        if (!submission) {
            console.error("Submission not found in state")
            return
        }

        setExportingPhotosId(submissionId)
        try {
            const zip = new JSZip()
            
            // Identify file fields (images/signatures/files)
            const fileFieldNames: string[] = []
            
            const traverseFields = (fields: FormFieldBase[]) => {
                fields.forEach(f => {
                    if (['file', 'signature', 'image_element'].includes(f.type)) {
                        fileFieldNames.push(f.name)
                    }
                })
            }
            
            formSchema.pages.forEach(p => p.sections.forEach(s => traverseFields(s.fields)))
            console.log("File fields identified:", fileFieldNames)
            
            if (fileFieldNames.length === 0) {
                 toast({ title: "Info", description: "No file/image fields found in this form." })
                 setExportingPhotosId(null)
                 return
            }
            
            let photoCount = 0
            
            for (const fieldName of fileFieldNames) {
                // Check both data locations
                const value = submission.data?.[fieldName] || submission.response_data?.[fieldName]
                console.log(`Checking field ${fieldName}:`, value)
                
                if (!value) continue
                
                const urls = Array.isArray(value) ? value : [value]
                
                for (let i = 0; i < urls.length; i++) {
                    const url = urls[i]
                    if (typeof url !== 'string' || !url.startsWith('http')) {
                        console.warn(`Invalid URL for ${fieldName}:`, url)
                        continue
                    }
                    
                    try {
                        console.log(`Fetching ${url}...`)
                        const response = await fetch(url, { mode: 'cors' }) // Ensure CORS mode
                        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
                        
                        const blob = await response.blob()
                        // Try to guess extension
                        const ext = blob.type.split('/')[1] || 'jpg'
                        const filename = `${fieldName}_${i + 1}.${ext}`
                        
                        zip.file(filename, blob)
                        photoCount++
                    } catch (e) {
                        console.error(`Failed to fetch ${url}`, e)
                        // Don't throw, just skip this photo
                    }
                }
            }
            
            if (photoCount === 0) {
                console.log("No photos successfully fetched")
                toast({ title: "Info", description: "No photos found (or failed to download)." })
                return
            }
            
            console.log(`Zipping ${photoCount} photos...`)
            const content = await zip.generateAsync({ type: "blob" })
            saveAs(content, `submission-${submissionId}-photos.zip`)
            toast({ title: "Success", description: `Exported ${photoCount} photos.` })

        } catch (error) {
            console.error("Export photos failed:", error)
            toast({ title: "Error", description: "Failed to export photos", variant: "destructive" })
        } finally {
            setExportingPhotosId(null)
        }
    }

    // --- Render ---

    if (loading) {
        return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>
    }

    if (submissions.length === 0) {
        return <div className="text-center p-8 text-muted-foreground">No submissions yet.</div>
    }

    // Get submission data for PDF export
    const pdfSubmission = submissions.find(s => s.id === exportingPdfId)

    return (
        <div className="space-y-4">
            <div className="rounded-sm border border-border bg-background">
                <Table>
                    <TableHeader>
                        <TableRow className="border-border bg-muted/50 hover:bg-muted/50">
                            <TableHead className="w-[100px] text-muted-foreground">ID</TableHead>
                            <TableHead className="text-muted-foreground">Status</TableHead>
                            <TableHead className="text-muted-foreground">Created</TableHead>
                            <TableHead className="text-muted-foreground">Data Snippet</TableHead>
                            <TableHead className="text-right text-muted-foreground">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {submissions.map((submission) => (
                            <TableRow key={submission.id} className="border-border hover:bg-muted/50">
                                <TableCell className="font-medium text-foreground">#{submission.id}</TableCell>
                                <TableCell>
                                    <Badge variant={
                                        submission.status === 'approved' ? 'default' : 
                                        submission.status === 'denied' ? 'destructive' : 'secondary'
                                    } className={
                                        submission.status === 'approved' ? 'bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20' :
                                        submission.status === 'denied' ? 'bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/20' :
                                        'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                                    }>
                                        {submission.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-muted-foreground">{formatDistanceToNow(new Date(submission.created_at), { addSuffix: true })}</TableCell>
                                <TableCell className="text-muted-foreground truncate max-w-[200px]">
                                    {(() => {
                                        const values = Object.values(submission.data || {});
                                        if (values.length === 0) return '-';
                                        
                                        // Find first primitive value
                                        const firstPrimitive = values.find(v => typeof v === 'string' || typeof v === 'number');
                                        if (firstPrimitive !== undefined) return String(firstPrimitive);
                                        
                                        // If only objects/arrays (like file uploads), show generic text
                                        return 'View Details...';
                                    })()}
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                                                <span className="sr-only">Open menu</span>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => { setViewSubmission(submission); setIsViewOpen(true); }} className="cursor-pointer">
                                                <Eye className="mr-2 h-4 w-4" />
                                                View Details
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleExportPdf(submission.id)} className="cursor-pointer">
                                                <FileDown className="mr-2 h-4 w-4" />
                                                Export to PDF
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleExportPhotos(submission.id)} className="cursor-pointer" disabled={exportingPhotosId === submission.id}>
                                                {exportingPhotosId === submission.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImageIcon className="mr-2 h-4 w-4" />}
                                                Download Photos
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => handleStatusUpdate(submission.id, 'approved')} className="cursor-pointer text-green-600 focus:text-green-700">
                                                <Check className="mr-2 h-4 w-4" />
                                                Approve
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleStatusUpdate(submission.id, 'denied')} className="cursor-pointer text-red-600 focus:text-red-700">
                                                <X className="mr-2 h-4 w-4" />
                                                Deny
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem className="text-destructive focus:text-destructive cursor-pointer" onClick={() => handleDelete(submission.id)}>
                                                <Trash className="mr-2 h-4 w-4" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                
                {/* Admin Table Footer */}
                <div className="border-t border-border p-4 text-xs text-muted-foreground flex justify-between items-center">
                    <span>0 of {submissions.length} row(s) selected.</span>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            Rows per page
                            <select className="bg-background border border-border rounded px-1 text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
                                <option>10</option>
                                <option>20</option>
                                <option>50</option>
                            </select>
                        </div>
                        <span>Page 1 of 1</span>
                        <div className="flex gap-1">
                            <Button variant="outline" size="icon" className="h-6 w-6 border-border p-0 text-muted-foreground hover:bg-muted" disabled>&lt;&lt;</Button>
                            <Button variant="outline" size="icon" className="h-6 w-6 border-border p-0 text-muted-foreground hover:bg-muted" disabled>&lt;</Button>
                            <Button variant="outline" size="icon" className="h-6 w-6 border-border p-0 text-muted-foreground hover:bg-muted" disabled>&gt;</Button>
                            <Button variant="outline" size="icon" className="h-6 w-6 border-border p-0 text-muted-foreground hover:bg-muted" disabled>&gt;&gt;</Button>
                        </div>
                    </div>
                </div>
            </div>

            <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Submission #{viewSubmission?.id}</DialogTitle>
                    </DialogHeader>
                    {viewSubmission && formSchema && (
                        <FormViewer formSchema={formSchema} responseData={viewSubmission.data?.response_data || viewSubmission.data || {}} />
                    )}
                    {!formSchema && <div className="p-4">Form schema not available to render view</div>}
                </DialogContent>
            </Dialog>

            {/* Hidden PDF Render Container */}
            <div style={{ position: 'fixed', top: 0, left: 0, zIndex: -50, width: '210mm', minHeight: '297mm', background: 'white', padding: '10mm', opacity: exportingPdfId ? 1 : 0, pointerEvents: 'none' }}>
                {pdfSubmission && formSchema && (
                    <div ref={pdfContainerRef}>
                        <h1 className="text-2xl font-bold mb-4">{formSchema.settings.title || 'Form Submission'}</h1>
                        <div className="text-sm text-muted-foreground mb-6">
                            <p>Submission ID: #{pdfSubmission.id}</p>
                            <p>Date: {new Date(pdfSubmission.created_at).toLocaleString()}</p>
                            <p>Status: {pdfSubmission.status}</p>
                        </div>
                        <FormViewer formSchema={formSchema} responseData={pdfSubmission.data?.response_data || pdfSubmission.data || {}} />
                    </div>
                )}
            </div>
        </div>
    )
}
