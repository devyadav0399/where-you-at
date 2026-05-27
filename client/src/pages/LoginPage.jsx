import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';

function DecoPin({ x, y, color }) {
  return (
    <div style={{
      position: 'absolute', left: x, top: y,
      width: 22, height: 22, borderRadius: '50%',
      background: color, border: '3px solid #fff',
      boxShadow: '0 4px 12px rgba(20,16,12,0.15)',
      opacity: 0.85, pointerEvents: 'none',
    }} />
  );
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function switchMode(next) {
    setMode(next);
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        await api.post('/api/auth/register', {
          name: form.name, email: form.email, password: form.password,
        });
        await login(form.email, form.password);
      }
      navigate('/home');
    } catch (err) {
      setError(err.response?.data?.error || (mode === 'login' ? 'Login failed' : 'Registration failed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#FBF8F3',
      display: 'grid', placeItems: 'center',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', width: 520, height: 520, borderRadius: '50%', background: 'radial-gradient(circle, #FFE0D2 0%, transparent 65%)', top: -120, left: -120, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', width: 460, height: 460, borderRadius: '50%', background: 'radial-gradient(circle, #E5EDF6 0%, transparent 65%)', bottom: -100, right: -100, pointerEvents: 'none' }} />
      <DecoPin x={140} y={200} color="#7C3AED" />
      <DecoPin x="calc(100% - 160px)" y={170} color="#2563EB" />
      <DecoPin x={220} y="calc(100% - 160px)" color="#16A34A" />
      <DecoPin x="calc(100% - 140px)" y="calc(100% - 180px)" color="#D97706" />

      <div style={{ width: 440, position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
          <div style={{ transform: 'scale(1.4)', transformOrigin: 'center', marginBottom: 18 }}>
            <Logo />
          </div>
          <p style={{ margin: '8px 0 0', color: '#6B6862', fontSize: 16, textAlign: 'center', maxWidth: 340, lineHeight: 1.5 }}>
            A shared calendar for the gang. See where everyone is, and when.
          </p>
        </div>

        <div style={{ background: '#fff', border: '1px solid rgba(20,16,12,0.08)', borderRadius: 16, padding: 28, boxShadow: '0 4px 16px rgba(20,16,12,0.06), 0 1px 2px rgba(20,16,12,0.04)' }}>
          {/* Mode tabs */}
          <div style={{ display: 'flex', gap: 2, marginBottom: 20, background: 'rgba(20,16,12,0.04)', borderRadius: 10, padding: 3 }}>
            {['login', 'register'].map((m) => (
              <button key={m} type="button" onClick={() => switchMode(m)} style={{
                flex: 1, padding: '7px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
                background: mode === m ? '#fff' : 'transparent',
                color: mode === m ? '#1A1815' : '#6B6862',
                boxShadow: mode === m ? '0 1px 3px rgba(20,16,12,0.08)' : 'none',
              }}>
                {m === 'login' ? 'Log in' : 'Join the gang'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {mode === 'register' && (
              <Field label="Your name">
                <input type="text" value={form.name} onChange={set('name')} style={inputStyle} placeholder="e.g. Vikram Khanna" required autoFocus />
              </Field>
            )}
            <Field label="Email">
              <input type="email" value={form.email} onChange={set('email')} style={inputStyle} required autoFocus={mode === 'login'} />
            </Field>
            <Field label="Password">
              <input type="password" value={form.password} onChange={set('password')} style={inputStyle} required />
            </Field>


            {error && <p style={{ margin: 0, fontSize: 13, color: '#C9482A' }}>{error}</p>}

            <button type="submit" disabled={loading} style={{ ...btnPrimary, marginTop: 8, justifyContent: 'center', padding: '13px 16px', fontSize: 15, opacity: loading ? 0.7 : 1 }}>
              {loading ? '…' : mode === 'login' ? 'Log in' : 'Create account'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: '#A09C95' }}>
          Invite-only · for the gang
        </p>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: '#6B6862', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  fontFamily: 'inherit', fontSize: 15, color: '#1A1815',
  background: '#fff', border: '1px solid rgba(20,16,12,0.08)',
  borderRadius: 10, padding: '12px 14px', width: '100%', outline: 'none',
};

const btnPrimary = {
  fontFamily: 'inherit', fontWeight: 600, fontSize: 14,
  padding: '10px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', gap: 8,
  background: '#FF6B47', color: '#fff',
  boxShadow: '0 1px 0 rgba(255,255,255,0.3) inset, 0 2px 6px rgba(255,107,71,0.3)',
};
