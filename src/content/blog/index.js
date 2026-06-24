/**
 * Blog post registry.
 * Add new posts here and create their component in ./posts/.
 * Order: newest first.
 */

import RegAutoClose,        { meta as metaRegAutoClose }  from './posts/tournament-registration-auto-close'
import MultiPitch,          { meta as metaMultiPitch }    from './posts/multi-pitch-tournament-scheduling'
import BracketDesign,       { meta as metaBracketDesign } from './posts/tournament-bracket-design'
import PublicSchedulePage,  { meta as metaPublicSchedule }from './posts/tournament-public-schedule-page'
import TournamentInfoPage,  { meta as metaInfoPage }      from './posts/tournament-info-page'
import FreeSoftwareGuide,   { meta as metaFreeSoftware }  from './posts/free-tournament-management-software-guide'
import FootballFormats,  { meta as metaFootballFormats } from './posts/football-tournament-formats'
import BvbFormats,       { meta as metaBvbFormats }    from './posts/beach-volleyball-tournament-formats'
import BvbDe,            { meta as metaBvbDe }         from './posts/beach-volleyball-double-elimination-bracket'
import BvbOrganise,      { meta as metaBvbOrganise }  from './posts/how-to-organize-a-beach-volleyball-tournament'
import BvbScoring,       { meta as metaBvbScoring }   from './posts/beach-volleyball-scoring-rules'
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
  { ...metaRegAutoClose,    Component: RegAutoClose },
  { ...metaMultiPitch,      Component: MultiPitch },
  { ...metaBracketDesign,   Component: BracketDesign },
  { ...metaPublicSchedule,  Component: PublicSchedulePage },
  { ...metaInfoPage,        Component: TournamentInfoPage },
  { ...metaFreeSoftware,    Component: FreeSoftwareGuide },
  { ...metaFootballFormats, Component: FootballFormats },
  { ...metaBvbFormats,      Component: BvbFormats },
  { ...metaBvbDe,           Component: BvbDe },
  { ...metaBvbOrganise,     Component: BvbOrganise },
  { ...metaBvbScoring,      Component: BvbScoring },
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
