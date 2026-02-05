-- AlterTable
ALTER TABLE "RouteStop" ADD COLUMN     "sheetRowId" TEXT;

-- AddForeignKey
ALTER TABLE "RouteStop" ADD CONSTRAINT "RouteStop_sheetRowId_fkey" FOREIGN KEY ("sheetRowId") REFERENCES "SheetRow"("id") ON DELETE SET NULL ON UPDATE CASCADE;
