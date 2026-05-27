import { useState, useEffect, useCallback } from 'react';
import TopBar from '../components/TopBar';
import Avatar from '../components/Avatar';
import AvatarStack from '../components/AvatarStack';
import { BackIcon, ChevronIcon, PinIcon } from '../components/Icon';
import { SocketProvider } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import { fmtDate, calDayIdx, buildCalRange, getActiveTrip, getNextTrip } from '../lib/dateUtils';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function hexTint(hex, a) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0,2), 16);
  const g = parseInt(h.slice(2,4), 16);
  const b = parseInt(h.slice(4,6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

export default function HomePage() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [monthOffset, setMonthOffset] = useState(0);

  useEffect(() => {
    Promise.all([api.get('/api/users'), api.get('/api/trips')]).then(([u, t]) => {
      setUsers(u.data.users);
      setTrips(t.data.trips);
    });
  }, []);

  const handleTripCreated = useCallback((trip) => setTrips((prev) => [...prev, trip]), []);
  const handleTripUpdated = useCallback((trip) => setTrips((prev) => prev.map((t) => t._id === trip._id ? trip : t)), []);
  const handleTripDeleted = useCallback((tripId) => setTrips((prev) => prev.filter((t) => t._id !== tripId)), []);
  const handleLocationUpdated = useCallback(({ userId, location }) => {
    setUsers((prev) => prev.map((u) => u._id === userId ? { ...u, baseLocation: location } : u));
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Build calendar window: current month ± offset, showing 4 months
  const windowStart = new Date(today.getFullYear(), today.getMonth() + monthOffset - 1, 1);
  const windowEnd   = new Date(today.getFullYear(), today.getMonth() + monthOffset + 3, 0);
  const totalDays   = Math.round((windowEnd - windowStart) / 86400000) + 1;

  const PCT = (idx) => (idx / (totalDays - 1)) * 100;
  const WID = (sIdx, eIdx) => ((eIdx - sIdx + 1) / totalDays) * 100;
  const todayIdx = calDayIdx(today, windowStart);

  // Month header columns
  const monthCols = [];
  for (let d = new Date(windowStart); d <= windowEnd; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) {
    monthCols.push({ label: MONTHS[d.getMonth()].toUpperCase(), idx: calDayIdx(d, windowStart), month: d.getMonth(), year: d.getFullYear() });
  }

  // People order: me first, then away, then home
  const meUser = users.find((u) => u._id === me?._id);
  const others = users.filter((u) => u._id !== me?._id).sort((a, b) => {
    const aAway = getActiveTrip(trips, a._id, today) ? 1 : 0;
    const bAway = getActiveTrip(trips, b._id, today) ? 1 : 0;
    if (aAway !== bAway) return bAway - aAway;
    return a.name.localeCompare(b.name);
  });
  const people = meUser ? [meUser, ...others] : others;

  const awayCount = people.filter((p) => getActiveTrip(trips, p._id, today)).length;

  // Build trip segments for a person clipped to window
  function tripsForPerson(personId) {
    return trips
      .filter((t) => t.going.some((u) => (u._id || u) === personId))
      .map((t) => {
        const start = new Date(t.startDate); start.setHours(0,0,0,0);
        const end   = new Date(t.endDate);   end.setHours(0,0,0,0);
        const sIdx  = Math.max(0, calDayIdx(start, windowStart));
        const eIdx  = Math.min(totalDays - 1, calDayIdx(end, windowStart));
        return { ...t, _start: start, _end: end, _sIdx: sIdx, _eIdx: eIdx,
                 _clippedLeft: calDayIdx(start, windowStart) < 0,
                 _clippedRight: calDayIdx(end, windowStart) > totalDays - 1 };
      })
      .filter((t) => t._eIdx >= 0 && t._sIdx <= totalDays - 1)
      .sort((a, b) => a._sIdx - b._sIdx);
  }

  return (
    <SocketProvider
      onTripCreated={handleTripCreated}
      onTripUpdated={handleTripUpdated}
      onTripDeleted={handleTripDeleted}
      onLocationUpdated={handleLocationUpdated}
    >
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#FBF8F3' }}>
        <TopBar />

        <div style={{ flex: 1, overflow: 'auto' }} className="scrollbar-thin">
          <div style={{ maxWidth: 1376, margin: '0 auto', padding: '28px 32px 40px' }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 18 }}>
              <div>
                <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.025em', margin: 0 }}>
                  Where the gang's at
                </h1>
                <p style={{ margin: '6px 0 0', fontSize: 15, color: '#6B6862' }}>
                  Today is <strong style={{ color: '#1A1815' }}>{fmtDate(today)}, {today.getFullYear()}</strong>.
                  {awayCount > 0 && <> {awayCount} of {people.length} {awayCount === 1 ? 'is' : 'are'} away.</>}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => setMonthOffset((o) => o - 1)} style={iconBtnStyle}><BackIcon /></button>
                <button onClick={() => setMonthOffset(0)} style={{
                  ...iconBtnStyle, padding: '0 14px', width: 'auto', fontSize: 13, fontWeight: 600,
                  background: monthOffset === 0 ? '#1A1815' : '#fff',
                  color: monthOffset === 0 ? '#fff' : '#1A1815',
                  borderRadius: 999,
                }}>Today</button>
                <button onClick={() => setMonthOffset((o) => o + 1)} style={iconBtnStyle}><ChevronIcon /></button>
              </div>
            </div>

            {/* Calendar */}
            <div style={{
              background: '#fff', border: '1px solid rgba(20,16,12,0.08)',
              borderRadius: 16, overflow: 'hidden',
              boxShadow: '0 1px 2px rgba(20,16,12,0.04)',
            }}>
              {/* Month header */}
              <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', borderBottom: '1px solid rgba(20,16,12,0.08)' }}>
                <div style={{ padding: '14px 18px', borderRight: '1px solid rgba(20,16,12,0.08)', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: '#6B6862', textTransform: 'uppercase' }}>
                  Friend · Where they are
                </div>
                <div style={{ position: 'relative', height: 48 }}>
                  {monthCols.map((m, i) => (
                    <span key={`${m.label}-${m.year}`}>
                      {i > 0 && <div style={{ position: 'absolute', left: PCT(m.idx) + '%', top: 0, bottom: 0, width: 1, background: 'rgba(20,16,12,0.08)' }} />}
                      <div style={{ position: 'absolute', left: PCT(m.idx) + '%', top: 14, paddingLeft: 10, fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', color: '#6B6862' }}>
                        {m.label}
                      </div>
                    </span>
                  ))}
                  {/* Today marker in header */}
                  {todayIdx >= 0 && todayIdx <= totalDays - 1 && (
                    <div style={{ position: 'absolute', left: PCT(todayIdx) + '%', top: 0, bottom: 0, width: 2, background: '#FF6B47', transform: 'translateX(-1px)' }}>
                      <span style={{
                        position: 'absolute', top: 8, left: -22, width: 44, textAlign: 'center',
                        fontSize: 10, fontWeight: 700, letterSpacing: '0.05em',
                        color: '#fff', background: '#FF6B47', padding: '2px 0', borderRadius: 999,
                      }}>TODAY</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Rows */}
              {people.map((p, i) => {
                const isMe = p._id === me?._id;
                const segs = tripsForPerson(p._id);
                const active = getActiveTrip(trips, p._id, today);
                const upcoming = getNextTrip(trips, p._id, today);
                const where = active ? active.destination : p.baseLocation;

                let subtitle;
                if (active) {
                  subtitle = <>Back <strong style={{ color: '#6B6862' }}>{fmtDate(new Date(active.endDate))}</strong></>;
                } else if (upcoming) {
                  subtitle = <>Away from <strong style={{ color: '#6B6862' }}>{fmtDate(new Date(upcoming.startDate))}</strong></>;
                } else {
                  subtitle = <em style={{ fontStyle: 'italic' }}>No trips planned</em>;
                }

                return (
                  <div key={p._id} style={{
                    display: 'grid', gridTemplateColumns: '280px 1fr',
                    borderBottom: i < people.length - 1 ? '1px solid rgba(20,16,12,0.04)' : 'none',
                    background: isMe ? '#FFF7F3' : 'transparent',
                  }}>
                    {/* Left: who */}
                    <div style={{ padding: '12px 18px', borderRight: '1px solid rgba(20,16,12,0.08)', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Avatar person={p} size={36} />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {isMe ? 'You' : p.name.split(' ')[0]}
                          {active && (
                            <span style={{
                              fontSize: 10, fontWeight: 700, letterSpacing: '0.04em',
                              background: hexTint(active.color, 0.15), color: active.color,
                              padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase',
                            }}>Away</span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2, fontSize: 12, color: '#6B6862', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <PinIcon style={{ width: 11, height: 11, flexShrink: 0 }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{where || '—'}</span>
                        </div>
                        <div style={{ fontSize: 11, color: '#A09C95', marginTop: 2 }}>{subtitle}</div>
                      </div>
                    </div>

                    {/* Right: timeline */}
                    <div style={{ position: 'relative', height: 64 }}>
                      {monthCols.slice(1).map((m) => (
                        <div key={`${m.label}-${m.year}-div`} style={{ position: 'absolute', left: PCT(m.idx) + '%', top: 0, bottom: 0, width: 1, background: 'rgba(20,16,12,0.04)' }} />
                      ))}
                      {todayIdx >= 0 && todayIdx <= totalDays - 1 && (
                        <div style={{ position: 'absolute', left: PCT(todayIdx) + '%', top: 0, bottom: 0, width: 2, background: '#FF6B47', opacity: 0.55, transform: 'translateX(-1px)' }} />
                      )}

                      {segs.map((t, idx) => {
                        const left  = PCT(t._sIdx);
                        const width = WID(t._sIdx, t._eIdx);
                        const next  = segs[idx + 1];
                        const labelMax = (next ? PCT(next._sIdx) - 1 : 100) - left;
                        const coTravelers = t.going.filter((u) => (u._id || u) !== p._id)
                          .map((u) => users.find((us) => us._id === (u._id || u)))
                          .filter(Boolean);

                        return (
                          <span key={t._id}>
                            {/* Bar */}
                            <div style={{
                              position: 'absolute', left: `${left}%`,
                              width: `max(${width}%, 8px)`,
                              top: 14, height: 18,
                              background: hexTint(t.color, 0.18),
                              borderLeft: t._clippedLeft ? 'none' : `3px solid ${t.color}`,
                              borderTopLeftRadius: t._clippedLeft ? 0 : 6,
                              borderBottomLeftRadius: t._clippedLeft ? 0 : 6,
                              borderTopRightRadius: t._clippedRight ? 0 : 6,
                              borderBottomRightRadius: t._clippedRight ? 0 : 6,
                              boxShadow: '0 1px 0 rgba(255,255,255,0.6) inset',
                            }} />
                            {/* Label */}
                            <div style={{
                              position: 'absolute', left: `${left}%`,
                              maxWidth: `${Math.max(labelMax, 0)}%`,
                              top: 36, height: 18, paddingLeft: t._clippedLeft ? 0 : 6,
                              display: 'flex', alignItems: 'center', gap: 6,
                              whiteSpace: 'nowrap', overflow: 'hidden',
                              fontSize: 11, fontWeight: 600, color: t.color, lineHeight: 1,
                            }}>
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</span>
                              <span style={{ color: '#A09C95', fontWeight: 500, flexShrink: 0 }}>
                                {fmtDate(t._start)}–{fmtDate(t._end)}
                              </span>
                              {coTravelers.length > 0 && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, paddingLeft: 4, flexShrink: 0 }}>
                                  <span style={{ display: 'inline-block', width: 1, height: 10, background: 'rgba(20,16,12,0.08)' }} />
                                  <AvatarStack people={coTravelers} size={16} max={4} />
                                </span>
                              )}
                            </div>
                          </span>
                        );
                      })}

                      {segs.length === 0 && (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', paddingLeft: 16, fontSize: 12, color: '#A09C95', fontStyle: 'italic' }}>
                          — no trips planned —
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <p style={{ marginTop: 12, textAlign: 'center', fontSize: 12, color: '#A09C95' }}>
              Showing {MONTHS[windowStart.getMonth()]} {windowStart.getFullYear()} – {MONTHS[windowEnd.getMonth()]} {windowEnd.getFullYear()}
            </p>
          </div>
        </div>
      </div>
    </SocketProvider>
  );
}

const iconBtnStyle = {
  width: 36, height: 36, borderRadius: 10,
  border: '1px solid rgba(20,16,12,0.08)', background: '#fff',
  display: 'grid', placeItems: 'center', cursor: 'pointer',
  color: '#6B6862',
};
