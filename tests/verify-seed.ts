import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

// FORCE LOCAL DB
process.env.DATABASE_URL = 'postgresql://user:password@localhost:5432/worktree';

const dbUrl = process.env.DATABASE_URL || '';
console.log('DB Host (Forced):', dbUrl.split('@')[1]?.split('/')[0] || 'UNKNOWN');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Connecting to DB...');
    const targetId = 'manual-seed-user';
    let user = await prisma.user.findUnique({ where: { id: targetId } });
    
    if (!user) {
        console.log('Creating target user...');
        user = await prisma.user.create({
            data: {
                id: targetId,
                email: 'manual-seed@test.com',
                name: 'Manual Seed User'
            }
        });
    }
    console.log('Target User ID:', user.id);

    // Seed Project
    console.log('Creating Project...');
    const p = await prisma.project.create({
        data: {
            name: 'Determinist Project ' + Date.now(),
            slug: 'seed-' + Date.now(),
            createdById: user.id,
            roles: { OWNER: ["*"] },
            members: { create: { userId: user.id, roles: ["OWNER"] } }
        }
    });
    console.log('Created Project:', p.id, p.name);
    
  } catch (e) {
    console.error('ERROR:', e);
  } finally {
      await prisma.$disconnect();
  }
}

main();
