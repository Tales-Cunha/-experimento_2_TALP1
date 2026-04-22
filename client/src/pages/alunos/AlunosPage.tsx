import { useMemo, useState } from 'react';

import { useAlunos } from '../../hooks/useAlunos';
import type { Aluno } from '../../services/alunosApi';

interface AlunoFormState {
  nome: string;
  cpf: string;
  email: string;
}

const emptyForm: AlunoFormState = {
  nome: '',
  cpf: '',
  email: '',
};

export function AlunosPage() {
  const { alunos, loading, error, createAluno, updateAluno, deleteAluno } = useAlunos();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [editingAlunoId, setEditingAlunoId] = useState<string | null>(null);
  const [formState, setFormState] = useState<AlunoFormState>(emptyForm);

  const sortedAlunos = useMemo(() => {
    return [...alunos].sort((a, b) => a.nome.localeCompare(b.nome));
  }, [alunos]);

  function openCreateModal() {
    setEditingAlunoId(null);
    setFormError(null);
    setFormState(emptyForm);
    setIsModalOpen(true);
  }

  function openEditModal(aluno: Aluno) {
    setEditingAlunoId(aluno.id);
    setFormError(null);
    setFormState({
      nome: aluno.nome,
      cpf: aluno.cpf,
      email: aluno.email,
    });
    setIsModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      if (editingAlunoId) {
        await updateAluno(editingAlunoId, formState);
      } else {
        await createAluno(formState);
      }
      setIsModalOpen(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Erro ao salvar aluno');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main style={{ padding: '4rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-end',
        borderBottom: '2px solid var(--ink)',
        paddingBottom: '2rem',
        marginBottom: '3rem'
      }}>
        <div>
          <h1 style={{ fontSize: '5rem', lineHeight: 0.9, fontWeight: 900 }}>ALUNOS</h1>
          <p style={{ marginTop: '1rem', opacity: 0.6, fontSize: '0.8rem' }}>
            SISTEMA DE IDENTIFICAÇÃO E REGISTRO ACADÊMICO
          </p>
        </div>
        <button
          onClick={openCreateModal}
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
          + Novo Registro
        </button>
      </header>

      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center' }}>Acessando banco de dados...</div>
      ) : (
        <div className="staggered-reveal" style={{ display: 'grid', gap: '0.5rem' }}>
          {sortedAlunos.length === 0 ? (
            <div style={{ padding: '4rem', textAlign: 'center', border: '1px dashed var(--grid-line)', opacity: 0.4 }}>
              NENHUM REGISTRO ENCONTRADO
            </div>
          ) : (
            sortedAlunos.map((aluno, index) => (
              <div
                key={aluno.id}
                style={{
                  backgroundColor: 'var(--ghost)',
                  padding: '1.5rem 2rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderLeft: '4px solid var(--ink)',
                  animationDelay: `${index * 0.02}s`,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{aluno.nome.toUpperCase()}</span>
                    <span style={{ fontSize: '0.7rem', opacity: 0.4 }}>{aluno.id.slice(0,8)}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '2rem', marginTop: '0.5rem', opacity: 0.6, fontSize: '0.8rem' }}>
                    <span>CPF: {aluno.cpf}</span>
                    <span>EMAIL: {aluno.email}</span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => openEditModal(aluno)}
                    style={{
                      padding: '0.6rem 1rem',
                      border: '1px solid var(--ink)',
                      backgroundColor: 'var(--paper)',
                      fontSize: '0.7rem',
                      fontWeight: 'bold',
                    }}
                  >
                    EDITAR
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Remover permanentemente este registro?')) {
                        void deleteAluno(aluno.id);
                      }
                    }}
                    style={{
                      padding: '0.6rem 1rem',
                      border: '1px solid var(--crimson)',
                      backgroundColor: 'transparent',
                      color: 'var(--crimson)',
                      fontSize: '0.7rem',
                      fontWeight: 'bold',
                    }}
                  >
                    REMOVER
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.85)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 2000,
          backdropFilter: 'blur(8px)',
        }}>
          <form
            onSubmit={handleSubmit}
            style={{
              backgroundColor: 'var(--paper)',
              padding: '4rem',
              width: '100%',
              maxWidth: '600px',
              border: '1px solid var(--ink)',
            }}
          >
            <h2 style={{ marginBottom: '3rem', fontSize: '2.5rem' }}>
              {editingAlunoId ? 'EDITAR REGISTRO' : 'NOVO REGISTRO'}
            </h2>
            
            {formError && (
              <div style={{ padding: '1rem', border: '1px solid var(--crimson)', color: 'var(--crimson)', marginBottom: '2rem', fontSize: '0.8rem' }}>
                {formError.toUpperCase()}
              </div>
            )}

            <div style={{ display: 'grid', gap: '2rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>NOME COMPLETO</label>
                <input
                  required
                  value={formState.nome}
                  onChange={e => setFormState({ ...formState, nome: e.target.value })}
                  style={{ width: '100%', padding: '1rem', border: 'none', borderBottom: '2px solid var(--ink)', fontFamily: 'var(--font-mono)', fontSize: '1.1rem', backgroundColor: 'var(--ghost)' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>CPF (FORMATADO)</label>
                  <input
                    required
                    value={formState.cpf}
                    onChange={e => setFormState({ ...formState, cpf: e.target.value })}
                    style={{ width: '100%', padding: '1rem', border: 'none', borderBottom: '2px solid var(--ink)', fontFamily: 'var(--font-mono)', backgroundColor: 'var(--ghost)' }}
                    placeholder="000.000.000-00"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>EMAIL INSTITUCIONAL</label>
                  <input
                    required
                    type="email"
                    value={formState.email}
                    onChange={e => setFormState({ ...formState, email: e.target.value })}
                    style={{ width: '100%', padding: '1rem', border: 'none', borderBottom: '2px solid var(--ink)', fontFamily: 'var(--font-mono)', backgroundColor: 'var(--ghost)' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '4rem' }}>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ flex: 1, padding: '1.2rem', border: '1px solid var(--ink)', backgroundColor: 'transparent', fontWeight: 'bold' }}
              >
                DESCARTAR
              </button>
              <button
                disabled={isSubmitting}
                style={{
                  flex: 2,
                  padding: '1.2rem',
                  backgroundColor: 'var(--ink)',
                  color: 'var(--paper)',
                  border: 'none',
                  fontWeight: 'bold',
                  fontSize: '1rem'
                }}
              >
                {isSubmitting ? 'PROCESSANDO...' : 'CONFIRMAR REGISTRO'}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
