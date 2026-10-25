/** A plate seen from above, with a leaf for the food. Drawn, not an icon font, so it inherits currentColor. */
export function Plate({className = ''}: {className?: string}) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className} fill="currentColor">
      <path d="M16 2.5a13.5 13.5 0 1 0 0 27 13.5 13.5 0 0 0 0-27Zm0 3a10.5 10.5 0 1 1 0 21 10.5 10.5 0 0 1 0-21Z" />
      <path d="M10.2 20.6c-.4-5.6 3.6-9.6 11.4-9.8.2 7.6-3.9 11.6-9.6 11.2l3.9-4.5-.6-.5-4.6 4.2-.5-.6Z" />
    </svg>
  );
}
