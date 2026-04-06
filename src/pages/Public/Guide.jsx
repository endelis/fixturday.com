import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CheckCircle, AlertTriangle, Lightbulb } from 'lucide-react'
import PublicNav from '../../components/PublicNav'
import Footer from '../../components/Footer'

// ── HowTo JSON-LD ─────────────────────────────────────────────────
const HOWTO_LD = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'Kā organizēt sporta turnīru ar Fixturday',
  description: 'Soli pa solim pamācība sporta turnīra izveidošanai, grafika ģenerēšanai un spēļu dienas vadīšanai.',
  totalTime: 'PT10M',
  estimatedCost: { '@type': 'MonetaryAmount', currency: 'EUR', value: '0' },
  tool: { '@type': 'HowToTool', name: 'Fixturday — fixturday.com' },
  step: [
    {
      '@type': 'HowToSection',
      name: 'Reģistrācija un turnīra izveide',
      itemListElement: [
        {
          '@type': 'HowToStep',
          position: 1,
          name: 'Izveido kontu',
          text: 'Apmeklē fixturday.com/admin/register un reģistrējies ar e-pastu un paroli.',
        },
        {
          '@type': 'HowToStep',
          position: 2,
          name: 'Izveido turnīru',
          text: "Noklikšķini uz '+ Jauns turnīrs', aizpildi nosaukumu, sporta veidu, datumu un norises vietu.",
        },
      ],
    },
    {
      '@type': 'HowToSection',
      name: 'Komandas un grafiks',
      itemListElement: [
        {
          '@type': 'HowToStep',
          position: 3,
          name: 'Pievieno komandas',
          text: 'Pievieno komandas manuāli vai atver publisku reģistrāciju.',
        },
        {
          '@type': 'HowToStep',
          position: 4,
          name: 'Ģenerē spēļu grafiku',
          text: 'Izvēlies formātu, norādi laukumu skaitu un spēles ilgumu. Grafiks tiek ģenerēts sekundēs.',
        },
      ],
    },
    {
      '@type': 'HowToSection',
      name: 'Spēļu diena',
      itemListElement: [
        {
          '@type': 'HowToStep',
          position: 5,
          name: 'Ievadi rezultātus',
          text: 'Izmanto Rezultātu reģistru, lai ievadītu rezultātus. Tabula atjaunojas automātiski.',
        },
      ],
    },
  ],
}

// ── Sub-components ────────────────────────────────────────────────

function TipBox({ children, variant = 'tip' }) {
  const isWarning = variant === 'warning'
  return (
    <div style={{
      borderLeft: `3px solid ${isWarning ? '#f0a500' : '#f0a500'}`,
      background: isWarning ? 'rgba(240,165,0,0.06)' : 'rgba(240,165,0,0.05)',
      borderRadius: '0 8px 8px 0',
      padding: '0.875rem 1.125rem',
      marginTop: '1.25rem',
      display: 'flex',
      gap: '0.625rem',
      alignItems: 'flex-start',
    }}>
      {isWarning
        ? <AlertTriangle size={16} style={{ color: '#f0a500', flexShrink: 0, marginTop: '2px' }} />
        : <Lightbulb size={16} style={{ color: '#f0a500', flexShrink: 0, marginTop: '2px' }} />
      }
      <p style={{ color: '#c8d4e0', fontSize: '0.875rem', lineHeight: 1.65, margin: 0 }}>
        {children}
      </p>
    </div>
  )
}

function SectionHeading({ id, number, title }) {
  return (
    <h2
      id={id}
      style={{
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: 'clamp(1.6rem, 3vw, 2rem)',
        fontWeight: 700,
        color: '#ffffff',
        marginBottom: '1.25rem',
        paddingTop: '0.5rem',
        display: 'flex',
        alignItems: 'baseline',
        gap: '0.625rem',
      }}
    >
      <span style={{ color: 'rgba(240,165,0,0.4)', fontSize: '1.1em' }}>{number}.</span>
      {title}
    </h2>
  )
}

