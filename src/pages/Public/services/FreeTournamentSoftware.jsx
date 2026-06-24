import { Zap, BarChart2, Users, Smartphone } from 'lucide-react'
import ServiceLanding from '../../../components/ServiceLanding'

const features = [
  {
    icon: <Zap size={22} />,
    title: 'Automatic schedule generation',
    desc: 'Set your teams, format, and pitches. Fixturday generates the full match schedule in seconds — no spreadsheets, no manual calculation.',
  },
  {
    icon: <BarChart2 size={22} />,
    title: 'Real-time standings',
    desc: 'Standings, brackets, and results update the moment a score is entered. Every participant sees the live table from the public tournament page.',
  },
  {
    icon: <Users size={22} />,
    title: 'Online team registration',
    desc: 'Open self-registration for your tournament. Teams apply online, you approve from the admin panel. No paper forms, no WhatsApp chaos.',
  },
  {
    icon: <Smartphone size={22} />,
    title: 'Works on any device',
    desc: "Organizer tools work on desktop or phone. The public page works on any device without a login. Built for game day in a muddy car park with bad Wi-Fi.",
  },
]

const steps = [
  {
    n: '01',
    title: 'Create a free account',
    desc: 'Sign up at fixturday.com — no credit card, no trial period, no hidden limits. Your first tournament is ready in under 5 minutes.',
  },
  {
    n: '02',
    title: 'Build your tournament',
    desc: 'Add divisions, teams, venues, and pitches. Choose your format. Generate the full fixture schedule automatically.',
  },
  {
    n: '03',
    title: 'Run the event and share results',
    desc: 'Enter results from any device during the event. Share the public tournament link with all participants — they follow live standings and the schedule in real time.',
  },
]

const benefits = [
  'No credit card required — free to start, no trial period',
  'Unlimited tournaments, teams, and divisions',
  'Round-robin, knockout, and group stage + playoff formats',
  'Multi-pitch and multi-venue scheduling',
  'Real-time standings with automatic tiebreaker calculation',
  'Public tournament page for participants — no app needed',
  'Player roster management per team',
  'Print-ready schedule and bracket',
]

const faqs = [
  {
    q: 'Is Fixturday really free?',
    a: 'Yes. Fixturday is free for tournament organizers. There are no plans, no credit card required, and no feature limits on the free tier. We plan to introduce optional paid features for professional organizers in the future, but the core product will always be free.',
  },
  {
    q: 'What sports does it support?',
    a: 'Football and futsal, in three formats: round-robin (league), knockout (cup), and group stage + knockout.',
  },
  {
    q: 'How is Fixturday different from other free tournament software?',
    a: 'Most free options are outdated bracket generators with no real tournament management. Fixturday gives you the full workflow: registration, scheduling, score entry, live standings, and a public participant page — all in one tool, without ads or feature gates.',
  },
  {
    q: 'Can I manage multiple tournaments at once?',
    a: 'Yes. Your dashboard shows all your tournaments. Each has its own teams, schedule, standings, and public page. No limit on how many you run simultaneously.',
  },
  {
    q: 'Does it work for large tournaments (32+ teams)?',
    a: 'Yes. Fixturday handles large tournaments with multiple divisions. A national-level tournament with 8 divisions of 16 teams each is well within its scope.',
  },
  {
    q: 'Do participants need to create accounts?',
    a: 'No. Participants access the public tournament page (schedule, standings, results) without any login. Only tournament organizers need an account.',
  },
]

export default function FreeTournamentSoftware() {
  return (
    <ServiceLanding
      seoTitle="Free Tournament Management Software — No Credit Card"
      seoDescription="Free tournament management software for any sport. Unlimited tournaments, auto-generated schedules, live standings. No credit card required."
      path="/free-tournament-software"
      eyebrow="Free Tournament Software"
      headline="Free Tournament Management Software — No Credit Card, No Limits"
      subheadline="Everything you need to organize a sports tournament — schedule generation, live standings, online registration, and a public participant page. Completely free, no strings attached."
      features={features}
      steps={steps}
      benefits={benefits}
      faqs={faqs}
      relatedPost="how-to-organize-a-sports-tournament"
      relatedPostTitle="How to Organize a Sports Tournament: The Complete Guide"
    />
  )
}
