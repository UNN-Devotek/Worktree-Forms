import { PrismaClient } from '@prisma/client';
import { getAsyncContext } from './lib/async-context';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const prismaBase =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prismaBase;

export const prisma = prismaBase.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const context = getAsyncContext();
        // If no user context, just run query (RLS will default to blocking if policy requires user)
        // Or if table has no RLS, it works fine.
        if (!context.userId) {
             return query(args);
        }

        // Wrap in transaction to set local variable
        try {
            return await prismaBase.$transaction(async (tx) => {
                // Set the variable
                await tx.$executeRaw`SELECT set_config('app.current_user_id', ${context.userId}, true)`;
                
                // Execute the original query using the transaction client
                // Note: 'query(args)' uses the *original* client context, not 'tx'.
                // So we cannot use 'query(args)'. We must use 'tx[model][operation](args)'.
                // However, 'tx' is the *base* client (without extension) inside $transaction? 
                // Yes, if prismaBase is used.
                
                // Limitation: If we use tx[model][operation], we lose other extensions if they exist.
                // But here we are defining the *only* extension.
                
                /**
                 * Dynamic table access: tx[model][operation](args) requires `any` cast
                 * because PrismaClient's transaction type doesn't expose models as
                 * indexable properties. This is the standard pattern for Prisma
                 * extensions that need to re-execute queries on the transaction client.
                 */
                return (tx as any)[model][operation](args);
            });
        } catch (e) {
            console.error("RLS Transaction Error", e);
            throw e;
        }
      },
    },
  },
});

