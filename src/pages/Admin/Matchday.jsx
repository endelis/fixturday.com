import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { formatTime } from '../../utils/dateFormat'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { toast } from '../../components/Toast'
import {
  validateBeachVolleyballMatch,
  computeSportData,
  setsFromSportData,
  emptySetSlots,
  formatBeachScore,
} from '../../utils/beachVolleyball'
import { validateCatchServeMatch, computeCatchServeSportData } from '../../utils/catchServe'

const inputSx = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  color: 'var(--color-text)',
  padding: '0.3rem 0.6rem',
  borderRadius: 'var(--radius-sm)',
  fontSize: '0.875rem',
  fontFamily: 'var(--font-body)',
  minHeight: '44px',
}

const setInputSx = {
  width: '3.5rem',
  textAlign: 'center',
  fontSize: '1.25rem',
  fontFamily: 'var(--font-heading)',
  padding: '0.4rem 0.25rem',
  minHeight: '44px',
  background: 'var(--color-surface)',
  border: '2px solid var(--color-accent)',
  color: 'var(--color-text)',
  borderRadius: '6px',
}

/**
 * Set-by-set score entry for set-based sports (beach volleyball / catch_serve).
 * Set 1 and Set 2 are always visible.
 * Set 3 unlocks only when it's 1-1 after Set 2.
 * normalTarget: 21 for beach volleyball, 25 for catch_serve.
 */
function SetBasedScoreEntry({ f, sets, onSetsChange, onSave, saving, hasResult, isPostponed, t, sport, csSetTarget }) {
  const normalTarget = sport === 'beach_volleyball' ? 21 : (csSetTarget ?? 15)
  const decidingTarget = sport === 'beach_volleyball' ? 15 : (normalTarget === 25 ? 15 : 11)

  function localSetWinner(h, a, isDecider) {
    const hv = Number(h), av = Number(a)
    if (!Number.isFinite(hv) || !Number.isFinite(av)) return null
    const target = isDecider ? decidingTarget : normalTarget
    if (hv >= target && hv - av >= 2) return 'home'
    if (av >= target && av - hv >= 2) return 'away'
    return null
  }

  function updateSet(idx, side, value) {
    const next = sets.map((s, i) => i === idx ? { ...s, [side]: value } : s)
    onSetsChange(next)
  }

  const w1 = localSetWinner(sets[0].home, sets[0].away, false)
  const w2 = localSetWinner(sets[1].home, sets[1].away, false)
  const show3 = w1 !== null && w2 !== null && w1 !== w2

  function validScore(h, a, isDecider) {
    if (h === '' || a === '') return true
    const hv = Number(h), av = Number(a)
    if (!Number.isFinite(hv) || !Number.isFinite(av)) return true
    const target = isDecider ? decidingTarget : normalTarget
    if (Math.max(hv, av) > target) return Math.abs(hv - av) === 2
    return true
  }
  const v1 = validScore(sets[0].home, sets[0].away, false)
  const v2 = validScore(sets[1].home, sets[1].away, false)
  const v3 = validScore(sets[2].home, sets[2].away, true)
  const hasInvalidScore = !v1 || !v2 || (show3 && !v3)

  const SET_LABELS = ['Set 1', 'Set 2', `Set 3 (to ${decidingTarget})`]

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
        <span style={{ flex: 1, textAlign: 'right', fontFamily: 'var(--font-heading)', fontSize: '1.1rem', minWidth: '5rem', paddingTop: '0.4rem' }}>
          {f.home_team?.name}
        </span>

        <div style={{ display: 'flex', gap: '0.75rem', flexShrink: 0 }}>
          {[0, 1, 2].map(idx => {
            if (idx === 2 && !show3) return null
            const isDecider = idx === 2
            const isWon = idx === 0 ? w1 : idx === 1 ? w2 : localSetWinner(sets[2].home, sets[2].away, true)
            const setValid = idx === 0 ? v1 : idx === 1 ? v2 : v3
            const borderHome = !setValid ? 'var(--color-danger)' : isWon === 'home' ? 'var(--color-success)' : isWon === 'away' ? 'var(--color-danger)' : 'var(--color-accent)'
            const borderAway = !setValid ? 'var(--color-danger)' : isWon === 'away' ? 'var(--color-success)' : isWon === 'home' ? 'var(--color-danger)' : 'var(--color-accent)'
            return (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {SET_LABELS[idx]}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <input
                    type="number" min="0" max="99"
                    value={sets[idx].home}
                    disabled={isPostponed}
                    onChange={e => updateSet(idx, 'home', e.target.value)}
                    style={{ ...setInputSx, borderColor: borderHome }}
                  />
                  <span style={{ color: 'var(--color-text-muted)', fontSize: '1rem' }}>:</span>
                  <input
                    type="number" min="0" max="99"
                    value={sets[idx].away}
                    disabled={isPostponed}
                    onChange={e => updateSet(idx, 'away', e.target.value)}
                    style={{ ...setInputSx, borderColor: borderAway }}
                  />
                </div>
                {!setValid && (
                  <span style={{ fontSize: '0.6rem', color: 'var(--color-danger)', marginTop: '0.15rem' }}>
                    {t('matchday.setScoreInvalid', { target: isDecider ? decidingTarget : normalTarget })}
                  </span>
                )}
              </div>
            )
          })}
        </div>

        <span style={{ flex: 1, fontFamily: 'var(--font-heading)', fontSize: '1.1rem', minWidth: '5rem', paddingTop: '0.4rem' }}>
          {f.away_team?.name}
        </span>

        {!isPostponed && (
          <button className="btn-primary" style={{ flexShrink: 0, minWidth: '6rem', alignSelf: 'flex-end' }} onClick={onSave} disabled={saving || hasInvalidScore}>
            {saving ? t('common.saving') : hasResult ? t('matchday.updateBtn') : t('matchday.saveBtn')}
          </button>
        )}
      </div>

      {hasResult && f.fixture_results?.[0]?.sport_data && (
        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', paddingLeft: '0.25rem' }}>
          {formatBeachScore(f.fixture_results[0].sport_data)}
        </div>
      )}
    </div>
  )
}

