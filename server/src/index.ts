import cors from 'cors';
import express from 'express';
import dns from 'node:dns';

import { alunosRouter } from './routes/alunos';
import { avaliacoesRouter } from './routes/avaliacoes';
import { turmasRouter } from './routes/turmas';
import { emailRouter } from './routes/email';
import { setupEmailDigestJob } from './jobs/emailDigestJob';

dns.setDefaultResultOrder('ipv4first');

function normalizeOrigin(origin: string): string {
  const trimmed = origin.trim().replace(/\/$/, '');

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith('localhost') || trimmed.startsWith('127.0.0.1')) {
    return `http://${trimmed}`;
  }

  return `https://${trimmed}`;
}

const app = express();
const port = Number(process.env.PORT ?? 3001);
const corsOrigin = normalizeOrigin(process.env.CORS_ORIGIN ?? 'http://localhost:5173');

setupEmailDigestJob();

app.use(
  cors({
    origin: corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type'],
  }),
);
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/alunos', alunosRouter);
app.use('/api/turmas', turmasRouter);
app.use('/api/email', emailRouter);
app.use('/api', avaliacoesRouter);

app.listen(port, '0.0.0.0', () => {
  console.log(`Server listening on port ${port}`);
});
