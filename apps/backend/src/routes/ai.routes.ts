import { Router, Request, Response } from 'express';
import { SubmissionEntity } from '../lib/dynamo/index.js';
import { EmbeddingService } from '../services/embedding.service.js';
import { embedSubmission, semanticSearch } from '../services/embedding.service.js';
import { AiService } from '../services/ai.service.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireProjectAccess } from '../middleware/rbac.js';

const router = Router();

// ==========================================
// AI ROUTES
// ==========================================

/**
 * POST /ingest/:submissionId
 * Ingest a submission into the vector store (legacy endpoint).
 */
router.post('/ingest/:submissionId', authenticate, async (req: Request, res: Response) => {
  try {
    const { submissionId } = req.params;
    const projectId = req.body.projectId || (req.query.projectId as string);

    if (!projectId) {
      return res.status(400).json({ success: false, error: 'projectId is required' });
    }

    const subResult = await SubmissionEntity.get({ projectId, submissionId }).go();
    const submission = subResult.data;
    if (!submission) return res.status(404).json({ success: false, error: 'Submission not found' });

    await EmbeddingService.ingestSubmission(submission.submissionId, projectId, submission.data);
    res.json({ success: true, message: 'Ingested into Vector DB' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Ingestion failed' });
  }
});

/**
 * POST /projects/:projectId/submissions/:submissionId/embed
 * Embed a specific submission into Pinecone for semantic search.
 */
router.post(
  '/projects/:projectId/submissions/:submissionId/embed',
  authenticate,
  requireProjectAccess('EDITOR'),
  async (req: Request, res: Response) => {
    const { projectId, submissionId } = req.params;
    const { formId, data } = req.body;

    try {
      const record =
        data && typeof data === 'object'
          ? (data as Record<string, unknown>)
          : undefined;

      if (!record) {
        return res.status(400).json({ success: false, error: 'data object is required' });
      }

      await embedSubmission(projectId, submissionId, formId ?? '', record);
      res.json({ success: true });
    } catch (error) {
      console.error('Embedding failed:', error);
      res.status(500).json({ success: false, error: 'Embedding failed' });
    }
  },
);

/**
 * POST /projects/:projectId/search
 * Semantic search across project submissions.
 */
router.post(
  '/projects/:projectId/search',
  authenticate,
  requireProjectAccess('VIEWER'),
  async (req: Request, res: Response) => {
    const { projectId } = req.params;
    const { query, topK } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ success: false, error: 'query string is required' });
    }

    try {
      const results = await semanticSearch(query, projectId, topK ?? 5);
      res.json({ success: true, data: results });
    } catch (error) {
      console.error('Semantic search failed:', error);
      res.status(500).json({ success: false, error: 'Search failed' });
    }
  },
);

/**
 * POST /chat
 * Chat endpoint with RAG-powered streaming response.
 */
router.post('/chat', authenticate, async (req: Request, res: Response) => {
  try {
    const { messages, projectId } = req.body;
    const lastMessage = messages[messages.length - 1];
    const targetProject = projectId || 'rag-test-project';

    const stream = await AiService.query(lastMessage.content, targetProject);

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');

    for await (const chunk of stream) {
      res.write(chunk);
    }
    res.end();
  } catch (error) {
    console.error('AI Chat Error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate response' });
  }
});

export default router;