export default function Matchday() {
  const { t } = useTranslation()
  const { user, loading: authLoading } = useAuth()
  const { id: urlTournamentId } = useParams()
  const [fixtures, setFixtures] = useState([])
  const [scores, setScores] = useState({})
  const [saving, setSaving] = useState({})
  const [savingAll, setSavingAll] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [filterGroup, setFilterGroup] = useState('all')
  const [filterStatus, setFilterStatus] = useState('pending')
  const [tournamentId, setTournamentId] = useState(null)
  const [playoffFixtures, setPlayoffFixtures] = useState([])
  const [tournamentSport, setTournamentSport] = useState('football')
  // Beach volleyball set scores: { [fixtureId]: [{home,away},{home,away},{home,away}] }
  const [sets, setSets] = useState({})

  // Tracks which fixture score inputs the user has actually edited this session
  const [dirty, setDirty] = useState(new Set())

  // Events state: { [fixtureId]: [event, ...] }
  const [events, setEvents] = useState({})
  // Team players cache: { [teamId]: [player, ...] }
  const [teamPlayers, setTeamPlayers] = useState({})
  // Event form state per fixture: { [fixtureId]: { teamId, playerId, eventType, minute } }
  const [eventForm, setEventForm] = useState({})
  const [addingEvent, setAddingEvent] = useState({})

  async function load() {
    setLoading(true)
    const start = new Date(selectedDate + 'T00:00:00').toISOString()
    const end   = new Date(selectedDate + 'T23:59:59').toISOString()

    const { data: fx, error } = await supabase
      .from('fixtures')
      .select(`
        *,
        home_team:teams!home_team_id(id, name),
        away_team:teams!away_team_id(id, name),
        pitch:pitches(name, venues(name)),
        stages(age_groups(name, cs_set_target, tournaments(id, name, sport)))
      `)
      .gte('kickoff_time', start)
      .lte('kickoff_time', end)
      .order('kickoff_time')

    if (error) { toast(t('common.error'), 'error'); setLoading(false); return }

    const allFx = (fx ?? []).filter(f =>
      !urlTournamentId || f.stages?.age_groups?.tournaments?.id === urlTournamentId
    )
    const fixtureIds = allFx.map(f => f.id)

    // Fetch fixture_results separately — embedded joins silently drop rows for authenticated users
    const { data: resultData, error: resultErr } = fixtureIds.length > 0
      ? await supabase.from('fixture_results').select('id, fixture_id, home_goals, away_goals, sport_data').in('fixture_id', fixtureIds)
      : { data: [], error: null }
    if (resultErr) { toast(t('common.error'), 'error'); setLoading(false); return }
    const resultMap = Object.fromEntries((resultData ?? []).map(r => [r.fixture_id, r]))
    const allFxWithResults = allFx.map(f => ({
      ...f,
      fixture_results: resultMap[f.id] ? [resultMap[f.id]] : [],
    }))

    setFixtures(allFxWithResults)
    setDirty(new Set())

    const tId = allFxWithResults[0]?.stages?.age_groups?.tournaments?.id ?? null
    setTournamentId(tId)

    const tSport = allFxWithResults[0]?.stages?.age_groups?.tournaments?.sport ?? 'football'
    setTournamentSport(tSport)

    const init = {}
    const initSets = {}
    allFxWithResults.forEach(f => {
      const r = f.fixture_results?.[0]
      init[f.id] = { home: r?.home_goals ?? 0, away: r?.away_goals ?? 0 }
      initSets[f.id] = setsFromSportData(r?.sport_data)
    })
    setScores(init)
    setSets(initSets)

    // Load events for all fixtures
    if (fixtureIds.length > 0) {
      const { data: evs } = await supabase
        .from('fixture_events')
        .select('*, player:team_players(id, name, number), team:teams(id, name)')
        .in('fixture_id', fixtureIds)
        .order('minute', { ascending: true, nullsFirst: false })
      const evMap = {}
      ;(evs ?? []).forEach(ev => {
        ;(evMap[ev.fixture_id] = evMap[ev.fixture_id] ?? []).push(ev)
      })
      setEvents(evMap)
    }

    // Fetch all knockout fixtures for this tournament regardless of kickoff date
    if (urlTournamentId) {
      const { data: ags } = await supabase.from('age_groups').select('id').eq('tournament_id', urlTournamentId)
      const agIds = (ags ?? []).map(a => a.id)
      if (agIds.length > 0) {
        const { data: koStg } = await supabase.from('stages').select('id').in('age_group_id', agIds).eq('type', 'knockout')
        const koStageIds = (koStg ?? []).map(s => s.id)
        if (koStageIds.length > 0) {
          const { data: koFx } = await supabase
            .from('fixtures')
            .select(`*, home_team:teams!home_team_id(id, name), away_team:teams!away_team_id(id, name), pitch:pitches(name, venues(name)), stages(age_groups(name, tournaments(id, name)))`)
            .in('stage_id', koStageIds).not('home_team_id', 'is', null).order('round')
          const koList = koFx ?? []
          const koFxIds = koList.map(f => f.id)
          let koResMap = {}
          if (koFxIds.length > 0) {
            const { data: koRes } = await supabase.from('fixture_results').select('fixture_id, home_goals, away_goals, sport_data').in('fixture_id', koFxIds)
            koResMap = Object.fromEntries((koRes ?? []).map(r => [r.fixture_id, r]))
            const { data: koEvs } = await supabase.from('fixture_events').select('*, player:team_players(id, name, number), team:teams(id, name)').in('fixture_id', koFxIds).order('minute', { ascending: true, nullsFirst: false })
            const koEvMap = {}
            ;(koEvs ?? []).forEach(ev => { (koEvMap[ev.fixture_id] = koEvMap[ev.fixture_id] ?? []).push(ev) })
            setEvents(prev => ({ ...prev, ...koEvMap }))
          }
          let koFull = koList.map(f => ({ ...f, fixture_results: koResMap[f.id] ? [koResMap[f.id]] : [] }))

          // Auto-advance completed KO fixtures (handles results saved before deploy)
          let advancedAny = false
          for (const kf of koFull) {
            const res = koResMap[kf.id]
            if (res && res.home_goals !== res.away_goals) {
              const changed = await advanceKnockoutTeams(kf, res.home_goals, res.away_goals)
              if (changed) advancedAny = true
            }
          }
          if (advancedAny) {
            const { data: refreshed } = await supabase
              .from('fixtures')
              .select(`*, home_team:teams!home_team_id(id, name), away_team:teams!away_team_id(id, name), pitch:pitches(name, venues(name)), stages(age_groups(name, tournaments(id, name)))`)
              .in('stage_id', koStageIds).not('home_team_id', 'is', null).order('round')
            if (refreshed) {
              const rfIds = refreshed.map(f => f.id)
              const { data: rfRes } = rfIds.length > 0
                ? await supabase.from('fixture_results').select('fixture_id, home_goals, away_goals').in('fixture_id', rfIds)
                : { data: [] }
              const rfResMap = Object.fromEntries((rfRes ?? []).map(r => [r.fixture_id, r]))
              koFull = refreshed.map(f => ({ ...f, fixture_results: rfResMap[f.id] ? [rfResMap[f.id]] : [] }))
            }
          }

          const koScores = {}
          const koSets = {}
          koFull.forEach(f => {
            const r = f.fixture_results?.[0]
            koScores[f.id] = { home: r?.home_goals ?? 0, away: r?.away_goals ?? 0 }
            koSets[f.id] = setsFromSportData(r?.sport_data)
          })
          setScores(prev => ({ ...prev, ...koScores }))
          setSets(prev => ({ ...prev, ...koSets }))
          setPlayoffFixtures(koFull)
        } else { setPlayoffFixtures([]) }
      } else { setPlayoffFixtures([]) }
    } else { setPlayoffFixtures([]) }

    setLoading(false)
  }

  async function loadTeamPlayers(teamId) {
    if (!teamId || teamPlayers[teamId]) return
    const { data } = await supabase
      .from('team_players')
      .select('id, name, number, position')
      .eq('team_id', teamId)
      .order('number')
    setTeamPlayers(prev => ({ ...prev, [teamId]: data ?? [] }))
  }

  useEffect(() => {
    if (authLoading || !user) return
    load()
  }, [selectedDate, authLoading, user])

  if (authLoading) return <div className="loading">{t('common.loading')}</div>
  if (!user) return <Navigate to="/admin" replace />

  const ageGroupNames = [...new Set(
    fixtures.map(f => f.stages?.age_groups?.name).filter(Boolean)
  )].sort()

  // IDs of the 2 most recently completed fixtures — always shown in 'pending' mode for quick editing
  const recentCompletedIds = new Set(
    [...fixtures]
      .filter(f => {
        const ag = f.stages?.age_groups?.name
        if (filterGroup !== 'all' && ag !== filterGroup) return false
        return !!f.fixture_results?.[0] || f.status === 'completed'
      })
      .sort((a, b) => {
        if (!a.kickoff_time && !b.kickoff_time) return 0
        if (!a.kickoff_time) return 1
        if (!b.kickoff_time) return -1
        return new Date(b.kickoff_time) - new Date(a.kickoff_time)
      })
      .slice(0, 2)
      .map(f => f.id)
  )

  const filtered = fixtures.filter(f => {
    const ag = f.stages?.age_groups?.name
    const hasResult = !!f.fixture_results?.[0]
    const isComplete = hasResult || f.status === 'completed'
    const agMatch = filterGroup === 'all' || ag === filterGroup
    if (!agMatch) return false
    if (filterStatus === 'all') return true
    if (filterStatus === 'completed') return isComplete
    // 'pending' (default): all non-completed + last 2 completed for quick editing
    if (!isComplete) return true
    return recentCompletedIds.has(f.id)
  })

  const byGroup = filtered.reduce((acc, f) => {
    const key = f.stages?.age_groups?.name ?? '—'
    ;(acc[key] = acc[key] ?? []).push(f)
    return acc
  }, {})

  async function advanceKnockoutTeams(f, homeGoals, awayGoals) {
    if (f.group_label || !f.stage_id) return
    if (homeGoals === awayGoals) return
    const winner = homeGoals > awayGoals ? f.home_team_id : f.away_team_id
    const loser  = homeGoals > awayGoals ? f.away_team_id : f.home_team_id
    if (!winner || !loser) return

    const { data: stageFx } = await supabase
      .from('fixtures')
      .select('id, round, round_name, home_placeholder, away_placeholder, home_team_id, away_team_id')
      .eq('stage_id', f.stage_id)
    if (!stageFx) return false

    const roundFx = stageFx
      .filter(sf => sf.round === f.round && sf.round_name !== '3rd_place')
      .sort((a, b) => (a.home_placeholder ?? a.id).localeCompare(b.home_placeholder ?? b.id))

    const myIndex = roundFx.findIndex(sf => sf.id === f.id)
    if (myIndex === -1) return false

    const n = roundFx.length
    const roundLabel = n >= 8 ? `R${n * 2}` : n === 4 ? 'QF' : n === 2 ? 'SF' : 'F'
    const matchNum = myIndex + 1
    const winnerEN = `${roundLabel}${matchNum} Winner`
    const loserEN  = `${roundLabel}${matchNum} Loser`
    const winnerLV = `${roundLabel}${matchNum} uzvarētājs`
    const loserLV  = `${roundLabel}${matchNum} zaudētājs`

    const downstream = stageFx.filter(sf =>
      sf.round > f.round && (
        sf.home_placeholder === winnerEN || sf.away_placeholder === winnerEN ||
        sf.home_placeholder === loserEN  || sf.away_placeholder === loserEN  ||
        sf.home_placeholder === winnerLV || sf.away_placeholder === winnerLV ||
        sf.home_placeholder === loserLV  || sf.away_placeholder === loserLV
      )
    )

    let changed = false
    for (const df of downstream) {
      const upd = {}
      if (!df.home_team_id && (df.home_placeholder === winnerEN || df.home_placeholder === winnerLV)) upd.home_team_id = winner
      if (!df.away_team_id && (df.away_placeholder === winnerEN || df.away_placeholder === winnerLV)) upd.away_team_id = winner
      if (!df.home_team_id && (df.home_placeholder === loserEN  || df.home_placeholder === loserLV))  upd.home_team_id = loser
      if (!df.away_team_id && (df.away_placeholder === loserEN  || df.away_placeholder === loserLV))  upd.away_team_id = loser
      if (Object.keys(upd).length > 0) {
        const { error: advErr } = await supabase.from('fixtures').update(upd).eq('id', df.id)
        if (advErr) { toast(t('common.error'), 'error'); return false }
        changed = true
      }
    }
    return changed
  }

  async function saveScore(f) {
    setSaving(prev => ({ ...prev, [f.id]: true }))
    const hasExisting = !!f.fixture_results?.[0]

    if (tournamentSport === 'beach_volleyball' || tournamentSport === 'catch_serve') {
      const csSetTarget = f.stages?.age_groups?.cs_set_target ?? 15
      const allSlots = sets[f.id] ?? emptySetSlots()
      const filledSets = allSlots.filter(s => s.home !== '' && s.away !== '')
      const validation = tournamentSport === 'beach_volleyball'
        ? validateBeachVolleyballMatch(filledSets)
        : validateCatchServeMatch(filledSets, csSetTarget)
      if (!validation.valid) {
        toast(validation.error, 'error')
        setSaving(prev => ({ ...prev, [f.id]: false }))
        return
      }
      const sportData = tournamentSport === 'catch_serve'
        ? computeCatchServeSportData(filledSets, csSetTarget)
        : computeSportData(filledSets)
      const payload = {
        home_goals: sportData.sets_home,
        away_goals: sportData.sets_away,
        sport_data: sportData,
      }
      const { error: resErr } = hasExisting
        ? await supabase.from('fixture_results').update(payload).eq('fixture_id', f.id)
        : await supabase.from('fixture_results').insert({ fixture_id: f.id, ...payload })
      if (resErr) { toast(`${t('common.error')}: ${resErr.message}`, 'error'); setSaving(prev => ({ ...prev, [f.id]: false })); return }
      const { error: statusErr } = await supabase.from('fixtures').update({ status: 'completed' }).eq('id', f.id)
      if (statusErr) { toast(`${t('common.error')}: ${statusErr.message}`, 'error'); setSaving(prev => ({ ...prev, [f.id]: false })); return }
      toast(t('common.saved'))
      setSaving(prev => ({ ...prev, [f.id]: false }))
      load()
      return
    }

    // ── Football ──────────────────────────────────────────────────────────────
    const score = scores[f.id] ?? { home: 0, away: 0 }
    const { error: resErr } = hasExisting
      ? await supabase
          .from('fixture_results')
          .update({ home_goals: score.home, away_goals: score.away })
          .eq('fixture_id', f.id)
      : await supabase
          .from('fixture_results')
          .insert({ fixture_id: f.id, home_goals: score.home, away_goals: score.away })

    if (resErr) { toast(`${t('common.error')}: ${resErr.message}`, 'error'); setSaving(prev => ({ ...prev, [f.id]: false })); return }

    const { error: statusErr } = await supabase.from('fixtures').update({ status: 'completed' }).eq('id', f.id)
    if (statusErr) toast(`${t('common.error')}: ${statusErr.message}`, 'error')
    else await advanceKnockoutTeams(f, score.home, score.away)
    toast(t('common.saved'))
    setSaving(prev => ({ ...prev, [f.id]: false }))
    load()
  }

  async function saveAll() {
    setSavingAll(true)
    const updates = filtered
      .filter(f => f.status !== 'postponed')
      .map(async f => {
        const hasExisting = !!f.fixture_results?.[0]
        // Derive sport from the fixture itself — never rely on tournamentSport state alone
        const fSport = f.stages?.age_groups?.tournaments?.sport ?? tournamentSport

        if (fSport === 'beach_volleyball' || fSport === 'catch_serve') {
          const csSetTarget = f.stages?.age_groups?.cs_set_target ?? 15
          const allSlots = sets[f.id] ?? emptySetSlots()
          const filledSets = allSlots.filter(s => s.home !== '' && s.away !== '')
          if (filledSets.length === 0) return null // no data entered — skip
          const validation = fSport === 'beach_volleyball'
            ? validateBeachVolleyballMatch(filledSets)
            : validateCatchServeMatch(filledSets, csSetTarget)
          if (!validation.valid) return null // invalid — skip silently
          const sportData = fSport === 'catch_serve'
            ? computeCatchServeSportData(filledSets, csSetTarget)
            : computeSportData(filledSets)
          const payload = { home_goals: sportData.sets_home, away_goals: sportData.sets_away, sport_data: sportData }
          const { error: resErr } = hasExisting
            ? await supabase.from('fixture_results').update(payload).eq('fixture_id', f.id)
            : await supabase.from('fixture_results').insert({ fixture_id: f.id, ...payload })
          if (resErr) return resErr
          const { error: statusErr } = await supabase.from('fixtures').update({ status: 'completed' }).eq('id', f.id)
          return statusErr
        }

        // Football — guard against unknown sports falling through
        if (fSport !== 'football') return null
        if (!hasExisting && !dirty.has(f.id)) return null
        const score = scores[f.id] ?? { home: 0, away: 0 }
        const { error: resErr } = hasExisting
          ? await supabase
              .from('fixture_results')
              .update({ home_goals: score.home, away_goals: score.away })
              .eq('fixture_id', f.id)
          : await supabase
              .from('fixture_results')
              .insert({ fixture_id: f.id, home_goals: score.home, away_goals: score.away })
        if (!resErr) {
          const { error: statusErr } = await supabase.from('fixtures').update({ status: 'completed' }).eq('id', f.id)
          return statusErr
        }
        return resErr
      })
    const results = await Promise.all(updates)
    const failed = results.filter(Boolean)
    if (failed.length > 0) toast(t('common.error'), 'error')
    else toast(t('matchday.allSaved'))
    setSavingAll(false)
    load()
  }

  async function postpone(fixtureId) {
    if (!confirm(t('matchday.confirmPostpone'))) return
    const { error } = await supabase.from('fixtures').update({ status: 'postponed' }).eq('id', fixtureId)
    if (error) { toast(t('common.error'), 'error'); return }
    toast(t('common.saved'))
    load()
  }

  function statusBadge(f) {
    if (f.status === 'postponed') return <span className="badge badge-muted">{t('matchday.statusPostponed')}</span>
    if (f.fixture_results?.[0] || f.status === 'completed') return <span className="badge badge-success">{t('matchday.statusCompleted')}</span>
    return <span className="badge badge-muted">{t('matchday.statusPending')}</span>
  }

  function setEF(fixtureId, patch) {
    setEventForm(prev => ({ ...prev, [fixtureId]: { ...prev[fixtureId], ...patch } }))
  }

  async function addEvent(f) {
    const form = eventForm[f.id] ?? {}
    if (!form.teamId || !form.eventType) return
    setAddingEvent(prev => ({ ...prev, [f.id]: true }))

    // Check for second yellow → auto red
    let extraRedCard = false
    if (form.eventType === 'yellow_card' && form.playerId) {
      const existing = events[f.id] ?? []
      const prevYellow = existing.find(ev => ev.player_id === form.playerId && ev.event_type === 'yellow_card')
      if (prevYellow) {
        extraRedCard = true
        toast(t('matchday.secondYellowWarning'), 'warning')
      }
    }

    const row = {
      fixture_id: f.id,
      team_id: form.teamId,
      player_id: form.playerId || null,
      event_type: form.eventType,
      minute: form.minute ? Number(form.minute) : null,
    }

    const { error } = await supabase.from('fixture_events').insert(row)
    if (error) { toast(t('common.error'), 'error'); setAddingEvent(prev => ({ ...prev, [f.id]: false })); return }

    // Auto red card for second yellow
    if (extraRedCard) {
      const { error: redErr } = await supabase.from('fixture_events').insert({
        ...row,
        event_type: 'red_card',
      })
      if (redErr) toast(`${t('common.error')}: ${redErr.message}`, 'error')
    }

    // Auto-update score for goals
    if (form.eventType === 'goal' || form.eventType === 'own_goal') {
      const isHomeTeam = form.teamId === f.home_team?.id
      const isGoal = form.eventType === 'goal'
      // goal for home team → home score up; own_goal for home team → away score up
      const homeIncrement = (isGoal && isHomeTeam) || (!isGoal && !isHomeTeam) ? 1 : 0
      const awayIncrement = (isGoal && !isHomeTeam) || (!isGoal && isHomeTeam) ? 1 : 0

      const cur = scores[f.id] ?? { home: 0, away: 0 }
      const newHome = cur.home + homeIncrement
      const newAway = cur.away + awayIncrement

      setScores(prev => ({ ...prev, [f.id]: { home: newHome, away: newAway } }))

      // Persist to fixture_results — upsert avoids stale-closure double-insert
      const { error: upsertErr } = await supabase.from('fixture_results').upsert(
        { fixture_id: f.id, home_goals: newHome, away_goals: newAway },
        { onConflict: 'fixture_id' }
      )
      if (upsertErr) { toast(`${t('common.error')}: ${upsertErr.message}`, 'error') }
      else {
        const { error: goalStatusErr } = await supabase.from('fixtures').update({ status: 'completed' }).eq('id', f.id)
        if (goalStatusErr) toast(`${t('common.error')}: ${goalStatusErr.message}`, 'error')
      }
    }

    // Reset minute only, keep team/type for quick repeat entry
    setEF(f.id, { minute: '' })
    setAddingEvent(prev => ({ ...prev, [f.id]: false }))
    load()
  }

  async function deleteEvent(eventId, fixtureId) {
    const { error } = await supabase.from('fixture_events').delete().eq('id', eventId)
    if (error) { toast(t('common.error'), 'error'); return }
    load()
  }

  function eventLabel(ev) {
    const typeKey = {
      goal: 'eventGoal',
      own_goal: 'eventOwnGoal',
      yellow_card: 'eventYellow',
      red_card: 'eventRed',
    }[ev.event_type] ?? ev.event_type
    const name = ev.player?.name ?? '—'
    const num = ev.player?.number ? `#${ev.player.number} ` : ''
    const min = ev.minute ? `${ev.minute}'` : ''
    return `${t(`matchday.${typeKey}`)} ${num}${name}${min ? ' ' + min : ''}`
  }

  const backLink = tournamentId ? `/admin/tournaments/${tournamentId}/overview` : '/admin/dashboard'

  function markDirty(id) {
    setDirty(p => { const s = new Set(p); s.add(id); return s })
  }

  function renderFixture(f) {
    const score = scores[f.id] ?? { home: 0, away: 0 }
    const isPostponed = f.status === 'postponed'
    const hasResult = !!f.fixture_results?.[0]
    const fixtureEvents = events[f.id] ?? []
    const ef = eventForm[f.id] ?? {}
    const selectedTeamPlayers = ef.teamId ? (teamPlayers[ef.teamId] ?? []) : []
    return (
      <div key={f.id} className="card" style={{ opacity: isPostponed ? 0.5 : 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            {f.kickoff_time ? formatTime(f.kickoff_time) : <span style={{ fontStyle: 'italic' }}>TBD</span>}
            {f.pitch && ` · ${f.pitch.venues?.name} — ${f.pitch.name}`}
          </span>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {statusBadge(f)}
            {!isPostponed && (
              <button className="btn-secondary btn-sm" style={{ fontSize: '0.75rem', minHeight: '44px' }} onClick={() => postpone(f.id)}>
                {t('matchday.postponeBtn')}
              </button>
            )}
          </div>
        </div>
        {(tournamentSport === 'beach_volleyball' || tournamentSport === 'catch_serve') ? (
          <SetBasedScoreEntry
            f={f}
            sport={tournamentSport}
            csSetTarget={f.stages?.age_groups?.cs_set_target ?? 15}
            sets={sets[f.id] ?? emptySetSlots()}
            onSetsChange={newSets => setSets(p => ({ ...p, [f.id]: newSets }))}
            onSave={() => saveScore(f)}
            saving={saving[f.id]}
            hasResult={hasResult}
            isPostponed={isPostponed}
            t={t}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ flex: 1, textAlign: 'right', fontFamily: 'var(--font-heading)', fontSize: '1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.home_team?.name ?? f.home_placeholder}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                <input type="number" min="0" max="99" value={score.home} disabled={isPostponed}
                  onChange={e => { setScores(p => ({ ...p, [f.id]: { ...p[f.id], home: Number(e.target.value) } })); markDirty(f.id) }}
                  style={{ width: '3.5rem', textAlign: 'center', fontSize: '1.5rem', fontFamily: 'var(--font-heading)', padding: '0.5rem 0.25rem', minHeight: '44px', background: 'var(--color-surface)', border: '2px solid var(--color-accent)', color: 'var(--color-text)', borderRadius: '6px' }}
                />
                <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', color: 'var(--color-text-muted)' }}>:</span>
                <input type="number" min="0" max="99" value={score.away} disabled={isPostponed}
                  onChange={e => { setScores(p => ({ ...p, [f.id]: { ...p[f.id], away: Number(e.target.value) } })); markDirty(f.id) }}
                  style={{ width: '3.5rem', textAlign: 'center', fontSize: '1.5rem', fontFamily: 'var(--font-heading)', padding: '0.5rem 0.25rem', minHeight: '44px', background: 'var(--color-surface)', border: '2px solid var(--color-accent)', color: 'var(--color-text)', borderRadius: '6px' }}
                />
              </div>
              <span style={{ flex: 1, fontFamily: 'var(--font-heading)', fontSize: '1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.away_team?.name ?? f.away_placeholder}</span>
            </div>
            {!isPostponed && (
              <button className="btn-primary" style={{ width: '100%' }} onClick={() => saveScore(f)} disabled={saving[f.id]}>
                {saving[f.id] ? t('common.saving') : hasResult ? t('matchday.updateBtn') : t('matchday.saveBtn')}
              </button>
            )}
          </div>
        )}
        {!isPostponed && tournamentSport === 'football' && (
          <div style={{ marginTop: '1rem', borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t('matchday.events')}</div>
            {fixtureEvents.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '0.75rem' }}>
                {fixtureEvents.map(ev => (
                  <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', minWidth: '2.5rem' }}>
                      {ev.team?.name === f.home_team?.name ? '←' : '→'} {ev.minute ? `${ev.minute}'` : ''}
                    </span>
                    <span>{eventLabel(ev)}</span>
                    <button onClick={() => deleteEvent(ev.id, f.id)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', fontSize: '1rem', padding: '0.25rem 0.5rem', minWidth: '44px', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <select value={ef.teamId ?? ''} onChange={e => { setEF(f.id, { teamId: e.target.value, playerId: '' }); loadTeamPlayers(e.target.value) }} style={{ ...inputSx, fontSize: '0.8rem', flex: '1 1 8rem', minWidth: 0 }}>
                <option value="">{t('matchday.eventTeam')}</option>
                {f.home_team && <option value={f.home_team.id}>{f.home_team.name}</option>}
                {f.away_team && <option value={f.away_team.id}>{f.away_team.name}</option>}
              </select>
              <select value={ef.playerId ?? ''} onChange={e => setEF(f.id, { playerId: e.target.value })} style={{ ...inputSx, fontSize: '0.8rem', flex: '2 1 10rem', minWidth: 0 }} disabled={!ef.teamId}>
                <option value="">{t('matchday.eventPlayer')}</option>
                {selectedTeamPlayers.map(p => <option key={p.id} value={p.id}>{p.number ? `#${p.number} ` : ''}{p.name}</option>)}
              </select>
              <select value={ef.eventType ?? ''} onChange={e => setEF(f.id, { eventType: e.target.value })} style={{ ...inputSx, fontSize: '0.8rem', flex: '1 1 7rem', minWidth: 0 }}>
                <option value="">—</option>
                <option value="goal">{t('matchday.eventGoal')}</option>
                <option value="own_goal">{t('matchday.eventOwnGoal')}</option>
                <option value="yellow_card">{t('matchday.eventYellow')}</option>
                <option value="red_card">{t('matchday.eventRed')}</option>
              </select>
              <input type="number" min="1" max="120" placeholder={t('matchday.eventMinute')} value={ef.minute ?? ''} onChange={e => setEF(f.id, { minute: e.target.value })} style={{ ...inputSx, width: '4.5rem', fontSize: '0.8rem', flexShrink: 0 }} />
              <button className="btn-primary btn-sm" style={{ flex: '1 1 auto' }} disabled={!ef.teamId || !ef.eventType || addingEvent[f.id]} onClick={() => addEvent(f)}>
                + {t('matchday.addEvent')}
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <nav className="admin-nav">
        <Link to={backLink} style={{ color: 'var(--color-accent)', textDecoration: 'none', fontFamily: 'var(--font-heading)', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <ArrowLeft size={18} />
          {t('workspace.backToDashboard')}
        </Link>
        <input
          type="date"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          style={inputSx}
        />
      </nav>

      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', marginBottom: '1.25rem' }}>
          {t('matchday.title')}
        </h1>

        {/* Filter bar */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          <select value={filterGroup} onChange={e => setFilterGroup(e.target.value)} style={inputSx}>
            <option value="all">{t('matchday.filterAll')}</option>
            {ageGroupNames.map(name => <option key={name} value={name}>{name}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={inputSx}>
            <option value="all">{t('matchday.filterAll')}</option>
            <option value="pending">{t('matchday.filterPending')}</option>
            <option value="completed">{t('matchday.filterCompleted')}</option>
          </select>
        </div>

        {loading ? (
          <div className="loading">{t('common.loading')}</div>
        ) : filtered.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <p>{t('matchday.noFixtures')}</p>
            <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>{t('matchday.noFixturesHint')}</p>
          </div>
        ) : (
          <>
            {/* Date-filtered fixtures — group stage and knockout, with phase headers */}
            {Object.keys(byGroup).sort().map(agName => {
              const agFx = byGroup[agName]
              const groupStageFx = agFx.filter(f => f.group_label)
              const knockoutFx = agFx.filter(f => !f.group_label)
              const hasBoth = groupStageFx.length > 0 && knockoutFx.length > 0
              const phaseTag = (label, amber) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.875rem' }}>
                  <span style={{
                    background: amber ? 'rgba(240,165,0,0.12)' : 'rgba(255,255,255,0.07)',
                    color: amber ? 'var(--color-accent)' : 'var(--color-text-muted)',
                    fontFamily: 'var(--font-heading)', fontSize: '0.72rem', fontWeight: 700,
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                    padding: '0.2rem 0.65rem', borderRadius: '4px',
                    border: amber ? '1px solid rgba(240,165,0,0.3)' : '1px solid rgba(255,255,255,0.1)',
                    whiteSpace: 'nowrap',
                  }}>{label}</span>
                  <div style={{ flex: 1, height: '1px', background: amber ? 'rgba(240,165,0,0.2)' : 'rgba(255,255,255,0.08)' }} />
                </div>
              )
              return (
                <div key={agName} style={{ marginBottom: '2.5rem' }}>
                  <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: 'var(--color-accent)', marginBottom: '1rem' }}>{agName}</h2>
                  {groupStageFx.length > 0 && (
                    <div style={{ marginBottom: hasBoth ? '1.5rem' : 0 }}>
                      {hasBoth && phaseTag(t('schedule.groupStage'), false)}
                      <div style={{ display: 'grid', gap: '0.75rem' }}>{groupStageFx.map(f => renderFixture(f))}</div>
                    </div>
                  )}
                  {knockoutFx.length > 0 && (
                    <div>
                      {hasBoth && phaseTag(t('schedule.playoffStage'), true)}
                      {(() => {
                        const koRoundMap = knockoutFx.reduce((acc, f) => {
                          const key = f.round ?? 0
                          ;(acc[key] = acc[key] ?? []).push(f)
                          return acc
                        }, {})
                        const koIs3rd = f =>
                          f.round_name === '3rd_place' ||
                          (f.home_placeholder ?? '').includes('Loser') ||
                          (f.away_placeholder ?? '').includes('Loser')
                        const koRoundLabel = ms => {
                          if (ms[0]?.round_name === '3rd_place') return t('playoff.thirdPlace')
                          const n = ms.length
                          return n >= 8 ? `R${n * 2}` : n === 4 ? t('playoff.quarterFinal') : n === 2 ? t('playoff.semiFinal') : t('playoff.final')
                        }
                        const koRoundEntries = Object.entries(koRoundMap)
                          .sort(([a], [b]) => Number(a) - Number(b))
                          .flatMap(([, matches]) => {
                            const third = matches.filter(koIs3rd)
                            const main  = matches.filter(f => !koIs3rd(f))
                            if (third.length > 0 && main.length > 0) {
                              return [{ label: koRoundLabel(third), fx: third }, { label: koRoundLabel(main), fx: main }]
                            }
                            return [{ label: koRoundLabel(matches), fx: matches }]
                          })
                        const showKoLabels = koRoundEntries.length > 1
                        return koRoundEntries.map(({ label, fx }, i) => (
                          <div key={i} style={{ marginBottom: showKoLabels ? '1rem' : 0 }}>
                            {showKoLabels && (
                              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem', paddingLeft: '0.1rem' }}>{label}</div>
                            )}
                            <div style={{ display: 'grid', gap: '0.75rem' }}>{fx.map(f => renderFixture(f))}</div>
                          </div>
                        ))
                      })()}
                    </div>
                  )}
                </div>
              )
            })}

            {/* Playoff fixtures not on today's date — always visible when teams are assigned */}
            {(() => {
              const shownIds = new Set(filtered.map(f => f.id))
              const extraPlayoff = playoffFixtures.filter(f => {
                if (shownIds.has(f.id)) return false
                const ag = f.stages?.age_groups?.name
                if (filterGroup !== 'all' && ag !== filterGroup) return false
                const hasResult = !!f.fixture_results?.[0]
                const isComplete = hasResult || f.status === 'completed'
                if (filterStatus === 'all') return true
                if (filterStatus === 'completed') return isComplete
                if (!isComplete) return true
                return recentCompletedIds.has(f.id)
              })
              if (!extraPlayoff.length) return null
              const byAgPlayoff = extraPlayoff.reduce((acc, f) => {
                const key = f.stages?.age_groups?.name ?? '—'
                ;(acc[key] = acc[key] ?? []).push(f)
                return acc
              }, {})
              return (
                <div style={{ marginTop: filtered.length > 0 ? '2rem' : 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                    <span style={{
                      background: 'rgba(240,165,0,0.12)', color: 'var(--color-accent)',
                      fontFamily: 'var(--font-heading)', fontSize: '0.78rem', fontWeight: 700,
                      letterSpacing: '0.08em', textTransform: 'uppercase',
                      padding: '0.25rem 0.75rem', borderRadius: '4px',
                      border: '1px solid rgba(240,165,0,0.3)', whiteSpace: 'nowrap',
                    }}>
                      {t('schedule.playoffStage')}
                    </span>
                    <div style={{ flex: 1, height: '1px', background: 'rgba(240,165,0,0.2)' }} />
                  </div>
                  {Object.keys(byAgPlayoff).sort().map(agName => {
                    const agFx = byAgPlayoff[agName]
                    const roundMap = agFx.reduce((acc, f) => {
                      const key = f.round ?? 0
                      ;(acc[key] = acc[key] ?? []).push(f)
                      return acc
                    }, {})
                    const is3rd = f =>
                      f.round_name === '3rd_place' ||
                      (f.home_placeholder ?? '').includes('Loser') ||
                      (f.away_placeholder ?? '').includes('Loser')
                    const roundLabel = ms => {
                      if (ms[0]?.round_name === '3rd_place') return t('playoff.thirdPlace')
                      const n = ms.length
                      return n >= 8 ? `R${n * 2}` : n === 4 ? t('playoff.quarterFinal') : n === 2 ? t('playoff.semiFinal') : t('playoff.final')
                    }
                    const roundEntries = Object.entries(roundMap)
                      .sort(([a], [b]) => Number(a) - Number(b))
                      .flatMap(([, matches]) => {
                        const third = matches.filter(is3rd)
                        const main  = matches.filter(f => !is3rd(f))
                        if (third.length > 0 && main.length > 0) {
                          return [{ label: roundLabel(third), fx: third }, { label: roundLabel(main), fx: main }]
                        }
                        return [{ label: roundLabel(matches), fx: matches }]
                      })
                    return (
                      <div key={agName} style={{ marginBottom: '1.5rem' }}>
                        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: 'var(--color-accent)', marginBottom: '0.75rem' }}>{agName}</h2>
                        {roundEntries.map(({ label, fx }, i) => (
                          <div key={i} style={{ marginBottom: '1rem' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem', paddingLeft: '0.1rem' }}>{label}</div>
                            <div style={{ display: 'grid', gap: '0.75rem' }}>{fx.map(f => renderFixture(f))}</div>
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </div>
              )
            })()}

            {/* Bulk save */}
            <div style={{ marginTop: '2rem', textAlign: 'right' }}>
              <button className="btn-primary" onClick={saveAll} disabled={savingAll} style={{ minWidth: '160px' }}>
                {savingAll ? t('common.saving') : t('matchday.saveAll')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
