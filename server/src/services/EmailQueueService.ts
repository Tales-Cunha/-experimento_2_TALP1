import type { Avaliacao } from '../../../shared/types';

export class EmailQueueService {
  async queue(avaliacao: Avaliacao): Promise<void> {
    console.log('EmailQueueService.queue stub called', {
      alunoId: avaliacao.alunoId,
      turmaId: avaliacao.turmaId,
      meta: avaliacao.meta,
      conceito: avaliacao.conceito,
      updatedAt: avaliacao.updatedAt,
    });
  }
}
