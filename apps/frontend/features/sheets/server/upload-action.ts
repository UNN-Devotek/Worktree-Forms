'use server';

import { nocoDBService } from '@/lib/nocodb.service';

export async function uploadSheetFile(formData: FormData) {
  try {
    const result = await nocoDBService.uploadFile(formData);
    
    // NocoDB returns an array of attachments
    if (result && result.length > 0) {
      // Return the URL and the full attachment object
      // Note: NocoDB URLs might be relative? Let's check. 
      // Usually they are full URLs or relative to base.
      // We will assume we need to handle proper display client-side.
      return { success: true, url: result[0].url, attachment: result[0] };
    }
    
    return { success: false, error: 'No file uploaded' };
  } catch (error: any) {
    console.error('Upload failed:', error);
    return { success: false, error: error.message || 'Upload failed' };
  }
}
