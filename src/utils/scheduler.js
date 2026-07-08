// Pure utility — no imports, no Supabase, no React.

/** Parse "HH:MM" → minutes since midnight */
function parseTime(str) {
  const [h, m] = str.split(':').map(Number);
  return h * 60 + m;
}

/** minutes since midnight → "HH:MM" */
function formatTime(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Format minutes-since-midnight as an ISO datetime string with local timezone offset.
 * e.g. date="2026-04-17", mins=540, tz=+03:00 → "2026-04-17T09:00:00+03:00"
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

/** Advance kickoff past the lunch window if needed. */
function skipLunch(kickoff, lunchStartMins, lunchEndMins) {
  if (lunchStartMins === null || lunchEndMins === null) return kickoff;
  if (kickoff >= lunchStartMins && kickoff < lunchEndMins) return lunchEndMins;
  return kickoff;
}

/**
 * Numeric sort key for a playoff fixture derived from its placeholder content.
 *
 * Round-1 playoffs reference group positions ("Group A-1" or legacy "G1P1") → key 0.
 * Later rounds reference previous-round winners ("SF1 uzvarētājs") → the round
 * name embedded in the placeholder maps to an increasing key so the Final
 * (which references SF winners) sorts after the Semis.
 *
 * Order: Group*-* (0) < R64 (1) < R32 (2) < R16 (3) < QF (4) < SF (5) < F (6)
 */
const PLAYOFF_NAME_ORDER = { F: 6, SF: 5, QF: 4, R16: 3, R32: 2, R64: 1 };
function playoffSortKey(f) {
  const ph = (f.home_placeholder ?? f.home_placeholder_label)
          ?? (f.away_placeholder ?? f.away_placeholder_label)
          ?? '';
  if (!ph || /^G\d+P\d+$/.test(ph) || /^Group [A-Z]-\d+$/.test(ph)) return 0;
  const match = ph.match(/^(F|SF|QF|R\d+)/);
  if (!match) return 0;
  const name = match[1];
  if (PLAYOFF_NAME_ORDER[name] !== undefined) return PLAYOFF_NAME_ORDER[name];
  // Generic R{n}: larger bracket = earlier round = smaller key
  const n = parseInt(name.slice(1));
  return isNaN(n) ? 0 : Math.max(1, 7 - Math.log2(n));
}

/**
 * Generate a schedule for a set of football fixtures.
 *
 * Group fixtures are scheduled first across all pitches from firstGameTime,
 * interleaved by round (relies on fixtures being pre-sorted by round from the DB).
 *
 * Playoff fixtures are scheduled after all group fixtures, one round-tier at a
 * time. Before each tier all pitches are synchronised to the same start time so
 * no idle pitch can jump ahead and host a later round while an earlier one is
 * still running. Playoff games are allowed past lastGameTime (a warning is
 * emitted) so the bracket is never silently truncated.
 *
 * @param {object} params
 * @param {{ id: string, homeTeamId: string|null, awayTeamId: string|null,
 *           home_placeholder?: string|null, home_placeholder_label?: string|null,
 *           away_placeholder?: string|null, away_placeholder_label?: string|null,
 *           round?: number }[]} params.fixtures
 *   Playoff fixtures are detected automatically by placeholder presence.
 * @param {number}  params.pitchCount    - number of available fields
 * @param {number}  params.gameDuration  - minutes per game
 * @param {string}  params.firstGameTime - "09:00"
 * @param {string}  params.lastGameTime  - "18:00"
 * @param {string|null} params.lunchStart
 * @param {string|null} params.lunchEnd
 * @param {string}  params.date          - "2026-04-17"
 * @param {number}  [params.pitchGap=5]
 * @param {number|null} [params.teamRest=null]
 * @param {string[]|null} [params.pitchIds=null]
 *
 * @returns {{ schedule: object[], warnings: string[] }}
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
  pitchIds = null,
  blockedSlots = [],
}) {
  const firstMins = parseTime(firstGameTime);
  const lastMins  = parseTime(lastGameTime);
  const lunchStartMins = lunchStart ? parseTime(lunchStart) : null;
  const lunchEndMins   = lunchEnd   ? parseTime(lunchEnd)   : null;

  const PITCH_GAP = pitchGap;
  const MIN_REST  = gameDuration + PITCH_GAP;
  const TEAM_REST = teamRest ?? MIN_REST;

  const resolvedPitchCount = pitchIds ? pitchIds.length : pitchCount;
  const pitchAvailable = Array.from({ length: resolvedPitchCount }, () => firstMins);
  const teamLastEnd = {};
  const schedule = [];

  // Build per-pitch blocked intervals from other age groups' existing fixtures.
  // Only meaningful when pitchIds is provided (named-pitch mode).
  const blockedByPitch = {};
  if (pitchIds) {
    for (const slot of blockedSlots) {
      const idx = pitchIds.indexOf(slot.pitchId);
      if (idx >= 0) {
        (blockedByPitch[idx] = blockedByPitch[idx] ?? []).push(slot);
      }
    }
  }
  const warnings = [];

  // --- Split and order fixtures ---
  // Playoff detection: any fixture with a placeholder set is a playoff fixture.
  // This avoids relying on an `isPlayoff` flag that callers may omit.
  const hasPlaceholder = f =>
    !!(f.home_placeholder || f.away_placeholder ||
       f.home_placeholder_label || f.away_placeholder_label);

  // Group fixtures are sorted by round so fixtures from all groups interleave
  // (e.g. all Round-1 games across groups first, then Round-2, etc.) which
  // distributes groups across pitches simultaneously rather than serially.
  const groupFixtures = fixtures
    .filter(f => !hasPlaceholder(f))
    .sort((a, b) => (a.round ?? 0) - (b.round ?? 0));

  // Playoff fixtures are sorted by round-tier using placeholder content as proxy,
  // ensuring correct bracket order regardless of any upstream shuffle.
  const playoffFixtures = fixtures
    .filter(f => hasPlaceholder(f))
    .sort((a, b) => playoffSortKey(a) - playoffSortKey(b));

  // Collect playoff tiers keyed by sort-key value.
  const playoffTiers = {};
  for (const f of playoffFixtures) {
    const key = playoffSortKey(f);
    (playoffTiers[key] = playoffTiers[key] ?? []).push(f);
  }
  const tierKeys = Object.keys(playoffTiers).map(Number).sort((a, b) => a - b);

  // --- Helpers ---

  function applyLunch(candidate) {
    candidate = skipLunch(candidate, lunchStartMins, lunchEndMins);
    if (lunchStartMins !== null && candidate < lunchStartMins && candidate + gameDuration > lunchStartMins) {
      candidate = lunchEndMins;
    }
    return candidate;
  }

  /** Advance t forward until it no longer overlaps any blocked interval on this pitch. */
  function advancePastBlocked(pitchIdx, t) {
    const blocked = blockedByPitch[pitchIdx];
    if (!blocked || blocked.length === 0) return t;
    let current = t;
    for (let guard = 0; guard < 100; guard++) {
      let advanced = false;
      for (const b of blocked) {
        if (current < b.endMins && current + gameDuration > b.startMins) {
          current = applyLunch(b.endMins + PITCH_GAP);
          advanced = true;
          break;
        }
      }
      if (!advanced) break;
    }
    return current;
  }

  /** Find the best pitch slot. strict=true rejects slots that end past lastMins. */
  function findSlot(homeTeamId, awayTeamId, strict) {
    const homeLastEnd = homeTeamId != null ? (teamLastEnd[homeTeamId] ?? null) : null;
    const awayLastEnd = awayTeamId != null ? (teamLastEnd[awayTeamId] ?? null) : null;

    const teamEarliest = Math.max(
      homeLastEnd !== null ? homeLastEnd + TEAM_REST : firstMins,
      awayLastEnd !== null ? awayLastEnd + TEAM_REST : firstMins,
      firstMins
    );

    let bestPitch = null;
    let bestKickoff = Infinity;

    for (let p = 0; p < resolvedPitchCount; p++) {
      let candidate = advancePastBlocked(p, applyLunch(Math.max(pitchAvailable[p], teamEarliest)));
      if (strict && candidate + gameDuration > lastMins) continue;
      if (candidate < bestKickoff) { bestKickoff = candidate; bestPitch = p; }
    }

    return bestPitch !== null ? { pitch: bestPitch, kickoff: bestKickoff } : null;
  }

  /** Commit a slot to the schedule and update tracking state. */
  function commitSlot(fixtureId, homeTeamId, awayTeamId, pitch, kickoff) {
    schedule.push({
      fixtureId,
      pitchIndex: pitch,
      pitchId: pitchIds ? pitchIds[pitch] : null,
      kickoff: toISO(date, kickoff),
    });
    const endTime = kickoff + gameDuration;
    pitchAvailable[pitch] = endTime + PITCH_GAP;
    if (homeTeamId != null) teamLastEnd[homeTeamId] = endTime;
    if (awayTeamId != null) teamLastEnd[awayTeamId] = endTime;
    return endTime;
  }

  // --- PASS 1: Schedule group fixtures (best-fit greedy) ---
  // At each step pick whichever pending fixture can start earliest, so a team
  // that played late in round N doesn't block pitches idle while other fixtures
  // that involve fully-rested teams could run right now.
  let lastGroupEnd = firstMins;
  const pending = [...groupFixtures];

  while (pending.length > 0) {
    // Scan all pending fixtures; pick the one with the earliest available kickoff.
    let bestIdx = -1, bestSlot = null;
    for (let i = 0; i < pending.length; i++) {
      const f = pending[i];
      const slot = findSlot(f.homeTeamId, f.awayTeamId, true);
      if (slot && (bestSlot === null || slot.kickoff < bestSlot.kickoff)) {
        bestSlot = slot;
        bestIdx = i;
      }
    }

    if (bestIdx !== -1) {
      const f = pending.splice(bestIdx, 1)[0];
      const endTime = commitSlot(f.id, f.homeTeamId, f.awayTeamId, bestSlot.pitch, bestSlot.kickoff);
      lastGroupEnd = Math.max(lastGroupEnd, endTime);
      continue;
    }

    // Fallback: no pending fixture fits before lastGameTime — use best-rest for the first one.
    const f = pending.shift();
    const { id: fixtureId, homeTeamId, awayTeamId } = f;
    const homeLastEnd = homeTeamId != null ? (teamLastEnd[homeTeamId] ?? null) : null;
    const awayLastEnd = awayTeamId != null ? (teamLastEnd[awayTeamId] ?? null) : null;
    let fallbackPitch = null, fallbackKickoff = Infinity, bestRest = null;

    for (let p = 0; p < resolvedPitchCount; p++) {
      let candidate = advancePastBlocked(p, applyLunch(Math.max(pitchAvailable[p], firstMins)));
      if (candidate + gameDuration > lastMins) continue;
      const worstRest = Math.min(
        homeLastEnd !== null ? candidate - homeLastEnd : Infinity,
        awayLastEnd !== null ? candidate - awayLastEnd : Infinity
      );
      if (fallbackPitch === null || worstRest > bestRest || (worstRest === bestRest && candidate < fallbackKickoff)) {
        fallbackPitch = p; fallbackKickoff = candidate; bestRest = worstRest;
      }
    }

    if (fallbackPitch === null) {
      warnings.push(`${fixtureId} cannot be scheduled — no free slots before ${lastGameTime}`);
      continue;
    }

    if (homeLastEnd !== null && fallbackKickoff - homeLastEnd < MIN_REST)
      warnings.push(`${homeTeamId} has only ${fallbackKickoff - homeLastEnd} min rest between games (min. ${MIN_REST} min)`);
    if (awayLastEnd !== null && fallbackKickoff - awayLastEnd < MIN_REST)
      warnings.push(`${awayTeamId} has only ${fallbackKickoff - awayLastEnd} min rest between games (min. ${MIN_REST} min)`);

    const endTime = commitSlot(fixtureId, homeTeamId, awayTeamId, fallbackPitch, fallbackKickoff);
    lastGroupEnd = Math.max(lastGroupEnd, endTime);
  }

  // After PASS 1: reset every pitch to playoffStart so no pitch carries
  // a position from the group phase that would silently delay playoff tiers.
  const playoffStart = lastGroupEnd + PITCH_GAP;
  for (let p = 0; p < resolvedPitchCount; p++) {
    pitchAvailable[p] = playoffStart;
  }

  // --- PASS 2: Schedule playoff tiers sequentially ---
  // pitchAvailable is already synchronised to playoffStart.
  // Re-sync to the slowest pitch before each tier so no idle pitch can host
  // a later-round game while an earlier-round game is still running.
  for (let ti = 0; ti < tierKeys.length; ti++) {
    const syncTime = Math.max(...pitchAvailable);
    for (let p = 0; p < resolvedPitchCount; p++) {
      pitchAvailable[p] = Math.max(pitchAvailable[p], syncTime);
    }

    for (const fixture of playoffTiers[tierKeys[ti]]) {
      const { id: fixtureId, homeTeamId, awayTeamId } = fixture;
      const slot = findSlot(homeTeamId, awayTeamId, false); // strict=false: allow past lastMins
      if (!slot) continue;

      if (slot.kickoff + gameDuration > lastMins) {
        warnings.push(`Playoff game ends after ${lastGameTime}`);
      }

      commitSlot(fixtureId, homeTeamId, awayTeamId, slot.pitch, slot.kickoff);
    }
  }

  return { schedule, warnings };
}
