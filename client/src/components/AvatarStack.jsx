import Avatar from './Avatar';

export default function AvatarStack({ people, size = 24, max = 5 }) {
  const shown = people.slice(0, max);
  const extra = people.length - shown.length;
  return (
    <div style={{ display: 'flex' }}>
      {shown.map((p) => (
        <div key={p._id} style={{ marginLeft: shown.indexOf(p) > 0 ? -8 : 0, boxShadow: '0 0 0 2px #fff', borderRadius: '50%' }}>
          <Avatar person={p} size={size} />
        </div>
      ))}
      {extra > 0 && (
        <div style={{
          marginLeft: -8, width: size, height: size, borderRadius: '50%',
          background: '#E8E2D3', color: '#6B6862',
          fontSize: Math.round(size * 0.34), fontWeight: 700,
          display: 'grid', placeItems: 'center',
          boxShadow: '0 0 0 2px #fff',
        }}>+{extra}</div>
      )}
    </div>
  );
}
