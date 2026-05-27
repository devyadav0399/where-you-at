const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round', strokeLinejoin: 'round' };

export function PinIcon(props) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" {...S} {...props}>
      <path d="M12 22s-7-7-7-12a7 7 0 1 1 14 0c0 5-7 12-7 12Z"/>
      <circle cx="12" cy="10" r="2.5"/>
    </svg>
  );
}

export function PlusIcon(props) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" {...S} strokeWidth="2" {...props}>
      <path d="M12 5v14M5 12h14"/>
    </svg>
  );
}

export function CalendarIcon(props) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" {...S} {...props}>
      <rect x="3" y="5" width="18" height="16" rx="2"/>
      <path d="M3 9h18M8 3v4M16 3v4"/>
    </svg>
  );
}

export function ChevronIcon(props) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" {...S} {...props}>
      <path d="m9 6 6 6-6 6"/>
    </svg>
  );
}

export function BackIcon(props) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" {...S} {...props}>
      <path d="m15 6-6 6 6 6"/>
    </svg>
  );
}

export function EditIcon(props) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" {...S} {...props}>
      <path d="M16 4l4 4-12 12H4v-4L16 4Z"/>
    </svg>
  );
}

export function TrashIcon(props) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" {...S} {...props}>
      <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>
    </svg>
  );
}

export function LogOutIcon(props) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" {...S} {...props}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
    </svg>
  );
}
