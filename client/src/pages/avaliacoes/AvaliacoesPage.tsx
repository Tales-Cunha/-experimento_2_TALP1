import { useEffect, useMemo, useState } from 'react';

import {
  CONCEITOS,
  METAS,
  useAvaliacoes,
} from '../../hooks/useAvaliacoes';
import type { Conceito, Meta } from '../../services/avaliacoesApi';

const conceitoColor: Record<Conceito, string> = {
  MANA: '#fde8e8',
  MPA: '#fff9db',
  MA: '#e6f7e6',
};

export function AvaliacoesPage() {
  const {
    alunos,
    turmas,
    avaliacoes,
    loading,
    saving,
    error,
    setConceito,
  } = useAvaliacoes();

  const [turmaSelecionadaId, setTurmaSelecionadaId] = useState<string>('all');
  const [editingCell, setEditingCell] = useState<string | null>(null);

  useEffect(() => {
    if (turmas.length > 0 && turmaSelecionadaId === 'all') {
      return;
    }

    if (turmas.length === 0 && turmaSelecionadaId !== 'all') {
      setTurmaSelecionadaId('all');
    }
  }, [turmas, turmaSelecionadaId]);

  const turmaSelecionada = useMemo(() => {
    if (turmaSelecionadaId === 'all') {
      return null;
    }

    return turmas.find((turma) => turma.id === turmaSelecionadaId) ?? null;
  }, [turmas, turmaSelecionadaId]);

  const alunosDaTabela = useMemo(() => {
    if (!turmaSelecionada) {
      return alunos;
    }

    const idsDaTurma = new Set(turmaSelecionada.alunosIds);
    return alunos.filter((aluno) => idsDaTurma.has(aluno.id));
  }, [alunos, turmaSelecionada]);

  function getCellKey(alunoId: string, meta: Meta): string {
    return `${alunoId}::${meta}`;
  }

  function getAvaliacao(alunoId: string, meta: Meta): { conceito: Conceito | null; turmaId: string | null } {
    const candidatas = avaliacoes
      .filter((avaliacao) => avaliacao.alunoId === alunoId && avaliacao.meta === meta)
      .filter((avaliacao) => {
        if (turmaSelecionadaId === 'all') {
          return true;
        }

        return avaliacao.turmaId === turmaSelecionadaId;
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

    if (candidatas.length === 0) {
      return { conceito: null, turmaId: turmaSelecionadaId === 'all' ? null : turmaSelecionadaId };
    }

    return {
      conceito: candidatas[0].conceito,
      turmaId: candidatas[0].turmaId,
    };
  }

  async function handleSetConceito(alunoId: string, meta: Meta, conceito: Conceito) {
    const turmaId = turmaSelecionadaId === 'all' ? null : turmaSelecionadaId;

    if (!turmaId) {
      return;
    }

    try {
      await setConceito({ alunoId, turmaId, meta, conceito });
      setEditingCell(null);
    } catch {
      // Error message is handled by hook state.
    }
  }

  if (loading) {
    return (
      <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
        <h1 style={{ marginTop: 0 }}>Avaliações</h1>
        <p>Carregando tabela de avaliações...</p>
      </main>
    );
  }

  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <header style={{ marginBottom: '1rem', display: 'grid', gap: '0.75rem' }}>
        <h1 style={{ margin: 0 }}>Avaliações</h1>

        <label style={{ display: 'grid', gap: '0.35rem', width: 'min(26rem, 100%)' }}>
          Filtrar por Turma
          <select
            value={turmaSelecionadaId}
            onChange={(event) => {
              setTurmaSelecionadaId(event.target.value);
              setEditingCell(null);
            }}
          >
            <option value="all">Todas as turmas</option>
            {turmas.map((turma) => (
              <option key={turma.id} value={turma.id}>
                {turma.topico} ({turma.ano}/{turma.semestre})
              </option>
            ))}
          </select>
        </label>
      </header>

      {turmaSelecionadaId === 'all' && (
        <p style={{ marginTop: 0 }}>
          Selecione uma turma específica para editar células.
        </p>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '52rem' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: '0.5rem' }}>
                Aluno
              </th>
              {METAS.map((meta) => (
                <th
                  key={meta}
                  style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: '0.5rem' }}
                >
                  {meta}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {alunosDaTabela.length === 0 ? (
              <tr>
                <td colSpan={1 + METAS.length} style={{ padding: '0.75rem' }}>
                  Nenhum aluno para exibir na tabela.
                </td>
              </tr>
            ) : (
              alunosDaTabela.map((aluno) => (
                <tr key={aluno.id}>
                  <td style={{ padding: '0.5rem', borderBottom: '1px solid #f0f0f0' }}>
                    <div style={{ display: 'grid' }}>
                      <strong>{aluno.nome}</strong>
                      <small>{aluno.cpf}</small>
                    </div>
                  </td>

                  {METAS.map((meta) => {
                    const cellKey = getCellKey(aluno.id, meta);
                    const { conceito } = getAvaliacao(aluno.id, meta);
                    const isEditing = editingCell === cellKey;

                    return (
                      <td
                        key={cellKey}
                        style={{
                          padding: '0.5rem',
                          borderBottom: '1px solid #f0f0f0',
                          backgroundColor: conceito ? conceitoColor[conceito] : '#ffffff',
                        }}
                      >
                        {isEditing ? (
                          <select
                            autoFocus
                            defaultValue={conceito ?? ''}
                            onBlur={() => setEditingCell(null)}
                            onChange={(event) => {
                              const value = event.target.value as Conceito | '';

                              if (!value) {
                                setEditingCell(null);
                                return;
                              }

                              void handleSetConceito(aluno.id, meta, value as Conceito);
                            }}
                            disabled={saving || turmaSelecionadaId === 'all'}
                          >
                            <option value="">Selecione</option>
                            {CONCEITOS.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              if (turmaSelecionadaId === 'all') {
                                return;
                              }

                              setEditingCell(cellKey);
                            }}
                            disabled={saving || turmaSelecionadaId === 'all'}
                            style={{
                              border: 'none',
                              background: 'transparent',
                              padding: 0,
                              cursor: turmaSelecionadaId === 'all' ? 'not-allowed' : 'pointer',
                              font: 'inherit',
                            }}
                            title={
                              turmaSelecionadaId === 'all'
                                ? 'Selecione uma turma para editar.'
                                : 'Clique para definir conceito'
                            }
                          >
                            {conceito ?? '—'}
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {error && (
        <p role="alert" style={{ color: '#b00020', marginTop: '1rem' }}>
          Erro: {error}
        </p>
      )}
    </main>
  );
}
