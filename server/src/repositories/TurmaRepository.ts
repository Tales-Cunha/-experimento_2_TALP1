import { constants as fsConstants } from 'node:fs';
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import type { Turma } from '../../../shared/types';

export class TurmaRepository {
  private readonly dataFilePath: string;

  constructor() {
    const dataDir = process.env.DATA_DIR;

    if (!dataDir) {
      throw new Error('DATA_DIR environment variable is required');
    }

    this.dataFilePath = path.join(dataDir, 'turmas.json');
  }

  async findAll(): Promise<Turma[]> {
    return this.readAll();
  }

  async findById(id: string): Promise<Turma | null> {
    const turmas = await this.readAll();
    return turmas.find((turma) => turma.id === id) ?? null;
  }

  async save(turma: Turma): Promise<Turma> {
    const turmas = await this.readAll();
    turmas.push(turma);
    await this.writeAll(turmas);
    return turma;
  }

  async update(id: string, data: Partial<Omit<Turma, 'id'>>): Promise<Turma | null> {
    const turmas = await this.readAll();
    const turmaIndex = turmas.findIndex((turma) => turma.id === id);

    if (turmaIndex === -1) {
      return null;
    }

    const updatedTurma: Turma = {
      ...turmas[turmaIndex],
      ...data,
    };

    turmas[turmaIndex] = updatedTurma;
    await this.writeAll(turmas);

    return updatedTurma;
  }

  async delete(id: string): Promise<boolean> {
    const turmas = await this.readAll();
    const initialSize = turmas.length;
    const filteredTurmas = turmas.filter((turma) => turma.id !== id);

    if (filteredTurmas.length === initialSize) {
      return false;
    }

    await this.writeAll(filteredTurmas);
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

  private async readAll(): Promise<Turma[]> {
    await this.ensureDataFile();

    const fileContent = await readFile(this.dataFilePath, 'utf-8');
    const parsedContent: unknown = JSON.parse(fileContent);

    if (!Array.isArray(parsedContent)) {
      return [];
    }

    return parsedContent as Turma[];
  }

  private async writeAll(turmas: Turma[]): Promise<void> {
    await this.ensureDataFile();
    await writeFile(this.dataFilePath, `${JSON.stringify(turmas, null, 2)}\n`, 'utf-8');
  }
}
