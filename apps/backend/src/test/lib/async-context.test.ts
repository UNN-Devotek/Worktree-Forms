import { describe, it, expect } from 'vitest';
import { getAsyncContext, runWithContext } from '../../lib/async-context.js';

describe('async-context', () => {
  describe('getAsyncContext', () => {
    it('[P0] returns empty object when called outside any context', () => {
      const ctx = getAsyncContext();
      expect(ctx).toEqual({});
    });
  });

  describe('runWithContext', () => {
    it('[P0] returns the callback return value', () => {
      const result = runWithContext({ userId: 'u1' }, () => 42);
      expect(result).toBe(42);
    });

    it('[P0] getAsyncContext returns the userId set by runWithContext', () => {
      runWithContext({ userId: 'user-abc' }, () => {
        const ctx = getAsyncContext();
        expect(ctx.userId).toBe('user-abc');
      });
    });

    it('[P0] getAsyncContext returns projectId when set', () => {
      runWithContext({ userId: 'u1', projectId: 'proj-xyz' }, () => {
        const ctx = getAsyncContext();
        expect(ctx.projectId).toBe('proj-xyz');
      });
    });

    it('[P1] context is isolated — inner context does not leak outside', () => {
      runWithContext({ userId: 'inner-user' }, () => {
        // Inside: should see inner-user
        expect(getAsyncContext().userId).toBe('inner-user');
      });
      // Outside: no longer in context
      expect(getAsyncContext().userId).toBeUndefined();
    });

    it('[P1] nested runWithContext creates independent inner context', () => {
      runWithContext({ userId: 'outer' }, () => {
        expect(getAsyncContext().userId).toBe('outer');

        runWithContext({ userId: 'inner' }, () => {
          expect(getAsyncContext().userId).toBe('inner');
        });

        // Outer context restored after inner finishes
        expect(getAsyncContext().userId).toBe('outer');
      });
    });

    it('[P1] works with async callbacks via Promise resolution', async () => {
      const result = await runWithContext({ userId: 'async-user' }, async () => {
        await Promise.resolve(); // simulate async tick
        return getAsyncContext().userId;
      });
      expect(result).toBe('async-user');
    });

    it('[P1] null userId is stored and retrievable', () => {
      runWithContext({ userId: null }, () => {
        expect(getAsyncContext().userId).toBeNull();
      });
    });
  });
});
