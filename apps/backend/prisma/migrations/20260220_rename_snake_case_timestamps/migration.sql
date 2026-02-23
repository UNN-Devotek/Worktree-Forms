-- Rename snake_case timestamp columns to camelCase for consistency
-- Affected tables: Form, FormVersion, Submission

ALTER TABLE "Form" RENAME COLUMN "created_at" TO "createdAt";
ALTER TABLE "Form" RENAME COLUMN "updated_at" TO "updatedAt";

ALTER TABLE "FormVersion" RENAME COLUMN "created_at" TO "createdAt";

ALTER TABLE "Submission" RENAME COLUMN "created_at" TO "createdAt";
ALTER TABLE "Submission" RENAME COLUMN "updated_at" TO "updatedAt";
