/*
  Warnings:

  - Added the required column `createdById` to the `Project` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "createdById" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RLS Updates
DROP POLICY "select_own_projects" ON "Project";

CREATE POLICY "select_own_projects" ON "Project" FOR SELECT
USING (
  "createdById" = current_setting('app.current_user_id', true)::text
  OR
  EXISTS (
    SELECT 1 FROM "ProjectMember" pm
    WHERE pm."projectId" = "Project"."id"
    AND pm."userId" = current_setting('app.current_user_id', true)::text
  )
);

DROP POLICY "owner_delete_project" ON "Project";

CREATE POLICY "owner_delete_project" ON "Project" FOR DELETE
USING (
  "createdById" = current_setting('app.current_user_id', true)::text
  OR
  EXISTS (
    SELECT 1 FROM "ProjectMember" pm
    WHERE pm."projectId" = "Project"."id"
    AND pm."userId" = current_setting('app.current_user_id', true)::text
    AND 'OWNER' = ANY(pm.roles)
  )
);
