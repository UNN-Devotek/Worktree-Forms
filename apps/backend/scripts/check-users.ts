
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkUsers() {
  const users = await prisma.user.findMany();
  console.log('Users:', JSON.stringify(users, null, 2));
  
  // Check if 'user-1' exists
  const defaultUser = await prisma.user.findUnique({ where: { id: 'user-1' } });
  console.log('Default User (user-1):', defaultUser);

  // Check if '1' exists (from hardcoded login)
  const legacyUser = await prisma.user.findUnique({ where: { id: '1' } });
  console.log('Legacy User (1):', legacyUser);
}

checkUsers()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
