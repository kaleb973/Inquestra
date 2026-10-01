export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-hidden="true"
      className={className}
    >
      <path d="M 20 50 C 20 20, 50 20, 50 50 C 50 80, 80 80, 80 50" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
      <path d="M 20 50 C 20 80, 50 80, 50 50 C 50 20, 80 20, 80 50" stroke="currentColor" strokeWidth="8" strokeLinecap="round" strokeDasharray="10 10" opacity="0.5" />
      <circle cx="20" cy="50" r="8" fill="currentColor" />
      <circle cx="80" cy="50" r="8" fill="currentColor" />
      <circle cx="50" cy="50" r="6" fill="currentColor" />
    </svg>
  );
}
