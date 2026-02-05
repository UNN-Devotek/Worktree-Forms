
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Verifying RFI Publish Logic...');

    try {
        // 1. Setup: Find a project and its creator
        const project = await prisma.project.findFirst({
            include: { createdBy: true }
        });

        if (!project) throw new Error('No project found');
        console.log(`Using Project: ${project.name} (Creator: ${project.createdBy.email})`);

        // 2. Create RFI (simulating API call)
        // We'll use the creator as the author for simplicity, or another user if available.
        // Needs RfiService logic but we are testing via Service directly or just DB?
        // Let's test via Service class to verify logic.
        
        // Import Service dynamically or mock the call? 
        // We can't easily import Service here if it's not exported to scripts.
        // But we modified the source code, so we should test the API via fetch OR test the Service logic if we can run ts-node.
        
        // Let's rely on API verification script style.
        // We will make HTTP requests to the running backend.
        
        // Base URL
        const API_URL = 'http://localhost:5005/api'; // Backend Port
        
        // Headers
        const headers = {
            'Content-Type': 'application/json',
            'x-user-id': project.createdById // Mock auth
        };

        // Create RFI
        const createRes = await fetch(`${API_URL}/projects/${project.id}/rfis`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                title: 'Test RFI for Publish',
                question: 'Does publishing assign this?',
                images: []
            })
        });

        const rfiData = await createRes.json();
        if (!rfiData.success) throw new Error('Failed to create RFI: ' + JSON.stringify(rfiData));
        const rfiId = rfiData.data.id;
        console.log(`Created RFI: ${rfiId} (Status: ${rfiData.data.status})`);

        if (rfiData.data.status !== 'DRAFT') throw new Error('RFI should be DRAFT on creation');

        // 3. Publish RFI
        const pubRes = await fetch(`${API_URL}/rfis/${rfiId}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ status: 'OPEN' })
        });
        
        const pubData = await pubRes.json();
        if (!pubData.success) throw new Error('Failed to publish RFI: ' + JSON.stringify(pubData));

        // 4. Verify Assignment
        const updatedRfi = pubData.data;
        console.log(`Updated RFI Status: ${updatedRfi.status}`);
        console.log(`Assigned To: ${updatedRfi.assignedToId}`);

        if (updatedRfi.status !== 'OPEN') throw new Error('Status did not change to OPEN');
        if (updatedRfi.assignedToId !== project.createdById) {
            throw new Error(`Assignment Failed! Expected ${project.createdById}, got ${updatedRfi.assignedToId}`);
        }

        console.log('✅ PASS: RFI Publish Logic verified.');

    } catch (e) {
        console.error('FAILED:', e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
