
import { prisma } from '../db';
import { AiService } from './ai.service'; // We'll assume we can eventually reuse parse logic or just regex for MVP

export class EmailIngestionService {
  /**
   * Process a simulated inbound email.
   * Logic:
   * 1. Find user by 'from' address.
   * 2. If subject starts with "Create Project:", create a project.
   * 3. Else, treat as a generic log or ignore for MVP.
   */
  static async processInboundEmail(payload: { from: string; subject: string; text: string }) {
    console.log(`📧 Processing Inbound Email from ${payload.from}`);

    // 1. Authenticate User via Email
    const user = await prisma.user.findUnique({
      where: { email: payload.from },
    });

    if (!user) {
      console.warn(`❌ User not found for email: ${payload.from}`);
      return { success: false, error: 'User not found' };
    }

    // 2. Parse Intent (Simple Regex for MVP, could be LLM later)
    if (payload.subject.startsWith('Create Project:')) {
      const projectName = payload.subject.replace('Create Project:', '').trim();
      const description = payload.text.trim();
      const slug = projectName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

      // Create Project
      const project = await prisma.project.create({
        data: {
          name: projectName,
          slug: `${slug}-${Math.floor(Math.random() * 1000)}`, // Ensure uniqueness
          description: description,
          createdById: user.id, // Fixed: ownerId -> createdById
          // status: 'ACTIVE', // Removed: Not in schema
        },
      });

      // Add User as Member (Owner)
      await prisma.projectMember.create({
        data: {
          projectId: project.id,
          userId: user.id,
          roles: ['OWNER'], // Fixed: role -> roles array
        },
      });

      console.log(`✅ Magic Project Created: ${project.name} (ID: ${project.id})`);
      return { success: true, action: 'CREATE_PROJECT', data: project };
    }

    return { success: false, error: 'Unknown Intent' };
  }
}
