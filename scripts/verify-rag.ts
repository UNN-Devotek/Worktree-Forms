
import { PrismaClient } from '@prisma/client';
// Used native fetch

const prisma = new PrismaClient();
const API_URL = 'http://127.0.0.1:5005/api';

async function main() {
  console.log('🚀 Verifying RAG Ingestion...');

  // 1. Create a dummy Submission
  // Ensure we have a Form and FormVersion first (or reuse existing if any)
  // Since DB is wiped, we need to create prerequisites.
  
  // Upsert Project
  const project = await prisma.project.upsert({
    where: { slug: 'rag-test-project' },
    update: {},
    create: {
      name: 'RAG Test Project',
      slug: 'rag-test-project',
      createdBy: {
        connectOrCreate: {
            where: { id: 'user_1' },
            create: {
                id: 'user_1',
                email: 'admin@worktree.pro',
                systemRole: 'ADMIN',
                complianceStatus: 'VERIFIED'
            }
        }
      }
    }
  });

  // Upsert Form
  const form = await prisma.form.upsert({
    where: { slug: 'rag-form' },
    update: {},
    create: {
      slug: 'rag-form',
      title: 'RAG Form',
      form_schema: {},
      form_type: 'general',
      projectId: project.id
    }
  });

  // Create Submission (Always new for unique testing) or clean up previous?
  // Let's create new one every time to test fresh ingestion.
  // Actually, ingestion is by ID, so new ID is better.
  const submission = await prisma.submission.create({
    data: {
      form_id: form.id,
      data: { note: "The HVAC system in the basement is leaking." },
      status: 'pending'
    }
  });

  console.log(`✅ Created Submission ID: ${submission.id}`);

  // 2. Call Ingest Endpoint
  const response = await fetch(`${API_URL}/ai/ingest/${submission.id}`, {
    method: 'POST'
  });

  if (!response.ok) {
    const txt = await response.text();
    console.error(`❌ Ingestion API Failed: ${response.status} - ${txt}`);
    process.exit(1);
  }

  const result = await response.json();
  console.log('✅ Ingestion Response:', result);

  // 3. Verify Vector Storage
  // Use raw query to check vector existence (Prisma doesn't fully type it)
  const embedding = await prisma.$queryRaw`
    SELECT id, content FROM "VectorEmbedding" WHERE "submissionId" = ${submission.id}
  `;

  if ((embedding as any[]).length > 0) {
    console.log('✅ Vector Embedding Found:', (embedding as any[])[0]);
  } else {
    console.error('❌ No embedding found in DB.');
    process.exit(1);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
