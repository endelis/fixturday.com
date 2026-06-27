/**
 * Catch'n Serve Ball scoring utilities.
 * All functions are pure — no side effects, no Supabase calls.
 *
 * Default scoring (LTSA / Latvian tournaments):
 *   Sets 1–2 : first to 15 points, win by ≥ 2
 *   Set 3    : first to 11 points, win by ≥ 2
 *
 * Extended scoring (international / ICSBF):
 *   Sets 1–2 : first to 25 points, win by ≥ 2
 *   Set 3    : first to 15 points, win by ≥ 2
 *
 * Controlled by cs_set_target on the age_groups row (15 or 25).
 *
 * Match points:
 *   2:0 win → 3 pts winner, 0 pts loser
 *   2:1 win → 2 pts winner, 1 pt  loser
 */

// ── Set winner ──────────────────────────────────────────────────────────────

/**
 * Returns the winner of a single set, or null if the set is incomplete/invalid.
 * @param {number|string} home
 * @param {number|string} away
 * @param {boolean} isDeciding
 * @param {number} normalTarget  - target for sets 1 & 2 (15 or 25)
 * @param {number} decidingTarget - target for set 3   (11 or 15)
 * @returns {'home'|'away'|null}
 */
export function setWinner(home, away, isDeciding, normalTarget, decidingTarget) {
  const h = Number(home)
  const a = Number(away)
  if (!Number.isFinite(h) || !Number.isFinite(a)) return null
  const target = isDeciding ? decidingTarget : normalTarget
  if (h >= target && h - a >= 2) return 'home'
  if (a >= target && a - h >= 2) return 'away'
  return null
}

/**
 * Returns { normalTarget, decidingTarget } from a cs_set_target DB value.
 * @param {number} csSetTarget - value stored in age_groups.cs_set_target (15 or 25)
 */
export function getTargets(csSetTarget = 15) {
  return csSetTarget === 25
    ? { normalTarget: 25, decidingTarget: 15 }
    : { normalTarget: 15, decidingTarget: 11 }
}

// ── Validation ───────────────────────────────────────────────────────────────

/**
 * Validates a complete Catch'n Serve match.
 * @param {Array<{home:number|string, away:number|string}>} sets - filled sets only
 * @param {number} csSetTarget - 15 (default) or 25
 * @returns {{ valid: boolean, error?: string, setsHome?: number, setsAway?: number }}
 */
export function validateCatchServeMatch(sets, csSetTarget = 15) {
  const { normalTarget, decidingTarget } = getTargets(csSetTarget)

  if (!sets || sets.length < 2) {
    return { valid: false, error: 'Enter at least Set 1 and Set 2 scores.' }
  }

  const w1 = setWinner(sets[0].home, sets[0].away, false, normalTarget, decidingTarget)
  if (!w1) {
    return { valid: false, error: `Set 1 score is invalid — first to ${normalTarget}, win by 2.` }
  }

  const w2 = setWinner(sets[1].home, sets[1].away, false, normalTarget, decidingTarget)
  if (!w2) {
    return { valid: false, error: `Set 2 score is invalid — first to ${normalTarget}, win by 2.` }
  }

  if (w1 !== w2) {
    if (sets.length < 3 || sets[2].home === '' || sets[2].away === '') {
      return { valid: false, error: `Match is 1-1. Enter Set 3 score (first to ${decidingTarget}, win by 2).` }
    }
    const w3 = setWinner(sets[2].home, sets[2].away, true, normalTarget, decidingTarget)
    if (!w3) {
      return { valid: false, error: `Set 3 score is invalid — first to ${decidingTarget}, win by 2.` }
    }
  }

  const playedSets = w1 === w2 ? sets.slice(0, 2) : sets.slice(0, 3)
  const setsHome = playedSets.filter((s, i) =>
    setWinner(s.home, s.away, i === 2, normalTarget, decidingTarget) === 'home'
  ).length
  const setsAway = playedSets.filter((s, i) =>
    setWinner(s.home, s.away, i === 2, normalTarget, decidingTarget) === 'away'
  ).length
  return { valid: true, setsHome, setsAway }
}

// ── Standings ────────────────────────────────────────────────────────────────

