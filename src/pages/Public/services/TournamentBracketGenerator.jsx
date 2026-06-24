import { Zap, BarChart2, Users, Printer } from 'lucide-react'
import ServiceLanding from '../../../components/ServiceLanding'

const features = [
  {
    icon: <Zap size={22} />,
    title: 'Instant bracket generation',
    desc: 'Enter your teams, pick knockout or group stage format, click generate. A complete tournament bracket is ready in under 10 seconds — no manual seeding required.',
  },
  {
    icon: <BarChart2 size={22} />,
    title: 'Live bracket updates',
    desc: 'As match results are entered, the bracket updates automatically. Winners advance, losers are eliminated — the bracket always reflects the current state.',
  },
  {
    icon: <Users size={22} />,
    title: 'Any number of teams',
    desc: 'Brackets for 4, 8, 16, 32 teams and any non-power-of-2 count. Byes are added automatically and distributed to top seeds.',
  },
  {
    icon: <Printer size={22} />,
    title: 'Print-ready bracket',
    desc: 'Print the full bracket in one click. Clean layout designed for A4 paper — perfect to post at the venue alongside the schedule.',
  },
]

const steps = [
  {
    n: '01',
    title: 'Enter your teams',
    desc: 'Add team names manually or let teams register themselves online. Works for 4 to 64+ teams across multiple divisions.',
  },
  {
    n: '02',
    title: 'Choose bracket type and generate',
    desc: 'Select knockout (single elimination) or group stage + knockout. Fixturday seeds the bracket, handles byes, and generates the full fixture list instantly.',
  },
  {
    n: '03',
    title: 'Update results and share',
    desc: 'Enter scores on your phone or laptop as matches finish. The live bracket is available at a public URL — share it with all participants.',
  },
]

const benefits = [
  'Single elimination, double round-robin, and group + knockout',
  'Automatic bye placement for non-power-of-2 team counts',
  'Bracket updates in real time as results are entered',
  'Shareable public URL — no app or login needed for viewers',
  'Print-ready bracket layout included',
  'Completely free — no credit card, no ads',
]

const faqs = [
  {
    q: 'Can I generate a tournament bracket for any number of teams?',
    a: 'Yes. Fixturday handles any number of teams. For knockout brackets, it automatically fills the bracket to the nearest power of 2 by adding byes. For round-robin, it handles odd team counts with a rest round.',
  },
  {
    q: 'What sports does the bracket generator support?',
    a: 'Football and futsal tournaments. The bracket supports knockout (single-elimination) and the knockout phase of group stage + knockout events.',
  },
  {
    q: 'Can I see the bracket on my phone?',
    a: 'Yes. The public tournament page — which includes the bracket, schedule, and standings — is fully mobile-responsive. Participants can follow the bracket from any device without logging in.',
  },
  {
    q: 'Is there a printable bracket?',
    a: 'Yes. There is a print view that renders the bracket and schedule in a clean format optimised for A4 paper. Access it from the tournament admin panel.',
  },
  {
    q: 'How does seeding work?',
    a: 'By default, teams are seeded by registration order. You can reorder them in the team management panel before generating the bracket to manually control seeding.',
  },
  {
    q: 'Can I run a double-elimination bracket?',
    a: 'Currently Fixturday supports single elimination, round-robin, and group stage + single elimination. Double elimination is on the roadmap.',
  },
]

export default function TournamentBracketGenerator() {
  return (
    <ServiceLanding
      seoTitle="Tournament Bracket Generator — Free, Online, Any Sport"
      seoDescription="Free tournament bracket generator. Knockout, round-robin, and group stage formats. Instant brackets for 4 to 64+ teams with live result updates."
      path="/tournament-bracket-generator"
      eyebrow="Bracket Generator"
      headline="Tournament Bracket Generator — Free for Any Sport"
      subheadline="Generate a complete tournament bracket in seconds. Knockout, round-robin, or group stage. Handles any number of teams, updates live as results come in, and includes a printable view."
      features={features}
      steps={steps}
      benefits={benefits}
      faqs={faqs}
      relatedPost="knockout-vs-round-robin"
      relatedPostTitle="Knockout vs Round Robin: Which Format Should You Choose?"
    />
  )
}
