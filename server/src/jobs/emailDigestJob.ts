import cron from 'node-cron';
import { EmailQueueService } from '../services/EmailQueueService';
import { EmailSenderService } from '../services/EmailSenderService';

export function setupEmailDigestJob() {
  const cronSchedule = process.env.CRON_SCHEDULE || '0 18 * * *';
  
  const emailQueueService = new EmailQueueService();
  const emailSenderService = new EmailSenderService();

  console.log(`[Job] Email digest job scheduled with: "${cronSchedule}"`);

  cron.schedule(cronSchedule, async () => {
    console.log(`[Job] Starting daily email digest job (${new Date().toISOString()})...`);
    
    try {
      const digests = await emailQueueService.getDigestsForToday();
      
      if (digests.length === 0) {
        console.log('[Job] No digests to send today.');
        return;
      }

      for (const digest of digests) {
        try {
          await emailSenderService.sendDigest(digest.aluno, digest.changes);
          await emailQueueService.clearDigestForStudent(digest.aluno.id);
        } catch (innerError) {
          console.error(`[Job] Failed to process digest for student ${digest.aluno.id}:`, innerError);
        }
      }

      console.log(`[Job] Daily email digest job completed. ${digests.length} digests processed.`);
    } catch (error) {
      console.error('[Job] Daily email digest job failed:', error);
    }
  });
}
