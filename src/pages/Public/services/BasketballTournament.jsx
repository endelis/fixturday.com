import { Layers, BarChart2, Clock, Smartphone } from 'lucide-react'
import ServiceLanding from '../../../components/ServiceLanding'

const features = [
  {
    icon: <Layers size={22} />,
    title: 'Bracket and group stage support',
    desc: 'Run single-elimination brackets, round-robin leagues, or the classic group stage + knockout used in FIBA tournaments. Switch formats per age group.',
  },
  {
    icon: <BarChart2 size={22} />,
    title: 'Automatic standings',
    desc: 'Win/loss records, points, and tiebreakers calculated in real time after every game entered. No manual counting.',
  },
  {
    icon: <Clock size={22} />,
    title: 'Multi-court scheduling',
    desc: 'Set the number of courts and match duration. Fixturday distributes games across courts automatically, keeping every court busy with no conflicts.',
  },
  {
    icon: <Smartphone size={22} />,
    title: 'Live public scoreboard',
    desc: 'Every tournament gets a shareable URL showing live scores, standings, and the schedule. Coaches and parents follow on their phones — no app needed.',
  },
]

const steps = [
  {
    n: '01',
    title: 'Set up your tournament',
    desc: 'Create a free account, add your tournament details, select Basketball, and create age groups or divisions (e.g. U14, U16, Senior Men, Senior Women).',
  },
  {
    n: '02',
    title: 'Add teams and generate fixtures',
    desc: 'Add teams manually or share the registration link. Select your format and court count. Fixturday generates the full schedule — complete with court assignments — in seconds.',
  },
  {
    n: '03',
    title: 'Enter scores on game day',
    desc: 'Record results from any device as games finish. The bracket and standings update instantly. Share the public link with everyone following along.',
  },
]

const benefits = [
  'Unlimited tournaments and teams — always free',
  'Single elimination, round-robin, and group + playoff formats',
  'Multi-court scheduling with automatic time allocation',
  'Instant standings with wins, losses, and point differential',
  'Online team registration with approval workflow',
  'Public scoreboard for fans and parents — no download required',
]

const faqs = [
  {
    q: 'Can I run a 3x3 basketball tournament with this?',
    a: 'Yes. Fixturday works for any basketball variant — 5-on-5, 3x3, half-court. The scheduling logic handles any team size and any number of courts.',
  },
  {
    q: 'How does the bracket work for an odd number of teams?',
    a: 'For knockout brackets, Fixturday adds byes to the nearest power of 2 (8, 16, 32 teams). The top-seeded teams receive the byes. For round-robin, a rest round is added.',
  },
  {
    q: 'Can I have multiple divisions in one tournament?',
    a: 'Yes. Each tournament supports multiple age groups or divisions, each with its own teams, schedule, and standings. All managed from a single tournament page.',
  },
  {
    q: 'Is there a limit on how many teams I can add?',
    a: 'No hard limit. Fixturday handles tournaments from 4 teams to 64+ teams across multiple divisions.',
  },
  {
    q: 'Can coaches see the schedule before game day?',
    a: 'Yes. Once the schedule is generated, you can share the public tournament link with all participants. The schedule, standings, and live results are all visible in one place.',
  },
]

export default function BasketballTournament() {
  return (
    <ServiceLanding
      seoTitle="Basketball Tournament Software — Free Bracket & Schedule"
      seoDescription="Free basketball tournament management software. Automatic bracket generation, multi-court scheduling, live standings. Supports 5-on-5, 3x3, and all formats."
      path="/basketball-tournament-software"
      eyebrow="Basketball"
      headline="Basketball Tournament Software — Brackets and Schedules in Seconds"
      subheadline="Manage your basketball tournament from registration to final buzzer. Automatic bracket generation, multi-court scheduling, and live standings for every division. Free forever."
      features={features}
      steps={steps}
      benefits={benefits}
      faqs={faqs}
      relatedPost="knockout-vs-round-robin"
      relatedPostTitle="Knockout vs Round Robin: Which Tournament Format Should You Use?"
    />
  )
}
