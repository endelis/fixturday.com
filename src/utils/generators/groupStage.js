import { generateRoundRobin } from './roundRobin'

/**
 * generateGroupStage(teams, groupCount)
 *
 * Splits teams into groups and generates round-robin fixtures within each group.
 * Returns group phase fixtures + metadata needed to set up knockout later.
 *
 * @param {Array<{id:*, name:string}>} teams - confirmed teams
 * @param {number} groupCount - number of groups (default: auto based on team count)
 * @returns {{
 *   groups: Array<{ name: string, teams: Array, fixtures: Array }>,
 *   allFixtures: Array<{ home, away, round, group: string }>
 * }}
 *
 * Edge cases:
 *  - < 4 teams → falls back to single round-robin group
 *  - Uneven split → extra teams go to earlier groups (groups[0] gets the remainder)
 */
export function generateGroupStage(teams, groupCount) {
  if (!teams || teams.length < 2) return { groups: [], allFixtures: [] }

  // Auto group count: aim for 4 teams per group
  const count = groupCount ?? Math.max(2, Math.round(teams.length / 4))
  const actualCount = Math.min(count, Math.floor(teams.length / 2))

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

  return {
    groups,
    allFixtures: groups.flatMap(g => g.fixtures),
  }
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
