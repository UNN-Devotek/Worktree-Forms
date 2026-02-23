'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Monitor, Tablet, Smartphone, RotateCcw, CheckCircle2, Eye, ArrowLeft } from 'lucide-react'
import { useFormBuilderStore } from '@/features/forms/stores/form-builder-store'
import { FormViewer } from '@/components/groups/forms/form-viewer'
import { cn } from '@/lib/utils'
import { FormRunner } from './FormRunner'

interface PreviewModalProps {
  open: boolean
  onClose: () => void
}

type DeviceType = 'desktop' | 'tablet' | 'mobile'
type PreviewState = 'fill' | 'submitted'

const deviceConfig = {
  desktop: {
    width: '100%',
    maxWidth: '1200px',
    height: '100%',
    label: 'Desktop',
    icon: Monitor
  },
  tablet: {
    width: '768px',
    maxWidth: '768px',
    height: '1024px',
    label: 'Tablet (768x1024)',
    icon: Tablet
  },
  mobile: {
    width: '375px',
    maxWidth: '375px',
    height: '812px',
    label: 'Mobile (375x812)',
    icon: Smartphone
  }
}

export function PreviewModal({ open, onClose }: PreviewModalProps) {
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop')
  const [previewState, setPreviewState] = useState<PreviewState>('fill')
  const [submittedData, setSubmittedData] = useState<Record<string, any> | null>(null)

  const { formSchema } = useFormBuilderStore()
  const config = deviceConfig[deviceType]
  const settings = formSchema?.settings || {} as any

  // Handle form submission
  const onSubmit = (data: Record<string, any>) => {
    setSubmittedData(data)
    setPreviewState('submitted')
  }

  // Reset and try again
  const handleReset = () => {
    setSubmittedData(null)
    setPreviewState('fill')
  }

  // Close and reset state
  const handleClose = () => {
    handleReset()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] w-full h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DialogTitle>Form Preview</DialogTitle>
              {previewState === 'submitted' && (
                <Badge variant="default">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Submitted
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3">
              {previewState === 'submitted' && (
                <Button variant="outline" size="sm" onClick={handleReset}>
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Try Again
                </Button>
              )}
              <ToggleGroup
                type="single"
                value={deviceType}
                onValueChange={(value: string) => value && setDeviceType(value as DeviceType)}
                className="gap-1"
              >
                {Object.entries(deviceConfig).map(([key, conf]) => {
                  const Icon = conf.icon
                  return (
                    <ToggleGroupItem
                      key={key}
                      value={key}
                      aria-label={conf.label}
                      title={conf.label}
                      className={deviceType === key ? "bg-primary text-primary-foreground" : ""}
                    >
                      <Icon className="h-4 w-4" />
                    </ToggleGroupItem>
                  )
                })}
              </ToggleGroup>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {config.label} {previewState === 'fill' ? '- Fill out the form below' : '- Viewing submission'}
          </p>
        </DialogHeader>

        {/* Device Frame */}
        <div className="flex-1 overflow-hidden flex items-start justify-center bg-muted/50 rounded-lg p-4">
          <div
            className={cn(
              'bg-background border rounded-lg overflow-auto shadow-lg transition-all duration-300',
              deviceType !== 'desktop' && 'mx-auto'
            )}
            style={{
              width: config.width,
              maxWidth: config.maxWidth,
              height: deviceType === 'desktop' ? '100%' : config.height,
              maxHeight: '100%'
            }}
          >
            {/* Device Header Bar (for mobile/tablet) */}
            {deviceType !== 'desktop' && (
              <div className="h-6 bg-muted border-b flex items-center justify-center gap-1">
                <div className="w-16 h-1 rounded-full bg-muted-foreground/30" />
              </div>
            )}

            {/* Form Content */}
            <div className="p-4 overflow-auto" style={{ height: deviceType === 'desktop' ? '100%' : `calc(${config.height} - 24px)` }}>
              {previewState === 'fill' ? (
                 formSchema ? (
                   <FormRunner
                      formSchema={formSchema}
                      mode="preview"
                      onSubmit={onSubmit}
                      // Reset logic is internal to reusable component usually? 
                      // actually FormRunner uses local state for page index. 
                      // If we reset here, we might need a key to force re-mount if we want to reset page index too.
                      key={previewState} // simplistic reset of runner
                   />
                 ) : (
                    <div className="text-center py-8 text-muted-foreground">No form schema loaded</div>
                 )
              ) : (
                // Submitted State - View Results
                <div className="space-y-4">
                  {/* Success Alert */}
                  <Alert className="border-primary bg-primary/10 dark:bg-primary/5">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    <AlertTitle className="text-primary dark:text-primary">
                      Form Submitted Successfully!
                    </AlertTitle>
                    <AlertDescription className="text-primary/80 dark:text-primary/70">
                      {settings.successMessage || 'Thank you for your submission.'}
                    </AlertDescription>
                  </Alert>

                  {/* View Submission */}
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          Your Submission
                        </CardTitle>
                        <span className="text-sm text-muted-foreground">
                          {new Date().toLocaleString()}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {formSchema && submittedData ? (
                        <FormViewer
                          formSchema={formSchema}
                          responseData={submittedData}
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground italic">
                          Unable to display submission
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Back to Form Button */}
                  <div className="flex justify-center">
                    <Button variant="outline" onClick={handleReset}>
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Fill Out Again
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
