import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Notification preferences for the current user.
 */
interface NotificationPreferences {
  emailMentions: boolean;
  pushAssignments: boolean;
  dailyDigest: boolean;
}

/**
 * Per-project grid preferences (compact mode, failed-only filter).
 */
interface GridPreferences {
  compactMode: boolean;
  showFailedOnly: boolean;
}

interface UIPreferencesState {
  /** Sidebar collapsed state */
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;

  /** Notification preferences */
  notificationPrefs: NotificationPreferences;
  setNotificationPrefs: (prefs: NotificationPreferences) => void;

  /** Per-project grid preferences, keyed by projectId */
  gridPrefs: Record<string, GridPreferences>;
  setGridCompactMode: (projectId: string, compact: boolean) => void;
  setGridShowFailedOnly: (projectId: string, showFailed: boolean) => void;
  getGridPrefs: (projectId: string) => GridPreferences;
}

const DEFAULT_NOTIFICATION_PREFS: NotificationPreferences = {
  emailMentions: true,
  pushAssignments: true,
  dailyDigest: false,
};

const DEFAULT_GRID_PREFS: GridPreferences = {
  compactMode: false,
  showFailedOnly: false,
};

export const useUIPreferencesStore = create<UIPreferencesState>()(
  persist(
    (set, get) => ({
      sidebarCollapsed: true,
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      notificationPrefs: DEFAULT_NOTIFICATION_PREFS,
      setNotificationPrefs: (prefs) => set({ notificationPrefs: prefs }),

      gridPrefs: {},
      setGridCompactMode: (projectId, compact) =>
        set((state) => ({
          gridPrefs: {
            ...state.gridPrefs,
            [projectId]: {
              ...(state.gridPrefs[projectId] ?? DEFAULT_GRID_PREFS),
              compactMode: compact,
            },
          },
        })),
      setGridShowFailedOnly: (projectId, showFailed) =>
        set((state) => ({
          gridPrefs: {
            ...state.gridPrefs,
            [projectId]: {
              ...(state.gridPrefs[projectId] ?? DEFAULT_GRID_PREFS),
              showFailedOnly: showFailed,
            },
          },
        })),
      getGridPrefs: (projectId) => get().gridPrefs[projectId] ?? DEFAULT_GRID_PREFS,
    }),
    {
      name: 'worktree-ui-preferences',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        notificationPrefs: state.notificationPrefs,
        gridPrefs: state.gridPrefs,
      }),
    },
  ),
);
