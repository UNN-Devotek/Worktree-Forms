-- Add ownerId to Sheet table
ALTER TABLE "Sheet" ADD COLUMN "ownerId" TEXT;

-- Add foreign key constraint (SET NULL on delete so deleting a user doesn't cascade-delete their sheets)
ALTER TABLE "Sheet" ADD CONSTRAINT "Sheet_ownerId_fkey"
  FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Index for efficient lookups by owner
CREATE INDEX "Sheet_ownerId_idx" ON "Sheet"("ownerId");
