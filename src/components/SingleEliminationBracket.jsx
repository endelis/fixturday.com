import { useTranslation } from 'react-i18next'

const CARD_H = 80    // each card has 2 rows × ~40px (name + fixed provenance line)
const CARD_W = 158
const BASE_SLOT = CARD_H + 14  // 94px
const CONNECTOR_W = 30

const is3rd = f =>
  f.round_name === '3rd_place' || f.round_name === '3rd Place' || f.round_name === '3rd place' ||
  f.home_placeholder?.includes('zaudētājs') || f.away_placeholder?.includes('zaudētājs') ||
  f.home_placeholder?.toLowerCase().includes('loser') || f.away_placeholder?.toLowerCase().includes('loser')

function formatProvenance(placeholder) {
  if (!placeholder) return null
  const m = placeholder.match(/Group\s+([A-Z])-(\d+)/i)
  if (!m) return null
  const rank = parseInt(m[2])
  const suffix = rank === 1 ? '1st' : rank === 2 ? '2nd' : rank === 3 ? '3rd' : `${rank}th`
  return `Group ${m[1].toUpperCase()} · ${suffix}`
}

function BracketMatchCard({ f, result, provenanceMap = new Map() }) {
  const homeName = f.home_team?.name ?? f.home_placeholder ?? 'TBD'
  const awayName = f.away_team?.name ?? f.away_placeholder ?? 'TBD'
  const homeWon = result && Number(result.home_goals) > Number(result.away_goals)
  const awayWon = result && Number(result.away_goals) > Number(result.home_goals)

  // Provenance: only meaningful when the team is actually assigned
  const homeProvenance = f.home_team?.id ? provenanceMap.get(f.home_team.id) : null
  const awayProvenance = f.away_team?.id ? provenanceMap.get(f.away_team.id) : null

  function rowStyle(isHome) {
    const won = isHome ? homeWon : awayWon
    const hasTeam = isHome ? !!f.home_team?.id : !!f.away_team?.id
    const placeholder = isHome ? f.home_placeholder : f.away_placeholder
    if (!hasTeam) return placeholder
      ? { color: 'var(--color-text-muted)' }
      : { color: 'var(--color-text-muted)', fontStyle: 'italic' }
    if (result) return won
      ? { color: 'var(--color-accent)', fontWeight: 700 }
      : { color: 'var(--color-text-muted)' }
    return { color: 'var(--color-text)', fontWeight: 500 }
  }

  const scoreStyle = won => won
    ? { fontFamily: 'var(--font-heading)', fontSize: '0.9rem', flexShrink: 0, color: 'var(--color-accent)', fontWeight: 700 }
    : { fontFamily: 'var(--font-heading)', fontSize: '0.9rem', flexShrink: 0, color: 'var(--color-text-muted)' }

  function Row({ isHome, provenance }) {
    const name = isHome ? homeName : awayName
    const won = isHome ? homeWon : awayWon
    const goals = isHome
      ? (result ? Number(result.home_goals) : null)
      : (result ? Number(result.away_goals) : null)

    return (
      <div style={{ padding: '0.38rem 0.6rem 0.3rem', ...(isHome ? { borderBottom: '1px solid rgba(255,255,255,0.05)' } : {}) }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, fontSize: '0.82rem', minWidth: 0, ...rowStyle(isHome) }}>
            {name}
          </span>
          {goals !== null && <span style={scoreStyle(won)}>{goals}</span>}
        </div>
        {/* Fixed-height provenance line — always renders to keep card height consistent */}
        <div style={{ height: '0.72rem', marginTop: '1px', overflow: 'hidden' }}>
          {provenance && (
            <span style={{ fontSize: '0.6rem', color: 'rgba(136,146,164,0.65)', lineHeight: 1, letterSpacing: '0.02em' }}>
              {provenance}
            </span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{
      width: CARD_W,
      background: 'var(--color-surface)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '8px',
      overflow: 'hidden',
    }}>
      <Row isHome={true} provenance={homeProvenance} />
      <Row isHome={false} provenance={awayProvenance} />
    </div>
  )
}

function ConnectorSVG({ totalHeight, matchCount, slotSize }) {
  const pairs = Math.ceil(matchCount / 2)
  const midX = CONNECTOR_W / 2
  const stroke = 'rgba(240,165,0,0.35)'

  return (
    <svg width={CONNECTOR_W} height={totalHeight} style={{ display: 'block', flexShrink: 0 }}>
      {Array.from({ length: pairs }, (_, i) => {
        const topY    = (i * 2)     * slotSize + slotSize / 2
        const bottomY = (i * 2 + 1) * slotSize + slotSize / 2
        const midY    = (topY + bottomY) / 2
        return (
          <g key={i}>
            <line x1={0}    y1={topY}    x2={midX}        y2={topY}    stroke={stroke} strokeWidth={1.5} />
            <line x1={0}    y1={bottomY} x2={midX}        y2={bottomY} stroke={stroke} strokeWidth={1.5} />
            <line x1={midX} y1={topY}    x2={midX}        y2={bottomY} stroke={stroke} strokeWidth={1.5} />
            <line x1={midX} y1={midY}    x2={CONNECTOR_W} y2={midY}    stroke={stroke} strokeWidth={1.5} />
          </g>
        )
      })}
    </svg>
  )
}

export default function SingleEliminationBracket({ knockoutFixtures, results }) {
  const { t } = useTranslation()

  const resultMap = new Map()
  for (const r of results) resultMap.set(r.fixture_id, r)

  const thirdPlace = knockoutFixtures.filter(is3rd)
  const main       = knockoutFixtures.filter(f => !is3rd(f))

  // Group main bracket fixtures by round, sort ascending (earliest round = leftmost column)
  const roundMap = {}
  for (const f of main) {
    const r = f.round ?? 999
    ;(roundMap[r] = roundMap[r] ?? []).push(f)
  }
  const rounds = Object.values(roundMap).sort((a, b) => (a[0].round ?? 999) - (b[0].round ?? 999))

  // Build provenance map from first KO round placeholders — carried forward to later rounds
  const provenanceMap = new Map()
  if (rounds.length > 0) {
    for (const f of rounds[0]) {
      if (f.home_team?.id) {
        const p = formatProvenance(f.home_placeholder)
        if (p) provenanceMap.set(f.home_team.id, p)
      }
      if (f.away_team?.id) {
        const p = formatProvenance(f.away_placeholder)
        if (p) provenanceMap.set(f.away_team.id, p)
      }
    }
  }

  if (rounds.length === 0 && thirdPlace.length === 0) return null

  const N = rounds.length > 0 ? rounds[0].length : 0
  const totalHeight = N * BASE_SLOT

  function getRoundLabel(roundIdx) {
    const rn = rounds[roundIdx][0]?.round_name
    if (rn && !is3rd({ round_name: rn })) return rn
    const fromEnd = rounds.length - roundIdx
    if (fromEnd === 1) return t('playoff.final')
    if (fromEnd === 2) return t('playoff.semiFinal')
    if (fromEnd === 3) return t('playoff.quarterFinal')
    return `R${roundIdx + 1}`
  }

  const thirdPlaceSection = thirdPlace.length > 0 && (
    <div style={{ marginTop: rounds.length > 0 ? '1.5rem' : 0 }}>
      <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
        {t('playoff.thirdPlace')}
      </div>
      {thirdPlace.map(f => (
        <BracketMatchCard key={f.id} f={f} result={resultMap.get(f.id)} provenanceMap={provenanceMap} />
      ))}
    </div>
  )

  if (rounds.length === 0) return thirdPlaceSection

  return (
    <div>
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '0.25rem' }}>
        <div style={{ display: 'inline-flex', flexDirection: 'column' }}>
          {/* Round header labels */}
          <div style={{ display: 'flex', marginBottom: '0.6rem' }}>
            {rounds.map((_, i) => (
              <div key={i} style={{ display: 'flex', flexShrink: 0 }}>
                <div style={{ width: CARD_W, textAlign: 'center' }}>
                  <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)' }}>
                    {getRoundLabel(i)}
                  </span>
                </div>
                {i < rounds.length - 1 && <div style={{ width: CONNECTOR_W }} />}
              </div>
            ))}
          </div>

          {/* Bracket columns */}
          <div style={{ display: 'flex', height: totalHeight }}>
            {rounds.map((matches, roundIdx) => {
              const slotSize = BASE_SLOT * Math.pow(2, roundIdx)
              return (
                <div key={roundIdx} style={{ display: 'flex', flexShrink: 0 }}>
                  <div style={{ width: CARD_W, height: totalHeight, position: 'relative', flexShrink: 0 }}>
                    {matches.map((match, matchIdx) => {
                      const cardTop = matchIdx * slotSize + (slotSize - CARD_H) / 2
                      return (
                        <div key={match.id} style={{ position: 'absolute', top: cardTop, left: 0 }}>
                          <BracketMatchCard f={match} result={resultMap.get(match.id)} provenanceMap={provenanceMap} />
                        </div>
                      )
                    })}
                  </div>
                  {roundIdx < rounds.length - 1 && (
                    <ConnectorSVG
                      totalHeight={totalHeight}
                      matchCount={matches.length}
                      slotSize={slotSize}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {thirdPlaceSection}
    </div>
  )
}
