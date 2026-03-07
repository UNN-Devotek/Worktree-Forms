'use server';

/**
 * Story 6-14: Offline Resilience — SyncLedger server actions
 *
 * Called by the client-side SyncEngine to durably record sync activity
 * in DynamoDB via SyncLedgerEntity. This creates an auditable server-side
 * record of every mutation the device attempted and whether it succeeded.
 *
 * SyncLedgerEntity key structure:
 *   PK: PROJECT#<projectId>  SK: SYNC#<deviceId>#<submissionId>
 *
 * We map:
 *   deviceId    → stable browser device token (passed from client)
 *   submissionId → mutation queue entry id
 *   projectId   → extracted from the mutation body, or a sentinel '__sync__'
 */

import { SyncLedgerEntity } from '@/lib/dynamo';
import { auth } from '@/auth';

// Sentinel projectId for mutations whose projectId cannot be determined.
const SYNC_PROJECT = '__sync__';

async function requireAuth(): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');
}

export async function recordSyncAttempt(
  deviceId: string,
  mutationId: string,
  projectId: string
): Promise<void> {
  await requireAuth();
  await SyncLedgerEntity.create({
    deviceId,
    submissionId: mutationId,
    projectId: projectId || SYNC_PROJECT,
    syncStatus: 'PENDING',
    retryCount: 0,
    createdAt: new Date().toISOString(),
  }).go();
}

export async function markSyncSuccess(
  deviceId: string,
  mutationId: string,
  projectId: string
): Promise<void> {
  await requireAuth();
  await SyncLedgerEntity.patch({
    projectId: projectId || SYNC_PROJECT,
    deviceId,
    submissionId: mutationId,
  })
    .set({
      syncStatus: 'SYNCED',
      syncedAt: new Date().toISOString(),
    })
    .go();
}

export async function markSyncFailed(
  deviceId: string,
  mutationId: string,
  projectId: string,
  retryCount: number,
  errorMessage: string
): Promise<void> {
  await requireAuth();
  await SyncLedgerEntity.patch({
    projectId: projectId || SYNC_PROJECT,
    deviceId,
    submissionId: mutationId,
  })
    .set({
      syncStatus: retryCount >= 5 ? 'FAILED' : 'PENDING',
      retryCount,
      errorMessage,
    })
    .go();
}
