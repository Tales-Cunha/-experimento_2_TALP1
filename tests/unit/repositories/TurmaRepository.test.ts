import { rm } from 'node:fs/promises';
import { TurmaRepository } from '../../../server/src/repositories/TurmaRepository';
import type { Turma } from '../../../shared/types';

describe('TurmaRepository', () => {
  let repository: TurmaRepository;
  const TEST_DATA_DIR = '/tmp/test-data-turma';

  beforeEach(() => {
    process.env.DATA_DIR = TEST_DATA_DIR;
    repository = new TurmaRepository();
  });

  afterEach(async () => {
    await rm(TEST_DATA_DIR, { recursive: true, force: true });
  });

  const mockTurma: Turma = {
    id: 'turma-id-1',
    topico: 'Engenharia de Software',
    ano: 2024,
    semestre: 1,
    alunosIds: ['aluno-1', 'aluno-2'],
  };

  it('findAll() returns empty array when file is empty', async () => {
    const result = await repository.findAll();
    expect(result).toEqual([]);
  });

  it('save() adds a new turma and persists it to file', async () => {
    const saved = await repository.save(mockTurma);
    expect(saved).toEqual(mockTurma);

    const all = await repository.findAll();
    expect(all).toHaveLength(1);
    expect(all[0]).toEqual(mockTurma);
  });

  it('findById() returns the correct turma', async () => {
    await repository.save(mockTurma);
    const result = await repository.findById(mockTurma.id);
    expect(result).toEqual(mockTurma);
  });

  it('findById() returns null when ID does not exist', async () => {
    await repository.save(mockTurma);
    const result = await repository.findById('non-existent-id');
    expect(result).toBeNull();
  });

  it('update() changes the correct fields and leaves others unchanged', async () => {
    await repository.save(mockTurma);
    
    const updatedInfo = { semestre: 2 as const, topico: 'Engenharia de Software II' };
    const updated = await repository.update(mockTurma.id, updatedInfo);
    
    expect(updated).not.toBeNull();
    expect(updated?.semestre).toBe(2);
    expect(updated?.topico).toBe('Engenharia de Software II');
    expect(updated?.ano).toBe(mockTurma.ano); // Unchanged
    expect(updated?.alunosIds).toEqual(mockTurma.alunosIds); // Unchanged

    const result = await repository.findById(mockTurma.id);
    expect(result).toEqual(updated);
  });

  it('delete() removes the turma and returns true', async () => {
    await repository.save(mockTurma);
    const deleted = await repository.delete(mockTurma.id);
    expect(deleted).toBe(true);

    const all = await repository.findAll();
    expect(all).toHaveLength(0);
  });

  it('delete() returns false when ID does not exist', async () => {
    await repository.save(mockTurma);
    const deleted = await repository.delete('non-existent-id');
    expect(deleted).toBe(false);

    const all = await repository.findAll();
    expect(all).toHaveLength(1);
  });
});
