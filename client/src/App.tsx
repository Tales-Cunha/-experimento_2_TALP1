import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';

import { AvaliacoesPage } from './pages/avaliacoes/AvaliacoesPage';
import { AlunosPage } from './pages/alunos/AlunosPage';
import { TurmaDetailPage } from './pages/turmas/TurmaDetailPage';
import { TurmasPage } from './pages/turmas/TurmasPage';
import { Navigation } from './components/Navigation';

export function App() {
  return (
    <Router>
      <Navigation />
      <Routes>
        <Route path="/avaliacoes" element={<AvaliacoesPage />} />
        <Route path="/turmas" element={<TurmasPage />} />
        <Route path="/turmas/:id" element={<TurmaDetailPage />} />
        <Route path="/alunos" element={<AlunosPage />} />
        <Route path="*" element={<Navigate to="/turmas" replace />} />
      </Routes>
    </Router>
  );
}
