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
  const { turmas, loading, error, createTurma, updateTurma, deleteTurma } = useTurmas();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [editingTurmaId, setEditingTurmaId] = useState<string | null>(null);
  const [formState, setFormState] = useState<TurmaFormState>(emptyForm);

  const isEditing = useMemo(() => editingTurmaId !== null, [editingTurmaId]);

  function openCreateModal() {
    setEditingTurmaId(null);
    setFormError(null);
    setFormState(emptyForm);
    setIsModalOpen(true);
  }

  function openEditModal(turma: Turma) {
    setEditingTurmaId(turma.id);
    setFormError(null);
    setFormState({
      topico: turma.topico,
      ano: String(turma.ano),
      semestre: String(turma.semestre) as '1' | '2',
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

  function updateField(field: keyof TurmaFormState, value: string) {
    setFormState((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const ano = Number(formState.ano);

    if (!formState.topico.trim()) {
      setFormError('Preencha o tópico da turma.');
      return;
    }

    if (!Number.isInteger(ano) || ano <= 0) {
      setFormError('Informe um ano válido.');
      return;
    }

    const semestre = Number(formState.semestre);
    if (semestre !== 1 && semestre !== 2) {
      setFormError('Semestre deve ser 1 ou 2.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditing && editingTurmaId) {
        await updateTurma(editingTurmaId, {
          topico: formState.topico.trim(),
          ano,
          semestre,
        });
      } else {
        await createTurma({
          topico: formState.topico.trim(),
          ano,
          semestre: semestre as 1 | 2,
        });
      }

      setIsModalOpen(false);
      setEditingTurmaId(null);
      setFormState(emptyForm);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Não foi possível salvar a turma.';
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(turma: Turma) {
    const confirmed = window.confirm(
      `Tem certeza que deseja excluir a turma ${turma.topico}? Esta ação não pode ser desfeita.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteTurma(turma.id);
    } catch {
      // Error state is shown by the hook.
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
        <h1 style={{ margin: 0 }}>Turmas</h1>
        <button type="button" onClick={openCreateModal}>
          Nova Turma
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
          <span>Carregando turmas...</span>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: '0.5rem' }}>
                  Tópico
                </th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: '0.5rem' }}>
                  Ano
                </th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: '0.5rem' }}>
                  Semestre
                </th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: '0.5rem' }}>
                  Alunos Matriculados
                </th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: '0.5rem' }}>
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {turmas.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '0.75rem' }}>
                    Nenhuma turma cadastrada.
                  </td>
                </tr>
              ) : (
                turmas.map((turma) => (
                  <tr key={turma.id}>
                    <td style={{ padding: '0.5rem', borderBottom: '1px solid #f0f0f0' }}>
                      <Link to={`/turmas/${turma.id}`}>{turma.topico}</Link>
                    </td>
                    <td style={{ padding: '0.5rem', borderBottom: '1px solid #f0f0f0' }}>{turma.ano}</td>
                    <td style={{ padding: '0.5rem', borderBottom: '1px solid #f0f0f0' }}>
                      {turma.semestre}
                    </td>
                    <td style={{ padding: '0.5rem', borderBottom: '1px solid #f0f0f0' }}>
                      {turma.alunos.length}
                    </td>
                    <td style={{ padding: '0.5rem', borderBottom: '1px solid #f0f0f0' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button type="button" onClick={() => openEditModal(turma)}>
                          Editar
                        </button>
                        <button type="button" onClick={() => handleDelete(turma)}>
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
            <h2 style={{ margin: 0 }}>{isEditing ? 'Editar Turma' : 'Nova Turma'}</h2>

            <label>
              Tópico
              <input
                value={formState.topico}
                onChange={(event) => updateField('topico', event.target.value)}
                placeholder="Ex: Engenharia de Software"
                required
                style={{ width: '100%' }}
              />
            </label>

            <label>
              Ano
              <input
                type="number"
                min={1}
                value={formState.ano}
                onChange={(event) => updateField('ano', event.target.value)}
                placeholder="2026"
                required
                style={{ width: '100%' }}
              />
            </label>

            <label>
              Semestre
              <select
                value={formState.semestre}
                onChange={(event) => updateField('semestre', event.target.value)}
                style={{ width: '100%' }}
              >
                <option value="1">1</option>
                <option value="2">2</option>
              </select>
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
