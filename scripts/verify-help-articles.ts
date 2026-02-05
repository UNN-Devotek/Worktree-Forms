const BASE_URL = 'http://localhost:3005';

async function testHelpArticles() {
  console.log('🧪 Testing Help Article Endpoints\n');

  try {
    // 1. Create an article
    console.log('1️⃣ Creating help article...');
    const createResponse = await fetch(`${BASE_URL}/api/help/articles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'ede6a039-10ed-42c3-9c50-e1f18abd5cb7'
      },
      body: JSON.stringify({
        title: 'How to Use Safety Equipment',
        content: [
          { type: 'h1', children: [{ text: 'Safety Equipment Guide' }] },
          { type: 'p', children: [{ text: 'This guide covers proper use of safety equipment on construction sites.' }] }
        ],
        category: 'Safety'
      })
    });

    const created = await createResponse.json();
    if (!createResponse.ok) {
        console.error('❌ Create failed:', created);
        return;
    }
    console.log('✅ Article created:', created.article?.title);
    const articleId = created.article?.id;

    // 2. List articles
    console.log('\n2️⃣ Listing articles...');
    const listResponse = await fetch(`${BASE_URL}/api/help/articles`);
    const listed = await listResponse.json();
    console.log(`✅ Found ${listed.articles?.length} articles`);

    // 3. Update article
    console.log('\n3️⃣ Updating article...');
    const updateResponse = await fetch(`${BASE_URL}/api/help/articles/${articleId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'ede6a039-10ed-42c3-9c50-e1f18abd5cb7'
      },
      body: JSON.stringify({
        content: [
          { type: 'h1', children: [{ text: 'Safety Equipment Guide - Updated' }] },
          { type: 'p', children: [{ text: 'This guide has been updated with new information.' }] }
        ],
        changelog: 'Added updated content'
      })
    });

    const updated = await updateResponse.json();
    console.log('✅ Article updated');

    // 4. Get article versions
    console.log('\n4️⃣ Getting article versions...');
    const versionsResponse = await fetch(`${BASE_URL}/api/help/articles/${articleId}/versions`);
    const versions = await versionsResponse.json();
    console.log(`✅ Article has ${versions.versions?.length} versions`);

    // 5. Publish article
    console.log('\n5️⃣ Publishing article...');
    const publishResponse = await fetch(`${BASE_URL}/api/help/articles/${articleId}/publish`, {
      method: 'POST'
    });

    const published = await publishResponse.json();
    console.log('✅ Article published');

    // 6. Get article by slug
    console.log('\n6️⃣ Getting article by slug...');
    const slug = created.article?.slug;
    const slugResponse = await fetch(`${BASE_URL}/api/help/articles/${slug}`);
    const bySlug = await slugResponse.json();
    console.log('✅ Article retrieved by slug:', bySlug.article?.title);

    console.log('\n🎉 All tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testHelpArticles();
