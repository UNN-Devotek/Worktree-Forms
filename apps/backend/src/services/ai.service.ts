/**
 * AI service for RAG-powered question answering.
 *
 * Retrieves relevant submission context from Pinecone via semantic
 * search and streams a response back to the caller.
 */
import { semanticSearch } from './embedding.service.js';

export class AiService {
  /**
   * Query the AI assistant with a natural-language question.
   * Retrieves relevant context from Pinecone and streams the answer.
   */
  static async query(question: string, projectId: string) {
    let context = '';
    try {
      const relevantDocs = await semanticSearch(question, projectId, 5);
      context = relevantDocs.map((d) => d.text).join('\n\n');
    } catch (e) {
      console.error('Vector search failed, using fallback', e);
      context = 'Search unavailable.';
    }

    if (!context.trim()) {
      context = 'No relevant documents found.';
    }

    // TODO(10.3): Replace mock streaming with OpenAI ChatCompletion call
    // using the retrieved context as system prompt augmentation.
    const mockResponse = `[AI] Context found (${context.length} chars): ${context.substring(0, 200)}... Based on the available data, the system found ${context.split('\n\n').length} relevant document(s) for your query.`;

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
