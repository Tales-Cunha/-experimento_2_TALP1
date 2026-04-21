import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';

import { AlunosPage } from './pages/alunos/AlunosPage';

export function App() {
  return (
    <Router>
      <Routes>
        <Route path="/alunos" element={<AlunosPage />} />
        <Route path="*" element={<Navigate to="/alunos" replace />} />
      </Routes>
    </Router>
  );
}
