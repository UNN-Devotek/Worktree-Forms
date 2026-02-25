export const TASK_TYPES = [
    { value: 'RFI',          label: 'RFI',          description: 'Request for Information' },
    { value: 'GENERAL',      label: 'General Task',  description: 'Miscellaneous to-do item' },
    { value: 'PUNCH_LIST',   label: 'Punch List',    description: 'Deficiency or unfinished work item' },
    { value: 'INSPECTION',   label: 'Inspection',    description: 'Site or quality inspection request' },
    { value: 'SUBMITTAL',    label: 'Submittal',     description: 'Material/equipment approval submission' },
    { value: 'CHANGE_ORDER', label: 'Change Order',  description: 'Requested scope or cost change' },
    { value: 'SAFETY',       label: 'Safety Issue',  description: 'Hazard or incident report' },
    { value: 'DEFICIENCY',   label: 'Deficiency',    description: 'Non-conformance or quality issue' },
] as const;

export const TASK_TYPE_MAP: Record<string, string> = Object.fromEntries(
    TASK_TYPES.map(t => [t.value, t.label])
);

export const TASK_STATUSES = [
    { value: 'DRAFT',       label: 'Draft',       color: 'bg-gray-100 text-gray-700' },
    { value: 'ACTIVE',      label: 'Active',      color: 'bg-blue-100 text-blue-700' },
    { value: 'IN_PROGRESS', label: 'In Progress', color: 'bg-yellow-100 text-yellow-700' },
    { value: 'COMPLETED',   label: 'Completed',   color: 'bg-green-100 text-green-700' },
] as const;

export const STATUS_MAP: Record<string, { label: string; color: string }> = Object.fromEntries(
    TASK_STATUSES.map(s => [s.value, { label: s.label, color: s.color }])
);

export const PRIORITY_LEVELS = [
    { value: 'LOW',    label: 'Low',    color: 'bg-gray-100 text-gray-600',   dot: 'bg-gray-400' },
    { value: 'MEDIUM', label: 'Medium', color: 'bg-blue-100 text-blue-700',   dot: 'bg-blue-500' },
    { value: 'HIGH',   label: 'High',   color: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
    { value: 'URGENT', label: 'Urgent', color: 'bg-red-100 text-red-700',     dot: 'bg-red-500' },
] as const;

export const PRIORITY_MAP: Record<string, { label: string; color: string; dot: string }> = Object.fromEntries(
    PRIORITY_LEVELS.map(p => [p.value, { label: p.label, color: p.color, dot: p.dot }])
);

export const KANBAN_STATUS_COLUMNS = ['ACTIVE', 'IN_PROGRESS', 'COMPLETED'] as const;

/** Button variant for each task type column header */
export const TASK_TYPE_BUTTON_MAP: Record<string, string> = {
    RFI:          'default',       // blue
    GENERAL:      'neutral',       // slate
    PUNCH_LIST:   'warning',       // orange
    INSPECTION:   'secondary',     // green
    SUBMITTAL:    'alternative',   // amber
    CHANGE_ORDER: 'purple',        // violet
    SAFETY:       'destructive',   // red
    DEFICIENCY:   'info',          // sky blue
};

/** Badge variant mappings — matches badge.tsx variant names */
export const STATUS_BADGE_MAP: Record<string, string> = {
    DRAFT:       'pending',
    ACTIVE:      'active',
    IN_PROGRESS: 'processing',
    COMPLETED:   'done',
};

export const PRIORITY_BADGE_MAP: Record<string, string> = {
    LOW:    'low',
    MEDIUM: 'info',
    HIGH:   'high',
    URGENT: 'destructive',
};
