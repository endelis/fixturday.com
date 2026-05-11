import { nextPowerOf2, getRoundName } from './knockout'

/**
 * generateMultiTierKnockout
 *
 * Generates placeholder knockout fixtures for multiple parallel brackets
 * (tiers), each drawing specific finishing positions from a set of groups.
 *
 * @param {object} params
 * @param {Array<{ groupLabel: string, teams: Array<{id:*, name:string}> }>} params.groups
 * @param {Array<{ label: string, positions: number[] }>} params.tiersConfig
 *   e.g. [{ label: 'Champions', positions: [1, 2] }, { label: 'Conference', positions: [3, 4] }]
 *
 * @returns {Array<{
 *   bracket_label: string,
 *   tier: number,
 *   round: number,
 *   round_name: string,
 *   group: null,
 *   homeTeamId: null,
 *   awayTeamId: null,
 *   home_placeholder: string|null,
 *   away_placeholder: string|null
 * }>}
 *
 * Output shape matches generateKnockoutPlaceholders (groupStage.js) so both
 * paths can be consumed by the same fixture-insertion code.
 * Extra fields (bracket_label, tier, round_name) carry tier-specific metadata.
 */
export function generateMultiTierKnockout({ groups, tiersConfig }) {
  if (!groups?.length || !tiersConfig?.length) return []

  const allFixtures = []

  tiersConfig.forEach((tierCfg, tierIndex) => {
    // Build slots in position-major order so seeds from the same rank
    // are spread across the bracket rather than clustered.
    // e.g. positions [1,2], groups [A,B,C,D] →
    //   A-1, B-1, C-1, D-1, A-2, B-2, C-2, D-2
    const slots = []
    for (const pos of tierCfg.positions) {
      for (const group of groups) {
        slots.push({ groupLabel: group.groupLabel, position: pos })
      }
    }

    if (slots.length < 2) return

    const totalSlots = nextPowerOf2(slots.length)
    while (slots.length < totalSlots) slots.push(null) // BYE pads

    const roundName = getRoundName(totalSlots, 1)
    const half = totalSlots / 2

    for (let i = 0; i < half; i++) {
      const home = slots[i]
      const away = slots[totalSlots - 1 - i]

      // BYE vs BYE — cannot happen with valid input, guard anyway
      if (!home && !away) continue

      allFixtures.push({
        bracket_label: tierCfg.label,
        tier: tierIndex,
        round: 1,              // integer — matches fixtures.round (int) column
        round_name: roundName, // display label: 'QF', 'SF', 'F', …
        group: null,
        homeTeamId: null,
        awayTeamId: null,
        home_placeholder: home ? `Group ${home.groupLabel}-${home.position}` : null,
        away_placeholder: away ? `Group ${away.groupLabel}-${away.position}` : null,
      })
    }
  })

  return allFixtures
}
