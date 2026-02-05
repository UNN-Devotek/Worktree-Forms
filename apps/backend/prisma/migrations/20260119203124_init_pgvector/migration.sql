-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateTable
CREATE TABLE "VectorEmbedding" (
    "id" TEXT NOT NULL,
    "submissionId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "vector" vector(1536) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VectorEmbedding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VectorEmbedding_submissionId_idx" ON "VectorEmbedding"("submissionId");

-- AddForeignKey
ALTER TABLE "VectorEmbedding" ADD CONSTRAINT "VectorEmbedding_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
