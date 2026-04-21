import { Router, type Request, type Response } from 'express';

import { DuplicateError, NotFoundError, ValidationError } from '../errors';
import { TurmaService } from '../services/TurmaService';

const turmasRouter = Router();
const turmaService = new TurmaService();

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

turmasRouter.get('/', async (_request: Request, response: Response) => {
  try {
    const turmas = await turmaService.findAll();
    response.status(200).json(turmas);
  } catch (error: unknown) {
    handleRouteError(error, response);
  }
});

turmasRouter.get('/:id', async (request: Request, response: Response) => {
  try {
    const turma = await turmaService.findById(request.params.id);
    response.status(200).json(turma);
  } catch (error: unknown) {
    handleRouteError(error, response);
  }
});

turmasRouter.post('/', async (request: Request, response: Response) => {
  try {
    const { topico, ano, semestre } = request.body as {
      topico?: unknown;
      ano?: unknown;
      semestre?: unknown;
    };

    if (typeof topico !== 'string' || typeof ano !== 'number' || typeof semestre !== 'number') {
      throw new ValidationError('topico, ano, and semestre must be provided with valid types');
    }

    const createdTurma = await turmaService.create({ topico, ano, semestre });
    response.status(201).json(createdTurma);
  } catch (error: unknown) {
    handleRouteError(error, response);
  }
});

turmasRouter.put('/:id', async (request: Request, response: Response) => {
  try {
    const { topico, ano, semestre } = request.body as {
      topico?: unknown;
      ano?: unknown;
      semestre?: unknown;
    };

    const updateInput: { topico?: string; ano?: number; semestre?: number } = {};

    if (topico !== undefined) {
      if (typeof topico !== 'string') {
        throw new ValidationError('topico must be a string when provided');
      }

      updateInput.topico = topico;
    }

    if (ano !== undefined) {
      if (typeof ano !== 'number') {
        throw new ValidationError('ano must be a number when provided');
      }

      updateInput.ano = ano;
    }

    if (semestre !== undefined) {
      if (typeof semestre !== 'number') {
        throw new ValidationError('semestre must be a number when provided');
      }

      updateInput.semestre = semestre;
    }

    const updatedTurma = await turmaService.update(request.params.id, updateInput);
    response.status(200).json(updatedTurma);
  } catch (error: unknown) {
    handleRouteError(error, response);
  }
});

turmasRouter.delete('/:id', async (request: Request, response: Response) => {
  try {
    await turmaService.delete(request.params.id);
    response.status(204).send();
  } catch (error: unknown) {
    handleRouteError(error, response);
  }
});

turmasRouter.post('/:id/alunos/:alunoId', async (request: Request, response: Response) => {
  try {
    const updatedTurma = await turmaService.enrollStudent(
      request.params.id,
      request.params.alunoId,
    );

    response.status(200).json(updatedTurma);
  } catch (error: unknown) {
    handleRouteError(error, response);
  }
});

turmasRouter.delete('/:id/alunos/:alunoId', async (request: Request, response: Response) => {
  try {
    const updatedTurma = await turmaService.removeStudent(
      request.params.id,
      request.params.alunoId,
    );

    response.status(200).json(updatedTurma);
  } catch (error: unknown) {
    handleRouteError(error, response);
  }
});

export { turmasRouter };
