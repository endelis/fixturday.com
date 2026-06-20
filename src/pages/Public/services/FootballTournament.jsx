import { Calendar, BarChart2, Users, Smartphone } from 'lucide-react'
import ServiceLanding from '../../../components/ServiceLanding'

const features = [
  {
    icon: <Calendar size={22} />,
    title: 'Automatic fixture generation',
    desc: 'Enter team names, set match duration and number of pitches — the full round-robin or knockout schedule is generated in seconds. No spreadsheets.',
  },
  {
    icon: <BarChart2 size={22} />,
    title: 'Live standings table',
    desc: 'Standings update the moment you enter a result. Points, goal difference, goals scored — all calculated automatically with proper tiebreaker rules.',
  },
  {
    icon: <Users size={22} />,
    title: 'Online team registration',
    desc: 'Share a registration link. Teams sign up themselves. You approve or reject applications from the admin panel. No forms, no email chains.',
  },
  {
    icon: <Smartphone size={22} />,
    title: 'Public page for participants',
    desc: 'Every tournament gets a public URL. Players and parents follow live scores and the schedule from any phone — no app download needed.',
  },
]

const steps = [
  {
    n: '01',
    title: 'Create your tournament',
    desc: 'Sign up free, create a tournament, set the sport to Football, add your divisions (U10, U12, Open, etc.) and venue details.',
  },
  {
    n: '02',
    title: 'Add teams and generate the schedule',
    desc: 'Add teams manually or open online registration. Choose round-robin, knockout, or group stage format. Generate the full fixture list in one click.',
  },
  {
    n: '03',
    title: 'Run match day',
    desc: 'Enter scores as matches finish. Standings and brackets update live. Share the public link so everyone follows in real time.',
  },
]

const benefits = [
  'Unlimited tournaments, divisions, and teams',
  'Round-robin, knockout, and group stage formats',
  'Multi-pitch scheduling with automatic time slots',
  'Real-time standings with goal difference tiebreakers',
  'Player roster management per team',
  'No app required for participants — works in any browser',
]

const faqs = [
  {
    q: 'Is this football tournament software free?',
    a: 'Yes. Fixturday is completely free for tournament organizers. You can create unlimited football tournaments, add unlimited teams, and use all features at no cost.',
  },
  {
    q: 'What football tournament formats are supported?',
    a: 'Fixturday supports round-robin (every team plays every other team), knockout/cup (single elimination), and group stage + knockout (groups followed by a playoff bracket). All three are standard in grassroots and amateur football.',
  },
  {
    q: 'Can I run a football tournament with multiple divisions?',
    a: 'Yes. Each tournament can have multiple divisions (e.g. U10, U12, U14, Open). Each division has its own teams, schedule, and standings. All managed from one tournament.',
  },
  {
    q: 'How does the schedule handle odd numbers of teams?',
    a: "Fixturday automatically adds a bye to make the count even. The team that gets a bye in any round has a rest that round. This is handled without any input from you.",
  },
  {
    q: 'Can teams register themselves online?',
    a: 'Yes. You can open public registration for any division. Teams get a registration link, fill in their details, and you approve or reject from the admin panel.',
  },
  {
    q: 'Does it work for futsal (indoor football) too?',
    a: 'Absolutely. Fixturday works for any football variant — 11-a-side, 7-a-side, 5-a-side, and futsal. The format and scheduling logic is the same regardless of team size.',
  },
]

export default function FootballTournament() {
  return (
    <ServiceLanding
      seoTitle="Football Tournament Software — Free & Online"
      seoDescription="Free football tournament management software. Generate fixtures automatically, track live standings, run online registration. Supports all formats: round-robin, knockout, group stage."
      path="/football-tournament-software"
      eyebrow="Football"
      headline="Football Tournament Software — Free and Instant"
      subheadline="Generate fixtures, track live standings, and manage team registration for any football tournament. Works for 5-a-side, 7-a-side, 11-a-side, and futsal. Free forever."
      features={features}
      steps={steps}
      benefits={benefits}
      faqs={faqs}
      relatedPost="how-to-organize-a-sports-tournament"
      relatedPostTitle="How to Organize a Sports Tournament: The Complete Guide"
    />
  )
}
