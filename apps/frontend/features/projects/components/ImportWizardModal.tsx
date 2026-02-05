
import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { apiClient } from '@/lib/api'
import Papa from 'papaparse'
import { Loader2, ArrowRight, Check } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'

interface ImportWizardModalProps {
    open: boolean
    onClose: () => void
    projectId: string
    onImportComplete?: () => void
}

interface FormOption {
    id: number
    title: string
    form_schema: any
}

export function ImportWizardModal({ open, onClose, projectId, onImportComplete }: ImportWizardModalProps) {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [forms, setForms] = useState<FormOption[]>([]);
    const [selectedFormId, setSelectedFormId] = useState<string>('');
    const [rawInput, setRawInput] = useState('');
    const [parsedData, setParsedData] = useState<any[]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [mappings, setMappings] = useState<Record<string, string>>({}); // Header -> FieldName
    const [fields, setFields] = useState<{name: string, label: string}[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 1. Fetch Forms
    useEffect(() => {
        if (open) {
            apiClient<{data: FormOption[]}>(`/api/projects/${projectId}/forms`)
                .then(res => setForms(res.data || []))
                .catch(err => console.error("Failed to load forms", err));
        }
    }, [open, projectId]);

    // 2. Extract Fields when Form Selected
    useEffect(() => {
        if (selectedFormId && forms.length > 0) {
            const form = forms.find(f => String(f.id) === selectedFormId);
            if (form) {
                // Flatten fields from schema
                const extracted: {name: string, label: string}[] = [];
                const traverse = (items: any[]) => {
                    items.forEach(item => {
                        if (item.name) extracted.push({ name: item.name, label: item.label || item.name });
                        if (item.fields) traverse(item.fields);
                        if (item.columns) traverse(item.columns);
                    });
                };
                // Support pages -> sections -> fields
                form.form_schema?.pages?.forEach((p: any) => 
                    p.sections?.forEach((s: any) => traverse(s.fields))
                );
                setFields(extracted);
            }
        }
    }, [selectedFormId, forms]);

    const handleParse = () => {
        if (!rawInput.trim()) return;
        
        Papa.parse(rawInput, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                if (results.data && results.data.length > 0) {
                    setParsedData(results.data);
                    setHeaders(results.meta.fields || []);
                    
                    // Auto-map based on name similarity
                    const initialMap: Record<string, string> = {};
                    (results.meta.fields || []).forEach(header => {
                        const match = fields.find(f => 
                            f.label.toLowerCase() === header.toLowerCase() || 
                            f.name.toLowerCase() === header.toLowerCase()
                        );
                        if (match) initialMap[header] = match.name;
                    });
                    setMappings(initialMap);
                    
                    setStep(2);
                }
            }
        });
    };

    const handleImport = async () => {
        if (!selectedFormId) return;
        setIsSubmitting(true);
        
        // Transform data
        const transformedData = parsedData.map(row => {
            const newRow: Record<string, any> = {};
            Object.keys(row).forEach(header => {
                const targetField = mappings[header];
                if (targetField) {
                    newRow[targetField] = row[header];
                }
            });
            return newRow;
        });

        try {
            await apiClient(`/api/forms/${selectedFormId}/import`, {
                method: 'POST',
                body: JSON.stringify({ data: transformedData })
            });
            setStep(3); // Success
            onImportComplete?.();
        } catch (error) {
            console.error("Import failed", error);
            // Handle error (toast?)
        } finally {
            setIsSubmitting(false);
        }
    };

    const reset = () => {
        setStep(1);
        setRawInput('');
        setParsedData([]);
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={reset}>
            <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Bulk Import Wizard</DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto py-4">
                    {/* STEP 1: Input */}
                    {step === 1 && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Target Form</Label>
                                <Select value={selectedFormId} onValueChange={setSelectedFormId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a form..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {forms.map(f => (
                                            <SelectItem key={f.id} value={String(f.id)}>{f.title}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Paste Data (Excel/CSV)</Label>
                                <Textarea 
                                    className="min-h-[300px] font-mono text-xs" 
                                    placeholder="Paste your data here..." 
                                    value={rawInput}
                                    onChange={(e) => setRawInput(e.target.value)}
                                />
                                <p className="text-sm text-muted-foreground">The first row must contain headers.</p>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: Mapping */}
                    {step === 2 && (
                        <div className="space-y-6">
                            <p className="text-sm text-muted-foreground">
                                Found {parsedData.length} rows. Map your columns to the form fields.
                            </p>
                            
                            <div className="grid grid-cols-2 gap-4">
                                {headers.map(header => (
                                    <div key={header} className="flex items-center gap-2 border p-2 rounded">
                                        <div className="w-1/2 font-medium truncate" title={header}>{header}</div>
                                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                        <div className="w-1/2">
                                            <Select 
                                                value={mappings[header] || ''} 
                                                onValueChange={(val) => setMappings(prev => ({...prev, [header]: val}))}
                                            >
                                                <SelectTrigger className="h-8">
                                                    <SelectValue placeholder="Skip" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="">-- Skip --</SelectItem>
                                                    {fields.map(f => (
                                                        <SelectItem key={f.name} value={f.name}>{f.label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Preview Table */}
                            <div className="border rounded-md mt-4">
                                <div className="p-2 bg-muted font-medium text-xs">Preview (First 3 rows)</div>
                                <ScrollArea className="h-[200px]">
                                    <div className="space-y-1 p-2">
                                        {parsedData.slice(0, 3).map((row, i) => (
                                            <div key={i} className="text-xs border-b pb-1 mb-1 font-mono">
                                                {JSON.stringify(row)}
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: Success */}
                    {step === 3 && (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                            <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                                <Check className="h-8 w-8" />
                            </div>
                            <h3 className="text-xl font-semibold">Import Complete!</h3>
                            <p className="text-muted-foreground">Successfully imported {parsedData.length} records.</p>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    {step === 1 && (
                        <Button onClick={handleParse} disabled={!selectedFormId || !rawInput}>
                            Next: Map Columns
                        </Button>
                    )}
                    {step === 2 && (
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                            <Button onClick={handleImport} disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Import {parsedData.length} Records
                            </Button>
                        </div>
                    )}
                    {step === 3 && (
                        <Button onClick={reset}>Close</Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
