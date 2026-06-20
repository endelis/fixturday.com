import { useTranslation } from 'react-i18next'

function roundLabel(bracket, round, maxRound, t) {
  if (bracket === 'grand_final') {
    return round === 1 ? t('bracket.grandFinalTitle') : t('bracket.grandFinalReset')
  }
  if (bracket === 'winners') {
    return round === maxRound ? t('bracket.wbFinal') : t('bracket.wbRound', { n: round })
  }
  if (bracket === 'losers') {
    return round === maxRound ? t('bracket.lbFinal') : t('bracket.lbRound', { n: round })
  }
  return `R${round}`
}

function MatchCard({ f, result, tournamentSport }) {
  const { t } = useTranslation()
  const homeName = f.home_team?.name ?? f.home_placeholder ?? 'TBD'
  const awayName = f.away_team?.name ?? f.away_placeholder ?? 'TBD'
  const isTbd = !f.home_team_id && !f.away_team_id
  const homeWon = result && Number(result.home_goals) > Number(result.away_goals)
  const awayWon = result && Number(result.away_goals) > Number(result.home_goals)

  const textMuted = { color: 'var(--color-text-muted)' }
  const textWinner = { color: 'var(--color-accent)', fontWeight: 700 }
  const textNormal = { color: 'var(--color-text)', fontWeight: 500 }

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '8px',
      padding: '0.6rem 0.75rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, fontSize: '0.875rem', ...(isTbd ? textMuted : homeWon ? textWinner : textNormal) }}>
          {homeName}
        </span>
        {result && (
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', flexShrink: 0, ...(homeWon ? textWinner : textMuted) }}>
            {Number(result.home_goals)}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, fontSize: '0.875rem', ...(isTbd ? textMuted : awayWon ? textWinner : textNormal) }}>
          {awayName}
        </span>
        {result && (
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', flexShrink: 0, ...(awayWon ? textWinner : textMuted) }}>
            {Number(result.away_goals)}
          </span>
        )}
      </div>
      {tournamentSport === 'beach_volleyball' && result?.sport_data?.sets && (
        <div style={{ marginTop: '0.35rem', fontSize: '0.68rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-heading)', letterSpacing: '0.03em' }}>
          {result.sport_data.sets.map(s => `${s.h}-${s.a}`).join(', ')}
        </div>
      )}
      {!result && !isTbd && (
        <div style={{ marginTop: '0.2rem', fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
          {t('bracket.pending')}
        </div>
      )}
    </div>
  )
}

function BracketSection({ bracket, roundMap, resultMap, tournamentSport }) {
  const { t } = useTranslation()
  const sortedRounds = Object.entries(roundMap).sort(([a], [b]) => Number(a) - Number(b))
  if (sortedRounds.length === 0) return null
  const maxRound = Math.max(...Object.keys(roundMap).map(Number))

  const titleKey = bracket === 'winners' ? 'bracket.winnersTitle'
    : bracket === 'losers' ? 'bracket.losersTitle'
    : 'bracket.grandFinalTitle'

  return (
    <div style={{ marginBottom: '2rem' }}>
      <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: 'var(--color-accent)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {t(titleKey)}
      </h2>
      {sortedRounds.map(([round, matches]) => (
        <div key={round} style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '0.78rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', flexShrink: 0 }}>
              {roundLabel(bracket, Number(round), maxRound, t)}
            </span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.5rem' }}>
            {matches.map(f => (
              <MatchCard
                key={f.id}
                f={f}
                result={resultMap.get(f.id)}
                tournamentSport={tournamentSport}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function DoubleEliminationBracket({ fixtures, results, tournamentSport = 'beach_volleyball' }) {
  const { t } = useTranslation()

  const resultMap = new Map()
  for (const r of results) resultMap.set(r.fixture_id, r)

  const sides = { winners: {}, losers: {}, grand_final: {} }
  for (const f of fixtures) {
    const bracket = f.stages?.bracket
    if (!bracket || !sides[bracket]) continue
    const round = f.round ?? 1
    if (!sides[bracket][round]) sides[bracket][round] = []
    sides[bracket][round].push(f)
  }

  const hasWinners = Object.keys(sides.winners).length > 0
  const hasLosers = Object.keys(sides.losers).length > 0
  const hasGF = Object.keys(sides.grand_final).length > 0

  if (!hasWinners && !hasLosers && !hasGF) {
    return <p style={{ color: 'var(--color-text-muted)' }}>{t('bracket.notGenerated')}</p>
  }

  const commonProps = { resultMap, tournamentSport }

  return (
    <div>
      {hasWinners && <BracketSection bracket="winners" roundMap={sides.winners} {...commonProps} />}
      {hasLosers && <BracketSection bracket="losers" roundMap={sides.losers} {...commonProps} />}
      {hasGF && <BracketSection bracket="grand_final" roundMap={sides.grand_final} {...commonProps} />}
    </div>
  )
}
