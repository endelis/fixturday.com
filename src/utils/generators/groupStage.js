import { generateRoundRobin } from './roundRobin'
import { nextPowerOf2, getRoundName } from './knockout'

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
export function generateGroupStage(teams, groupsCount = 2, teamsAdvancing = 2) {
  if (!teams || teams.length < 2) return { groups: [], allFixtures: [], groupFixtures: [], knockoutFixtures: [] }

  // Clamp group count to a sensible value
  const actualCount = Math.min(groupsCount, Math.floor(teams.length / 2))

  // Split teams into groups
  const shuffled = [...teams] // preserve original order (caller can shuffle if needed)
  const groups = []
  const baseSize = Math.floor(shuffled.length / actualCount)
  const remainder = shuffled.length % actualCount

  let idx = 0
  for (let g = 0; g < actualCount; g++) {
    const size = baseSize + (g < remainder ? 1 : 0)
    const groupTeams = shuffled.slice(idx, idx + size)
    idx += size

    const name = String.fromCharCode(65 + g) // A, B, C, ...
    const rounds = generateRoundRobin(groupTeams)
    const fixtures = rounds.flat().map(f => ({ ...f, group: name }))

    groups.push({ name, teams: groupTeams, fixtures })
  }

  const allFixtures = groups.flatMap(g => g.fixtures)

  // Build normalized groupFixtures array
  const groupFixtures = allFixtures
    .filter(f => f.home?.id && f.away?.id)
    .map(f => ({
      homeTeamId: f.home.id,
      awayTeamId: f.away.id,
      round: f.round,
      group: f.group ?? null,
      home_placeholder: null,
      away_placeholder: null,
    }))

  // Generate placeholder knockout fixtures
  // Total playoff slots = groupsCount * teamsAdvancing, padded to next power of 2
  const totalPlayoffTeams = actualCount * teamsAdvancing
  const knockoutFixtures = generateKnockoutPlaceholders(actualCount, teamsAdvancing, totalPlayoffTeams)

  return {
    groups,
    allFixtures,
    groupFixtures,
    knockoutFixtures,
  }
}

/**
 * Builds placeholder knockout fixtures.
 * Slot order: 1st from gr A, 1st from gr B, ..., 2nd from gr A, 2nd from gr B, ...
 * Then paired using standard seeding: slot[i] vs slot[total-1-i].
 */
function generateKnockoutPlaceholders(groupsCount, teamsAdvancing, totalPlayoffTeams) {
  if (totalPlayoffTeams < 2) return []

  // Build an ordered list of placeholder labels
  // e.g. for 2 groups, 2 advancing: [A1, B1, A2, B2]
  const placeholders = []
  for (let pos = 1; pos <= teamsAdvancing; pos++) {
    for (let g = 0; g < groupsCount; g++) {
      const groupLetter = String.fromCharCode(65 + g) // A, B, C ...
      placeholders.push(`${groupLetter} ${pos}.`)
    }
  }

  const totalSlots = nextPowerOf2(totalPlayoffTeams)
  // Pad with nulls for BYE slots
  while (placeholders.length < totalSlots) placeholders.push(null)

  const fixtures = []
  const half = totalSlots / 2
  let round = 1

  for (let i = 0; i < half; i++) {
    const homePlaceholder = placeholders[i]
    const awayPlaceholder = placeholders[totalSlots - 1 - i]

    fixtures.push({
      homeTeamId: null,
      awayTeamId: null,
      round,
      group: null,
      home_placeholder: homePlaceholder,
      away_placeholder: awayPlaceholder,
    })
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
