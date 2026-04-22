import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { METAS, useAvaliacoes } from '../../hooks/useAvaliacoes';
import { useTurmas } from '../../hooks/useTurmas';
import type { Avaliacao, Conceito } from '../../services/avaliacoesApi';
import type { AlunoResumo, Turma } from '../../services/turmasApi';

const conceitoColors = {
  MA: 'var(--emerald)',
  MPA: 'var(--amber)',
  MANA: 'var(--crimson)',
};

export function TurmaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getTurmaById, loadAlunosResumo, enrollAluno, removeAluno, error } = useTurmas();
  const {
    loadAvaliacoesByTurma,
    setConceito,
    saving: savingAvaliacao,
    error: avaliacaoError,
  } = useAvaliacoes();

  const [turma, setTurma] = useState<Turma | null>(null);
  const [avaliacoesDaTurma, setAvaliacoesDaTurma] = useState<Avaliacao[]>([]);
  const [todosAlunos, setTodosAlunos] = useState<AlunoResumo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [selectedAlunoId, setSelectedAlunoId] = useState<string>('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      navigate('/turmas', { replace: true });
      return;
    }

    const turmaId = id;

    async function loadData() {
      setLoading(true);
      setLocalError(null);

      try {
        const [turmaResponse, alunosResponse, avaliacoesResponse] = await Promise.all([
          getTurmaById(turmaId),
          loadAlunosResumo(),
          loadAvaliacoesByTurma(turmaId),
        ]);

        setTurma(turmaResponse);
        setTodosAlunos(alunosResponse);
        setAvaliacoesDaTurma(avaliacoesResponse);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Falha ao carregar detalhes da turma.';
        setLocalError(message);
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, [id, navigate, getTurmaById, loadAlunosResumo, loadAvaliacoesByTurma]);

  function getConceito(alunoId: string, meta: (typeof METAS)[number]): Conceito | null {
    const avaliacao = avaliacoesDaTurma
      .filter((item) => item.alunoId === alunoId && item.meta === meta)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];

    return avaliacao ? avaliacao.conceito : null;
  }

  async function handleSetConceito(alunoId: string, meta: (typeof METAS)[number], conceito: Conceito) {
    if (!id) return;

    try {
      const saved = await setConceito({ alunoId, turmaId: id, meta, conceito });
      setAvaliacoesDaTurma((prev) => {
        const existingIndex = prev.findIndex(a => a.alunoId === saved.alunoId && a.meta === saved.meta);
        if (existingIndex >= 0) {
          const clone = [...prev];
          clone[existingIndex] = saved;
          return clone;
        }
        return [...prev, saved];
      });
      setEditingCell(null);
    } catch {
      // Error is handled by hook
    }
  }

  const alunosDisponiveis = useMemo(() => {
    if (!turma) return [];
    return todosAlunos.filter(aluno => !turma.alunosIds.includes(aluno.id));
  }, [todosAlunos, turma]);

  async function handleEnroll(e: React.FormEvent) {
    e.preventDefault();
    if (!id || !selectedAlunoId) return;

    setSubmitting(true);
    setLocalError(null);
    try {
      const updated = await enrollAluno(id, selectedAlunoId);
      setTurma(updated);
      setSelectedAlunoId('');
    } catch (err: unknown) {
      setLocalError(err instanceof Error ? err.message : 'Erro ao matricular aluno.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemove(alunoId: string) {
    if (!id) return;

    setLocalError(null);
    try {
      const updated = await removeAluno(id, alunoId);
      setTurma(updated);
    } catch (err: unknown) {
      setLocalError(err instanceof Error ? err.message : 'Erro ao remover aluno.');
    }
  }

  if (loading && !turma) {
    return <main style={{ padding: '4rem', textAlign: 'center' }}>Sincronizando ambiente...</main>;
  }

  if (!turma) {
    return <main style={{ padding: '4rem', textAlign: 'center' }}>Turma não encontrada.</main>;
  }

  return (
    <main style={{ padding: '4rem 2rem', maxWidth: '1600px', margin: '0 auto' }}>
      <header style={{ 
        borderBottom: '2px solid var(--ink)',
        paddingBottom: '2rem',
        marginBottom: '4rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end'
      }}>
        <div style={{ flex: 1 }}>
          <Link to="/turmas" style={{ fontSize: '0.7rem', color: 'var(--ink)', textDecoration: 'none', fontWeight: 'bold' }}>
            ← VOLTAR PARA LISTA
          </Link>
          <h1 style={{ fontSize: '5rem', lineHeight: 0.9, fontWeight: 900, marginTop: '1rem' }}>{turma.topico.toUpperCase()}</h1>
          <div style={{ display: 'flex', gap: '2rem', marginTop: '1.5rem' }}>
            <div style={{ backgroundColor: 'var(--ink)', color: 'var(--paper)', padding: '0.4rem 1rem', fontSize: '0.8rem', fontWeight: 'bold' }}>
              PERÍODO: {turma.ano}.{turma.semestre}
            </div>
            <div style={{ border: '1px solid var(--ink)', padding: '0.4rem 1rem', fontSize: '0.8rem', fontWeight: 'bold' }}>
              REF: {turma.id.slice(0, 8)}
            </div>
          </div>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '4rem', alignItems: 'start' }}>
        <aside>
          <section style={{ border: '2px solid var(--ink)', padding: '2rem', backgroundColor: 'var(--ghost)' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--ink)', paddingBottom: '0.5rem' }}>MATRÍCULA</h2>
            
            <form onSubmit={handleEnroll}>
              <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>SELECIONAR ALUNO</label>
              <select
                value={selectedAlunoId}
                onChange={e => setSelectedAlunoId(e.target.value)}
                disabled={submitting || alunosDisponiveis.length === 0}
                style={{
                  width: '100%',
                  padding: '1rem',
                  border: '1px solid var(--ink)',
                  fontFamily: 'var(--font-mono)',
                  marginBottom: '1rem',
                  backgroundColor: 'var(--paper)'
                }}
              >
                <option value="">{alunosDisponiveis.length === 0 ? 'Nenhum aluno disponível' : 'Selecione...'}</option>
                {alunosDisponiveis.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
              </select>
              <button
                disabled={submitting || !selectedAlunoId}
                style={{
                  width: '100%',
                  padding: '1rem',
                  backgroundColor: 'var(--ink)',
                  color: 'var(--paper)',
                  border: 'none',
                  fontWeight: 'bold',
                  fontSize: '0.8rem'
                }}
              >
                {submitting ? 'MATRICULANDO...' : 'EFETIVAR MATRÍCULA'}
              </button>
            </form>

            <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px dashed var(--grid-line)' }}>
              <Link to="/alunos" style={{ fontSize: '0.7rem', color: 'var(--ink)', fontWeight: 'bold' }}>
                + CRIAR NOVO REGISTRO DE ALUNO
              </Link>
            </div>
          </section>

          {(localError || error || avaliacaoError) && (
            <div style={{ marginTop: '2rem', padding: '1rem', border: '1px solid var(--crimson)', color: 'var(--crimson)', fontSize: '0.7rem' }}>
              ALERTA: {localError ?? error ?? avaliacaoError}
            </div>
          )}
        </aside>

        <section>
          <h2 style={{ fontSize: '2rem', marginBottom: '2rem' }}>QUADRO DE AVALIAÇÕES</h2>
          <div style={{ overflowX: 'auto', border: '1px solid var(--ink)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--ghost)' }}>
                  <th style={{ padding: '1.2rem', textAlign: 'left', borderBottom: '2px solid var(--ink)', borderRight: '1px solid var(--ink)', fontSize: '0.7rem' }}>ALUNO</th>
                  {METAS.map(meta => (
                    <th key={meta} style={{ padding: '1.2rem', borderBottom: '2px solid var(--ink)', borderRight: '1px solid var(--grid-line)', fontSize: '0.7rem' }}>
                      {meta.toUpperCase()}
                    </th>
                  ))}
                  <th style={{ borderBottom: '2px solid var(--ink)' }}></th>
                </tr>
              </thead>
              <tbody className="staggered-reveal">
                {turma.alunos.length === 0 ? (
                  <tr><td colSpan={METAS.length + 2} style={{ padding: '4rem', textAlign: 'center', opacity: 0.3 }}>NENHUM ALUNO MATRICULADO</td></tr>
                ) : (
                  turma.alunos.map((aluno, index) => (
                    <tr key={aluno.id} style={{ borderBottom: '1px solid var(--grid-line)', animationDelay: `${index * 0.03}s` }}>
                      <td style={{ padding: '1rem 1.2rem', borderRight: '1px solid var(--ink)', backgroundColor: 'var(--paper)' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '0.8rem' }}>{aluno.nome.toUpperCase()}</div>
                        <div style={{ fontSize: '0.6rem', opacity: 0.5 }}>{aluno.cpf}</div>
                      </td>
                      {METAS.map(meta => {
                        const conceito = getConceito(aluno.id, meta);
                        const cellKey = `${aluno.id}::${meta}`;
                        const isEditing = editingCell === cellKey;

                        return (
                          <td key={cellKey} style={{ 
                            padding: '0.4rem', 
                            textAlign: 'center', 
                            borderRight: '1px solid var(--grid-line)',
                            backgroundColor: conceito ? `${conceitoColors[conceito]}15` : 'transparent'
                          }}>
                            {isEditing ? (
                              <select
                                autoFocus
                                defaultValue={conceito ?? ''}
                                onBlur={() => setEditingCell(null)}
                                onChange={e => {
                                  const val = e.target.value as Conceito;
                                  if (val) void handleSetConceito(aluno.id, meta, val);
                                  setEditingCell(null);
                                }}
                                style={{ 
                                  width: '100%', 
                                  fontFamily: 'var(--font-mono)', 
                                  fontSize: '0.7rem',
                                  padding: '0.2rem',
                                  border: '1px solid var(--ink)'
                                }}
                              >
                                <option value="">-</option>
                                {['MANA', 'MPA', 'MA'].map(o => <option key={o} value={o}>{o}</option>)}
                              </select>
                            ) : (
                              <button
                                onClick={() => setEditingCell(cellKey)}
                                style={{
                                  border: 'none',
                                  background: 'transparent',
                                  width: '100%',
                                  height: '2.5rem',
                                  fontSize: '0.75rem',
                                  fontWeight: 'bold',
                                  color: conceito ? conceitoColors[conceito] : 'var(--grid-line)'
                                }}
                              >
                                {conceito ?? '---'}
                              </button>
                            )}
                          </td>
                        );
                      })}
                      <td style={{ textAlign: 'center', padding: '0 1rem' }}>
                        <button
                          onClick={() => { if (confirm('Remover aluno da turma?')) void handleRemove(aluno.id); }}
                          style={{ border: 'none', background: 'transparent', color: 'var(--crimson)', fontSize: '0.6rem', fontWeight: 'bold' }}
                        >
                          EXCLUIR
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
