import { constants as fsConstants } from 'node:fs';
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';

import type { Avaliacao, Conceito, Meta } from '../../../shared/types';

interface UpsertAvaliacaoInput {
  alunoId: string;
  turmaId: string;
  meta: Meta;
  conceito: Conceito;
}

export class AvaliacaoRepository {
  private readonly dataFilePath: string;

  constructor() {
    const dataDir = process.env.DATA_DIR;

    if (!dataDir) {
      throw new Error('DATA_DIR environment variable is required');
    }

    this.dataFilePath = path.join(dataDir, 'avaliacoes.json');
  }

  async findByTurma(turmaId: string): Promise<Avaliacao[]> {
    const avaliacoes = await this.readAll();
    return avaliacoes.filter((avaliacao) => avaliacao.turmaId === turmaId);
  }

  async findByAluno(alunoId: string): Promise<Avaliacao[]> {
    const avaliacoes = await this.readAll();
    return avaliacoes.filter((avaliacao) => avaliacao.alunoId === alunoId);
  }

  async upsert(input: UpsertAvaliacaoInput): Promise<{ avaliacao: Avaliacao; created: boolean }> {
    const avaliacoes = await this.readAll();
    const updatedAt = new Date().toISOString();

    const existingIndex = avaliacoes.findIndex(
      (avaliacao) =>
        avaliacao.alunoId === input.alunoId &&
        avaliacao.turmaId === input.turmaId &&
        avaliacao.meta === input.meta,
    );

    if (existingIndex >= 0) {
      const updatedAvaliacao: Avaliacao = {
        ...avaliacoes[existingIndex],
        conceito: input.conceito,
        updatedAt,
      };

      avaliacoes[existingIndex] = updatedAvaliacao;
      await this.writeAll(avaliacoes);

      return {
        avaliacao: updatedAvaliacao,
        created: false,
      };
    }

    const createdAvaliacao: Avaliacao = {
      id: randomUUID(),
      alunoId: input.alunoId,
      turmaId: input.turmaId,
      meta: input.meta,
      conceito: input.conceito,
      updatedAt,
    };

    avaliacoes.push(createdAvaliacao);
    await this.writeAll(avaliacoes);

    return {
      avaliacao: createdAvaliacao,
      created: true,
    };
  }

  private async ensureDataFile(): Promise<void> {
    await mkdir(path.dirname(this.dataFilePath), { recursive: true });

    try {
      await access(this.dataFilePath, fsConstants.F_OK);
    } catch {
      await writeFile(this.dataFilePath, '[]\n', 'utf-8');
    }
  }

  private async readAll(): Promise<Avaliacao[]> {
    await this.ensureDataFile();

    const fileContent = await readFile(this.dataFilePath, 'utf-8');
    const parsedContent: unknown = JSON.parse(fileContent);

    if (!Array.isArray(parsedContent)) {
      return [];
    }

    return parsedContent as Avaliacao[];
  }

  private async writeAll(avaliacoes: Avaliacao[]): Promise<void> {
    await this.ensureDataFile();
    await writeFile(this.dataFilePath, `${JSON.stringify(avaliacoes, null, 2)}\n`, 'utf-8');
  }
}
