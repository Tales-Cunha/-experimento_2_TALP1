import { useEffect, useMemo, useState } from 'react';

import {
  CONCEITOS,
  METAS,
  useAvaliacoes,
} from '../../hooks/useAvaliacoes';
import type { Conceito, Meta } from '../../services/avaliacoesApi';

const conceitoColors = {
  MA: 'var(--emerald)',
  MPA: 'var(--amber)',
  MANA: 'var(--crimson)',
};

export function AvaliacoesPage() {
  const {
    alunos,
    turmas,
    avaliacoes,
    loading,
    error,
    loadAvaliacaoContext,
    setConceito,
  } = useAvaliacoes();

  const [selectedTurmaId, setSelectedTurmaId] = useState<string>('');
  const [editingCell, setEditingCell] = useState<string | null>(null);

  useEffect(() => {
    void loadAvaliacaoContext();
  }, [loadAvaliacaoContext]);

  const filteredAlunos = useMemo(() => {
    if (!selectedTurmaId) return [];
    if (selectedTurmaId === 'all') return alunos;
    const turma = turmas.find((t) => t.id === selectedTurmaId);
    if (!turma) return [];
    
    return alunos.filter((aluno) => turma.alunosIds.includes(aluno.id));
  }, [alunos, turmas, selectedTurmaId]);

  function getConceito(alunoId: string, meta: Meta): Conceito | null {
    const relevantAvaliacoes = avaliacoes.filter((a) => a.alunoId === alunoId && a.meta === meta);
    
    const avaliacao = selectedTurmaId && selectedTurmaId !== 'all'
      ? relevantAvaliacoes.find((a) => a.turmaId === selectedTurmaId)
      : relevantAvaliacoes.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
      
    return avaliacao ? avaliacao.conceito : null;
  }

  return (
    <main style={{ padding: '4rem 2rem', maxWidth: '1600px', margin: '0 auto' }}>
      <header style={{ 
        borderBottom: '2px solid var(--ink)',
        paddingBottom: '2rem',
        marginBottom: '3rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end'
      }}>
        <div>
          <h1 style={{ fontSize: '5rem', lineHeight: 0.9, fontWeight: 900 }}>AVALIAÇÕES</h1>
          <p style={{ marginTop: '1rem', opacity: 0.6, fontSize: '0.8rem' }}>
            MATRIZ DE DESEMPENHO POR META E DISCIPLINA
          </p>
        </div>

        <div style={{ width: '300px' }}>
          <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>FILTRAR POR TURMA</label>
          <select
            value={selectedTurmaId}
            onChange={(e) => setSelectedTurmaId(e.target.value)}
            style={{
              width: '100%',
              padding: '1rem',
              border: '2px solid var(--ink)',
              fontFamily: 'var(--font-mono)',
              backgroundColor: 'var(--paper)',
            }}
          >
            <option value="">Selecione...</option>
            <option value="all">Todas as Turmas (Geral)</option>
            {turmas.map((t) => (
              <option key={t.id} value={t.id}>
                {t.topico} ({t.ano}.{t.semestre})
              </option>
            ))}
          </select>
        </div>
      </header>

      {!selectedTurmaId ? (
        <div style={{ 
          height: '400px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          border: '1px dashed var(--grid-line)',
          color: 'var(--grid-line)',
          textTransform: 'uppercase',
          letterSpacing: '0.2em'
        }}>
          Selecione o contexto para visualizar a matriz
        </div>
      ) : loading ? (
        <div style={{ padding: '4rem', textAlign: 'center' }}>Sincronizando dados...</div>
      ) : (
        <div style={{ overflowX: 'auto', border: '1px solid var(--ink)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'var(--paper)' }}>
            <thead>
              <tr>
                <th style={{ 
                  textAlign: 'left', 
                  padding: '1.5rem', 
                  borderBottom: '2px solid var(--ink)', 
                  borderRight: '1px solid var(--ink)',
                  fontSize: '0.7rem',
                  backgroundColor: 'var(--ghost)'
                }}>ALUNO / MATRÍCULA</th>
                {METAS.map((meta) => (
                  <th key={meta} style={{ 
                    padding: '1.5rem', 
                    borderBottom: '2px solid var(--ink)', 
                    borderRight: '1px solid var(--grid-line)',
                    fontSize: '0.7rem',
                    textAlign: 'center'
                  }}>{meta.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody className="staggered-reveal">
              {filteredAlunos.length === 0 ? (
                <tr>
                  <td colSpan={METAS.length + 1} style={{ padding: '4rem', textAlign: 'center', opacity: 0.4 }}>
                    NENHUM ALUNO ENCONTRADO NESSE CONTEXTO
                  </td>
                </tr>
              ) : (
                filteredAlunos.map((aluno, index) => (
                  <tr key={aluno.id} style={{ animationDelay: `${index * 0.03}s` }}>
                    <td style={{ 
                      padding: '1rem 1.5rem', 
                      borderBottom: '1px solid var(--grid-line)', 
                      borderRight: '1px solid var(--ink)',
                      backgroundColor: 'var(--paper)'
                    }}>
                      <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{aluno.nome.toUpperCase()}</div>
                      <div style={{ fontSize: '0.65rem', opacity: 0.5, marginTop: '0.2rem' }}>CPF: {aluno.cpf}</div>
                    </td>
                    {METAS.map((meta) => {
                      const conceito = getConceito(aluno.id, meta);
                      const cellKey = `${aluno.id}-${meta}`;
                      const isEditing = editingCell === cellKey && selectedTurmaId !== 'all';

                      return (
                        <td
                          key={meta}
                          style={{
                            padding: '0.5rem',
                            borderBottom: '1px solid var(--grid-line)',
                            borderRight: '1px solid var(--grid-line)',
                            textAlign: 'center',
                            transition: 'var(--transition-fast)',
                            backgroundColor: conceito ? `${conceitoColors[conceito]}15` : 'transparent'
                          }}
                        >
                          {isEditing ? (
                            <select
                              autoFocus
                              defaultValue={conceito ?? ''}
                              onBlur={() => setEditingCell(null)}
                              onChange={(e) => {
                                const val = e.target.value as Conceito;
                                if (val && selectedTurmaId !== 'all') {
                                  void setConceito({ 
                                    alunoId: aluno.id, 
                                    turmaId: selectedTurmaId, 
                                    meta, 
                                    conceito: val 
                                  });
                                }
                                setEditingCell(null);
                              }}
                              style={{
                                width: '100%',
                                padding: '0.4rem',
                                fontFamily: 'var(--font-mono)',
                                fontSize: '0.7rem',
                                border: '1px solid var(--ink)'
                              }}
                            >
                              <option value="">-</option>
                              {CONCEITOS.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          ) : (
                            <button
                              onClick={() => selectedTurmaId !== 'all' && setEditingCell(cellKey)}
                              disabled={selectedTurmaId === 'all'}
                              title={selectedTurmaId === 'all' ? 'Selecione uma turma específica para editar' : 'Clique para editar'}
                              style={{
                                border: 'none',
                                background: 'transparent',
                                width: '100%',
                                height: '2.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.8rem',
                                fontWeight: 'bold',
                                color: conceito ? conceitoColors[conceito] : 'var(--grid-line)',
                                cursor: selectedTurmaId === 'all' ? 'default' : 'pointer'
                              }}
                            >
                              {conceito ?? '---'}
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
      )}

      {error && (
        <div style={{ 
          marginTop: '2rem', 
          padding: '1rem', 
          border: '1px solid var(--crimson)', 
          color: 'var(--crimson)',
          fontSize: '0.8rem',
          textTransform: 'uppercase'
        }}>
          ERRO CRÍTICO: {error}
        </div>
      )}
    </main>
  );
}
