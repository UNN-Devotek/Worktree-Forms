import { Worker } from 'bullmq';
import { StorageService } from '../../storage.js';
import { FileUploadEntity } from '../../lib/dynamo/index.js';

const _redisUrl = process.env.REDIS_URL;
const _parsed = _redisUrl ? new URL(_redisUrl) : null;
const connection = {
  host: _parsed?.hostname || process.env.REDIS_HOST || 'redis',
  port: _parsed ? parseInt(_parsed.port || '6379') : parseInt(process.env.REDIS_PORT || '6379'),
  ...(_parsed?.password ? { password: decodeURIComponent(_parsed.password) } : {}),
};

new Worker(
  'file-rename',
  async (job) => {
    const { oldPattern, newPattern } = job.data;

    // Scan for files matching the old pattern
    const result = await FileUploadEntity.scan
      .where((attr, op) => op.contains(attr.originalName, oldPattern))
      .go();

    const files = result.data;
    for (const file of files) {
      const newFilename = (file.originalName ?? '').replace(oldPattern, newPattern);
      const newObjectKey = file.objectKey.replace(file.originalName ?? '', newFilename);

      await StorageService.copyObject(file.objectKey, newObjectKey);
      await StorageService.deleteFile(file.objectKey);
      await FileUploadEntity.patch({ projectId: file.projectId, fileId: file.fileId })
        .set({ originalName: newFilename, objectKey: newObjectKey })
        .go();
    }

    console.log(`Renamed ${files.length} files from "${oldPattern}" to "${newPattern}"`);
  },
  { connection },
);
