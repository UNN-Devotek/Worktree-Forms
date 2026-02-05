/*
  Warnings:

  - You are about to drop the column `password` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Folder" ADD COLUMN     "projectId" TEXT;

-- AlterTable
ALTER TABLE "Form" ADD COLUMN     "projectId" TEXT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "password",
DROP COLUMN "role";

-- AddForeignKey
ALTER TABLE "Folder" ADD CONSTRAINT "Folder_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Form" ADD CONSTRAINT "Form_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Enable RLS
ALTER TABLE "Project" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProjectMember" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Form" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Submission" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Folder" ENABLE ROW LEVEL SECURITY;

-- 1. Project Policy: View projects I am a member of
CREATE POLICY "select_own_projects" ON "Project"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "ProjectMember"
            WHERE "projectId" = "Project".id
            AND "userId" = current_setting('app.current_user_id', true)::text
        )
    );

-- 2. Project Policy: Delete only if Owner
CREATE POLICY "owner_delete_project" ON "Project"
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM "ProjectMember"
            WHERE "projectId" = "Project".id
            AND "userId" = current_setting('app.current_user_id', true)::text
            AND 'OWNER' = ANY("roles")
        )
    );

-- 3. Form Policy: Isolation via Project ID
CREATE POLICY "tenant_isolation_form" ON "Form"
    USING ("projectId" = current_setting('app.current_project_id', true)::text);

-- 4. Folder Policy: Isolation via Project ID
CREATE POLICY "tenant_isolation_folder" ON "Folder"
    USING ("projectId" = current_setting('app.current_project_id', true)::text);

-- 5. Submission Policy: Isolation via Form's Project ID
-- Note: Submissions are accessed via Form context usually.
CREATE POLICY "tenant_isolation_submission" ON "Submission"
    USING (
        EXISTS (
            SELECT 1 FROM "Form"
            WHERE "Form".id = "Submission"."form_id"
            AND "Form"."projectId" = current_setting('app.current_project_id', true)::text
        )
    );

-- 6. ProjectMember Policy: View members of current project context OR my own memberships
-- This allows (A) Listing users in Dashboard (current_project_id set) 
-- and (B) Finding my permitted projects (initial load, no project_id set) is handled above by Project query? 
-- Actually, to list my projects, I don't query ProjectMember directly usually, I find projects where I am member.
-- But for "Dashboard > Users", I query ProjectMember.
CREATE POLICY "tenant_isolation_member" ON "ProjectMember"
    USING (
        "projectId" = current_setting('app.current_project_id', true)::text
        OR
        "userId" = current_setting('app.current_user_id', true)::text
    );

