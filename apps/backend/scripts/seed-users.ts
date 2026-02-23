
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function seedUsers() {
  console.log('Seeding default users...');

  // Upsert 'user-1' (Default fallback in code)
  await prisma.user.upsert({
    where: { id: 'user-1' },
    update: {},
    create: {
      id: 'user-1',
      email: 'default-dev@worktree.pro',
      name: 'Default Dev User',
      systemRole: 'ADMIN'
    }
  });
  console.log('Upserted user-1');

  // Upsert '1' (Legacy/Hardcoded Admin fallback)
  await prisma.user.upsert({
      where: { id: '1' },
      update: {},
      create: {
        id: '1',
        email: 'legacy-admin@worktree.pro',
        name: 'Legacy Admin',
        systemRole: 'ADMIN'
      }
    });
    console.log('Upserted user 1');
}

seedUsers()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
