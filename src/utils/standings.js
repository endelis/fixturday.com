/**
 * League standings calculator.
 *
 * Processes completed fixtures and their results to produce a sorted standings
 * table using the standard football points system (W=3, D=1, L=0).
 *
 * Sorting order (descending priority):
 *   1. Points
 *   2. Goal difference (GF − GA)
 *   3. Goals for (GF)
 *   4. Head-to-head result between tied teams (points in direct encounters)
 *   5. Team name (alphabetical, ascending) — final deterministic tiebreaker
 */

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * calculateStandings
 *
 * @param {Array<{id: *, name: string}>} teams
 *   All teams in the league/group.
 *
 * @param {Array<{id: *, home_team_id: *, away_team_id: *, status: string}>} fixtures
 *   All fixtures. Only those with `status === 'completed'` are counted.
 *
 * @param {Array<{fixture_id: *, home_goals: number, away_goals: number}>} results
 *   One result per completed fixture, keyed by `fixture_id`.
 *
 * @returns {Array<{
 *   team:   {id: *, name: string},
 *   played: number,
 *   won:    number,
 *   drawn:  number,
 *   lost:   number,
 *   gf:     number,
 *   ga:     number,
 *   gd:     number,
 *   points: number
 * }>}
 *   Standings rows sorted by: points → GD → GF → head-to-head → name.
 *
 * Edge cases:
 *   - Empty teams array → returns []
 *   - No completed fixtures → all teams returned with zeroed stats
 *   - Missing result for a completed fixture → that fixture is skipped
 */
export function calculateStandings(teams, fixtures, results) {
  if (!teams || teams.length === 0) return [];

  // --- Build a quick lookup: fixture_id → result ----------------------------
  const resultMap = new Map();
  if (results) {
    for (const r of results) {
      resultMap.set(r.fixture_id, r);
    }
  }

  // --- Initialise a stats row for every team --------------------------------
  const statsMap = new Map();
  for (const team of teams) {
    statsMap.set(team.id, {
      team,
      played: 0,
      won:    0,
      drawn:  0,
      lost:   0,
      gf:     0,
      ga:     0,
      gd:     0,
      points: 0,
    });
  }

  // --- Process completed fixtures -------------------------------------------
  const completedFixtures = fixtures
    ? fixtures.filter((f) => f.status === 'completed')
    : [];

  for (const fixture of completedFixtures) {
    const result = resultMap.get(fixture.id);
    if (!result) continue; // no result recorded yet — skip

    const homeStats = statsMap.get(fixture.home_team_id);
    const awayStats = statsMap.get(fixture.away_team_id);

    // One or both teams may not be in the teams array (e.g. data inconsistency).
    if (!homeStats || !awayStats) continue;

    const hg = Number(result.home_goals) || 0;
    const ag = Number(result.away_goals) || 0;

    // Home team
    homeStats.played += 1;
    homeStats.gf     += hg;
    homeStats.ga     += ag;

    // Away team
    awayStats.played += 1;
    awayStats.gf     += ag;
    awayStats.ga     += hg;

    if (hg > ag) {
      // Home win
      homeStats.won    += 1;
      homeStats.points += 3;
      awayStats.lost   += 1;
    } else if (hg < ag) {
      // Away win
      awayStats.won    += 1;
      awayStats.points += 3;
      homeStats.lost   += 1;
    } else {
      // Draw
      homeStats.drawn  += 1;
      homeStats.points += 1;
      awayStats.drawn  += 1;
      awayStats.points += 1;
    }
  }

  // Compute GD for every team now that all fixtures are processed.
  for (const stats of statsMap.values()) {
    stats.gd = stats.gf - stats.ga;
  }

  // --- Sort -----------------------------------------------------------------
  const rows = Array.from(statsMap.values());

  rows.sort((a, b) => {
    // 1. Points
    if (b.points !== a.points) return b.points - a.points;

    // 2. Goal difference
    if (b.gd !== a.gd) return b.gd - a.gd;

    // 3. Goals for
    if (b.gf !== a.gf) return b.gf - a.gf;

    // 4. Head-to-head: compare points earned in direct encounters only.
    const h2hDiff = headToHeadPoints(a.team.id, b.team.id, completedFixtures, resultMap);
    if (h2hDiff !== 0) return h2hDiff; // positive = a is better

    // 5. Alphabetical name (ascending)
    return a.team.name.localeCompare(b.team.name);
  });

  return rows;
}

// ---------------------------------------------------------------------------
// Internal helper
// ---------------------------------------------------------------------------

/**
 * headToHeadPoints
 *
 * Calculates the difference in head-to-head points between teamA and teamB
 * across all completed fixtures where exactly these two teams faced each other.
 *
 * @param {*} teamAId
 * @param {*} teamBId
 * @param {Array} completedFixtures - Already-filtered completed fixtures.
 * @param {Map}   resultMap         - fixture_id → result.
 * @returns {number} Positive if teamA has more h2h points, negative if teamB
 *   does, 0 if equal or no encounters.
 */
function headToHeadPoints(teamAId, teamBId, completedFixtures, resultMap) {
  let pointsA = 0;
  let pointsB = 0;

  for (const fixture of completedFixtures) {
    const isH2H =
      (fixture.home_team_id === teamAId && fixture.away_team_id === teamBId) ||
      (fixture.home_team_id === teamBId && fixture.away_team_id === teamAId);

    if (!isH2H) continue;

    const result = resultMap.get(fixture.id);
    if (!result) continue;

    const hg = Number(result.home_goals) || 0;
    const ag = Number(result.away_goals) || 0;

    if (hg > ag) {
      // Home team won
      if (fixture.home_team_id === teamAId) pointsA += 3;
      else pointsB += 3;
    } else if (hg < ag) {
      // Away team won
      if (fixture.away_team_id === teamAId) pointsA += 3;
      else pointsB += 3;
    } else {
      // Draw
      pointsA += 1;
      pointsB += 1;
    }
  }

  // Return positive if A is ahead (sort puts A before B).
  return pointsB - pointsA;
}
