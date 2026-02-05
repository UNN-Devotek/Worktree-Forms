/**
 * Test NocoDB Integration (JavaScript version)
 * 
 * Tests the backend integration with NocoDB
 * Run with: node scripts/test-integration.js
 */

const axios = require('axios');
require('dotenv').config();

const NOCODB_URL = process.env.NOCODB_PUBLIC_URL || 'http://localhost:8080';
const API_TOKEN = process.env.NOCODB_API_TOKEN;

if (!API_TOKEN) {
  console.error('❌ ERROR: NOCODB_API_TOKEN is not set');
  process.exit(1);
}

const client = axios.create({
  baseURL: NOCODB_URL,
  headers: {
    'xc-token': API_TOKEN,
    'Content-Type': 'application/json',
  },
});

async function testBackendIntegration() {
  console.log('🧪 Testing Backend NocoDB Integration...\n');

  try {
    let projectId, sheetsTableId;

    // Get project
    console.log('Step 1: Getting project...');
    const projects = await client.get('/api/v1/db/meta/projects');
    projectId = projects.data.list[0].id;
    console.log(`   ✅ Project ID: ${projectId}\n`);

    // Get tables
    console.log('Step 2: Getting tables...');
    const tables = await client.get(`/api/v1/db/meta/projects/${projectId}/tables`);
    const sheetsTable = tables.data.list.find(t => t.table_name === 'sheets');
    sheetsTableId = sheetsTable.id;
    console.log(`   ✅ Sheets table ID: ${sheetsTableId}\n`);

    // Create test sheet
    console.log('Step 3: Creating test sheet...');
    const createResponse = await client.post(
      `/api/v1/db/data/noco/${projectId}/${sheetsTableId}`,
      {
        name: 'Backend Integration Test',
        project_id: 'test-backend-project',
        slug: 'backend-integration-test',
      }
    );
    const testSheetId = createResponse.data.Id;
    console.log(`   ✅ Created sheet with ID: ${testSheetId}\n`);

    // Get sheets for project
    console.log('Step 4: Querying sheets...');
    const queryResponse = await client.get(
      `/api/v1/db/data/noco/${projectId}/${sheetsTableId}`,
      {
        params: {
          where: '(project_id,eq,test-backend-project)',
        },
      }
    );
    console.log(`   ✅ Found ${queryResponse.data.list.length} sheet(s)\n`);

    // Update sheet
    console.log('Step 5: Updating sheet name...');
    await client.patch(
      `/api/v1/db/data/noco/${projectId}/${sheetsTableId}/${testSheetId}`,
      {
        name: 'Backend Integration Test (Updated)',
      }
    );
    console.log('   ✅ Sheet updated\n');

    // Delete test sheet
    console.log('Step 6: Cleaning up...');
    await client.delete(
      `/api/v1/db/data/noco/${projectId}/${sheetsTableId}/${testSheetId}`
    );
    console.log('   ✅ Test sheet deleted\n');

    console.log('✨ All backend integration tests passed!');
    console.log('\n📝 Summary:');
    console.log('   - NocoDB API connection: ✅');
    console.log('   - Create sheet: ✅');
    console.log('   - Query sheets: ✅');
    console.log('   - Update sheet: ✅');
    console.log('   - Delete sheet: ✅');
    console.log('\n🎉 Backend is ready for Phase 2 integration!');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

testBackendIntegration();
