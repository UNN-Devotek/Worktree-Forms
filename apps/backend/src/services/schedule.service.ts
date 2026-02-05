
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ScheduleService {
    /**
     * Get tasks for a project
     */
    static async getProjectTasks(projectId: string) {
        return await prisma.scheduleTask.findMany({
            where: { projectId },
            orderBy: { startDate: 'asc' },
            include: {
                assignedTo: {
                    select: { id: true, name: true, image: true }
                }
            }
        });
    }

    /**
     * Create a new task
     */
    static async createTask(data: {
        projectId: string;
        title: string;
        startDate: Date;
        endDate: Date;
        status?: string;
        assignedToId?: string;
    }) {
        return await prisma.scheduleTask.create({
            data: {
                ...data,
                status: data.status || 'PLANNED'
            }
        });
    }

    /**
     * Update a task
     */
    static async updateTask(id: string, data: {
        title?: string;
        startDate?: Date;
        endDate?: Date;
        status?: string;
        assignedToId?: string;
    }) {
        return await prisma.scheduleTask.update({
            where: { id },
            data
        });
    }

    /**
     * Delete a task
     */
    static async deleteTask(id: string) {
        return await prisma.scheduleTask.delete({
            where: { id }
        });
    }
}
