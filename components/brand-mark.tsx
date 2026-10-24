export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M8.5 14h5.25M13.5 14l5.25-6M13.5 14l5.25 6" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="6" cy="14" r="3.25" fill="var(--background)" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="21" cy="6" r="3.25" fill="var(--background)" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="21" cy="22" r="3.25" fill="var(--background)" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}
