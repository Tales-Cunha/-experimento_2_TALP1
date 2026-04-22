import { rm } from 'node:fs/promises';
import { AlunoRepository } from '../../../server/src/repositories/AlunoRepository';
import type { Aluno } from '../../../shared/types';

describe('AlunoRepository', () => {
  let repository: AlunoRepository;
  const TEST_DATA_DIR = '/tmp/test-data-aluno';

  beforeEach(() => {
    process.env.DATA_DIR = TEST_DATA_DIR;
    repository = new AlunoRepository();
  });

  afterEach(async () => {
    await rm(TEST_DATA_DIR, { recursive: true, force: true });
  });

  const mockAluno: Aluno = {
    id: 'test-id-1',
    nome: 'João Silva',
    cpf: '123.456.789-00',
    email: 'joao@example.com',
  };

  it('findAll() returns empty array when file is empty', async () => {
    const result = await repository.findAll();
    expect(result).toEqual([]);
  });

  it('save() adds a new aluno and persists it to file', async () => {
    const saved = await repository.save(mockAluno);
    expect(saved).toEqual(mockAluno);

    const all = await repository.findAll();
    expect(all).toHaveLength(1);
    expect(all[0]).toEqual(mockAluno);
  });

  it('findById() returns the correct aluno', async () => {
    await repository.save(mockAluno);
    const result = await repository.findById(mockAluno.id);
    expect(result).toEqual(mockAluno);
  });

  it('findById() returns null when ID does not exist', async () => {
    await repository.save(mockAluno);
    const result = await repository.findById('non-existent-id');
    expect(result).toBeNull();
  });

  it('findByCpf() returns the correct aluno', async () => {
    await repository.save(mockAluno);
    const result = await repository.findByCpf(mockAluno.cpf);
    expect(result).toEqual(mockAluno);
  });

  it('findByCpf() returns null when CPF does not exist', async () => {
    await repository.save(mockAluno);
    const result = await repository.findByCpf('000.000.000-00');
    expect(result).toBeNull();
  });

  it('update() changes the correct fields and leaves others unchanged', async () => {
    await repository.save(mockAluno);
    
    const updatedInfo = { nome: 'João Silva Atualizado' };
    const updated = await repository.update(mockAluno.id, updatedInfo);
    
    expect(updated).not.toBeNull();
    expect(updated?.nome).toBe('João Silva Atualizado');
    expect(updated?.email).toBe(mockAluno.email); // Unchanged
    expect(updated?.cpf).toBe(mockAluno.cpf); // Unchanged

    const result = await repository.findById(mockAluno.id);
    expect(result).toEqual(updated);
  });

  it('delete() removes the aluno and returns true', async () => {
    await repository.save(mockAluno);
    const deleted = await repository.delete(mockAluno.id);
    expect(deleted).toBe(true);

    const all = await repository.findAll();
    expect(all).toHaveLength(0);
  });

  it('delete() returns false when ID does not exist', async () => {
    await repository.save(mockAluno);
    const deleted = await repository.delete('non-existent-id');
    expect(deleted).toBe(false);

    const all = await repository.findAll();
    expect(all).toHaveLength(1);
  });
});
