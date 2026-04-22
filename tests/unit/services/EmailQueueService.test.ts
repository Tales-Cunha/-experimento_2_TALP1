import { EmailQueueService } from '../../../server/src/services/EmailQueueService';
import { EmailQueueRepository } from '../../../server/src/repositories/EmailQueueRepository';
import { AlunoRepository } from '../../../server/src/repositories/AlunoRepository';
import type { Avaliacao, Aluno, EmailQueueEntry } from '../../../shared/types';

describe('EmailQueueService', () => {
  let emailQueueService: EmailQueueService;
  let mockEmailQueueRepository: jest.Mocked<EmailQueueRepository>;
  let mockAlunoRepository: jest.Mocked<AlunoRepository>;
  
  let inMemoryEntries: EmailQueueEntry[] = [];

  beforeEach(() => {
    inMemoryEntries = [];
    
    mockEmailQueueRepository = {
      addOrUpdate: jest.fn().mockImplementation(async (alunoId: string, date: string, change: any) => {
        const existingEntryIndex = inMemoryEntries.findIndex(
          (entry) => entry.alunoId === alunoId && entry.date === date,
        );

        if (existingEntryIndex !== -1) {
          const entry = inMemoryEntries[existingEntryIndex];
          const existingChangeIndex = entry.changes.findIndex(
            (c: any) => c.turmaId === change.turmaId && c.meta === change.meta,
          );

          if (existingChangeIndex !== -1) {
            entry.changes[existingChangeIndex].conceito = change.conceito;
          } else {
            entry.changes.push(change);
          }
        } else {
          inMemoryEntries.push({
            alunoId,
            date,
            changes: [change],
          });
        }
      }),
      findByDate: jest.fn().mockImplementation(async (date: string) => {
        return inMemoryEntries.filter((e) => e.date === date);
      }),
      clearForStudent: jest.fn(),
    } as unknown as jest.Mocked<EmailQueueRepository>;

    mockAlunoRepository = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<AlunoRepository>;

    emailQueueService = new EmailQueueService(mockEmailQueueRepository, mockAlunoRepository);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('queue() for a new (alunoId, date) → creates a new entry', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2024-05-10T12:00:00Z'));
    
    const avaliacao: Avaliacao = {
      id: 'av-1',
      alunoId: 'aluno-1',
      turmaId: 'turma-1',
      meta: 'Requisitos',
      conceito: 'MA',
      updatedAt: '2024-05-10T12:00:00Z'
    };

    await emailQueueService.queue(avaliacao, 'Engenharia de Software');

    expect(mockEmailQueueRepository.addOrUpdate).toHaveBeenCalledWith('aluno-1', '2024-05-10', {
      turmaId: 'turma-1',
      turmaNome: 'Engenharia de Software',
      meta: 'Requisitos',
      conceito: 'MA'
    });
    
    expect(inMemoryEntries).toHaveLength(1);
    expect(inMemoryEntries[0].changes).toHaveLength(1);
    expect(inMemoryEntries[0].changes[0].conceito).toBe('MA');
  });

  it('queue() for existing (alunoId, date, turmaId, meta) → replaces conceito, does NOT duplicate', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2024-05-10T12:00:00Z'));
    
    const avaliacao1: Avaliacao = { id: 'av-1', alunoId: 'aluno-1', turmaId: 'turma-1', meta: 'Requisitos', conceito: 'MPA', updatedAt: '' };
    const avaliacao2: Avaliacao = { id: 'av-2', alunoId: 'aluno-1', turmaId: 'turma-1', meta: 'Requisitos', conceito: 'MA', updatedAt: '' };

    await emailQueueService.queue(avaliacao1, 'Engenharia de Software');
    await emailQueueService.queue(avaliacao2, 'Engenharia de Software');

    expect(inMemoryEntries).toHaveLength(1);
    expect(inMemoryEntries[0].changes).toHaveLength(1);
    expect(inMemoryEntries[0].changes[0].conceito).toBe('MA');
  });

  it('queue() for existing (alunoId, date) but new (turmaId, meta) → appends to changes array', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2024-05-10T12:00:00Z'));
    
    const avaliacao1: Avaliacao = { id: 'av-1', alunoId: 'aluno-1', turmaId: 'turma-1', meta: 'Requisitos', conceito: 'MA', updatedAt: '' };
    const avaliacao2: Avaliacao = { id: 'av-2', alunoId: 'aluno-1', turmaId: 'turma-1', meta: 'Testes', conceito: 'MPA', updatedAt: '' };

    await emailQueueService.queue(avaliacao1, 'Engenharia de Software');
    await emailQueueService.queue(avaliacao2, 'Engenharia de Software');

    expect(inMemoryEntries).toHaveLength(1);
    expect(inMemoryEntries[0].changes).toHaveLength(2);
    expect(inMemoryEntries[0].changes[1].meta).toBe('Testes');
    expect(inMemoryEntries[0].changes[1].conceito).toBe('MPA');
  });

  it('getDigestsForToday() returns correct grouped data', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2024-05-10T12:00:00Z'));
    
    inMemoryEntries.push({
      alunoId: 'aluno-1',
      date: '2024-05-10',
      changes: [
        { turmaId: 'turma-1', turmaNome: 'Engenharia', meta: 'Requisitos', conceito: 'MA' }
      ]
    });

    const mockAluno: Aluno = { id: 'aluno-1', nome: 'João', cpf: '000.000.000-00', email: 'joao@example.com' };
    mockAlunoRepository.findById.mockResolvedValue(mockAluno);

    const digests = await emailQueueService.getDigestsForToday();

    expect(digests).toHaveLength(1);
    expect(digests[0].aluno).toEqual(mockAluno);
    expect(digests[0].changes).toHaveLength(1);
    expect(digests[0].changes[0].meta).toBe('Requisitos');
  });
});
