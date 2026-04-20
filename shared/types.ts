export type Conceito = 'MANA' | 'MPA' | 'MA';

export type Meta =
  | 'Requisitos'
  | 'Testes'
  | 'Implementação'
  | 'Refatoração'
  | 'Documentação';

export interface Aluno {
  id: string;
  nome: string;
  cpf: string;
  email: string;
}

export interface Turma {
  id: string;
  topico: string;
  ano: number;
  semestre: 1 | 2;
  alunosIds: string[];
}

export interface Avaliacao {
  id: string;
  alunoId: string;
  turmaId: string;
  meta: Meta;
  conceito: Conceito;
  updatedAt: string;
}

export interface EmailQueueEntry {
  alunoId: string;
  date: string;
  changes: {
    turmaId: string;
    turmaNome: string;
    meta: Meta;
    conceito: Conceito;
  }[];
}
