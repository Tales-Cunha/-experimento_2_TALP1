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

  const isEditing = useMemo(() => editingAlunoId !== null, [editingAlunoId]);

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

  function closeModal() {
    if (isSubmitting) {
      return;
    }

    setIsModalOpen(false);
    setFormError(null);
  }

  function updateField(field: keyof AlunoFormState, value: string) {
    setFormState((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (!formState.nome.trim() || !formState.cpf.trim() || !formState.email.trim()) {
      setFormError('Preencha nome, CPF e e-mail.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditing && editingAlunoId) {
        await updateAluno(editingAlunoId, {
          nome: formState.nome.trim(),
          cpf: formState.cpf.trim(),
          email: formState.email.trim(),
        });
      } else {
        await createAluno({
          nome: formState.nome.trim(),
          cpf: formState.cpf.trim(),
          email: formState.email.trim(),
        });
      }

      setIsModalOpen(false);
      setEditingAlunoId(null);
      setFormState(emptyForm);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Não foi possível salvar o aluno.';
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(aluno: Aluno) {
    const confirmed = window.confirm(
      `Tem certeza que deseja excluir o aluno ${aluno.nome}? Esta ação não pode ser desfeita.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteAluno(aluno.id);
    } catch {
      // Error state is handled by the hook.
    }
  }

  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <h1 style={{ margin: 0 }}>Alunos</h1>
        <button type="button" onClick={openCreateModal}>
          Novo Aluno
        </button>
      </header>

      {loading ? (
        <div role="status" aria-live="polite" style={{ display: 'flex', gap: '0.5rem' }}>
          <span
            style={{
              width: '1rem',
              height: '1rem',
              border: '2px solid #cccccc',
              borderTopColor: '#333333',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <span>Carregando alunos...</span>
        </div>
      ) : (
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
              {alunos.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '0.75rem' }}>
                    Nenhum aluno cadastrado.
                  </td>
                </tr>
              ) : (
                alunos.map((aluno) => (
                  <tr key={aluno.id}>
                    <td style={{ padding: '0.5rem', borderBottom: '1px solid #f0f0f0' }}>{aluno.nome}</td>
                    <td style={{ padding: '0.5rem', borderBottom: '1px solid #f0f0f0' }}>{aluno.cpf}</td>
                    <td style={{ padding: '0.5rem', borderBottom: '1px solid #f0f0f0' }}>{aluno.email}</td>
                    <td style={{ padding: '0.5rem', borderBottom: '1px solid #f0f0f0' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button type="button" onClick={() => openEditModal(aluno)}>
                          Editar
                        </button>
                        <button type="button" onClick={() => handleDelete(aluno)}>
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {error && (
        <p role="alert" style={{ color: '#b00020', marginTop: '1rem' }}>
          Erro: {error}
        </p>
      )}

      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            display: 'grid',
            placeItems: 'center',
            padding: '1rem',
          }}
        >
          <form
            onSubmit={handleSubmit}
            style={{
              width: 'min(28rem, 100%)',
              background: '#ffffff',
              borderRadius: '0.5rem',
              padding: '1rem',
              display: 'grid',
              gap: '0.75rem',
            }}
          >
            <h2 style={{ margin: 0 }}>{isEditing ? 'Editar Aluno' : 'Novo Aluno'}</h2>

            <label>
              Nome
              <input
                value={formState.nome}
                onChange={(event) => updateField('nome', event.target.value)}
                placeholder="Nome completo"
                required
                style={{ width: '100%' }}
              />
            </label>

            <label>
              CPF
              <input
                value={formState.cpf}
                onChange={(event) => updateField('cpf', event.target.value)}
                placeholder="000.000.000-00"
                required
                style={{ width: '100%' }}
              />
            </label>

            <label>
              E-mail
              <input
                type="email"
                value={formState.email}
                onChange={(event) => updateField('email', event.target.value)}
                placeholder="email@exemplo.com"
                required
                style={{ width: '100%' }}
              />
            </label>

            {formError && (
              <p role="alert" style={{ margin: 0, color: '#b00020' }}>
                {formError}
              </p>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button type="button" onClick={closeModal} disabled={isSubmitting}>
                Cancelar
              </button>
              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </main>
  );
}
