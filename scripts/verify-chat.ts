
// Used native fetch

const API_URL = 'http://127.0.0.1:5005/api';

async function main() {
  console.log('🚀 Verifying AI Chat Endpoint...');

  const response = await fetch(`${API_URL}/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', content: 'Is the HVAC leaking?' }],
      projectId: 'rag-test-project'
    })
  });

  if (!response.ok) {
    const text = await response.text();
    console.error(`❌ Chat API Failed: ${response.status} - ${text}`);
    process.exit(1);
  }

  console.log('✅ Chat API Connected. Reading Stream...');
  
  if (!response.body) {
    console.error('❌ No response body stream.');
    process.exit(1);
  }

  // Node.js Fetch Response body is a ReadableStream (web standard) in newer nodes
  // or via node-fetch it's slightly different.
  // Using native fetch in Node 20+, it should be iterable or have getReader.
  
  // @ts-ignore
  for await (const chunk of response.body) {
    const text = new TextDecoder().decode(chunk);
    process.stdout.write(text);
  }
  
  console.log('\n✅ Stream Completed.');
}

main().catch(console.error);
