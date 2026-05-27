import { Link, useLocation } from 'react-router-dom';
import Logo from './Logo';
import Avatar from './Avatar';
import { useAuth } from '../contexts/AuthContext';
import { LogOutIcon } from './Icon';

export default function TopBar() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();

  const navItems = [
    { to: '/home',    label: 'Calendar' },
    { to: '/map',     label: 'Map' },
    { to: '/profile', label: 'My profile' },
  ];

  return (
    <div style={{
      height: 64, padding: '0 24px',
      background: 'rgba(251,248,243,0.92)',
      backdropFilter: 'saturate(140%) blur(10px)',
      WebkitBackdropFilter: 'saturate(140%) blur(10px)',
      borderBottom: '1px solid rgba(20,16,12,0.08)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      position: 'sticky', top: 0, zIndex: 5,
    }}>
      <Logo />

      <nav style={{ display: 'flex', gap: 4 }}>
        {navItems.map(({ to, label }) => {
          const active = pathname.startsWith(to);
          return (
            <Link key={to} to={to} style={{
              padding: '8px 14px', borderRadius: 8, fontSize: 14, fontWeight: 600,
              color: active ? '#1A1815' : '#6B6862',
              background: active ? 'rgba(20,16,12,0.05)' : 'transparent',
              textDecoration: 'none',
            }}>{label}</Link>
          );
        })}
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {user && <Avatar person={user} size={36} />}
        <button
          onClick={logout}
          title="Log out"
          style={{
            width: 36, height: 36, borderRadius: 10,
            border: '1px solid rgba(20,16,12,0.08)', background: '#fff',
            display: 'grid', placeItems: 'center', cursor: 'pointer',
            color: '#6B6862',
          }}
        >
          <LogOutIcon />
        </button>
      </div>
    </div>
  );
}
