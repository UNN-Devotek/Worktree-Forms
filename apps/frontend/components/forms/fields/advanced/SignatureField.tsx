'use client'

import { forwardRef, useState, useRef, useEffect } from 'react'
import { useFormContext } from 'react-hook-form'
import SignatureCanvas from 'react-signature-canvas'
import { Button } from '@/components/ui/button'
import { FieldWrapper } from '../base/FieldWrapper'
import { FormFieldBase } from '@/types/group-forms'
import { Eraser, Save, Lock, PenTool, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useFormUpload } from '@/contexts/form-upload-context'
import { useParams } from 'next/navigation'
import Image from 'next/image'

interface UploadedFileData {
  filename: string
  url: string
  size: number
}

// Helper to convert dataURL to File
const dataURLtoFile = (dataurl: string, filename: string): File => {
  const arr = dataurl.split(',')
  const mime = arr[0].match(/:(.*?);/)![1]
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new File([u8arr], filename, { type: mime })
}

const SignatureFieldRender = forwardRef<HTMLInputElement, { field: FormFieldBase }>(
  ({ field }, _ref) => {
    const form = useFormContext()
    const error = form?.formState?.errors[field.name]?.message as string
    const { uploadFile, isConfigured } = useFormUpload()
    const params = useParams()
    const projectSlug = params.slug as string || 'global'

    const sigCanvasRef = useRef<SignatureCanvas>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const [isLocked, setIsLocked] = useState(false)
    const [isEmpty, setIsEmpty] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [isUploadError, setIsUploadError] = useState(false)
    
    // Existing data check
    const existingData = form.getValues(field.name)
    const [savedSignatureUrl, setSavedSignatureUrl] = useState<string | null>(
      existingData && Array.isArray(existingData) && existingData.length > 0 
        ? existingData[0].url 
        : null
    )

    // Register field
    useEffect(() => {
        form.register(field.name)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Resize canvas logic
    useEffect(() => {
       const resizeCanvas = () => {
           if (sigCanvasRef.current && containerRef.current) {
               // Only resize if active (not locked/showing image)
               if (!savedSignatureUrl) {
                  const canvas = sigCanvasRef.current.getCanvas()
                  const ratio = Math.max(window.devicePixelRatio || 1, 1)
                  
                  // Store current data if we want to preserve it on resize (omitted for simplicity, usually clear on resize is safer or complex)
                  // For now, simple resize
                  canvas.width = containerRef.current.offsetWidth * ratio
                  canvas.height = 200 * ratio
                  canvas.getContext('2d')?.scale(ratio, ratio)
               }
           }
       }
       
       window.addEventListener('resize', resizeCanvas)
       setTimeout(resizeCanvas, 100) // Initial delay to ensure render
       
       return () => window.removeEventListener('resize', resizeCanvas)
    }, [savedSignatureUrl])

    const handleClear = () => {
        sigCanvasRef.current?.clear()
        setIsEmpty(true)
        setIsUploadError(false)
    }

    const handleBegin = () => {
        setIsEmpty(false)
    }

    const handleSave = async () => {
        if (sigCanvasRef.current?.isEmpty()) return
        
        setIsSaving(true)
        setIsLocked(true)
        
        try {
            // 1. Get Blob/File
            const dataUrl = sigCanvasRef.current!.getTrimmedCanvas().toDataURL('image/png')
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
            const filename = `Signature_${field.label.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.png`
            const file = dataURLtoFile(dataUrl, filename)

            // 2. Upload
            if (!isConfigured) {
                // Simulation fall back
                await new Promise(r => setTimeout(r, 1000))
                const simulatedUrl = dataUrl // In local, just use dataUrl as mock
                
                 const mockData: UploadedFileData = {
                    filename: filename,
                    url: simulatedUrl,
                    size: file.size
                }
                form.setValue(field.name, [mockData])
                setSavedSignatureUrl(simulatedUrl)

            } else {
                const uploadedData = await uploadFile(file)
                if (uploadedData) {
                    form.setValue(field.name, [uploadedData])
                    setSavedSignatureUrl(uploadedData.url)
                } else {
                    throw new Error("Upload failed")
                }
            }
            
        } catch (err) {
            console.error("Signature save failed", err)
            setIsUploadError(true)
            setIsLocked(false)
        } finally {
            setIsSaving(false)
        }
    }

    const handleReset = () => {
        setSavedSignatureUrl(null)
        form.setValue(field.name, null)
        setIsLocked(false)
        setIsEmpty(true)
        setIsUploadError(false)
        // Need to wait for render to resize canvas again
        setTimeout(() => {
             // trigger resize
             window.dispatchEvent(new Event('resize'))
        }, 50)
    }

    return (
        <FieldWrapper id={field.id} label={field.label} helpText={field.helpText} error={error} required={field.required} colSpan={field.colSpan}>
            <div className="space-y-3">
                
                {/* Visual Canvas Area */}
                <div 
                    ref={containerRef}
                    className={cn(
                        "relative w-full h-[200px] border-2 border-dashed rounded-lg overflow-hidden touch-none",
                        isLocked || savedSignatureUrl ? "border-solid border-primary/20 bg-muted/20" : "border-border bg-background hover:border-primary/40 transition-colors",
                         error && "border-destructive"
                    )}
                >
                    {savedSignatureUrl ? (
                        <div className="w-full h-full flex items-center justify-center p-4 relative group">
                            <Image 
                                src={savedSignatureUrl} 
                                alt="Signature" 
                                width={400} 
                                height={200} 
                                className="max-w-full max-h-full object-contain"
                                unoptimized
                            />
                            <div className="absolute top-2 right-2 bg-background/80 backdrop-blur rounded px-2 py-1 text-xs font-mono text-muted-foreground border flex items-center gap-1">
                                <Lock className="w-3 h-3" /> Signed
                            </div>
                        </div>
                    ) : (
                        <>
                           {!isLocked && (
                               <SignatureCanvas 
                                   ref={sigCanvasRef}
                                   canvasProps={{
                                       className: "w-full h-full cursor-crosshair active:cursor-grabbing",
                                       style: { width: '100%', height: '100%' }
                                   }}
                                   onBegin={handleBegin}
                                   velocityFilterWeight={0.7}
                               />
                           )}
                           
                           {isEmpty && !isLocked && (
                               <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-muted-foreground/30 select-none">
                                   <div className="flex flex-col items-center">
                                       <PenTool className="w-12 h-12 mb-2 opacity-50" />
                                       <p className="text-lg font-medium">Sign Here</p>
                                   </div>
                               </div>
                           )}
                        </>
                    )}
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between">
                    {savedSignatureUrl ? (
                         <Button type="button" variant="outline" size="sm" onClick={handleReset} className="text-muted-foreground hover:text-destructive">
                             <RotateCcw className="w-4 h-4 mr-2" />
                             Clear & Sign Again
                         </Button>
                    ) : (
                        <>
                            <Button 
                                type="button" 
                                variant="ghost" 
                                size="sm" 
                                onClick={handleClear} 
                                disabled={isEmpty || isSaving}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                <Eraser className="w-4 h-4 mr-2" />
                                Clear
                            </Button>

                            <Button 
                                type="button" 
                                onClick={handleSave} 
                                disabled={isEmpty || isSaving}
                                size="sm"
                                className={cn("min-w-[100px]", isUploadError && "border-destructive text-destructive")}
                            >
                                {isSaving ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        Save Signature
                                    </>
                                )}
                            </Button>
                        </>
                    )}
                </div>
                
                 {isUploadError && (
                    <p className="text-xs text-destructive mt-1">Failed to save signature. Please try again.</p>
                )}

            </div>
        </FieldWrapper>
    )
  }
)
SignatureFieldRender.displayName = 'SignatureFieldRender'

export const SignatureField = forwardRef<HTMLInputElement, { field: FormFieldBase, mode?: 'builder' | 'render' | 'preview' }>(
  ({ field, mode = 'render' }, ref) => {
    
    if (mode === 'builder') {
      return (
        <FieldWrapper id={field.id} label={field.label} helpText={field.helpText} required={field.required} colSpan={field.colSpan}>
          <div className="border-2 border-dashed border-border rounded-lg h-[120px] bg-muted/10 flex items-center justify-center select-none cursor-not-allowed">
              <div className="flex flex-col items-center text-muted-foreground">
                  <PenTool className="w-8 h-8 mb-2" />
                  <p className="text-sm">Signature Field</p>
              </div>
          </div>
        </FieldWrapper>
      )
    }

    return <SignatureFieldRender field={field} ref={ref} />
  }
)
SignatureField.displayName = 'SignatureField'