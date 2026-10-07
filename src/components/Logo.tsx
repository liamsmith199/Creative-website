/** Four toes and a pad, after the leash's tag. Drawn, not an icon font, so it inherits currentColor. */
export function Paw({className = ''}: {className?: string}) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className} fill="currentColor">
      <ellipse cx="8" cy="12.5" rx="3" ry="3.8" transform="rotate(-18 8 12.5)" />
      <ellipse cx="13" cy="7" rx="3" ry="3.9" />
      <ellipse cx="19" cy="7" rx="3" ry="3.9" />
      <ellipse cx="24" cy="12.5" rx="3" ry="3.8" transform="rotate(18 24 12.5)" />
      <path d="M16 14.5c-3.6 0-8 5.4-8 9.4 0 2.6 2.1 3.6 4.4 3.1 1.4-.3 2.4-.9 3.6-.9s2.2.6 3.6.9c2.3.5 4.4-.5 4.4-3.1 0-4-4.4-9.4-8-9.4Z" />
    </svg>
  );
}
