import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, CheckCircle, ArrowRight } from 'lucide-react'
import PublicNav from './PublicNav'
import Footer from './Footer'
import { useSEO } from '../hooks/useSEO'

/**
 * Reusable template for sport/feature-specific service landing pages.
 *
 * @param {string}   seoTitle
 * @param {string}   seoDescription
 * @param {string}   path              Canonical path e.g. "/football-tournament-software"
 * @param {string}   eyebrow           Small label above H1, e.g. "Football"
 * @param {string}   headline          H1 text — should contain primary keyword
 * @param {string}   subheadline       Paragraph below H1
 * @param {Array}    features          [{icon, title, desc}]
 * @param {Array}    steps             [{n, title, desc}]
 * @param {Array}    benefits          string[] — bullet list for the CTA area
 * @param {Array}    faqs              [{q, a}]
 * @param {string}   [relatedPost]     Slug of a relevant blog post
 * @param {string}   [relatedPostTitle]
 */
export default function ServiceLanding({
  seoTitle,
  seoDescription,
  path,
  eyebrow,
  headline,
  subheadline,
  features = [],
  steps = [],
  benefits = [],
  faqs = [],
  relatedPost,
  relatedPostTitle,
}) {
  useSEO({ title: seoTitle, description: seoDescription, path, noSuffix: true })

  useEffect(() => {
    if (!faqs.length) return
    const id = 'faq-ld'
    let el = document.getElementById(id)
    if (!el) {
      el = document.createElement('script')
      el.id = id
      el.type = 'application/ld+json'
      document.head.appendChild(el)
    }
    el.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map(({ q, a }) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: a },
      })),
    })
    return () => { document.getElementById(id)?.remove() }
  }, [faqs])

  return (
    <div style={{ background: 'var(--color-bg)', color: 'var(--color-text)', overflowX: 'hidden' }}>
      <PublicNav />
      <main>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section style={{
        padding: 'clamp(3.5rem, 8vw, 7rem) 1.25rem clamp(3rem, 6vw, 5rem)',
        textAlign: 'center',
        borderBottom: '1px solid var(--color-border)',
        background: 'linear-gradient(180deg, rgba(240,165,0,0.04) 0%, transparent 100%)',
      }}>
        <p style={{
          color: 'var(--color-accent)',
          fontFamily: 'var(--font-heading)',
          fontSize: '0.8rem',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          marginBottom: '0.75rem',
        }}>
          {eyebrow}
        </p>
        <h1 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'clamp(2rem, 5vw, 3.25rem)',
          fontWeight: 700,
          lineHeight: 1.15,
          maxWidth: 760,
          margin: '0 auto 1.25rem',
        }}>
          {headline}
        </h1>
        <p style={{
          color: 'var(--color-text-muted)',
          fontSize: 'clamp(1rem, 2vw, 1.2rem)',
          lineHeight: 1.65,
          maxWidth: 600,
          margin: '0 auto 2.25rem',
        }}>
          {subheadline}
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            to="/admin/register"
            style={{
              background: 'var(--color-accent)',
              color: '#0a0f1e',
              padding: '0.875rem 2rem',
              borderRadius: 'var(--radius)',
              fontFamily: 'var(--font-heading)',
              fontWeight: 700,
              fontSize: '1rem',
              textDecoration: 'none',
              letterSpacing: '0.04em',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'background var(--transition-fast)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-accent-hover)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-accent)' }}
          >
            Start free <ArrowRight size={16} />
          </Link>
          <Link
            to="/tournaments"
            style={{
              border: '1px solid var(--color-border)',
              color: 'var(--color-text)',
              padding: '0.875rem 1.75rem',
              borderRadius: 'var(--radius)',
              fontFamily: 'var(--font-heading)',
              fontWeight: 600,
              fontSize: '1rem',
              textDecoration: 'none',
              transition: 'border-color var(--transition-fast)',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-accent)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)' }}
          >
            See live tournaments
          </Link>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────── */}
      {features.length > 0 && (
        <section style={{ padding: '4rem 1.25rem', background: 'var(--color-surface)' }}>
          <div style={{ maxWidth: 1040, margin: '0 auto' }}>
            <h2 style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(1.4rem, 3vw, 2rem)',
              fontWeight: 700,
              textAlign: 'center',
              marginBottom: '2.5rem',
            }}>
              Everything you need to run the tournament
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '1.5rem',
            }}>
              {features.map((f, i) => (
                <div key={i} style={{
                  background: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.75rem',
                  transition: 'border-color var(--transition-fast)',
                  cursor: 'default',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-accent)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)' }}
                >
                  <div style={{
                    width: 48, height: 48,
                    background: 'rgba(240,165,0,0.12)',
                    borderRadius: 10,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--color-accent)',
                    marginBottom: '1rem',
                  }}>
                    {f.icon}
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                    {f.title}
                  </h3>
                  <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.6, fontSize: '0.9rem', margin: 0 }}>
                    {f.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── How it works ──────────────────────────────────────── */}
      {steps.length > 0 && (
        <section style={{ padding: '4rem 1.25rem' }}>
          <div style={{ maxWidth: 780, margin: '0 auto' }}>
            <h2 style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(1.4rem, 3vw, 2rem)',
              fontWeight: 700,
              textAlign: 'center',
              marginBottom: '2.5rem',
            }}>
              Up and running in 3 steps
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {steps.map((s, i) => (
                <div key={i} style={{
                  display: 'flex',
                  gap: '1.5rem',
                  padding: '1.75rem 0',
                  borderBottom: i < steps.length - 1 ? '1px solid var(--color-border)' : 'none',
                }}>
                  <div style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '2rem',
                    fontWeight: 700,
                    color: 'var(--color-accent)',
                    opacity: 0.35,
                    lineHeight: 1,
                    flexShrink: 0,
                    width: 44,
                    textAlign: 'center',
                    paddingTop: 4,
                  }}>
                    {s.n}
                  </div>
                  <div>
                    <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                      {s.title}
                    </h3>
                    <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.65, margin: 0, fontSize: '0.95rem' }}>
                      {s.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA with benefits ─────────────────────────────────── */}
      <section style={{
        padding: '4rem 1.25rem',
        background: 'var(--color-surface)',
        borderTop: '1px solid var(--color-border)',
        borderBottom: '1px solid var(--color-border)',
      }}>
        <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(1.4rem, 3vw, 2rem)',
            fontWeight: 700,
            marginBottom: '1.5rem',
          }}>
            Free. No sign-up required to browse.
          </h2>
          {benefits.length > 0 && (
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem', display: 'inline-block', textAlign: 'left' }}>
              {benefits.map((b, i) => (
                <li key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: '0.65rem',
                  marginBottom: '0.65rem', color: 'var(--color-text-muted)',
                  fontSize: '0.95rem', lineHeight: 1.5,
                }}>
                  <CheckCircle size={16} style={{ color: 'var(--color-accent)', flexShrink: 0, marginTop: 2 }} />
                  {b}
                </li>
              ))}
            </ul>
          )}
          <Link
            to="/admin/register"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              background: 'var(--color-accent)', color: '#0a0f1e',
              padding: '0.875rem 2rem', borderRadius: 'var(--radius)',
              fontFamily: 'var(--font-heading)', fontWeight: 700,
              fontSize: '1rem', textDecoration: 'none',
              transition: 'background var(--transition-fast)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-accent-hover)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-accent)' }}
          >
            Create your tournament <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────── */}
      {faqs.length > 0 && (
        <section style={{ padding: '4rem 1.25rem' }}>
          <div style={{ maxWidth: 720, margin: '0 auto' }}>
            <h2 style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(1.4rem, 3vw, 2rem)',
              fontWeight: 700,
              textAlign: 'center',
              marginBottom: '2rem',
            }}>
              Frequently asked questions
            </h2>
            {faqs.map((faq, i) => (
              <FaqItem key={i} q={faq.q} a={faq.a} />
            ))}
          </div>
        </section>
      )}

      {/* ── Related reading ───────────────────────────────────── */}
      {relatedPost && (
        <section style={{
          padding: '2.5rem 1.25rem 3.5rem',
          borderTop: '1px solid var(--color-border)',
          textAlign: 'center',
        }}>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
            Further reading
          </p>
          <Link
            to={`/blog/${relatedPost}`}
            style={{
              color: 'var(--color-accent)', fontWeight: 600, fontSize: '1rem',
              textDecoration: 'underline', textDecorationColor: 'rgba(240,165,0,0.35)',
              textUnderlineOffset: 3,
            }}
          >
            {relatedPostTitle}
          </Link>
        </section>
      )}

      </main>
      <Footer />
    </div>
  )
}

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{
      borderBottom: '1px solid var(--color-border)',
      padding: '0',
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', textAlign: 'left',
          background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          gap: '1rem', padding: '1.25rem 0',
          color: 'var(--color-text)',
          fontFamily: 'var(--font-heading)',
          fontWeight: 600, fontSize: '1.05rem',
        }}
        aria-expanded={open}
      >
        {q}
        <ChevronDown
          size={18}
          style={{
            flexShrink: 0,
            color: 'var(--color-accent)',
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform var(--transition-fast)',
          }}
        />
      </button>
      {open && (
        <p style={{
          color: 'var(--color-text-muted)', lineHeight: 1.7,
          margin: '0 0 1.25rem', fontSize: '0.95rem',
        }}>
          {a}
        </p>
      )}
    </div>
  )
}
