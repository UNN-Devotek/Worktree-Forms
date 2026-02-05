import imageCompression from 'browser-image-compression';

export class ImageOptimizer {
  /**
   * Compresses an image file for optimized upload.
   * Target: Max 1920x1080, ~0.8 Quality, Max 2MB (approx).
   */
  static async compress(file: File): Promise<File> {
    // Only compress images
    if (!file.type.startsWith('image/')) {
      return file;
    }

    const options = {
      maxSizeMB: 2, // 2MB max size
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      initialQuality: 0.8,
      fileType: file.type as string
    };

    try {
      const compressedBlob = await imageCompression(file, options);
      
      // imageCompression returns a Blob, we need to convert back to File to preserve properties
      return new File([compressedBlob], file.name, {
        type: compressedBlob.type,
        lastModified: Date.now()
      });
    } catch (error) {
      console.error('Image compression failed:', error);
      // Fallback: return original file if compression fails
      return file;
    }
  }

  /**
   * Renames a file to a standard format: {FieldName}_{ProjectSlug}_{Date}.ext
   */
  static rename(file: File, fieldName: string, projectSlug: string): File {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safeFieldName = fieldName.replace(/[^a-zA-Z0-9-_]/g, '_');
    const safeProject = projectSlug.replace(/[^a-zA-Z0-9-_]/g, '_');
    
    // Extract extension
    const extension = file.name.split('.').pop() || 'jpg';
    
    const newName = `${safeFieldName}_${safeProject}_${timestamp}.${extension}`;

    return new File([file], newName, {
      type: file.type,
      lastModified: file.lastModified
    });
  }
}
