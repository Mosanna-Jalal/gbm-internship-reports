// Flag of Palestine (1:2), drawn inline because Windows has no flag emoji.
export function PalestineFlag({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 6 3" role="img" aria-label="Flag of Palestine" className={className}>
      <rect width="6" height="1" fill="#000" />
      <rect y="1" width="6" height="1" fill="#fff" />
      <rect y="2" width="6" height="1" fill="#007a3d" />
      <path d="M0 0 2 1.5 0 3Z" fill="#ce1126" />
    </svg>
  );
}
