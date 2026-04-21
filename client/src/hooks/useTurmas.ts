import { useCallback, useEffect, useState } from 'react';

import {
  createTurma as createTurmaApi,
  deleteTurma as deleteTurmaApi,
  enrollAluno as enrollAlunoApi,
  getAlunosResumo,
  getTurmaById as getTurmaByIdApi,
  getTurmas,
  removeAluno as removeAlunoApi,
  updateTurma as updateTurmaApi,
  type AlunoResumo,
  type Turma,
  type TurmaInput,
  type TurmaUpdateInput,
} from '../services/turmasApi';

interface UseTurmasResult {
  turmas: Turma[];
  loading: boolean;
  error: string | null;
  loadTurmas: () => Promise<void>;
  loadAlunosResumo: () => Promise<AlunoResumo[]>;
  getTurmaById: (id: string) => Promise<Turma>;
  createTurma: (data: TurmaInput) => Promise<Turma>;
  updateTurma: (id: string, data: TurmaUpdateInput) => Promise<Turma>;
  deleteTurma: (id: string) => Promise<void>;
  enrollAluno: (turmaId: string, alunoId: string) => Promise<Turma>;
  removeAluno: (turmaId: string, alunoId: string) => Promise<Turma>;
}

export function useTurmas(): UseTurmasResult {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadTurmas = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getTurmas();
      setTurmas(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Falha ao carregar turmas.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTurmas();
  }, [loadTurmas]);

  const loadAlunosResumo = useCallback(async () => {
    setError(null);

    try {
      return await getAlunosResumo();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Falha ao carregar alunos.';
      setError(message);
      throw err;
    }
  }, []);

  const getTurmaById = useCallback(async (id: string) => {
    setError(null);

    try {
      return await getTurmaByIdApi(id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Falha ao carregar turma.';
      setError(message);
      throw err;
    }
  }, []);

  const createTurma = useCallback(async (data: TurmaInput) => {
    setError(null);

    try {
      const created = await createTurmaApi(data);
      setTurmas((previous) => [...previous, created]);
      return created;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Falha ao criar turma.';
      setError(message);
      throw err;
    }
  }, []);

  const updateTurma = useCallback(async (id: string, data: TurmaUpdateInput) => {
    setError(null);

    try {
      const updated = await updateTurmaApi(id, data);
      setTurmas((previous) =>
        previous.map((turma) => (turma.id === updated.id ? updated : turma)),
      );
      return updated;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Falha ao atualizar turma.';
      setError(message);
      throw err;
    }
  }, []);

  const deleteTurma = useCallback(async (id: string) => {
    setError(null);

    try {
      await deleteTurmaApi(id);
      setTurmas((previous) => previous.filter((turma) => turma.id !== id));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Falha ao remover turma.';
      setError(message);
      throw err;
    }
  }, []);

  const enrollAluno = useCallback(async (turmaId: string, alunoId: string) => {
    setError(null);

    try {
      const updated = await enrollAlunoApi(turmaId, alunoId);
      setTurmas((previous) =>
        previous.map((turma) => (turma.id === updated.id ? updated : turma)),
      );
      return updated;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Falha ao matricular aluno.';
      setError(message);
      throw err;
    }
  }, []);

  const removeAluno = useCallback(async (turmaId: string, alunoId: string) => {
    setError(null);

    try {
      const updated = await removeAlunoApi(turmaId, alunoId);
      setTurmas((previous) =>
        previous.map((turma) => (turma.id === updated.id ? updated : turma)),
      );
      return updated;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Falha ao remover aluno da turma.';
      setError(message);
      throw err;
    }
  }, []);

  return {
    turmas,
    loading,
    error,
    loadTurmas,
    loadAlunosResumo,
    getTurmaById,
    createTurma,
    updateTurma,
    deleteTurma,
    enrollAluno,
    removeAluno,
  };
}
