import { VectorEmbeddingEntity } from '../lib/dynamo/index.js';
import { nanoid } from 'nanoid';

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
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: text.replace(/\n/g, ' '),
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API Error: ${response.statusText}`);
      }

      const data = (await response.json()) as { data: Array<{ embedding: number[] }> };
      return data.data[0].embedding;
    } catch (error) {
      console.error('Embedding generation failed:', error);
      throw error;
    }
  }

  static async storeEmbedding(submissionId: string, projectId: string, content: string, pineconeId: string) {
    await VectorEmbeddingEntity.create({
      embeddingId: nanoid(),
      projectId,
      submissionId,
      pineconeId,
      textChunk: content,
    }).go();
  }

  static async ingestSubmission(submissionId: string, projectId: string, data: unknown) {
    const textContent = JSON.stringify(data);
    const _embedding = await this.generateEmbedding(textContent);
    // In production, you would upsert the embedding to Pinecone and store the ID
    const pineconeId = `sub-${submissionId}-${nanoid(8)}`;
    await this.storeEmbedding(submissionId, projectId, textContent, pineconeId);
    return { success: true };
  }
}
