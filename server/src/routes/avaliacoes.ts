import { Router, type Request, type Response } from 'express';

import { DuplicateError, NotFoundError, ValidationError } from '../errors';
import { AvaliacaoService } from '../services/AvaliacaoService';

const avaliacoesRouter = Router();
const avaliacaoService = new AvaliacaoService();

function handleRouteError(error: unknown, response: Response): void {
  if (error instanceof ValidationError) {
    response.status(400).json({ error: error.message });
    return;
  }

  if (error instanceof NotFoundError) {
    response.status(404).json({ error: error.message });
    return;
  }

  if (error instanceof DuplicateError) {
    response.status(409).json({ error: error.message });
    return;
  }

  response.status(500).json({ error: 'Internal server error' });
}

avaliacoesRouter.get('/turmas/:id/avaliacoes', async (request: Request, response: Response) => {
  try {
    const avaliacoes = await avaliacaoService.findByTurma(request.params.id);
    response.status(200).json(avaliacoes);
  } catch (error: unknown) {
    handleRouteError(error, response);
  }
});

avaliacoesRouter.get('/alunos/:id/avaliacoes', async (request: Request, response: Response) => {
  try {
    const avaliacoes = await avaliacaoService.findByAluno(request.params.id);
    response.status(200).json(avaliacoes);
  } catch (error: unknown) {
    handleRouteError(error, response);
  }
});

avaliacoesRouter.post('/avaliacoes', async (request: Request, response: Response) => {
  try {
    const { alunoId, turmaId, meta, conceito } = request.body as {
      alunoId?: unknown;
      turmaId?: unknown;
      meta?: unknown;
      conceito?: unknown;
    };

    if (
      typeof alunoId !== 'string' ||
      typeof turmaId !== 'string' ||
      typeof meta !== 'string' ||
      typeof conceito !== 'string'
    ) {
      throw new ValidationError(
        'alunoId, turmaId, meta, and conceito must be provided as strings',
      );
    }

    const result = await avaliacaoService.upsert({ alunoId, turmaId, meta, conceito });

    response.status(result.created ? 201 : 200).json(result.avaliacao);
  } catch (error: unknown) {
    handleRouteError(error, response);
  }
});

export { avaliacoesRouter };
