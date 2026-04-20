import { randomUUID } from 'node:crypto';

import type { Aluno } from '../../../shared/types';
import { validateCpf } from '../../../shared/utils/cpfValidator';
import { DuplicateError, NotFoundError, ValidationError } from '../errors';
import { AlunoRepository } from '../repositories/AlunoRepository';

interface CreateAlunoInput {
  nome: string;
  cpf: string;
  email: string;
}

interface UpdateAlunoInput {
  nome?: string;
  cpf?: string;
  email?: string;
}

export class AlunoService {
  constructor(private readonly alunoRepository: AlunoRepository = new AlunoRepository()) {}

  async findAll(): Promise<Aluno[]> {
    return this.alunoRepository.findAll();
  }

  async create(input: CreateAlunoInput): Promise<Aluno> {
    this.assertRequiredText(input.nome, 'nome');
    this.assertRequiredText(input.cpf, 'cpf');
    this.assertRequiredText(input.email, 'email');

    const cpfValidation = validateCpf(input.cpf);

    if (!cpfValidation.valid) {
      throw new ValidationError(cpfValidation.error ?? 'Invalid CPF');
    }

    const existingAluno = await this.alunoRepository.findByCpf(input.cpf);

    if (existingAluno) {
      throw new DuplicateError('A student with this CPF already exists');
    }

    const newAluno: Aluno = {
      id: randomUUID(),
      nome: input.nome.trim(),
      cpf: input.cpf,
      email: input.email.trim(),
    };

    return this.alunoRepository.save(newAluno);
  }

  async update(id: string, input: UpdateAlunoInput): Promise<Aluno> {
    const existingAluno = await this.alunoRepository.findById(id);

    if (!existingAluno) {
      throw new NotFoundError('Student not found');
    }

    const updateData: Partial<Omit<Aluno, 'id'>> = {};

    if (input.nome !== undefined) {
      this.assertRequiredText(input.nome, 'nome');
      updateData.nome = input.nome.trim();
    }

    if (input.email !== undefined) {
      this.assertRequiredText(input.email, 'email');
      updateData.email = input.email.trim();
    }

    if (input.cpf !== undefined) {
      this.assertRequiredText(input.cpf, 'cpf');

      const cpfValidation = validateCpf(input.cpf);
      if (!cpfValidation.valid) {
        throw new ValidationError(cpfValidation.error ?? 'Invalid CPF');
      }

      const duplicateAluno = await this.alunoRepository.findByCpf(input.cpf);
      if (duplicateAluno && duplicateAluno.id !== id) {
        throw new DuplicateError('A student with this CPF already exists');
      }

      updateData.cpf = input.cpf;
    }

    if (Object.keys(updateData).length === 0) {
      throw new ValidationError('At least one field must be provided for update');
    }

    const updatedAluno = await this.alunoRepository.update(id, updateData);

    if (!updatedAluno) {
      throw new NotFoundError('Student not found');
    }

    return updatedAluno;
  }

  async delete(id: string): Promise<void> {
    const wasDeleted = await this.alunoRepository.delete(id);

    if (!wasDeleted) {
      throw new NotFoundError('Student not found');
    }
  }

  private assertRequiredText(value: string, fieldName: string): void {
    if (value.trim().length === 0) {
      throw new ValidationError(`Field ${fieldName} is required`);
    }
  }
}
