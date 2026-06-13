/**
 * Blog post registry.
 * Add new posts here and create their component in ./posts/.
 * Order: newest first.
 */

import HowToOrganize,    { meta as metaOrganize }    from './posts/how-to-organize-a-sports-tournament'
import RoundRobin,        { meta as metaRoundRobin }   from './posts/round-robin-tournament-format'
import KnockoutVsRR,      { meta as metaKnockout }     from './posts/knockout-vs-round-robin'
import FootballSchedule,  { meta as metaSchedule }     from './posts/how-to-make-a-football-tournament-schedule'
import SchoolFootball,    { meta as metaSchool }       from './posts/how-to-organize-a-school-football-tournament'
import FiveASide,         { meta as metaFiveASide }    from './posts/five-a-side-tournament-guide'

export const posts = [
  { ...metaSchedule,   Component: FootballSchedule },
  { ...metaSchool,     Component: SchoolFootball },
  { ...metaFiveASide,  Component: FiveASide },
  { ...metaOrganize,   Component: HowToOrganize },
  { ...metaRoundRobin, Component: RoundRobin },
  { ...metaKnockout,   Component: KnockoutVsRR },
]

export function getPost(slug) {
  return posts.find(p => p.slug === slug) ?? null
}
