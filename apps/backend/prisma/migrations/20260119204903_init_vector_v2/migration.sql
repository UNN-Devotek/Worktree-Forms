/*
  Warnings:

  - Added the required column `projectId` to the `VectorEmbedding` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "VectorEmbedding" ADD COLUMN     "projectId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "VectorEmbedding_projectId_idx" ON "VectorEmbedding"("projectId");

-- AddForeignKey
ALTER TABLE "VectorEmbedding" ADD CONSTRAINT "VectorEmbedding_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
