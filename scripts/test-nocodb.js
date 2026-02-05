/**
 * NocoDB API Test Script
 * 
 * This script tests the NocoDB API connection and verifies that the
 * tables were created successfully.
 * 
 * Run with: node scripts/test-nocodb.js
 */

const https = require('https');
const http = require('http');
require('dotenv').config();

const NOCODB_URL = process.env.NOCODB_PUBLIC_URL || 'http://localhost:8080';
const API_TOKEN = process.env.NOCODB_API_TOKEN;

if (!API_TOKEN) {
  console.error('❌ ERROR: NOCODB_API_TOKEN is not set in .env file');
  process.exit(1);
}

// Helper function to make HTTP requests
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, NOCODB_URL);
    const isHttps = url.protocol === 'https:';
    const httpModule = isHttps ? https : http;

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: method,
      headers: {
        'xc-token': API_TOKEN,
        'Content-Type': 'application/json',
      }
    };

    const req = httpModule.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = body ? JSON.parse(body) : {};
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(response);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${body}`));
          }
        } catch (e) {
          reject(new Error(`Failed to parse response: ${body}`));
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function testNocoDB() {
  console.log('🧪 Testing NocoDB API Connection...\n');

  try {
    // Test 1: Get projects
    console.log('Test 1: Fetching projects...');
    const projects = await makeRequest('GET', '/api/v1/db/meta/projects');
    
    if (!projects.list || projects.list.length === 0) {
      console.log('   ❌ No projects found!');
      return;
    }
    
    const project = projects.list[0];
    console.log(`   ✅ Found project: "${project.title}" (${project.id})`);

    // Test 2: Get tables
    console.log('\nTest 2: Fetching tables...');
    const tables = await makeRequest('GET', `/api/v1/db/meta/projects/${project.id}/tables`);
    
    const sheetsTable = tables.list?.find(t => t.table_name === 'sheets' || t.title === 'sheets');
    const cellsTable = tables.list?.find(t => t.table_name === 'sheet_cells' || t.title === 'sheet_cells');

    if (!sheetsTable) {
      console.log('   ❌ "sheets" table not found!');
    } else {
      console.log(`   ✅ Found "sheets" table (${sheetsTable.id})`);
    }

    if (!cellsTable) {
      console.log('   ❌ "sheet_cells" table not found!');
    } else {
      console.log(`   ✅ Found "sheet_cells" table (${cellsTable.id})`);
    }

    // Test 3: Get columns for sheets table
    if (sheetsTable) {
      console.log('\nTest 3: Fetching "sheets" table columns...');
      const sheetsColumns = await makeRequest('GET', `/api/v1/db/meta/tables/${sheetsTable.id}`);
      console.log(`   ✅ Columns in "sheets" table:`);
      sheetsColumns.columns?.forEach(col => {
        console.log(`      - ${col.title} (${col.uidt})`);
      });
    }

    // Test 4: Get columns for sheet_cells table
    if (cellsTable) {
      console.log('\nTest 4: Fetching "sheet_cells" table columns...');
      const cellsColumns = await makeRequest('GET', `/api/v1/db/meta/tables/${cellsTable.id}`);
      console.log(`   ✅ Columns in "sheet_cells" table:`);
      cellsColumns.columns?.forEach(col => {
        console.log(`      - ${col.title} (${col.uidt})`);
      });
    }

    // Test 5: Insert a test record
    console.log('\nTest 5: Testing insert into "sheets" table...');
    const testRecord = await makeRequest('POST', `/api/v1/db/data/noco/${project.id}/${sheetsTable.id}`, {
      name: 'Test Sheet',
      project_id: 'test-project-123',
      slug: 'test-sheet'
    });
    console.log(`   ✅ Test record created with ID: ${testRecord.Id}`);

    // Test 6: Read the test record
    console.log('\nTest 6: Reading test record...');
    const records = await makeRequest('GET', `/api/v1/db/data/noco/${project.id}/${sheetsTable.id}`);
    console.log(`   ✅ Found ${records.list?.length || 0} record(s) in "sheets" table`);
    
    if (records.list && records.list.length > 0) {
      console.log('   First record:', JSON.stringify(records.list[0], null, 2));
    }

    // Test 7: Delete the test record
    console.log('\nTest 7: Cleaning up test record...');
    await makeRequest('DELETE', `/api/v1/db/data/noco/${project.id}/${sheetsTable.id}/${testRecord.Id}`);
    console.log('   ✅ Test record deleted');

    console.log('\n✨ All tests passed! NocoDB is ready to use.');
    console.log(`\n🔗 Access NocoDB at: ${NOCODB_URL}`);

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

// Run the tests
testNocoDB();
