/**
 * Double-elimination bracket generator.
 *
 * Produces the complete bracket structure for N teams split across three
 * bracket sides: Winners, Losers, and Grand Final.
 *
 * Only Winners Bracket Round 1 slots are filled with real teams.
 * All other slots use TBD sentinels — they are filled by the advancement
 * layer (Sprint 3) as results are entered.
 *
 * Bracket shape for P = nextPowerOf2(teams.length):
 *   Winners : log2(P) rounds   — [P/2, P/4, …, 1] matches per round
 *   Losers  : 2*(log2(P)−1) rounds — pairs of same count, halving each pair
 *   GF      : 2 slots          — Grand Final + bracket reset
 *
 * Example: 8 teams (P = 8, W = 3)
 *   WB R1 (4), WB R2 (2), WB Final (1)
 *   LB R1 (2), LB R2 (2), LB R3 (1), LB Final (1)
 *   Grand Final (1) + Reset (1)
 *
 * Example: 16 teams (P = 16, W = 4)
 *   WB R1 (8), WB R2 (4), WB R3 (2), WB Final (1)
 *   LB R1 (4), LB R2 (4), LB R3 (2), LB R4 (2), LB R5 (1), LB Final (1)
 *   Grand Final (1) + Reset (1)
 */

/** Sentinel for a slot that has not yet been filled by a real team. */
export const TBD = { id: null, name: 'TBD' };

/**
 * Returns the smallest power of 2 ≥ n.
 * @param {number} n
 * @returns {number}
 */
export function nextPowerOf2(n) {
  if (n <= 1) return 1;
  let p = 1;
  while (p < n) p <<= 1;
  return p;
}

/**
 * Creates an array of TBD fixture slots for a given round.
 * @param {number}  count    - Number of matches in the round
 * @param {number}  round    - 1-based round index within the bracket side
 * @param {string}  bracket  - 'winners' | 'losers' | 'grand_final'
 * @returns {Array<FixtureSlot>}
 */
function makeSlots(count, round, bracket) {
  return Array.from({ length: count }, (_, position) => ({
    home: { ...TBD },
    away: { ...TBD },
    round,
    position,
    bracket,
  }));
}

/**
 * @typedef {Object} FixtureSlot
 * @property {{ id: *, name: string }} home
 * @property {{ id: *, name: string }} away
 * @property {number} round
 * @property {number} position    - 0-based index within the round
 * @property {string} bracket     - 'winners' | 'losers' | 'grand_final'
 */

/**
 * @typedef {Object} BracketRound
 * @property {number}          round
 * @property {string}          name
 * @property {string}          bracket
 * @property {FixtureSlot[]}   fixtures
 */

/**
 * generateDoubleElimination
 *
 * @param {Array<{id:*, name:string}>} teams - Seeded teams (index 0 = top seed).
 *   May contain any number of teams ≥ 2; the bracket is padded to nextPowerOf2.
 *
 * @returns {{
 *   winners:    BracketRound[],
 *   losers:     BracketRound[],
 *   grandFinal: BracketRound[],
 * }}
 *   Returns empty arrays for all three sides when fewer than 2 teams are given.
 *
 * @example
 * const { winners, losers, grandFinal } = generateDoubleElimination(teams)
 * // winners[0].fixtures → Round 1 matches with real teams
 * // losers[0].fixtures  → TBD slots waiting for WB R1 losers
 */
