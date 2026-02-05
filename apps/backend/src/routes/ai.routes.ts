import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';
import { EmbeddingService } from '../services/embedding.service.js';
import { AiService } from '../services/ai.service.js';

const router = Router();

// ==========================================
// AI ROUTES
// ==========================================

router.post('/ingest/:submissionId', async (req: Request, res: Response) => {
  try {
    const { submissionId } = req.params;
    const submission = await prisma.submission.findUnique({ 
        where: { id: Number(submissionId) },
        include: { form: true } 
    });
    if (!submission) return res.status(404).json({ error: 'Submission not found' });
    if (!submission.form?.projectId) return res.status(400).json({ error: 'Project context missing' });

    await EmbeddingService.ingestSubmission(submission.id, submission.form.projectId, submission.data);
    res.json({ success: true, message: 'Ingested into Vector DB' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ingestion failed' });
  }
});

router.post('/chat', async (req: Request, res: Response) => {
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
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

export default router;
