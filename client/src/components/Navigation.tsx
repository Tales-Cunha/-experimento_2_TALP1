import { Link, useLocation } from 'react-router-dom';

export function Navigation() {
  const location = useLocation();

  const navItemStyle = (path: string) => ({
    padding: '0.75rem 1.5rem',
    textDecoration: 'none',
    color: location.pathname.startsWith(path) ? 'var(--paper)' : 'var(--ink)',
    backgroundColor: location.pathname.startsWith(path) ? 'var(--ink)' : 'transparent',
    fontWeight: 500,
    fontSize: '0.8rem',
    textTransform: 'uppercase' as const,
    borderRight: '1px solid var(--grid-line)',
    display: 'flex',
    alignItems: 'center',
    transition: 'var(--transition-fast)',
  });

  return (
    <nav
      style={{
        display: 'flex',
        borderBottom: '2px solid var(--ink)',
        backgroundColor: 'var(--paper)',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
      }}
    >
      <div style={{ 
        padding: '0.75rem 2rem', 
        borderRight: '2px solid var(--ink)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <div style={{ width: 12, height: 12, backgroundColor: 'var(--ink)' }} />
        <span style={{ fontWeight: 'bold', fontSize: '0.9rem', letterSpacing: '0.1em' }}>SAMS</span>
      </div>
      <Link to="/turmas" style={navItemStyle('/turmas')}>
        Turmas
      </Link>
      <Link to="/alunos" style={navItemStyle('/alunos')}>
        Alunos
      </Link>
      <Link to="/avaliacoes" style={navItemStyle('/avaliacoes')}>
        Avaliações
      </Link>
      <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', padding: '0 2rem', alignItems: 'center' }}>
        <span style={{ fontSize: '0.65rem', color: 'var(--grid-line)', textTransform: 'uppercase' }}>
          Technical Portal v2.0
        </span>
      </div>
    </nav>
  );
}
