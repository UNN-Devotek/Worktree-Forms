-- AlterTable
ALTER TABLE "Form" ADD COLUMN     "targetSheetId" TEXT;

-- AddForeignKey
ALTER TABLE "Form" ADD CONSTRAINT "Form_targetSheetId_fkey" FOREIGN KEY ("targetSheetId") REFERENCES "Sheet"("id") ON DELETE SET NULL ON UPDATE CASCADE;
