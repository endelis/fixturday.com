import { generateRoundRobin } from './roundRobin'
import { nextPowerOf2, getRoundName } from './knockout'
import { generateMultiTierKnockout } from './multiTierKnockout'

/**
 * generateGroupStage(teams, groupsCount, teamsAdvancing)
 *
 * Splits teams into groups and generates round-robin fixtures within each group.
 * Also generates placeholder knockout fixtures based on how many teams advance
 * from each group.
 *
 * @param {Array<{id:*, name:string}>} teams - confirmed teams
 * @param {number} groupsCount - number of groups (default 2)
 * @param {number} teamsAdvancing - teams advancing per group (default 2)
 * @param {Array<{ label: string, positions: number[] }>|null} tiersConfig
 *   Optional. When provided, knockout placeholders are split into parallel
 *   brackets (tiers) via generateMultiTierKnockout. When null/undefined,
 *   a single combined bracket is generated (legacy behaviour).
 * @returns {{
 *   groups: Array<{ name: string, teams: Array, fixtures: Array }>,
 *   allFixtures: Array<{ home, away, round, group: string }>,
 *   groupFixtures: Array<{ homeTeamId, awayTeamId, round, group, home_placeholder, away_placeholder }>,
 *   knockoutFixtures: Array<{ homeTeamId, awayTeamId, round, group, home_placeholder, away_placeholder }>
 * }}
 *
 * Edge cases:
 *  - < 4 teams → falls back to single round-robin group
 *  - Uneven split → extra teams go to earlier groups (groups[0] gets the remainder)
 */
export function generateGroupStage(teams, groupsCount = 2, teamsAdvancing = 2, tiersConfig = null) {
  if (!teams || teams.length < 2) return { groups: [], allFixtures: [], groupFixtures: [], knockoutFixtures: [] }

  // Clamp group count to a sensible value
  const actualCount = Math.min(groupsCount, Math.floor(teams.length / 2))

  // Snake seeding: team[0]→A, team[1]→B, ..., team[n-1]→last, team[n]→last, team[n+1]→prev...
  // e.g. 8 teams, 4 groups: 1→A, 2→B, 3→C, 4→D, 5→D, 6→C, 7→B, 8→A
  const groups = Array.from({ length: actualCount }, (_, g) => ({
    name: String.fromCharCode(65 + g),
    teams: [],
    fixtures: [],
  }))

  teams.forEach((team, i) => {
    const pass = Math.floor(i / actualCount)
    const offset = i % actualCount
    const groupIndex = pass % 2 === 0 ? offset : actualCount - 1 - offset
    groups[groupIndex].teams.push(team)
  })

  for (const g of groups) {
    const rounds = generateRoundRobin(g.teams)
    g.fixtures = rounds.flat().map(f => ({ ...f, group: g.name }))
  }

  const allFixtures = groups.flatMap(g => g.fixtures)

  // Build normalized groupFixtures array, sorted by round so fixtures from all
  // groups interleave (all Round-1 games first, then Round-2, etc.) enabling
  // the scheduler to distribute groups across pitches simultaneously.
  const groupFixtures = allFixtures
    .filter(f => f.home?.id && f.away?.id)
    .sort((a, b) => a.round - b.round)
    .map(f => ({
      homeTeamId: f.home.id,
      awayTeamId: f.away.id,
      round: f.round,
      group: f.group ?? null,
      home_placeholder: null,
      away_placeholder: null,
    }))

  // Highest round number used by group-stage fixtures — used to offset playoff rounds
  // so they never share a round integer with group fixtures.
  const totalGroupRounds = allFixtures.reduce((max, f) => Math.max(max, f.round ?? 0), 0)

  // Generate placeholder knockout fixtures
  const totalPlayoffTeams = actualCount * teamsAdvancing
  const rawKnockoutFixtures = tiersConfig
    ? generateMultiTierKnockout({
        groups: groups.map(g => ({ groupLabel: g.name, teams: g.teams })),
        tiersConfig,
      })
    : generateKnockoutPlaceholders(actualCount, teamsAdvancing, totalPlayoffTeams)

  // Shift every playoff fixture's round number past the last group round.
  const knockoutFixtures = rawKnockoutFixtures.map(f => ({
    ...f,
    round: f.round + totalGroupRounds,
  }))

  return {
    groups,
    allFixtures,
    groupFixtures,
    knockoutFixtures,
  }
}

