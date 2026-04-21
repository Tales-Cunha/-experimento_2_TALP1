import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import path from 'node:path';

import type { EmailQueueEntry, Meta, Conceito } from '../../../shared/types';

export class EmailQueueRepository {
  private readonly dataFilePath: string;

  constructor() {
    const dataDir = process.env.DATA_DIR;

    if (!dataDir) {
      throw new Error('DATA_DIR environment variable is required');
    }

    this.dataFilePath = path.join(dataDir, 'emailQueue.json');
  }

  async findByDate(date: string): Promise<EmailQueueEntry[]> {
    const entries = await this.readAll();
    return entries.filter((entry) => entry.date === date);
  }

  async addOrUpdate(
    alunoId: string,
    date: string,
    change: { turmaId: string; turmaNome: string; meta: Meta; conceito: Conceito },
  ): Promise<void> {
    const entries = await this.readAll();
    const existingEntryIndex = entries.findIndex(
      (entry) => entry.alunoId === alunoId && entry.date === date,
    );

    if (existingEntryIndex !== -1) {
      const entry = entries[existingEntryIndex];
      const existingChangeIndex = entry.changes.findIndex(
        (c) => c.turmaId === change.turmaId && c.meta === change.meta,
      );

      if (existingChangeIndex !== -1) {
        entry.changes[existingChangeIndex].conceito = change.conceito;
      } else {
        entry.changes.push(change);
      }
    } else {
      entries.push({
        alunoId,
        date,
        changes: [change],
      });
    }

    await this.writeAll(entries);
  }

  async clearForStudent(alunoId: string, date: string): Promise<void> {
    const entries = await this.readAll();
    const filteredEntries = entries.filter(
      (entry) => !(entry.alunoId === alunoId && entry.date === date),
    );

    if (filteredEntries.length !== entries.length) {
      await this.writeAll(filteredEntries);
    }
  }

  private async ensureDataFile(): Promise<void> {
    await mkdir(path.dirname(this.dataFilePath), { recursive: true });

    try {
      await access(this.dataFilePath, fsConstants.F_OK);
    } catch {
      await writeFile(this.dataFilePath, '[]\n', 'utf-8');
    }
  }

  private async readAll(): Promise<EmailQueueEntry[]> {
    await this.ensureDataFile();

    const fileContent = await readFile(this.dataFilePath, 'utf-8');
    const parsedContent: unknown = JSON.parse(fileContent);

    if (!Array.isArray(parsedContent)) {
      return [];
    }

    return parsedContent as EmailQueueEntry[];
  }

  private async writeAll(entries: EmailQueueEntry[]): Promise<void> {
    await this.ensureDataFile();
    await writeFile(this.dataFilePath, `${JSON.stringify(entries, null, 2)}\n`, 'utf-8');
  }
}
