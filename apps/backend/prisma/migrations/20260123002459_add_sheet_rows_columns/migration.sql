/*
  Warnings:

  - You are about to drop the column `nocodbTableId` on the `Sheet` table. All the data in the column will be lost.
  - You are about to drop the column `nocodbViewId` on the `Sheet` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Sheet" DROP COLUMN "nocodbTableId",
DROP COLUMN "nocodbViewId";

-- CreateTable
CREATE TABLE "SheetColumn" (
    "id" TEXT NOT NULL,
    "sheetId" TEXT NOT NULL,
    "header" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "options" JSONB,
    "size" INTEGER NOT NULL DEFAULT 150,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SheetColumn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SheetRow" (
    "id" TEXT NOT NULL,
    "sheetId" TEXT NOT NULL,
    "parentId" TEXT,
    "data" JSONB NOT NULL,
    "rank" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SheetRow_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SheetColumn" ADD CONSTRAINT "SheetColumn_sheetId_fkey" FOREIGN KEY ("sheetId") REFERENCES "Sheet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SheetRow" ADD CONSTRAINT "SheetRow_sheetId_fkey" FOREIGN KEY ("sheetId") REFERENCES "Sheet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SheetRow" ADD CONSTRAINT "SheetRow_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "SheetRow"("id") ON DELETE SET NULL ON UPDATE CASCADE;
