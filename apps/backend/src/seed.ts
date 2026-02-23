import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding dev database...');

  const passwordHash = await bcrypt.hash('password', 10);

  // 1. Dev Admin — upsert so re-running always ensures password is set
  await prisma.user.upsert({
    where: { email: 'admin@worktree.pro' },
    update: { password: passwordHash, systemRole: 'ADMIN', complianceStatus: 'VERIFIED' },
    create: {
      email: 'admin@worktree.pro',
      name: 'Dev Admin',
      password: passwordHash,
      systemRole: 'ADMIN',
      complianceStatus: 'VERIFIED',
    },
  });
  console.log('  ✓ admin@worktree.pro');

  // 2. Dev User
  await prisma.user.upsert({
    where: { email: 'user@worktree.com' },
    update: { password: passwordHash, systemRole: 'MEMBER', complianceStatus: 'VERIFIED' },
    create: {
      email: 'user@worktree.com',
      name: 'Dev User',
      password: passwordHash,
      systemRole: 'MEMBER',
      complianceStatus: 'VERIFIED',
    },
  });
  console.log('  ✓ user@worktree.com');

  // 3. Demo Project (linked to admin)
  const adminUser = await prisma.user.findUniqueOrThrow({ where: { email: 'admin@worktree.pro' } });

  const project = await prisma.project.upsert({
    where: { slug: 'demo-project' },
    update: {},
    create: {
      name: 'Demo Project',
      slug: 'demo-project',
      createdById: adminUser.id,
      plan: 'PRO',
    },
  });
  console.log('  ✓ Demo Project');

  // 4. Contact Form (only create; skip if slug already exists)
  const existingForm = await prisma.form.findUnique({ where: { slug: 'contact-form' } });
  if (!existingForm) {
    await prisma.form.create({
      data: {
        group_id: 1,
        projectId: project.id,
        slug: 'contact-form',
        title: 'Contact Form',
        description: 'Simple contact form for inquiries',
        form_type: 'general',
        form_schema: {
          version: '2.0',
          pages: [],
          settings: { title: 'Contact Form' },
          theme: { mode: 'auto' },
        },
        is_published: true,
        is_active: true,
      },
    });
    console.log('  ✓ Contact Form');
  }

  console.log('\nSeeding complete.');
  console.log('  Dev Admin:  admin@worktree.pro  / password');
  console.log('  Dev User:   user@worktree.com   / password');
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  });
