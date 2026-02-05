/**
 * Direct test of createSheet to capture the actual error
 */

import dotenv from 'dotenv';
dotenv.config();

// Import the createSheet function
import { createSheet } from '../apps/frontend/features/sheets/server/sheet-actions-nocodb.js';

async function testCreateSheet() {
  console.log('🧪 Testing createSheet directly...\n');

  try {
    // Use a test project ID (you'll need to replace this with an actual project ID from your database)
    const testProjectId = 'cm5kkrp5w0000vqxdqwi8c7zy'; // Replace with actual project ID
    
    console.log(`Creating sheet for project: ${testProjectId}`);
    const sheet = await createSheet(testProjectId, 'Direct Test Sheet');
    
    if (sheet) {
      console.log('✅ Sheet created successfully!');
      console.log('Sheet ID:', sheet.id);
      console.log('Sheet Title:', sheet.title);
      console.log('NocoDB Table ID:', sheet.nocodbTableId);
      console.log('NocoDB View ID:', sheet.nocodbViewId);
    } else {
      console.log('❌ createSheet returned null');
    }
  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    if ((error as any).response) {
      console.error('API Error Response:', JSON.stringify((error as any).response.data, null, 2));
    }
    process.exit(1);
  }
}

testCreateSheet();
