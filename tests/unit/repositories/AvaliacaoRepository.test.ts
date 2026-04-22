import { rm } from 'node:fs/promises';
import { AvaliacaoRepository } from '../../../server/src/repositories/AvaliacaoRepository';
import type { Conceito, Meta } from '../../../shared/types';

describe('AvaliacaoRepository', () => {
  let repository: AvaliacaoRepository;
  const TEST_DATA_DIR = '/tmp/test-data-avaliacao';

  beforeEach(() => {
    process.env.DATA_DIR = TEST_DATA_DIR;
    repository = new AvaliacaoRepository();
  });

  afterEach(async () => {
    await rm(TEST_DATA_DIR, { recursive: true, force: true });
  });

  const mockInput = {
    alunoId: 'aluno-id-1',
    turmaId: 'turma-id-1',
    meta: 'Requisitos' as Meta,
    conceito: 'MA' as Conceito,
  };

  it('findByTurma() returns empty array when file is empty', async () => {
    const result = await repository.findByTurma('some-turma-id');
    expect(result).toEqual([]);
  });

  it('findByAluno() returns empty array when file is empty', async () => {
    const result = await repository.findByAluno('some-aluno-id');
    expect(result).toEqual([]);
  });

  it('upsert() adds a new avaliacao if it doesn\'t exist and returns created=true', async () => {
    const result = await repository.upsert(mockInput);
    
    expect(result.created).toBe(true);
    expect(result.avaliacao.alunoId).toBe(mockInput.alunoId);
    expect(result.avaliacao.turmaId).toBe(mockInput.turmaId);
    expect(result.avaliacao.meta).toBe(mockInput.meta);
    expect(result.avaliacao.conceito).toBe(mockInput.conceito);
    expect(result.avaliacao.id).toBeDefined();
    expect(result.avaliacao.updatedAt).toBeDefined();

    const allByAluno = await repository.findByAluno(mockInput.alunoId);
    expect(allByAluno).toHaveLength(1);
    expect(allByAluno[0]).toEqual(result.avaliacao);
  });

  it('upsert() updates an existing avaliacao if it exists and returns created=false', async () => {
    // First upsert
    const firstResult = await repository.upsert(mockInput);
    expect(firstResult.created).toBe(true);

    // Second upsert with same alunoId, turmaId, meta but different conceito
    const updateInput = {
      ...mockInput,
      conceito: 'MPA' as Conceito,
    };
    
    const secondResult = await repository.upsert(updateInput);
    
    expect(secondResult.created).toBe(false);
    expect(secondResult.avaliacao.id).toBe(firstResult.avaliacao.id);
    expect(secondResult.avaliacao.conceito).toBe('MPA');

    const allByAluno = await repository.findByAluno(mockInput.alunoId);
    expect(allByAluno).toHaveLength(1); // Still only one
    expect(allByAluno[0]).toEqual(secondResult.avaliacao);
  });
});
