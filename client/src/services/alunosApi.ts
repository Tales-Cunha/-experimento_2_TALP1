export interface Aluno {
  id: string;
  nome: string;
  cpf: string;
  email: string;
}

export interface AlunoInput {
  nome: string;
  cpf: string;
  email: string;
}

export interface AlunoUpdateInput {
  nome?: string;
  cpf?: string;
  email?: string;
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
    // Ignore JSON parse errors and fallback to generic message.
  }

  return 'Ocorreu um erro inesperado na API.';
}

export async function getAlunos(): Promise<Aluno[]> {
  const response = await fetch(buildApiUrl('/api/alunos'));

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return (await response.json()) as Aluno[];
}

export async function createAluno(data: AlunoInput): Promise<Aluno> {
  const response = await fetch(buildApiUrl('/api/alunos'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return (await response.json()) as Aluno;
}

export async function updateAluno(id: string, data: AlunoUpdateInput): Promise<Aluno> {
  const response = await fetch(buildApiUrl(`/api/alunos/${id}`), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return (await response.json()) as Aluno;
}

export async function deleteAluno(id: string): Promise<void> {
  const response = await fetch(buildApiUrl(`/api/alunos/${id}`), {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }
}
