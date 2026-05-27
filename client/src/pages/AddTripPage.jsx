import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import TopBar from '../components/TopBar';
import Avatar from '../components/Avatar';
import { ChevronIcon } from '../components/Icon';
import LocationInput from '../components/LocationInput';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';

function toInputDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toISOString().slice(0, 10);
}

export default function AddTripPage() {
  const { user: me } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ name: '', destination: '', startDate: '', endDate: '', notes: '' });
  const [destCoords, setDestCoords] = useState(null);
  const [withWho, setWithWho] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/api/users').then(({ data }) => setUsers(data.users));
    if (isEdit) {
      api.get('/api/trips').then(({ data }) => {
        const trip = data.trips.find((t) => t._id === id);
        if (trip) {
          setForm({ name: trip.name, destination: trip.destination, startDate: toInputDate(trip.startDate), endDate: toInputDate(trip.endDate), notes: trip.notes || '' });
          setWithWho(trip.going.filter((u) => (u._id || u) !== me?._id).map((u) => u._id || u));
        }
      });
    }
  }, [id]);

  function togglePerson(userId) {
    setWithWho((arr) => arr.includes(userId) ? arr.filter((x) => x !== userId) : [...arr, userId]);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.name || !form.destination || !form.startDate || !form.endDate) {
      setError('Fill in all required fields.');
      return;
    }
    if (new Date(form.endDate) < new Date(form.startDate)) {
      setError('End date must be after start date.');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, going: withWho, ...destCoords && { destLat: destCoords.lat, destLng: destCoords.lng } };
      if (isEdit) {
        await api.put(`/api/trips/${id}`, payload);
      } else {
        await api.post('/api/trips', payload);
      }
      navigate('/profile');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save trip');
    } finally {
      setSaving(false);
    }
  }

  const friends = users.filter((u) => u._id !== me?._id);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#FBF8F3' }}>
      <TopBar />

      <div style={{ flex: 1, overflowY: 'auto' }} className="scrollbar-thin">
        <div style={{ maxWidth: 720, margin: '0 auto' }} className="px-4 pt-9 pb-12 sm:px-8">

          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14, fontSize: 13, color: '#6B6862' }}>
            <span style={{ cursor: 'pointer' }} onClick={() => navigate('/profile')}>My profile</span>
            <ChevronIcon style={{ width: 12, height: 12 }} />
            <span style={{ color: '#1A1815', fontWeight: 600 }}>{isEdit ? 'Edit trip' : 'New trip'}</span>
          </div>

          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.025em', margin: '0 0 6px' }}>
            {isEdit ? 'Edit trip' : 'Add a trip'}
          </h1>
          <p style={{ margin: '0 0 24px', fontSize: 15, color: '#6B6862' }}>Just the basics — when you'll be away.</p>

          <form onSubmit={handleSubmit}>
            <div style={{ background: '#fff', border: '1px solid rgba(20,16,12,0.08)', borderRadius: 16, boxShadow: '0 1px 2px rgba(20,16,12,0.04)' }} className="p-5 sm:p-6">
              <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2">

                <div style={{ gridColumn: '1 / -1', ...fieldStyle }}>
                  <label style={labelStyle}>Trip name</label>
                  <input style={inputStyle} placeholder="e.g. Ladakh Bike Trip" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>

                <div style={{ gridColumn: '1 / -1', ...fieldStyle }}>
                  <label style={labelStyle}>Destination</label>
                  <LocationInput
                    value={form.destination}
                    onChange={(label, coords) => { setForm((f) => ({ ...f, destination: label })); setDestCoords(coords); }}
                    placeholder="e.g. Leh, India"
                  />
                </div>

                <div style={fieldStyle}>
                  <label style={labelStyle}>Start</label>
                  <input type="date" style={inputStyle} value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>End</label>
                  <input type="date" style={inputStyle} value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required />
                </div>

                <div style={{ gridColumn: '1 / -1', ...fieldStyle }}>
                  <label style={labelStyle}>
                    Who's with you?{' '}
                    <span style={{ color: '#A09C95', textTransform: 'none', letterSpacing: 0, fontWeight: 500 }}>
                      (it'll show on their calendar too)
                    </span>
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {friends.map((f) => {
                      const on = withWho.includes(f._id);
                      return (
                        <button key={f._id} type="button" onClick={() => togglePerson(f._id)} style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          padding: '4px 12px 4px 4px', borderRadius: 999,
                          border: `1px solid ${on ? f.color : 'rgba(20,16,12,0.08)'}`,
                          background: on ? f.color : '#fff',
                          color: on ? '#fff' : '#6B6862',
                          fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
                          boxShadow: on ? '0 2px 6px rgba(0,0,0,0.10)' : 'none',
                        }}>
                          <Avatar person={f} size={22} />
                          {f.name.split(' ')[0]}
                        </button>
                      );
                    })}
                  </div>
                  {withWho.length > 0 && (
                    <p style={{ margin: '6px 0 0', fontSize: 12, color: '#A09C95' }}>
                      This trip will appear on <strong style={{ color: '#6B6862' }}>{withWho.length + 1} calendars</strong> (yours + {withWho.length} other{withWho.length === 1 ? '' : 's'}).
                    </p>
                  )}
                </div>

                <div style={{ gridColumn: '1 / -1', ...fieldStyle }}>
                  <label style={labelStyle}>
                    Notes{' '}
                    <span style={{ color: '#A09C95', textTransform: 'none', letterSpacing: 0, fontWeight: 500 }}>(optional)</span>
                  </label>
                  <textarea
                    style={{ ...inputStyle, resize: 'none', lineHeight: 1.5 }} rows={3}
                    placeholder="Anything the gang should know — flight info, where you'll be staying…"
                    value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {error && <p style={{ margin: '12px 0 0', fontSize: 13, color: '#C9482A' }}>{error}</p>}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button type="button" onClick={() => navigate('/profile')} style={btnGhost}>Cancel</button>
              <button type="submit" disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving…' : 'Save trip'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

const fieldStyle = { display: 'flex', flexDirection: 'column', gap: 6 };
const labelStyle = { fontSize: 12, fontWeight: 600, color: '#6B6862', letterSpacing: '0.02em', textTransform: 'uppercase' };
const inputStyle = { fontFamily: 'inherit', fontSize: 15, color: '#1A1815', background: '#fff', border: '1px solid rgba(20,16,12,0.08)', borderRadius: 10, padding: '12px 14px', width: '100%', outline: 'none' };
const btnPrimary = { fontFamily: 'inherit', fontWeight: 600, fontSize: 14, padding: '10px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, background: '#FF6B47', color: '#fff', boxShadow: '0 1px 0 rgba(255,255,255,0.3) inset, 0 2px 6px rgba(255,107,71,0.3)' };
const btnGhost = { fontFamily: 'inherit', fontWeight: 600, fontSize: 14, padding: '10px 16px', borderRadius: 10, border: '1px solid rgba(20,16,12,0.08)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, background: 'transparent', color: '#1A1815' };
