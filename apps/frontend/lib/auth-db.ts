import { db } from "./db";

export function getAuthenticatedDb(userId: string, projectId?: string) {
  return db.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          return db.$transaction(async (tx) => {
            console.log(`[AuthDB] Setting user=${userId}, proj=${projectId||''}`);
            // Switch to restrict role to enforce RLS
            await tx.$executeRawUnsafe(`SET LOCAL ROLE "app_user"`);
            await tx.$executeRaw`
              SELECT set_config('app.current_user_id', ${userId}, TRUE), 
                     set_config('app.current_project_id', ${projectId || ''}, TRUE)
            `;
            
            if (model && operation) {
               const delegate = model.charAt(0).toLowerCase() + model.slice(1);
               return (tx as any)[delegate][operation](args);
            }
            return (query as any)(args);
          });
        },
      },
    },
  });
}
