'use server';

/**
 * Story 6-4: Project Team Chat
 *
 * Messages are stored as AuditLog entries with action = 'CHAT_MESSAGE'.
 * The `details` field carries { text, senderName }.
 * This approach requires no new entity or DynamoDB table and keeps
 * messages scoped to a projectId with time-ordered SK.
 */

import { AuditLogEntity, ProjectMemberEntity, UserEntity } from '@/lib/dynamo';
import { auth } from '@/auth';
import { nanoid } from 'nanoid';

// ---------------------------------------------------------------------------
// Internal auth helper
// ---------------------------------------------------------------------------

async function verifyProjectMember(projectId: string): Promise<{ userId: string; name: string }> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');
  const result = await ProjectMemberEntity.query.primary({ projectId, userId: session.user.id }).go();
  if (!result.data.length) throw new Error('Forbidden');
  const userResult = await UserEntity.query.primary({ userId: session.user.id }).go();
  return {
    userId: session.user.id,
    name: userResult.data[0]?.name ?? session.user.name ?? 'Unknown',
  };
}

// ---------------------------------------------------------------------------
// Public actions
// ---------------------------------------------------------------------------

export interface ChatMessage {
  messageId: string;
  projectId: string;
  userId: string;
  senderName: string;
  text: string;
  createdAt: string;
}

/**
 * Sends a chat message for the given project.
 * Stored as AuditLogEntity with action = 'CHAT_MESSAGE'.
 */
export async function sendMessage(
  projectId: string,
  text: string
): Promise<ChatMessage | null> {
  try {
    const { userId, name } = await verifyProjectMember(projectId);
    if (!text.trim()) return null;

    const auditId = nanoid();
    const createdAt = new Date().toISOString();

    await AuditLogEntity.create({
      auditId,
      projectId,
      userId,
      action: 'CHAT_MESSAGE',
      entityType: 'chat',
      entityId: projectId,
      details: { text: text.trim(), senderName: name },
      createdAt,
    }).go();

    return { messageId: auditId, projectId, userId, senderName: name, text: text.trim(), createdAt };
  } catch (error) {
    console.error('Failed to send chat message:', error);
    return null;
  }
}

/**
 * Returns the most recent 100 chat messages for a project, newest-last.
 */
export async function getMessages(projectId: string): Promise<ChatMessage[]> {
  try {
    await verifyProjectMember(projectId);

    // AuditLogEntity primary index: PK = PROJECT#<projectId>, SK = AUDIT#<createdAt>#<auditId>
    // We query the full project partition and filter client-side by action.
    const result = await AuditLogEntity.query.primary({ projectId }).go();
    return result.data
      .filter((e) => e.action === 'CHAT_MESSAGE')
      .slice(-100)
      .map((e) => ({
        messageId: e.auditId,
        projectId: e.projectId,
        userId: e.userId ?? '',
        senderName: (e.details as Record<string, unknown>)?.senderName as string ?? 'Unknown',
        text: (e.details as Record<string, unknown>)?.text as string ?? '',
        createdAt: e.createdAt,
      }));
  } catch (error) {
    console.error('Failed to get chat messages:', error);
    return [];
  }
}
