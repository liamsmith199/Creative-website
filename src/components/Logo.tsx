/** Six-armed ice crystal. Drawn, not an icon font, so it inherits currentColor. */
export function Snowflake({className = ''}: {className?: string}) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className} fill="none">
      <g stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
        {[0, 60, 120].map((deg) => (
          <g key={deg} transform={`rotate(${deg} 16 16)`}>
            <path d="M16 3v26" />
            <path d="M12 6.5 16 10l4-3.5M12 25.5 16 22l4 3.5" />
          </g>
        ))}
      </g>
    </svg>
  );
}
