import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import path from 'node:path';

import type { Aluno } from '../../../shared/types';

export class AlunoRepository {
  private readonly dataFilePath: string;

  constructor() {
    const dataDir = process.env.DATA_DIR;

    if (!dataDir) {
      throw new Error('DATA_DIR environment variable is required');
    }

    this.dataFilePath = path.join(dataDir, 'alunos.json');
  }

  async findAll(): Promise<Aluno[]> {
    return this.readAll();
  }

  async findById(id: string): Promise<Aluno | null> {
    const alunos = await this.readAll();
    return alunos.find((aluno) => aluno.id === id) ?? null;
  }

  async findByCpf(cpf: string): Promise<Aluno | null> {
    const alunos = await this.readAll();
    return alunos.find((aluno) => aluno.cpf === cpf) ?? null;
  }

  async save(aluno: Aluno): Promise<Aluno> {
    const alunos = await this.readAll();
    alunos.push(aluno);
    await this.writeAll(alunos);
    return aluno;
  }

  async update(id: string, data: Partial<Omit<Aluno, 'id'>>): Promise<Aluno | null> {
    const alunos = await this.readAll();
    const alunoIndex = alunos.findIndex((aluno) => aluno.id === id);

    if (alunoIndex === -1) {
      return null;
    }

    const updatedAluno: Aluno = {
      ...alunos[alunoIndex],
      ...data,
    };

    alunos[alunoIndex] = updatedAluno;
    await this.writeAll(alunos);

    return updatedAluno;
  }

  async delete(id: string): Promise<boolean> {
    const alunos = await this.readAll();
    const initialSize = alunos.length;
    const filteredAlunos = alunos.filter((aluno) => aluno.id !== id);

    if (filteredAlunos.length === initialSize) {
      return false;
    }

    await this.writeAll(filteredAlunos);
    return true;
  }

  private async ensureDataFile(): Promise<void> {
    await mkdir(path.dirname(this.dataFilePath), { recursive: true });

    try {
      await access(this.dataFilePath, fsConstants.F_OK);
    } catch {
      await writeFile(this.dataFilePath, '[]\n', 'utf-8');
    }
  }

  private async readAll(): Promise<Aluno[]> {
    await this.ensureDataFile();

    const fileContent = await readFile(this.dataFilePath, 'utf-8');
    const parsedContent: unknown = JSON.parse(fileContent);

    if (!Array.isArray(parsedContent)) {
      return [];
    }

    return parsedContent as Aluno[];
  }

  private async writeAll(alunos: Aluno[]): Promise<void> {
    await this.ensureDataFile();
    await writeFile(this.dataFilePath, `${JSON.stringify(alunos, null, 2)}\n`, 'utf-8');
  }
}
