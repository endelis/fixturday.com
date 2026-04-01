/**
 * Round-robin fixture generator using the circle method.
 *
 * The circle method works by fixing the first team in position and rotating
 * all other teams around it each round. This guarantees every team plays
 * every other team exactly once.
 */

/** Sentinel object used to represent a bye slot. */
const BYE = { id: null, name: 'BYE' };

/**
 * generateRoundRobin
 *
 * @param {Array<{id: *, name: string}>} teams - Array of team objects. Must
 *   have at least `id` and `name` properties. Order does not matter for
 *   correctness but affects which team is "pinned" in the circle (index 0).
 *
 * @returns {Array<Array<{home: object, away: object, round: number}>>}
 *   An array of rounds. Each round is an array of fixture objects:
 *   - `home`  – team object (or BYE sentinel)
 *   - `away`  – team object (or BYE sentinel)
 *   - `round` – 1-based round number
 *
 *   For an odd number of teams a BYE team `{ id: null, name: 'BYE' }` is
 *   appended so the total number of slots is even. The team paired with BYE
 *   in a given round has no real opponent that round.
 *
 *   Total rounds  : n - 1 for even n, n for odd n  (n = padded team count)
 *   Fixtures/round: n / 2
 *
 * Edge cases:
 *   - Empty array or fewer than 2 teams → returns []
 */
export function generateRoundRobin(teams) {
  if (!teams || teams.length < 2) return [];

  // Work on a copy; pad to even length with BYE if necessary.
  let slots = [...teams];
  if (slots.length % 2 !== 0) {
    slots.push(BYE);
  }

  const n = slots.length;           // always even
  const totalRounds = n - 1;        // circle method produces n-1 rounds for even n
  const matchesPerRound = n / 2;

  // Pin slots[0], rotate slots[1..n-1] each round.
  const pinned = slots[0];
  let rotating = slots.slice(1);    // length n-1

  const rounds = [];

  for (let r = 0; r < totalRounds; r++) {
    const roundFixtures = [];

    // Build the n/2 pairings for this round.
    // Pair pinned with rotating[0], then mirror the rest of the ring.
    const ring = [pinned, ...rotating]; // length n

    for (let i = 0; i < matchesPerRound; i++) {
      const home = ring[i];
      const away = ring[n - 1 - i];

      // Skip BYE vs BYE (only possible if we somehow had two BYEs, which
      // cannot happen since we add at most one, but guard anyway).
      if (home.id === null && away.id === null) continue;

      roundFixtures.push({ home, away, round: r + 1 });
    }

    rounds.push(roundFixtures);

    // Rotate: move last element of rotating to the front.
    rotating = [rotating[rotating.length - 1], ...rotating.slice(0, rotating.length - 1)];
  }

  return rounds;
}
