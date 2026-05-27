import { Link, useLocation } from 'react-router-dom';
import Logo from './Logo';
import Avatar from './Avatar';
import { useAuth } from '../contexts/AuthContext';
import { LogOutIcon } from './Icon';

export default function TopBar() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();

  const navItems = [
    { to: '/home',    label: 'Calendar', short: 'Home' },
    { to: '/map',     label: 'Map',      short: 'Map' },
    { to: '/profile', label: 'My profile', short: 'Profile' },
  ];

  return (
    <div
      className="h-16 px-4 sm:px-6 sticky top-0 z-[5] flex items-center justify-between border-b border-black/[0.08]"
      style={{
        background: 'rgba(251,248,243,0.92)',
        backdropFilter: 'saturate(140%) blur(10px)',
        WebkitBackdropFilter: 'saturate(140%) blur(10px)',
      }}
    >
      <Logo />

      <nav className="flex gap-1">
        {navItems.map(({ to, label, short }) => {
          const active = pathname.startsWith(to);
          return (
            <Link key={to} to={to}
              className="px-2 py-2 sm:px-[14px] rounded-lg text-sm font-semibold no-underline"
              style={{
                color: active ? '#1A1815' : '#6B6862',
                background: active ? 'rgba(20,16,12,0.05)' : 'transparent',
              }}
            >
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{short}</span>
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-3">
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
