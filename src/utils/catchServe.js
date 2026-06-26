/**
 * Catch'n Serve Ball scoring utilities.
 * All functions are pure — no side effects, no Supabase calls.
 *
 * Rules (ICSBF):
 *  Sets 1–2 : first to 25 points, win by ≥ 2
 *  Set 3    : first to 15 points, win by ≥ 2
 *  Match    : best of 3 sets (first to win 2 sets)
 */

/**
 * Returns the winner of a single set, or null if incomplete/invalid.
 * @param {number|string} home
 * @param {number|string} away
 * @param {boolean} isDeciding - true for the 3rd set
 * @returns {'home'|'away'|null}
 */
export function setWinner(home, away, isDeciding = false) {
  const h = Number(home)
  const a = Number(away)
  if (!Number.isFinite(h) || !Number.isFinite(a)) return null
  const target = isDeciding ? 15 : 25
  if (h >= target && h - a >= 2) return 'home'
  if (a >= target && a - h >= 2) return 'away'
  return null
}

/**
 * Validates a complete Catch'n Serve match (25/25/15).
 * @param {Array<{home:number|string, away:number|string}>} sets
 * @returns {{ valid: boolean, error?: string, setsHome?: number, setsAway?: number }}
 */
export function validateCatchServeMatch(sets) {
  if (!sets || sets.length < 2) {
    return { valid: false, error: 'Enter at least Set 1 and Set 2 scores.' }
  }

  const w1 = setWinner(sets[0].home, sets[0].away, false)
  if (!w1) {
    return { valid: false, error: 'Set 1 score is invalid — first to 25, win by 2.' }
  }

  const w2 = setWinner(sets[1].home, sets[1].away, false)
  if (!w2) {
    return { valid: false, error: 'Set 2 score is invalid — first to 25, win by 2.' }
  }

  if (w1 !== w2) {
    if (sets.length < 3 || sets[2].home === '' || sets[2].away === '') {
      return { valid: false, error: 'Match is 1-1. Enter Set 3 score (first to 15, win by 2).' }
    }
    const w3 = setWinner(sets[2].home, sets[2].away, true)
    if (!w3) {
      return { valid: false, error: 'Set 3 score is invalid — first to 15, win by 2.' }
    }
  }

  const playedSets = w1 === w2 ? sets.slice(0, 2) : sets.slice(0, 3)
  const setsHome = playedSets.filter((s, i) => setWinner(s.home, s.away, i === 2) === 'home').length
  const setsAway = playedSets.filter((s, i) => setWinner(s.home, s.away, i === 2) === 'away').length
  return { valid: true, setsHome, setsAway }
}
