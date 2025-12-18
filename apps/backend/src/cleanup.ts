import { PrismaClient } from '@prisma/client';
import { StorageService } from './storage.js';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function cleanup() {
  console.log('🧹 Starting cleanup...\n');

  try {
    // Step 1: Get all file uploads
    console.log('📁 Fetching all file uploads...');
    const files = await prisma.fileUpload.findMany({
      select: {
        id: true,
        objectKey: true,
        filename: true
      }
    });
    console.log(`   Found ${files.length} files\n`);

    // Step 2: Delete files from MinIO
    if (files.length > 0) {
      console.log('🗑️  Deleting files from MinIO...');
      let deletedCount = 0;
      let errorCount = 0;

      for (const file of files) {
        try {
          await StorageService.deleteFile(file.objectKey);
          deletedCount++;
          if (deletedCount % 10 === 0) {
            console.log(`   Deleted ${deletedCount}/${files.length} files...`);
          }
        } catch (error) {
          errorCount++;
          console.error(`   ⚠️  Failed to delete ${file.objectKey}:`, error instanceof Error ? error.message : error);
        }
      }
      console.log(`   ✅ Deleted ${deletedCount} files from MinIO (${errorCount} errors)\n`);
    }

    // Step 3: Delete all file upload records from database
    console.log('🗄️  Deleting file upload records from database...');
    const deletedFiles = await prisma.fileUpload.deleteMany({});
    console.log(`   ✅ Deleted ${deletedFiles.count} file upload records\n`);

    // Step 4: Delete all submissions from database
    console.log('📝 Deleting all submissions...');
    const deletedSubmissions = await prisma.submission.deleteMany({});
    console.log(`   ✅ Deleted ${deletedSubmissions.count} submissions\n`);

    // Step 5: Delete all forms from database
    console.log('📋 Deleting all forms...');
    const deletedForms = await prisma.form.deleteMany({});
    console.log(`   ✅ Deleted ${deletedForms.count} forms\n`);

    // Step 6: Delete all folders (optional)
    console.log('📂 Deleting all folders...');
    const deletedFolders = await prisma.folder.deleteMany({});
    console.log(`   ✅ Deleted ${deletedFolders.count} folders\n`);

    console.log('✅ Cleanup complete!\n');
    console.log('Summary:');
    console.log(`   - Files deleted from MinIO: ${files.length}`);
    console.log(`   - File records deleted: ${deletedFiles.count}`);
    console.log(`   - Submissions deleted: ${deletedSubmissions.count}`);
    console.log(`   - Forms deleted: ${deletedForms.count}`);
    console.log(`   - Folders deleted: ${deletedFolders.count}`);

  } catch (error) {
    console.error('\n❌ Cleanup failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run cleanup
cleanup()
  .then(() => {
    console.log('\n🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
