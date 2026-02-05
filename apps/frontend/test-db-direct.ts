import { db } from './lib/db';

async function main() {
  console.log('Testing DB Access...');
  try {
    const sheets = await db.sheet.findMany({
        include: { project: true },
        take: 1
    });
    if (sheets.length > 0) {
        console.log(`URL: http://localhost:3005/project/${sheets[0].project.slug}/sheets/${sheets[0].id}`);
    } else {
        console.log('No sheets found.');
    }
  } catch (e) {
    console.error('Error:', e);
  }
}

main();
