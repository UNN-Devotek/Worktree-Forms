
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class SpecService {
    
    /**
     * Create a new Specification entry
     */
    static async createSpec(data: {
        projectId: string;
        section: string;
        title: string;
        keywords?: string;
        type?: string; // SPEC or BLUEPRINT
        fileUrl: string;
        objectKey: string;
        uploadedById: string;
    }) {
        return await prisma.specification.create({
            data: {
                ...data,
                type: data.type || 'SPEC'
            },
            include: {
                uploadedBy: { select: { id: true, name: true } }
            }
        });
    }

    /**
     * Search Specifications in a project
     * Matches section, title, or keywords via ILIKE (insensitive)
     */
    static async searchSpecs(projectId: string, query: string, type: string = 'SPEC') {
        if (!query || query.length < 2) {
            // Return all or recent
            return await prisma.specification.findMany({
                where: { projectId, type },
                orderBy: { section: 'asc' },
                include: { uploadedBy: { select: { name: true } } }
            });
        }
        
        return await prisma.specification.findMany({
            where: {
                projectId,
                type,
                OR: [
                    { title: { contains: query, mode: 'insensitive' } },
                    { section: { contains: query, mode: 'insensitive' } },
                    { keywords: { contains: query, mode: 'insensitive' } }
                ]
            },
            orderBy: { section: 'asc' },
            include: { uploadedBy: { select: { name: true } } }
        });
    }

    /**
     * Delete a Specification
     */
    static async deleteSpec(specId: string) {
        return await prisma.specification.delete({
            where: { id: specId }
        });
    }
}
