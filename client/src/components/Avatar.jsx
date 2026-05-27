export default function Avatar({ person, size = 36 }) {
  const fontSize = Math.round(size * 0.38);
  return (
    <div
      style={{
        width: size, height: size, borderRadius: '50%',
        background: person.color, color: '#fff',
        fontSize, fontWeight: 700, letterSpacing: '-0.01em',
        display: 'grid', placeItems: 'center',
        flexShrink: 0,
        boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,0.4)',
      }}
    >
      {person.initials}
    </div>
  );
}
