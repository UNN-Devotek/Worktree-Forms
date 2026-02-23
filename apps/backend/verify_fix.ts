
// Native fetch is available in Node 18+

async function verifyFix() {
  const BACKEND_URL = 'http://localhost:5005/api';
  const GROUP_SLUG = 'test-project-nKB59'; // From previous DB verify
  const GROUP_ID = 1;

  console.log(`Verifying Form Creation with groupSlug: ${GROUP_SLUG}`);

  try {
    const payload = {
      title: "API Verify Form Project Link",
      description: "Auto-generated verification form",
      form_type: "general",
      groupSlug: GROUP_SLUG
    };

    console.log('Sending POST request...');
    const response = await fetch(`${BACKEND_URL}/groups/${GROUP_ID}/forms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP Error: ${response.status} - ${text}`);
    }

    const json = await response.json() as any;
    
    if (!json.success) {
        throw new Error(`API Error: ${json.error}`);
    }

    const form = json.data.form;
    console.log('Form Created:', form.id, form.slug);
    console.log('Project ID:', form.projectId);

    if (form.projectId) {
        console.log('SUCCESS: Form linked to Project!');
    } else {
        console.error('FAILURE: Form projectId is NULL or undefined.');
        process.exit(1);
    }

  } catch (error) {
    console.error('Verification Failed:', error);
    process.exit(1);
  }
}

verifyFix();
