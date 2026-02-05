-- AlterTable
ALTER TABLE "Submission" ADD COLUMN     "form_version_id" INTEGER;

-- CreateTable
CREATE TABLE "FormVersion" (
    "id" SERIAL NOT NULL,
    "form_id" INTEGER NOT NULL,
    "version" INTEGER NOT NULL,
    "schema" JSONB NOT NULL,
    "changelog" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FormVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FormVersion_form_id_version_key" ON "FormVersion"("form_id", "version");

-- AddForeignKey
ALTER TABLE "FormVersion" ADD CONSTRAINT "FormVersion_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "Form"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_form_version_id_fkey" FOREIGN KEY ("form_version_id") REFERENCES "FormVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
