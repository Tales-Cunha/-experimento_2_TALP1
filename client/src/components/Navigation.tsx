import { Link, useLocation } from 'react-router-dom';

export function Navigation() {
  const location = useLocation();

  const navItemStyle = (path: string) => ({
    padding: '0.5rem 1rem',
    textDecoration: 'none',
    color: location.pathname.startsWith(path) ? '#007bff' : '#333',
    fontWeight: location.pathname.startsWith(path) ? 'bold' : 'normal',
    borderBottom: location.pathname.startsWith(path) ? '2px solid #007bff' : '2px solid transparent',
  });

  return (
    <nav
      style={{
        display: 'flex',
        gap: '1rem',
        padding: '1rem 2rem',
        borderBottom: '1px solid #ddd',
        backgroundColor: '#f8f9fa',
        marginBottom: '1rem',
      }}
    >
      <Link to="/turmas" style={navItemStyle('/turmas')}>
        Turmas
      </Link>
      <Link to="/alunos" style={navItemStyle('/alunos')}>
        Alunos
      </Link>
      <Link to="/avaliacoes" style={navItemStyle('/avaliacoes')}>
        Avaliações
      </Link>
    </nav>
  );
}
