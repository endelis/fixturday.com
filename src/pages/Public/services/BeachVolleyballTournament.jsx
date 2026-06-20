import { Trophy, Activity, Users, Smartphone } from 'lucide-react'
import ServiceLanding from '../../../components/ServiceLanding'

const features = [
  {
    icon: <Trophy size={22} />,
    title: 'Double elimination bracket',
    desc: 'Full double elimination with winners and losers brackets generated automatically. Teams that lose once drop to the losers side — no team is out after a single bad game.',
  },
  {
    icon: <Activity size={22} />,
    title: 'Built-in beach volleyball scoring',
    desc: 'Set 1 and 2 to 21 points, deciding set to 15 — win by 2 in all sets. Enter scores set by set. The system validates the result and rejects impossible scores before saving.',
  },
  {
    icon: <Users size={22} />,
    title: 'Set ratio and point ratio standings',
    desc: 'Standings are ranked by match wins, then set ratio (sets won / sets played), then point ratio (points won / points played) — exactly how beach volleyball pools are decided.',
  },
  {
    icon: <Smartphone size={22} />,
    title: 'Live bracket on any device',
    desc: 'The public bracket view updates in real time as results are entered. Players check their next match on their phone — no app, no login, no printing required.',
  },
]

const steps = [
  {
    n: '01',
    title: 'Create tournament and select Beach Volleyball',
    desc: 'Sign up free, create a tournament, and choose Beach Volleyball as the sport. Add your divisions (Men, Women, Mixed, U18, etc.) — each gets its own bracket and standings.',
  },
  {
    n: '02',
    title: 'Add teams and choose your format',
    desc: 'Add teams manually or open online registration. Choose double elimination for the main bracket or round robin for pool play. Fixtures are generated in one click.',
  },
  {
    n: '03',
    title: 'Enter set scores on match day',
    desc: 'Open the matchday board on your phone. Enter scores set by set — the system calculates winners, updates the bracket, and advances teams automatically.',
  },
]

const benefits = [
  'FIVB-compliant scoring: sets 1–2 to 21, deciding set to 15, win by 2',
  'Double elimination bracket with full winners and losers sides',
  'Set ratio and point ratio tiebreakers for pool standings',
  'Real-time bracket view for players and spectators',
  'Online team registration with organiser approval',
  'Multi-division support — one tournament, multiple pools and brackets',
  'Free forever — no subscription, no credit card',
]

const faqs = [
  {
    q: 'Is this beach volleyball tournament software free?',
    a: 'Yes. Fixturday is completely free for tournament organizers. You can run unlimited beach volleyball tournaments with unlimited teams, brackets, and divisions at no cost.',
  },
  {
    q: 'What scoring rules does it follow?',
    a: 'Fixturday follows FIVB beach volleyball rules: Sets 1 and 2 are played to 21 points, the deciding set (if needed) is played to 15 points, and all sets must be won by at least 2 points. The system enforces these rules and rejects invalid scores.',
  },
  {
    q: 'What tournament formats are supported for beach volleyball?',
    a: 'Fixturday supports double elimination (full WB/LB bracket with grand final and bracket reset) and round robin (pool play with set ratio and point ratio standings). You can combine them by using multiple divisions.',
  },
  {
    q: 'How are standings calculated in beach volleyball pool play?',
    a: 'Teams are ranked first by match wins, then by set ratio (sets won divided by sets played), then by point ratio (total points won divided by total points played). This matches standard beach volleyball pool ranking rules.',
  },
  {
    q: 'Can I run multiple pools in one tournament?',
    a: 'Yes. Each division in Fixturday is a separate pool with its own teams, schedule, and standings. Create as many divisions as you need — Mixed Open, Women, U18, etc. — all managed inside one tournament.',
  },
  {
    q: 'Does double elimination include the bracket reset?',
    a: 'Yes. The Grand Final is two matches: the WB finalist vs the LB finalist. If the LB side wins, a Grand Final Reset is played. The system tracks both and marks the tournament champion when either match concludes.',
  },
]

export default function BeachVolleyballTournament() {
  return (
    <ServiceLanding
      seoTitle="Beach Volleyball Tournament Software — Free & Online"
      seoDescription="Free beach volleyball tournament software with double elimination brackets and set-by-set scoring. FIVB rules built in (21/21/15, win by 2). Live standings with set ratio and point ratio. Free forever."
      path="/beach-volleyball-tournament-software"
      eyebrow="Beach Volleyball"
      headline="Beach Volleyball Tournament Software — Free and Instant"
      subheadline="Generate double elimination brackets, enter set-by-set scores, and track live standings with set ratio and point ratio. Built for beach volleyball organizers. Free forever."
      features={features}
      steps={steps}
      benefits={benefits}
      faqs={faqs}
      relatedPost="how-to-organize-a-sports-tournament"
      relatedPostTitle="How to Organize a Sports Tournament: The Complete Guide"
    />
  )
}
