import { useState, useEffect, useRef } from 'react';
import { PinIcon } from './Icon';

function formatResult(item) {
  const a = item.address;
  const city = a.city || a.town || a.village || a.county || a.state;
  const country = a.country;
  if (!city || !country) return item.display_name.split(',').slice(0, 2).join(',').trim();
  return `${city}, ${country}`;
}

// onChange(label: string, coords: { lat, lng } | null)
export default function LocationInput({ value, onChange, placeholder = 'e.g. Bengaluru, India' }) {
  const [query, setQuery] = useState(value || '');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounce = useRef(null);
  const containerRef = useRef(null);

  // Keep query in sync when value is set externally
  useEffect(() => { setQuery(value || ''); }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function handleChange(e) {
    const q = e.target.value;
    setQuery(q);
    onChange(q, null); // coords unknown when typing freely

    clearTimeout(debounce.current);
    if (q.length < 2) { setResults([]); setOpen(false); return; }

    debounce.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=6&featuretype=city`,
          { headers: { 'Accept-Language': 'en' } },
        );
        const data = await res.json();
        // Deduplicate by formatted label
        const seen = new Set();
        const unique = data.filter((item) => {
          const label = formatResult(item);
          if (seen.has(label)) return false;
          seen.add(label);
          return true;
        });
        setResults(unique.slice(0, 5));
        setOpen(unique.length > 0);
      } catch {
        // silently fail — user can still type freely
      } finally {
        setLoading(false);
      }
    }, 320);
  }

  function select(item) {
    const label = formatResult(item);
    setQuery(label);
    onChange(label, { lat: parseFloat(item.lat), lng: parseFloat(item.lon) });
    setResults([]);
    setOpen(false);
  }

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder}
          style={inputStyle}
          autoComplete="off"
        />
        <PinIcon style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: loading ? '#FF6B47' : '#A09C95', width: 16, height: 16, transition: 'color .15s' }} />
      </div>

      {open && results.length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 20,
          background: '#fff', border: '1px solid rgba(20,16,12,0.08)',
          borderRadius: 10, boxShadow: '0 4px 16px rgba(20,16,12,0.10)',
          overflow: 'hidden',
        }}>
          {results.map((item) => {
            const label = formatResult(item);
            const sub = item.display_name.split(',').slice(1, 3).join(',').trim();
            return (
              <button
                key={item.place_id}
                type="button"
                onMouseDown={() => select(item)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  width: '100%', padding: '10px 14px',
                  background: 'transparent', border: 'none',
                  borderBottom: '1px solid rgba(20,16,12,0.04)',
                  cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#FFF7F3'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <PinIcon style={{ width: 13, height: 13, color: '#A09C95', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1815' }}>{label}</div>
                  {sub && <div style={{ fontSize: 12, color: '#A09C95', marginTop: 1 }}>{sub}</div>}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  fontFamily: 'inherit', fontSize: 15, color: '#1A1815',
  background: '#fff', border: '1px solid rgba(20,16,12,0.08)',
  borderRadius: 10, padding: '12px 14px 12px 38px',
  width: '100%', outline: 'none',
};
