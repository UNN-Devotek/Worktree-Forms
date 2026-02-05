DROP POLICY "modify_project_member" ON "ProjectMember";

CREATE POLICY "update_project_member" ON "ProjectMember" FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM "ProjectMember" pm
    WHERE pm."projectId" = "ProjectMember"."projectId"
    AND pm."userId" = current_setting('app.current_user_id', true)::text
    AND 'OWNER' = ANY(pm.roles)
  )
);

CREATE POLICY "delete_project_member" ON "ProjectMember" FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM "ProjectMember" pm
    WHERE pm."projectId" = "ProjectMember"."projectId"
    AND pm."userId" = current_setting('app.current_user_id', true)::text
    AND 'OWNER' = ANY(pm.roles)
  )
);