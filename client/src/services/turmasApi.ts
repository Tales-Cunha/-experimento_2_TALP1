export interface AlunoResumo {
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
  alunos: AlunoResumo[];
}

export interface TurmaInput {
  topico: string;
  ano: number;
  semestre: 1 | 2;
}

export interface TurmaUpdateInput {
  topico?: string;
  ano?: number;
  semestre?: 1 | 2;
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

export async function getTurmas(): Promise<Turma[]> {
  const response = await fetch(buildApiUrl('/api/turmas'));
  return parseJsonResponse<Turma[]>(response);
}

export async function getTurmaById(id: string): Promise<Turma> {
  const response = await fetch(buildApiUrl(`/api/turmas/${id}`));
  return parseJsonResponse<Turma>(response);
}

export async function createTurma(data: TurmaInput): Promise<Turma> {
  const response = await fetch(buildApiUrl('/api/turmas'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  return parseJsonResponse<Turma>(response);
}

export async function updateTurma(id: string, data: TurmaUpdateInput): Promise<Turma> {
  const response = await fetch(buildApiUrl(`/api/turmas/${id}`), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  return parseJsonResponse<Turma>(response);
}

export async function deleteTurma(id: string): Promise<void> {
  const response = await fetch(buildApiUrl(`/api/turmas/${id}`), {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }
}

export async function enrollAluno(turmaId: string, alunoId: string): Promise<Turma> {
  const response = await fetch(buildApiUrl(`/api/turmas/${turmaId}/alunos/${alunoId}`), {
    method: 'POST',
  });

  return parseJsonResponse<Turma>(response);
}

export async function removeAluno(turmaId: string, alunoId: string): Promise<Turma> {
  const response = await fetch(buildApiUrl(`/api/turmas/${turmaId}/alunos/${alunoId}`), {
    method: 'DELETE',
  });

  return parseJsonResponse<Turma>(response);
}

export async function getAlunosResumo(): Promise<AlunoResumo[]> {
  const response = await fetch(buildApiUrl('/api/alunos'));
  return parseJsonResponse<AlunoResumo[]>(response);
}
