'use client'

import { forwardRef, useRef, useEffect, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { FieldWrapper } from '../base/FieldWrapper'
import { FormFieldBase } from '@/types/group-forms'
import { Eraser, Download } from 'lucide-react'
import SignaturePad from 'signature_pad'

interface SignatureFieldProps {
  field: FormFieldBase
  mode?: 'builder' | 'render' | 'preview'
}

// --- Render Component with Context ---
const SignatureFieldRender = forwardRef<HTMLCanvasElement, { field: FormFieldBase, mode?: 'render' | 'preview' }>(
  ({ field, mode = 'render' }, _ref) => { // Removed ref parameter for now as we use internal ref
    const form = useFormContext()
    const error = mode === 'render' && form ? form.formState.errors[field.name]?.message as string : undefined

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [signaturePad, setSignaturePad] = useState<SignaturePad | null>(null)
    const [isEmpty, setIsEmpty] = useState(true)

    // Register field with form context if in render mode
    useEffect(() => {
      if (mode === 'render' && form) {
        form.register(field.name)
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode, field.name, form]);


    useEffect(() => {
      if (!canvasRef.current) {
          return; // No canvas, nothing to do
      }

      const canvas = canvasRef.current
      const parent = canvas.parentElement

      // Set canvas size to match container
      if (parent) {
        canvas.width = parent.clientWidth
        canvas.height = 200
      }

      // Initialize SignaturePad
      const pad = new SignaturePad(canvas, {
        backgroundColor: 'rgb(255, 255, 255)',
        penColor: 'rgb(0, 0, 0)',
        velocityFilterWeight: 0.7,
        minWidth: 0.5,
        maxWidth: 2.5,
        throttle: 16,
        minDistance: 5
      })

      if (mode === 'render' && form) {
        // Listen for signature changes only in render mode
        pad.addEventListener('endStroke', () => {
          setIsEmpty(pad.isEmpty())
          const dataURL = pad.toDataURL('image/png')
          form.setValue(field.name, dataURL)
        })
      } else if (mode === 'preview') {
          // Only update isEmpty state for preview
          pad.addEventListener('endStroke', () => {
              setIsEmpty(pad.isEmpty());
          });
      }


      setSignaturePad(pad)

      // Cleanup
      return () => {
        pad.off()
      }
    }, [field.name, form, mode])

    const handleClear = () => {
      if (signaturePad) {
        signaturePad.clear()
        setIsEmpty(true)
        if (mode === 'render' && form) {
            form.setValue(field.name, null)
        }
      }
    }

    const handleDownload = () => {
      if (signaturePad && !signaturePad.isEmpty()) {
        const dataURL = signaturePad.toDataURL('image/png')
        const link = document.createElement('a')
        link.download = 'signature.png'
        link.href = dataURL
        link.click()
      }
    }

    return (
      <FieldWrapper
        id={field.id}
        label={field.label}
        helpText={field.helpText}
        error={error}
        required={field.required}
        colSpan={field.colSpan}
      >
        <div className="space-y-2">
          {/* Canvas */}
          <div className="border rounded-lg overflow-hidden bg-white">
            <canvas
              ref={canvasRef}
              className="touch-none w-full"
              style={{ touchAction: 'none' }}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClear}
              disabled={isEmpty}
            >
              <Eraser className="h-4 w-4 mr-2" />
              Clear
            </Button>

            {mode === 'render' && ( // Only allow download in render mode
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={isEmpty}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            )}
          </div>

          {field.required && isEmpty && mode === 'render' && ( // Only show required message in render mode
            <p className="text-xs text-muted-foreground">
              Please sign above
            </p>
          )}
        </div>
      </FieldWrapper>
    )
  }
)
SignatureFieldRender.displayName = 'SignatureFieldRender'

export const SignatureField = forwardRef<HTMLCanvasElement, SignatureFieldProps>(
  ({ field, mode = 'render' }, ref) => {
    
    if (mode === 'builder') {
      return (
        <FieldWrapper
          id={field.id}
          label={field.label}
          helpText={field.helpText}
          required={field.required}
          colSpan={field.colSpan}
        >
          <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-not-allowed opacity-70">
            <p className="text-sm text-muted-foreground">
              Signature pad preview
            </p>
            <div className="h-32 bg-muted rounded mt-2" />
          </div>
        </FieldWrapper>
      )
    }

    // Preview mode: We actually WANT the drawing capability, but without form binding.
    // However, SignatureFieldRender currently uses useFormContext unconditionally.
    // We need to fix SignatureFieldRender to allow mode='preview' without context.
    
    // In Preview mode, we can use SignatureFieldRender BUT we need to provide a mock context or modify Render to check context.
    // For safety and speed, let's create a simplified Preview version or update Render to be safe.
    
    // DECISION: Update SignatureFieldRender to be safe? 
    // Actually, looking at my implementation of SignatureFieldRender above, it still calls useFormContext unconditionally.
    // I need to change that line in SignatureFieldRender too.
    
    // WAIT: I cannot change SignatureFieldRender inside this ReplacementContent block easily if I pasted it wrong.
    // Let me fix the ReplacementContent to make SignatureFieldRender safe.
    
    return <SignatureFieldRender field={field} mode={mode} ref={ref} />
  }
)
SignatureField.displayName = 'SignatureField'