function MockCard({ children, style }) {
  return (
    <div style={{
      background: '#111e35',
      border: '1px solid #1e3a5f',
      borderRadius: '12px',
      padding: '1.5rem',
      marginTop: '1.25rem',
      ...style,
    }}>
      {children}
    </div>
  )
}

function MockField({ label, placeholder, type = 'text' }) {
  return (
    <div style={{ marginBottom: '0.875rem' }}>
      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#8892a4', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </label>
      <div style={{
        background: '#0d1b2e',
        border: '1px solid #1e3a5f',
        borderRadius: '6px',
        padding: '0.6rem 0.875rem',
        color: '#3a506b',
        fontSize: '0.875rem',
        fontStyle: 'italic',
      }}>
        {placeholder}
      </div>
    </div>
  )
}

function MockButton({ children, secondary }) {
  return (
    <button style={{
      width: '100%',
      padding: '0.7rem 1rem',
      borderRadius: '7px',
      border: secondary ? '1px solid #1e3a5f' : 'none',
      background: secondary ? 'transparent' : '#f0a500',
      color: secondary ? '#8892a4' : '#0a1628',
      fontWeight: 700,
      fontSize: '0.9rem',
      cursor: 'default',
      marginTop: secondary ? '0.5rem' : 0,
    }}>
      {children}
    </button>
  )
}

function MockScheduleRow({ time, pitch, home, away, completed }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '3.5rem 5.5rem 1fr 3rem 1fr',
      gap: '0.5rem',
      alignItems: 'center',
      padding: '0.5rem 0',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
      fontSize: '0.8125rem',
    }}>
      <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, color: '#f0a500' }}>{time}</span>
      <span style={{ color: '#3a506b', fontSize: '0.75rem' }}>{pitch}</span>
      <span style={{ color: '#c8d4e0', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{home}</span>
      <span style={{ color: '#3a506b', textAlign: 'center', fontWeight: 700 }}>{completed ? '2 : 1' : 'vs'}</span>
      <span style={{ color: '#c8d4e0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{away}</span>
    </div>
  )
}

function RegistrationFlowDiagram({ t }) {
  const steps = [
    { label: t('guide.flowStep1'), sub: t('guide.flowStep1Sub'), accent: false },
    { label: t('guide.flowStep2'), sub: t('guide.flowStep2Sub'), accent: false },
    { label: t('guide.flowStep3'), sub: t('guide.flowStep3Sub'), accent: true },
    { label: t('guide.flowStep4'), sub: t('guide.flowStep4Sub'), accent: true },
  ]
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 0,
      flexWrap: 'wrap',
      marginTop: '1.25rem',
      background: '#111e35',
      border: '1px solid #1e3a5f',
      borderRadius: '10px',
      padding: '1.25rem',
      overflowX: 'auto',
    }}>
      {steps.map((s, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', flex: '1 0 auto' }}>
          <div style={{
            textAlign: 'center',
            padding: '0.625rem 0.875rem',
            borderRadius: '8px',
            background: s.accent ? 'rgba(240,165,0,0.1)' : '#0d1b2e',
            border: `1px solid ${s.accent ? 'rgba(240,165,0,0.3)' : '#1e3a5f'}`,
            minWidth: '100px',
          }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: s.accent ? '#f0a500' : '#c8d4e0', whiteSpace: 'nowrap' }}>{s.label}</div>
            <div style={{ fontSize: '0.7rem', color: '#3a506b', marginTop: '0.2rem', whiteSpace: 'nowrap' }}>{s.sub}</div>
          </div>
          {i < steps.length - 1 && (
            <div style={{ padding: '0 0.375rem', color: '#1e3a5f', fontSize: '1.1rem', flexShrink: 0 }}>→</div>
          )}
        </div>
      ))}
    </div>
  )
}

