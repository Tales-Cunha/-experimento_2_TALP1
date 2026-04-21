import { EmailQueueRepository } from '../repositories/EmailQueueRepository';
import { AlunoRepository } from '../repositories/AlunoRepository';
import type { Avaliacao, Aluno, EmailQueueEntry } from '../../../shared/types';

export class EmailQueueService {
  constructor(
    private readonly emailQueueRepository: EmailQueueRepository = new EmailQueueRepository(),
    private readonly alunoRepository: AlunoRepository = new AlunoRepository(),
  ) {}

  async queue(avaliacao: Avaliacao, turmaNome: string): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    await this.emailQueueRepository.addOrUpdate(avaliacao.alunoId, today, {
      turmaId: avaliacao.turmaId,
      turmaNome,
      meta: avaliacao.meta,
      conceito: avaliacao.conceito,
    });
  }

  async getDigestsForToday(): Promise<{ aluno: Aluno; changes: EmailQueueEntry['changes'] }[]> {
    const today = new Date().toISOString().split('T')[0];
    const entries = await this.emailQueueRepository.findByDate(today);

    const digests: { aluno: Aluno; changes: EmailQueueEntry['changes'] }[] = [];

    for (const entry of entries) {
      const aluno = await this.alunoRepository.findById(entry.alunoId);
      if (aluno) {
        digests.push({
          aluno,
          changes: entry.changes,
        });
      }
    }

    return digests;
  }

  async clearDigestForStudent(alunoId: string): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    await this.emailQueueRepository.clearForStudent(alunoId, today);
  }
}