/**
 * Catch'n Serve Ball standings calculator.
 *
 * Match points: 2:0 win → 3 pts / 0 pts; 2:1 win → 2 pts / 1 pt.
 * Sort: points → set ratio → point ratio → head-to-head → name.
 *
 * Uses the same row shape as the BV standings so the same display
 * components (W, L, SW, SL, SR, PW, PA, PR columns) work unchanged.
 *
 * @param {Array<{id:*, name:string}>} teams
 * @param {Array<{id:*, home_team_id:*, away_team_id:*, status:string}>} fixtures
 * @param {Array<{fixture_id:*, home_goals:number, away_goals:number, sport_data:*}>} results
 * @returns {Array<object>} Sorted standings rows
 */
export function calculateCatchServeStandings(teams, fixtures, results) {
  if (!teams || teams.length === 0) return []

  const resultMap = new Map()
  if (results) {
    for (const r of results) resultMap.set(r.fixture_id, r)
  }

  const statsMap = new Map()
  for (const team of teams) {
    statsMap.set(team.id, {
      team,
      played: 0,
      won: 0,
      lost: 0,
      points: 0,
      sets_won: 0,
      sets_lost: 0,
      sets_against: 0,
      points_won: 0,
      points_against: 0,
      set_ratio: 0,
      point_ratio: 0,
    })
  }

  const completedFixtures = fixtures ? fixtures.filter(f => f.status === 'completed') : []

  for (const fixture of completedFixtures) {
    const result = resultMap.get(fixture.id)
    if (!result) continue

    const homeStats = statsMap.get(fixture.home_team_id)
    const awayStats = statsMap.get(fixture.away_team_id)
    if (!homeStats || !awayStats) continue

    const setsHome = Number(result.home_goals) || 0
    const setsAway = Number(result.away_goals) || 0

    let ptsHome = 0, ptsAway = 0
    if (result.sport_data?.sets) {
      for (const s of result.sport_data.sets) {
        ptsHome += Number(s.h) || 0
        ptsAway += Number(s.a) || 0
      }
    }

    homeStats.played += 1
    homeStats.sets_won += setsHome
    homeStats.sets_lost += setsAway
    homeStats.sets_against += setsAway
    homeStats.points_won += ptsHome
    homeStats.points_against += ptsAway

    awayStats.played += 1
    awayStats.sets_won += setsAway
    awayStats.sets_lost += setsHome
    awayStats.sets_against += setsHome
    awayStats.points_won += ptsAway
    awayStats.points_against += ptsHome

    if (setsHome > setsAway) {
      homeStats.won += 1
      awayStats.lost += 1
      // 2:0 → 3pts; 2:1 → 2pts + 1pt
      if (setsAway === 0) {
        homeStats.points += 3
      } else {
        homeStats.points += 2
        awayStats.points += 1
      }
    } else if (setsAway > setsHome) {
      awayStats.won += 1
      homeStats.lost += 1
      if (setsHome === 0) {
        awayStats.points += 3
      } else {
        awayStats.points += 2
        homeStats.points += 1
      }
    }
  }

  for (const stats of statsMap.values()) {
    stats.set_ratio = stats.sets_lost > 0
      ? stats.sets_won / stats.sets_lost
      : stats.sets_won > 0 ? 99 : 0
    stats.point_ratio = stats.points_against > 0
      ? stats.points_won / stats.points_against
      : stats.points_won > 0 ? 99 : 0
  }

  const rows = Array.from(statsMap.values())

  rows.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    const srDiff = b.set_ratio - a.set_ratio
    if (Math.abs(srDiff) > 0.0001) return srDiff
    const prDiff = b.point_ratio - a.point_ratio
    if (Math.abs(prDiff) > 0.0001) return prDiff
    const h2h = csHeadToHead(a.team.id, b.team.id, completedFixtures, resultMap)
    if (h2h !== 0) return h2h
    return a.team.name.localeCompare(b.team.name)
  })

  return rows
}

function csHeadToHead(teamAId, teamBId, completedFixtures, resultMap) {
  for (const fixture of completedFixtures) {
    const isH2H =
      (fixture.home_team_id === teamAId && fixture.away_team_id === teamBId) ||
      (fixture.home_team_id === teamBId && fixture.away_team_id === teamAId)
    if (!isH2H) continue
    const result = resultMap.get(fixture.id)
    if (!result) continue
    const hg = Number(result.home_goals) || 0
    const ag = Number(result.away_goals) || 0
    if (hg > ag) return fixture.home_team_id === teamAId ? -1 : 1
    if (ag > hg) return fixture.away_team_id === teamAId ? -1 : 1
  }
  return 0
}
