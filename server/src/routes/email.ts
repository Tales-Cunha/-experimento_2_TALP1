import { Router, type Request, type Response } from 'express';
import { EmailQueueService } from '../services/EmailQueueService';
import { EmailSenderService } from '../services/EmailSenderService';

const emailRouter = Router();

emailRouter.post('/send-digest', async (_request: Request, response: Response) => {
  if (process.env.NODE_ENV !== 'test') {
    response.status(403).json({ error: 'This endpoint is only available in test environment' });
    return;
  }

  try {
    const emailQueueService = new EmailQueueService();
    const emailSenderService = new EmailSenderService();

    const digests = await emailQueueService.getDigestsForToday();
    
    for (const digest of digests) {
      await emailSenderService.sendDigest(digest.aluno, digest.changes);
      await emailQueueService.clearDigestForStudent(digest.aluno.id);
    }

    response.status(200).json({ status: 'ok', processed: digests.length });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    response.status(500).json({ error: message });
  }
});

export { emailRouter };
