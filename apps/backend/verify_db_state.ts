
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verify() {
  console.log('--- Projects ---');
  const projects = await prisma.project.findMany({ include: { sheets: true, forms: true } });
  projects.forEach(p => {
    console.log(`Project: ${p.name} (ID: ${p.id}, Slug: ${p.slug})`);
    console.log(`  Sheets: ${p.sheets.length}`);
    p.sheets.forEach(s => console.log(`    - ${s.name} (ID: ${s.id})`));
    console.log(`  Forms: ${p.forms.length}`);
    p.forms.forEach(f => console.log(`    - ${f.title} (ID: ${f.id})`));
  });

  console.log('\n--- Forms without Project ---');
  const orphanForms = await prisma.form.findMany({ where: { projectId: null } });
  orphanForms.forEach(f => console.log(`Form: ${f.title} (ID: ${f.id})`));
}

verify()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
