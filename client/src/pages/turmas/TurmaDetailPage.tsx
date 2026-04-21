import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { useTurmas } from '../../hooks/useTurmas';
import type { AlunoResumo, Turma } from '../../services/turmasApi';

export function TurmaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getTurmaById, loadAlunosResumo, enrollAluno, removeAluno, error } = useTurmas();

  const [turma, setTurma] = useState<Turma | null>(null);
  const [todosAlunos, setTodosAlunos] = useState<AlunoResumo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [selectedAlunoId, setSelectedAlunoId] = useState<string>('');
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      navigate('/turmas', { replace: true });
      return;
    }

    async function loadData() {
      setLoading(true);
      setLocalError(null);

      try {
        const [turmaResponse, alunosResponse] = await Promise.all([
          getTurmaById(id),
          loadAlunosResumo(),
        ]);

        setTurma(turmaResponse);
        setTodosAlunos(alunosResponse);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Falha ao carregar detalhes da turma.';
        setLocalError(message);
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, [id, navigate, getTurmaById, loadAlunosResumo]);

  const alunosDisponiveis = useMemo(() => {
    if (!turma) {
      return [];
    }

    const idsMatriculados = new Set(turma.alunos.map((aluno) => aluno.id));
    return todosAlunos.filter((aluno) => !idsMatriculados.has(aluno.id));
  }, [turma, todosAlunos]);

  async function handleMatricular() {
    if (!id || !selectedAlunoId) {
      return;
    }

    setSubmitting(true);
    setLocalError(null);

    try {
      const turmaAtualizada = await enrollAluno(id, selectedAlunoId);
      setTurma(turmaAtualizada);
      setSelectedAlunoId('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Falha ao matricular aluno.';
      setLocalError(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemoverAluno(aluno: AlunoResumo) {
    if (!id) {
      return;
    }

    const confirmed = window.confirm(
      `Remover ${aluno.nome} da turma ${turma?.topico ?? ''}?`,
    );

    if (!confirmed) {
      return;
    }

    setSubmitting(true);
    setLocalError(null);

    try {
      const turmaAtualizada = await removeAluno(id, aluno.id);
      setTurma(turmaAtualizada);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Falha ao remover aluno da turma.';
      setLocalError(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
        <p>Carregando detalhes da turma...</p>
      </main>
    );
  }

  if (!turma) {
    return (
      <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
        <p>Turma não encontrada.</p>
        <Link to="/turmas">Voltar para turmas</Link>
      </main>
    );
  }

  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <header style={{ marginBottom: '1.5rem', display: 'grid', gap: '0.25rem' }}>
        <button type="button" onClick={() => navigate('/turmas')} style={{ width: 'fit-content' }}>
          Voltar para Turmas
        </button>
        <h1 style={{ margin: 0 }}>{turma.topico}</h1>
        <p style={{ margin: 0 }}>
          Ano: {turma.ano} | Semestre: {turma.semestre}
        </p>
        <p style={{ margin: 0 }}>Total de matriculados: {turma.alunos.length}</p>
      </header>

      <section
        style={{
          marginBottom: '1.5rem',
          padding: '1rem',
          border: '1px solid #dddddd',
          borderRadius: '0.5rem',
          display: 'grid',
          gap: '0.75rem',
        }}
      >
        <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Adicionar Aluno</h2>

        {alunosDisponiveis.length === 0 ? (
          <p style={{ margin: 0 }}>Todos os alunos já estão matriculados nesta turma.</p>
        ) : (
          <>
            <select
              value={selectedAlunoId}
              onChange={(event) => setSelectedAlunoId(event.target.value)}
              disabled={submitting}
              style={{ maxWidth: '28rem' }}
            >
              <option value="">Selecione um aluno</option>
              {alunosDisponiveis.map((aluno) => (
                <option key={aluno.id} value={aluno.id}>
                  {aluno.nome} ({aluno.cpf})
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => {
                void handleMatricular();
              }}
              disabled={!selectedAlunoId || submitting}
              style={{ width: 'fit-content' }}
            >
              {submitting ? 'Processando...' : 'Matricular Aluno'}
            </button>
          </>
        )}
      </section>

      <section>
        <h2 style={{ marginTop: 0 }}>Alunos Matriculados</h2>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: '0.5rem' }}>
                  Nome
                </th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: '0.5rem' }}>
                  CPF
                </th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: '0.5rem' }}>
                  E-mail
                </th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: '0.5rem' }}>
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {turma.alunos.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '0.75rem' }}>
                    Nenhum aluno matriculado nesta turma.
                  </td>
                </tr>
              ) : (
                turma.alunos.map((aluno) => (
                  <tr key={aluno.id}>
                    <td style={{ padding: '0.5rem', borderBottom: '1px solid #f0f0f0' }}>{aluno.nome}</td>
                    <td style={{ padding: '0.5rem', borderBottom: '1px solid #f0f0f0' }}>{aluno.cpf}</td>
                    <td style={{ padding: '0.5rem', borderBottom: '1px solid #f0f0f0' }}>{aluno.email}</td>
                    <td style={{ padding: '0.5rem', borderBottom: '1px solid #f0f0f0' }}>
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() => {
                          void handleRemoverAluno(aluno);
                        }}
                      >
                        Remover
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {(localError || error) && (
        <p role="alert" style={{ color: '#b00020', marginTop: '1rem' }}>
          Erro: {localError ?? error}
        </p>
      )}
    </main>
  );
}
