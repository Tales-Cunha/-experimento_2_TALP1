import type { Aluno, EmailQueueEntry } from '../../../shared/types';
import { promises as fs } from 'fs';
import path from 'path';
import * as https from 'https';

export class EmailSenderService {
  private readonly apiKey: string | undefined;
  private readonly emailFrom: string;
  private readonly isProduction: boolean;
  private readonly isTest: boolean;

  constructor() {
    this.isProduction = process.env.ENABLE_REAL_EMAIL === 'true';
    this.isTest = process.env.NODE_ENV === 'test';
    this.emailFrom = process.env.EMAIL_FROM || 'noreply@yourdomain.com';
    this.apiKey = process.env.MAILEROO_API_KEY;
  }

  async sendDigest(aluno: Aluno, changes: EmailQueueEntry['changes']): Promise<void> {
    const subject = 'Suas avaliações foram atualizadas';
    const html = this.buildDigestHtml(aluno, changes);

    if (this.isProduction && this.apiKey) {
      const payload = JSON.stringify({
        from: {
          address: this.emailFrom,
          display_name: 'SAMS Portal',
        },
        to: {
          address: aluno.email,
          display_name: aluno.nome,
        },
        subject,
        html,
      });

      const options = {
        hostname: 'smtp.maileroo.com',
        port: 443,
        path: '/api/v2/emails',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          'X-API-Key': this.apiKey,
        },
        timeout: 10000,
      };

      try {
        await new Promise<void>((resolve, reject) => {
          const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
              try {
                const result = JSON.parse(data);
                if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300 && result.success) {
                  console.log(`Successfully sent email to ${aluno.email} via Maileroo. ID: ${result.data?.reference_id}`);
                  resolve();
                } else {
                  console.error(`Maileroo API Error when sending to ${aluno.email}:`, result);
                  resolve();
                }
              } catch (e) {
                console.error(`Failed to parse Maileroo response for ${aluno.email}:`, data);
                resolve();
              }
            });
          });

          req.on('error', (error) => {
            reject(error);
          });

          req.on('timeout', () => {
            req.destroy();
            reject(new Error('Maileroo request timed out'));
          });

          req.write(payload);
          req.end();
        });
      } catch (error) {
        console.error(`Failed to send email to ${aluno.email}:`, error);
      }
    } else {
      if (this.isTest) {
        const dataDir = process.env.DATA_DIR || '/data';
        const filePath = path.join(dataDir, 'sentEmails.json');
        
        let sentEmails = [];
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          sentEmails = JSON.parse(content);
        } catch {
          // File might not exist or be empty
        }

        sentEmails.push({
          to: aluno.email,
          subject,
          html,
          timestamp: new Date().toISOString()
        });

        await fs.writeFile(filePath, JSON.stringify(sentEmails, null, 2), 'utf-8');
      }

      console.log('--- Email Digest (Simulation) ---');
      console.log(`To: ${aluno.nome} <${aluno.email}>`);
      console.log(`From: ${this.emailFrom}`);
      console.log(`Subject: ${subject}`);
      console.log('Content:');
      console.log(html);
      console.log('---------------------------------');
    }
  }

  private buildDigestHtml(aluno: Aluno, changes: EmailQueueEntry['changes']): string {
    const changesList = changes
      .map(
        (c) =>
          `<li><strong>${c.turmaNome}</strong> - ${c.meta}: <code>${c.conceito}</code></li>`,
      )
      .join('');

    return `
      <div style="font-family: sans-serif; line-height: 1.5; color: #333;">
        <h1>Olá, ${aluno.nome}!</h1>
        <p>Suas avaliações foram atualizadas hoje:</p>
        <ul>
          ${changesList}
        </ul>
        <p>Atenciosamente,<br>Sistema de Avaliações</p>
      </div>
    `;
  }
}
