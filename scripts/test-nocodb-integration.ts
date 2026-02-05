/**
 * Test NocoDB Integration
 * 
 * This script tests the NocoDB service integration with the sheet actions.
 * Run with: npx tsx scripts/test-nocodb-integration.ts
 */

import dotenv from 'dotenv';
dotenv.config();

import { nocoDBService } from '../apps/frontend/lib/nocodb.service.js';

async function testIntegration() {
  console.log('🧪 Testing NocoDB Integration...\n');

  try {
    // Test 1: Initialize service
    console.log('Test 1: Initializing NocoDB service...');
    await nocoDBService.initialize();
    console.log('   ✅ Service initialized\n');

    // Test 2: Create a test sheet
    console.log('Test 2: Creating test sheet...');
    const testSheet = await nocoDBService.createSheet({
      name: 'Integration Test Sheet',
      project_id: 'test-project-integration',
      slug: 'integration-test-sheet',
    });
    console.log(`   ✅ Sheet created with ID: ${testSheet.id}\n`);

    // Test 3: Get sheets by project
    console.log('Test 3: Getting sheets by project...');
    const sheets = await nocoDBService.getSheetsByProject('test-project-integration');
    console.log(`   ✅ Found ${sheets.length} sheet(s)\n`);

    // Test 4: Create test cells
    console.log('Test 4: Creating test cells...');
    const cells = [
      {
        sheet_id: String(testSheet.id),
        row: 0,
        col: 0,
        value: 'Name',
        type: 'text' as const,
      },
      {
        sheet_id: String(testSheet.id),
        row: 0,
        col: 1,
        value: 'Age',
        type: 'text' as const,
      },
      {
        sheet_id: String(testSheet.id),
        row: 1,
        col: 0,
        value: 'John Doe',
        type: 'text' as const,
      },
      {
        sheet_id: String(testSheet.id),
        row: 1,
        col: 1,
        value: '30',
        type: 'number' as const,
      },
    ];

    for (const cell of cells) {
      await nocoDBService.createCell(cell);
    }
    console.log(`   ✅ Created ${cells.length} cells\n`);

    // Test 5: Get cells for sheet
    console.log('Test 5: Retrieving cells...');
    const retrievedCells = await nocoDBService.getCellsBySheet(String(testSheet.id));
    console.log(`   ✅ Retrieved ${retrievedCells.length} cells:`);
    retrievedCells.forEach((cell) => {
      console.log(`      [${cell.row},${cell.col}] = "${cell.value}" (${cell.type})`);
    });
    console.log();

    // Test 6: Update sheet name
    console.log('Test 6: Updating sheet name...');
    if (testSheet.id) {
      await nocoDBService.updateSheet(testSheet.id, {
        name: 'Integration Test Sheet (Updated)',
      });
      const updatedSheet = await nocoDBService.getSheet(testSheet.id);
      console.log(`   ✅ Sheet updated: ${updatedSheet?.name}\n`);
    }

    // Test 7: Replace cells (batch update)
    console.log('Test 7: Batch replacing cells...');
    const newCells = [
      {
        sheet_id: String(testSheet.id),
        row: 0,
        col: 0,
        value: 'Product',
        type: 'text' as const,
      },
      {
        sheet_id: String(testSheet.id),
        row: 0,
        col: 1,
        value: 'Price',
        type: 'text' as const,
      },
      {
        sheet_id: String(testSheet.id),
        row: 1,
        col: 0,
        value: 'Widget',
        type: 'text' as const,
      },
      {
        sheet_id: String(testSheet.id),
        row: 1,
        col: 1,
        value: '19.99',
        type: 'number' as const,
      },
    ];
    await nocoDBService.replaceCells(String(testSheet.id), newCells);
    const replacedCells = await nocoDBService.getCellsBySheet(String(testSheet.id));
    console.log(`   ✅ Cells replaced, now ${replacedCells.length} cells:`);
    replacedCells.forEach((cell) => {
      console.log(`      [${cell.row},${cell.col}] = "${cell.value}"`);
    });
    console.log();

    // Test 8: Create a dynamic table
    console.log('Test 8: Creating a dynamic table...');
    const dynamicColumns = [
      { column_name: 'Col1', title: 'Col A', uidt: 'LongText' },
      { column_name: 'Col2', title: 'Col B', uidt: 'LongText' },
    ];
    const uniqueTitle = `Debug Table ${Math.random().toString(36).substring(2, 7)}`;
    const dynamicTable = await nocoDBService.createTable(uniqueTitle, dynamicColumns);
    console.log(`   ✅ Dynamic table created: ${dynamicTable.id}\n`);

    // Test 9: Get views and share
    console.log('Test 9: Getting and sharing views...');
    const views = await nocoDBService.getViews(dynamicTable.id);
    console.log(`   ✅ Found ${views.length} views`);
    if (views.length > 0) {
        const viewId = views[0].id;
        const potentialEndpoints = [
            `/api/v1/db/meta/views/${viewId}/shares`,
            `/api/v1/db/meta/views/${viewId}/share`,
            `/api/v1/db/meta/views/${viewId}/shared`,
            `/api/v1/db/meta/views/${viewId}/public`,
            `/api/v1/db/meta/views/${viewId}/external`,
        ];

        let sharedId = null;
        for (const endpoint of potentialEndpoints) {
            console.log(`   Trying endpoint: ${endpoint}`);
            try {
                const res = await (nocoDBService as any).client.post(endpoint, { password: null, show_as: 'grid' });
                sharedId = res.data.id || res.data.uuid;
                console.log(`   ✅ Success! Share ID: ${sharedId}`);
                break;
            } catch (e: any) {
                console.log(`   ❌ Failed with status: ${e.response?.status || 'unknown'}`);
            }
        }

        if (!sharedId) {
            throw new Error('All sharing endpoints failed');
        }
    }

    console.log('✨ All integration tests passed!');
  } catch (err) {
    const error = err as any;
    console.error('\n❌ Integration test failed:', error);
    if (error.response) {
        console.error('API Error Response:', JSON.stringify(error.response.data, null, 2));
    }
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

// Run the tests
testIntegration();
