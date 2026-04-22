import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { useTurmas } from '../../hooks/useTurmas';
import type { Turma } from '../../services/turmasApi';

interface TurmaFormState {
  topico: string;
  ano: string;
  semestre: '1' | '2';
}

const emptyForm: TurmaFormState = {
  topico: '',
  ano: '',
  semestre: '1',
};

export function TurmasPage() {
  const { turmas, loading, error, createTurma, deleteTurma } = useTurmas();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formState, setFormState] = useState<TurmaFormState>(emptyForm);

  const sortedTurmas = useMemo(() => {
    return [...turmas].sort((a, b) => {
      if (a.ano !== b.ano) return b.ano - a.ano;
      return b.semestre - a.semestre;
    });
  }, [turmas]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      await createTurma({
        topico: formState.topico,
        ano: parseInt(formState.ano, 10),
        semestre: parseInt(formState.semestre, 10) as 1 | 2,
      });
      setIsModalOpen(false);
      setFormState(emptyForm);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Falha ao salvar turma');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main style={{ padding: '4rem 2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-end',
        borderBottom: '2px solid var(--ink)',
        paddingBottom: '2rem',
        marginBottom: '3rem'
      }}>
        <div>
          <h1 style={{ fontSize: '5rem', lineHeight: 0.9, fontWeight: 900 }}>TURMAS</h1>
          <p style={{ marginTop: '1rem', color: 'var(--ink)', opacity: 0.6, fontSize: '0.8rem' }}>
            REGISTRO DE DISCIPLINAS E PERÍODOS ACADÊMICOS
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          style={{
            backgroundColor: 'var(--ink)',
            color: 'var(--paper)',
            padding: '1rem 2rem',
            border: 'none',
            fontSize: '0.8rem',
            fontWeight: 'bold',
            textTransform: 'uppercase',
          }}
        >
          + Nova Turma
        </button>
      </header>

      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center' }}>Carregando dados...</div>
      ) : (
        <div 
          className="staggered-reveal"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1px',
            backgroundColor: 'var(--grid-line)',
            border: '1px solid var(--grid-line)',
          }}
        >
          {sortedTurmas.map((turma, index) => (
            <div
              key={turma.id}
              style={{
                backgroundColor: 'var(--paper)',
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '250px',
                animationDelay: `${index * 0.05}s`,
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 'bold', backgroundColor: 'var(--ghost)', padding: '0.2rem 0.5rem' }}>
                    {turma.ano}.{turma.semestre}
                  </span>
                  <span style={{ fontSize: '0.7rem', opacity: 0.4 }}>ID: {turma.id.slice(0, 8)}</span>
                </div>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>{turma.topico}</h2>
                <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>{turma.alunos.length} ALUNOS MATRICULADOS</p>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <Link
                  to={`/turmas/${turma.id}`}
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    padding: '0.75rem',
                    border: '1px solid var(--ink)',
                    textDecoration: 'none',
                    color: 'var(--ink)',
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                  }}
                >
                  Visualizar
                </Link>
                <button
                  onClick={() => {
                    if (confirm('Deseja realmente remover esta turma?')) {
                      deleteTurma(turma.id).catch(err => alert(err.message));
                    }
                  }}
                  style={{
                    padding: '0.75rem',
                    border: '1px solid var(--crimson)',
                    backgroundColor: 'transparent',
                    color: 'var(--crimson)',
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                  }}
                >
                  DEL
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 2000,
          backdropFilter: 'blur(4px)',
        }}>
          <form
            onSubmit={handleSubmit}
            style={{
              backgroundColor: 'var(--paper)',
              padding: '3rem',
              width: '100%',
              maxWidth: '500px',
              border: '2px solid var(--ink)',
            }}
          >
            <h2 style={{ marginBottom: '2rem', fontSize: '2rem' }}>NOVA TURMA</h2>
            
            {formError && <p style={{ color: 'var(--crimson)', marginBottom: '1rem', fontSize: '0.8rem' }}>{formError}</p>}

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>TÓPICO / DISCIPLINA</label>
              <input
                required
                value={formState.topico}
                onChange={e => setFormState({ ...formState, topico: e.target.value })}
                style={{
                  width: '100%',
                  padding: '1rem',
                  border: '1px solid var(--ink)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '1rem',
                }}
                placeholder="Ex: Engenharia de Software"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>ANO</label>
                <input
                  required
                  type="number"
                  value={formState.ano}
                  onChange={e => setFormState({ ...formState, ano: e.target.value })}
                  style={{ width: '100%', padding: '1rem', border: '1px solid var(--ink)', fontFamily: 'var(--font-mono)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>SEMESTRE</label>
                <select
                  value={formState.semestre}
                  onChange={e => setFormState({ ...formState, semestre: e.target.value as '1' | '2' })}
                  style={{ width: '100%', padding: '1rem', border: '1px solid var(--ink)', fontFamily: 'var(--font-mono)' }}
                >
                  <option value="1">1º Semestre</option>
                  <option value="2">2º Semestre</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ flex: 1, padding: '1rem', border: '1px solid var(--ink)', backgroundColor: 'transparent' }}
              >
                CANCELAR
              </button>
              <button
                disabled={isSubmitting}
                style={{
                  flex: 1,
                  padding: '1rem',
                  backgroundColor: 'var(--ink)',
                  color: 'var(--paper)',
                  border: 'none',
                  fontWeight: 'bold',
                }}
              >
                {isSubmitting ? 'SALVANDO...' : 'CRIAR TURMA'}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
