-- Add taskType column to Task table
ALTER TABLE "Task" ADD COLUMN "taskType" TEXT NOT NULL DEFAULT 'GENERAL';
