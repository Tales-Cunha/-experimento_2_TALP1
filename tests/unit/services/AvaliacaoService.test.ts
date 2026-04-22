import { AvaliacaoService } from '../../../server/src/services/AvaliacaoService';
import { AvaliacaoRepository } from '../../../server/src/repositories/AvaliacaoRepository';
import { AlunoRepository } from '../../../server/src/repositories/AlunoRepository';
import { TurmaRepository } from '../../../server/src/repositories/TurmaRepository';
import { EmailQueueService } from '../../../server/src/services/EmailQueueService';
import { ValidationError } from '../../../server/src/errors';
import type { Aluno, Turma, Avaliacao } from '../../../shared/types';

describe('AvaliacaoService', () => {
  let avaliacaoService: AvaliacaoService;
  let mockAvaliacaoRepository: jest.Mocked<AvaliacaoRepository>;
  let mockAlunoRepository: jest.Mocked<AlunoRepository>;
  let mockTurmaRepository: jest.Mocked<TurmaRepository>;
  let mockEmailQueueService: jest.Mocked<EmailQueueService>;

  beforeEach(() => {
    mockAvaliacaoRepository = {
      findByTurma: jest.fn(),
      findByAluno: jest.fn(),
      upsert: jest.fn(),
    } as unknown as jest.Mocked<AvaliacaoRepository>;

    mockAlunoRepository = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<AlunoRepository>;

    mockTurmaRepository = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<TurmaRepository>;

    mockEmailQueueService = {
      queue: jest.fn(),
    } as unknown as jest.Mocked<EmailQueueService>;

    avaliacaoService = new AvaliacaoService(
      mockAvaliacaoRepository,
      mockAlunoRepository,
      mockTurmaRepository,
      mockEmailQueueService
    );
  });

  it('setAvaliacao() with valid data → calls repository.upsert() and EmailQueueService.queue()', async () => {
    const input = { alunoId: 'aluno-1', turmaId: 'turma-1', meta: 'Requisitos', conceito: 'MA' };
    const mockAluno: Aluno = { id: 'aluno-1', nome: 'Test', cpf: '051.961.079-24', email: 'test@example.com' };
    const mockTurma: Turma = { id: 'turma-1', topico: 'Engenharia de Software', ano: 2024, semestre: 1, alunosIds: ['aluno-1'] };
    const mockAvaliacao: Avaliacao = { id: 'av-1', alunoId: 'aluno-1', turmaId: 'turma-1', meta: 'Requisitos', conceito: 'MA', updatedAt: new Date().toISOString() };

    mockAlunoRepository.findById.mockResolvedValue(mockAluno);
    mockTurmaRepository.findById.mockResolvedValue(mockTurma);
    mockAvaliacaoRepository.upsert.mockResolvedValue({ avaliacao: mockAvaliacao, created: true });

    const result = await avaliacaoService.upsert(input);

    expect(mockAvaliacaoRepository.upsert).toHaveBeenCalledTimes(1);
    expect(mockAvaliacaoRepository.upsert).toHaveBeenCalledWith({
      alunoId: 'aluno-1',
      turmaId: 'turma-1',
      meta: 'Requisitos',
      conceito: 'MA',
    });
    expect(mockEmailQueueService.queue).toHaveBeenCalledTimes(1);
    expect(mockEmailQueueService.queue).toHaveBeenCalledWith(mockAvaliacao, 'Engenharia de Software');
    expect(result).toEqual({ avaliacao: mockAvaliacao, created: true });
  });

  it('setAvaliacao() with invalid conceito → throws ValidationError', async () => {
    const input = { alunoId: 'aluno-1', turmaId: 'turma-1', meta: 'Requisitos', conceito: 'INVALID' };

    await expect(avaliacaoService.upsert(input)).rejects.toThrow(ValidationError);
  });

  it('setAvaliacao() with invalid meta → throws ValidationError', async () => {
    const input = { alunoId: 'aluno-1', turmaId: 'turma-1', meta: 'INVALID', conceito: 'MA' };

    await expect(avaliacaoService.upsert(input)).rejects.toThrow(ValidationError);
  });

  it('setAvaliacao() for student not enrolled in turma → throws ValidationError', async () => {
    const input = { alunoId: 'aluno-1', turmaId: 'turma-1', meta: 'Requisitos', conceito: 'MA' };
    const mockAluno: Aluno = { id: 'aluno-1', nome: 'Test', cpf: '051.961.079-24', email: 'test@example.com' };
    const mockTurma: Turma = { id: 'turma-1', topico: 'Software', ano: 2024, semestre: 1, alunosIds: ['other-aluno'] };

    mockAlunoRepository.findById.mockResolvedValue(mockAluno);
    mockTurmaRepository.findById.mockResolvedValue(mockTurma);

    await expect(avaliacaoService.upsert(input)).rejects.toThrow(ValidationError);
  });
});
