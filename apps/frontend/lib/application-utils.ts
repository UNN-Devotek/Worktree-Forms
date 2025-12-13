import type { ApplicationStatus, ApplicationPriority } from '@/types/applications';

export const APPLICATION_STATUSES: Record<ApplicationStatus, { label: string; description: string }> = {
  pending: { label: 'Pending', description: 'Awaiting review' },
  approved: { label: 'Approved', description: 'Application approved' },
  denied: { label: 'Denied', description: 'Application denied' },
  under_review: { label: 'Under Review', description: 'Currently being reviewed' },
  interview_scheduled: { label: 'Interview Scheduled', description: 'Interview scheduled' },
};

export const APPLICATION_PRIORITIES: Record<ApplicationPriority, { label: string }> = {
  normal: { label: 'Normal' },
  high: { label: 'High' },
  urgent: { label: 'Urgent' },
};

export const GAME_OPTIONS = [
  'Star Citizen',
  'Squad',
  'War Thunder',
  'Arma Reforger',
  'General Community',
];

export function getStatusColor(status: ApplicationStatus): string {
  switch (status) {
    case 'pending':
      return 'bg-muted text-muted-foreground';
    case 'under_review':
      return 'bg-primary text-primary-foreground';
    case 'interview_scheduled':
      return 'bg-accent text-accent-foreground';
    case 'approved':
      return 'bg-success text-success-foreground';
    case 'denied':
      return 'bg-destructive text-destructive-foreground';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

export function getPriorityColor(priority: ApplicationPriority): string {
  switch (priority) {
    case 'urgent':
      return 'bg-destructive text-destructive-foreground';
    case 'high':
      return 'bg-warning text-warning-foreground';
    case 'normal':
      return 'bg-muted text-muted-foreground';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

export function formatDate(dateString: string | undefined | null): string {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateShort(dateString: string | undefined | null): string {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}