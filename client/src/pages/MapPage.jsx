import { useState, useEffect, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import TopBar from '../components/TopBar';
import Avatar from '../components/Avatar';
import { SocketProvider } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import { fmtDate, getActiveTrip, getNextTrip } from '../lib/dateUtils';

// CARTO Voyager — the warm beige tile style from the design
const TILE_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

const SIZE   = 38;
const BORDER = 3;
const OVERLAP = 12;

function avatarCircle(person, zIndex = 0, offset = 0) {
  return `<div style="
    position:absolute; left:${offset}px; top:0;
    width:${SIZE}px; height:${SIZE}px; border-radius:50%;
    background:${person.color}; color:#fff;
    display:flex; align-items:center; justify-content:center;
    font-family:'Plus Jakarta Sans',-apple-system,sans-serif;
    font-size:${Math.round(SIZE * 0.36)}px; font-weight:700; letter-spacing:-0.01em;
    border:${BORDER}px solid #fff;
    box-shadow:0 2px 8px rgba(20,16,12,0.20);
    z-index:${zIndex};
  ">${person.initials}</div>`;
}

function makeClusterIcon(group) {
  const people  = group.people.map((p) => p.user);
  const shown   = people.slice(0, 3);
  const extra   = people.length - shown.length;
  const total   = shown.length + (extra > 0 ? 1 : 0);
  const width   = SIZE + (total - 1) * (SIZE - OVERLAP);

  let html = `<div style="position:relative; width:${width}px; height:${SIZE}px;">`;
  shown.forEach((person, i) => {
    html += avatarCircle(person, shown.length - i, i * (SIZE - OVERLAP));
  });
  if (extra > 0) {
    const offset = shown.length * (SIZE - OVERLAP);
    html += `<div style="
      position:absolute; left:${offset}px; top:0;
      width:${SIZE}px; height:${SIZE}px; border-radius:50%;
      background:#E8E2D3; color:#6B6862;
      display:flex; align-items:center; justify-content:center;
      font-family:'Plus Jakarta Sans',-apple-system,sans-serif;
      font-size:${Math.round(SIZE * 0.32)}px; font-weight:700;
      border:${BORDER}px solid #fff;
      box-shadow:0 2px 8px rgba(20,16,12,0.20);
      z-index:0;
    ">+${extra}</div>`;
  }
  html += '</div>';

  return L.divIcon({
    className: 'wya-map-pin',
    html,
    iconSize:   [width, SIZE],
    iconAnchor: [width / 2, SIZE / 2],
  });
}

// Auto-fit the map to show all markers when they change
function FitBounds({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length === 0) return;
    if (positions.length === 1) {
      map.setView(positions[0], 6, { animate: true });
    } else {
      map.fitBounds(positions, { padding: [60, 60], maxZoom: 8, animate: true });
    }
  }, [JSON.stringify(positions)]);
  return null;
}

// Build location groups from users + trips
function buildGroups(users, trips, myId, today) {
  const grouped = {};

  for (const user of users) {
    const active = getActiveTrip(trips, user._id, today);
    const next   = getNextTrip(trips, user._id, today);
    const location = active ? active.destination : (user.baseLocation || '—');
    const isAway   = !!active;

    const lat = isAway ? (active.destLat ?? null) : (user.lat ?? null);
    const lng = isAway ? (active.destLng ?? null) : (user.lng ?? null);

    if (!grouped[location]) {
      grouped[location] = { location, people: [], lat: null, lng: null };
    }
    grouped[location].people.push({ user, isAway, activeTrip: active, nextTrip: next });
    // Use first known coordinate for this location
    if (grouped[location].lat === null && lat !== null) {
      grouped[location].lat = lat;
      grouped[location].lng = lng;
    }
  }

  // Sort: groups where all are away first, then by count desc
  return Object.values(grouped).sort((a, b) => {
    const aAllAway = a.people.every((p) => p.isAway);
    const bAllAway = b.people.every((p) => p.isAway);
    if (aAllAway !== bAllAway) return bAllAway - aAllAway;
    return b.people.length - a.people.length;
  });
}

function subtitle(person, today) {
  const { activeTrip, nextTrip } = person;
  if (activeTrip) return `On ${activeTrip.name} · back ${fmtDate(new Date(activeTrip.endDate))}`;
  if (nextTrip)   return `Away ${fmtDate(new Date(nextTrip.startDate))}`;
  return 'Around';
}

