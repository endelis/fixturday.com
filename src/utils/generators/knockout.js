/**
 * Single-elimination (knockout) bracket generator.
 *
 * Teams are seeded (index 0 = top seed). The bracket is padded to the next
 * power of two with BYE slots. Seeding follows the standard tournament
 * convention: highest seed is paired against the lowest seed, second highest
 * against second lowest, and so on. A team that is paired against a BYE
 * advances automatically without a real fixture being created.
 *
 * Only Round 1 fixtures are generated here; subsequent rounds depend on
 * match results and are not produced (they will be determined by the
 * bracket-management layer).
 */

/** Sentinel object used to represent a bye slot. */
const BYE = { id: null, name: 'BYE' };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * nextPowerOf2
 *
 * Returns the smallest power of 2 that is greater than or equal to `n`.
 *
 * @param {number} n - A positive integer.
 * @returns {number}
 *
 * @example
 * nextPowerOf2(1)  // 1
 * nextPowerOf2(3)  // 4
 * nextPowerOf2(8)  // 8
 * nextPowerOf2(9)  // 16
 */
export function nextPowerOf2(n) {
  if (n <= 1) return 1;
  let p = 1;
  while (p < n) p <<= 1;
  return p;
}

/**
 * getRoundName
 *
 * Maps a round number to a human-readable label based on the total number of
 * bracket slots (which is always a power of 2).
 *
 * @param {number} totalSlots  - Total bracket slots (power of 2): 2, 4, 8, 16, 32 …
 * @param {number} currentRound - 1-based round index (1 = first round played).
 * @returns {string} One of 'F', 'SF', 'QF', 'R16', 'R32', 'R64', …
 *   For brackets larger than 32 the pattern 'R{slots}' is used generically.
 *
 * @example
 * getRoundName(8, 1)  // 'QF'  (8 slots → round 1 has 4 matches = QF)
 * getRoundName(8, 2)  // 'SF'
 * getRoundName(8, 3)  // 'F'
 * getRoundName(16, 1) // 'R16'
 */
export function getRoundName(totalSlots, currentRound) {
  // In round `r` of a bracket with `totalSlots` slots, there are
  // totalSlots / 2^r matches still to be played.
  // The *number of teams remaining* at the START of round r equals
  // totalSlots / 2^(r-1).
  const teamsAtRoundStart = totalSlots / Math.pow(2, currentRound - 1);

  switch (teamsAtRoundStart) {
    case 2:  return 'F';
    case 4:  return 'SF';
    case 8:  return 'QF';
    case 16: return 'R16';
    case 32: return 'R32';
    case 64: return 'R64';
    default:
      // Generic label for very large brackets.
      return `R${teamsAtRoundStart}`;
  }
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * generateKnockout
 *
 * Generates the first round (and only the first round) of a single-
 * elimination bracket. Subsequent rounds are determined by match results.
 *
 * @param {Array<{id: *, name: string}>} teams - Seeded teams, index 0 is the
 *   top (1st) seed. The array may be unsorted beforehand; the caller is
 *   responsible for providing the desired seeding order.
 *
 * @returns {Array<{round: number, name: string, fixtures: Array<{home: object, away: object, round: number}>}>}
 *   An array containing a single round object for Round 1. Each fixture has:
 *   - `home`  – team object
 *   - `away`  – team object
 *   - `round` – always 1
 *
 *   Fixtures where one side is a BYE are omitted; the seeded team advances
 *   automatically. Fixtures where BOTH sides are BYE are also omitted (this
 *   cannot occur with valid input but is guarded for safety).
 *
 * Edge cases:
 *   - Empty array or 0 teams  → returns []
 *   - 1 team                  → returns [] (no opponent possible)
 *
 * @example
 * generateKnockout([A, B, C, D, E])
 * // Slots padded to 8: [A, B, C, D, E, BYE, BYE, BYE]
 * // Pairings: A vs BYE, B vs BYE, C vs BYE, D vs E
 * // Real fixtures: [{ home: D, away: E }]  (A, B, C auto-advance)
 */
export function generateKnockout(teams) {
  if (!teams || teams.length < 2) return [];

  const totalSlots = nextPowerOf2(teams.length);

  // Fill the bracket with teams then pad remaining slots with BYE.
  const slots = [...teams];
  while (slots.length < totalSlots) {
    slots.push(BYE);
  }

  // Standard seeding pairing: slot[i] vs slot[totalSlots - 1 - i]
  // e.g. for 8 slots: 0 vs 7, 1 vs 6, 2 vs 5, 3 vs 4
  const fixtures = [];
  const half = totalSlots / 2;

  for (let i = 0; i < half; i++) {
    const home = slots[i];
    const away = slots[totalSlots - 1 - i];

    // Skip any pairing that involves a BYE — the real team auto-advances.
    if (home.id === null || away.id === null) continue;

    fixtures.push({ home, away, round: 1 });
  }

  const roundName = getRoundName(totalSlots, 1);

  return [
    {
      round: 1,
      name: roundName,
      fixtures,
    },
  ];
}
