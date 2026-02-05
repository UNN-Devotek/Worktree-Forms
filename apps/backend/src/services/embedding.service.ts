
import { prisma } from '../db'; // Reuse singleton

export class EmbeddingService {
  private static readonly OPENAI_API_URL = 'https://api.openai.com/v1/embeddings';

  static async generateEmbedding(text: string): Promise<number[]> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey.startsWith('sk-placeholder')) {
      console.warn('OpenAI API Key missing or placeholder. Returning mock embedding.');
      return new Array(1536).fill(0).map(() => Math.random());
    }

    try {
      const response = await fetch(this.OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: text.replace(/\n/g, ' ')
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API Error: ${response.statusText}`);
      }

      const data = await response.json() as any;
      return data.data[0].embedding;
    } catch (error) {
      console.error('Embedding generation failed:', error);
      throw error;
    }
  }

  static async storeEmbedding(submissionId: number, projectId: string, content: string, embedding: number[]) {
    // Store embedding as JSON array (compatible with databases without pgvector)
    await prisma.vectorEmbedding.create({
      data: {
        submissionId,
        projectId,
        content,
        embedding: embedding // Prisma will serialize as JSON
      }
    });
  }

  static async ingestSubmission(submissionId: number, projectId: string, data: any) {
    // Convert submission JSON to string (simplistic for MVP)
    const textContent = JSON.stringify(data);
    const embedding = await this.generateEmbedding(textContent);
    await this.storeEmbedding(submissionId, projectId, textContent, embedding);
    return { success: true };
  }
}
