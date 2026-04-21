export type Conceito = 'MANA' | 'MPA' | 'MA';

export type Meta =
  | 'Requisitos'
  | 'Testes'
  | 'Implementação'
  | 'Refatoração'
  | 'Documentação';

export interface AlunoResumo {
  id: string;
  nome: string;
  cpf: string;
  email: string;
}

export interface TurmaResumo {
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

export interface UpsertAvaliacaoInput {
  alunoId: string;
  turmaId: string;
  meta: Meta;
  conceito: Conceito;
}

const apiBaseUrl = import.meta.env.VITE_API_URL;

function buildApiUrl(path: string): string {
  return `${apiBaseUrl}${path}`;
}

async function parseError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { error?: string };
    if (payload.error) {
      return payload.error;
    }
  } catch {
    // Ignore parsing failures and fallback to a generic message.
  }

  return 'Ocorreu um erro inesperado na API.';
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return (await response.json()) as T;
}

export async function getAlunosResumo(): Promise<AlunoResumo[]> {
  const response = await fetch(buildApiUrl('/api/alunos'));
  return parseJsonResponse<AlunoResumo[]>(response);
}

export async function getTurmasResumo(): Promise<TurmaResumo[]> {
  const response = await fetch(buildApiUrl('/api/turmas'));
  return parseJsonResponse<TurmaResumo[]>(response);
}

export async function getAvaliacoesByTurma(turmaId: string): Promise<Avaliacao[]> {
  const response = await fetch(buildApiUrl(`/api/turmas/${turmaId}/avaliacoes`));
  return parseJsonResponse<Avaliacao[]>(response);
}

export async function getAvaliacoesByAluno(alunoId: string): Promise<Avaliacao[]> {
  const response = await fetch(buildApiUrl(`/api/alunos/${alunoId}/avaliacoes`));
  return parseJsonResponse<Avaliacao[]>(response);
}

export async function upsertAvaliacao(input: UpsertAvaliacaoInput): Promise<Avaliacao> {
  const response = await fetch(buildApiUrl('/api/avaliacoes'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  return parseJsonResponse<Avaliacao>(response);
}
