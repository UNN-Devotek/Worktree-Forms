DROP POLICY "insert_project_member" ON "ProjectMember";

CREATE POLICY "insert_project_member" ON "ProjectMember" FOR INSERT
WITH CHECK (
  "userId" = current_setting('app.current_user_id', true)::text
);