-- Add new fields to Task table
ALTER TABLE "Task" ADD COLUMN "priority"    TEXT NOT NULL DEFAULT 'MEDIUM';
ALTER TABLE "Task" ADD COLUMN "startDate"   TIMESTAMP(3);
ALTER TABLE "Task" ADD COLUMN "endDate"     TIMESTAMP(3);
ALTER TABLE "Task" ADD COLUMN "assignees"   JSONB;
ALTER TABLE "Task" ADD COLUMN "attachments" JSONB;
ALTER TABLE "Task" ADD COLUMN "mentions"    JSONB;

-- Migrate legacy status values to new vocabulary
UPDATE "Task" SET "status" = 'ACTIVE'    WHERE "status" = 'OPEN';
UPDATE "Task" SET "status" = 'COMPLETED' WHERE "status" = 'CLOSED';
