-- Add index on FormVersion.form_id for faster lookups by form
-- The @@unique([form_id, version]) already covers queries using both fields,
-- but an explicit index on form_id alone improves queries that filter only by form_id.
CREATE INDEX IF NOT EXISTS "FormVersion_form_id_idx" ON "FormVersion"("form_id");
