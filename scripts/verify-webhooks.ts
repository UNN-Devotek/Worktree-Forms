
// Simplified Webhook Verification
const API_URL = 'http://127.0.0.1:5005/api';
const USER_ID = 'ede6a039-10ed-42c3-9c50-e1f18abd5cb7';

async function main() {
  console.log('🔗 Verifying Webhook System...\n');

  // Step 1: Register webhook
  console.log('Step 1: Registering webhook...');
  const registerRes = await fetch(`${API_URL}/webhooks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': USER_ID
    },
    body: JSON.stringify({
      url: 'https://example.com/webhook',
      events: ['submission.created', 'project.updated']
    })
  });

  if (!registerRes.ok) {
    const text = await registerRes.text();
    console.error(`❌ Registration Failed: ${registerRes.status} - ${text}`);
    process.exit(1);
  }

  const registered = await registerRes.json();
  console.log(`✅ Webhook Registered: ${registered.webhook.id}`);
  console.log(`   URL: ${registered.webhook.url}`);
  console.log(`   Events: ${registered.webhook.events.join(', ')}`);
  console.log(`   Secret: ${registered.secret.substring(0, 16)}...\n`);

  const webhookId = registered.webhook.id;

  // Step 2: List webhooks
  console.log('Step 2: Listing webhooks...');
  const listRes = await fetch(`${API_URL}/webhooks`, {
    headers: { 'x-user-id': USER_ID }
  });

  if (!listRes.ok) {
    console.error(`❌ List Failed: ${listRes.status}`);
    process.exit(1);
  }

  const webhooks = await listRes.json();
  console.log(`✅ Found ${webhooks.length} webhook(s)\n`);

  // Step 3: Delete webhook
  console.log('Step 3: Deleting webhook...');
  const deleteRes = await fetch(`${API_URL}/webhooks/${webhookId}`, {
    method: 'DELETE',
    headers: { 'x-user-id': USER_ID }
  });

  if (!deleteRes.ok) {
    console.error(`❌ Delete Failed: ${deleteRes.status}`);
    process.exit(1);
  }

  console.log('✅ Webhook Deleted\n');

  console.log('✨ SUCCESS: Webhook Management Verified!');
  console.log('\n💡 Note: Webhook delivery and HMAC signing can be tested by:');
  console.log('   1. Registering a webhook pointing to a test server');
  console.log('   2. Creating a submission to trigger "submission.created" event');
  console.log('   3. Validating the X-Webhook-Signature header');
}

main().catch(console.error);
