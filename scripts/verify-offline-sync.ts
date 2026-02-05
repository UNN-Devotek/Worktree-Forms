const BASE_URL = 'http://localhost:3005';

async function testSync() {
  console.log('🧪 Testing Help Offline Sync Endpoint\n');

  try {
    const response = await fetch(`${BASE_URL}/api/help/sync`);
    const data = await response.json();

    if (!response.ok) {
        console.error('❌ Sync failed:', data);
        return;
    }

    console.log(`✅ Sync successful. Timestamp: ${data.timestamp}`);
    console.log(`📚 Published Articles: ${data.articles?.length}`);
    
    if (data.articles?.length > 0) {
        console.log('   Sample Article:', data.articles[0].title);
    } else {
        console.log('   ⚠️ No published articles found (expected if none published)');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testSync();
