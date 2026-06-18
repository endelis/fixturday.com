/**
 * Blog post registry.
 * Add new posts here and create their component in ./posts/.
 * Order: newest first.
 */

import WhyExcelFails,    { meta as metaExcel }        from './posts/why-excel-fails-tournament-management'
import HowToOrganize,    { meta as metaOrganize }    from './posts/how-to-organize-a-sports-tournament'
import RoundRobin,        { meta as metaRoundRobin }   from './posts/round-robin-tournament-format'
import KnockoutVsRR,      { meta as metaKnockout }     from './posts/knockout-vs-round-robin'
import FootballSchedule,  { meta as metaSchedule }     from './posts/how-to-make-a-football-tournament-schedule'
import SchoolFootball,    { meta as metaSchool }       from './posts/how-to-organize-a-school-football-tournament'
import FiveASide,         { meta as metaFiveASide }    from './posts/five-a-side-tournament-guide'
import GroupBrackets,     { meta as metaGroupBrackets }  from './posts/how-to-configure-group-stage-brackets'
import BracketSeeding,    { meta as metaSeeding }        from './posts/tournament-bracket-seeding-explained'
import PlayoffDepth,      { meta as metaPlayoffDepth }   from './posts/how-to-choose-tournament-playoff-depth'
import LimitRegistration, { meta as metaLimitReg }       from './posts/how-to-limit-tournament-registration'
import TournamentDuration,{ meta as metaDuration }       from './posts/how-to-estimate-tournament-duration'

export const posts = [
  { ...metaExcel,         Component: WhyExcelFails },
  { ...metaDuration,      Component: TournamentDuration },
  { ...metaLimitReg,      Component: LimitRegistration },
  { ...metaPlayoffDepth,  Component: PlayoffDepth },
  { ...metaSeeding,       Component: BracketSeeding },
  { ...metaGroupBrackets, Component: GroupBrackets },
  { ...metaSchedule,      Component: FootballSchedule },
  { ...metaSchool,        Component: SchoolFootball },
  { ...metaFiveASide,     Component: FiveASide },
  { ...metaOrganize,      Component: HowToOrganize },
  { ...metaRoundRobin,    Component: RoundRobin },
  { ...metaKnockout,      Component: KnockoutVsRR },
]

export function getPost(slug) {
  return posts.find(p => p.slug === slug) ?? null
}
