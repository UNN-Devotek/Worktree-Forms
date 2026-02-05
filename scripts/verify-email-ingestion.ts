
// Used native fetch

const API_URL = 'http://127.0.0.1:5005/api';

async function main() {
  console.log('🚀 Verifying Email Ingestion Webhook...');

  // 1. Simulate "Create Project" Email
  const payload = {
    from: 'admin@worktree.pro', // Must be an existing user in seed
    subject: 'Create Project: Magic Tower Renovation',
    text: 'Please create a new project for the downtown tower renovation. Priority is High.',
  };

  const response = await fetch(`${API_URL}/webhooks/inbound-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const text = await response.text();
    console.error(`❌ Webhook Failed: ${response.status} - ${text}`);
    process.exit(1);
  }

  const data = await response.json();
  console.log('✅ Webhook Response:', JSON.stringify(data, null, 2));

  if (data.success && data.action === 'CREATE_PROJECT' && data.data.name === 'Magic Tower Renovation') {
      console.log('✨ SUCCESS: Project created via Magic Email!');
  } else {
      console.error('❌ FAILED: Unexpected response format');
      process.exit(1);
  }
}

main().catch(console.error);
