/**
 * Returns the singular i18n key for the participant unit of a tournament.
 * Use with t(getParticipantLabel(tournament)) in any component.
 *
 * @param {object|null} tournament - object with { participant_type?: string }
 * @returns {string} i18n key
 */
export function getParticipantLabel(tournament) {
  return tournament?.participant_type === 'individual'
    ? 'participants.individual'
    : 'participants.team'
}

/**
 * Returns the plural i18n key for the participant unit of a tournament.
 *
 * @param {object|null} tournament - object with { participant_type?: string }
 * @returns {string} i18n key
 */
export function getParticipantLabelPlural(tournament) {
  return tournament?.participant_type === 'individual'
    ? 'participants.individual_plural'
    : 'participants.team_plural'
}
