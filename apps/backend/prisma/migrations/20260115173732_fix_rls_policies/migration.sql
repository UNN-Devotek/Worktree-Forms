-- Project: Allow INSERT (Anyone can create)
CREATE POLICY "insert_project" ON "Project" FOR INSERT WITH CHECK (true);

-- Project: Allow UPDATE (Owner only)
CREATE POLICY "update_project" ON "Project" FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM "ProjectMember"
    WHERE "projectId" = "Project".id
    AND "userId" = current_setting('app.current_user_id', true)::text
    AND 'OWNER' = ANY("roles")
  )
);

-- ProjectMember: Allow INSERT (Self-bootstrap OR Owner invite)
CREATE POLICY "insert_project_member" ON "ProjectMember" FOR INSERT
WITH CHECK (
  (
    "userId" = current_setting('app.current_user_id', true)::text
    AND
    NOT EXISTS (SELECT 1 FROM "ProjectMember" pm WHERE pm."projectId" = "ProjectMember"."projectId")
  )
  OR
  (
    EXISTS (
      SELECT 1 FROM "ProjectMember" pm
      WHERE pm."projectId" = "ProjectMember"."projectId"
      AND pm."userId" = current_setting('app.current_user_id', true)::text
      AND 'OWNER' = ANY(pm.roles)
    )
  )
);

-- ProjectMember: Update/Delete (Owner only)
CREATE POLICY "modify_project_member" ON "ProjectMember"
USING (
  EXISTS (
    SELECT 1 FROM "ProjectMember" pm
    WHERE pm."projectId" = "ProjectMember"."projectId"
    AND pm."userId" = current_setting('app.current_user_id', true)::text
    AND 'OWNER' = ANY(pm.roles)
  )
);

-- Form: Insert (Member of Project)
CREATE POLICY "insert_form" ON "Form" FOR INSERT
WITH CHECK (
  "projectId" = current_setting('app.current_project_id', true)::text
  AND
  EXISTS (
    SELECT 1 FROM "ProjectMember"
    WHERE "projectId" = "Form"."projectId"
    AND "userId" = current_setting('app.current_user_id', true)::text
  )
);

-- Form: Update/Delete (Member)
CREATE POLICY "modify_form" ON "Form"
USING (
  "projectId" = current_setting('app.current_project_id', true)::text
  AND
  EXISTS (
    SELECT 1 FROM "ProjectMember" pm
    WHERE pm."projectId" = "Form"."projectId"
    AND pm."userId" = current_setting('app.current_user_id', true)::text
  )
);

-- Submission: Insert (Access via Form)
CREATE POLICY "insert_submission" ON "Submission" FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "Form" f
    WHERE f.id = "Submission"."form_id"
    AND f."projectId" = current_setting('app.current_project_id', true)::text
  )
);