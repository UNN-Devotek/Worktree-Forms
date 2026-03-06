import { EmbeddingService } from './embedding.service.js';

// Zero-dependency mock for stability
export class AiService {
  static async query(question: string, projectId: string) {
    // Generate embedding for the question (for context retrieval)
    let context = '';
    try {
      const cleanQuestion = question.replace(/\n/g, ' ');
      const _embedding = await EmbeddingService.generateEmbedding(cleanQuestion);

      // In production, you would query Pinecone with the embedding vector
      // and retrieve matching text chunks. For now, use a fallback.
      context = 'Search unavailable (DynamoDB does not support vector similarity search directly).';
    } catch (e) {
      console.error('Vector search failed, using fallback', e);
      context = 'Search unavailable.';
    }

    // Return a simple readable stream (Node native)
    const mockResponse = `[MOCK AI - No Deps] Context found: ${context.substring(0, 50)}... Answer: The HVAC needs repair.`;

    // Create a generator/iterator for streaming
    async function* streamGenerator() {
      const chunks = mockResponse.split(' ');
      for (const chunk of chunks) {
        yield chunk + ' ';
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    }

    return streamGenerator();
  }
}
