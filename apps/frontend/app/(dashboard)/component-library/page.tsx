'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
    Check, Copy, Search, Atom, Layers, Boxes, LayoutGrid, EyeOff,
    Bold, Italic, AlignLeft, AlignCenter, AlignRight, Info, AlertTriangle,
    User, Settings, LogOut, Plus, Trash2, Star, ChevronRight, FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── UI Component imports ────────────────────────────────────────────────────
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Toggle } from '@/components/ui/toggle';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    Breadcrumb, BreadcrumbList, BreadcrumbItem,
    BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
    Dialog, DialogTrigger, DialogContent, DialogHeader,
    DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
    AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader,
    AlertDialogTitle, AlertDialogDescription, AlertDialogFooter,
    AlertDialogAction, AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import {
    DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
    DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import {
    Select, SelectTrigger, SelectValue,
    SelectContent, SelectItem,
} from '@/components/ui/select';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
    Sheet, SheetTrigger, SheetContent,
    SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Calendar } from '@/components/ui/calendar';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import {
    Table, TableHeader, TableBody,
    TableRow, TableHead, TableCell,
} from '@/components/ui/table';
import { PageHeader } from '@/components/ui/page-header';

// ── Types ───────────────────────────────────────────────────────────────────

type AtomicLevel = 'Atom' | 'Molecule' | 'Organism';

interface ComponentEntry {
    name: string;
    exports: string[];
    importPath: string;
    description: string;
    level: AtomicLevel;
    group?: string;
    preview?: React.ReactNode;
}

// ── Stateful preview wrappers ───────────────────────────────────────────────

