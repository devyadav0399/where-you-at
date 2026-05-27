export default function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{
        width: 28, height: 28, borderRadius: 8,
        background: '#FF6B47', color: '#fff',
        display: 'grid', placeItems: 'center',
        fontWeight: 800, fontSize: 16, letterSpacing: '-0.04em',
        boxShadow: '0 2px 6px rgba(255,107,71,0.35)',
      }}>w</div>
      <div style={{ fontWeight: 800, fontSize: 17, letterSpacing: '-0.02em' }}>
        where you <span style={{ color: '#FF6B47' }}>at?</span>
      </div>
    </div>
  );
}
