/**
 * NocoDB Setup Script
 * 
 * This script programmatically creates the required workspace, base, and tables
 * in NocoDB for the Worktree spreadsheet feature.
 * 
 * Run with: node scripts/setup-nocodb.js
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

async function setupNocoDB() {
  console.log('🚀 Starting NocoDB setup...\n');

  try {
    // Step 1: Get existing projects (bases)
    console.log('📁 Step 1: Checking for existing projects...');
    const projects = await makeRequest('GET', '/api/v1/db/meta/projects');
    
    let project;
    if (!projects.list || projects.list.length === 0) {
      console.log('   Creating new project "Worktree Spreadsheets"...');
      project = await makeRequest('POST', '/api/v1/db/meta/projects', {
        title: 'Worktree Spreadsheets',
        description: 'Spreadsheet data storage'
      });
      console.log(`   ✅ Project created: ${project.id}`);
    } else {
      // Use the first available project
      project = projects.list[0];
      console.log(`   ✅ Using existing project: "${project.title}" (${project.id})`);
    }

    // Step 2: Get existing tables
    console.log('\n📊 Step 2: Checking for existing tables...');
    const tables = await makeRequest('GET', `/api/v1/db/meta/projects/${project.id}/tables`);
    
    const sheetsTableExists = tables.list?.some(t => t.table_name === 'sheets' || t.title === 'sheets');
    const cellsTableExists = tables.list?.some(t => t.table_name === 'sheet_cells' || t.title === 'sheet_cells');

    // Step 3: Create "sheets" table if it doesn't exist
    if (!sheetsTableExists) {
      console.log('\n📊 Step 3: Creating "sheets" table...');
      const sheetsTable = await makeRequest('POST', `/api/v1/db/meta/projects/${project.id}/tables`, {
        table_name: 'sheets',
        title: 'sheets',
        columns: [
          {
            column_name: 'id',
            title: 'id',
            uidt: 'ID',
            pk: true,
            ai: true
          },
          {
            column_name: 'name',
            title: 'name',
            uidt: 'SingleLineText',
            rqd: true
          },
          {
            column_name: 'project_id',
            title: 'project_id',
            uidt: 'SingleLineText',
            rqd: true
          },
          {
            column_name: 'slug',
            title: 'slug',
            uidt: 'SingleLineText',
            rqd: true
          },
          {
            column_name: 'created_at',
            title: 'created_at',
            uidt: 'DateTime',
            dtxp: 'now()'
          },
          {
            column_name: 'updated_at',
            title: 'updated_at',
            uidt: 'DateTime',
            dtxp: 'now()'
          }
        ]
      });
      console.log(`   ✅ "sheets" table created: ${sheetsTable.id}`);
    } else {
      console.log('\n   ⚠️  "sheets" table already exists, skipping...');
    }

    // Step 4: Create "sheet_cells" table if it doesn't exist
    if (!cellsTableExists) {
      console.log('\n📊 Step 4: Creating "sheet_cells" table...');
      const cellsTable = await makeRequest('POST', `/api/v1/db/meta/projects/${project.id}/tables`, {
        table_name: 'sheet_cells',
        title: 'sheet_cells',
        columns: [
          {
            column_name: 'id',
            title: 'id',
            uidt: 'ID',
            pk: true,
            ai: true
          },
          {
            column_name: 'sheet_id',
            title: 'sheet_id',
            uidt: 'SingleLineText',
            rqd: true
          },
          {
            column_name: 'row',
            title: 'row',
            uidt: 'Number',
            rqd: true
          },
          {
            column_name: 'col',
            title: 'col',
            uidt: 'Number',
            rqd: true
          },
          {
            column_name: 'value',
            title: 'value',
            uidt: 'LongText'
          },
          {
            column_name: 'type',
            title: 'type',
            uidt: 'SingleSelect',
            dtxp: "'text','number','formula','image','attachment'",
            cdf: 'text'
          },
          {
            column_name: 'images',
            title: 'images',
            uidt: 'Attachment'
          },
          {
            column_name: 'files',
            title: 'files',
            uidt: 'Attachment'
          },
          {
            column_name: 'formula',
            title: 'formula',
            uidt: 'LongText'
          },
          {
            column_name: 'style',
            title: 'style',
            uidt: 'LongText'
          }
        ]
      });
      console.log(`   ✅ "sheet_cells" table created: ${cellsTable.id}`);
    } else {
      console.log('\n   ⚠️  "sheet_cells" table already exists, skipping...');
    }

    console.log('\n✨ NocoDB setup completed successfully!');
    console.log('\n📝 Summary:');
    console.log(`   Project: ${project.title} (${project.id})`);
    console.log(`   Tables: sheets, sheet_cells`);
    console.log(`\n🔗 Access NocoDB at: ${NOCODB_URL}`);

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

// Run the setup
setupNocoDB();