function DialogPreview() {
    const [open, setOpen] = useState(false);
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm">Open Dialog</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Confirm Action</DialogTitle>
                    <DialogDescription>Are you sure you want to proceed with this action?</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="neutral" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button size="sm" onClick={() => setOpen(false)}>Confirm</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function AlertDialogPreview() {
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button size="sm" variant="destructive">Delete Item</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction>Delete</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

function DropdownMenuPreview() {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button size="sm">Options <ChevronRight className="ml-1 h-3 w-3" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuLabel>Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem><User className="mr-2 h-4 w-4" />Profile</DropdownMenuItem>
                <DropdownMenuItem><Settings className="mr-2 h-4 w-4" />Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive"><LogOut className="mr-2 h-4 w-4" />Logout</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function PopoverPreview() {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button size="sm">Open Popover</Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
                <div className="space-y-2">
                    <h4 className="font-medium text-sm">Dimensions</h4>
                    <p className="text-xs text-muted-foreground">Set the dimensions for the layer.</p>
                    <div className="grid grid-cols-2 gap-2">
                        <Input placeholder="Width" className="h-7 text-xs" />
                        <Input placeholder="Height" className="h-7 text-xs" />
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}

function SelectPreview() {
    return (
        <Select>
            <SelectTrigger className="w-44">
                <SelectValue placeholder="Pick a fruit…" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="apple">Apple</SelectItem>
                <SelectItem value="banana">Banana</SelectItem>
                <SelectItem value="cherry">Cherry</SelectItem>
                <SelectItem value="date">Date</SelectItem>
            </SelectContent>
        </Select>
    );
}

function CommandPreview() {
    return (
        <div className="rounded-md border w-full max-w-xs shadow-sm">
            <Command>
                <CommandInput placeholder="Search…" />
                <CommandList>
                    <CommandEmpty>No results.</CommandEmpty>
                    <CommandGroup heading="Suggestions">
                        <CommandItem><FileText className="mr-2 h-4 w-4" />New document</CommandItem>
                        <CommandItem><Settings className="mr-2 h-4 w-4" />Settings</CommandItem>
                        <CommandItem><User className="mr-2 h-4 w-4" />Profile</CommandItem>
                    </CommandGroup>
                </CommandList>
            </Command>
        </div>
    );
}

function SheetPreview() {
    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button size="sm">Open Sheet</Button>
            </SheetTrigger>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Edit Profile</SheetTitle>
                    <SheetDescription>Make changes to your profile here.</SheetDescription>
                </SheetHeader>
                <div className="mt-4 space-y-3">
                    <div>
                        <Label className="text-xs mb-1 block">Name</Label>
                        <Input placeholder="John Doe" />
                    </div>
                    <div>
                        <Label className="text-xs mb-1 block">Email</Label>
                        <Input placeholder="john@example.com" />
                    </div>
                    <Button className="w-full" size="sm">Save Changes</Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}

function ButtonPreview() {
    const [isLoading, setIsLoading] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleSave = () => {
        if (isLoading || isLoaded) return;
        setIsLoading(true);
        timerRef.current = setTimeout(() => {
            setIsLoading(false);
            setIsLoaded(true);
        }, 1800);
    };

    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    return (
        <div className="space-y-3">
            {/* Row 1 — All variants */}
            <div className="flex flex-wrap items-center gap-2">
                <Button variant="default">Default</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="alternative">Alternative</Button>
                <Button variant="warning">Warning</Button>
                <Button variant="info">Info</Button>
                <Button variant="purple">Purple</Button>
                <Button variant="neutral">Neutral</Button>
                <Button variant="muted">Muted</Button>
            </div>

            {/* Row 2 — Loading / loaded demo */}
            <div className="flex flex-wrap items-center gap-2">
                <Button variant="default" isLoading={isLoading} isLoaded={isLoaded} onClick={handleSave}>
                    Save Changes
                </Button>
                <Button variant="secondary" isLoading={isLoading} isLoaded={isLoaded}>
                    Confirm
                </Button>
                <span className="text-xs text-muted-foreground">&larr; click Save to demo</span>
            </div>

            {/* Row 3 — Sizes */}
            <div className="flex flex-wrap items-center gap-2">
                <Button size="sm">Small</Button>
                <Button size="default">Default</Button>
                <Button size="lg">Large</Button>
                <Button size="xl">XL</Button>
            </div>
        </div>
    );
}

function CalendarPreview() {
    const [date, setDate] = useState<Date | undefined>(new Date());
    return (
        <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md border text-sm scale-90 origin-top"
        />
    );
}

function ConfirmationDialogPreview() {
    const [open, setOpen] = useState(false);
    return (
        <>
            <Button size="sm" variant="destructive" onClick={() => setOpen(true)}>
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />Delete
            </Button>
            <ConfirmationDialog
                open={open}
                onOpenChange={setOpen}
                title="Delete this item?"
                description="This will permanently delete the item and all associated data."
                confirmLabel="Delete"
                variant="destructive"
                onConfirm={() => setOpen(false)}
            />
        </>
    );
}

function TabsPreview() {
    return (
        <Tabs defaultValue="overview" className="w-full max-w-xs">
            <TabsList className="w-full">
                <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
                <TabsTrigger value="analytics" className="flex-1">Analytics</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="text-xs text-muted-foreground p-2">Overview content here.</TabsContent>
            <TabsContent value="analytics" className="text-xs text-muted-foreground p-2">Analytics data here.</TabsContent>
        </Tabs>
    );
}

function TooltipPreview() {
    return (
        <TooltipProvider>
            <div className="flex gap-2">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button size="sm">Hover me</Button>
                    </TooltipTrigger>
                    <TooltipContent>This is a tooltip!</TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button size="icon" className="h-8 w-8">
                            <Info className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>More information</TooltipContent>
                </Tooltip>
            </div>
        </TooltipProvider>
    );
}

function TablePreview() {
    const rows = [
        { name: 'Alice', role: 'Admin', status: 'Active' },
        { name: 'Bob', role: 'Member', status: 'Inactive' },
        { name: 'Carol', role: 'Viewer', status: 'Active' },
    ];
    return (
        <div className="w-full rounded-md border overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rows.map(r => (
                        <TableRow key={r.name}>
                            <TableCell className="font-medium">{r.name}</TableCell>
                            <TableCell>{r.role}</TableCell>
                            <TableCell>
                                <Badge variant={r.status === 'Active' ? 'default' : 'secondary'} className="text-[10px]">
                                    {r.status}
                                </Badge>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

// ── No-preview placeholder ──────────────────────────────────────────────────

function NoPreview() {
    return (
        <div className="flex flex-col items-center justify-center h-20 text-muted-foreground/30 gap-1.5">
            <EyeOff className="h-5 w-5" />
            <span className="text-[10px]">Preview requires data context</span>
        </div>
    );
}

// ── Component data ──────────────────────────────────────────────────────────

const ATOMS: ComponentEntry[] = [
    {
        name: 'Button',
        exports: ['Button', 'buttonVariants'],
        importPath: '@/components/ui/button',
        description: '9 solid variants, uniform h-9 height. default=blue, secondary=green, destructive=red, alternative=amber, warning=orange, info=sky, purple=violet, neutral=slate, muted=greyed-out.',
        level: 'Atom',
        preview: <ButtonPreview />,
    },
    {
        name: 'Input',
        exports: ['Input'],
        importPath: '@/components/ui/input',
        description: 'Single-line text input. Hover dims the border (primary/50); focus triggers a full primary border + ring-2 glow.',
        level: 'Atom',
        preview: (
            <div className="w-full max-w-xs space-y-2">
                <Input placeholder="Enter text…" />
                <Input placeholder="Disabled" disabled />
            </div>
        ),
    },
    {
        name: 'Textarea',
        exports: ['Textarea'],
        importPath: '@/components/ui/textarea',
        description: 'Multi-line text input. Shares the same hover/focus design tokens as Input — primary/50 on hover, full primary ring on focus.',
        level: 'Atom',
        preview: <Textarea placeholder="Write your message…" className="w-full max-w-xs min-h-[80px]" />,
    },
    {
        name: 'Label',
        exports: ['Label'],
        importPath: '@/components/ui/label',
        description: 'Accessible form label that visually associates with its control.',
        level: 'Atom',
        preview: (
            <div className="flex flex-col gap-2 w-full max-w-xs">
                <div className="flex flex-col gap-1">
                    <Label htmlFor="demo-input">Email address</Label>
                    <Input id="demo-input" placeholder="you@example.com" />
                </div>
            </div>
        ),
    },
    {
        name: 'Badge',
        exports: ['Badge', 'badgeVariants'],
        importPath: '@/components/ui/badge',
        description: '14 variants. Solid: default, secondary, destructive, alternative, warning, success, info. Soft tinted status: active, pending, processing, done, cancelled, high, low.',
        level: 'Atom',
        preview: (
            <div className="space-y-2 w-full">
                <div className="flex flex-wrap gap-1.5">
                    <Badge>Default</Badge>
                    <Badge variant="secondary">Secondary</Badge>
                    <Badge variant="destructive">Destructive</Badge>
                    <Badge variant="alternative">Alternative</Badge>
                    <Badge variant="warning">Warning</Badge>
                    <Badge variant="success">Success</Badge>
                    <Badge variant="info">Info</Badge>
                </div>
                <div className="flex flex-wrap gap-1.5">
                    <Badge variant="active">Active</Badge>
                    <Badge variant="pending">Pending</Badge>
                    <Badge variant="processing">Processing</Badge>
                    <Badge variant="done">Done</Badge>
                    <Badge variant="cancelled">Cancelled</Badge>
                    <Badge variant="high">High</Badge>
                    <Badge variant="low">Low</Badge>
                </div>
            </div>
        ),
    },
    {
        name: 'Checkbox',
        exports: ['Checkbox'],
        importPath: '@/components/ui/checkbox',
        description: 'Binary toggle with primary focus ring (ring-2). Includes a 44px invisible touch target via before: pseudo-element on mobile (hidden on md+).',
        level: 'Atom',
        preview: (
            <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2"><Checkbox id="cb1" defaultChecked /><Label htmlFor="cb1">Checked</Label></div>
                <div className="flex items-center gap-2"><Checkbox id="cb2" /><Label htmlFor="cb2">Unchecked</Label></div>
                <div className="flex items-center gap-2"><Checkbox id="cb3" disabled /><Label htmlFor="cb3" className="text-muted-foreground">Disabled</Label></div>
            </div>
        ),
    },
    {
        name: 'Switch',
        exports: ['Switch'],
        importPath: '@/components/ui/switch',
        description: 'On/off toggle with animated thumb slide. Hover emits a primary/20 glow ring; keyboard focus uses a full primary ring with offset.',
        level: 'Atom',
        preview: (
            <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2"><Switch defaultChecked /><Label>Enabled</Label></div>
                <div className="flex items-center gap-2"><Switch /><Label>Disabled (off)</Label></div>
            </div>
        ),
    },
    {
        name: 'Separator',
        exports: ['Separator'],
        importPath: '@/components/ui/separator',
        description: 'Horizontal or vertical visual divider between content regions.',
        level: 'Atom',
        preview: (
            <div className="w-full space-y-3">
                <div className="text-xs text-muted-foreground">Section A</div>
                <Separator />
                <div className="text-xs text-muted-foreground">Section B</div>
                <div className="flex items-center gap-3 h-6">
                    <span className="text-xs">Left</span>
                    <Separator orientation="vertical" />
                    <span className="text-xs">Right</span>
                </div>
            </div>
        ),
    },
    {
        name: 'Skeleton',
        exports: ['Skeleton'],
        importPath: '@/components/ui/skeleton',
        description: 'Animated loading placeholder that matches the shape of real content.',
        level: 'Atom',
        preview: (
            <div className="flex items-center gap-3 w-full">
                <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                <div className="space-y-2 flex-1">
                    <Skeleton className="h-3 w-3/4 rounded" />
                    <Skeleton className="h-3 w-1/2 rounded" />
                </div>
            </div>
        ),
    },
    {
        name: 'Progress',
        exports: ['Progress'],
        importPath: '@/components/ui/progress',
        description: 'Animated progress bar powered by framer-motion. Smoothly interpolates from 0% to the target value on mount using a width animation (duration 0.6s, ease-in-out cubic).',
        level: 'Atom',
        preview: (
            <div className="w-full max-w-xs space-y-3">
                <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground"><span>Uploading…</span><span>67%</span></div>
                    <Progress value={67} />
                </div>
                <Progress value={33} className="h-1.5" />
            </div>
        ),
    },
    {
        name: 'Toggle',
        exports: ['Toggle', 'toggleVariants'],
        importPath: '@/components/ui/toggle',
        description: 'Two-state pressable button for toolbar-style formatting options.',
        level: 'Atom',
        preview: (
            <div className="flex gap-1">
                <Toggle size="sm" aria-label="Bold"><Bold className="h-4 w-4" /></Toggle>
                <Toggle size="sm" aria-label="Italic" defaultPressed><Italic className="h-4 w-4" /></Toggle>
                <Toggle size="sm" variant="outline" aria-label="Align left"><AlignLeft className="h-4 w-4" /></Toggle>
                <Toggle size="sm" variant="outline" aria-label="Align center"><AlignCenter className="h-4 w-4" /></Toggle>
            </div>
        ),
    },
    {
        name: 'Loading Spinner',
        exports: ['LoadingSpinner'],
        importPath: '@/components/ui/loading-spinner',
        description: 'Animated spinner for indicating async operations in progress.',
        level: 'Atom',
        preview: (
            <div className="flex items-center gap-4">
                <LoadingSpinner size={16} />
                <LoadingSpinner size={24} />
                <LoadingSpinner size={36} />
            </div>
        ),
    },
    {
        name: 'Animated Theme Toggler',
        exports: ['AnimatedThemeToggler'],
        importPath: '@/components/ui/animated-theme-toggler',
        description: 'Sun/Moon toggle with a View Transitions API ripple animation expanding from the button outward. Falls back gracefully in Firefox/Safari.',
        level: 'Atom',
        preview: <AnimatedThemeToggler />,
    },
    {
        name: 'Mode Toggle',
        exports: ['ModeToggle'],
        importPath: '@/components/ui/mode-toggle',
        description: 'Re-exports AnimatedThemeToggler as ModeToggle for backward compatibility.',
        level: 'Atom',
        preview: <ModeToggle />,
    },
    {
        name: 'Theme Toggle',
        exports: ['ThemeToggle'],
        importPath: '@/components/ui/theme-toggle',
        description: 'Borderless, shadowless variant of AnimatedThemeToggler — designed for embedding inside sidebars or toolbars where a subtle toggle is preferred over a bordered button.',
        level: 'Atom',
        preview: <ThemeToggle />,
    },
    {
        name: 'Alert',
        exports: ['Alert', 'AlertTitle', 'AlertDescription'],
        importPath: '@/components/ui/alert',
        description: 'Inline notification component for communicating important messages.',
        level: 'Atom',
        preview: (
            <div className="w-full space-y-2">
                <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Heads up!</AlertTitle>
                    <AlertDescription>This is an informational alert message.</AlertDescription>
                </Alert>
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>Something went wrong. Please try again.</AlertDescription>
                </Alert>
            </div>
        ),
    },
    // Form field atoms
    {
        name: 'Field Error',
        exports: ['FieldError'],
        importPath: '@/components/forms/fields/base/FieldError',
        description: 'Displays validation error message beneath a form field.',
        level: 'Atom',
        group: 'Form Fields',
        preview: (
            <div className="flex items-center gap-1.5 text-destructive text-xs">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                This field is required.
            </div>
        ),
    },
    {
        name: 'Field Help',
        exports: ['FieldHelp'],
        importPath: '@/components/forms/fields/base/FieldHelp',
        description: 'Hint text displayed below a form field to guide user input.',
        level: 'Atom',
        group: 'Form Fields',
        preview: (
            <p className="text-[11px] text-muted-foreground italic">Use your work email address for account recovery.</p>
        ),
    },
    {
        name: 'Field Label',
        exports: ['FieldLabel'],
        importPath: '@/components/forms/fields/base/FieldLabel',
        description: 'Styled label element for form fields, supports required indicator.',
        level: 'Atom',
        group: 'Form Fields',
        preview: (
            <div className="flex flex-col gap-2">
                <Label>Project Name <span className="text-destructive">*</span></Label>
                <Label className="text-muted-foreground text-xs font-normal">Optional field label</Label>
            </div>
        ),
    },
    {
        name: 'Text Field',
        exports: ['TextField'],
        importPath: '@/components/forms/fields/input/TextField',
        description: 'Standard single-line text form field with label, help, and error.',
        level: 'Atom',
        group: 'Form Fields',
        preview: (
            <div className="w-full max-w-xs space-y-1">
                <Label className="text-xs">First Name <span className="text-destructive">*</span></Label>
                <Input placeholder="John Doe" />
            </div>
        ),
    },
    {
        name: 'Email Field',
        exports: ['EmailField'],
        importPath: '@/components/forms/fields/input/EmailField',
        description: 'Email-type form field with built-in format validation.',
        level: 'Atom',
        group: 'Form Fields',
        preview: (
            <div className="w-full max-w-xs space-y-1">
                <Label className="text-xs">Email Address</Label>
                <Input type="email" placeholder="you@company.com" />
                <p className="text-[10px] text-muted-foreground">We'll use this to contact you.</p>
            </div>
        ),
    },
    {
        name: 'Phone Field',
        exports: ['PhoneField'],
        importPath: '@/components/forms/fields/input/PhoneField',
        description: 'Phone number form field with formatting mask support.',
        level: 'Atom',
        group: 'Form Fields',
        preview: (
            <div className="w-full max-w-xs space-y-1">
                <Label className="text-xs">Phone Number</Label>
                <Input placeholder="(555) 000-0000" />
            </div>
        ),
    },
    {
        name: 'Text Area Field',
        exports: ['TextAreaField'],
        importPath: '@/components/forms/fields/input/TextAreaField',
        description: 'Multi-line text form field with character counter.',
        level: 'Atom',
        group: 'Form Fields',
        preview: (
            <div className="w-full max-w-xs space-y-1">
                <Label className="text-xs">Notes</Label>
                <Textarea placeholder="Enter additional notes…" className="min-h-[60px] text-xs resize-none" />
                <p className="text-[10px] text-muted-foreground text-right">0 / 500</p>
            </div>
        ),
    },
    {
        name: 'Heading Element',
        exports: ['HeadingElement'],
        importPath: '@/components/forms/fields/elements/HeadingElement',
        description: 'Static heading display element within a form layout.',
        level: 'Atom',
        group: 'Form Elements',
        preview: (
            <div className="w-full space-y-0.5">
                <h3 className="text-base font-bold tracking-tight">Section 2: Personal Information</h3>
                <p className="text-[10px] text-muted-foreground">Static heading display element</p>
            </div>
        ),
    },
    {
        name: 'Text Element',
        exports: ['TextElement'],
        importPath: '@/components/forms/fields/elements/TextElement',
        description: 'Static paragraph display element within a form layout.',
        level: 'Atom',
        group: 'Form Elements',
        preview: (
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">Please fill out all required fields carefully. Your information will be kept confidential and used only for project purposes.</p>
        ),
    },
    {
        name: 'Image Element',
        exports: ['ImageElement'],
        importPath: '@/components/forms/fields/elements/ImageElement',
        description: 'Static image display element within a form layout.',
        level: 'Atom',
        group: 'Form Elements',
        preview: (
            <div className="w-full h-16 rounded-lg border-2 border-dashed border-border bg-muted/30 flex flex-col items-center justify-center gap-1">
                <FileText className="h-5 w-5 text-muted-foreground/40" />
                <span className="text-[10px] text-muted-foreground">company-logo.png</span>
            </div>
        ),
    },
    {
        name: 'Alignment Selector',
        exports: ['AlignmentSelector'],
        importPath: '@/features/sheets/components/toolbar/AlignmentSelector',
        description: 'Left / center / right cell alignment toggle buttons.',
        level: 'Atom',
        group: 'Sheets Toolbar',
        preview: (
            <ToggleGroup type="single" defaultValue="left" className="border rounded-md p-0.5">
                <ToggleGroupItem value="left" size="sm"><AlignLeft className="h-3.5 w-3.5" /></ToggleGroupItem>
                <ToggleGroupItem value="center" size="sm"><AlignCenter className="h-3.5 w-3.5" /></ToggleGroupItem>
                <ToggleGroupItem value="right" size="sm"><AlignRight className="h-3.5 w-3.5" /></ToggleGroupItem>
            </ToggleGroup>
        ),
    },
    {
        name: 'Offline Indicator',
        exports: ['OfflineIndicator'],
        importPath: '@/features/offline/components/offline-indicator',
        description: 'Banner that appears when the application loses network connectivity.',
        level: 'Atom',
        group: 'Sync',
        preview: (
            <div className="w-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-600 dark:text-yellow-400 rounded-lg px-3 py-2 text-xs font-medium flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                You are currently offline
            </div>
        ),
    },
    {
        name: 'Save Button',
        exports: ['SaveButton'],
        importPath: '@/features/forms/components/builder/toolbar/SaveButton',
        description: 'Form builder save action button with loading and saved states.',
        level: 'Atom',
        group: 'Form Builder',
        preview: (
            <div className="flex gap-2">
                <Button size="sm" variant="neutral"><Check className="mr-1.5 h-3.5 w-3.5 text-emerald-500" />Saved</Button>
                <Button size="sm">Save form</Button>
            </div>
        ),
    },
];

const MOLECULES: ComponentEntry[] = [
    {
        name: 'Card',
        exports: ['Card', 'CardHeader', 'CardTitle', 'CardDescription', 'CardContent', 'CardFooter'],
        importPath: '@/components/ui/card',
        description: 'Rounded container with optional header, content, and footer sections.',
        level: 'Molecule',
        preview: (
            <Card className="w-full max-w-xs">
                <CardHeader>
                    <CardTitle className="text-sm">Project Stats</CardTitle>
                    <CardDescription className="text-xs">Your activity this month</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-2xl font-bold">1,284</p>
                    <p className="text-xs text-muted-foreground">+12% from last month</p>
                </CardContent>
                <CardFooter className="pt-0">
                    <Button size="sm" className="w-full">View all</Button>
                </CardFooter>
            </Card>
        ),
    },
    {
        name: 'Avatar',
        exports: ['Avatar', 'AvatarImage', 'AvatarFallback'],
        importPath: '@/components/ui/avatar',
        description: 'Circular user image with initials fallback when no image is available.',
        level: 'Molecule',
        preview: (
            <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10"><AvatarFallback>JD</AvatarFallback></Avatar>
                <Avatar className="h-8 w-8"><AvatarFallback className="text-xs bg-primary text-primary-foreground">AW</AvatarFallback></Avatar>
                <Avatar className="h-6 w-6"><AvatarFallback className="text-[9px]">+3</AvatarFallback></Avatar>
            </div>
        ),
    },
    {
        name: 'Breadcrumb',
        exports: ['Breadcrumb', 'BreadcrumbList', 'BreadcrumbItem', 'BreadcrumbLink', 'BreadcrumbPage', 'BreadcrumbSeparator', 'BreadcrumbEllipsis'],
        importPath: '@/components/ui/breadcrumb',
        description: 'Hierarchical navigation trail showing the current location in the app.',
        level: 'Molecule',
        preview: (
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem><BreadcrumbLink href="#">Home</BreadcrumbLink></BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem><BreadcrumbLink href="#">Projects</BreadcrumbLink></BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem><BreadcrumbPage>Dashboard</BreadcrumbPage></BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
        ),
    },
    {
        name: 'Dialog',
        exports: ['Dialog', 'DialogTrigger', 'DialogContent', 'DialogHeader', 'DialogTitle', 'DialogDescription', 'DialogFooter', 'DialogClose'],
        importPath: '@/components/ui/dialog',
        description: 'Modal overlay with backdrop for confirmation and detail views.',
        level: 'Molecule',
        preview: <DialogPreview />,
    },
    {
        name: 'Alert Dialog',
        exports: ['AlertDialog', 'AlertDialogTrigger', 'AlertDialogContent', 'AlertDialogAction', 'AlertDialogCancel'],
        importPath: '@/components/ui/alert-dialog',
        description: 'Accessible confirmation dialog for destructive or irreversible actions.',
        level: 'Molecule',
        preview: <AlertDialogPreview />,
    },
    {
        name: 'Dropdown Menu',
        exports: ['DropdownMenu', 'DropdownMenuTrigger', 'DropdownMenuContent', 'DropdownMenuItem', 'DropdownMenuLabel', 'DropdownMenuSeparator'],
        importPath: '@/components/ui/dropdown-menu',
        description: 'Contextual menu that opens relative to a trigger element.',
        level: 'Molecule',
        preview: <DropdownMenuPreview />,
    },
    {
        name: 'Popover',
        exports: ['Popover', 'PopoverTrigger', 'PopoverContent', 'PopoverAnchor'],
        importPath: '@/components/ui/popover',
        description: 'Floating panel anchored to a trigger, used for pickers and mini-forms.',
        level: 'Molecule',
        preview: <PopoverPreview />,
    },
    {
        name: 'Tooltip',
        exports: ['Tooltip', 'TooltipTrigger', 'TooltipContent', 'TooltipProvider'],
        importPath: '@/components/ui/tooltip',
        description: 'Hover/focus label that provides additional context for UI elements.',
        level: 'Molecule',
        preview: <TooltipPreview />,
    },
    {
        name: 'Select',
        exports: ['Select', 'SelectTrigger', 'SelectValue', 'SelectContent', 'SelectItem', 'SelectLabel', 'SelectGroup', 'SelectSeparator'],
        importPath: '@/components/ui/select',
        description: 'Styleable single-value dropdown built on Radix Select. Hover dims border (primary/50); open state uses primary border + ring-2 — consistent with Input/Textarea.',
        level: 'Molecule',
        preview: <SelectPreview />,
    },
    {
        name: 'Command',
        exports: ['Command', 'CommandInput', 'CommandList', 'CommandEmpty', 'CommandGroup', 'CommandItem', 'CommandSeparator', 'CommandShortcut'],
        importPath: '@/components/ui/command',
        description: 'cmdk-powered command palette and searchable list with keyboard navigation.',
        level: 'Molecule',
        preview: <CommandPreview />,
    },
    {
        name: 'Tabs',
        exports: ['Tabs', 'TabsList', 'TabsTrigger', 'TabsContent'],
        importPath: '@/components/ui/tabs',
        description: 'Horizontal tab navigation that shows one panel at a time.',
        level: 'Molecule',
        preview: <TabsPreview />,
    },
    {
        name: 'Sheet',
        exports: ['Sheet', 'SheetTrigger', 'SheetContent', 'SheetHeader', 'SheetTitle', 'SheetDescription', 'SheetClose'],
        importPath: '@/components/ui/sheet',
        description: 'Slide-in panel from any screen edge, used for drawers and side panels.',
        level: 'Molecule',
        preview: <SheetPreview />,
    },
    {
        name: 'Scroll Area',
        exports: ['ScrollArea', 'ScrollBar'],
        importPath: '@/components/ui/scroll-area',
        description: 'Custom-styled scrollable container with visible scrollbar track.',
        level: 'Molecule',
        preview: (
            <ScrollArea className="h-28 w-full border p-3">
                {Array.from({ length: 10 }, (_, i) => (
                    <div key={i} className="py-1 text-xs text-muted-foreground border-b last:border-0">
                        List item {i + 1}
                    </div>
                ))}
            </ScrollArea>
        ),
    },
    {
        name: 'Radio Group',
        exports: ['RadioGroup', 'RadioGroupItem'],
        importPath: '@/components/ui/radio-group',
        description: 'Single-select radio group with primary focus ring (ring-2). Includes 44px touch target on mobile via before: pseudo-element, same as Checkbox.',
        level: 'Molecule',
        preview: (
            <RadioGroup defaultValue="option1" className="space-y-2">
                <div className="flex items-center gap-2"><RadioGroupItem value="option1" id="r1" /><Label htmlFor="r1">Option One</Label></div>
                <div className="flex items-center gap-2"><RadioGroupItem value="option2" id="r2" /><Label htmlFor="r2">Option Two</Label></div>
                <div className="flex items-center gap-2"><RadioGroupItem value="option3" id="r3" disabled /><Label htmlFor="r3" className="text-muted-foreground">Disabled</Label></div>
            </RadioGroup>
        ),
    },
    {
        name: 'Toggle Group',
        exports: ['ToggleGroup', 'ToggleGroupItem'],
        importPath: '@/components/ui/toggle-group',
        description: 'Group of toggle buttons with single or multi-select behavior.',
        level: 'Molecule',
        preview: (
            <div className="space-y-2">
                <ToggleGroup type="single" defaultValue="center">
                    <ToggleGroupItem value="left"><AlignLeft className="h-4 w-4" /></ToggleGroupItem>
                    <ToggleGroupItem value="center"><AlignCenter className="h-4 w-4" /></ToggleGroupItem>
                    <ToggleGroupItem value="right"><AlignRight className="h-4 w-4" /></ToggleGroupItem>
                </ToggleGroup>
                <ToggleGroup type="multiple">
                    <ToggleGroupItem value="bold"><Bold className="h-4 w-4" /></ToggleGroupItem>
                    <ToggleGroupItem value="italic"><Italic className="h-4 w-4" /></ToggleGroupItem>
                </ToggleGroup>
            </div>
        ),
    },
    {
        name: 'Calendar',
        exports: ['Calendar'],
        importPath: '@/components/ui/calendar',
        description: 'Date picker calendar with month navigation and day selection.',
        level: 'Molecule',
        preview: <CalendarPreview />,
    },
    {
        name: 'Confirmation Dialog',
        exports: ['ConfirmationDialog'],
        importPath: '@/components/ui/confirmation-dialog',
        description: 'Pre-built confirm/cancel dialog for common deletion/action patterns.',
        level: 'Molecule',
        preview: <ConfirmationDialogPreview />,
    },
    {
        name: 'Empty State',
        exports: ['EmptyState'],
        importPath: '@/components/ui/empty-state',
        description: 'Illustrated zero-data state with title, message, and optional CTA.',
        level: 'Molecule',
        preview: (
            <EmptyState
                icon={FileText}
                title="No documents yet"
                description="Upload your first document to get started."
                action={<Button size="sm"><Plus className="mr-1.5 h-3.5 w-3.5" />Add Document</Button>}
                className="py-4"
            />
        ),
    },
    // Form field molecules
    {
        name: 'Field Wrapper',
        exports: ['FieldWrapper'],
        importPath: '@/components/forms/fields/base/FieldWrapper',
        description: 'Structural wrapper that composes label + field + help + error atoms.',
        level: 'Molecule',
        group: 'Form Fields',
        preview: (
            <div className="w-full max-w-xs space-y-1">
                <Label className="text-xs">Job Title <span className="text-destructive">*</span></Label>
                <Input placeholder="Senior Engineer" />
                <p className="text-[10px] text-muted-foreground">Your role within the organization.</p>
                <div className="flex items-center gap-1 text-destructive text-[10px]">
                    <AlertTriangle className="h-3 w-3" />Field is required
                </div>
            </div>
        ),
    },
    {
        name: 'Checkbox Field',
        exports: ['CheckboxField'],
        importPath: '@/components/forms/fields/selection/CheckboxField',
        description: 'Form checkbox with label, group support, and validation.',
        level: 'Molecule',
        group: 'Form Fields',
        preview: (
            <div className="space-y-2">
                <Label className="text-xs">Select all that apply</Label>
                {['Foundation', 'Framing', 'Electrical'].map((opt, i) => (
                    <div key={opt} className="flex items-center gap-2">
                        <Checkbox id={`cf-${i}`} defaultChecked={i === 0} />
                        <Label htmlFor={`cf-${i}`} className="text-xs font-normal">{opt}</Label>
                    </div>
                ))}
            </div>
        ),
    },
    {
        name: 'Radio Field',
        exports: ['RadioField'],
        importPath: '@/components/forms/fields/selection/RadioField',
        description: 'Form radio group with label, options, and validation state.',
        level: 'Molecule',
        group: 'Form Fields',
        preview: (
            <div className="space-y-2">
                <Label className="text-xs">Priority Level</Label>
                <RadioGroup defaultValue="medium" className="space-y-1">
                    {['Low', 'Medium', 'High'].map(opt => (
                        <div key={opt} className="flex items-center gap-2">
                            <RadioGroupItem value={opt.toLowerCase()} id={`rf-${opt}`} />
                            <Label htmlFor={`rf-${opt}`} className="text-xs font-normal">{opt}</Label>
                        </div>
                    ))}
                </RadioGroup>
            </div>
        ),
    },
    {
        name: 'Select Field',
        exports: ['SelectField'],
        importPath: '@/components/forms/fields/selection/SelectField',
        description: 'Form select dropdown with label, placeholder, and validation.',
        level: 'Molecule',
        group: 'Form Fields',
        preview: (
            <div className="w-full max-w-xs space-y-1">
                <Label className="text-xs">Department</Label>
                <Select>
                    <SelectTrigger className="text-xs h-8"><SelectValue placeholder="Choose department…" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="eng">Engineering</SelectItem>
                        <SelectItem value="ops">Operations</SelectItem>
                        <SelectItem value="pm">Project Management</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        ),
    },
    {
        name: 'Date Field',
        exports: ['DateField'],
        importPath: '@/components/forms/fields/datetime/DateField',
        description: 'Form date picker field with calendar popover and validation.',
        level: 'Molecule',
        group: 'Form Fields',
        preview: (
            <div className="w-full max-w-xs space-y-1">
                <Label className="text-xs">Due Date</Label>
                <Button variant="default" size="sm" className="w-full justify-start text-xs font-normal h-8">
                    <ChevronRight className="mr-2 h-3.5 w-3.5 text-muted-foreground rotate-90" />
                    Dec 31, 2025
                </Button>
            </div>
        ),
    },
    {
        name: 'File Field',
        exports: ['FileField'],
        importPath: '@/components/forms/fields/advanced/FileField',
        description: 'Drag-and-drop file upload field with preview and size validation.',
        level: 'Molecule',
        group: 'Form Fields',
        preview: (
            <div className="w-full border-2 border-dashed border-border rounded-lg p-4 flex flex-col items-center gap-2 text-center">
                <FileText className="h-6 w-6 text-muted-foreground/40" />
                <p className="text-xs text-muted-foreground">Drop files here or <span className="text-primary">browse</span></p>
                <p className="text-[10px] text-muted-foreground/60">PDF, PNG, JPG up to 10MB</p>
            </div>
        ),
    },
    {
        name: 'Rating Field',
        exports: ['RatingField'],
        importPath: '@/components/forms/fields/advanced/RatingField',
        description: 'Star rating form field with configurable max stars.',
        level: 'Molecule',
        group: 'Form Fields',
        preview: (
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(i => (
                    <Star
                        key={i}
                        className={cn('h-6 w-6', i <= 3 ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30')}
                    />
                ))}
            </div>
        ),
    },
    {
        name: 'Stats Card',
        exports: ['StatsCard'],
        importPath: '@/components/admin/StatsCard',
        description: 'KPI metric card with icon, value, trend indicator, and label.',
        level: 'Molecule',
        group: 'Admin',
        preview: (
            <div className="w-full rounded-xl border bg-card p-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground font-medium">Total Projects</span>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full">+12%</span>
                </div>
                <div className="text-2xl font-bold">48</div>
                <div className="text-xs text-muted-foreground mt-1">Up from 43 last month</div>
            </div>
        ),
    },
    {
        name: 'Project Card',
        exports: ['ProjectCard'],
        importPath: '@/features/projects/components/project-card',
        description: 'Summary card for a project showing name, status, and metadata.',
        level: 'Molecule',
        group: 'Projects',
        preview: (
            <div className="w-full rounded-xl border bg-card p-4 space-y-2">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="font-semibold text-sm">Highway 101 Expansion</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Civil Engineering</p>
                    </div>
                    <Badge className="text-[10px]">Active</Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>12 members</span>
                    <span>47 tasks</span>
                    <span>Updated 2h ago</span>
                </div>
            </div>
        ),
    },
    {
        name: 'Task Card',
        exports: ['TaskCard'],
        importPath: '@/features/tasks/components/TaskCard',
        description: 'Kanban card showing task priority, assignees, dates, and quick status controls.',
        level: 'Molecule',
        group: 'Tasks',
        preview: (
            <div className="w-full rounded-xl border bg-card p-3 space-y-2">
                <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />High
                    </span>
                    <Badge variant="done" className="text-[10px]">RFI</Badge>
                </div>
                <p className="text-sm font-medium">Review structural drawings</p>
                <p className="text-xs text-muted-foreground line-clamp-2">Pending approval from structural engineer before proceeding.</p>
                <div className="flex items-center justify-between pt-1">
                    <div className="flex -space-x-1">
                        {['JD', 'AW'].map(init => (
                            <Avatar key={init} className="h-5 w-5 border border-background"><AvatarFallback className="text-[8px]">{init}</AvatarFallback></Avatar>
                        ))}
                    </div>
                    <span className="text-[10px] text-muted-foreground">Dec 31</span>
                </div>
            </div>
        ),
    },
    {
        name: 'Feature Card',
        exports: ['FeatureCard'],
        importPath: '@/components/landing/FeatureCard',
        description: 'Marketing landing page feature highlight card with icon and text.',
        level: 'Molecule',
        group: 'Landing',
        preview: (
            <div className="w-full rounded-xl border bg-card p-4 space-y-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Star className="h-4 w-4 text-primary" />
                </div>
                <p className="font-semibold text-sm">Real-time Collaboration</p>
                <p className="text-xs text-muted-foreground">Work together with your team in real-time across all project sheets.</p>
            </div>
        ),
    },
    {
        name: 'Color Picker',
        exports: ['ColorPicker'],
        importPath: '@/features/sheets/components/toolbar/ColorPicker',
        description: 'Swatch-based color picker popover for text and cell color selection.',
        level: 'Molecule',
        group: 'Sheets Toolbar',
        preview: (
            <div className="flex flex-wrap gap-1.5">
                {['#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#8b5cf6','#ec4899','#000000','#ffffff'].map(c => (
                    <div key={c} className="w-5 h-5 rounded cursor-pointer border border-border/50 hover:scale-110 transition-transform" style={{ backgroundColor: c }} />
                ))}
            </div>
        ),
    },
    // Navigation
    {
        name: 'Team Switcher',
        exports: ['TeamSwitcher'],
        importPath: '@/components/ui/team-switcher',
        description: 'Workspace/team selector dropdown with avatar, name, and plan badge — lives in the sidebar header.',
        level: 'Molecule',
        group: 'Navigation',
        preview: (
            <div className="flex items-center gap-2 p-2 rounded-lg border bg-card w-full max-w-xs cursor-pointer hover:bg-muted/40 transition-colors">
                <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">W</div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">Worktree Pro</p>
                    <p className="text-[10px] text-muted-foreground truncate">Enterprise</p>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            </div>
        ),
    },
    {
        name: 'Context Menu',
        exports: ['ContextMenu', 'ContextMenuTrigger', 'ContextMenuContent', 'ContextMenuItem', 'ContextMenuSeparator', 'ContextMenuLabel', 'ContextMenuCheckboxItem', 'ContextMenuRadioGroup', 'ContextMenuRadioItem', 'ContextMenuSub', 'ContextMenuSubTrigger', 'ContextMenuSubContent', 'ContextMenuShortcut'],
        importPath: '@/components/ui/context-menu',
        description: 'Right-click context menu built on Radix ContextMenu primitive with keyboard navigation.',
        level: 'Molecule',
        group: 'Navigation',
        preview: (
            <div className="w-44 rounded-md border bg-popover text-popover-foreground shadow-md p-1 text-[11px]">
                <div className="px-2 py-1 text-[10px] font-medium text-muted-foreground">Actions</div>
                {['Open', 'Rename', 'Duplicate'].map(item => (
                    <div key={item} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent cursor-default">{item}</div>
                ))}
                <div className="my-1 border-t" />
                <div className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-destructive/10 text-destructive cursor-default">Delete</div>
            </div>
        ),
    },
];

const ORGANISMS: ComponentEntry[] = [
    {
        name: 'Table',
        exports: ['Table', 'TableHeader', 'TableBody', 'TableRow', 'TableHead', 'TableCell', 'TableFooter', 'TableCaption'],
        importPath: '@/components/ui/table',
        description: 'Shared table primitives used by all tables (DataTable, TaskTable, AuditLogTable). Applies consistent light/dark mode colors via design tokens.',
        level: 'Organism',
        preview: <TablePreview />,
    },
    {
        name: 'Page Header',
        exports: ['PageHeader'],
        importPath: '@/components/ui/page-header',
        description: 'Top-of-page title bar with breadcrumbs, actions, and description.',
        level: 'Organism',
        preview: (
            <div className="w-full">
                <PageHeader title="Project Dashboard" description="Track your team's progress and metrics.">
                    <Button size="sm"><Plus className="mr-1.5 h-3.5 w-3.5" />New Project</Button>
                </PageHeader>
            </div>
        ),
    },
    {
        name: 'Form',
        exports: ['Form', 'FormField', 'FormItem', 'FormLabel', 'FormControl', 'FormDescription', 'FormMessage'],
        importPath: '@/components/ui/form',
        description: 'react-hook-form integrated form wrapper with error state management.',
        level: 'Organism',
        preview: (
            <div className="w-full max-w-xs space-y-3">
                <div className="space-y-1">
                    <Label className="text-xs">Email</Label>
                    <Input placeholder="you@example.com" />
                    <p className="text-[10px] text-muted-foreground">We'll never share your email.</p>
                </div>
                <div className="space-y-1">
                    <Label className="text-xs">Password</Label>
                    <Input type="password" placeholder="••••••••" />
                    <p className="text-[10px] text-destructive">Password is required.</p>
                </div>
                <Button size="sm" className="w-full">Submit</Button>
            </div>
        ),
    },
    // Admin
    {
        name: 'Overview Chart',
        exports: ['OverviewChart'],
        importPath: '@/components/admin/OverviewChart',
        description: 'Line/bar chart showing app-wide usage and activity overview.',
        level: 'Organism',
        group: 'Admin',
        preview: (
            <div className="w-full h-24 rounded-lg border bg-muted/30 flex items-end gap-1 px-3 pb-3">
                {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                    <div key={i} className="flex-1 rounded-t bg-primary/40 hover:bg-primary/60 transition-colors" style={{ height: `${h}%` }} />
                ))}
            </div>
        ),
    },
    {
        name: 'Session Chart',
        exports: ['SessionChart'],
        importPath: '@/components/admin/SessionChart',
        description: 'Time-series chart of active user sessions over a selected period.',
        level: 'Organism',
        group: 'Admin',
        preview: (
            <div className="w-full h-20 rounded-lg border bg-muted/30 flex items-end gap-0.5 px-3 pb-3">
                {[30,50,35,60,45,75,55,80,65,90,70,85].map((h, i) => (
                    <div key={i} className="flex-1 rounded-t bg-blue-500/40 hover:bg-blue-500/60 transition-colors" style={{ height: `${h}%` }} />
                ))}
            </div>
        ),
    },
    {
        name: 'User Distribution Chart',
        exports: ['UserDistributionChart'],
        importPath: '@/components/admin/UserDistributionChart',
        description: 'Donut/pie chart showing breakdown of users by role.',
        level: 'Organism',
        group: 'Admin',
        preview: (
            <div className="flex items-center gap-4">
                <div className="relative h-16 w-16 flex-shrink-0">
                    <svg viewBox="0 0 36 36" className="h-16 w-16 -rotate-90">
                        <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor" strokeWidth="4" className="text-muted/30" />
                        <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray="55 45" className="text-primary" />
                        <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray="30 70" strokeDashoffset="-55" className="text-blue-400" />
                    </svg>
                </div>
                <div className="space-y-1 text-[10px]">
                    <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" />Admin (55%)</div>
                    <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-400" />Member (30%)</div>
                    <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-muted-foreground/30" />Viewer (15%)</div>
                </div>
            </div>
        ),
    },
    // Dashboard
    {
        name: 'Activity Feed',
        exports: ['ActivityFeed'],
        importPath: '@/components/dashboard/ActivityFeed',
        description: 'Chronological list of recent project events and user actions.',
        level: 'Organism',
        group: 'Dashboard',
        preview: (
            <div className="w-full space-y-2">
                {[
                    { user: 'JD', action: 'created sheet "Budget Q4"', time: '2m ago', color: 'bg-blue-500' },
                    { user: 'AW', action: 'uploaded blueprint', time: '15m ago', color: 'bg-purple-500' },
                    { user: 'MK', action: 'completed task #42', time: '1h ago', color: 'bg-emerald-500' },
                ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                        <Avatar className="h-5 w-5 mt-0.5 flex-shrink-0"><AvatarFallback className={cn('text-[8px] text-white', item.color)}>{item.user}</AvatarFallback></Avatar>
                        <div className="flex-1 min-w-0">
                            <span className="font-medium">{item.user}</span>
                            <span className="text-muted-foreground"> {item.action}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground flex-shrink-0">{item.time}</span>
                    </div>
                ))}
            </div>
        ),
    },
    {
        name: 'Metrics Grid',
        exports: ['MetricsGrid'],
        importPath: '@/components/dashboard/MetricsGrid',
        description: 'Responsive grid of KPI stat cards for the project dashboard.',
        level: 'Organism',
        group: 'Dashboard',
        preview: (
            <div className="grid grid-cols-3 gap-2 w-full">
                {[
                    { label: 'Sheets', value: '24', delta: '+3' },
                    { label: 'Tasks', value: '128', delta: '+12' },
                    { label: 'Members', value: '8', delta: '+1' },
                ].map(m => (
                    <div key={m.label} className="rounded-lg border bg-card p-2 text-center">
                        <p className="text-base font-bold">{m.value}</p>
                        <p className="text-[10px] text-muted-foreground">{m.label}</p>
                        <p className="text-[10px] text-emerald-500">{m.delta}</p>
                    </div>
                ))}
            </div>
        ),
    },
    // Tasks
    {
        name: 'Kanban Board',
        exports: ['KanbanBoard'],
        importPath: '@/features/tasks/components/KanbanBoard',
        description: 'Dynamic kanban board grouped by task type with drill-down support.',
        level: 'Organism',
        group: 'Tasks',
        preview: (
            <div className="flex gap-2 w-full overflow-hidden">
                {[
                    { type: 'RFI', count: 3, color: 'bg-blue-500/10 text-blue-600' },
                    { type: 'General', count: 5, color: 'bg-gray-500/10 text-gray-600' },
                    { type: 'Punch List', count: 2, color: 'bg-orange-500/10 text-orange-600' },
                ].map(col => (
                    <div key={col.type} className="flex-1 min-w-0">
                        <div className={cn('flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-semibold', col.color)}>
                            <span className="truncate">{col.type}</span>
                            <span className="ml-1 bg-background border rounded-full px-1.5 text-[10px]">{col.count}</span>
                        </div>
                        <div className="mt-1 space-y-1">
                            {Array.from({ length: Math.min(col.count, 2) }, (_, i) => (
                                <div key={i} className="h-8 rounded-lg border bg-card" />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        ),
    },
    {
        name: 'Task Table',
        exports: ['TaskTable'],
        importPath: '@/features/tasks/components/TaskTable',
        description: 'Sortable table view of all tasks with inline status management.',
        level: 'Organism',
        group: 'Tasks',
        preview: (
            <div className="w-full rounded-md border overflow-hidden text-xs">
                <table className="w-full">
                    <thead className="bg-muted/50"><tr>
                        <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">#</th>
                        <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">Title</th>
                        <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">Type</th>
                        <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">Status</th>
                    </tr></thead>
                    <tbody>
                        {[
                            { num: 1, title: 'Review drawings', type: 'RFI', status: 'Active', statusColor: 'bg-blue-100 text-blue-700' },
                            { num: 2, title: 'Fix roof leak', type: 'Punch List', status: 'In Progress', statusColor: 'bg-yellow-100 text-yellow-700' },
                        ].map(r => (
                            <tr key={r.num} className="border-t hover:bg-muted/30">
                                <td className="px-2 py-1.5 text-muted-foreground">{r.num}</td>
                                <td className="px-2 py-1.5 font-medium">{r.title}</td>
                                <td className="px-2 py-1.5 text-muted-foreground">{r.type}</td>
                                <td className="px-2 py-1.5"><span className={cn('px-1.5 py-0.5 rounded text-[10px] font-medium', r.statusColor)}>{r.status}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        ),
    },
    // Sheets
    {
        name: 'Formula Bar',
        exports: ['FormulaBar'],
        importPath: '@/features/sheets/components/toolbar/FormulaBar',
        description: 'Excel-style formula input bar with autocomplete and signature tooltips.',
        level: 'Organism',
        group: 'Sheets',
        preview: (
            <div className="w-full flex items-center gap-2 border rounded-lg px-3 py-1.5 bg-background">
                <span className="text-xs font-mono text-muted-foreground border-r pr-2 shrink-0">fx</span>
                <span className="text-xs font-mono text-foreground flex-1">=SUM(A1:A10)</span>
                <Badge variant="done" className="text-[10px] shrink-0">A1</Badge>
            </div>
        ),
    },
    {
        name: 'Sheet List',
        exports: ['SheetList'],
        importPath: '@/features/sheets/components/SheetList',
        description: 'List of sheets in the current project with create and manage actions.',
        level: 'Organism',
        group: 'Sheets',
        preview: (
            <div className="w-full space-y-1.5">
                {['Budget Tracker', 'Schedule', 'Materials Log'].map((sheet, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg border bg-card hover:bg-muted/30 cursor-pointer">
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-primary" />
                            <span className="text-xs font-medium">{sheet}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground">{12 - i * 3} cols</span>
                    </div>
                ))}
            </div>
        ),
    },
    // Auth
    {
        name: 'Login Form',
        exports: ['LoginForm'],
        importPath: '@/features/users/components/login-form',
        description: 'Email + password login form with OAuth provider buttons.',
        level: 'Organism',
        group: 'Auth',
        preview: (
            <div className="w-full max-w-xs space-y-3">
                <div className="space-y-1">
                    <Label className="text-xs">Email</Label>
                    <Input placeholder="admin@worktree.pro" />
                </div>
                <div className="space-y-1">
                    <Label className="text-xs">Password</Label>
                    <Input type="password" placeholder="••••••••" />
                </div>
                <Button className="w-full" size="sm">Sign in</Button>
                <div className="relative"><Separator /><span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-[10px] text-muted-foreground">or</span></div>
                <Button variant="neutral" className="w-full" size="sm">Continue with Google</Button>
            </div>
        ),
    },
    // Projects
    {
        name: 'Project List',
        exports: ['ProjectList'],
        importPath: '@/features/projects/components/project-list',
        description: 'Filterable grid of project cards with search and sort controls.',
        level: 'Organism',
        group: 'Projects',
        preview: (
            <div className="w-full space-y-2">
                <div className="flex gap-2">
                    <Input placeholder="Search projects…" className="h-7 text-xs" />
                    <Button size="sm" className="h-7 text-xs px-2">Filter</Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    {['Highway Ext.', 'Bridge Repair'].map((p, i) => (
                        <div key={i} className="rounded-lg border bg-card p-2">
                            <p className="text-xs font-semibold truncate">{p}</p>
                            <Badge className="mt-1 text-[10px]">Active</Badge>
                        </div>
                    ))}
                </div>
            </div>
        ),
    },
    {
        name: 'Project Tabs',
        exports: ['ProjectTabs'],
        importPath: '@/features/projects/components/project-tabs',
        description: 'Tab navigation bar for switching between project sub-sections.',
        level: 'Organism',
        group: 'Projects',
        preview: (
            <div className="w-full border-b flex gap-0">
                {['Overview', 'Sheets', 'Tasks', 'Routes'].map((tab, i) => (
                    <button key={tab} className={cn('px-3 py-2 text-xs font-medium border-b-2 transition-colors', i === 1 ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground')}>
                        {tab}
                    </button>
                ))}
            </div>
        ),
    },
    // Form Builder
    {
        name: 'Form Builder Layout', exports: ['FormBuilderLayout'], importPath: '@/features/forms/components/builder/FormBuilderLayout',
        description: 'Three-panel layout: field palette, canvas, and properties panel.', level: 'Organism', group: 'Form Builder',
        preview: (
            <div className="w-full h-28 rounded-lg border overflow-hidden flex text-[10px]">
                <div className="w-16 border-r bg-muted/30 flex flex-col gap-1 p-1.5">
                    <div className="font-semibold text-muted-foreground px-1">Fields</div>
                    {['Text', 'Email', 'Select', 'Date'].map(f => (
                        <div key={f} className="h-5 rounded border bg-card px-1.5 flex items-center text-muted-foreground cursor-grab">{f}</div>
                    ))}
                </div>
                <div className="flex-1 bg-background p-2 space-y-1">
                    <div className="h-5 rounded border-2 border-dashed border-primary/30 flex items-center px-2 text-muted-foreground">Name field</div>
                    <div className="h-5 rounded border-2 border-dashed border-primary/30 flex items-center px-2 text-muted-foreground">Email field</div>
                    <div className="h-5 rounded border border-dashed border-muted-foreground/20 flex items-center px-2 text-muted-foreground/40">Drop here…</div>
                </div>
                <div className="w-20 border-l bg-muted/20 p-1.5 space-y-1">
                    <div className="text-[9px] font-semibold text-muted-foreground">PROPERTIES</div>
                    {['Label', 'Required', 'Placeholder'].map(p => (
                        <div key={p} className="h-3.5 rounded bg-muted/50 px-1 text-muted-foreground">{p}</div>
                    ))}
                </div>
            </div>
        ),
    },
    {
        name: 'Form Canvas', exports: ['FormCanvas'], importPath: '@/features/forms/components/builder/canvas/FormCanvas',
        description: 'Main drag-and-drop canvas where fields are arranged.', level: 'Organism', group: 'Form Builder',
        preview: (
            <div className="w-full rounded-lg border bg-background p-3 space-y-2 text-[10px]">
                <div className="h-5 rounded border-2 border-dashed border-primary/20 bg-primary/5 flex items-center px-2 text-muted-foreground cursor-grab">⋮⋮  Text — "What is your name?"</div>
                <div className="h-5 rounded border-2 border-dashed border-primary/20 bg-primary/5 flex items-center px-2 text-muted-foreground cursor-grab">⋮⋮  Email — "Email address"</div>
                <div className="h-5 rounded border border-dashed border-muted-foreground/20 flex items-center justify-center text-muted-foreground/40">+ Drop field here</div>
            </div>
        ),
    },
    {
        name: 'Properties Panel', exports: ['PropertiesPanel'], importPath: '@/features/forms/components/builder/properties/PropertiesPanel',
        description: 'Right-side panel showing configurable properties for the selected field.', level: 'Organism', group: 'Form Builder',
        preview: (
            <div className="w-full max-w-[180px] rounded-lg border bg-card p-2 space-y-2 text-[10px]">
                <div className="font-semibold text-xs">Text Field</div>
                {[['Label','First Name'],['Placeholder','Enter name…'],['Required','✓']].map(([k,v]) => (
                    <div key={k} className="flex justify-between items-center">
                        <span className="text-muted-foreground">{k}</span>
                        <span className="font-medium">{v}</span>
                    </div>
                ))}
                <div className="pt-1 border-t flex items-center justify-between">
                    <span className="text-muted-foreground">Validation</span>
                    <Badge variant="done" className="text-[9px]">Min 2 chars</Badge>
                </div>
            </div>
        ),
    },
    {
        name: 'Question Palette', exports: ['QuestionPalette'], importPath: '@/features/forms/components/builder/palette/QuestionPalette',
        description: 'Left-side field type picker with search and drag-to-canvas support.', level: 'Organism', group: 'Form Builder',
        preview: (
            <div className="w-full max-w-[180px] rounded-lg border bg-card p-2 space-y-1.5">
                <Input placeholder="Search fields…" className="h-6 text-[10px]" />
                <div className="space-y-0.5 text-[10px]">
                    {[['T','Text','bg-blue-500'],['@','Email','bg-green-500'],['#','Number','bg-purple-500'],['□','Select','bg-orange-500'],['✓','Checkbox','bg-pink-500']].map(([icon,label,color]) => (
                        <div key={label} className="flex items-center gap-2 px-1.5 py-1 rounded hover:bg-muted cursor-grab">
                            <span className={`h-4 w-4 rounded text-white text-[9px] flex items-center justify-center font-bold ${color}`}>{icon}</span>
                            <span>{label}</span>
                        </div>
                    ))}
                </div>
            </div>
        ),
    },
    {
        name: 'Builder Toolbar', exports: ['BuilderToolbar'], importPath: '@/features/forms/components/builder/toolbar/BuilderToolbar',
        description: 'Top toolbar with form metadata, save, preview, and settings actions.', level: 'Organism', group: 'Form Builder',
        preview: (
            <div className="w-full flex items-center gap-2 border rounded-lg px-3 py-1.5 bg-background">
                <span className="font-semibold text-xs truncate flex-1">Site Safety Inspection</span>
                <Button size="sm" variant="neutral" className="h-6 text-[10px] px-2">Preview</Button>
                <Button size="sm" variant="neutral" className="h-6 text-[10px] px-2">Settings</Button>
                <Button size="sm" className="h-6 text-[10px] px-2"><Check className="mr-1 h-3 w-3" />Save</Button>
            </div>
        ),
    },
    // Form Renderer
    {
        name: 'Form Renderer', exports: ['FormRenderer'], importPath: '@/components/form-renderer/FormRenderer',
        description: 'Renders a complete form definition with all fields and validation.', level: 'Organism', group: 'Form Renderer',
        preview: (
            <div className="w-full max-w-xs space-y-3 p-3 rounded-lg border bg-card">
                <div>
                    <h4 className="font-semibold text-sm">Site Safety Inspection</h4>
                    <p className="text-[10px] text-muted-foreground">Complete all required fields.</p>
                </div>
                <div className="space-y-1">
                    <Label className="text-xs">Inspector Name <span className="text-destructive">*</span></Label>
                    <Input placeholder="Full name" className="h-7 text-xs" />
                </div>
                <div className="space-y-1">
                    <Label className="text-xs">Date of Inspection</Label>
                    <Input placeholder="MM/DD/YYYY" className="h-7 text-xs" />
                </div>
                <Button size="sm" className="w-full">Submit</Button>
            </div>
        ),
    },
    // Blueprints
    {
        name: 'Blueprint Viewer', exports: ['BlueprintViewer'], importPath: '@/features/blueprints/components/BlueprintViewer',
        description: 'Interactive PDF viewer for project blueprints with pan and zoom.', level: 'Organism', group: 'Blueprints',
        preview: (
            <div className="w-full h-24 rounded-lg border bg-muted/20 relative overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 opacity-15">
                    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                        <defs><pattern id="bpgrid" width="12" height="12" patternUnits="userSpaceOnUse"><path d="M 12 0 L 0 0 0 12" fill="none" stroke="currentColor" strokeWidth="0.5"/></pattern></defs>
                        <rect width="100%" height="100%" fill="url(#bpgrid)"/>
                    </svg>
                </div>
                <div className="relative z-10 border-2 border-blue-400/60 w-28 h-16 flex items-center justify-center text-[9px] text-blue-400 font-mono">
                    <div className="absolute top-1 left-1 w-8 h-5 border border-blue-400/40" />
                    <div className="absolute bottom-1 right-1 w-12 h-6 border border-blue-400/40" />
                    FLOOR PLAN
                </div>
                <div className="absolute bottom-1 right-2 text-[9px] text-muted-foreground">Zoom: 100%</div>
            </div>
        ),
    },
    {
        name: 'Blueprint List', exports: ['BlueprintList'], importPath: '@/features/blueprints/components/BlueprintList',
        description: 'Grid list of uploaded project blueprints with thumbnail previews.', level: 'Organism', group: 'Blueprints',
        preview: (
            <div className="w-full grid grid-cols-3 gap-2">
                {['Floor Plan','Elevation','Site Map'].map(name => (
                    <div key={name} className="rounded-lg border bg-muted/20 aspect-square flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-primary/50 transition-colors">
                        <FileText className="h-4 w-4 text-muted-foreground/40" />
                        <span className="text-[9px] text-muted-foreground text-center truncate w-full px-1">{name}</span>
                    </div>
                ))}
            </div>
        ),
    },
    // Maps
    {
        name: 'Map Visualizer', exports: ['MapVisualizer'], importPath: '@/features/maps/components/map-visualizer',
        description: 'Interactive project site map with marker overlays and route plotting.', level: 'Organism', group: 'Maps',
        preview: (
            <div className="w-full h-24 rounded-lg border bg-muted/20 relative overflow-hidden">
                <div className="absolute inset-0 opacity-15">
                    <svg width="100%" height="100%">
                        <defs><pattern id="mapgrid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5"/></pattern></defs>
                        <rect width="100%" height="100%" fill="url(#mapgrid)" />
                    </svg>
                </div>
                <div className="absolute left-8 top-6 h-3 w-3 rounded-full bg-red-500 border-2 border-background shadow-md" />
                <div className="absolute left-20 top-12 h-3 w-3 rounded-full bg-blue-500 border-2 border-background shadow-md" />
                <div className="absolute left-32 top-4 h-3 w-3 rounded-full bg-emerald-500 border-2 border-background shadow-md" />
                <div className="absolute bottom-1.5 right-2 flex gap-1 text-[9px] text-muted-foreground items-center">
                    <span className="h-2 w-2 rounded-full bg-red-500" />Site A
                    <span className="h-2 w-2 rounded-full bg-blue-500 ml-1" />Site B
                </div>
            </div>
        ),
    },
    // Sheets
    {
        name: 'Live Table', exports: ['LiveTable'], importPath: '@/features/sheets/components/LiveTable',
        description: 'Real-time collaborative data grid backed by WebSocket updates.', level: 'Organism', group: 'Sheets',
        preview: (
            <div className="w-full rounded border overflow-hidden text-[10px] font-mono">
                <div className="flex bg-muted/50 border-b text-muted-foreground">
                    <div className="w-5 border-r px-1 py-1 text-center bg-muted/30">&nbsp;</div>
                    {['A','B','C','D'].map(c => <div key={c} className="flex-1 border-r last:border-0 px-1 py-1 text-center">{c}</div>)}
                </div>
                {[['1','Project','Status','Budget','PM'],['2','Highway','Active','$2.4M','Alice'],['3','Bridge','Review','$0.9M','Bob']].map(([row,...cells]) => (
                    <div key={row} className="flex border-b last:border-0 hover:bg-primary/5">
                        <div className="w-5 border-r px-1 py-1 text-center text-muted-foreground bg-muted/30">{row}</div>
                        {cells.map((cell,i) => <div key={i} className="flex-1 border-r last:border-0 px-1.5 py-1 truncate">{cell}</div>)}
                    </div>
                ))}
            </div>
        ),
    },
    // Schedule
    {
        name: 'Schedule View', exports: ['ScheduleView'], importPath: '@/features/schedule/components/ScheduleView',
        description: 'Gantt-style project schedule with task bars and milestone markers.', level: 'Organism', group: 'Schedule',
        preview: (
            <div className="w-full space-y-1.5 text-[10px]">
                <div className="flex items-center gap-2 text-muted-foreground pb-1">
                    <span className="w-14" />
                    {['Jan','Feb','Mar','Apr'].map(m => <div key={m} className="flex-1 text-center">{m}</div>)}
                </div>
                {[
                    { task:'Foundation', start:0, width:2, color:'bg-blue-500/60' },
                    { task:'Framing', start:1.5, width:2.5, color:'bg-emerald-500/60' },
                    { task:'Electrical', start:3, width:1, color:'bg-orange-500/60' },
                ].map(t => (
                    <div key={t.task} className="flex items-center gap-2">
                        <span className="w-14 truncate text-muted-foreground text-right">{t.task}</span>
                        <div className="flex-1 relative h-4 bg-muted/30 rounded">
                            <div className={`absolute h-full rounded ${t.color}`} style={{ left:`${(t.start/4)*100}%`, width:`${(t.width/4)*100}%` }} />
                        </div>
                    </div>
                ))}
            </div>
        ),
    },
    // Calendar
    {
        name: 'Calendar Main', exports: ['CalendarMain'], importPath: '@/features/calendar/components/calendar-main',
        description: 'Main calendar view container with view switching and event management.', level: 'Organism', group: 'Calendar',
        preview: (
            <div className="w-full rounded-lg border bg-card overflow-hidden text-[10px]">
                <div className="flex items-center justify-between px-3 py-1.5 border-b bg-muted/30">
                    <span className="font-semibold text-xs">February 2026</span>
                    <div className="flex gap-1">
                        <Button variant="neutral" size="sm" className="h-5 w-5 p-0 text-[10px]">‹</Button>
                        <Button variant="neutral" size="sm" className="h-5 w-5 p-0 text-[10px]">›</Button>
                    </div>
                </div>
                <div className="grid grid-cols-7 border-b text-center text-muted-foreground py-0.5">
                    {['S','M','T','W','T','F','S'].map((d,i) => <div key={i} className="py-0.5">{d}</div>)}
                </div>
                <div className="grid grid-cols-7 text-center">
                    {Array.from({length:28},(_,i)=>i+1).map(d=>(
                        <div key={d} className={cn('py-1 text-[9px] cursor-pointer hover:bg-muted/40 relative', d===24 ? 'font-bold text-primary' : 'text-foreground')}>
                            {d}
                            {[3,10,17].includes(d) && <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-0.5 w-0.5 rounded-full bg-primary" />}
                        </div>
                    ))}
                </div>
            </div>
        ),
    },
    // Projects
    {
        name: 'Audit Log Table', exports: ['AuditLogTable'], importPath: '@/features/projects/components/audit-log-table',
        description: 'Paginated table of all audit events within a project.', level: 'Organism', group: 'Projects',
        preview: (
            <div className="w-full rounded-md border overflow-hidden text-[10px]">
                <table className="w-full">
                    <thead className="bg-muted/50 text-muted-foreground"><tr>
                        <th className="px-2 py-1.5 text-left font-medium">Time</th>
                        <th className="px-2 py-1.5 text-left font-medium">User</th>
                        <th className="px-2 py-1.5 text-left font-medium">Action</th>
                    </tr></thead>
                    <tbody>
                        {[
                            {time:'2:43pm',user:'Alice',action:'Updated task #12'},
                            {time:'1:15pm',user:'Bob',action:'Created sheet'},
                            {time:'11:02am',user:'Alice',action:'Uploaded blueprint'},
                        ].map((row,i)=>(
                            <tr key={i} className="border-t hover:bg-muted/20">
                                <td className="px-2 py-1.5 text-muted-foreground">{row.time}</td>
                                <td className="px-2 py-1.5 font-medium">{row.user}</td>
                                <td className="px-2 py-1.5 text-muted-foreground">{row.action}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        ),
    },
    {
        name: 'Create Project Dialog', exports: ['CreateProjectDialog'], importPath: '@/features/projects/components/create-project-dialog',
        description: 'Modal dialog for creating a new project with name and settings.', level: 'Organism', group: 'Projects',
        preview: (
            <div className="w-full max-w-xs rounded-xl border bg-card shadow-lg p-4 space-y-3">
                <div>
                    <h4 className="font-semibold text-sm">Create New Project</h4>
                    <p className="text-[10px] text-muted-foreground">Set up a new project workspace.</p>
                </div>
                <div className="space-y-1">
                    <Label className="text-xs">Project Name <span className="text-destructive">*</span></Label>
                    <Input placeholder="e.g. Highway 101 Expansion" className="h-7 text-xs" />
                </div>
                <div className="space-y-1">
                    <Label className="text-xs">Description</Label>
                    <Textarea placeholder="Brief description…" className="min-h-[40px] text-xs resize-none" />
                </div>
                <div className="flex gap-2 justify-end">
                    <Button variant="neutral" size="sm">Cancel</Button>
                    <Button size="sm">Create</Button>
                </div>
            </div>
        ),
    },
    // AI
    {
        name: 'AI Assistant', exports: ['AiAssistant'], importPath: '@/components/ai/AiAssistant',
        description: 'Full AI chat interface with history, streaming, and tool invocations.', level: 'Organism', group: 'AI Assistant',
        preview: (
            <div className="w-full rounded-xl border bg-card overflow-hidden flex flex-col h-28">
                <div className="px-3 py-1.5 border-b bg-muted/30 flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                        <span className="text-[8px] text-primary-foreground font-bold">AI</span>
                    </div>
                    <span className="text-xs font-semibold flex-1">AI Assistant</span>
                    <Badge variant="done" className="text-[9px]">GPT-4o</Badge>
                </div>
                <div className="flex-1 px-3 py-2 space-y-2 overflow-hidden text-[10px]">
                    <div className="flex items-start gap-2">
                        <div className="h-4 w-4 rounded-full bg-primary/20 shrink-0" />
                        <p className="text-muted-foreground">How many open RFIs are in Highway 101?</p>
                    </div>
                    <div className="flex items-start gap-2">
                        <div className="h-4 w-4 rounded-full bg-muted shrink-0" />
                        <p>There are <strong>7 open RFIs</strong>. Oldest from Dec 3.</p>
                    </div>
                </div>
            </div>
        ),
    },
    // Specs
    {
        name: 'Spec List', exports: ['SpecList'], importPath: '@/features/specs/components/SpecList',
        description: 'Searchable list of project specifications with section navigation.', level: 'Organism', group: 'Specs',
        preview: (
            <div className="w-full space-y-1.5 text-[10px]">
                <Input placeholder="Search specifications…" className="h-6 text-[10px] mb-2" />
                {[
                    {code:'03 30 00',title:'Cast-in-Place Concrete'},
                    {code:'05 12 00',title:'Structural Steel Framing'},
                    {code:'07 21 00',title:'Thermal Insulation'},
                ].map(spec=>(
                    <div key={spec.code} className="flex items-center gap-2 px-2 py-1.5 rounded-lg border hover:bg-muted/30 cursor-pointer">
                        <Badge variant="done" className="text-[9px] shrink-0">{spec.code}</Badge>
                        <span className="text-xs truncate">{spec.title}</span>
                    </div>
                ))}
            </div>
        ),
    },
    // Templates
    {
        name: 'Template List', exports: ['TemplateList'], importPath: '@/features/templates/components/TemplateList',
        description: 'Grid of reusable form templates with preview and use actions.', level: 'Organism', group: 'Templates',
        preview: (
            <div className="grid grid-cols-3 gap-2 w-full">
                {[['Safety Check',5],['Daily Log',8],['RFI Form',3]].map(([name,count])=>(
                    <div key={name} className="rounded-lg border bg-card p-2 space-y-1 hover:border-primary/50 cursor-pointer transition-colors">
                        <div className="h-8 rounded bg-muted/40 flex items-center justify-center">
                            <FileText className="h-3.5 w-3.5 text-muted-foreground/40" />
                        </div>
                        <p className="text-[9px] font-medium truncate">{name}</p>
                        <p className="text-[9px] text-muted-foreground">{count} fields</p>
                    </div>
                ))}
            </div>
        ),
    },
    // File Browser
    {
        name: 'File Browser', exports: ['FileBrowser'], importPath: '@/components/file-browser/FileBrowser',
        description: 'Full file manager with folder navigation, upload, and preview.', level: 'Organism', group: 'File Browser',
        preview: (
            <div className="w-full rounded-lg border bg-card overflow-hidden text-[10px]">
                <div className="flex items-center gap-1 px-2 py-1.5 border-b bg-muted/30">
                    <span className="text-muted-foreground">Projects /</span>
                    <span className="font-medium">Highway 101 /</span>
                    <span className="text-primary">Docs</span>
                </div>
                <div className="p-1 space-y-0.5">
                    {[
                        {icon:'📁',name:'Blueprints',bold:true},
                        {icon:'📁',name:'Specifications',bold:true},
                        {icon:'📄',name:'RFI-001.pdf',bold:false},
                        {icon:'🖼',name:'site-photo.jpg',bold:false},
                    ].map(item=>(
                        <div key={item.name} className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-muted/40 cursor-pointer">
                            <span>{item.icon}</span>
                            <span className={item.bold ? 'font-medium' : 'text-muted-foreground'}>{item.name}</span>
                        </div>
                    ))}
                </div>
            </div>
        ),
    },
    // Utilities
    {
        name: 'Error Boundary', exports: ['ErrorBoundary'], importPath: '@/components/ui/error-boundary',
        description: 'React error boundary with fallback UI for caught rendering errors.', level: 'Organism',
        preview: (
            <div className="w-full rounded-lg border border-destructive/20 bg-destructive/5 p-3 space-y-2 text-center">
                <AlertTriangle className="h-6 w-6 text-destructive mx-auto" />
                <div>
                    <p className="text-xs font-semibold text-destructive">Something went wrong</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">An unexpected error occurred while rendering.</p>
                </div>
                <Button size="sm" className="text-xs h-6">Try again</Button>
            </div>
        ),
    },
    {
        name: 'Command Palette', exports: ['CommandPalette'], importPath: '@/components/command-palette',
        description: 'Global Cmd+K / Ctrl+K search and command launcher overlay.', level: 'Organism',
        preview: (
            <div className="w-full rounded-xl border shadow-xl bg-card overflow-hidden">
                <div className="flex items-center gap-2 px-3 border-b py-2">
                    <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-xs text-muted-foreground flex-1">Search commands…</span>
                    <kbd className="text-[9px] border rounded px-1 text-muted-foreground">ESC</kbd>
                </div>
                <div className="p-1 text-[10px]">
                    <div className="px-2 py-1 text-muted-foreground font-medium">Recent</div>
                    {['Go to Dashboard','Create new task','Open Settings'].map((cmd,i)=>(
                        <div key={cmd} className={cn('flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer', i===0 ? 'bg-primary/10 text-foreground' : 'hover:bg-muted/40 text-muted-foreground')}>
                            <span className="h-4 w-4 rounded bg-muted flex items-center justify-center text-[8px]">⌘</span>
                            {cmd}
                        </div>
                    ))}
                </div>
            </div>
        ),
    },
    {
        name: 'Media Lightbox', exports: ['MediaLightbox'], importPath: '@/components/ui/media-lightbox',
        description: 'Full-screen media viewer with keyboard navigation and zoom.', level: 'Organism',
        preview: (
            <div className="w-full h-24 rounded-lg border bg-black/80 relative overflow-hidden flex items-center justify-center">
                <div className="h-14 w-20 rounded border border-white/20 bg-muted/30 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-white/30" />
                </div>
                <button className="absolute left-2 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-white/10 border border-white/20 text-white text-xs flex items-center justify-center">‹</button>
                <button className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-white/10 border border-white/20 text-white text-xs flex items-center justify-center">›</button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                    {[0,1,2].map(i=><div key={i} className={`h-1 w-1 rounded-full ${i===0?'bg-white':'bg-white/30'}`}/>)}
                </div>
            </div>
        ),
    },
    // UI Primitives (newly registered)
    {
        name: 'Sidebar',
        exports: ['AppSidebar'],
        importPath: '@/components/ui/sidebar',
        description: 'Full application sidebar with nav links, project switcher, user profile, and collapsible groups.',
        level: 'Organism',
        group: 'Navigation',
        preview: (
            <div className="w-40 h-28 rounded-lg border bg-card flex flex-col overflow-hidden text-[10px]">
                <div className="px-2 py-1.5 border-b bg-muted/30 flex items-center gap-1.5">
                    <div className="h-4 w-4 rounded bg-primary/20" />
                    <span className="font-semibold text-xs">Worktree</span>
                </div>
                <div className="flex-1 p-1 space-y-0.5">
                    {['Dashboard', 'Projects', 'Tasks', 'Settings'].map((item, i) => (
                        <div key={item} className={cn('flex items-center gap-1.5 px-2 py-1 rounded', i === 0 ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted/40')}>
                            <span className="h-2.5 w-2.5 rounded-sm bg-current opacity-50 shrink-0" />
                            {item}
                        </div>
                    ))}
                </div>
            </div>
        ),
    },
    {
        name: 'Data Table',
        exports: ['DataTable'],
        importPath: '@/components/ui/data-table',
        description: 'TanStack Table powered data grid with sorting, filtering, pagination, and column visibility controls.',
        level: 'Organism',
        group: 'Data',
        preview: (
            <div className="w-full rounded-md border overflow-hidden text-[10px]">
                <div className="flex items-center gap-1 px-2 py-1.5 border-b bg-muted/30">
                    <div className="flex-1 h-4 rounded bg-muted/50 max-w-[120px]" />
                    <div className="h-4 w-12 rounded bg-muted/50" />
                </div>
                <table className="w-full">
                    <thead className="bg-muted/40 text-muted-foreground"><tr>
                        {['Name','Status','Date'].map(h => <th key={h} className="px-2 py-1 text-left font-medium">{h}</th>)}
                    </tr></thead>
                    <tbody>
                        {[['Alice','Active','Jan 5'],['Bob','Pending','Jan 8']].map(([n,s,d]) => (
                            <tr key={n} className="border-t hover:bg-muted/20">
                                <td className="px-2 py-1 font-medium">{n}</td>
                                <td className="px-2 py-1"><span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 px-1.5 rounded text-[9px]">{s}</span></td>
                                <td className="px-2 py-1 text-muted-foreground">{d}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="flex items-center justify-between px-2 py-1 border-t text-[9px] text-muted-foreground">
                    <span>2 of 48 rows</span>
                    <div className="flex gap-1">
                        <button className="h-4 w-4 rounded border flex items-center justify-center">‹</button>
                        <button className="h-4 w-4 rounded border flex items-center justify-center">›</button>
                    </div>
                </div>
            </div>
        ),
    },
    {
        name: 'Map',
        exports: ['Map'],
        importPath: '@/components/ui/map',
        description: 'Leaflet-based interactive map component with marker support and configurable tile layers.',
        level: 'Organism',
        group: 'Maps',
        preview: (
            <div className="w-full h-24 rounded-lg border bg-muted/20 relative overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 opacity-10">
                    <svg width="100%" height="100%">
                        <defs><pattern id="uimapgrid" width="16" height="16" patternUnits="userSpaceOnUse"><path d="M 16 0 L 0 0 0 16" fill="none" stroke="currentColor" strokeWidth="0.5"/></pattern></defs>
                        <rect width="100%" height="100%" fill="url(#uimapgrid)" />
                    </svg>
                </div>
                <div className="absolute left-12 top-8 h-4 w-4 rounded-full bg-primary border-2 border-background shadow flex items-center justify-center">
                    <span className="text-[8px] text-primary-foreground font-bold">A</span>
                </div>
                <div className="absolute right-10 top-10 h-3 w-3 rounded-full bg-red-500 border-2 border-background shadow" />
                <div className="absolute bottom-2 right-2 flex gap-0.5">
                    <button className="h-4 w-4 rounded border bg-background text-[10px] flex items-center justify-center">+</button>
                    <button className="h-4 w-4 rounded border bg-background text-[10px] flex items-center justify-center">−</button>
                </div>
            </div>
        ),
    },
    {
        name: 'ProjectFormBrowser',
        exports: ['ProjectFormBrowser'],
        importPath: '@/features/forms/components/ProjectFormBrowser',
        description: 'Project-scoped file browser for forms. Shows a folder sidebar (only when folders exist) alongside a tile grid of forms. Supports drag-and-drop, folder creation, and navigating directly to project forms.',
        level: 'Organism',
        preview: (
            <div className="border rounded-lg p-4 bg-background w-full">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-base font-semibold">Forms</span>
                    <div className="flex gap-2">
                        <div className="h-7 w-28 rounded-md border bg-muted/30 text-xs flex items-center justify-center text-muted-foreground">+ New Folder</div>
                        <div className="h-7 w-24 rounded-md bg-primary text-xs flex items-center justify-center text-primary-foreground">+ New Form</div>
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                    {['Safety Inspection', 'Field Report', 'Daily Checklist'].map((name) => (
                        <div key={name} className="border rounded-lg p-3 bg-card flex items-start gap-3">
                            <div className="h-8 w-8 shrink-0 rounded-md bg-blue-100 flex items-center justify-center text-blue-500 text-xs">F</div>
                            <div>
                                <p className="text-xs font-medium truncate">{name}</p>
                                <p className="text-[10px] text-muted-foreground mt-0.5">2 days ago</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        ),
    },
];

// ── Tab config ───────────────────────────────────────────────────────────────

const TABS = [
    { id: 'atoms',     label: 'Atoms',     icon: Atom,   data: ATOMS,      color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { id: 'molecules', label: 'Molecules', icon: Layers, data: MOLECULES,  color: 'text-blue-500',    bg: 'bg-blue-500/10' },
    { id: 'organisms', label: 'Organisms', icon: Boxes,  data: ORGANISMS,  color: 'text-purple-500',  bg: 'bg-purple-500/10' },
];

const LEVEL_COLORS: Record<AtomicLevel, string> = {
    Atom:     'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    Molecule: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    Organism: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
};

// ── Copy Button ──────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    const handleCopy = async (e: React.MouseEvent) => {
        e.stopPropagation();
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <button
            onClick={handleCopy}
            title="Copy import"
            className={cn(
                'flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-mono transition-all border whitespace-nowrap shrink-0',
                copied
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                    : 'bg-muted/50 text-muted-foreground border-border/50 hover:bg-muted hover:text-foreground'
            )}
        >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? 'Copied!' : 'Copy import'}
        </button>
    );
}

// ── Component Card ───────────────────────────────────────────────────────────

function ComponentCard({ entry }: { entry: ComponentEntry }) {
    const importStatement = `import { ${entry.exports.join(', ')} } from '${entry.importPath}';`;

    return (
        <div className="flex flex-col rounded-xl border border-border/60 bg-card overflow-hidden hover:border-border transition-colors">
            {/* Preview area */}
            <div className="bg-muted/20 border-b border-border/40 p-4 flex items-center justify-center min-h-[100px]">
                {entry.preview}
            </div>

            {/* Info area */}
            <div className="p-4 flex flex-col gap-2 flex-1">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                        <span className="font-semibold text-sm truncate">{entry.name}</span>
                        <span className={cn('shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full border', LEVEL_COLORS[entry.level])}>
                            {entry.level}
                        </span>
                    </div>
                    <CopyButton text={importStatement} />
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">{entry.description}</p>

                <div className="flex items-center gap-1 flex-wrap mt-auto pt-1">
                    {entry.exports.slice(0, 3).map(exp => (
                        <span key={exp} className="text-[10px] font-mono bg-muted/60 border border-border/40 text-muted-foreground rounded px-1.5 py-0.5">
                            {exp}
                        </span>
                    ))}
                    {entry.exports.length > 3 && (
                        <span className="text-[10px] text-muted-foreground">+{entry.exports.length - 3}</span>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ComponentLibraryPage() {
    const [activeTab, setActiveTab] = useState<string>('atoms');
    const [search, setSearch] = useState('');

    const activeTabConfig = TABS.find(t => t.id === activeTab)!;

    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();
        if (!q) return activeTabConfig.data;
        return activeTabConfig.data.filter(c =>
            c.name.toLowerCase().includes(q) ||
            c.description.toLowerCase().includes(q) ||
            c.exports.some(e => e.toLowerCase().includes(q)) ||
            c.importPath.toLowerCase().includes(q) ||
            (c.group ?? '').toLowerCase().includes(q)
        );
    }, [activeTab, search, activeTabConfig]);

    const groups = useMemo(() => {
        const ungrouped = filtered.filter(c => !c.group);
        const grouped = filtered.reduce<Record<string, ComponentEntry[]>>((acc, c) => {
            if (!c.group) return acc;
            (acc[c.group] ??= []).push(c);
            return acc;
        }, {});
        return { ungrouped, grouped };
    }, [filtered]);

    const totalAll = TABS.reduce((sum, t) => sum + t.data.length, 0);

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b flex-shrink-0">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Component Library</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            {totalAll} components — live previews organized by Atomic Design.
                        </p>
                    </div>
                </div>
                <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search components…" className="pl-9" />
                </div>
            </div>

            {/* Tab bar */}
            <div className="px-6 flex gap-1 pt-3 border-b flex-shrink-0 bg-background">
                {TABS.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-all duration-150',
                                isActive
                                    ? `border-primary text-primary ${tab.bg}`
                                    : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40'
                            )}
                        >
                            <Icon className={cn('h-4 w-4', isActive ? tab.color : '')} />
                            {tab.label}
                            <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full min-w-[20px] text-center', isActive ? `${tab.bg} ${tab.color}` : 'bg-muted text-muted-foreground')}>
                                {tab.data.length}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <LayoutGrid className="h-10 w-10 text-muted-foreground/30 mb-3" />
                        <p className="font-medium text-muted-foreground">No components match "{search}"</p>
                        <p className="text-sm text-muted-foreground/60 mt-1">Try searching by name, export, or import path.</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {groups.ungrouped.length > 0 && (
                            <section>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {groups.ungrouped.map(entry => <ComponentCard key={`${entry.importPath}:${entry.name}`} entry={entry} />)}
                                </div>
                            </section>
                        )}
                        {Object.entries(groups.grouped).map(([groupName, entries]) => (
                            <section key={groupName}>
                                <div className="flex items-center gap-3 mb-3">
                                    <h2 className="text-sm font-semibold">{groupName}</h2>
                                    <div className="flex-1 h-px bg-border/60" />
                                    <span className="text-xs text-muted-foreground">{entries.length}</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {entries.map(entry => <ComponentCard key={`${entry.importPath}:${entry.name}`} entry={entry} />)}
                                </div>
                            </section>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
