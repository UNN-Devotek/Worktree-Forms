import { UserEntity, ProjectEntity, ProjectMemberEntity } from '../lib/dynamo/index.js';
import { nanoid } from 'nanoid';

export class EmailIngestionService {
  /**
   * Process a simulated inbound email.
   * Logic:
   * 1. Find user by 'from' address.
   * 2. If subject starts with "Create Project:", create a project.
   * 3. Else, treat as a generic log or ignore for MVP.
   */
  static async processInboundEmail(payload: { from: string; subject: string; text: string }) {

    // 1. Authenticate User via Email
    const userResult = await UserEntity.query.byEmail({ email: payload.from }).go();
    const user = userResult.data[0];

    if (!user) {
      console.warn(`User not found for email: ${payload.from}`);
      return { success: false, error: 'User not found' };
    }

    // 2. Parse Intent (Simple Regex for MVP)
    if (payload.subject.startsWith('Create Project:')) {
      const projectName = payload.subject.replace('Create Project:', '').trim();
      const description = payload.text.trim();
      const slugBase = projectName
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
      const slug = `${slugBase}-${Math.floor(Math.random() * 1000)}`;
      const projectId = nanoid();

      // Create Project
      const projectResult = await ProjectEntity.create({
        projectId,
        name: projectName,
        slug,
        description,
        ownerId: user.userId,
      }).go();

      // Add User as Member (Owner)
      await ProjectMemberEntity.create({
        projectId,
        userId: user.userId,
        roles: ['OWNER'],
      }).go();

      return { success: true, action: 'CREATE_PROJECT', data: projectResult.data };
    }

    return { success: false, error: 'Unknown Intent' };
  }
}
