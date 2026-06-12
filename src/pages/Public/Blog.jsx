import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Calendar, Clock, ArrowRight } from 'lucide-react'
import PublicNav from '../../components/PublicNav'
import Footer from '../../components/Footer'
import { useSEO } from '../../hooks/useSEO'
import { posts } from '../../content/blog/index'

export default function Blog() {
  const { t } = useTranslation()

  useSEO({
    title: 'Blog — Tournament Management Tips & Guides',
    description: 'Practical guides on organizing sports tournaments: format selection, scheduling, standings, match day tips, and more. Free resources for tournament organizers.',
    path: '/blog',
  })

  return (
    <div style={{ background: 'var(--color-bg)', color: 'var(--color-text)', minHeight: '100vh' }}>
      <PublicNav />

      <main style={{ maxWidth: 860, margin: '0 auto', padding: '3.5rem 1.25rem 4rem' }}>
        <header style={{ marginBottom: '3rem' }}>
          <p style={{ color: 'var(--color-accent)', fontFamily: 'var(--font-heading)', fontSize: '0.8rem', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            Blog
          </p>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 700, margin: 0 }}>
            Tournament Organization Guides
          </h1>
          <p style={{ color: 'var(--color-text-muted)', marginTop: '0.75rem', maxWidth: 560, lineHeight: 1.6 }}>
            Practical articles for coaches, club secretaries, and organizers who want to run better tournaments.
          </p>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {posts.map(post => (
            <article
              key={post.slug}
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                padding: 'clamp(1.25rem, 4vw, 1.75rem) clamp(1rem, 4vw, 2rem)',
                transition: 'border-color var(--transition-fast), transform var(--transition-fast)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--color-accent)'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--color-border)'
                e.currentTarget.style.transform = 'none'
              }}
            >
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                {post.tags.slice(0, 2).map(tag => (
                  <span key={tag} style={{
                    fontSize: '0.75rem',
                    fontFamily: 'var(--font-heading)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'var(--color-accent)',
                    background: 'rgba(240,165,0,0.1)',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '999px',
                  }}>
                    {tag}
                  </span>
                ))}
              </div>

              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', fontWeight: 700, margin: '0 0 0.6rem', lineHeight: 1.3 }}>
                <Link
                  to={`/blog/${post.slug}`}
                  style={{ color: 'var(--color-text)', textDecoration: 'none' }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-accent)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-text)' }}
                >
                  {post.title}
                </Link>
              </h2>

              <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.65, margin: '0 0 1.25rem', fontSize: '0.95rem' }}>
                {post.description}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '1.25rem', color: 'var(--color-text-muted)', fontSize: '0.825rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Calendar size={13} />
                    {new Date(post.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Clock size={13} />
                    {post.readTime}
                  </span>
                </div>
                <Link
                  to={`/blog/${post.slug}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.35rem',
                    color: 'var(--color-accent)', fontSize: '0.875rem', fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  Read article <ArrowRight size={14} />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  )
}