/**
 * Builds placeholder knockout fixtures for ALL rounds up to and including the Final,
 * plus a 3rd place match whenever semi-finals exist (totalSlots ≥ 4).
 *
 * Round 1 slots come from group positions ("Group A-1", "Group B-2" …).
 * Each subsequent round's slots reference the previous round's winners
 * using the pattern "{RoundName}{n} uzvarētājs", e.g. "SF1 uzvarētājs".
 * The 3rd place fixture uses "SF1/SF2 zaudētājs" and shares the same round
 * number as the Final so the scheduler assigns it to a free pitch at Final
 * time (parallel if pitches allow, before the Final if only one pitch).
 */
function generateKnockoutPlaceholders(groupsCount, teamsAdvancing, totalPlayoffTeams) {
  if (totalPlayoffTeams < 2) return []

  // Build round-1 placeholder codes: ordered by position then group so that
  // standard seeding pairs 1st-place teams against lowest seeds.
  // Format: "Group A-1" (group letter + position number).
  const placeholders = []
  for (let pos = 1; pos <= teamsAdvancing; pos++) {
    for (let g = 0; g < groupsCount; g++) {
      placeholders.push(`Group ${String.fromCharCode(65 + g)}-${pos}`)
    }
  }

  const totalSlots = nextPowerOf2(totalPlayoffTeams)
  while (placeholders.length < totalSlots) placeholders.push(null)

  const numRounds = Math.log2(totalSlots)
  const fixtures = []

  // Round 1: pair by group-position codes using standard seeding
  const half = totalSlots / 2
  for (let i = 0; i < half; i++) {
    fixtures.push({
      homeTeamId: null,
      awayTeamId: null,
      round: 1,
      group: null,
      home_placeholder: placeholders[i],
      away_placeholder: placeholders[totalSlots - 1 - i],
    })
  }

  // Rounds 2 … numRounds: pair winners of the previous round sequentially
  for (let r = 2; r <= numRounds; r++) {
    const prevRoundName = getRoundName(totalSlots, r - 1)
    const matchCount = totalSlots / Math.pow(2, r)

    // 3rd place match: pushed before the Final so that with a single pitch it
    // runs before the Final, and with multiple pitches it runs in parallel.
    // Only added in the Final round of brackets that have semi-finals (matchCount === 1
    // is always true when r === numRounds, so this guards on numRounds ≥ 2).
    if (r === numRounds && numRounds >= 2) {
      fixtures.push({
        homeTeamId: null,
        awayTeamId: null,
        round: r,
        group: null,
        home_placeholder: 'SF1 Loser',
        away_placeholder: 'SF2 Loser',
        round_name: '3rd_place',
        bracket_label: null,
      })
    }

    for (let i = 0; i < matchCount; i++) {
      fixtures.push({
        homeTeamId: null,
        awayTeamId: null,
        round: r,
        group: null,
        home_placeholder: `${prevRoundName}${2 * i + 1} Winner`,
        away_placeholder: `${prevRoundName}${2 * i + 2} Winner`,
      })
    }
  }

  return fixtures
}

/**
 * getGroupStandings(group, completedResults)
 *
 * Calculates standings for a single group using completed fixture results.
 * Returns rows sorted: points → GD → GF → name.
 *
 * @param {{ teams: Array, fixtures: Array }} group
 * @param {Array<{ fixture_id: string, home_goals: number, away_goals: number }>} results
 * @param {Array<{ id: string, status: string }>} fixtureStatuses - to filter completed only
 */
export function getGroupStandings(group, results, fixtureStatuses) {
  const resultMap = Object.fromEntries(results.map(r => [r.fixture_id, r]))
  const statusMap = Object.fromEntries((fixtureStatuses ?? []).map(f => [f.id, f.status]))

  const stats = Object.fromEntries(
    group.teams
      .filter(t => t.id)
      .map(t => [t.id, { team: t, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 }])
  )

  for (const f of group.fixtures) {
    if (!f.home?.id || !f.away?.id) continue
    if (statusMap[f.id] !== 'completed') continue
    const result = resultMap[f.id]
    if (!result) continue

    const hg = Number(result.home_goals) || 0
    const ag = Number(result.away_goals) || 0
    const h = stats[f.home.id]
    const a = stats[f.away.id]
    if (!h || !a) continue

    h.played++; a.played++
    h.gf += hg; h.ga += ag
    a.gf += ag; a.ga += hg

    if (hg > ag) { h.won++; h.points += 3; a.lost++ }
    else if (hg < ag) { a.won++; a.points += 3; h.lost++ }
    else { h.drawn++; h.points++; a.drawn++; a.points++ }
  }

  return Object.values(stats)
    .map(r => ({ ...r, gd: r.gf - r.ga }))
    .sort((a, b) =>
      b.points - a.points ||
      b.gd - a.gd ||
      b.gf - a.gf ||
      a.team.name.localeCompare(b.team.name)
    )
}