function FAQItem({ question, answer }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          background: 'none',
          border: 'none',
          padding: '1rem 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: '1.125rem',
          fontWeight: 600,
          color: '#e0e8f4',
        }}>
          {question}
        </span>
        <span style={{
          color: '#f0a500',
          fontSize: '1.25rem',
          lineHeight: 1,
          flexShrink: 0,
          transition: 'transform 200ms',
          transform: open ? 'rotate(45deg)' : 'none',
          display: 'inline-block',
        }}>+</span>
      </button>
      {open && (
        <p style={{
          color: '#8892a4',
          lineHeight: 1.7,
          fontSize: '0.9375rem',
          paddingBottom: '1rem',
          margin: 0,
        }}>
          {answer}
        </p>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────
export default function Guide() {
  const { t } = useTranslation()
  const [activeSection, setActiveSection] = useState('registracija')
  const contentRef = useRef(null)

  // ── Meta + JSON-LD ─────────────────────────────────────────────
  useEffect(() => {
    document.title = t('guide.pageTitle')
    const metaDesc = document.querySelector('meta[name="description"]')
    if (metaDesc) metaDesc.setAttribute('content', t('guide.metaDesc'))

    const script = document.createElement('script')
    script.id = 'ld-howto'
    script.type = 'application/ld+json'
    script.textContent = JSON.stringify(HOWTO_LD)
    document.head.appendChild(script)
    return () => document.getElementById('ld-howto')?.remove()
  }, [t])

  // ── Intersection Observer for TOC highlight ────────────────────
  useEffect(() => {
    const sections = document.querySelectorAll('section[id]')
    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
          }
        }
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: 0 }
    )
    sections.forEach(s => observer.observe(s))
    return () => observer.disconnect()
  }, [])

  const TOC_ITEMS = [
    { id: 'registracija',   label: t('guide.toc1') },
    { id: 'turnira-izveide', label: t('guide.toc2') },
    { id: 'vecuma-grupas',  label: t('guide.toc3') },
    { id: 'vietas',         label: t('guide.toc4') },
    { id: 'komandas',       label: t('guide.toc5') },
    { id: 'grafiks',        label: t('guide.toc6') },
    { id: 'spelu-diena',    label: t('guide.toc7') },
    { id: 'publiska-lapa',  label: t('guide.toc8') },
  ]

  const FAQ_ITEMS = [
    { q: t('guide.faq1Q'), a: t('guide.faq1A') },
    { q: t('guide.faq2Q'), a: t('guide.faq2A') },
    { q: t('guide.faq3Q'), a: t('guide.faq3A') },
    { q: t('guide.faq4Q'), a: t('guide.faq4A') },
    { q: t('guide.faq5Q'), a: t('guide.faq5A') },
  ]

  return (
    <div style={{ background: '#0a1628', color: '#e0e8f4', fontFamily: "'Inter', sans-serif", minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <PublicNav />

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(180deg, #0d1b2e 0%, #0a1628 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '3.5rem 1.5rem 3rem',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          {/* Pill */}
          <div style={{
            display: 'inline-block',
            border: '1px solid rgba(240,165,0,0.35)',
            borderRadius: '999px',
            padding: '0.25rem 0.875rem',
            fontSize: '0.72rem',
            color: '#f0a500',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            fontWeight: 700,
            marginBottom: '1.25rem',
          }}>
            {t('guide.pill')}
          </div>

          <h1 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 'clamp(2.25rem, 6vw, 3.25rem)',
            fontWeight: 700,
            color: '#ffffff',
            lineHeight: 1.08,
            marginBottom: '1rem',
            letterSpacing: '-0.01em',
          }}>
            {t('guide.heroTitle')}
          </h1>

          <p style={{
            fontSize: 'clamp(0.9375rem, 2vw, 1.0625rem)',
            color: '#8892a4',
            lineHeight: 1.65,
            marginBottom: '2.25rem',
            maxWidth: '540px',
            margin: '0 auto 2.25rem',
          }}>
            {t('guide.heroSubtitle')}
          </p>

          {/* Quick stats */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '0',
            flexWrap: 'wrap',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '12px',
            overflow: 'hidden',
            maxWidth: '480px',
            margin: '0 auto',
          }}>
            {[
              { value: t('guide.stat1Value'), label: t('guide.stat1Label') },
              { value: t('guide.stat2Value'), label: t('guide.stat2Label') },
              { value: t('guide.stat3Value'), label: t('guide.stat3Label') },
            ].map((s, i) => (
              <div key={i} style={{
                flex: '1 1 0',
                padding: '1rem 0.5rem',
                textAlign: 'center',
                borderRight: i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                minWidth: '80px',
              }}>
                <div style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: '1.75rem',
                  fontWeight: 700,
                  color: '#f0a500',
                  lineHeight: 1,
                  marginBottom: '0.2rem',
                }}>
                  {s.value}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#8892a4' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Body: sidebar + content ────────────────────────────────── */}
      <div style={{ flex: 1 }} ref={contentRef}>
        <div className="guide-layout" style={{ maxWidth: '1100px', margin: '0 auto', padding: '3rem 1.5rem 5rem' }}>

          {/* Sticky TOC sidebar */}
          <aside className="guide-toc">
            <nav aria-label={t('guide.tocTitle')}>
              <p style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#3a506b',
                marginBottom: '0.875rem',
              }}>
                {t('guide.tocTitle')}
              </p>
              {TOC_ITEMS.map(item => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  style={{
                    display: 'block',
                    padding: '0.425rem 0.625rem',
                    borderLeft: `2px solid ${activeSection === item.id ? '#f0a500' : 'transparent'}`,
                    color: activeSection === item.id ? '#f0a500' : '#3a506b',
                    fontSize: '0.8125rem',
                    textDecoration: 'none',
                    marginBottom: '0.125rem',
                    borderRadius: '0 4px 4px 0',
                    background: activeSection === item.id ? 'rgba(240,165,0,0.05)' : 'transparent',
                    transition: 'color 150ms, border-color 150ms',
                    fontWeight: activeSection === item.id ? 600 : 400,
                  }}
                  onClick={e => {
                    e.preventDefault()
                    document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }}
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </aside>

          {/* Main content */}
          <main style={{ minWidth: 0 }}>

            {/* ── Section 1: Reģistrācija ──────────────────────────── */}
            <section id="registracija" style={sectionStyle}>
              <SectionHeading id="s1" number="1" title={t('guide.s1Title')} />
              <p style={bodyText}>{t('guide.s1Body')}</p>

              <MockCard>
                <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginBottom: '1.25rem' }}>
                  {t('guide.mockRegHeading')}
                </p>
                <MockField label={t('guide.mockEmail')} placeholder="janis@piemers.lv" />
                <MockField label={t('guide.mockPassword')} placeholder="••••••••" type="password" />
                <MockButton>{t('guide.mockRegBtn')}</MockButton>
                <MockButton secondary>{t('guide.mockLoginLink')}</MockButton>
              </MockCard>

              <TipBox>{t('guide.s1Tip')}</TipBox>
            </section>

            {/* ── Section 2: Turnīra izveide ───────────────────────── */}
            <section id="turnira-izveide" style={sectionStyle}>
              <SectionHeading id="s2" number="2" title={t('guide.s2Title')} />
              <p style={bodyText}>{t('guide.s2Body')}</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', margin: '1.25rem 0' }}>
                {[
                  { field: t('guide.s2f1'), desc: t('guide.s2f1Desc') },
                  { field: t('guide.s2f2'), desc: t('guide.s2f2Desc') },
                  { field: t('guide.s2f3'), desc: t('guide.s2f3Desc') },
                  { field: t('guide.s2f4'), desc: t('guide.s2f4Desc') },
                  { field: t('guide.s2f5'), desc: t('guide.s2f5Desc') },
                  { field: t('guide.s2f6'), desc: t('guide.s2f6Desc') },
                ].map((item, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    gap: '0.75rem',
                    background: '#111e35',
                    border: '1px solid #1e3a5f',
                    borderRadius: '8px',
                    padding: '0.75rem 1rem',
                  }}>
                    <span style={{ fontWeight: 700, color: '#f0a500', fontSize: '0.875rem', flexShrink: 0, minWidth: '110px' }}>{item.field}</span>
                    <span style={{ color: '#8892a4', fontSize: '0.875rem', lineHeight: 1.5 }}>{item.desc}</span>
                  </div>
                ))}
              </div>

              <TipBox>{t('guide.s2Tip')}</TipBox>
            </section>

            {/* ── Section 3: Vecuma grupas ─────────────────────────── */}
            <section id="vecuma-grupas" style={sectionStyle}>
              <SectionHeading id="s3" number="3" title={t('guide.s3Title')} />
              <p style={bodyText}>{t('guide.s3Body')}</p>

              <div style={{ overflowX: 'auto', marginTop: '1.25rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ background: '#111e35' }}>
                      {[t('guide.tableFormat'), t('guide.tableFor'), t('guide.tableTeams')].map((h, i) => (
                        <th key={i} style={{ padding: '0.75rem 1rem', textAlign: 'left', color: '#8892a4', fontWeight: 600, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #1e3a5f', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      [t('guide.fmtRR'), t('guide.fmtRRFor'), t('guide.fmtRRTeams')],
                      [t('guide.fmtKO'), t('guide.fmtKOFor'), t('guide.fmtKOTeams')],
                      [t('guide.fmtGP'), t('guide.fmtGPFor'), t('guide.fmtGPTeams')],
                    ].map((row, ri) => (
                      <tr key={ri} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        {row.map((cell, ci) => (
                          <td key={ci} style={{ padding: '0.75rem 1rem', color: ci === 0 ? '#e0e8f4' : '#8892a4' }}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* ── Section 4: Vietas un laukumi ─────────────────────── */}
            <section id="vietas" style={sectionStyle}>
              <SectionHeading id="s4" number="4" title={t('guide.s4Title')} />
              <p style={bodyText}>{t('guide.s4Body')}</p>

              <MockCard>
                <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '1rem' }}>
                  {t('guide.mockVenueHeading')}
                </p>
                <MockField label={t('guide.mockVenueName')} placeholder={t('guide.mockVenueNamePH')} />
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  {[t('guide.mockPitchA'), t('guide.mockPitchB')].map((p, i) => (
                    <div key={i} style={{
                      flex: 1, background: '#0d1b2e', border: '1px solid #1e3a5f',
                      borderRadius: '6px', padding: '0.5rem 0.75rem',
                      fontSize: '0.8125rem', color: '#8892a4', textAlign: 'center',
                    }}>
                      {p}
                    </div>
                  ))}
                </div>
              </MockCard>

              <TipBox>{t('guide.s4Tip')}</TipBox>
            </section>

            {/* ── Section 5: Komandu pārvaldība ────────────────────── */}
            <section id="komandas" style={sectionStyle}>
              <SectionHeading id="s5" number="5" title={t('guide.s5Title')} />

              <div className="guide-methods-grid">
                {[
                  { label: 'A', title: t('guide.s5MethodA'), desc: t('guide.s5MethodADesc') },
                  { label: 'B', title: t('guide.s5MethodB'), desc: t('guide.s5MethodBDesc') },
                ].map((m) => (
                  <div key={m.label} style={{
                    background: '#111e35',
                    border: '1px solid #1e3a5f',
                    borderRadius: '10px',
                    padding: '1.25rem',
                  }}>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '28px', height: '28px',
                      background: 'rgba(240,165,0,0.15)',
                      border: '1px solid rgba(240,165,0,0.3)',
                      borderRadius: '6px',
                      color: '#f0a500',
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      marginBottom: '0.75rem',
                    }}>
                      {m.label}
                    </div>
                    <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.125rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>{m.title}</h3>
                    <p style={{ color: '#8892a4', fontSize: '0.875rem', lineHeight: 1.65 }}>{m.desc}</p>
                  </div>
                ))}
              </div>

              <RegistrationFlowDiagram t={t} />
              <TipBox>{t('guide.s5Tip')}</TipBox>
            </section>

            {/* ── Section 6: Spēļu grafiks ─────────────────────────── */}
            <section id="grafiks" style={sectionStyle}>
              <SectionHeading id="s6" number="6" title={t('guide.s6Title')} />
              <p style={bodyText}>{t('guide.s6Intro')}</p>

              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem', margin: '1.25rem 0' }}>
                {[
                  t('guide.s6f1'),
                  t('guide.s6f2'),
                  t('guide.s6f3'),
                  t('guide.s6f4'),
                  t('guide.s6f5'),
                ].map((item, i) => (
                  <li key={i} style={{ display: 'flex', gap: '0.625rem', alignItems: 'flex-start', color: '#c8d4e0', fontSize: '0.9rem', lineHeight: 1.55 }}>
                    <CheckCircle size={15} style={{ color: '#f0a500', flexShrink: 0, marginTop: '3px' }} />
                    {item}
                  </li>
                ))}
              </ul>

              <MockCard>
                <p style={{ fontSize: '0.72rem', fontWeight: 600, color: '#3a506b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
                  {t('guide.mockScheduleHeading')}
                </p>
                <MockScheduleRow time="09:00" pitch="Laukums 1" home="Komanda A" away="Komanda B" completed />
                <MockScheduleRow time="09:20" pitch="Laukums 1" home="Komanda C" away="Komanda D" />
                <MockScheduleRow time="09:00" pitch="Laukums 2" home="Komanda E" away="Komanda F" />
                <MockScheduleRow time="09:20" pitch="Laukums 2" home="Komanda G" away="Komanda H" />
              </MockCard>

              <TipBox variant="warning">{t('guide.s6Warning')}</TipBox>
            </section>

            {/* ── Section 7: Spēļu diena ───────────────────────────── */}
            <section id="spelu-diena" style={sectionStyle}>
              <SectionHeading id="s7" number="7" title={t('guide.s7Title')} />
              <p style={bodyText}>{t('guide.s7Body')}</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', margin: '1.25rem 0' }}>
                {[
                  t('guide.s7step1'),
                  t('guide.s7step2'),
                  t('guide.s7step3'),
                  t('guide.s7step4'),
                ].map((step, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.875rem', alignItems: 'flex-start' }}>
                    <div style={{
                      width: '26px', height: '26px', flexShrink: 0,
                      background: 'rgba(240,165,0,0.15)',
                      border: '1px solid rgba(240,165,0,0.3)',
                      borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontWeight: 700, fontSize: '0.875rem', color: '#f0a500',
                      marginTop: '1px',
                    }}>
                      {i + 1}
                    </div>
                    <p style={{ color: '#c8d4e0', fontSize: '0.9rem', lineHeight: 1.6, margin: 0, paddingTop: '2px' }}>{step}</p>
                  </div>
                ))}
              </div>

              {/* Mobile matchday card mockup */}
              <MockCard style={{ maxWidth: '320px' }}>
                <p style={{ fontSize: '0.72rem', fontWeight: 600, color: '#3a506b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.875rem' }}>
                  {t('guide.mockMatchdayLabel')}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div style={{ flex: 1, textAlign: 'right' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#e0e8f4' }}>Komanda A</div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.375rem' }}>
                    {['−', '2', '+'].map((c, i) => (
                      <div key={i} style={{
                        width: '32px', height: '32px',
                        background: i === 1 ? '#f0a500' : '#0d1b2e',
                        color: i === 1 ? '#0a1628' : '#8892a4',
                        border: '1px solid #1e3a5f',
                        borderRadius: '6px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: '0.875rem',
                      }}>
                        {c}
                      </div>
                    ))}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#e0e8f4' }}>Komanda B</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.375rem' }}>
                  {['−', '1', '+'].map((c, i) => (
                    <div key={i} style={{
                      width: '32px', height: '32px',
                      background: i === 1 ? '#f0a500' : '#0d1b2e',
                      color: i === 1 ? '#0a1628' : '#8892a4',
                      border: '1px solid #1e3a5f',
                      borderRadius: '6px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: '0.875rem',
                      marginLeft: i === 0 ? 'auto' : 0,
                    }}>
                      {c}
                    </div>
                  ))}
                  <div style={{ flex: 1 }} />
                </div>
              </MockCard>

              <TipBox>{t('guide.s7Tip')}</TipBox>
            </section>

            {/* ── Section 8: Publiskā lapa ─────────────────────────── */}
            <section id="publiska-lapa" style={sectionStyle}>
              <SectionHeading id="s8" number="8" title={t('guide.s8Title')} />
              <p style={bodyText}>{t('guide.s8Body')}</p>

              <div style={{
                background: '#111e35',
                border: '1px solid rgba(240,165,0,0.2)',
                borderRadius: '8px',
                padding: '0.75rem 1.125rem',
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: '1.0625rem',
                color: '#f0a500',
                letterSpacing: '0.01em',
                marginBottom: '1.25rem',
                wordBreak: 'break-all',
              }}>
                fixturday.com/t/<span style={{ color: '#8892a4' }}>tavs-turnira-nosaukums</span>
              </div>

              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
                {[t('guide.s8f1'), t('guide.s8f2'), t('guide.s8f3'), t('guide.s8f4')].map((item, i) => (
                  <li key={i} style={{ display: 'flex', gap: '0.625rem', alignItems: 'flex-start', color: '#c8d4e0', fontSize: '0.9rem', lineHeight: 1.55 }}>
                    <CheckCircle size={15} style={{ color: '#f0a500', flexShrink: 0, marginTop: '3px' }} />
                    {item}
                  </li>
                ))}
              </ul>

              <TipBox>{t('guide.s8Tip')}</TipBox>
            </section>

            {/* ── CTA ───────────────────────────────────────────────── */}
            <section style={{
              marginTop: '3rem',
              background: 'linear-gradient(135deg, #0d1b2e 0%, #111e35 100%)',
              border: '1px solid rgba(240,165,0,0.15)',
              borderRadius: '16px',
              padding: '2.5rem 2rem',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                background: 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(240,165,0,0.06) 0%, transparent 70%)',
              }} />
              <h2 style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 'clamp(1.75rem, 4vw, 2.25rem)',
                fontWeight: 700,
                color: '#ffffff',
                marginBottom: '1.5rem',
                position: 'relative',
              }}>
                {t('guide.ctaTitle')}
              </h2>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap', position: 'relative' }}>
                <Link to="/admin/register" style={ctaPrimaryBtn}>{t('guide.ctaPrimary')}</Link>
                <Link to="/turniri" style={ctaSecondaryBtn}>{t('guide.ctaSecondary')}</Link>
              </div>
            </section>

            {/* ── FAQ ───────────────────────────────────────────────── */}
            <section id="biezak-uzdotie-jautajumi" style={{ marginTop: '3.5rem' }}>
              <h2 style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 'clamp(1.6rem, 3vw, 2rem)',
                fontWeight: 700,
                color: '#ffffff',
                marginBottom: '1.5rem',
              }}>
                {t('guide.faqTitle')}
              </h2>
              {FAQ_ITEMS.map((item, i) => (
                <FAQItem key={i} question={item.q} answer={item.a} />
              ))}
            </section>

          </main>
        </div>
      </div>

      <Footer />

      <style>{`
        .guide-layout {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0;
        }
        .guide-toc {
          display: none;
        }
        .guide-methods-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
          margin-top: 1.25rem;
        }
        @media (min-width: 900px) {
          .guide-layout {
            grid-template-columns: 200px 1fr;
            gap: 3rem;
            align-items: start;
          }
          .guide-toc {
            display: block;
            position: sticky;
            top: 80px;
          }
          .guide-methods-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>
    </div>
  )
}

const sectionStyle = {
  paddingBottom: '3rem',
  borderBottom: '1px solid rgba(255,255,255,0.05)',
  marginBottom: '3rem',
}

const bodyText = {
  color: '#8892a4',
  lineHeight: 1.75,
  fontSize: '0.9375rem',
  marginBottom: '0.5rem',
}

const ctaPrimaryBtn = {
  display: 'inline-block',
  background: '#f0a500',
  color: '#0a1628',
  borderRadius: '8px',
  padding: '0.8rem 1.75rem',
  fontWeight: 700,
  fontSize: '0.9375rem',
  textDecoration: 'none',
}

const ctaSecondaryBtn = {
  display: 'inline-block',
  background: 'transparent',
  color: '#e0e8f4',
  border: '1px solid rgba(255,255,255,0.2)',
  borderRadius: '8px',
  padding: '0.8rem 1.75rem',
  fontWeight: 500,
  fontSize: '0.9375rem',
  textDecoration: 'none',
}
