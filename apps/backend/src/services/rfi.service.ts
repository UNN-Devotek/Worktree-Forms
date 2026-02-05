
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class RfiService {
    
    /**
     * Create a new RFI
     */
    static async createRfi(data: {
        projectId: string;
        title: string;
        question: string;
        createdById: string;
        images?: any[];
    }) {
        const { projectId, title, question, createdById, images } = data;
        
        // RBAC: Verify membership
        const member = await prisma.projectMember.findUnique({
            where: { projectId_userId: { projectId, userId: createdById } }
        });
        if (!member) {
             throw new Error("Unauthorized: User is not a member of this project");
        }

        return await prisma.rfi.create({
            data: {
                projectId,
                title,
                question,
                createdById,
                // Default is DRAFT
                images: images ? JSON.stringify(images) : undefined
            },
            include: {
                createdBy: { select: { id: true, name: true, email: true } },
                assignedTo: { select: { id: true, name: true, email: true } }
            }
        });
    }

    /**
     * Get RFIs for a project
     */
    static async getProjectRfis(projectId: string) {
        return await prisma.rfi.findMany({
            where: { projectId },
            orderBy: { createdAt: 'desc' },
            include: {
                createdBy: { select: { id: true, name: true, email: true } },
                assignedTo: { select: { id: true, name: true, email: true } }
            }
        });
    }

    /**
     * Get single RFI
     */
    static async getRfi(rfiId: string) {
        return await prisma.rfi.findUnique({
            where: { id: rfiId },
            include: {
                createdBy: { select: { id: true, name: true, email: true } },
                assignedTo: { select: { id: true, name: true, email: true } }
            }
        });
    }

    /**
     * Update RFI (e.g. Publish, Answer)
     */
    static async updateRfi(rfiId: string, updates: {
        title?: string;
        question?: string;
        proposedSolution?: string;
        status?: string;
        assignedToId?: string;
        images?: any[];
    }) {
        // Logic: If transitioning to OPEN (Publish), assign to Project Creator if not assigned
        if (updates.status === 'OPEN') {
             const currentRfi = await prisma.rfi.findUnique({ where: { id: rfiId } });
             if (currentRfi && currentRfi.status === 'DRAFT') {
                 // Fetch Project to find Creator
                 const project = await prisma.project.findUnique({ where: { id: currentRfi.projectId } });
                 if (project) {
                     // Auto-assign to PM (Project Creator) if generic publish
                     if (!updates.assignedToId) {
                         updates.assignedToId = project.createdById;
                     }
                 }
             }
        }

        return await prisma.rfi.update({
            where: { id: rfiId },
            data: {
                ...updates,
                images: updates.images ? JSON.stringify(updates.images) : undefined
            },
            include: {
                createdBy: { select: { id: true, name: true, email: true } },
                assignedTo: { select: { id: true, name: true, email: true } }
            }
        });
    }
}
