/**
 * Custom sheet icons shared across toolbar, table, and dropdowns.
 */

interface IconProps {
  className?: string;
}

export function AddRowIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Table with 2 rows */}
      <rect x="3" y="3" width="18" height="11" rx="1.5" />
      <line x1="3" y1="8.5" x2="21" y2="8.5" />
      {/* + symbol below */}
      <line x1="12" y1="17" x2="12" y2="21" />
      <line x1="10" y1="19" x2="14" y2="19" />
    </svg>
  );
}

export function AddColumnIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Table with 2 columns */}
      <rect x="3" y="3" width="11" height="18" rx="1.5" />
      <line x1="8.5" y1="3" x2="8.5" y2="21" />
      {/* + symbol to the right */}
      <line x1="17" y1="12" x2="21" y2="12" />
      <line x1="19" y1="10" x2="19" y2="14" />
    </svg>
  );
}
