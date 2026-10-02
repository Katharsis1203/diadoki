// Simplified artifact-inspired symbols, rather than reconstructed royal flags.
// Provenance and the Antigonid chronology are recorded in FACTION_SYMBOLS.md.
export function FactionSealSymbols() {
  return <>
    <symbol id="seal-seleucid" viewBox="-12 -12 24 24">
      <circle cy="-8" r="2" />
      <path d="M0 -6V9M-5 -3H5M-8 2Q-8 8 0 9Q8 8 8 2M-10 5L-8 2L-5 4M10 5L8 2L5 4" />
    </symbol>
    <symbol id="seal-ptolemy" viewBox="-12 -12 24 24">
      <path d="M-6 -5L-9 -6L-6 -7Q-6 -10 -3 -9L-1 -6Q3 -7 5 -3L8 5L3 3Q0 5 -3 3Q-5 1 -5 -3Z" />
      <path d="M0 -4Q4 -1 5 3M-2 4L-3 7M1 4V7M-9 8H-4L-6 10L2 7H6L9 5" />
      <circle className="emblem-eye" cx="-4.4" cy="-7" r=".65" />
    </symbol>
    <symbol id="seal-antigonus" viewBox="-12 -12 24 24">
      <circle r="10" /><circle className="emblem-boss" r="2.6" />
      {Array.from({ length: 6 }, (_, i) => <path key={i} transform={`rotate(${i * 60})`} d="M-3 -8Q0 -4.5 3 -8" strokeWidth="1.1" />)}
    </symbol>
  </>
}
