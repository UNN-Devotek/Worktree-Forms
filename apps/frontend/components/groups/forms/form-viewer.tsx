'use client'

import { FormSchema } from '@/types/group-forms'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { API_BASE } from '@/lib/api'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'

interface FormViewerProps {
  formSchema: FormSchema
  responseData: Record<string, any>
}

export function FormViewer({ formSchema, responseData }: FormViewerProps) {
  return (
    <div className="space-y-6">
      {/* Submission Data display removed */}

      {formSchema.pages.map((page) => (
        <div key={page.id} className="space-y-4">
          <h4 className="font-medium text-lg border-b pb-2">{page.title}</h4>
          {page.sections.map((section) => (
            <Card key={section.id}>
              <CardHeader>
                <CardTitle className="text-base">{section.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {section.fields.map((field) => {
                  const value = responseData[field.name]
                  
                  // Handle File Uploads
                  if (field.type === 'file' && Array.isArray(value)) {
                    return (
                       <div key={field.id} className="grid gap-1">
                        <div className="font-medium text-sm text-muted-foreground">{field.label}</div>
                        <div className="grid gap-2 grid-cols-2 sm:grid-cols-4">
                          {value.map((file: any, index: number) => (
                            <a 
                              key={index} 
                              href={file.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="block p-2 border rounded hover:bg-muted transition-colors"
                            > 
                              {file.content_type.startsWith('image/') ? (
                                <img src={file.url} alt={file.filename} className="w-full h-24 object-cover rounded mb-2" />
                              ) : (
                                <div className="w-full h-24 bg-muted flex items-center justify-center rounded mb-2 text-xs text-muted-foreground break-all p-1">
                                    {file.filename.split('.').pop()?.toUpperCase() || 'FILE'}
                                </div>
                              )}
                              <p className="text-xs truncate font-medium">{file.filename}</p>
                              <p className="text-[10px] text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                            </a>
                          ))}
                        </div>
                      </div>
                    )
                  }

                  // Handle Static Information Elements
                  if (field.type === 'image_element') {
                     // Get URL logic similar to ImageElement component
                     let imageUrl = field.imageObjectKey ? `${API_BASE}/api/images/${field.imageObjectKey}` : field.imageUrl;
                     
                     if (field.imageUrl && field.imageUrl.includes('localhost:5001') && !API_BASE.includes('localhost')) {
                        const match = field.imageUrl.match(/\/api\/images\/(.+)$/)
                         if (match) {
                           imageUrl = `${API_BASE}/api/images/${match[1]}`
                         }
                     }

                     if (!imageUrl) return null;

                     return (
                        <div key={field.id} className="my-4">
                            <img src={imageUrl} alt={field.imageAlt || 'Form Image'} className="max-w-full h-auto rounded-lg" />
                        </div>
                     )
                  }

                  if (field.type === 'heading' || field.type === 'text_element') {
                      // These are static elements, arguably we don't show them in submission view unless desired.
                      // Usually submission view shows ANSWERS. But if we want context:
                      return null; // Skip static text elements in submission viewer to focus on data
                  }

                  if (field.type === 'smart_table') {
                      const rows = Array.isArray(value) ? value : [];
                      const columns = field.columns || [];
                      
                      return (
                        <div key={field.id} className="space-y-2">
                           <div className="font-medium text-sm text-muted-foreground">{field.label}</div>
                           <div className="border rounded-md overflow-hidden">
                               <Table>
                                   <TableHeader>
                                       <TableRow className="bg-muted/50">
                                           {columns.map(col => (
                                               <TableHead key={col.id} className="h-8 text-xs font-semibold uppercase">{col.label}</TableHead>
                                           ))}
                                       </TableRow>
                                   </TableHeader>
                                   <TableBody>
                                       {rows.length === 0 ? (
                                           <TableRow>
                                               <TableCell colSpan={columns.length} className="text-center text-muted-foreground text-sm h-16">
                                                   No entries
                                               </TableCell>
                                           </TableRow>
                                       ) : (
                                           rows.map((row: any, i: number) => (
                                               <TableRow key={i}>
                                                   {columns.map(col => (
                                                       <TableCell key={col.id} className="py-2">
                                                           {/* For now, just render value as string. Future: Use shared renderer for complex types */}
                                                            {row[col.name]?.toString() || ''}
                                                       </TableCell>
                                                   ))}
                                               </TableRow>
                                           ))
                                       )}
                                   </TableBody>
                               </Table>
                           </div>
                        </div>
                      )
                  }

                  return (
                    <div key={field.id} className="grid gap-1">
                      <div className="font-medium text-sm text-muted-foreground">
                        {field.label}
                      </div>
                      <div className="p-2 bg-muted/50 rounded text-sm whitespace-pre-wrap">
                        {value !== undefined && value !== null && value !== '' 
                          ? (typeof value === 'object' ? JSON.stringify(value) : String(value))
                          : <span className="text-muted-foreground italic">No response</span>}
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      ))}
    </div>
  )
}