export function generateDoubleElimination(teams) {
  if (!teams || teams.length < 2) {
    return { winners: [], losers: [], grandFinal: [] };
  }

  const P = nextPowerOf2(teams.length);
  const W = Math.log2(P); // number of WB rounds

  // Pad with BYE sentinels so the seeding loop always has P entries.
  const seeded = [...teams];
  while (seeded.length < P) seeded.push({ ...TBD });

  // ── Winners Bracket ───────────────────────────────────────────────────────
  // Round 1: seed 1 vs seed P, seed 2 vs seed P-1, …
  const wbR1Fixtures = [];
  for (let i = 0; i < P / 2; i++) {
    const home = seeded[i];
    const away = seeded[P - 1 - i];
    // If either side is a BYE the real team auto-advances — no fixture needed.
    if (home.id === null || away.id === null) continue;
    wbR1Fixtures.push({ home, away, round: 1, position: i, bracket: 'winners' });
  }

  const winners = [
    { round: 1, name: 'WB R1', bracket: 'winners', fixtures: wbR1Fixtures },
  ];

  for (let r = 2; r <= W; r++) {
    const matchCount = P / Math.pow(2, r);
    winners.push({
      round: r,
      name: r === W ? 'WB Final' : `WB R${r}`,
      bracket: 'winners',
      fixtures: makeSlots(matchCount, r, 'winners'),
    });
  }

  // ── Losers Bracket ────────────────────────────────────────────────────────
  // Structure (alternating elim / drop-in pairs):
  //   Odd  rounds — play among current LB teams (halving match count after pair)
  //   Even rounds — WB losers drop in (same match count as preceding odd round)
  const losers = [];
  const lbRounds = 2 * (W - 1);
  let lbCount = P / 4; // LB R1 always has P/4 matches

  for (let r = 1; r <= lbRounds; r++) {
    const isLbFinal = r === lbRounds;
    losers.push({
      round: r,
      name: isLbFinal ? 'LB Final' : `LB R${r}`,
      bracket: 'losers',
      fixtures: makeSlots(lbCount, r, 'losers'),
    });
    // After each even (drop-in) round, halve match count for the next pair.
    if (r % 2 === 0) {
      lbCount = Math.max(1, Math.floor(lbCount / 2));
    }
  }

  // ── Grand Final ───────────────────────────────────────────────────────────
  // Slot 1: WB winner vs LB Final winner.
  //   → WB winner wins  : WB winner is champion. Reset slot is unused.
  //   → LB winner wins  : bracket reset — play again.
  // Slot 2: bracket reset (only used if LB side wins slot 1).
  const grandFinal = [
    {
      round: 1,
      name: 'Grand Final',
      bracket: 'grand_final',
      fixtures: makeSlots(1, 1, 'grand_final'),
    },
    {
      round: 2,
      name: 'Grand Final Reset',
      bracket: 'grand_final',
      fixtures: makeSlots(1, 2, 'grand_final'),
    },
  ];

  return { winners, losers, grandFinal };
}

// ── Advancement helpers ───────────────────────────────────────────────────────
// These pure functions answer "where does this team go next?" given a result.
// Used by the score-entry layer (Sprint 3) — not by the generator itself.

/**
 * wbLoserToLbRound
 *
 * Returns which LB round receives the losers from a given WB round.
 * WB R1 losers → LB R1 (elim among themselves first)
 * WB Rx losers (x ≥ 2) → LB round 2*(x-1) (even / drop-in rounds)
 *
 * @param {number} wbRound - 1-based WB round number
 * @returns {number} 1-based LB round index
 */
export function wbLoserToLbRound(wbRound) {
  if (wbRound === 1) return 1;
  return 2 * (wbRound - 1);
}

/**
 * wbWinnerNextRound
 *
 * Returns the WB round a WB winner advances to.
 *
 * @param {number} wbRound
 * @returns {number}
 */
export function wbWinnerNextRound(wbRound) {
  return wbRound + 1;
}

/**
 * lbWinnerNextRound
 *
 * Returns the LB round (or 'grand_final') a LB winner advances to.
 *
 * @param {number} lbRound  - current LB round (1-based)
 * @param {number} totalLbRounds - total number of LB rounds (= 2*(W-1))
 * @returns {number | 'grand_final'}
 */
export function lbWinnerNextRound(lbRound, totalLbRounds) {
  if (lbRound === totalLbRounds) return 'grand_final';
  return lbRound + 1;
}