export default function MapPage() {
  const { user: me } = useAuth();
  const [users, setUsers]   = useState([]);
  const [trips, setTrips]   = useState([]);

  useEffect(() => {
    Promise.all([api.get('/api/users'), api.get('/api/trips')]).then(([u, t]) => {
      setUsers(u.data.users);
      setTrips(t.data.trips);
    });
  }, []);

  const handleTripCreated  = useCallback((t) => setTrips((p) => [...p, t]), []);
  const handleTripUpdated  = useCallback((t) => setTrips((p) => p.map((x) => x._id === t._id ? t : x)), []);
  const handleTripDeleted  = useCallback((id) => setTrips((p) => p.filter((x) => x._id !== id)), []);
  const handleLocUpdated   = useCallback(({ userId, location, lat, lng }) => {
    setUsers((p) => p.map((u) => u._id === userId ? { ...u, baseLocation: location, lat, lng } : u));
  }, []);

  const today  = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d; }, []);
  const groups = useMemo(() => buildGroups(users, trips, me?._id, today), [users, trips, me?._id, today]);

  const awayCount = users.filter((u) => getActiveTrip(trips, u._id, today)).length;
  const homeCount = users.length - awayCount;

  const markerGroups = groups.filter((g) => g.lat !== null);
  const markerPositions = markerGroups.map((g) => [g.lat, g.lng]);

  return (
    <SocketProvider
      onTripCreated={handleTripCreated} onTripUpdated={handleTripUpdated}
      onTripDeleted={handleTripDeleted} onLocationUpdated={handleLocUpdated}
    >
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#FBF8F3' }}>
        <TopBar />

        <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
          {/* ── Sidebar ── */}
          <div style={{
            width: 320, flexShrink: 0, borderRight: '1px solid rgba(20,16,12,0.08)',
            display: 'flex', flexDirection: 'column', background: '#FBF8F3',
          }}>
            <div style={{ padding: '24px 20px 12px' }}>
              <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.025em', margin: 0 }}>Right now</h1>
              <p style={{ margin: '4px 0 0', fontSize: 14, color: '#6B6862' }}>
                {homeCount} home · {awayCount} away
              </p>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 24px' }} className="scrollbar-thin">
              {groups.map((group) => {
                const allAway = group.people.every((p) => p.isAway);
                return (
                  <div key={group.location} style={{ marginBottom: 16 }}>
                    {/* City header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#A09C95', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                        {group.location}
                      </span>
                      {allAway ? (
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 999,
                          background: '#FF6B47', color: '#fff', letterSpacing: '0.04em',
                        }}>AWAY</span>
                      ) : (
                        group.people.length > 1 && (
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#A09C95' }}>
                            {group.people.length}
                          </span>
                        )
                      )}
                    </div>

                    {/* People card */}
                    <div style={{
                      background: '#fff', border: '1px solid rgba(20,16,12,0.08)',
                      borderRadius: 14, overflow: 'hidden',
                      boxShadow: '0 1px 2px rgba(20,16,12,0.04)',
                    }}>
                      {group.people.map((person, i) => {
                        const isMe = person.user._id === me?._id;
                        const sub  = subtitle(person, today);
                        return (
                          <div key={person.user._id} style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '10px 14px',
                            background: isMe ? '#FFF7F3' : 'transparent',
                            borderTop: i > 0 ? '1px solid rgba(20,16,12,0.04)' : 'none',
                          }}>
                            <Avatar person={person.user} size={36} />
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.005em' }}>
                                {isMe ? 'You' : person.user.name.split(' ')[0]}
                              </div>
                              <div style={{ fontSize: 12, color: '#A09C95', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {sub}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {groups.length === 0 && (
                <p style={{ fontSize: 14, color: '#A09C95', fontStyle: 'italic', marginTop: 24 }}>
                  No one has set a location yet.
                </p>
              )}
            </div>
          </div>

          {/* ── Map ── */}
          <div style={{ flex: 1, position: 'relative' }}>
            <MapContainer
              center={[20, 78]}
              zoom={4}
              style={{ width: '100%', height: '100%' }}
              zoomControl={true}
              attributionControl={true}
            >
              <TileLayer url={TILE_URL} attribution={TILE_ATTR} />
              {markerGroups.map((g) => (
                <Marker
                  key={g.location}
                  position={[g.lat, g.lng]}
                  icon={makeClusterIcon(g)}
                />
              ))}
              {markerPositions.length > 0 && <FitBounds positions={markerPositions} />}
            </MapContainer>
          </div>
        </div>
      </div>
    </SocketProvider>
  );
}
