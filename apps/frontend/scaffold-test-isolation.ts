
import dotenv from 'dotenv';
import path from 'path';

// Load root .env file from two directories up
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config(); // Also load local .env if present

console.log('Env Check Before Imports - Token:', process.env.NOCODB_API_TOKEN ? 'Present' : 'Missing');

async function testIsolation() {
  const { db } = await import('./lib/database');
  const { createSheet, getSheets } = await import('./features/sheets/server/sheet-actions-nocodb');

  console.log('Testing Sheet Isolation...');

  // 1. Create Project A and B
  const slugA = `test-proj-a-${Date.now()}`;
  const slugB = `test-proj-b-${Date.now()}`;

  // Mock project creation (or use db directly if no action)
  const user = await db.user.findFirst();
  if (!user) throw new Error('No user found');

  const projA = await db.project.create({
    data: { name: 'Project A', slug: slugA, createdById: user.id }
  });
  const projB = await db.project.create({
    data: { name: 'Project B', slug: slugB, createdById: user.id }
  });

  console.log(`Created projects: ${slugA}, ${slugB}`);

  // 2. Create Sheet in A
  const sheetA = await createSheet(projA.id, 'Sheet A');
  console.log('Created Sheet A:', sheetA?.id);

  // 3. Get Sheets for A
  const sheetsA = await getSheets(slugA);
  console.log(`Sheets for A (expect 1): ${sheetsA.length}`);
  if (sheetsA.length !== 1 || sheetsA[0].id !== sheetA?.id) {
      console.error('FAIL: Sheet A not found in Project A');
  }

  // 4. Get Sheets for B
  const sheetsB = await getSheets(slugB);
  console.log(`Sheets for B (expect 0): ${sheetsB.length}`);
  if (sheetsB.length !== 0) {
      console.error('FAIL: Project B has sheets!', sheetsB);
  } else {
      console.log('PASS: Project B has no sheets.');
  }


  // Cleanup
  if (projA) await db.project.delete({ where: { id: projA.id } });
  if (projB) await db.project.delete({ where: { id: projB.id } });
  await db.$disconnect();
}

testIsolation()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    process.exit();
  });

