-- Fix UserPreference unique constraint to handle NULL projectId correctly.
-- PostgreSQL treats NULL != NULL for unique constraints, so
-- @@unique([userId, key, projectId]) allows multiple rows with projectId = NULL.
-- We replace it with two partial unique indexes.

-- Drop the Prisma-generated composite unique index
DROP INDEX IF EXISTS "UserPreference_userId_key_projectId_key";

-- Enforce uniqueness for global preferences (no project context)
CREATE UNIQUE INDEX "user_preference_global_unique"
  ON "UserPreference" ("userId", "key")
  WHERE "projectId" IS NULL;

-- Enforce uniqueness for project-scoped preferences
CREATE UNIQUE INDEX "user_preference_project_unique"
  ON "UserPreference" ("userId", "key", "projectId")
  WHERE "projectId" IS NOT NULL;
