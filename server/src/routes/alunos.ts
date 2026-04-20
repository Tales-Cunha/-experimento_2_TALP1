import { Router, type Request, type Response } from 'express';

import { DuplicateError, NotFoundError, ValidationError } from '../errors';
import { AlunoService } from '../services/AlunoService';

const alunosRouter = Router();
const alunoService = new AlunoService();

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

alunosRouter.get('/', async (_request: Request, response: Response) => {
  try {
    const alunos = await alunoService.findAll();
    response.status(200).json(alunos);
  } catch (error: unknown) {
    handleRouteError(error, response);
  }
});

alunosRouter.post('/', async (request: Request, response: Response) => {
  try {
    const { nome, cpf, email } = request.body as {
      nome?: string;
      cpf?: string;
      email?: string;
    };

    if (typeof nome !== 'string' || typeof cpf !== 'string' || typeof email !== 'string') {
      throw new ValidationError('nome, cpf, and email must be provided as strings');
    }

    const createdAluno = await alunoService.create({ nome, cpf, email });
    response.status(201).json(createdAluno);
  } catch (error: unknown) {
    handleRouteError(error, response);
  }
});

alunosRouter.put('/:id', async (request: Request, response: Response) => {
  try {
    const { id } = request.params;
    const { nome, cpf, email } = request.body as {
      nome?: unknown;
      cpf?: unknown;
      email?: unknown;
    };

    const updateInput: { nome?: string; cpf?: string; email?: string } = {};

    if (nome !== undefined) {
      if (typeof nome !== 'string') {
        throw new ValidationError('nome must be a string when provided');
      }
      updateInput.nome = nome;
    }

    if (cpf !== undefined) {
      if (typeof cpf !== 'string') {
        throw new ValidationError('cpf must be a string when provided');
      }
      updateInput.cpf = cpf;
    }

    if (email !== undefined) {
      if (typeof email !== 'string') {
        throw new ValidationError('email must be a string when provided');
      }
      updateInput.email = email;
    }

    const updatedAluno = await alunoService.update(id, updateInput);
    response.status(200).json(updatedAluno);
  } catch (error: unknown) {
    handleRouteError(error, response);
  }
});

alunosRouter.delete('/:id', async (request: Request, response: Response) => {
  try {
    const { id } = request.params;
    await alunoService.delete(id);
    response.status(204).send();
  } catch (error: unknown) {
    handleRouteError(error, response);
  }
});

export { alunosRouter };
