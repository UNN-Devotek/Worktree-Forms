-- AlterTable
ALTER TABLE "Sheet" ADD COLUMN     "nocodbTableId" TEXT,
ADD COLUMN     "nocodbViewId" TEXT;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "complianceStatus" SET DEFAULT 'PENDING';
