import { randomUUID } from 'node:crypto';

import type { Aluno, Turma } from '../../../shared/types';
import { DuplicateError, NotFoundError, ValidationError } from '../errors';
import { AlunoRepository } from '../repositories/AlunoRepository';
import { TurmaRepository } from '../repositories/TurmaRepository';

interface CreateTurmaInput {
  topico: string;
  ano: number;
  semestre: number;
}

interface UpdateTurmaInput {
  topico?: string;
  ano?: number;
  semestre?: number;
}

export interface TurmaWithAlunos extends Turma {
  alunos: Aluno[];
}

export class TurmaService {
  constructor(
    private readonly turmaRepository: TurmaRepository = new TurmaRepository(),
    private readonly alunoRepository: AlunoRepository = new AlunoRepository(),
  ) {}

  async findAll(): Promise<TurmaWithAlunos[]> {
    const [turmas, alunos] = await Promise.all([
      this.turmaRepository.findAll(),
      this.alunoRepository.findAll(),
    ]);

    return turmas.map((turma) => this.toTurmaWithAlunos(turma, alunos));
  }

  async findById(id: string): Promise<TurmaWithAlunos> {
    const turma = await this.turmaRepository.findById(id);

    if (!turma) {
      throw new NotFoundError('Class not found');
    }

    const alunos = await this.alunoRepository.findAll();
    return this.toTurmaWithAlunos(turma, alunos);
  }

  async create(input: CreateTurmaInput): Promise<TurmaWithAlunos> {
    this.assertRequiredText(input.topico, 'topico');
    this.assertValidAno(input.ano);
    this.assertValidSemestre(input.semestre);

    const newTurma: Turma = {
      id: randomUUID(),
      topico: input.topico.trim(),
      ano: input.ano,
      semestre: input.semestre as 1 | 2,
      alunosIds: [],
    };

    const savedTurma = await this.turmaRepository.save(newTurma);
    return {
      ...savedTurma,
      alunos: [],
    };
  }

  async update(id: string, input: UpdateTurmaInput): Promise<TurmaWithAlunos> {
    const existingTurma = await this.turmaRepository.findById(id);

    if (!existingTurma) {
      throw new NotFoundError('Class not found');
    }

    const updateData: Partial<Omit<Turma, 'id'>> = {};

    if (input.topico !== undefined) {
      this.assertRequiredText(input.topico, 'topico');
      updateData.topico = input.topico.trim();
    }

    if (input.ano !== undefined) {
      this.assertValidAno(input.ano);
      updateData.ano = input.ano;
    }

    if (input.semestre !== undefined) {
      this.assertValidSemestre(input.semestre);
      updateData.semestre = input.semestre as 1 | 2;
    }

    if (Object.keys(updateData).length === 0) {
      throw new ValidationError('At least one field must be provided for update');
    }

    const updatedTurma = await this.turmaRepository.update(id, updateData);

    if (!updatedTurma) {
      throw new NotFoundError('Class not found');
    }

    const alunos = await this.alunoRepository.findAll();
    return this.toTurmaWithAlunos(updatedTurma, alunos);
  }

  async delete(id: string): Promise<void> {
    const existingTurma = await this.turmaRepository.findById(id);
    if (!existingTurma) {
      throw new NotFoundError('Class not found');
    }
    if (existingTurma.alunosIds.length > 0) {
      throw new ValidationError('Cannot delete a class with enrolled students');
    }

    const wasDeleted = await this.turmaRepository.delete(id);

    if (!wasDeleted) {
      throw new NotFoundError('Class not found');
    }
  }

  async enrollStudent(turmaId: string, alunoId: string): Promise<TurmaWithAlunos> {
    const turma = await this.turmaRepository.findById(turmaId);

    if (!turma) {
      throw new NotFoundError('Class not found');
    }

    const aluno = await this.alunoRepository.findById(alunoId);

    if (!aluno) {
      throw new NotFoundError('Student not found');
    }

    if (turma.alunosIds.includes(alunoId)) {
      throw new DuplicateError('Student is already enrolled in this class');
    }

    const updatedTurma = await this.turmaRepository.update(turmaId, {
      alunosIds: [...turma.alunosIds, alunoId],
    });

    if (!updatedTurma) {
      throw new NotFoundError('Class not found');
    }

    const alunos = await this.alunoRepository.findAll();
    return this.toTurmaWithAlunos(updatedTurma, alunos);
  }

  async removeStudent(turmaId: string, alunoId: string): Promise<TurmaWithAlunos> {
    const turma = await this.turmaRepository.findById(turmaId);

    if (!turma) {
      throw new NotFoundError('Class not found');
    }

    if (!turma.alunosIds.includes(alunoId)) {
      throw new NotFoundError('Student is not enrolled in this class');
    }

    const updatedTurma = await this.turmaRepository.update(turmaId, {
      alunosIds: turma.alunosIds.filter((id) => id !== alunoId),
    });

    if (!updatedTurma) {
      throw new NotFoundError('Class not found');
    }

    const alunos = await this.alunoRepository.findAll();
    return this.toTurmaWithAlunos(updatedTurma, alunos);
  }

  private toTurmaWithAlunos(turma: Turma, alunos: Aluno[]): TurmaWithAlunos {
    const alunosById = new Map(alunos.map((aluno) => [aluno.id, aluno]));

    return {
      ...turma,
      alunos: turma.alunosIds
        .map((alunoId) => alunosById.get(alunoId))
        .filter((aluno): aluno is Aluno => aluno !== undefined),
    };
  }

  private assertRequiredText(value: string, fieldName: string): void {
    if (value.trim().length === 0) {
      throw new ValidationError(`Field ${fieldName} is required`);
    }
  }

  private assertValidAno(value: number): void {
    if (!Number.isInteger(value) || value < 1) {
      throw new ValidationError('Field ano must be a positive integer');
    }
  }

  private assertValidSemestre(value: number): void {
    if (value !== 1 && value !== 2) {
      throw new ValidationError('Field semestre must be 1 or 2');
    }
  }
}
