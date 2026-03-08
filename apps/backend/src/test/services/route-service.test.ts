import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('nanoid', () => ({ nanoid: vi.fn().mockReturnValue('route-nanoid-001') }));

vi.mock('../../lib/dynamo/index.js', () => ({
  ProjectEntity: {
    get: vi.fn(),
    query: { bySlug: vi.fn() },
  },
  RouteEntity: {
    create: vi.fn(),
    query: { byProject: vi.fn() },
  },
  RouteStopEntity: {
    get: vi.fn(),
    create: vi.fn(),
    patch: vi.fn(),
    query: { primary: vi.fn() },
  },
}));

import { RouteService } from '../../services/route-service.js';
import { ProjectEntity, RouteEntity, RouteStopEntity } from '../../lib/dynamo/index.js';

const mockProject = ProjectEntity as {
  get: ReturnType<typeof vi.fn>;
  query: { bySlug: ReturnType<typeof vi.fn> };
};
const mockRoute = RouteEntity as {
  create: ReturnType<typeof vi.fn>;
  query: { byProject: ReturnType<typeof vi.fn> };
};
const mockStop = RouteStopEntity as {
  get: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
  patch: ReturnType<typeof vi.fn>;
  query: { primary: ReturnType<typeof vi.fn> };
};

describe('RouteService', () => {
  beforeEach(() => vi.clearAllMocks());

  // ─── getDailyRoute ─────────────────────────────────────────────────────────

  describe('getDailyRoute', () => {
    it('[P0] resolves by projectId directly when project is found', async () => {
      mockProject.get.mockReturnValue({
        go: vi.fn().mockResolvedValue({ data: { projectId: 'proj-1' } }),
      });
      mockRoute.query.byProject.mockReturnValue({
        go: vi.fn().mockResolvedValue({
          data: [
            { routeId: 'r1', assignedTo: 'user-1', scheduledDate: '2026-03-10T08:00:00Z' },
          ],
        }),
      });
      mockStop.query.primary.mockReturnValue({
        go: vi.fn().mockResolvedValue({ data: [] }),
      });

      const result = await RouteService.getDailyRoute('proj-1', 'user-1', new Date('2026-03-10'));
      expect(result).not.toBeNull();
      expect(result?.routeId).toBe('r1');
    });

    it('[P0] falls back to slug lookup when projectId lookup returns null', async () => {
      mockProject.get.mockReturnValue({ go: vi.fn().mockResolvedValue({ data: null }) });
      mockProject.query.bySlug.mockReturnValue({
        go: vi.fn().mockResolvedValue({ data: [{ projectId: 'proj-from-slug' }] }),
      });
      mockRoute.query.byProject.mockReturnValue({
        go: vi.fn().mockResolvedValue({
          data: [{ routeId: 'r2', assignedTo: 'user-1', scheduledDate: '2026-03-10T00:00:00Z' }],
        }),
      });
      mockStop.query.primary.mockReturnValue({ go: vi.fn().mockResolvedValue({ data: [] }) });

      const result = await RouteService.getDailyRoute('my-slug', 'user-1', new Date('2026-03-10'));
      expect(mockProject.query.bySlug).toHaveBeenCalledWith({ slug: 'my-slug' });
      expect(result?.routeId).toBe('r2');
    });

    it('[P0] throws when neither projectId nor slug resolve', async () => {
      mockProject.get.mockReturnValue({ go: vi.fn().mockResolvedValue({ data: null }) });
      mockProject.query.bySlug.mockReturnValue({ go: vi.fn().mockResolvedValue({ data: [] }) });

      await expect(RouteService.getDailyRoute('bad-slug', 'user-1', new Date())).rejects.toThrow(
        'Project not found'
      );
    });

    it('[P0] returns null when no route matches user + date', async () => {
      mockProject.get.mockReturnValue({
        go: vi.fn().mockResolvedValue({ data: { projectId: 'proj-1' } }),
      });
      mockRoute.query.byProject.mockReturnValue({
        go: vi.fn().mockResolvedValue({
          data: [
            // different user
            { routeId: 'r1', assignedTo: 'other-user', scheduledDate: '2026-03-10T00:00:00Z' },
          ],
        }),
      });

      const result = await RouteService.getDailyRoute('proj-1', 'user-1', new Date('2026-03-10'));
      expect(result).toBeNull();
    });

    it('[P1] stops are sorted by order ascending', async () => {
      mockProject.get.mockReturnValue({
        go: vi.fn().mockResolvedValue({ data: { projectId: 'proj-1' } }),
      });
      mockRoute.query.byProject.mockReturnValue({
        go: vi.fn().mockResolvedValue({
          data: [{ routeId: 'r1', assignedTo: 'user-1', scheduledDate: '2026-03-10T00:00:00Z' }],
        }),
      });
      mockStop.query.primary.mockReturnValue({
        go: vi.fn().mockResolvedValue({
          data: [
            { stopId: 's3', order: 2 },
            { stopId: 's1', order: 0 },
            { stopId: 's2', order: 1 },
          ],
        }),
      });

      const result = await RouteService.getDailyRoute('proj-1', 'user-1', new Date('2026-03-10'));
      expect(result?.stops[0].stopId).toBe('s1');
      expect(result?.stops[1].stopId).toBe('s2');
      expect(result?.stops[2].stopId).toBe('s3');
    });
  });

  // ─── createRoute ───────────────────────────────────────────────────────────

  describe('createRoute', () => {
    it('[P0] creates a route with PUBLISHED status', async () => {
      mockRoute.create.mockReturnValue({
        go: vi.fn().mockResolvedValue({ data: { routeId: 'route-nanoid-001' } }),
      });
      mockStop.create.mockReturnValue({ go: vi.fn().mockResolvedValue({ data: { stopId: 'stop-1' } }) });

      const result = await RouteService.createRoute('proj-1', 'user-1', new Date('2026-03-10'), [
        { title: 'HQ', address: '123 Main St', latitude: 40.7, longitude: -74.0 },
      ]);

      const routeArg = mockRoute.create.mock.calls[0][0];
      expect(routeArg.projectId).toBe('proj-1');
      expect(routeArg.assignedTo).toBe('user-1');
      expect(routeArg.status).toBe('PUBLISHED');
      expect(result.stops).toHaveLength(1);
    });

    it('[P0] creates a stop per entry with sequential order index', async () => {
      mockRoute.create.mockReturnValue({ go: vi.fn().mockResolvedValue({ data: {} }) });
      mockStop.create.mockReturnValue({ go: vi.fn().mockResolvedValue({ data: {} }) });

      await RouteService.createRoute('proj-1', 'user-1', new Date(), [
        { title: 'Stop A' },
        { title: 'Stop B' },
        { title: 'Stop C' },
      ]);

      expect(mockStop.create).toHaveBeenCalledTimes(3);
      expect(mockStop.create.mock.calls[0][0].order).toBe(0);
      expect(mockStop.create.mock.calls[1][0].order).toBe(1);
      expect(mockStop.create.mock.calls[2][0].order).toBe(2);
    });

    it('[P1] route name includes a date in YYYY-MM-DD format', async () => {
      mockRoute.create.mockReturnValue({ go: vi.fn().mockResolvedValue({ data: {} }) });

      await RouteService.createRoute('proj-1', 'user-1', new Date(), []);

      const arg = mockRoute.create.mock.calls[0][0];
      // Name should be "Route for YYYY-MM-DD"
      expect(arg.name).toMatch(/^Route for \d{4}-\d{2}-\d{2}$/);
    });

    it('[P1] stop defaults to "Stop N" when title is absent', async () => {
      mockRoute.create.mockReturnValue({ go: vi.fn().mockResolvedValue({ data: {} }) });
      mockStop.create.mockReturnValue({ go: vi.fn().mockResolvedValue({ data: {} }) });

      await RouteService.createRoute('proj-1', 'user-1', new Date(), [{}]);

      const stopArg = mockStop.create.mock.calls[0][0];
      expect(stopArg.name).toBe('Stop 1');
    });
  });

  // ─── getStop ───────────────────────────────────────────────────────────────

  describe('getStop', () => {
    it('[P0] retrieves a stop by routeId and stopId', async () => {
      const stop = { stopId: 's1', routeId: 'r1', name: 'HQ' };
      mockStop.get.mockReturnValue({ go: vi.fn().mockResolvedValue({ data: stop }) });

      const result = await RouteService.getStop('r1', 's1');
      expect(result).toEqual(stop);
      expect(mockStop.get).toHaveBeenCalledWith({ routeId: 'r1', stopId: 's1' });
    });

    it('[P1] returns null/undefined when stop not found', async () => {
      mockStop.get.mockReturnValue({ go: vi.fn().mockResolvedValue({ data: null }) });
      const result = await RouteService.getStop('r1', 'missing');
      expect(result).toBeNull();
    });
  });

  // ─── updateStopStatus ──────────────────────────────────────────────────────

  describe('updateStopStatus', () => {
    function mockStopExists(data = { stopId: 's1', routeId: 'r1' }) {
      mockStop.get.mockReturnValue({ go: vi.fn().mockResolvedValue({ data }) });
    }

    it('[P0] throws when stop is not found', async () => {
      mockStop.get.mockReturnValue({ go: vi.fn().mockResolvedValue({ data: null }) });
      await expect(RouteService.updateStopStatus('r1', 's-bad', 'PENDING')).rejects.toThrow(
        'Stop not found'
      );
    });

    it('[P0] throws for invalid status', async () => {
      mockStopExists();
      await expect(RouteService.updateStopStatus('r1', 's1', 'INVALID_STATUS')).rejects.toThrow(
        /Invalid status/
      );
    });

    it('[P0] accepts valid status and patches', async () => {
      mockStopExists();
      const mockSet = vi.fn().mockReturnValue({ go: vi.fn().mockResolvedValue({}) });
      mockStop.patch.mockReturnValue({ set: mockSet });
      mockStop.get
        .mockReturnValueOnce({ go: vi.fn().mockResolvedValue({ data: { stopId: 's1' } }) })
        .mockReturnValueOnce({ go: vi.fn().mockResolvedValue({ data: { stopId: 's1', status: 'EN_ROUTE' } }) });

      const result = await RouteService.updateStopStatus('r1', 's1', 'EN_ROUTE');
      const setArg = mockSet.mock.calls[0][0];
      expect(setArg.status).toBe('EN_ROUTE');
      expect(result?.status).toBe('EN_ROUTE');
    });

    it('[P0] sets completedAt when status is COMPLETED and it was not already set', async () => {
      // No completedAt on existing stop
      mockStop.get
        .mockReturnValueOnce({ go: vi.fn().mockResolvedValue({ data: { stopId: 's1' } }) })
        .mockReturnValueOnce({ go: vi.fn().mockResolvedValue({ data: {} }) });
      const mockSet = vi.fn().mockReturnValue({ go: vi.fn().mockResolvedValue({}) });
      mockStop.patch.mockReturnValue({ set: mockSet });

      await RouteService.updateStopStatus('r1', 's1', 'COMPLETED');
      const setArg = mockSet.mock.calls[0][0];
      expect(setArg.completedAt).toBeDefined();
    });

    it('[P1] does NOT overwrite completedAt if already set', async () => {
      mockStop.get
        .mockReturnValueOnce({
          go: vi.fn().mockResolvedValue({ data: { stopId: 's1', completedAt: '2026-01-01T00:00:00Z' } }),
        })
        .mockReturnValueOnce({ go: vi.fn().mockResolvedValue({ data: {} }) });
      const mockSet = vi.fn().mockReturnValue({ go: vi.fn().mockResolvedValue({}) });
      mockStop.patch.mockReturnValue({ set: mockSet });

      await RouteService.updateStopStatus('r1', 's1', 'COMPLETED');
      const setArg = mockSet.mock.calls[0][0];
      expect(setArg.completedAt).toBeUndefined();
    });

    it('[P1] normalizes hyphenated status (e.g., EN-ROUTE → EN_ROUTE)', async () => {
      mockStopExists();
      const mockSet = vi.fn().mockReturnValue({ go: vi.fn().mockResolvedValue({}) });
      mockStop.patch.mockReturnValue({ set: mockSet });
      mockStop.get
        .mockReturnValueOnce({ go: vi.fn().mockResolvedValue({ data: { stopId: 's1' } }) })
        .mockReturnValueOnce({ go: vi.fn().mockResolvedValue({ data: {} }) });

      await RouteService.updateStopStatus('r1', 's1', 'EN-ROUTE');
      const setArg = mockSet.mock.calls[0][0];
      expect(setArg.status).toBe('EN_ROUTE');
    });

    it('[P1] stores location when provided', async () => {
      mockStopExists();
      const mockSet = vi.fn().mockReturnValue({ go: vi.fn().mockResolvedValue({}) });
      mockStop.patch.mockReturnValue({ set: mockSet });
      mockStop.get
        .mockReturnValueOnce({ go: vi.fn().mockResolvedValue({ data: { stopId: 's1' } }) })
        .mockReturnValueOnce({ go: vi.fn().mockResolvedValue({ data: {} }) });

      await RouteService.updateStopStatus('r1', 's1', 'ARRIVED', { lat: 51.5, lng: -0.12 });
      const setArg = mockSet.mock.calls[0][0];
      expect(setArg.latitude).toBe(51.5);
      expect(setArg.longitude).toBe(-0.12);
    });
  });
});
