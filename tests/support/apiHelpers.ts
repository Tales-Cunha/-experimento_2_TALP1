import axios from 'axios';
import type { Aluno, Turma, Avaliacao, Meta, Conceito } from '../../shared/types';

const getBaseUrl = () => process.env.TEST_BASE_URL || 'http://localhost:3001';

export async function createAluno(data: Partial<Aluno>): Promise<Aluno> {
  const response = await axios.post(`${getBaseUrl()}/api/alunos`, data, {
    validateStatus: () => true,
  });
  if (response.status >= 300) {
    throw new Error(`Failed to create Aluno: ${response.status} ${JSON.stringify(response.data)}`);
  }
  return response.data;
}

export async function updateAluno(id: string, data: Partial<Aluno>): Promise<Aluno> {
  const response = await axios.put(`${getBaseUrl()}/api/alunos/${id}`, data, {
    validateStatus: () => true,
  });
  if (response.status >= 300) {
    throw new Error(`Failed to update Aluno: ${response.status} ${JSON.stringify(response.data)}`);
  }
  return response.data;
}

export async function deleteAluno(id: string): Promise<void> {
  const response = await axios.delete(`${getBaseUrl()}/api/alunos/${id}`, {
    validateStatus: () => true,
  });
  if (response.status >= 300) {
    throw new Error(`Failed to delete Aluno: ${response.status} ${JSON.stringify(response.data)}`);
  }
}

export async function createTurma(data: Partial<Turma>): Promise<Turma> {
  const response = await axios.post(`${getBaseUrl()}/api/turmas`, data, {
    validateStatus: () => true,
  });
  if (response.status >= 300) {
    throw new Error(`Failed to create Turma: ${response.status} ${JSON.stringify(response.data)}`);
  }
  return response.data;
}

export async function enrollAluno(turmaId: string, alunoId: string): Promise<Turma> {
  const response = await axios.post(`${getBaseUrl()}/api/turmas/${turmaId}/alunos/${alunoId}`, {}, {
    validateStatus: () => true,
  });
  if (response.status >= 300) {
    throw new Error(`Failed to enroll Aluno in Turma: ${response.status} ${JSON.stringify(response.data)}`);
  }
  return response.data;
}

export async function removeAluno(turmaId: string, alunoId: string): Promise<Turma> {
  const response = await axios.delete(`${getBaseUrl()}/api/turmas/${turmaId}/alunos/${alunoId}`, {
    validateStatus: () => true,
  });
  if (response.status >= 300) {
    throw new Error(`Failed to remove Aluno from Turma: ${response.status} ${JSON.stringify(response.data)}`);
  }
  return response.data;
}

export async function triggerEmailDigest(): Promise<any> {
  const response = await axios.post(`${getBaseUrl()}/api/email/send-digest`, {}, {
    validateStatus: () => true,
  });
  if (response.status >= 300) {
    throw new Error(`Failed to trigger email digest: ${response.status} ${JSON.stringify(response.data)}`);
  }
  return response.data;
}

export async function setAvaliacao(alunoId: string, turmaId: string, meta: Meta | string, conceito: Conceito | string): Promise<Avaliacao> {
  const response = await axios.post(`${getBaseUrl()}/api/avaliacoes`, { alunoId, turmaId, meta, conceito }, {
    validateStatus: () => true,
  });
  if (response.status >= 300) {
    throw new Error(`Failed to set Avaliacao: ${response.status} ${JSON.stringify(response.data)}`);
  }
  return response.data;
}

export async function getAlunos(): Promise<Aluno[]> {
  const response = await axios.get(`${getBaseUrl()}/api/alunos`, {
    validateStatus: () => true,
  });
  if (response.status >= 300) {
    throw new Error(`Failed to get Alunos: ${response.status} ${JSON.stringify(response.data)}`);
  }
  return response.data;
}

export async function getTurmas(): Promise<Turma[]> {
  const response = await axios.get(`${getBaseUrl()}/api/turmas`, {
    validateStatus: () => true,
  });
  if (response.status >= 300) {
    throw new Error(`Failed to get Turmas: ${response.status} ${JSON.stringify(response.data)}`);
  }
  return response.data;
}

export async function getAvaliacoesByTurma(turmaId: string): Promise<Avaliacao[]> {
  const response = await axios.get(`${getBaseUrl()}/api/turmas/${turmaId}/avaliacoes`, {
    validateStatus: () => true,
  });
  if (response.status >= 300) {
    throw new Error(`Failed to get Avaliacoes by Turma: ${response.status} ${JSON.stringify(response.data)}`);
  }
  return response.data;
}
