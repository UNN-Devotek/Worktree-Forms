
// Verify API Key Management

const API_URL = 'http://127.0.0.1:5005/api';

async function main() {
  console.log('🔑 Verifying API Key Management...\n');

  // 1. Generate a new API Key
  console.log('Step 1: Generating API Key...');
  const generateRes = await fetch(`${API_URL}/keys`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': 'ede6a039-10ed-42c3-9c50-e1f18abd5cb7' // Dev Admin ID
    },
    body: JSON.stringify({ note: 'Test Key', scope: 'projects:read' })
  });

  if (!generateRes.ok) {
    console.error(`❌ Generate Failed: ${generateRes.status}`);
    process.exit(1);
  }

  const generated = await generateRes.json();
  console.log(`✅ Generated Key: ${generated.key.substring(0, 15)}...`);
  console.log(`   ID: ${generated.record.id}\n`);

  const rawKey = generated.key;
  const keyId = generated.record.id;

  // 2. List API Keys
  console.log('Step 2: Listing API Keys...');
  const listRes = await fetch(`${API_URL}/keys`, {
    headers: { 'x-user-id': 'ede6a039-10ed-42c3-9c50-e1f18abd5cb7' }
  });

  if (!listRes.ok) {
    console.error(`❌ List Failed: ${listRes.status}`);
    process.exit(1);
  }

  const keys = await listRes.json();
  console.log(`✅ Found ${keys.length} key(s)`);
  console.log(`   Preview: ${keys[0].keyPreview}\n`);

  // 3. Revoke the Key
  console.log('Step 3: Revoking API Key...');
  const revokeRes = await fetch(`${API_URL}/keys/${keyId}`, {
    method: 'DELETE',
    headers: { 'x-user-id': 'ede6a039-10ed-42c3-9c50-e1f18abd5cb7' }
  });

  if (!revokeRes.ok) {
    console.error(`❌ Revoke Failed: ${revokeRes.status}`);
    process.exit(1);
  }

  console.log('✅ Key Revoked\n');

  console.log('✨ SUCCESS: API Key Management Verified!');
}

main().catch(console.error);
