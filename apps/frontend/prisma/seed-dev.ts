
// @ts-ignore - Valid generated client
import { PrismaClient } from '@prisma/client-frontend';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seed() {
  console.log('Seeding Dev Users...');

  const passwordHash = await bcrypt.hash('password', 10);

  // 1. Dev Admin
  await prisma.user.upsert({
    where: { email: 'admin@worktree.pro' },
    update: {
      password: passwordHash,
      systemRole: 'ADMIN',
      complianceStatus: 'VERIFIED'
    },
    create: {
      email: 'admin@worktree.pro',
      name: 'Dev Admin',
      password: passwordHash,
      systemRole: 'ADMIN',
      complianceStatus: 'VERIFIED'
    }
  });
  console.log('Created/Updated: admin@worktree.pro');

  // 2. Dev User
  await prisma.user.upsert({
    where: { email: 'user@worktree.com' },
    update: {
      password: passwordHash,
      systemRole: 'MEMBER',
      complianceStatus: 'VERIFIED'
    },
    create: {
      email: 'user@worktree.com',
      name: 'Dev User',
      password: passwordHash,
      systemRole: 'MEMBER',
      complianceStatus: 'VERIFIED'
    }
  });
  console.log('Created/Updated: user@worktree.com');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
