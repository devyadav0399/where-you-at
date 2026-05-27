import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import Avatar from '../components/Avatar';
import AvatarStack from '../components/AvatarStack';
import { PlusIcon, CalendarIcon, EditIcon, TrashIcon, PinIcon } from '../components/Icon';
import LocationInput from '../components/LocationInput';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import { fmtDate, getActiveTrip } from '../lib/dateUtils';

export default function ProfilePage() {
  const { user: me, setUser } = useAuth();
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [users, setUsers] = useState([]);
  const [location, setLocation] = useState(me?.baseLocation || '');
  const [locationCoords, setLocationCoords] = useState(null);
  const [savingLoc, setSavingLoc] = useState(false);

  useEffect(() => {
    Promise.all([api.get('/api/trips'), api.get('/api/users')]).then(([t, u]) => {
      setTrips(t.data.trips);
      setUsers(u.data.users);
    });
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const myTrips = trips
    .filter((t) => t.going.some((u) => (u._id || u) === me?._id))
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

  const activeTrip = getActiveTrip(trips, me?._id, today);

  async function saveLocation() {
    if (!location.trim()) return;
    setSavingLoc(true);
    try {
      await api.put('/api/users/me/location', { location: location.trim(), ...locationCoords });
      setUser((u) => ({ ...u, baseLocation: location.trim(), ...locationCoords }));
    } finally {
      setSavingLoc(false);
    }
  }

  async function deleteTrip(id) {
    if (!confirm('Delete this trip?')) return;
    await api.delete(`/api/trips/${id}`);
    setTrips((prev) => prev.filter((t) => t._id !== id));
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#FBF8F3' }}>
      <TopBar />

      <div style={{ flex: 1, overflowY: 'auto' }} className="scrollbar-thin">
        <div style={{ maxWidth: 880, margin: '0 auto' }} className="px-4 pt-9 pb-12 sm:px-8">

          {/* Profile card */}
          <div style={{ ...card, padding: 28, marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
              {me && <Avatar person={me} size={72} />}
              <div>
                <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.025em', margin: 0 }}>{me?.name}</h1>
                <p style={{ margin: '4px 0 0', fontSize: 14, color: '#6B6862' }}>This is what the gang sees.</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={labelStyle}>Where you at</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <LocationInput
                    value={location}
                    onChange={(label, coords) => { setLocation(label); setLocationCoords(coords); }}
                  />
                </div>
                <button onClick={saveLocation} disabled={savingLoc} style={{ ...btnPrimary, opacity: savingLoc ? 0.7 : 1 }}>
                  {savingLoc ? 'Saving…' : 'Save'}
                </button>
              </div>
              {activeTrip ? (
                <p style={{ margin: '4px 0 0', fontSize: 12, color: '#A09C95' }}>
                  On <strong style={{ color: '#6B6862' }}>{activeTrip.name}</strong> until {fmtDate(new Date(activeTrip.endDate))}.
                </p>
              ) : (
                <p style={{ margin: '4px 0 0', fontSize: 12, color: '#A09C95' }}>Update whenever you move around.</p>
              )}
            </div>
          </div>

          {/* Trips section */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>My trips</h2>
            <button onClick={() => navigate('/trips/new')} style={btnPrimary}>
              <PlusIcon />
              Add a trip
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {myTrips.length === 0 && (
              <div style={{ ...card, padding: 28, textAlign: 'center', color: '#6B6862', fontSize: 14, border: '1px dashed rgba(20,16,12,0.08)' }}>
                No trips yet. Add one so the gang knows.
              </div>
            )}
            {myTrips.map((t) => {
              const start = new Date(t.startDate);
              const end   = new Date(t.endDate);
              const days  = Math.round((end - start) / 86400000) + 1;
              const isActive = getActiveTrip([t], me?._id, today);
              const coTravelers = t.going
                .filter((u) => (u._id || u) !== me?._id)
                .map((u) => users.find((us) => us._id === (u._id || u)))
                .filter(Boolean);

              return (
                <div key={t._id} style={{ ...card, padding: 16 }}
                     className="grid items-center gap-3 sm:gap-4 [grid-template-columns:auto_1fr_auto] sm:[grid-template-columns:auto_1fr_auto_auto]"
                >
                  {/* Date stamp */}
                  <div style={{ width: 56, padding: '6px 0', borderRadius: 10, background: '#F4EFE5', textAlign: 'center' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#6B6862', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      {fmtDate(start).split(' ')[0]}
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em' }}>
                      {start.getDate()}
                    </div>
                  </div>

                  {/* Body */}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 15, fontWeight: 700 }}>{t.name}</span>
                      {isActive && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px 4px 8px', borderRadius: 999, background: '#DCFCE7', color: '#15803D', fontSize: 12, fontWeight: 600 }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16A34A' }} />
                          Now
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4, fontSize: 13, color: '#6B6862' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <PinIcon style={{ width: 12, height: 12 }} /> {t.destination}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <CalendarIcon style={{ width: 12, height: 12 }} /> {fmtDate(start)} – {fmtDate(end)} · {days}d
                      </span>
                    </div>
                  </div>

                  {/* Co-travelers */}
                  <div className="hidden sm:block">
                    {coTravelers.length > 0
                      ? <AvatarStack people={coTravelers} size={22} max={4} />
                      : <span style={{ fontSize: 12, color: '#A09C95', fontStyle: 'italic' }}>Solo</span>}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => navigate(`/trips/${t._id}/edit`)} style={iconBtn}><EditIcon /></button>
                    <button onClick={() => deleteTrip(t._id)} style={{ ...iconBtn, color: '#C9482A' }}><TrashIcon /></button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

const card = { background: '#fff', border: '1px solid rgba(20,16,12,0.08)', borderRadius: 16, boxShadow: '0 1px 2px rgba(20,16,12,0.04)' };
const labelStyle = { fontSize: 12, fontWeight: 600, color: '#6B6862', letterSpacing: '0.02em', textTransform: 'uppercase' };
const inputStyle = { fontFamily: 'inherit', fontSize: 15, color: '#1A1815', background: '#fff', border: '1px solid rgba(20,16,12,0.08)', borderRadius: 10, padding: '12px 14px', width: '100%', outline: 'none' };
const btnPrimary = { fontFamily: 'inherit', fontWeight: 600, fontSize: 14, padding: '10px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, background: '#FF6B47', color: '#fff', boxShadow: '0 1px 0 rgba(255,255,255,0.3) inset, 0 2px 6px rgba(255,107,71,0.3)' };
const iconBtn = { width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(20,16,12,0.08)', background: '#fff', display: 'grid', placeItems: 'center', cursor: 'pointer', color: '#6B6862' };
