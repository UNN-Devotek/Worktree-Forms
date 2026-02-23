-- Add GIN index on Submission.data for fast JSONB queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Submission_data_gin_idx"
ON "Submission" USING gin (data jsonb_path_ops);
