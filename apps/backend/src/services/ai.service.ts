
import { prisma } from '../db';
import { EmbeddingService } from './embedding.service';

// Zero-dependency mock for stability
export class AiService {
  static async query(question: string, projectId: string) {
    // 1. Generate Embedding for the Question (Keep this if EmbeddingService works, otherwise mock it too)
    // Assuming EmbeddingService works (it uses fetch). 
    // If EmbeddingService crashes, we mock this too.
    
    // Let's try to keep EmbeddingService usage to verify DB connection.
    let context = "";
    try {
        const cleanQuestion = question.replace(/\n/g, ' ');
        const embedding = await EmbeddingService.generateEmbedding(cleanQuestion);
        
        const vectorString = `[${embedding.join(',')}]`;
        
        const results = await prisma.$queryRaw`
        SELECT content, 1 - (vector <=> ${vectorString}::vector) as similarity
        FROM "VectorEmbedding"
        WHERE "projectId" = ${projectId}
        ORDER BY vector <=> ${vectorString}::vector
        LIMIT 5
        `;

        context = (results as any[])
        .map((r) => r.content)
        .join('\n\n');
    } catch (e) {
        console.error("Vector search failed, using fallback", e);
        context = "Search unavailable.";
    }

    // Return a simple readable stream (Node native)
    const mockResponse = `[MOCK AI - No Deps] Context found: ${context.substring(0, 50)}... Answer: The HVAC needs repair.`;
    
    // Create a generator/iterator for streaming
    async function* streamGenerator() {
         const chunks = mockResponse.split(' ');
         for (const chunk of chunks) {
             yield chunk + ' ';
             await new Promise(resolve => setTimeout(resolve, 50));
         }
    }
    
    return streamGenerator();
  }
}
