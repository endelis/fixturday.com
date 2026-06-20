/**
 * Beach volleyball scoring utilities.
 * All functions are pure — no side effects, no Supabase calls.
 *
 * Rules (FIVB):
 *  Sets 1–2 : first to 21 points, win by ≥ 2
 *  Set 3    : first to 15 points, win by ≥ 2
 *  Match    : best of 3 sets (first to win 2 sets)
 */

/**
 * Returns the winner of a single set, or null if the set is incomplete/invalid.
 *
 * @param {number|string} home
 * @param {number|string} away
 * @param {boolean} isDeciding - true for the 3rd (tie-break) set
 * @returns {'home'|'away'|null}
 */
export function setWinner(home, away, isDeciding = false) {
  const h = Number(home)
  const a = Number(away)
  if (!Number.isFinite(h) || !Number.isFinite(a)) return null
  const target = isDeciding ? 15 : 21
  if (h >= target && h - a >= 2) return 'home'
  if (a >= target && a - h >= 2) return 'away'
  return null
}

/**
 * Returns set-win totals for an array of played sets.
 *
 * @param {Array<{home:number|string, away:number|string}>} sets
 * @returns {{ setsHome: number, setsAway: number }}
 */
export function countSetWins(sets) {
  let setsHome = 0
  let setsAway = 0
  sets.forEach((s, i) => {
    const w = setWinner(s.home, s.away, i === 2)
    if (w === 'home') setsHome++
    else if (w === 'away') setsAway++
  })
  return { setsHome, setsAway }
}

/**
 * Validates a complete beach volleyball match.
 * Returns whether the entered sets represent a finished, legal match.
 *
 * @param {Array<{home:number|string, away:number|string}>} sets
 *   Pass only the sets that have been filled in (filter out blanks before calling).
 * @returns {{ valid: boolean, error?: string, setsHome?: number, setsAway?: number }}
 */
export function validateBeachVolleyballMatch(sets) {
  if (!sets || sets.length < 2) {
    return { valid: false, error: 'Enter at least Set 1 and Set 2 scores.' }
  }

  const w1 = setWinner(sets[0].home, sets[0].away, false)
  if (!w1) {
    return { valid: false, error: 'Set 1 score is invalid — first to 21, win by 2.' }
  }

  const w2 = setWinner(sets[1].home, sets[1].away, false)
  if (!w2) {
    return { valid: false, error: 'Set 2 score is invalid — first to 21, win by 2.' }
  }

  if (w1 !== w2) {
    // 1-1: deciding set required
    if (sets.length < 3 || sets[2].home === '' || sets[2].away === '') {
      return { valid: false, error: 'Match is 1-1. Enter Set 3 score (first to 15, win by 2).' }
    }
    const w3 = setWinner(sets[2].home, sets[2].away, true)
    if (!w3) {
      return { valid: false, error: 'Set 3 score is invalid — first to 15, win by 2.' }
    }
  }

  const playedSets = w1 === w2 ? sets.slice(0, 2) : sets.slice(0, 3)
  const { setsHome, setsAway } = countSetWins(playedSets)
  return { valid: true, setsHome, setsAway }
}

/**
 * Builds the sport_data JSONB object to store in fixture_results.
 *
 * @param {Array<{home:number|string, away:number|string}>} sets - Only played sets
 * @returns {{ sets: Array<{h:number,a:number}>, sets_home: number, sets_away: number }}
 */
export function computeSportData(sets) {
  const { setsHome, setsAway } = countSetWins(sets)
  return {
    sets: sets.map(s => ({ h: Number(s.home), a: Number(s.away) })),
    sets_home: setsHome,
    sets_away: setsAway,
  }
}

/**
 * Formats a sport_data object as a display string.
 * e.g. "2:0 (21-19, 21-15)"
 *
 * @param {{ sets: Array<{h:number,a:number}>, sets_home:number, sets_away:number } | null} sportData
 * @returns {string}
 */
export function formatBeachScore(sportData) {
  if (!sportData?.sets?.length) return '—'
  const detail = sportData.sets.map(s => `${s.h}-${s.a}`).join(', ')
  return `${sportData.sets_home}:${sportData.sets_away} (${detail})`
}

/**
 * Returns an empty 3-slot sets array for a new beach volleyball fixture.
 * @returns {Array<{home:string, away:string}>}
 */
export function emptySetSlots() {
  return [
    { home: '', away: '' },
    { home: '', away: '' },
    { home: '', away: '' },
  ]
}

/**
 * Restores a sets UI state array from stored sport_data.
 * Pads to 3 slots.
 *
 * @param {{ sets: Array<{h:number,a:number}> } | null} sportData
 * @returns {Array<{home:string|number, away:string|number}>}
 */
export function setsFromSportData(sportData) {
  if (!sportData?.sets?.length) return emptySetSlots()
  const restored = sportData.sets.map(s => ({ home: s.h, away: s.a }))
  while (restored.length < 3) restored.push({ home: '', away: '' })
  return restored
}
