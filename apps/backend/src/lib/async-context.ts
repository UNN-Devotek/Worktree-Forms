import { AsyncLocalStorage } from 'async_hooks';

interface AsyncContext {
  userId?: string | null;
  projectId?: string | null;
}

export const asyncContext = new AsyncLocalStorage<AsyncContext>();

export function getAsyncContext() {
  return asyncContext.getStore() || {};
}

export function runWithContext<T>(context: AsyncContext, callback: () => T): T {
  return asyncContext.run(context, callback);
}
