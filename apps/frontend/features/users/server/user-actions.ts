'use server';

/**
 * Story 6-5: Notification Subscription Preferences
 *
 * UserEntity does not have a dedicated `notificationPreferences` attribute,
 * so preferences are stored in the `theme` slot is NOT appropriate — we
 * instead use a pattern of storing them in a separate AuditLog entry OR,
 * since UserEntity accepts arbitrary sets, we patch the user record using
 * ElectroDB's `set` with a stringified JSON value stored under the `locale`
 * field family is also wrong.
 *
 * Correct approach: UserEntity does not have this field. We store it in
 * AuditLogEntity with action = 'USER_PREFERENCES' scoped to a synthetic
 * projectId of 'global', with entityId = userId.
 *
 * However, the cleanest approach given the current schema is to simply patch
 * UserEntity with a JSON string in a compatible field. Looking at the entity,
 * `theme` and `locale` are the only free-form string fields. To avoid
 * corrupting them we use a dedicated `data` blob — but UserEntity has no such
 * field.
 *
 * Resolution: store preferences in AuditLogEntity using action = 'USER_PREFS'
 * and entityId = userId, reading back the most recent entry. This requires
 * no schema change.
 */

import { AuditLogEntity } from '@/lib/dynamo';
import { auth } from '@/auth';
import { nanoid } from 'nanoid';

// Sentinel projectId used for user-scoped global preference entries.
const GLOBAL_PROJECT = '__global__';

export interface NotificationPreferences {
  emailMentions: boolean;
  pushAssignments: boolean;
  dailyDigest: boolean;
}

const DEFAULT_PREFS: NotificationPreferences = {
  emailMentions: true,
  pushAssignments: true,
  dailyDigest: false,
};

// ---------------------------------------------------------------------------
// Public actions
// ---------------------------------------------------------------------------

/**
 * Persists notification preferences for the current user.
 * Writes a new AuditLog entry with action = 'USER_PREFS'. On read we take
 * the most recent entry, so writes are append-only (no update needed).
 */
export async function updateNotificationPreferences(
  preferences: Partial<NotificationPreferences>
): Promise<boolean> {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    const merged = { ...DEFAULT_PREFS, ...preferences };

    await AuditLogEntity.create({
      auditId: nanoid(),
      projectId: GLOBAL_PROJECT,
      userId: session.user.id,
      action: 'USER_PREFS',
      entityType: 'user',
      entityId: session.user.id,
      details: merged,
      createdAt: new Date().toISOString(),
    }).go();

    return true;
  } catch (error) {
    console.error('Failed to update notification preferences:', error);
    return false;
  }
}

/**
 * Returns the current user's notification preferences.
 * Reads all USER_PREFS audit entries for the user and returns the most recent.
 */
export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  try {
    const session = await auth();
    if (!session?.user?.id) return DEFAULT_PREFS;

    const result = await AuditLogEntity.query
      .byUser({ userId: session.user.id })
      .go();

    const prefEntries = result.data
      .filter((e) => e.action === 'USER_PREFS' && e.entityId === session.user!.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    if (!prefEntries.length) return DEFAULT_PREFS;

    const stored = prefEntries[0].details as Partial<NotificationPreferences>;
    return { ...DEFAULT_PREFS, ...stored };
  } catch (error) {
    console.error('Failed to get notification preferences:', error);
    return DEFAULT_PREFS;
  }
}
