import { AlunoService } from '../../../server/src/services/AlunoService';
import { AlunoRepository } from '../../../server/src/repositories/AlunoRepository';
import { DuplicateError, NotFoundError, ValidationError } from '../../../server/src/errors';
import type { Aluno } from '../../../shared/types';

describe('AlunoService', () => {
  let alunoService: AlunoService;
  let mockAlunoRepository: jest.Mocked<AlunoRepository>;

  beforeEach(() => {
    mockAlunoRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByCpf: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<AlunoRepository>;

    alunoService = new AlunoService(mockAlunoRepository);
  });

  it('createAluno() with valid data → calls repository.save() and returns the new aluno', async () => {
    const input = { nome: 'Valid Name', cpf: '051.961.079-24', email: 'test@example.com' };
    mockAlunoRepository.findByCpf.mockResolvedValue(null);
    mockAlunoRepository.save.mockImplementation(async (aluno) => aluno);

    const result = await alunoService.create(input);

    expect(mockAlunoRepository.save).toHaveBeenCalledTimes(1);
    expect(result.nome).toBe(input.nome);
    expect(result.cpf).toBe(input.cpf);
    expect(result.email).toBe(input.email);
    expect(result.id).toBeDefined();
  });

  it('createAluno() with invalid CPF → throws ValidationError, does NOT call repository.save()', async () => {
    const input = { nome: 'Invalid CPF', cpf: '12345678901', email: 'test@example.com' };

    await expect(alunoService.create(input)).rejects.toThrow(ValidationError);
    expect(mockAlunoRepository.save).not.toHaveBeenCalled();
  });

  it('createAluno() with duplicate CPF → throws DuplicateError, does NOT call repository.save()', async () => {
    const input = { nome: 'Duplicate CPF', cpf: '051.961.079-24', email: 'test@example.com' };
    const existingAluno: Aluno = { id: '1', nome: 'Existing', cpf: input.cpf, email: 'exist@example.com' };
    mockAlunoRepository.findByCpf.mockResolvedValue(existingAluno);

    await expect(alunoService.create(input)).rejects.toThrow(DuplicateError);
    expect(mockAlunoRepository.save).not.toHaveBeenCalled();
  });

  it('updateAluno() with non-existent ID → throws NotFoundError', async () => {
    mockAlunoRepository.findById.mockResolvedValue(null);

    await expect(alunoService.update('non-existent-id', { nome: 'New Name' })).rejects.toThrow(NotFoundError);
  });

  it('deleteAluno() with non-existent ID → throws NotFoundError', async () => {
    mockAlunoRepository.delete.mockResolvedValue(false);

    await expect(alunoService.delete('non-existent-id')).rejects.toThrow(NotFoundError);
  });
});
