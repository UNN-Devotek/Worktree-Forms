/*
  Warnings:

  - You are about to drop the column `vector` on the `VectorEmbedding` table. All the data in the column will be lost.
  - Added the required column `embedding` to the `VectorEmbedding` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "VectorEmbedding" DROP COLUMN "vector",
ADD COLUMN     "embedding" JSONB NOT NULL;
