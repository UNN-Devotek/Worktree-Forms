import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Create default admin user
  const adminEmail = 'admin@worktree.pro';
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        id: '1', // keeping ID 1 for compatibility with frontend mocks if any
        email: adminEmail,
        password: 'admin123', // In real app, hash this!
        name: 'Admin User',
        role: 'admin',
      }
    });
    console.log('Created admin user');
  }

  // 2. Create default Contact Form
  const existingForm = await prisma.form.findUnique({ where: { slug: 'contact-form' } });

  if (!existingForm) {
      await prisma.form.create({
          data: {
              id: 1, // keeping ID 1
              group_id: 1,
              slug: 'contact-form',
              title: 'Contact Form',
              description: 'Simple contact form for inquiries',
              form_type: 'general',
              form_schema: {
                version: '2.0',
                pages: [],
                settings: { title: 'Contact Form' },
                theme: { mode: 'auto' }
              },
              is_published: true,
              is_active: true,
          }
      });
      console.log('Created Contact Form');
  }

  console.log('Seeding completed.');
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
