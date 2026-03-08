import { describe, it, expect, beforeEach } from 'vitest';
import { useUIPreferencesStore } from './ui-preferences-store';

function getStore() {
  return useUIPreferencesStore.getState();
}

describe('UIPreferencesStore', () => {
  beforeEach(() => {
    // Reset to known defaults before each test
    useUIPreferencesStore.setState({
      sidebarCollapsed: true,
      notificationPrefs: { emailMentions: true, pushAssignments: true, dailyDigest: false },
      gridPrefs: {},
    });
  });

  // ─── Sidebar ──────────────────────────────────────────────────────────────

  describe('sidebar', () => {
    it('[P0] initial state has sidebarCollapsed = true', () => {
      expect(getStore().sidebarCollapsed).toBe(true);
    });

    it('[P0] setSidebarCollapsed sets the value directly', () => {
      getStore().setSidebarCollapsed(false);
      expect(getStore().sidebarCollapsed).toBe(false);

      getStore().setSidebarCollapsed(true);
      expect(getStore().sidebarCollapsed).toBe(true);
    });

    it('[P0] toggleSidebar flips the collapsed state', () => {
      getStore().toggleSidebar(); // true → false
      expect(getStore().sidebarCollapsed).toBe(false);

      getStore().toggleSidebar(); // false → true
      expect(getStore().sidebarCollapsed).toBe(true);
    });

    it('[P1] multiple toggles return to original state', () => {
      const initial = getStore().sidebarCollapsed;
      getStore().toggleSidebar();
      getStore().toggleSidebar();
      expect(getStore().sidebarCollapsed).toBe(initial);
    });
  });

  // ─── Notification preferences ─────────────────────────────────────────────

  describe('notificationPrefs', () => {
    it('[P0] default prefs have emailMentions and pushAssignments true, dailyDigest false', () => {
      const { notificationPrefs } = getStore();
      expect(notificationPrefs.emailMentions).toBe(true);
      expect(notificationPrefs.pushAssignments).toBe(true);
      expect(notificationPrefs.dailyDigest).toBe(false);
    });

    it('[P0] setNotificationPrefs replaces all notification preferences', () => {
      getStore().setNotificationPrefs({
        emailMentions: false,
        pushAssignments: false,
        dailyDigest: true,
      });

      const { notificationPrefs } = getStore();
      expect(notificationPrefs.emailMentions).toBe(false);
      expect(notificationPrefs.pushAssignments).toBe(false);
      expect(notificationPrefs.dailyDigest).toBe(true);
    });

    it('[P1] setNotificationPrefs replaces entirely, not merges', () => {
      getStore().setNotificationPrefs({
        emailMentions: false,
        pushAssignments: true,
        dailyDigest: true,
      });
      // All three fields should reflect the new value
      expect(getStore().notificationPrefs).toEqual({
        emailMentions: false,
        pushAssignments: true,
        dailyDigest: true,
      });
    });
  });

  // ─── Grid preferences ─────────────────────────────────────────────────────

  describe('gridPrefs', () => {
    it('[P0] getGridPrefs returns defaults for unknown projectId', () => {
      const prefs = getStore().getGridPrefs('new-project');
      expect(prefs.compactMode).toBe(false);
      expect(prefs.showFailedOnly).toBe(false);
    });

    it('[P0] setGridCompactMode updates compactMode for a project', () => {
      getStore().setGridCompactMode('proj-1', true);
      expect(getStore().getGridPrefs('proj-1').compactMode).toBe(true);
    });

    it('[P0] setGridShowFailedOnly updates showFailedOnly for a project', () => {
      getStore().setGridShowFailedOnly('proj-1', true);
      expect(getStore().getGridPrefs('proj-1').showFailedOnly).toBe(true);
    });

    it('[P1] preferences are scoped per projectId — changes to one do not affect another', () => {
      getStore().setGridCompactMode('proj-A', true);
      getStore().setGridCompactMode('proj-B', false);

      expect(getStore().getGridPrefs('proj-A').compactMode).toBe(true);
      expect(getStore().getGridPrefs('proj-B').compactMode).toBe(false);
    });

    it('[P1] setGridCompactMode preserves showFailedOnly for same project', () => {
      getStore().setGridShowFailedOnly('proj-1', true);
      getStore().setGridCompactMode('proj-1', true);

      const prefs = getStore().getGridPrefs('proj-1');
      expect(prefs.compactMode).toBe(true);
      expect(prefs.showFailedOnly).toBe(true); // not reset
    });

    it('[P1] setGridShowFailedOnly preserves compactMode for same project', () => {
      getStore().setGridCompactMode('proj-1', true);
      getStore().setGridShowFailedOnly('proj-1', true);

      const prefs = getStore().getGridPrefs('proj-1');
      expect(prefs.compactMode).toBe(true); // not reset
      expect(prefs.showFailedOnly).toBe(true);
    });

    it('[P1] can toggle compactMode on and off', () => {
      getStore().setGridCompactMode('proj-1', true);
      expect(getStore().getGridPrefs('proj-1').compactMode).toBe(true);

      getStore().setGridCompactMode('proj-1', false);
      expect(getStore().getGridPrefs('proj-1').compactMode).toBe(false);
    });
  });
});
