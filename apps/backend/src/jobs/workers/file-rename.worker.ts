import { Worker } from 'bullmq';
import { StorageService } from '../../storage.js';
import { prisma } from '../../db.js';

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
};

new Worker('file-rename', async (job) => {
  const { oldPattern, newPattern } = job.data;
  const files = await prisma.fileUpload.findMany({
    where: { filename: { contains: oldPattern } },
  });

  for (const file of files) {
    const newFilename = file.filename.replace(oldPattern, newPattern);
    const newObjectKey = file.objectKey.replace(file.filename, newFilename);

    await StorageService.copyObject(file.objectKey, newObjectKey);
    await StorageService.deleteFile(file.objectKey);
    await prisma.fileUpload.update({
      where: { id: file.id },
      data: { filename: newFilename, objectKey: newObjectKey },
    });
  }

  console.log(`✅ Renamed ${files.length} files from "${oldPattern}" to "${newPattern}"`);
}, { connection });
