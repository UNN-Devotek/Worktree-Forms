-- Enable RLS on core tables
ALTER TABLE "Project" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProjectMember" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Form" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Sheet" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Route" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Rfi" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Folder" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ChatChannel" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ChatMessage" ENABLE ROW LEVEL SECURITY;

-- Project Policies
-- Users can see/modify projects they are members of, or created
CREATE POLICY "Project_isolation" ON "Project"
  USING (
    id IN (SELECT "projectId" FROM "ProjectMember" WHERE "userId" = current_setting('app.current_user_id', true))
    OR
    "createdById" = current_setting('app.current_user_id', true)
  );

-- ProjectMember Policies
-- Users can see members of projects they belong to, or their own membership record
CREATE POLICY "ProjectMember_isolation" ON "ProjectMember"
  USING (
    "userId" = current_setting('app.current_user_id', true)
    OR
    "projectId" IN (SELECT "projectId" FROM "ProjectMember" WHERE "userId" = current_setting('app.current_user_id', true))
  );

-- Form Policies
CREATE POLICY "Form_isolation" ON "Form"
  USING (
    "projectId" IN (SELECT "projectId" FROM "ProjectMember" WHERE "userId" = current_setting('app.current_user_id', true))
  );

-- Sheet Policies
CREATE POLICY "Sheet_isolation" ON "Sheet"
  USING (
    "projectId" IN (SELECT "projectId" FROM "ProjectMember" WHERE "userId" = current_setting('app.current_user_id', true))
  );

-- Route Policies
CREATE POLICY "Route_isolation" ON "Route"
  USING (
    "projectId" IN (SELECT "projectId" FROM "ProjectMember" WHERE "userId" = current_setting('app.current_user_id', true))
  );

-- Rfi Policies
CREATE POLICY "Rfi_isolation" ON "Rfi"
  USING (
    "projectId" IN (SELECT "projectId" FROM "ProjectMember" WHERE "userId" = current_setting('app.current_user_id', true))
  );

-- Folder Policies
CREATE POLICY "Folder_isolation" ON "Folder"
  USING (
    "projectId" IN (SELECT "projectId" FROM "ProjectMember" WHERE "userId" = current_setting('app.current_user_id', true))
  );

-- ChatChannel Policies
CREATE POLICY "ChatChannel_isolation" ON "ChatChannel"
  USING (
    "projectId" IN (SELECT "projectId" FROM "ProjectMember" WHERE "userId" = current_setting('app.current_user_id', true))
  );

-- ChatMessage Policies
CREATE POLICY "ChatMessage_isolation" ON "ChatMessage"
  USING (
    "channelId" IN (
        SELECT id FROM "ChatChannel" WHERE "projectId" IN (
            SELECT "projectId" FROM "ProjectMember" WHERE "userId" = current_setting('app.current_user_id', true)
        )
    )
  );