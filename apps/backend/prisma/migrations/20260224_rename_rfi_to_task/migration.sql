-- Rename table Rfi -> Task
ALTER TABLE "Rfi" RENAME TO "Task";

-- Rename primary key constraint
ALTER TABLE "Task" RENAME CONSTRAINT "Rfi_pkey" TO "Task_pkey";

-- Rename foreign key constraints
ALTER TABLE "Task" RENAME CONSTRAINT "Rfi_projectId_fkey" TO "Task_projectId_fkey";
ALTER TABLE "Task" RENAME CONSTRAINT "Rfi_createdById_fkey" TO "Task_createdById_fkey";
ALTER TABLE "Task" RENAME CONSTRAINT "Rfi_assignedToId_fkey" TO "Task_assignedToId_fkey";

-- Rename the autoincrement sequence for the number column
ALTER SEQUENCE "Rfi_number_seq" RENAME TO "Task_number_seq";

-- Update RLS policy name (drop old, recreate with new table reference)
DROP POLICY IF EXISTS "Rfi_isolation" ON "Task";
CREATE POLICY "Task_isolation" ON "Task"
  USING (
    "projectId" IN (
      SELECT "projectId" FROM "ProjectMember"
      WHERE "userId" = current_setting('app.current_user_id', true)
    )
    OR current_setting('app.bypass_rls', true) = 'true'
  );
