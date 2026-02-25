export interface TaskAssignee {
    id: string;
    name: string | null;
}

export interface TaskAttachment {
    url: string;
    name: string;
    type: string;
    objectKey: string;
}

export interface TaskMention {
    type: 'sheet' | 'spec';
    id: string;
    label: string;
}

export interface Task {
    id: string;
    projectId: string;
    number: number;
    title: string;
    question: string;
    proposedSolution?: string;
    taskType: string;
    status: string;
    priority: string;
    startDate?: string | null;
    endDate?: string | null;
    assignees?: TaskAssignee[] | null;
    attachments?: TaskAttachment[] | null;
    mentions?: TaskMention[] | null;
    images?: { url: string; objectKey: string }[] | null;
    createdAt: string;
    updatedAt: string;
    createdBy: { id: string; name: string | null; email: string };
    assignedTo?: { id: string; name: string | null; email: string } | null;
}

export interface ProjectMember {
    id: string;
    name: string | null;
    email: string;
    roles: string[];
}

export interface MentionableItem {
    type: 'sheet' | 'spec';
    id: string;
    label: string;
}
