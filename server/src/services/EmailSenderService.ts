import { Resend } from 'resend';
import type { Aluno, EmailQueueEntry } from '../../../shared/types';
import { promises as fs } from 'fs';
import path from 'path';

export class EmailSenderService {
  private readonly resend: Resend | null = null;
  private readonly emailFrom: string;
  private readonly isProduction: boolean;
  private readonly isTest: boolean;

  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.isTest = process.env.NODE_ENV === 'test';
    this.emailFrom = process.env.EMAIL_FROM || 'noreply@yourdomain.com';

    if (this.isProduction) {
      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey) {
        console.warn('RESEND_API_KEY environment variable is missing. Email sending will be skipped even in production.');
      } else {
        this.resend = new Resend(apiKey);
      }
    }
  }

  async sendDigest(aluno: Aluno, changes: EmailQueueEntry['changes']): Promise<void> {
    const subject = 'Suas avaliações foram atualizadas';
    const html = this.buildDigestHtml(aluno, changes);

    if (this.isProduction && this.resend) {
      try {
        const { data, error } = await this.resend.emails.send({
          from: this.emailFrom,
          to: aluno.email,
          subject,
          html,
        });

        if (error) {
          console.error(`Resend API Error when sending to ${aluno.email}:`, error);
        } else {
          console.log(`Successfully sent email to ${aluno.email}. ID: ${data?.id}`);
        }
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
