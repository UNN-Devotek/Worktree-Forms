-- CreateTable
CREATE TABLE "file_uploads" (
    "id" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "folder" TEXT NOT NULL DEFAULT 'uploads',
    "uploadedBy" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submissionId" INTEGER,

    CONSTRAINT "file_uploads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "file_uploads_objectKey_key" ON "file_uploads"("objectKey");

-- CreateIndex
CREATE INDEX "file_uploads_objectKey_idx" ON "file_uploads"("objectKey");

-- CreateIndex
CREATE INDEX "file_uploads_uploadedBy_idx" ON "file_uploads"("uploadedBy");

-- AddForeignKey
ALTER TABLE "file_uploads" ADD CONSTRAINT "file_uploads_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE SET NULL ON UPDATE CASCADE;
