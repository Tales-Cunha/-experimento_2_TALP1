import cors from 'cors';
import express from 'express';

import { alunosRouter } from './routes/alunos';
import { avaliacoesRouter } from './routes/avaliacoes';
import { turmasRouter } from './routes/turmas';
import { emailRouter } from './routes/email';
import { setupEmailDigestJob } from './jobs/emailDigestJob';

const app = express();
const port = Number(process.env.PORT ?? 3001);
const corsOrigin = process.env.CORS_ORIGIN ?? 'http://localhost:5173';

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
