import { useCallback, useEffect, useState } from 'react';

import {
  getAlunosResumo,
  getAvaliacoesByTurma,
  getTurmasResumo,
  upsertAvaliacao,
  type AlunoResumo,
  type Avaliacao,
  type Conceito,
  type Meta,
  type TurmaResumo,
} from '../services/avaliacoesApi';

export const METAS: Meta[] = [
  'Requisitos',
  'Testes',
  'Implementação',
  'Refatoração',
  'Documentação',
];

export const CONCEITOS: Conceito[] = ['MANA', 'MPA', 'MA'];

interface UseAvaliacoesResult {
  alunos: AlunoResumo[];
  turmas: TurmaResumo[];
  avaliacoes: Avaliacao[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  loadAvaliacaoContext: () => Promise<void>;
  loadAvaliacoesByTurma: (turmaId: string) => Promise<Avaliacao[]>;
  setConceito: (input: {
    alunoId: string;
    turmaId: string;
    meta: Meta;
    conceito: Conceito;
  }) => Promise<Avaliacao>;
}

export function useAvaliacoes(): UseAvaliacoesResult {
  const [alunos, setAlunos] = useState<AlunoResumo[]>([]);
  const [turmas, setTurmas] = useState<TurmaResumo[]>([]);
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadAvaliacoesByTurma = useCallback(async (turmaId: string) => {
    try {
      const data = await getAvaliacoesByTurma(turmaId);

      setAvaliacoes((previous) => {
        const fromOtherTurmas = previous.filter((avaliacao) => avaliacao.turmaId !== turmaId);
        return [...fromOtherTurmas, ...data];
      });

      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Falha ao carregar avaliações da turma.';
      setError(message);
      throw err;
    }
  }, []);

  const loadAvaliacaoContext = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [alunosResponse, turmasResponse] = await Promise.all([
        getAlunosResumo(),
        getTurmasResumo(),
      ]);

      setAlunos(alunosResponse);
      setTurmas(turmasResponse);

      if (turmasResponse.length === 0) {
        setAvaliacoes([]);
      } else {
        const avaliacoesPorTurma = await Promise.all(
          turmasResponse.map((turma) => getAvaliacoesByTurma(turma.id)),
        );

        setAvaliacoes(avaliacoesPorTurma.flat());
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Falha ao carregar dados de avaliações.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAvaliacaoContext();
  }, [loadAvaliacaoContext]);

  const setConceito = useCallback(
    async (input: { alunoId: string; turmaId: string; meta: Meta; conceito: Conceito }) => {
      setSaving(true);
      setError(null);

      try {
        const saved = await upsertAvaliacao(input);

        setAvaliacoes((previous) => {
          const existingIndex = previous.findIndex(
            (avaliacao) =>
              avaliacao.alunoId === saved.alunoId &&
              avaliacao.turmaId === saved.turmaId &&
              avaliacao.meta === saved.meta,
          );

          if (existingIndex >= 0) {
            const clone = [...previous];
            clone[existingIndex] = saved;
            return clone;
          }

          return [...previous, saved];
        });

        return saved;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Falha ao salvar avaliação.';
        setError(message);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  return {
    alunos,
    turmas,
    avaliacoes,
    loading,
    saving,
    error,
    loadAvaliacaoContext,
    loadAvaliacoesByTurma,
    setConceito,
  };
}
