import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TASK_INCLUDE = {
    createdBy:  { select: { id: true, name: true, email: true } },
    assignedTo: { select: { id: true, name: true, email: true } },
};

export class TaskService {

    static async createTask(data: {
        projectId: string;
        createdById: string;
        title: string;
        question: string;
        taskType?: string;
        status?: string;
        priority?: string;
        startDate?: string;
        endDate?: string;
        assignees?: any[];
        attachments?: any[];
        mentions?: any[];
        images?: any[];
    }) {
        const { projectId, createdById, title, question, taskType, status, priority, startDate, endDate, assignees, attachments, mentions, images } = data;

        const member = await prisma.projectMember.findUnique({
            where: { projectId_userId: { projectId, userId: createdById } }
        });
        if (!member) throw new Error('Unauthorized: User is not a member of this project');

        return prisma.task.create({
            data: {
                projectId,
                createdById,
                title,
                question,
                taskType:    taskType    ?? 'GENERAL',
                status:      status      ?? 'ACTIVE',
                priority:    priority    ?? 'MEDIUM',
                startDate:   startDate   ? new Date(startDate) : undefined,
                endDate:     endDate     ? new Date(endDate)   : undefined,
                assignees:   assignees   ?? undefined,
                attachments: attachments ?? undefined,
                mentions:    mentions    ?? undefined,
                images:      images      ?? undefined,
            },
            include: TASK_INCLUDE,
        });
    }

    static async getProjectTasks(projectId: string) {
        return prisma.task.findMany({
            where: { projectId },
            orderBy: { createdAt: 'desc' },
            include: TASK_INCLUDE,
        });
    }

    static async getTask(taskId: string) {
        return prisma.task.findUnique({
            where: { id: taskId },
            include: TASK_INCLUDE,
        });
    }

    static async updateTask(taskId: string, updates: {
        title?: string;
        question?: string;
        proposedSolution?: string;
        taskType?: string;
        status?: string;
        priority?: string;
        startDate?: string | null;
        endDate?: string | null;
        assignedToId?: string;
        assignees?: any[];
        attachments?: any[];
        mentions?: any[];
        images?: any[];
    }) {
        const { assignees, attachments, mentions, images, startDate, endDate, ...rest } = updates;

        return prisma.task.update({
            where: { id: taskId },
            data: {
                ...rest,
                ...(startDate !== undefined ? { startDate: startDate ? new Date(startDate) : null } : {}),
                ...(endDate   !== undefined ? { endDate:   endDate   ? new Date(endDate)   : null } : {}),
                ...(assignees   !== undefined ? { assignees   } : {}),
                ...(attachments !== undefined ? { attachments } : {}),
                ...(mentions    !== undefined ? { mentions    } : {}),
                ...(images      !== undefined ? { images      } : {}),
            },
            include: TASK_INCLUDE,
        });
    }
}
