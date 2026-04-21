import type { Conceito, Meta, Avaliacao } from '../../../shared/types';
import { NotFoundError, ValidationError } from '../errors';
import { AlunoRepository } from '../repositories/AlunoRepository';
import { AvaliacaoRepository } from '../repositories/AvaliacaoRepository';
import { TurmaRepository } from '../repositories/TurmaRepository';
import { EmailQueueService } from './EmailQueueService';

const CONCEITOS_VALIDOS: ReadonlyArray<Conceito> = ['MANA', 'MPA', 'MA'];
const METAS_VALIDAS: ReadonlyArray<Meta> = [
  'Requisitos',
  'Testes',
  'Implementação',
  'Refatoração',
  'Documentação',
];

interface UpsertAvaliacaoInput {
  alunoId: string;
  turmaId: string;
  meta: string;
  conceito: string;
}

export class AvaliacaoService {
  constructor(
    private readonly avaliacaoRepository: AvaliacaoRepository = new AvaliacaoRepository(),
    private readonly alunoRepository: AlunoRepository = new AlunoRepository(),
    private readonly turmaRepository: TurmaRepository = new TurmaRepository(),
    private readonly emailQueueService: EmailQueueService = new EmailQueueService(),
  ) {}

  async findByTurma(turmaId: string): Promise<Avaliacao[]> {
    this.assertRequiredText(turmaId, 'turmaId');
    return this.avaliacaoRepository.findByTurma(turmaId);
  }

  async findByAluno(alunoId: string): Promise<Avaliacao[]> {
    this.assertRequiredText(alunoId, 'alunoId');
    return this.avaliacaoRepository.findByAluno(alunoId);
  }

  async upsert(input: UpsertAvaliacaoInput): Promise<{ avaliacao: Avaliacao; created: boolean }> {
    this.assertRequiredText(input.alunoId, 'alunoId');
    this.assertRequiredText(input.turmaId, 'turmaId');

    const conceito = this.assertConceito(input.conceito);
    const meta = this.assertMeta(input.meta);

    const aluno = await this.alunoRepository.findById(input.alunoId);
    if (!aluno) {
      throw new NotFoundError('Student not found');
    }

    const turma = await this.turmaRepository.findById(input.turmaId);
    if (!turma) {
      throw new NotFoundError('Class not found');
    }

    if (!turma.alunosIds.includes(input.alunoId)) {
      throw new ValidationError('Student is not enrolled in this class');
    }

    const result = await this.avaliacaoRepository.upsert({
      alunoId: input.alunoId,
      turmaId: input.turmaId,
      meta,
      conceito,
    });

    await this.emailQueueService.queue(result.avaliacao, turma.topico);

    return result;
  }

  private assertRequiredText(value: string, fieldName: string): void {
    if (value.trim().length === 0) {
      throw new ValidationError(`Field ${fieldName} is required`);
    }
  }

  private assertConceito(value: string): Conceito {
    if (!CONCEITOS_VALIDOS.includes(value as Conceito)) {
      throw new ValidationError('Field conceito must be one of MANA, MPA, or MA');
    }

    return value as Conceito;
  }

  private assertMeta(value: string): Meta {
    if (!METAS_VALIDAS.includes(value as Meta)) {
      throw new ValidationError('Field meta is invalid');
    }

    return value as Meta;
  }
}
