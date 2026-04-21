import { useCallback, useEffect, useState } from 'react';

import {
  createAluno as createAlunoApi,
  deleteAluno as deleteAlunoApi,
  getAlunos,
  updateAluno as updateAlunoApi,
  type Aluno,
  type AlunoInput,
  type AlunoUpdateInput,
} from '../services/alunosApi';

interface UseAlunosResult {
  alunos: Aluno[];
  loading: boolean;
  error: string | null;
  createAluno: (data: AlunoInput) => Promise<Aluno>;
  updateAluno: (id: string, data: AlunoUpdateInput) => Promise<Aluno>;
  deleteAluno: (id: string) => Promise<void>;
}

export function useAlunos(): UseAlunosResult {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadAlunos = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getAlunos();
      setAlunos(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Falha ao carregar alunos.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAlunos();
  }, [loadAlunos]);

  const createAluno = useCallback(async (data: AlunoInput) => {
    setError(null);

    try {
      const created = await createAlunoApi(data);
      setAlunos((previous) => [...previous, created]);
      return created;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Falha ao criar aluno.';
      setError(message);
      throw err;
    }
  }, []);

  const updateAluno = useCallback(async (id: string, data: AlunoUpdateInput) => {
    setError(null);

    try {
      const updated = await updateAlunoApi(id, data);
      setAlunos((previous) =>
        previous.map((aluno) => (aluno.id === updated.id ? updated : aluno)),
      );
      return updated;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Falha ao atualizar aluno.';
      setError(message);
      throw err;
    }
  }, []);

  const deleteAluno = useCallback(async (id: string) => {
    setError(null);

    try {
      await deleteAlunoApi(id);
      setAlunos((previous) => previous.filter((aluno) => aluno.id !== id));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Falha ao remover aluno.';
      setError(message);
      throw err;
    }
  }, []);

  return {
    alunos,
    loading,
    error,
    createAluno,
    updateAluno,
    deleteAluno,
  };
}
