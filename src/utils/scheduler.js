// Pure utility — no imports, no Supabase, no React.

/** Parse "HH:MM" → minutes since midnight */
function parseTime(str) {
  const [h, m] = str.split(":").map(Number);
  return h * 60 + m;
}

/** minutes since midnight → "HH:MM" */
function formatTime(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Round up to the nearest 5-minute boundary */
function roundUp5(mins) {
  return Math.ceil(mins / 5) * 5;
}

/**
 * Format minutes-since-midnight as an ISO datetime string with local timezone offset.
 * e.g. date="2026-04-17", mins=540, tz=+03:00 → "2026-04-17T09:00:00+03:00"
 * Including the offset ensures Supabase stores the correct absolute time.
 */
function toISO(date, mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const pad = n => String(n).padStart(2, '0');
  const offset = -new Date().getTimezoneOffset();
  const sign = offset >= 0 ? '+' : '-';
  const oh = Math.floor(Math.abs(offset) / 60);
  const om = Math.abs(offset) % 60;
  return `${date}T${pad(h)}:${pad(m)}:00${sign}${pad(oh)}:${pad(om)}`;
}

/**
 * Advance a proposed kickoff time past the lunch window if needed.
 * A game must not *start* during [lunchStart, lunchEnd).
 * Returns the adjusted kickoff (already a multiple of 5).
 */
function skipLunch(kickoff, lunchStartMins, lunchEndMins) {
  if (lunchStartMins === null || lunchEndMins === null) return kickoff;
  if (kickoff >= lunchStartMins && kickoff < lunchEndMins) {
    return lunchEndMins; // lunchEnd is already on a 5-min boundary by convention
  }
  return kickoff;
}

/**
 * Generate a schedule for a set of football fixtures.
 *
 * @param {object} params
 * @param {{ id: string, homeTeamId: string, awayTeamId: string }[]} params.fixtures
 * @param {number}  params.pitchCount    - number of available fields
 * @param {number}  params.gameDuration  - minutes per game
 * @param {string}  params.firstGameTime - "09:00"
 * @param {string}  params.lastGameTime  - "18:00"
 * @param {string|null} params.lunchStart - "13:00" or null
 * @param {string|null} params.lunchEnd   - "14:00" or null
 * @param {string}  params.date          - "2026-04-17"
 * @param {number}  [params.pitchGap=5]  - turnaround gap on same pitch (minutes)
 * @param {number|null} [params.teamRest=null] - minimum rest between a team's games;
 *   defaults to gameDuration + pitchGap so back-to-back games are impossible
 *
 * @returns {{ schedule: { fixtureId: string, pitchIndex: number, kickoff: string }[], warnings: string[] }}
 */
export function generateSchedule({
  fixtures,
  pitchCount,
  gameDuration,
  firstGameTime,
  lastGameTime,
  lunchStart,
  lunchEnd,
  date,
  pitchGap = 5,
  teamRest = null,
}) {
  // --- Parse boundary times ---
  const firstMins = parseTime(firstGameTime);
  const lastMins = parseTime(lastGameTime);
  const lunchStartMins = lunchStart ? parseTime(lunchStart) : null;
  const lunchEndMins = lunchEnd ? parseTime(lunchEnd) : null;

  // Turnaround gap between consecutive games on the same pitch (minutes).
  const PITCH_GAP = pitchGap;
  // Hard physical minimum: a team's game must finish before they can play again.
  const MIN_REST = gameDuration + PITCH_GAP;
  // Preferred minimum rest. Defaults to MIN_REST so back-to-back is never allowed.
  const TEAM_REST = teamRest ?? MIN_REST;

  // Track earliest available start time for each pitch (minutes since midnight).
  // All pitches start at firstMins.
  const pitchAvailable = Array.from({ length: pitchCount }, () => firstMins);

  // Track each team's last game end time (kickoff + gameDuration).
  // key: teamId, value: minutes since midnight when their last game ends.
  const teamLastEnd = {};

  const schedule = [];
  const warnings = [];

  for (const fixture of fixtures) {
    const { id: fixtureId, homeTeamId, awayTeamId } = fixture;

    const homeLastEnd = teamLastEnd[homeTeamId] ?? null;
    const awayLastEnd = teamLastEnd[awayTeamId] ?? null;

    // Earliest kickoff satisfying team-rest constraints (before lunch/pitch checks).
    // A team can kick off at: lastEnd + TEAM_REST (rounded up to 5).
    const teamEarliestKickoff = Math.max(
      homeLastEnd !== null ? roundUp5(homeLastEnd + TEAM_REST) : firstMins,
      awayLastEnd !== null ? roundUp5(awayLastEnd + TEAM_REST) : firstMins,
      firstMins
    );

    // Try each pitch in round-robin order (by earliest availability) and pick
    // the one that yields the earliest valid kickoff for this fixture.
    let bestPitch = null;
    let bestKickoff = Infinity;

    for (let p = 0; p < pitchCount; p++) {
      // Earliest this pitch is free.
      const pitchFree = pitchAvailable[p];

      // Candidate kickoff: later of pitch availability and team rest requirement.
      let candidate = roundUp5(Math.max(pitchFree, teamEarliestKickoff));

      // Skip lunch window.
      candidate = skipLunch(candidate, lunchStartMins, lunchEndMins);

      // Ensure game fits before lastGameTime.
      if (candidate + gameDuration > lastMins) continue;

      if (candidate < bestKickoff) {
        bestKickoff = candidate;
        bestPitch = p;
      }
    }

    // --- Handle case where no pitch slot is valid before lastGameTime ---
    if (bestPitch === null) {
      // Try to find any slot ignoring team-rest (to minimise back-to-back games),
      // scheduling as early as possible even if team rest is violated.
      let fallbackPitch = null;
      let fallbackKickoff = Infinity;
      let minRest = null; // smallest rest achieved across both teams

      for (let p = 0; p < pitchCount; p++) {
        let candidate = roundUp5(Math.max(pitchAvailable[p], firstMins));
        candidate = skipLunch(candidate, lunchStartMins, lunchEndMins);

        if (candidate + gameDuration > lastMins) continue;

        // Calculate actual rest times for both teams at this slot.
        const homeRest =
          homeLastEnd !== null ? candidate - homeLastEnd : Infinity;
        const awayRest =
          awayLastEnd !== null ? candidate - awayLastEnd : Infinity;
        const worstRest = Math.min(homeRest, awayRest);

        // Prefer the slot with the most rest (closest to satisfying TEAM_REST),
        // and among equal rest prefer the earliest kickoff.
        if (
          fallbackPitch === null ||
          worstRest > minRest ||
          (worstRest === minRest && candidate < fallbackKickoff)
        ) {
          fallbackPitch = p;
          fallbackKickoff = candidate;
          minRest = worstRest;
        }
      }

      if (fallbackPitch === null) {
        // Truly impossible to schedule this fixture.
        warnings.push(
          `Spēle (fixture ${fixtureId}) nevar tikt ieplānota — nav brīvu laika nišu pirms ${lastGameTime}`
        );
        continue;
      }

      // Schedule with insufficient rest; warn whenever rest < MIN_REST.
      const kickoff = fallbackKickoff;

      if (homeLastEnd !== null) {
        const actualRest = kickoff - homeLastEnd;
        if (actualRest < MIN_REST) {
          warnings.push(
            `Komanda '${homeTeamId}' atpūšas tikai ${actualRest} min starp spēlēm (min. ${MIN_REST} min)`
          );
        }
      }
      if (awayLastEnd !== null) {
        const actualRest = kickoff - awayLastEnd;
        if (actualRest < MIN_REST) {
          warnings.push(
            `Komanda '${awayTeamId}' atpūšas tikai ${actualRest} min starp spēlēm (min. ${MIN_REST} min)`
          );
        }
      }

      schedule.push({
        fixtureId,
        pitchIndex: fallbackPitch,
        kickoff: toISO(date, kickoff),
      });

      // Update state.
      const endTime = kickoff + gameDuration;
      pitchAvailable[fallbackPitch] = roundUp5(endTime + PITCH_GAP);
      teamLastEnd[homeTeamId] = endTime;
      teamLastEnd[awayTeamId] = endTime;

      continue;
    }

    // --- Happy path: valid slot found ---
    schedule.push({
      fixtureId,
      pitchIndex: bestPitch,
      kickoff: toISO(date, bestKickoff),
    });

    // Update state.
    const endTime = bestKickoff + gameDuration;
    pitchAvailable[bestPitch] = roundUp5(endTime + PITCH_GAP);
    teamLastEnd[homeTeamId] = endTime;
    teamLastEnd[awayTeamId] = endTime;
  }

  return { schedule, warnings };
}
